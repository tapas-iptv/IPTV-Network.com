const DATA_USER = "Tapas-Creation"; 
const DATA_REPO = "M3U-Live"; 
const GITHUB_TOKEN = "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"; // Apnar token-ti ekhane dewa ache

window.onload = () => {
    initPortal();
};

let allCategories = [];

// Token soho secure fetch helper function
async function fetchWithAuth(url) {
    let headers = {
        'Accept': 'application/vnd.github.v3+json'
    };
    if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    return await fetch(url, { headers });
}

// Root folder scan kore dynamic category button toiri korar function
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        const rootUrl = `https://api.github.com/repos/${DATA_USER}/${DATA_REPO}/contents`;
        let res = await fetchWithAuth(rootUrl);
        
        if (!res.ok) throw new Error("Failed to fetch repository root.");
        
        let items = await res.json();
        
        allCategories = items
            .filter(item => item.type === "dir" && item.name.toLowerCase() !== "images" && !item.name.startsWith('.'))
            .map(item => item.name);

        if (allCategories.length === 0) {
            allCategories = ["Movies", "Sports", "Skym3u.dev"];
        }

        tabsContainer.innerHTML = "";

        // Prothome "All" button toiri
        let allBtn = document.createElement("button");
        allBtn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 shadow-md transition-all shrink-0 cursor-pointer";
        allBtn.innerText = "🌐 All";
        allBtn.onclick = () => switchCategory("All", allBtn);
        tabsContainer.appendChild(allBtn);

        // Github theke paoya folder-gulo jonno dynamic button toiri
        allCategories.forEach(folderName => {
            let btn = document.createElement("button");
            btn.className = "category-btn px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700 transition-all shrink-0 cursor-pointer";
            btn.innerText = folderName;
            btn.onclick = () => switchCategory(folderName, btn);
            tabsContainer.appendChild(btn);
        });

        // Default-vabe 'All' load kora
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

// Category switch korar function
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

// Commit ba upload time ber korar function
async function getCommitTime(path) {
    try {
        let commitUrl = `https://api.github.com/repos/${DATA_USER}/${DATA_REPO}/commits?path=${encodeURIComponent(path)}&per_page=1`;
        let res = await fetchWithAuth(commitUrl);
        if (res.ok) {
            let commits = await res.json();
            if (commits && commits.length > 0) {
                return new Date(commits[0].commit.committer.date).getTime();
            }
        }
    } catch (e) {}
    return 0;
}

// File-er namer ekdom sesh ongsho theke underscore diye ID ber korar function
function extractHashId(filename) {
    let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    let match = nameWithoutExt.match(/_([a-zA-Z0-9]+)$/);
    return match ? match[1].trim() : null;
}

// File o chobi load korar main function
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
                let res = await fetchWithAuth(folderUrl);
                if (!res.ok) continue;

                let items = await res.json();
                
                let validFiles = items.filter(item => {
                    let nameLower = item.name.toLowerCase();
                    let isImage = /\.(png|jpg|jpeg|webp)$/i.test(nameLower);
                    let isFolder = (item.type === "dir");
                    let isHidden = nameLower.startsWith('.');
                    
                    return item.type === "file" && !isImage && !isHidden;
                });

                let imagesList = [];
                let imgFolder = items.find(item => item.type === "dir" && item.name.toLowerCase() === "images");
                if (imgFolder) {
                    let imgRes = await fetchWithAuth(imgFolder.url);
                    if (imgRes.ok) {
                        let imgData = await imgRes.json();
                        imagesList = imgData.filter(i => i.type === 'file' && /\.(png|jpg|jpeg|webp)$/i.test(i.name));
                    }
                }

                // Image-gulo sothik map toiri kora
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
                    
                    let rawNameToClean = matchedImgObj ? matchedImgObj.name : file.name;
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
