import { supabase } from '../utils/supabase.ts';
import { activeUser, setActiveUser, STORES } from './state.ts';
import { showToast } from './ui.ts';
import { navigate } from './main.ts';

export async function handleLogin() {
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    const loginEmailInput = document.getElementById('login-email') as HTMLInputElement;
    const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
    const loginScreen = document.getElementById('login-screen') as HTMLDivElement;
    const mainContainer = document.getElementById('main-container') as HTMLDivElement;

    const username = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!username || !password) return showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');

    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري تسجيل الدخول...';

    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !profile) {
        showToast('بيانات الاعتماد غير صحيحة', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'تسجيل الدخول';
    } else {
        setActiveUser(profile);
        localStorage.setItem('activeUser', JSON.stringify(profile));
        
        loginScreen.style.display = 'none';
        mainContainer.style.display = 'flex';
        navigate();
    }
}

export function handleLogout() {
    const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
    const loginEmailInput = document.getElementById('login-email') as HTMLInputElement;
    const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
    const loginScreen = document.getElementById('login-screen') as HTMLDivElement;
    const mainContainer = document.getElementById('main-container') as HTMLDivElement;

    localStorage.removeItem('activeUser');
    setActiveUser(null);
    loginScreen.style.display = 'flex';
    mainContainer.style.display = 'none';
    loginBtn.disabled = false;
    loginBtn.textContent = 'تسجيل الدخول';
    loginEmailInput.value = '';
    loginPasswordInput.value = '';
    showToast('تم تسجيل الخروج بنجاح', 'success');
}

export function checkSession() {
    const loginScreen = document.getElementById('login-screen') as HTMLDivElement;
    const mainContainer = document.getElementById('main-container') as HTMLDivElement;

    const savedUser = localStorage.getItem('activeUser');
    if (savedUser) {
        setActiveUser(JSON.parse(savedUser));
        loginScreen.style.display = 'none';
        mainContainer.style.display = 'flex';
        navigate();
    }
}

export function updateUIForUser() {
    if (!activeUser) return;

    const activeUsernameDisplay = document.getElementById('active-username');
    const navUpload = document.getElementById('nav-upload');
    const navUsers = document.getElementById('nav-users');

    if (activeUsernameDisplay) {
        activeUsernameDisplay.textContent = activeUser.username + (activeUser.admin ? ' (مسؤول)' : '');
        activeUsernameDisplay.parentElement!.title = "اضغط لنسخ معرف المستخدم (ID)";
        activeUsernameDisplay.parentElement!.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(activeUser.id);
            showToast('تم نسخ معرف المستخدم (ID) بنجاح', 'success');
        };
    }

    if (navUpload) navUpload.style.display = activeUser.permissions.canUpload ? 'block' : 'none';
    if (navUsers) navUsers.style.display = activeUser.admin ? 'block' : 'none';

    // Store Selector Logic for Home Page
    const dropdownWrapper = document.getElementById('home-shop-dropdown-wrapper');
    const textWrapper = document.getElementById('home-shop-text-wrapper');
    const storeNameDisplay = document.getElementById('current-store-name');
    const shopSelect = document.getElementById('home-shop-select') as HTMLSelectElement;

    if (activeUser.admin) {
        if (dropdownWrapper) dropdownWrapper.classList.remove('hidden');
        if (textWrapper) textWrapper.classList.add('hidden');
    } else {
        if (dropdownWrapper) dropdownWrapper.classList.add('hidden');
        if (textWrapper) textWrapper.classList.remove('hidden');
        
        const userStore = activeUser.permissions.stores && activeUser.permissions.stores.length > 0 
            ? activeUser.permissions.stores[0] 
            : 'rawa';
        
        if (shopSelect) shopSelect.value = userStore;
        if (storeNameDisplay) storeNameDisplay.textContent = STORES[userStore] || 'غير محدد';
    }
}
