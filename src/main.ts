import { activeUser } from './state.ts';
import { handleLogin, handleLogout, checkSession } from './auth.ts';
import { updateHomeStatus, handleSearchInput, clearSearch } from './search.ts';
import { handleFileUpload, renderUploadHistory } from './upload.ts';
import { renderUsersTable, showUserModal, closeUserModal, saveUser } from './users.ts';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA
registerSW({ immediate: true });

// Expose globals for any remaining inline onclicks in HTML
(window as any).handleLogout = handleLogout;
(window as any).showUserModal = showUserModal;
(window as any).closeUserModal = closeUserModal;
(window as any).saveUser = saveUser;

export function navigate() {
    if (!activeUser) return;
    const hash = window.location.hash || '#home';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetPage = document.querySelector(hash);
    if (targetPage) {
        targetPage.classList.add('active');
        const navItem = document.getElementById('nav-' + hash.substring(1));
        if (navItem) navItem.classList.add('active');
    }

    if (hash === '#users') renderUsersTable();
    if (hash === '#upload') renderUploadHistory();
    if (hash === '#home') updateHomeStatus();
}

window.addEventListener('DOMContentLoaded', () => {
    // Bind Auth Events
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) loginBtn.onclick = handleLogin;

    // Bind Search Events
    const homeShopSelect = document.getElementById('home-shop-select') as HTMLSelectElement;
    if (homeShopSelect) {
        homeShopSelect.onchange = async () => {
            await updateHomeStatus();
            clearSearch();
        };
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.oninput = handleSearchInput;

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.onclick = clearSearch;

    // Bind Upload Events
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    // Init routing
    window.onhashchange = navigate;

    // Check existing session
    checkSession();

    // Setup network status listeners
    const offlineBanner = document.getElementById('offline-banner');
    function updateNetworkStatus() {
        if (navigator.onLine) {
            if (offlineBanner) offlineBanner.style.display = 'none';
        } else {
            if (offlineBanner) offlineBanner.style.display = 'block';
        }
    }
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    updateNetworkStatus(); // Initial check
});
