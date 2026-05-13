import { supabase } from '../utils/supabase.ts';
import { activeUser, STORES } from './state.ts';
import { showToast } from './ui.ts';

export async function renderUsersTable() {
    if (!activeUser?.admin) return;
    const grid = document.getElementById('users-grid');
    if (!grid) return;

    grid.innerHTML = '<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-primary font-black animate-pulse text-lg">جاري تحميل قائمة المستخدمين...</div>';

    const { data: usersList, error } = await supabase.from('users').select('*');

    if (error) {
        console.error(error);
        grid.innerHTML = '<div class="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 text-rose-500 font-black text-lg">فشل تحميل البيانات</div>';
        showToast('فشل تحميل قائمة المستخدمين', 'error');
        return;
    }

    grid.innerHTML = '';
    usersList.forEach((u, index) => {
        const storesText = u.permissions.stores.map((s: string) => STORES[s]).join('، ') || 'لا يوجد';
        const card = document.createElement('div');
        card.className = 'glass-panel rounded-[2rem] p-8 flex flex-col gap-8 animate-slide-up hover-lift border-white/60 bg-white/40 relative overflow-hidden group';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            ${u.admin ? `
                <div class="absolute top-0 right-0 bg-primary text-white text-[0.65rem] font-black px-4 py-1.5 rounded-bl-2xl shadow-lg uppercase tracking-widest">
                    Admin
                </div>
            ` : ''}

            <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                    ${u.username.charAt(0).toUpperCase()}
                </div>
                <div class="flex flex-col min-w-0">
                    <span class="font-black text-slate-800 text-lg truncate">${u.username}</span>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${u.admin ? 'مسؤول النظام' : 'مستخدم'}</span>
                </div>
            </div>
            
            <div class="space-y-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400 font-black uppercase tracking-widest">الصلاحيات</span>
                    <span class="font-black ${u.permissions.canUpload ? 'text-emerald-500' : 'text-slate-300'}">
                        ${u.permissions.canUpload ? 'رفع الملفات ✓' : 'عرض فقط'}
                    </span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">المتاجر المتاحة</span>
                    <span class="text-sm text-slate-700 font-bold leading-relaxed line-clamp-2">${storesText}</span>
                </div>
            </div>

            <div class="flex gap-3 mt-auto">
                <button class="edit-user-btn flex-1 bg-white border border-slate-200 text-slate-700 font-black py-3 rounded-xl transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm text-sm" data-id="${u.id}">
                    تعديل
                </button>
                <button class="delete-user-btn flex-1 bg-rose-50 border border-rose-100 text-rose-600 font-black py-3 rounded-xl transition-all hover:bg-rose-500 hover:text-white active:scale-95 shadow-sm text-sm" data-id="${u.id}">
                    حذف
                </button>
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
    const emailGroup = document.getElementById('modal-email-group');
    const passwordInput = document.getElementById('modal-password') as HTMLInputElement;
    const passwordGroup = document.getElementById('modal-password-group');
    const modal = document.getElementById('user-modal');

    if (!title || !usernameInput || !passwordInput || !modal) return;

    title.textContent = 'إضافة مستخدم جديد';
    usernameInput.value = '';
    usernameInput.disabled = false;

    if (emailGroup) emailGroup.style.display = 'block';

    passwordInput.value = '';
    passwordInput.placeholder = 'أدخل كلمة مرور قوية...';
    if (passwordGroup) passwordGroup.style.display = 'block';

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
    const usernameInput = document.getElementById('modal-username') as HTMLInputElement;
    const username = usernameInput.value.trim();
    const password = (document.getElementById('modal-password') as HTMLInputElement).value;

    if (!username) return showToast('يرجى إدخال اسم المستخدم', 'error');

    const permissions = {
        canUpload: (document.getElementById('perm-upload') as HTMLInputElement).checked,
        stores: Array.from(document.querySelectorAll('.perm-store:checked')).map((cb: any) => cb.value)
    };
    const isAdmin = (document.getElementById('perm-admin') as HTMLInputElement).checked;

    const title = document.getElementById('modal-title')?.textContent;
    const isEdit = title === 'تعديل بيانات المستخدم';

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
            showToast('تم تحديث بيانات المستخدم بنجاح', 'success');
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
    const emailGroup = document.getElementById('modal-email-group');
    const passwordGroup = document.getElementById('modal-password-group');
    const passwordInput = document.getElementById('modal-password') as HTMLInputElement;
    const modal = document.getElementById('user-modal');

    if (!title || !usernameInput || !passwordInput || !modal) return;

    title.textContent = 'تعديل بيانات المستخدم';
    usernameInput.value = u.username;
    usernameInput.disabled = true; // Don't allow changing username on edit
    
    if (emailGroup) emailGroup.style.display = 'none';
    if (passwordGroup) passwordGroup.style.display = 'block';
    
    passwordInput.value = '';
    passwordInput.placeholder = 'اتركه فارغاً لعدم التغيير';
    
    (document.getElementById('perm-upload') as HTMLInputElement).checked = u.permissions.canUpload;
    (document.getElementById('perm-admin') as HTMLInputElement).checked = u.admin;
    
    document.querySelectorAll('.perm-store').forEach((cb: any) => {
        cb.checked = u.permissions.stores.includes(cb.value);
    });
    
    modal.style.display = 'flex';
}
