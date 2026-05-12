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
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="text-emerald-500 text-[1.2rem]">●</span>
                <span class="text-slate-800 font-extrabold">متصل بـ ${STORES[storeId]}</span>
                <span class="text-[0.8rem] text-slate-500 bg-indigo-500/10 px-2 py-0.5 rounded-[10px] mr-1">${up.count} منتج</span>
            </div>
            <span class="text-[0.85rem] text-slate-400 mt-1 block">تحديث: ${up.last_upload_time}</span>
        `;
    } else {
        statusBanner.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="text-rose-500 text-[1.2rem]">●</span>
                <span class="text-slate-800 font-extrabold">لا توجد بيانات لـ ${STORES[storeId]}</span>
            </div>
            <span class="text-[0.85rem] text-rose-500 bg-rose-50 px-2 py-0.5 rounded-[10px] mt-1 inline-block">يرجى رفع ملف الأسعار</span>
        `;
    }

    const hasAccess = activeUser.permissions.stores.includes(storeId) || activeUser.admin;
    if (!hasAccess) {
        statusBanner.innerHTML = `<span class="text-rose-500 font-bold">⚠️ ليس لديك صلاحية عرض أسعار ${STORES[storeId]}</span>`;
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
        noResults.innerHTML = getEmptyStateHTML('عذراً، المنتج غير موجود في هذا المتجر');
        noResults.style.display = 'block';
    }
}

function renderResults(products: any[], container: HTMLElement) {
    container.innerHTML = '';
    products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'flex flex-row justify-between items-center bg-white/60 backdrop-blur-md rounded-[clamp(12px,4vw,20px)] p-[clamp(15px,4vw,20px)] border border-white shadow-[0_4px_15px_rgb(0,0,0,0.03)] gap-[15px] transition-all hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] active:scale-[0.98]';
        div.innerHTML = `
            <div class="flex flex-col gap-1.5 flex-1 text-right">
                <div class="text-[clamp(1.1rem,4vw,1.3rem)] font-extrabold text-slate-800 leading-tight">${p.name}</div>
            </div>
            <div class="flex flex-col items-end gap-1 min-w-fit">
                <div class="text-[clamp(1.2rem,4.5vw,1.5rem)] font-black text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-xl whitespace-nowrap">
                    <span class="text-[0.7rem] ml-1 text-indigo-400 font-bold uppercase tracking-wider">د.ل</span>${p.price.toLocaleString()}
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

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (resultsList) resultsList.innerHTML = '';
    if (noResults) noResults.style.display = 'none';
}
