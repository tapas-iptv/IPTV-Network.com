// Supabase Configuration
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1HibJOEynpqyB-xuwZnruw_CvwaA3Dd';
const BUCKET_NAME = 'IPTV-Network';

// Supabase Storage REST endpoints
const STORAGE_LIST_URL = `${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`;
const STORAGE_PUBLIC_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

window.onload = () => {
    initPortal();
};

let allCategories = [];

// Supabase থেকে রুট ফোল্ডার স্ক্যান করে ডাইনামিক ক্যাটাগরি বাটন তৈরি
async function initPortal() {
    const tabsContainer = document.getElementById("categoryTabsContainer");
    if (!tabsContainer) return;
    
    try {
        let res = await fetch(STORAGE_LIST_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prefix: "",
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            })
        });
        
        if (!res.ok) throw new Error("Failed to fetch Supabase storage root.");
        
        let items = await res.json();
        
        // Supabase-এ ফোল্ডারের id null থাকে
        allCategories = items
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

        // সুপাবেস ফোল্ডারগুলোর জন্য ডাইনামিক বাটন তৈরি
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

// ফাইলের নামের শেষাংশ থেকে আইডি (যেমন _8) বের করার ফাংশন
function extractHashId(filename) {
    let nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    let match = nameWithoutExt.match(/_([a-zA-Z0-9]+)$/);
    return match ? match[1].trim() : null;
}

// Supabase থেকে ফাইল ও থাম্বনেইল লোড করার মেইন ফাংশন
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
                let res = await fetch(STORAGE_LIST_URL, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prefix: `${catName}/`,
                        limit: 100,
                        offset: 0,
                        sortBy: { column: 'updated_at', order: 'desc' }
                    })
                });
                if (!res.ok) continue;

                let items = await res.json();
                
                // মূল ফোল্ডারের ফাইলগুলো (সাবফোল্ডার বা ছবি বা হিডেন ফাইল বাদ দিয়ে)
                let validFiles = items.filter(item => {
                    if (item.id !== null) return false; // সাবফোল্ডার বাদ
                    let nameLower = item.name.toLowerCase();
                    let isImage = /\.(png|jpg|jpeg|webp)$/i.test(nameLower);
                    let isHidden = nameLower.startsWith('.');
                    return !isImage && !isHidden;
                });

                // images সাবফোল্ডারের ফাইলগুলো ফেচ করা
                let imagesList = [];
                try {
                    let imgRes = await fetch(STORAGE_LIST_URL, {
                        method: 'POST',
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            prefix: `${catName}/images/`,
                            limit: 100,
                            offset: 0,
                            sortBy: { column: 'name', order: 'asc' }
                        })
                    });
                    if (imgRes.ok) {
                        let imgData = await imgRes.json();
                        imagesList = imgData.filter(i => i.id === null && /\.(png|jpg|jpeg|webp)$/i.test(i.name.toLowerCase()));
                    }
                } catch (e) {}

                // ইমেজ ম্যাপ তৈরি
                let imagesMap = {};
                for (let img of imagesList) {
                    let hashId = extractHashId(img.name);
                    let imgPubUrl = `${STORAGE_PUBLIC_URL}/${catName}/images/${img.name}`;
                    if (hashId) {
                        imagesMap[hashId] = {
                            name: img.name,
                            url: imgPubUrl
                        };
                    }
                }

                for (let i = 0; i < validFiles.length; i++) {
                    let file = validFiles[i];
                    let filePubUrl = `${STORAGE_PUBLIC_URL}/${catName}/${file.name}`;
                    
                    // আপলোড বা আপডেটের সময় সুপাবেসের `updated_at` থেকে নেওয়া
                    let fileTime = file.updated_at ? new Date(file.updated_at).getTime() : 0;
                    let fileDateStr = "";
                    if (fileTime > 0) {
                        let cDate = new Date(fileTime);
                        fileDateStr = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}-${String(cDate.getDate()).padStart(2, '0')}`;
                    }

                    let isToday = (fileDateStr === todayStr);

                    let fileHashId = extractHashId(file.name);
                    let matchedImgObj = (fileHashId && imagesMap[fileHashId]) ? imagesMap[fileHashId] : null;

                    if (!matchedImgObj && imagesList.length > 0) {
                        let fallbackImg = imagesList[i % imagesList.length];
                        matchedImgObj = {
                            name: fallbackImg.name,
                            url: `${STORAGE_PUBLIC_URL}/${catName}/images/${fallbackImg.name}`
                        };
                    }

                    let matchedImgUrl = matchedImgObj ? matchedImgObj.url : "https://via.placeholder.com/300x160?text=No+Preview";
                    
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
                        download_url: filePubUrl,
                        category: catName,
                        image: matchedImgUrl,
                        title: titleText || "Live Stream",
                        timestamp: fileTime,
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
