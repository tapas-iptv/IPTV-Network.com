// আপনার কন্টেন্ট বা ফাইলগুলোর গিটহাব ইউজার ও রিপো নাম (যেখান থেকে ডেটা লোড হবে)
const DATA_USER = "Tapas-Creation"; 
const DATA_REPO = "M3U-Live"; 

window.onload = () => {
    initPortal();
};

let allCategories = [];
let globalFilesData = [];

// আলাদা গিটহাব রিপোজিটরি থেকে data.json ফেচ করার ফাংশন
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        // সরাসরি আপনার কন্টেন্ট রিপোজিটরির raw বা jsdelivr লিংক থেকে data.json লোড করা হচ্ছে
        let jsonUrl = `https://cdn.jsdelivr.net/gh/${DATA_USER}/${DATA_REPO}@main/data.json?t=` + new Date().getTime();
        
        let res = await fetch(jsonUrl);
        if (!res.ok) throw new Error("Failed to load data.json from repository.");
        
        let jsonData = await res.json();
        allCategories = jsonData.categories || ["Movies", "Sports", "Skym3u.dev"];
        globalFilesData = jsonData.files || [];

        tabsContainer.innerHTML = "";

        // "All" বাটন তৈরি
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => switchCategory("All", allBtn);
        tabsContainer.appendChild(allBtn);

        // ক্যাটাগরি বাটন তৈরি
        allCategories.forEach(folderName => {
            let btn = document.createElement("button");
            btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
            btn.innerText = folderName;
            btn.onclick = () => switchCategory(folderName, btn);
            tabsContainer.appendChild(btn);
        });

        loadFiles("All");

    } catch (error) {
        console.error("Initialization error:", error);
        const playlistContainer = document.getElementById("playlist");
        if(playlistContainer) {
            playlistContainer.innerHTML = `<p class="text-red-400 text-center py-6 text-sm">Could not load data. Please ensure data.json exists in your content repository (${DATA_REPO}).</p>`;
        }
    }
}

// ক্যাটাগরি সুইচ করার ফাংশন
function switchCategory(categoryName, btnElement) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('bg-emerald-500', 'text-slate-950', 'shadow-md');
        btn.classList.add('bg-slate-800', 'text-slate-300', 'border', 'border-slate-700/60', 'hover:bg-slate-700');
    });

    if (btnElement) {
        btnElement.classList.remove('bg-slate-800', 'text-slate-300', 'border', 'border-slate-700/60', 'hover:bg-slate-700');
        btnElement.classList.add('bg-emerald-500', 'text-slate-950', 'shadow-md');
    }

    const titleElem = document.getElementById('currentCategoryTitle');
    if (titleElem) titleElem.innerText = categoryName;

    loadFiles(categoryName);
}

// ফাইল রেন্ডার করার ফাংশন
function loadFiles(targetCategory) {
    const playlistContainer = document.getElementById("playlist");
    if (!playlistContainer) return;

    playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm sm:text-base">Loading files...</p>`; 

    let filteredFiles = targetCategory === "All" 
        ? globalFilesData 
        : globalFilesData.filter(f => f.category === targetCategory);

    if (filteredFiles.length === 0) {
        playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm sm:text-base">No files found in this category.</p>`;
        return;
    }

    let now = new Date();
    let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    playlistContainer.innerHTML = ""; 

    filteredFiles.forEach(fileObj => {
        let fileDateStr = "";
        if (fileObj.timestamp > 0) {
            let cDate = new Date(fileObj.timestamp);
            fileDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
        }
        let isToday = (fileDateStr === todayStr);

        let latestBadge = isToday 
            ? `<span class="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse shrink-0 inline-flex items-center">✨ Latest</span>` 
            : '';

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
                            ${latestBadge}
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

// লিংক কপি করার ফাংশন
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

// ফাইল ডাউনলোড করার ফাংশন
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
