// Supabase Configuration
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const BUCKET_NAME = 'IPTV-Network';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

// আপনার সুপাবেস বালতিতে থাকা ফোল্ডার বা ক্যাটাগরিগুলোর নাম
const CATEGORIES = [
    "Auto Update",
    "Movies",
    "Skym3u.dev",
    "Sports",
    "Xtream & Stalker"
];

// প্রতিটি ক্যাটাগরির ভেতরে থাকা .m3u ফাইলগুলোর নাম (আপনার ফোল্ডারে থাকা ফাইলের নাম অনুযায়ী এখানে বসাতে পারেন)
const FOLDER_FILES = {
    "Auto Update": ["playlist.m3u", "update.m3u"],
    "Movies": ["movies.m3u", "cinema.m3u"],
    "Skym3u.dev": ["skym3u.m3u"],
    "Sports": ["sports.m3u", "live_sports.m3u"],
    "Xtream & Stalker": ["xtream.m3u", "stalker.m3u"]
};

document.addEventListener('DOMContentLoaded', () => {
    initCategoryTabs();
});

function initCategoryTabs() {
    const tabContainer = document.getElementById('categoryTabsContainer');
    if (!tabContainer) return;
    
    tabContainer.innerHTML = '';

    CATEGORIES.forEach((cat, index) => {
        const tabButton = document.createElement('button');
        // Tailwind স্টাইলিং সহ আগের ডিজাইন মেইনটেইন করা
        tabButton.className = `px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
            index === 0 
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25' 
                : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700'
        }`;
        tabButton.innerText = cat;
        tabButton.onclick = () => loadCategoryContent(cat, tabButton);
        tabContainer.appendChild(tabButton);

        // প্রথম ক্যাটাগরি ডিফল্ট লোড করা
        if (index === 0) {
            loadCategoryContent(cat, tabButton);
        }
    });
}

function loadCategoryContent(categoryName, selectedButton) {
    // ট্যাবের অ্যাক্টিভ ক্লাস ও ডিজাইন পরিবর্তন
    const tabContainer = document.getElementById('categoryTabsContainer');
    if (tabContainer) {
        Array.from(tabContainer.children).forEach(btn => {
            btn.className = 'px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700';
        });
    }
    if (selectedButton) {
        selectedButton.className = 'px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25';
    }

    // টাইটেল আপডেট করা
    const currentTitleSpan = document.getElementById('currentCategoryTitle');
    if (currentTitleSpan) {
        currentTitleSpan.innerText = categoryName;
    }

    const playlistContainer = document.getElementById('playlist');
    if (!playlistContainer) return;

    playlistContainer.innerHTML = '<p class="text-slate-400 text-center py-6 text-sm sm:text-base">লোড হচ্ছে...</p>';

    const files = FOLDER_FILES[categoryName] || [];

    if (files.length === 0) {
        playlistContainer.innerHTML = '<p class="text-slate-400 text-center py-6 text-sm sm:text-base">No files found in this category.</p>';
        return;
    }

    playlistContainer.innerHTML = '';

    files.forEach(fileName => {
        const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").toUpperCase();
        const filePubUrl = `${STORAGE_URL}/${encodeURIComponent(categoryName)}/${encodeURIComponent(fileName)}`;
        const imagePubUrl = `${STORAGE_URL}/${encodeURIComponent(categoryName)}/images/${encodeURIComponent(fileName.replace(/\.[^/.]+$/, ""))}.png`;

        const card = document.createElement('div');
        card.className = 'bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-emerald-500/40 transition-all shadow-md';
        
        card.innerHTML = `
            <div class="flex items-center gap-4 w-full sm:w-auto">
                <div class="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                    <img src="${imagePubUrl}" onerror="this.src='https://via.placeholder.com/150?text=IPTV'" alt="${cleanTitle}" class="w-full h-full object-cover">
                </div>
                <div>
                    <h3 class="text-sm sm:text-base font-bold text-slate-200">${cleanTitle}</h3>
                    <p class="text-xs text-slate-400 mt-0.5">Category: ${categoryName}</p>
                </div>
            </div>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a href="${filePubUrl}" target="_blank" class="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg transition-all text-center shadow-lg shadow-emerald-600/20">
                    ডাউনলোড / প্লে করুন
                </a>
            </div>
        `;
        playlistContainer.appendChild(card);
    });
}
