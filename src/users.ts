import { supabase } from '../utils/supabase.ts';
import { activeUser, STORES } from './state.ts';
import { showToast } from './ui.ts';

export async function renderUsersTable() {
    if (!activeUser?.admin) return;
    const grid = document.getElementById('users-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 text-indigo-500 font-bold animate-pulse text-lg">جاري تحميل قائمة المستخدمين...</div>';

    const { data: usersList, error } = await supabase.from('users').select('*');

    if (error) {
        console.error(error);
        grid.innerHTML = '<div class="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 text-rose-500 font-bold text-lg">فشل تحميل البيانات</div>';
        showToast('فشل تحميل قائمة المستخدمين', 'error');
        return;
    }

    grid.innerHTML = '';
    usersList.forEach((u) => {
        const storesText = u.permissions.stores.map((s: string) => STORES[s]).join('، ') || 'لا يوجد';
        const card = document.createElement('div');
        card.className = 'flex flex-col bg-white/70 backdrop-blur-md border border-[var(--border)] rounded-2xl p-5 shadow-sm transition-all hover:bg-white hover:-translate-y-1 hover:shadow-md gap-4 relative overflow-hidden';
        card.innerHTML = `
            ${u.admin ? '<div class="absolute top-0 right-0 bg-indigo-500 text-white text-[0.7rem] font-bold px-3 py-1 rounded-bl-xl">مسؤول</div>' : ''}
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">
                    ${u.username.charAt(0).toUpperCase()}
                </div>
                <div class="flex flex-col">
                    <span class="font-extrabold text-slate-800 text-lg">${u.username}</span>
                    <span class="text-sm text-slate-500 font-semibold">${u.admin ? 'مسؤول النظام' : 'مستخدم عادي'}</span>
                </div>
            </div>
            
            <div class="flex flex-col gap-2 mt-2 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500 font-bold">رفع الملفات:</span>
                    <span class="font-bold ${u.permissions.canUpload ? 'text-emerald-500' : 'text-rose-400'}">${u.permissions.canUpload ? 'مسموح ✅' : 'غير مسموح ❌'}</span>
                </div>
                <div class="flex justify-between items-start text-sm">
                    <span class="text-slate-500 font-bold shrink-0">المتاجر:</span>
                    <span class="text-slate-700 font-semibold text-left leading-relaxed">${storesText}</span>
                </div>
            </div>

            <div class="flex gap-2 mt-auto pt-2">
                <button class="edit-user-btn flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-all hover:bg-slate-50 active:scale-95 shadow-sm" data-id="${u.id}">تعديل</button>
                <button class="delete-user-btn flex-1 bg-rose-50 border border-rose-100 text-rose-600 font-bold py-2 rounded-xl transition-all hover:bg-rose-100 active:scale-95 shadow-sm" data-id="${u.id}">حذف</button>
            </div>
        `;
        grid.appendChild(card);
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
