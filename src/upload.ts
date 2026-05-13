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
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            if (rows.length === 0) throw new Error('الملف فارغ');

            let headerRowIdx = -1;
            let nameColIdx = -1;
            let priceColIdx = -1;
            let skuColIdx = -1;

            for (let i = 0; i < rows.length; i++) {
                const row = rows[i] as any[];
                if (!Array.isArray(row)) continue;
                
                for (let j = 0; j < row.length; j++) {
                    if (typeof row[j] !== 'string') continue;
                    const val = String(row[j]).trim().toLowerCase();
                    
                    if (val === 'name' || val === 'الاسم' || val === 'اسم الصنف' || val === 'بيان الصنف') nameColIdx = j;
                    if (val === 'price' || val === 'السعر') priceColIdx = j;
                    if (val === 'sku' || val === 'رقم الصنف') skuColIdx = j;
                }
                
                if (nameColIdx !== -1 && priceColIdx !== -1) {
                    headerRowIdx = i;
                    break;
                }
            }

            if (headerRowIdx === -1) throw new Error('يرجى التأكد من وجود أعمدة (بيان الصنف / اسم الصنف) و (السعر)');

            uploadStatus.innerHTML = `<span class="text-indigo-500 font-bold animate-pulse">جاري تحديث السحابة...</span>`;
            uploadProgressContainer.style.display = 'block';
            uploadProgressBar.style.width = '0%';

            // Supabase Delete and Insert
            const { error: delErr } = await supabase.from('products').delete().eq('store_id', targetStore);
            if (delErr) throw delErr;

            const products: any[] = [];
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
                const row = rows[i] as any[];
                if (!Array.isArray(row) || row.length === 0) continue;
                
                const nameVal = row[nameColIdx];
                const priceVal = row[priceColIdx];
                const skuVal = skuColIdx !== -1 ? row[skuColIdx] : null;
                
                if (nameVal === undefined || nameVal === null || String(nameVal).trim() === '') continue;
                
                let finalName = String(nameVal).trim();
                if (skuVal !== undefined && skuVal !== null && String(skuVal).trim() !== '') {
                    finalName = `[${String(skuVal).trim()}] - ${finalName}`;
                }
                
                products.push({
                    store_id: targetStore,
                    name: finalName,
                    price: parseFloat(priceVal as any) || 0
                });
            }

            if (products.length === 0) throw new Error('لم يتم العثور على منتجات صالحة في الملف');

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
                last_upload_time: new Date().toLocaleString('en-GB'),
                count: products.length
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
        div.className = 'glass-panel rounded-2xl p-6 flex flex-row justify-between items-center border border-white shadow-sm mb-6 hover:bg-white/80 transition-colors';
        div.innerHTML = `
            <div class="flex flex-col gap-2">
                <span class="font-black text-slate-800 text-lg tracking-tight">${STORES[sid]}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[0.7rem] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                        ${up ? `آخر تحديث: ${up.last_upload_time}` : 'لم يتم الرفع مسبقاً'}
                    </span>
                </div>
            </div>
            <div class="text-left flex flex-col items-end gap-1">
                <div class="font-black text-primary text-2xl leading-none">${up ? up.count.toLocaleString() : 0}</div>
                <div class="text-[0.65rem] font-black text-slate-400 uppercase tracking-widest">منتج</div>
            </div>
        `;
        list.appendChild(div);
    });
}
