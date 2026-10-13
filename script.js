const DATA_USER = "Tapas-Creation"; 
const DATA_REPO = "M3U-Live"; 

window.onload = () => {
    initPortal();
};

let allCategories = [];
let cachedRepoData = null;

// ক্যাশ মেমরি থেকে ডেটা লোড করার ফাংশন (যাতে বারবার GitHub API হিট করে ব্লক না খায়)
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        // প্রথমে চেক করি ব্রাউজারে ক্যাশ করা ডেটা আছে কি না (৫ মিনিটের ক্যাশ টাইম)
        let cachedTime = localStorage.getItem('iptv_cache_time');
        let savedData = localStorage.getItem('iptv_repo_data');
        let currentTime = new Date().getTime();

        if (savedData && cachedTime && (currentTime - cachedTime < 300000)) {
            cachedRepoData = JSON.parse(savedData);
            processPortalData(cachedRepoData, tabsContainer);
            return;
        }

        // ক্যাশ না থাকলে মাত্র একবার GitHub API কল করবে
        const rootUrl = `https://api.github.com/repos/${DATA_USER}/${DATA_REPO}/contents`;
        let res = await fetch(rootUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        
        if (!res.ok) throw new Error("Failed to fetch repository root.");
        
        let items = await res.json();
        
        allCategories = items
            .filter(item => item.type === "dir" && item.name.toLowerCase() !== "images" && !item.name.startsWith('.'))
            .map(item => item.name);

        if (allCategories.length === 0) {
            allCategories = ["Movies", "Sports", "Skym3u.dev"];
        }

        // ডেটা লোকালস্টোরেজে সেভ করে রাখা যাতে বারবার রিকোয়েস্ট না যায়
        localStorage.setItem('iptv_repo_data', JSON.stringify(allCategories));
        localStorage.setItem('iptv_cache_time', currentTime);

        processPortalData(allCategories, tabsContainer);

    } catch (error) {
        console.error("Initialization error:", error);
        allCategories = ["Movies", "Sports", "Skym3u.dev"];
        processPortalData(allCategories, tabsContainer);
    }
}

// পোর্টাল বাটন ও ক্যাটাগরি প্রসেস করার ফাংশন
function processPortalData(categories, tabsContainer) {
    tabsContainer.innerHTML = "";

    // প্রথমে "All" বাটন তৈরি
    let allBtn = document.createElement("button");
    allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
    allBtn.innerText = "🌐 All";
    allBtn.onclick = () => switchCategory("All", allBtn);
    tabsContainer.appendChild(allBtn);

    // গিটহাব থেকে পাওয়া ফোল্ডারগুলোর জন্য ডাইনামিক বাটন তৈরি
    categories.forEach(folderName => {
        let btn = document.createElement("button");
        btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
        btn.innerText = folderName;
        btn.onclick = () => switchCategory(folderName, btn);
        tabsContainer.appendChild(btn);
    });

    loadFiles("All");
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

// কমিট বা আপলোড টাইম বের করার ফাংশন
async function getCommitTime(path) {
    try {
        let commitUrl = `https://api.github.com/repos/${DATA_USER}/${DATA_REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`;
        let res = await fetch(commitUrl, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
            let commits = await res.json();
            if (commits && commits.length > 0) {
                return new Date(commits[0].commit.committer.date).getTime();
            }
        }
    } catch (e) {}
    return 0;
}

// ফাইলের নামের একদম শেষের অংশ থেকে আন্ডারস্কোর দিয়ে আইডি বের করার ফাংশন
function extractHashId(filename) {
    let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    let match = nameWithoutExt.match(/_([a-zA-Z0-9]+)$/);
    return match ? match[1].trim() : null;
}

// ফাইল ও ছবি লোড করার মেইন ফাংশন
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
                let folderUrl = `https://api.github.com/repos/${DATA_USER}/${DATA_REPO}/contents/${encodeURIComponent(catName)}`;
                let res = await fetch(folderUrl, {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                });
                if (!res.ok) continue;

                let items = await res.json();
                
                let validFiles = items.filter(item => {
                    let nameLower = item.name.toLowerCase();
                    let isImage = /\.(png|jpg|jpeg|webp)$/i.test(nameLower);
                    let isHidden = nameLower.startsWith('.');
                    
                    return item.type === "file" && !isImage && !isHidden;
                });

                let imagesList = [];
                let imgFolder = items.find(item => item.type === "dir" && item.name.toLowerCase() === "images");
                if (imgFolder) {
                    let imgRes = await fetch(imgFolder.url, {
                        headers: { 'Accept': 'application/vnd.github.v3+json' }
                    });
                    if (imgRes.ok) {
                        let imgData = await imgRes.json();
                        imagesList = imgData.filter(i => i.type === 'file' && /\.(png|jpg|jpeg|webp)$/i.test(i.name));
                    }
                }

                // ইমেজগুলোর সঠিক ম্যাপ তৈরি করা ফাইলের শেষের আন্ডারস্কোর আইডি দিয়ে
                let imagesMap = {};
                for (let img of imagesList) {
                    let hashId = extractHashId(img.name);
                    if (hashId) {
                        imagesMap[hashId] = {
                            name: img.name,
                            download_url: img.download_url
                        };
                    }
                }

                let filesWithTime = [];
                for (let file of validFiles) {
                    let commitTime = await getCommitTime(`${catName}/${file.name}`);
                    filesWithTime.push({
                        file: file,
                        time: commitTime
                    });
                }

                filesWithTime.sort((a, b) => b.time - a.time);

                for (let i = 0; i < filesWithTime.length; i++) {
                    let itemObj = filesWithTime[i];
                    let file = itemObj.file;
                    let commitTime = itemObj.time;
                    let downloadUrl = `https://cdn.jsdelivr.net/gh/${DATA_USER}/${DATA_REPO}@main/${catName}/${file.name}`;
                    
                    let fileDateStr = "";
                    if (commitTime > 0) {
                        let cDate = new Date(commitTime);
                        fileDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
                    }

                    let isToday = (fileDateStr === todayStr);

                    let fileHashId = extractHashId(file.name);
                    let matchedImgObj = (fileHashId && imagesMap[fileHashId]) ? imagesMap[fileHashId] : null;

                    if (!matchedImgObj && imagesList.length > 0) {
                        let fallbackImg = imagesList[i % imagesList.length];
                        matchedImgObj = {
                            name: fallbackImg.name,
                            download_url: fallbackImg.download_url
                        };
                    }

                    let matchedImgUrl = matchedImgObj ? matchedImgObj.download_url : "https://via.placeholder.com/300x160?text=No+Preview";
                    
                    // আপনার চাওয়া অনুযায়ী: টাইটেল হবে ইমেজের আসল নাম থেকে (আন্ডারস্কোর ট্যাগ বা এক্সটেনশন বাদ দিয়ে ক্লিন করে)
                    let titleText = "Live Stream";
                    if (matchedImgObj) {
                        let imgNameWithoutExt = matchedImgObj.name.replace(/\.[^/.]+$/, "");
                        let cleanImgBase = imgNameWithoutExt.replace(/_[a-zA-Z0-9]+$/, "");
                        titleText = cleanImgBase.replace(/[-_]/g, " ").trim();
                    }

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
        console.error("Error loading files:", error);
        playlistContainer.innerHTML = `<p class="text-red-400 text-center py-6 text-sm sm:text-base">Could not load files. Please check repository configurations.</p>`;
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

function downloadOriginalFile(url, filename) {
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
