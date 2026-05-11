import { supabase } from '../utils/supabase.ts';
import { activeUser, STORES } from './state.ts';
import { showToast } from './ui.ts';

declare const XLSX: any;

export function handleFileUpload(e: Event) {
    if (!activeUser?.permissions.canUpload) return showToast('ليس لديك صلاحية الرفع', 'error');

    const fileInput = e.target as HTMLInputElement;
    const uploadShopSelect = document.getElementById('upload-shop-select') as HTMLSelectElement;
    const uploadStatus = document.getElementById('upload-status');
    const uploadProgressContainer = document.getElementById('upload-progress');
    const uploadProgressBar = document.getElementById('progress-bar');
    
    if (!uploadStatus || !uploadProgressContainer || !uploadProgressBar || !fileInput) return;

    const file = fileInput.files?.[0];
    const targetStore = uploadShopSelect.value;
    if (!file) return;

    uploadStatus.innerHTML = '<span class="text-indigo-500 font-bold animate-pulse">جاري معالجة الملف...</span>';
    const reader = new FileReader();

    reader.onload = async (event) => {
        try {
            if (!event.target?.result) throw new Error('فشل قراءة الملف');
            const data = new Uint8Array(event.target.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);

            if (json.length === 0) throw new Error('الملف فارغ');

            const nameKey = Object.keys(json[0] as any).find(k => k.trim().toLowerCase() === 'name' || k.trim() === 'الاسم');
            const priceKey = Object.keys(json[0] as any).find(k => k.trim().toLowerCase() === 'price' || k.trim() === 'السعر');
            if (!nameKey || !priceKey) throw new Error('يرجى التأكد من تسمية الأعمدة بـ name و price');

            uploadStatus.innerHTML = `<span class="text-indigo-500 font-bold animate-pulse">جاري تحديث السحابة...</span>`;
            uploadProgressContainer.style.display = 'block';
            uploadProgressBar.style.width = '0%';

            // Supabase Delete and Insert
            const { error: delErr } = await supabase.from('products').delete().eq('store_id', targetStore);
            if (delErr) throw delErr;

            const products = json.map((item: any) => ({
                store_id: targetStore,
                name: String(item[nameKey]).trim(),
                price: parseFloat(item[priceKey]) || 0
            }));

            // Insert in chunks of 1000
            for (let i = 0; i < products.length; i += 1000) {
                const chunk = products.slice(i, i + 1000);
                const { error: insErr } = await supabase.from('products').insert(chunk);
                if (insErr) throw insErr;
                uploadProgressBar.style.width = Math.min(100, Math.round(((i + chunk.length) / products.length) * 100)) + '%';
            }

            // Update store status
            const { error: statusErr } = await supabase.from('stores').upsert({
                id: targetStore,
                last_upload_time: new Date().toLocaleString('ar-EG'),
                count: json.length
            });
            if (statusErr) throw statusErr;

            uploadStatus.innerHTML = `<span class="text-emerald-600 font-bold">✅ تم الرفع بنجاح لـ ${STORES[targetStore]}</span>`;
            uploadProgressContainer.style.display = 'none';
            showToast('تم رفع الملف بنجاح', 'success');
            await renderUploadHistory();
        } catch (err: any) {
            console.error(err);
            uploadStatus.innerHTML = `<span class="text-rose-600 font-bold">❌ ${err.message}</span>`;
            uploadProgressContainer.style.display = 'none';
            showToast(err.message, 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

export async function renderUploadHistory() {
    const list = document.getElementById('last-uploads-list');
    if (!list) return;

    list.innerHTML = '<h3 class="mb-4 font-bold text-[1.1rem] text-slate-800">سجل التحديثات الأخير</h3>';

    const { data: storesList } = await supabase.from('stores').select('*');

    Object.keys(STORES).forEach(sid => {
        const up = storesList?.find(s => s.id === sid);
        const div = document.createElement('div');
        div.className = 'flex flex-row justify-between items-center bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm mb-3';
        div.innerHTML = `
            <div class="flex flex-col gap-1">
                <span class="font-bold text-slate-800 text-[1.1rem]">${STORES[sid]}</span>
                <div class="text-[0.85rem] text-slate-500">${up ? `آخر تحديث: ${up.last_upload_time}` : 'لم يتم الرفع مسبقاً'}</div>
            </div>
            <div class="text-left flex flex-col items-end">
                <div class="font-black text-indigo-600 text-[1.3rem] leading-none">${up ? up.count.toLocaleString() : 0}</div>
                <div class="text-[0.75rem] text-slate-400 mt-1">منتج</div>
            </div>
        `;
        list.appendChild(div);
    });
}
