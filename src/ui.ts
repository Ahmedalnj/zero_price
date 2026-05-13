export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] flex flex-col items-center pointer-events-none w-[90%] max-w-md gap-3';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const baseClasses = 'flex items-center gap-4 px-6 py-4 rounded-[1.25rem] shadow-2xl transform transition-all duration-500 translate-y-12 opacity-0 pointer-events-auto backdrop-blur-xl w-full border-2';
    
    let typeClasses = '';
    let iconSvg = '';

    if (type === 'success') {
        typeClasses = 'bg-emerald-500/90 text-white border-emerald-400/50';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (type === 'error') {
        typeClasses = 'bg-rose-500/90 text-white border-rose-400/50';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else {
        typeClasses = 'bg-slate-800/95 text-white border-slate-700/50';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.className = `${baseClasses} ${typeClasses}`;
    toast.innerHTML = `
        <div class="bg-white/20 p-1.5 rounded-lg">${iconSvg}</div>
        <span class="font-black text-sm leading-tight flex-1">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-12', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-12', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 500);
    }, 4000);
}

export function getSkeletonHTML(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="glass-panel rounded-3xl p-8 flex flex-row justify-between items-center gap-10 animate-pulse border-white/50">
            <div class="flex-1 space-y-3">
                <div class="h-6 bg-slate-200/60 rounded-xl w-3/4"></div>
                <div class="h-3 bg-slate-200/40 rounded-lg w-1/4"></div>
            </div>
            <div class="h-12 bg-primary/10 rounded-2xl w-24"></div>
        </div>`;
    }
    return html;
}

export function getEmptyStateHTML(message: string) {
    return `
    <div class="flex flex-col items-center justify-center p-12 mt-8 text-center glass-panel rounded-[2.5rem] border-dashed border-2 border-slate-200">
        <div class="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-full mb-6">
            <svg class="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </div>
        <span class="text-slate-400 font-black text-xl mb-2">عذراً، لا توجد نتائج</span>
        <span class="text-slate-400 font-bold text-sm">${message}</span>
    </div>`;
}
