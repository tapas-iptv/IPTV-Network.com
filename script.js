import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// আপনার Supabase প্রজেক্টের সঠিক URL এবং Publishable Key এখানে বসান
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1HibJOEynpqyB-xuwZnruw_CvwaA3Dd';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKET = 'IPTV-Network'; 

window.onload = () => {
    initPortal();
};

let allCategories = [];

// স্টোরেজ থেকে ডাইনামিকালি ফোল্ডার বা ক্যাটাগরি ফেচ করা
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        // বাক্সের রুট ফোল্ডার স্ক্যান করা
        let { data: folders, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list('', { limit: 100 });

        if (error) {
            console.error("Storage Error:", error);
            throw error;
        }

        console.log("Root Folders fetched from Storage:", folders);

        // শুধুমাত্র ফোল্ডারগুলো ফিল্টার করা (যেগুলোর id null থাকে সেগুলো ফোল্ডার)
        allCategories = folders
            .filter(item => item.id === null && item.name.toLowerCase() !== "images" && !item.name.startsWith('.'))
            .map(item => item.name);

        if (allCategories.length === 0) {
            tabsContainer.innerHTML = `<p class="text-amber-400 text-xs">No folders found in storage root.</p>`;
            return;
        }

        tabsContainer.innerHTML = "";

        // প্রথমে "All" বাটন তৈরি
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => switchCategory("All", allBtn);
        tabsContainer.appendChild(allBtn);

        // ডাইনামিক ফোল্ডারগুলোর জন্য বাটন তৈরি
        allCategories.forEach(folderName => {
            let btn = document.createElement("button");
            btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
            btn.innerText = folderName;
            btn.onclick = () => switchCategory(folderName, btn);
            tabsContainer.appendChild(btn);
        });

        // ডিফল্টভাবে 'All' লোড করা
        loadFiles("All");

    } catch (error) {
        console.error("Initialization error:", error);
        tabsContainer.innerHTML = `<p class="text-red-400 text-xs">Failed to load categories from storage. Check Console & Policies.</p>`;
    }
}

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

// স্টোরেজের নির্দিষ্ট ফোল্ডার থেকে ফাইল লোড করার ফাংশন
async function loadFiles(targetCategory) {
    const playlistContainer = document.getElementById("playlist");
    if (!playlistContainer) return;

    playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm sm:text-base">Loading files...</p>`; 

    try {
        let categoriesToFetch = targetCategory === "All" ? allCategories : [targetCategory];
        let collectedFiles = [];

        let now = new Date();
        let todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        for (let catName of categoriesToFetch) {
            try {
                let { data: items, error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .list(catName, { limit: 100 });

                console.log(`Files in folder [${catName}]:`, items);

                if (error || !items) continue;

                let validFiles = items.filter(item => {
                    let nameLower = item.name.toLowerCase();
                    let isImage = /\.(png|jpg|jpeg|webp)$/i.test(nameLower);
                    let isHidden = nameLower.startsWith('.');
                    return !isImage && !isHidden && item.name !== "";
                });

                for (let i = 0; i < validFiles.length; i++) {
                    let file = validFiles[i];
                    
                    let { data: publicURLData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(`${catName}/${file.name}`);

                    let downloadUrl = publicURLData.publicUrl;
                    let commitTime = file.updated_at ? new Date(file.updated_at).getTime() : 0;
                    
                    let fileDateStr = "";
                    if (commitTime > 0) {
                        let cDate = new Date(commitTime);
                        fileDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
                    }

                    let isToday = (fileDateStr === todayStr);

                    let nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                    let cleanBaseName = nameWithoutExt.replace(/_[a-zA-Z0-9]+$/, "");
                    let titleText = cleanBaseName.replace(/[-_]/g, " ").trim();

                    let extMatch = file.name.match(/\.[^/.]+$/);
                    let fileExt = extMatch ? extMatch[0] : "";
                    let cleanFileName = nameWithoutExt.replace(/_[a-zA-Z0-9]+$/, "") + fileExt;

                    collectedFiles.push({
                        name: file.name,
                        displayName: cleanFileName,
                        download_url: downloadUrl,
                        category: catName,
                        image: "https://via.placeholder.com/300x160?text=Live+Stream",
                        title: titleText || "Live Stream",
                        timestamp: commitTime,
                        isNew: isToday
                    });
                }
            } catch (err) {
                console.error(`Error in folder ${catName}:`, err);
            }
        }

        if (collectedFiles.length === 0) {
            playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm sm:text-base">No files found in this category.</p>`;
            return;
        }

        collectedFiles.sort((a, b) => b.timestamp - a.timestamp);

        playlistContainer.innerHTML = ""; 

        collectedFiles.forEach(fileObj => {
            let latestBadge = fileObj.isNew 
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

    } catch (error) {
        console.error("Error loading files from storage:", error);
        playlistContainer.innerHTML = `<p class="text-red-400 text-center py-6 text-sm sm:text-base">Could not load files from storage. Please check bucket configurations.</p>`;
    }
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
