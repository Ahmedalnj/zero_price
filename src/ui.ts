export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center pointer-events-none w-[90%] max-w-md';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transform transition-all duration-300 translate-y-10 opacity-0 mb-3 pointer-events-auto backdrop-blur-md w-full';
    
    let typeClasses = '';
    let iconSvg = '';

    if (type === 'success') {
        typeClasses = 'bg-emerald-500/90 text-white border border-emerald-400';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
    } else if (type === 'error') {
        typeClasses = 'bg-rose-500/90 text-white border border-rose-400';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
    } else {
        typeClasses = 'bg-indigo-500/90 text-white border border-indigo-400';
        iconSvg = `<svg class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.className = `${baseClasses} ${typeClasses}`;
    toast.innerHTML = `
        ${iconSvg}
        <span class="font-bold text-[0.95rem] leading-tight">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3000);
}

export function getSkeletonHTML(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
        <div class="flex flex-row justify-between items-center bg-white/60 backdrop-blur-md rounded-[clamp(12px,4vw,20px)] p-[clamp(15px,4vw,20px)] border border-white shadow-sm gap-[15px] transition-all animate-pulse">
            <div class="flex-1 flex flex-col gap-2">
                <div class="h-5 bg-slate-200 rounded-md w-3/4"></div>
                <div class="h-3 bg-slate-100 rounded-md w-1/2"></div>
            </div>
            <div class="flex flex-col items-end gap-1">
                <div class="h-6 bg-slate-200 rounded-md w-20"></div>
                <div class="h-3 bg-slate-100 rounded-md w-12"></div>
            </div>
        </div>`;
    }
    return html;
}

export function getEmptyStateHTML(message: string) {
    return `
    <div class="flex flex-col items-center justify-center p-8 mt-5 text-center bg-white/40 backdrop-blur-md rounded-[24px] border border-white shadow-sm">
        <svg class="w-24 h-24 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-slate-500 font-bold text-[1.1rem]">${message}</span>
    </div>`;
}
