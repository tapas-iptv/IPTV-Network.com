const DATA_USER = "Tapas-Creation"; 
const DATA_REPO = "M3U-Live"; 

window.onload = () => {
    loadPortalData();
};

async function loadPortalData() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    const playlistContainer = document.getElementById("playlist");
    if (!tabsContainer || !playlistContainer) return;

    try {
        // সরাসরি আপনার কন্টেন্ট রিপোজিটরি থেকে data.json ফেচ করবে (jsdelivr ক্যাশ এড়াতে টাইমস্ট্যাম্প সহ)
        let jsonUrl = `https://cdn.jsdelivr.net/gh/${DATA_USER}/${DATA_REPO}@main/data.json?v=` + new Date().getTime();
        let res = await fetch(jsonUrl);
        
        if (!res.ok) throw new Error("Could not load data.json");

        let data = await res.json();
        let categories = data.categories || [];
        let allFiles = data.files || [];

        // ক্যাটাগরি বাটন তৈরি
        tabsContainer.innerHTML = "";
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => renderFiles("All", allFiles, categories, allBtn);
        tabsContainer.appendChild(allBtn);

        categories.forEach(cat => {
            let btn = document.createElement("button");
            btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
            btn.innerText = cat;
            btn.onclick = () => renderFiles(cat, allFiles, categories, btn);
            tabsContainer.appendChild(btn);
        });

        renderFiles("All", allFiles, categories, allBtn);

    } catch (error) {
        console.error("Error loading portal:", error);
        playlistContainer.innerHTML = `<p class="text-red-400 text-center py-6 text-sm">Could not load data. Please ensure data.json exists in your content repository (M3U-Live).</p>`;
    }
}

function renderFiles(targetCategory, allFiles, categories, btnElement) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-500', 'text-slate-950', 'shadow-md');
        btn.classList.add('bg-slate-800', 'text-slate-300', 'border', 'border-slate-700/60', 'hover:bg-slate-700');
    });

    if (btnElement) {
        btnElement.classList.remove('bg-slate-800', 'text-slate-300', 'border', 'border-slate-700/60', 'hover:bg-slate-700');
        btnElement.classList.add('bg-emerald-500', 'text-slate-950', 'shadow-md');
    }

    const titleElem = document.getElementById('currentCategoryTitle');
    if (titleElem) titleElem.innerText = targetCategory;

    const playlistContainer = document.getElementById("playlist");
    playlistContainer.innerHTML = "";

    let filteredFiles = targetCategory === "All" 
        ? allFiles 
        : allFiles.filter(f => f.category === targetCategory);

    if (filteredFiles.length === 0) {
        playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm">No files found in this category.</p>`;
        return;
    }

    filteredFiles.forEach(fileObj => {
        let fileItem = `
            <div class="bg-slate-700/40 hover:bg-slate-700/70 transition-all rounded-xl overflow-hidden flex flex-col sm:flex-row items-stretch border border-slate-600/40 shadow-sm mb-3">
                <div class="sm:w-48 h-36 sm:h-auto shrink-0 bg-slate-900 relative">
                    <img src="${fileObj.image}" alt="${fileObj.title}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x160?text=Error'">
                </div>
                
                <div class="p-4 flex flex-col justify-between flex-grow gap-3">
                    <div>
                        <div class="flex items-start justify-between mb-1 gap-2 flex-wrap">
                            <h3 class="font-bold text-slate-100 text-base sm:text-lg flex items-center gap-2 min-w-0 flex-1">
                                <span class="text-emerald-400 shrink-0">📺</span> 
                                <span class="truncate" title="${fileObj.title}">${fileObj.title}</span>
                            </h3>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <span class="text-[10px] font-mono bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded border border-slate-700">${fileObj.category}</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                            <span>ফাইল: <span class="text-slate-300 font-mono" title="${fileObj.name}">${fileObj.displayName}</span></span>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto pt-2 border-t border-slate-600/30">
                        <button onclick="copyRawLink('${fileObj.download_url}', this)" class="flex-1 sm:flex-none bg-slate-600 hover:bg-slate-500 text-slate-200 font-medium px-3.5 py-2 rounded-lg text-xs sm:text-sm text-center transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                            🔗 Copy Link
                        </button>
                        <button onclick="downloadOriginalFile('${fileObj.download_url}', '${fileObj.name}')" class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs sm:text-sm text-center transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                            📥 Download
                        </button>
                    </div>
                </div>
            </div>
        `;
        playlistContainer.innerHTML += fileItem;
    });
}

function copyRawLink(url, buttonElement) {
    navigator.clipboard.writeText(url).then(() => {
        let originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = "✅ Copied!";
        buttonElement.classList.remove("bg-slate-600", "hover:bg-slate-500");
        buttonElement.classList.add("bg-sky-600", "hover:bg-sky-500");

        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove("bg-sky-600", "hover:bg-sky-500");
            buttonElement.classList.add("bg-slate-600", "hover:bg-slate-500");
        }, 2000);
    }).catch(err => {
        alert("Failed to copy link.");
    });
}

async function downloadOriginalFile(url, filename) {
    try {
        let response = await fetch(url);
        let blob = await response.blob();
        let blobUrl = window.URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        window.open(url, '_blank');
    }
}
