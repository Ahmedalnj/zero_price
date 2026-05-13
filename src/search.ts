import { supabase } from '../utils/supabase.ts';
import { activeUser, STORES } from './state.ts';
import { getSkeletonHTML, getEmptyStateHTML } from './ui.ts';

const storePricesCache: Record<string, any[]> = {};

export async function updateHomeStatus() {
    if (!activeUser) return;
    
    const statusBanner = document.getElementById('status-banner');
    const homeShopSelect = document.getElementById('home-shop-select') as HTMLSelectElement;
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const resultsList = document.getElementById('results-list');
    
    if (!statusBanner || !homeShopSelect || !searchInput || !resultsList) return;

    const storeId = homeShopSelect.value;
    
    let up = null;
    const cachedStoreInfo = localStorage.getItem('storeInfoCache_' + storeId);
    if (cachedStoreInfo) {
        try { up = JSON.parse(cachedStoreInfo); } catch (e) {}
    }

    if (navigator.onLine) {
        const { data: storeInfo, error } = await supabase.from('stores').select('*').eq('id', storeId).single();
        if (!error && storeInfo) {
            up = storeInfo;
            localStorage.setItem('storeInfoCache_' + storeId, JSON.stringify(storeInfo));
        }
    }

    if (up) {
        statusBanner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="relative">
                    <span class="flex h-3 w-3">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                </div>
                <div class="flex flex-col">
                    <span class="text-slate-800 font-black text-sm">متصل بـ ${STORES[storeId]}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[0.7rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">تحديث: ${up.last_upload_time}</span>
                        <span class="text-[0.7rem] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">${up.count.toLocaleString()} منتج</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        statusBanner.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                <div class="flex flex-col">
                    <span class="text-slate-800 font-black text-sm">لا توجد بيانات لـ ${STORES[storeId]}</span>
                    <span class="text-[0.7rem] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg mt-0.5">يرجى رفع ملف الأسعار</span>
                </div>
            </div>
        `;
    }

    const hasAccess = activeUser.permissions.stores.includes(storeId) || activeUser.admin;
    if (!hasAccess) {
        statusBanner.innerHTML = `
            <div class="flex items-center gap-3 bg-rose-50 border border-rose-100 p-3 rounded-2xl w-full">
                <span class="text-xl">⚠️</span>
                <span class="text-rose-600 font-black text-sm">ليس لديك صلاحية عرض أسعار ${STORES[storeId]}</span>
            </div>
        `;
        searchInput.disabled = true;
        resultsList.innerHTML = '';
    } else {
        searchInput.disabled = false;
        await loadStoreToCache(storeId);
    }
}

async function loadStoreToCache(storeId: string) {
    const resultsList = document.getElementById('results-list');
    if (!resultsList) return;
    
    const cachedData = localStorage.getItem('storePricesCache_' + storeId);
    if (cachedData) {
        try {
            storePricesCache[storeId] = JSON.parse(cachedData);
            resultsList.innerHTML = '';
        } catch (e) {}
    } else {
        resultsList.innerHTML = getSkeletonHTML(4);
    }
    
    if (navigator.onLine) {
        const { data, error } = await supabase.from('products').select('*').eq('store_id', storeId).limit(5000);
        if (!error && data) {
            storePricesCache[storeId] = data;
            localStorage.setItem('storePricesCache_' + storeId, JSON.stringify(data));
            resultsList.innerHTML = ''; 
        }
    }
}

export function handleSearchInput(e: Event) {
    const searchInput = e.target as HTMLInputElement;
    const val = searchInput.value.trim().toLowerCase();
    const homeShopSelect = document.getElementById('home-shop-select') as HTMLSelectElement;
    const store = homeShopSelect.value;
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');
    const clearBtn = document.getElementById('clear-btn');
    
    if (!resultsList || !noResults || !clearBtn) return;

    if (val.length < 2) {
        resultsList.innerHTML = '';
        clearBtn.style.display = 'none';
        noResults.innerHTML = '';
        noResults.style.display = 'none';
        return;
    }

    clearBtn.style.display = 'flex';

    const matches = (storePricesCache[store] || []).filter(p =>
        p.name.toLowerCase().includes(val)
    ).slice(0, 50);

    if (matches.length > 0) {
        renderResults(matches, resultsList);
        noResults.style.display = 'none';
    } else {
        resultsList.innerHTML = '';
        noResults.innerHTML = getEmptyStateHTML('جرب البحث بكلمات أخرى أو تأكد من اسم المنتج');
        noResults.style.display = 'block';
    }
}

function renderResults(products: any[], container: HTMLElement) {
    container.innerHTML = '';
    products.forEach((p, index) => {
        const div = document.createElement('div');
        div.className = 'glass-panel rounded-[1.5rem] p-6 sm:p-8 flex flex-row justify-between items-center gap-6 sm:gap-10 animate-slide-up hover-lift cursor-pointer border-white/60 bg-white/40';
        div.style.animationDelay = `${index * 0.05}s`;
        
        div.innerHTML = `
            <div class="flex flex-col gap-1 flex-1 text-right">
                <div class="text-sm font-black text-slate-400 uppercase tracking-widest mb-0.5">المنتج</div>
                <div class="text-[clamp(1.1rem,3vw,1.25rem)] font-black text-slate-800 leading-tight">${p.name}</div>
            </div>
            <div class="flex flex-col items-end gap-1 min-w-fit">
                <div class="text-sm font-black text-slate-400 uppercase tracking-widest mb-0.5">السعر</div>
                <div class="flex items-baseline gap-1.5 bg-primary/10 px-4 py-2 rounded-2xl">
                    <span class="text-[0.8rem] font-black text-primary/70">د.ل</span>
                    <span class="text-[clamp(1.25rem,4vw,1.5rem)] font-black text-primary">${p.price.toLocaleString()}</span>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

export function clearSearch() {
    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const clearBtn = document.getElementById('clear-btn');
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');

    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (resultsList) resultsList.innerHTML = '';
    if (noResults) noResults.style.display = 'none';
}
