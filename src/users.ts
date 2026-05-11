import { supabase } from '../utils/supabase.ts';
import { activeUser, STORES } from './state.ts';
import { showToast } from './ui.ts';

export async function renderUsersTable() {
    if (!activeUser?.admin) return;
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center" class="py-4 text-indigo-500 font-bold animate-pulse">جاري تحميل قائمة المستخدمين...</td></tr>';

    const { data: usersList, error } = await supabase.from('users').select('*');

    if (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center" class="py-4 text-rose-500 font-bold">فشل تحميل البيانات</td></tr>';
        showToast('فشل تحميل قائمة المستخدمين', 'error');
        return;
    }

    tbody.innerHTML = '';
    usersList.forEach((u) => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 last:border-none';
        tr.innerHTML = `
            <td data-label="المستخدم" class="py-3 px-4 font-bold text-slate-800">${u.username} ${u.admin ? '<span class="text-indigo-500 text-[0.75rem] mr-2 bg-indigo-50 px-2 py-0.5 rounded-full">(مسؤول)</span>' : ''}</td>
            <td data-label="المتاجر المتاحة" class="py-3 px-4 text-slate-600">${u.permissions.stores.map((s: string) => STORES[s]).join('، ') || 'لا يوجد'}</td>
            <td data-label="رفع الملفات" class="py-3 px-4">${u.permissions.canUpload ? '✅' : '❌'}</td>
            <td data-label="إجراءات" class="py-3 px-4 text-left">
                <button class="edit-user-btn bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition-all hover:bg-slate-50 active:scale-95 shadow-sm" data-id="${u.id}">تعديل</button>
                <button class="delete-user-btn bg-rose-50 border border-rose-200 text-rose-600 font-bold px-4 py-2 rounded-xl transition-all hover:bg-rose-100 active:scale-95 shadow-sm mr-2" data-id="${u.id}">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.edit-user-btn').forEach((btn: any) => {
        btn.onclick = () => editUser(btn.dataset.id);
    });
    document.querySelectorAll('.delete-user-btn').forEach((btn: any) => {
        btn.onclick = () => deleteUser(btn.dataset.id);
    });
}

export async function deleteUser(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
        showToast('خطأ أثناء الحذف: ' + error.message, 'error');
    } else {
        showToast('تم حذف المستخدم بنجاح', 'success');
        await renderUsersTable();
    }
}

export function showUserModal() {
    const title = document.getElementById('modal-title');
    const usernameInput = document.getElementById('modal-username') as HTMLInputElement;
    const emailGroup = document.getElementById('modal-email')?.closest('.mb-\\[15px\\]') as HTMLElement;
    const passwordInput = document.getElementById('modal-password') as HTMLInputElement;
    const passwordGroup = document.getElementById('modal-password-group') as HTMLElement;
    const modal = document.getElementById('user-modal');

    if (!title || !usernameInput || !passwordInput || !passwordGroup || !modal) return;

    title.textContent = 'إضافة مستخدم';
    usernameInput.value = '';

    if (emailGroup) emailGroup.style.display = 'none';

    passwordInput.value = '';
    passwordInput.placeholder = '••••••••';
    passwordGroup.style.display = 'block';

    (document.getElementById('perm-upload') as HTMLInputElement).checked = false;
    (document.getElementById('perm-admin') as HTMLInputElement).checked = false;
    document.querySelectorAll('.perm-store').forEach((cb: any) => cb.checked = false);
    
    modal.style.display = 'flex';
}

export function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.style.display = 'none';
}

export async function saveUser() {
    const username = (document.getElementById('modal-username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('modal-password') as HTMLInputElement).value;

    if (!username) return showToast('يرجى إدخال اسم المستخدم', 'error');

    const permissions = {
        canUpload: (document.getElementById('perm-upload') as HTMLInputElement).checked,
        stores: Array.from(document.querySelectorAll('.perm-store:checked')).map((cb: any) => cb.value)
    };
    const isAdmin = (document.getElementById('perm-admin') as HTMLInputElement).checked;

    const title = document.getElementById('modal-title')?.textContent;
    const isEdit = title === 'تعديل مستخدم';

    if (isEdit) {
        const updateData: any = { permissions, admin: isAdmin };
        if (password) updateData.password = password; 

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('username', username);

        if (error) {
            showToast('خطأ: ' + error.message, 'error');
        } else {
            showToast('تم تعديل المستخدم بنجاح', 'success');
            await renderUsersTable();
            closeUserModal();
        }
    } else {
        if (!password) return showToast('يرجى إدخال كلمة المرور', 'error');

        const { error } = await supabase.from('users').insert([{
            username,
            password,
            permissions,
            admin: isAdmin
        }]);
        if (error) {
            showToast('خطأ في إنشاء المستخدم: ' + error.message, 'error');
        } else {
            showToast('تمت إضافة المستخدم بنجاح', 'success');
            await renderUsersTable();
            closeUserModal();
        }
    }
}

async function editUser(id: string) {
    const { data: u, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error || !u) return showToast('فشل في جلب بيانات المستخدم', 'error');

    const title = document.getElementById('modal-title');
    const usernameInput = document.getElementById('modal-username') as HTMLInputElement;
    const emailGroup = document.getElementById('modal-email')?.closest('.mb-\\[15px\\]') as HTMLElement;
    const passwordGroup = document.getElementById('modal-password-group') as HTMLElement;
    const passwordInput = document.getElementById('modal-password') as HTMLInputElement;
    const modal = document.getElementById('user-modal');

    if (!title || !usernameInput || !passwordGroup || !passwordInput || !modal) return;

    title.textContent = 'تعديل مستخدم';
    usernameInput.value = u.username;
    if (emailGroup) emailGroup.style.display = 'none';
    passwordGroup.style.display = 'block';
    passwordInput.value = '';
    passwordInput.placeholder = 'اتركه فارغاً لعدم التغيير';
    
    (document.getElementById('perm-upload') as HTMLInputElement).checked = u.permissions.canUpload;
    (document.getElementById('perm-admin') as HTMLInputElement).checked = u.admin;
    
    document.querySelectorAll('.perm-store').forEach((cb: any) => {
        cb.checked = u.permissions.stores.includes(cb.value);
    });
    
    modal.style.display = 'flex';
}
