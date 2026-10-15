import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// আপনার Supabase প্রজেক্টের ক্রিপডেনশিয়াল
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1HibJOEynpqyB-xuwZnruw_CvwaA3Dd';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_BUCKET = 'IPTV-Network'; 

window.onload = () => {
    initPortal();
};

let allCategories = [];

// স্টোরেজ স্ক্যান করে ক্যাটাগরি বা ফোল্ডারগুলো বের করার ফাংশন
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        let { data: folders, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list('', { limit: 100 });

        if (error) throw error;

        allCategories = folders
            .filter(item => item.id === null && item.name.toLowerCase() !== "images" && !item.name.startsWith('.'))
            .map(item => item.name);

        if (allCategories.length === 0) {
            allCategories = ["Movies", "Sports", "Skym3u.dev"];
        }

        tabsContainer.innerHTML = "";

        // প্রথমে "All" বাটন তৈরি
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => switchCategory("All", allBtn);
        tabsContainer.appendChild(allBtn);

        // ফোল্ডারগুলোর জন্য ডাইনামিক বাটন তৈরি
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
        allCategories = ["Movies", "Sports", "Skym3u.dev"];
        tabsContainer.innerHTML = "";
        
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => switchCategory("All", allBtn);
        tabsContainer.appendChild(allBtn);

        allCategories.forEach(folderName => {
            let btn = document.createElement("button");
            btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
            btn.innerText = folderName;
            btn.onclick = () => switchCategory(folderName, btn);
            tabsContainer.appendChild(btn);
        });

        loadFiles("All");
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

// ফাইলের নাম থেকে আন্ডারস্কোরের পরের আইডি বা হ্যাশ বের করার ফাংশন (যেমন: Name_8.m3u থেকে 8)
function extractHashId(filename) {
    let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    let match = nameWithoutExt.match(/_([a-zA-Z0-9]+)$/);
    return match ? match[1].trim().toLowerCase() : null;
}

// স্টোরেজ থেকে ফাইল ও ছবি লোড করার মেইন ফাংশন
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
                // ১. মূল ক্যাটাগরি ফোল্ডারের ফাইল লিস্ট আনা
                let { data: items, error } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .list(catName, { limit: 100 });

                if (error || !items) continue;

                let validFiles = items.filter(item => {
                    let nameLower = item.name.toLowerCase();
                    let isImage = /\.(png|jpg|jpeg|webp)$/i.test(nameLower);
                    let isFolder = (item.id === null);
                    let isHidden = nameLower.startsWith('.');
                    return !isImage && !isFolder && !isHidden && item.name !== "";
                });

                // ২. ক্যাটাগরির ভেতরের 'images' ফোল্ডারের ফাইল লিস্ট আনা
                let imagesList = [];
                let { data: imgData, error: imgError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .list(`${catName}/images`, { limit: 100 });
                
                if (!imgError && imgData) {
                    imagesList = imgData.filter(i => /\.(png|jpg|jpeg|webp)$/i.test(i.name.toLowerCase()));
                }

                // ৩. ছবিগুলোর আইডি দিয়ে সঠিক পাবলিক ইউআরএল ম্যাপ তৈরি করা
                let imagesMap = {};
                for (let img of imagesList) {
                    let hashId = extractHashId(img.name);
                    // Supabase থেকে নির্দিষ্ট সাব-ফোল্ডারের ছবির পাবলিক ইউআরএল জেনারেট করা
                    let { data: publicURLData } = supabase.storage
                        .from(STORAGE_BUCKET)
                        .getPublicUrl(`${catName}/images/${img.name}`);

                    if (hashId) {
                        imagesMap[hashId] = publicURLData.publicUrl;
                    }
                }

                // ৪. প্রতিটি ফাইলের ডেটা এবং ছবি ম্যাচ করা
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

                    // ফাইলের আইডি বের করে imagesMap থেকে হুবহু ছবি ম্যাচ করা
                    let fileHashId = extractHashId(file.name);
                    let matchedImgUrl = (fileHashId && imagesMap[fileHashId]) ? imagesMap[fileHashId] : "";

                    // যদি আইডি দিয়ে সরাসরি না মেলে, তবে ফলব্যাক হিসেবে ইনডেক্স অনুযায়ী ছবি নেওয়া
                    if (!matchedImgUrl && imagesList.length > 0) {
                        let fallbackImg = imagesList[i % imagesList.length];
                        let { data: fbUrlData } = supabase.storage
                            .from(STORAGE_BUCKET)
                            .getPublicUrl(`${catName}/images/${fallbackImg.name}`);
                        matchedImgUrl = fbUrlData.publicUrl;
                    }

                    // টাইটেল তৈরির অংশ (আগের মতো নিখুঁত রাখা)
                    let matchedImgObjName = imagesList.find(img => extractHashId(img.name) === fileHashId);
                    let rawNameToClean = matchedImgObjName ? matchedImgObjName.name : file.name;
                    let nameWithoutExt = rawNameToClean.replace(/\.[^/.]+$/, "");
                    let cleanBaseName = nameWithoutExt.replace(/_[a-zA-Z0-9]+$/, "");
                    let titleText = cleanBaseName.replace(/[-_]/g, " ").trim();

                    let extMatch = file.name.match(/\.[^/.]+$/);
                    let fileExt = extMatch ? extMatch[0] : "";
                    let nameWithoutFileExt = file.name.replace(/\.[^/.]+$/, "");
                    let cleanFileName = nameWithoutFileExt.replace(/_[a-zA-Z0-9]+$/, "") + fileExt;

                    collectedFiles.push({
                        name: file.name,
                        displayName: cleanFileName,
                        download_url: downloadUrl,
                        category: catName,
                        image: matchedImgUrl,
                        title: titleText || "Live Stream",
                        timestamp: commitTime,
                        isNew: isToday
                    });
                }
            } catch (err) {
                console.error(`Error in category ${catName}:`, err);
            }
        }

        if (collectedFiles.length === 0) {
            playlistContainer.innerHTML = `<p class="text-slate-400 text-center py-6 text-sm sm:text-base">No files found in this category.</p>`;
            return;
        }

        collectedFiles.sort((a, b) => b.timestamp - a.timestamp);

        playlistContainer.innerHTML = ""; 

        // কার্ড রেন্ডার করা এবং ইভেন্ট হ্যান্ডলার যুক্ত করা
        collectedFiles.forEach((fileObj) => {
            let latestBadge = fileObj.isNew 
                ? `<span class="bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse shrink-0 inline-flex items-center">✨ Latest</span>` 
                : '';

            // ইমেজ ট্যাগ যেখানে ইমেজ ইউআরএল না থাকলে ফলব্যাক বা ডিফল্ট আইকন দেখাবে
            let imageTag = fileObj.image 
                ? `<img src="${fileObj.image}" alt="${fileObj.title}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x160?text=Live+Stream';">`
                : `<div class="w-full h-full flex items-center justify-center bg-slate-800 text-emerald-400 font-bold text-lg">📺 IPTV</div>`;

            let fileItem = document.createElement('div');
            fileItem.className = "bg-slate-700/40 hover:bg-slate-700/70 transition-all rounded-xl overflow-hidden flex flex-col sm:flex-row items-stretch border border-slate-600/40 shadow-sm mb-3";
            
            fileItem.innerHTML = `
                <div class="sm:w-48 h-36 sm:h-auto shrink-0 bg-slate-900 relative">
                    ${imageTag}
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
                        <button class="copy-btn flex-1 sm:flex-none bg-slate-600 hover:bg-slate-500 text-slate-200 font-medium px-3.5 py-2 rounded-lg text-xs sm:text-sm text-center transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                            🔗 Copy Link
                        </button>
                        <button class="download-btn flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg text-xs sm:text-sm text-center transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                            📥 Download
                        </button>
                    </div>
                </div>
            `;

            // কপি বাটন ইভেন্ট
            const copyBtn = fileItem.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(fileObj.download_url).then(() => {
                    let originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = "✅ Copied!";
                    copyBtn.classList.remove("bg-slate-600", "hover:bg-slate-500");
                    copyBtn.classList.add("bg-sky-600", "hover:bg-sky-500");

                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove("bg-sky-600", "hover:bg-sky-500");
                        copyBtn.classList.add("bg-slate-600", "hover:bg-slate-500");
                    }, 2000);
                }).catch(err => {
                    alert("Failed to copy link.");
                });
            });

            // ডাউনলোড বাটন ইভেন্ট
            const downloadBtn = fileItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', async () => {
                try {
                    downloadBtn.innerHTML = "⏳ Downloading...";
                    let response = await fetch(fileObj.download_url);
                    let blob = await response.blob();
                    let blobUrl = window.URL.createObjectURL(blob);
                    let a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = fileObj.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(blobUrl);
                    downloadBtn.innerHTML = "📥 Download";
                } catch (e) {
                    window.open(fileObj.download_url, '_blank');
                    downloadBtn.innerHTML = "📥 Download";
                }
            });

            playlistContainer.appendChild(fileItem);
        });

    } catch (error) {
        console.error("Error loading files from storage:", error);
        playlistContainer.innerHTML = `<p class="text-red-400 text-center py-6 text-sm sm:text-base">Could not load files from storage. Please check bucket configurations.</p>`;
    }
}
