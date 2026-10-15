// Supabase Configuration
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const BUCKET_NAME = 'IPTV-Network';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;

// আপনার ক্যাটাগরি ফোল্ডারগুলোর নাম এখানে ঠিক যেভাবে সুপাবেসে আছে সেভাবে লিখে দিন
const CATEGORIES = [
    "Auto Update",
    "Movies",
    "Skym3u.dev",
    "Sports",
    "Xtream & Stalker"
];

// আপনার ফোল্ডারগুলোতে যেসব .m3u ফাইলের নাম রয়েছে, সেগুলোর একটি তালিকা বা ডাইনামিক ফেচিং সিস্টেম
// নিচে প্রতিটি ক্যাটাগরির জন্য ফাইলের নামগুলো বা কমন ফাইল স্ট্রাকচার সেট করা হলো
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
    const categoryContainer = document.getElementById('category-tabs') || createCategoryContainer();
    categoryContainer.innerHTML = '';

    CATEGORIES.forEach((cat, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = `category-tab ${index === 0 ? 'active' : ''}`;
        tabButton.innerText = cat;
        tabButton.onclick = () => loadCategoryContent(cat, tabButton);
        categoryContainer.appendChild(tabButton);

        // প্রথম ক্যাটাগরি ডিফল্ট লোড করা
        if (index === 0) {
            loadCategoryContent(cat, tabButton);
        }
    });
}

function loadCategoryContent(categoryName, selectedButton) {
    document.querySelectorAll('.category-tab').forEach(btn => btn.classList.remove('active'));
    if (selectedButton) selectedButton.classList.add('active');

    const contentContainer = document.getElementById('playlist-container') || createPlaylistContainer();
    contentContainer.innerHTML = '';

    const files = FOLDER_FILES[categoryName] || ["playlist.m3u"];

    files.forEach(fileName => {
        const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const filePubUrl = `${STORAGE_URL}/${encodeURIComponent(categoryName)}/${encodeURIComponent(fileName)}`;
        const imagePubUrl = `${STORAGE_URL}/${encodeURIComponent(categoryName)}/images/${encodeURIComponent(fileName.replace(/\.[^/.]+$/, ""))}.png`;

        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${imagePubUrl}" onerror="this.src='https://via.placeholder.com/300x150?text=IPTV+Stream'" alt="${cleanTitle}">
            </div>
            <div class="card-details">
                <h3>${cleanTitle.toUpperCase()}</h3>
                <a href="${filePubUrl}" class="download-btn" target="_blank">ডাউনলোড / প্লে করুন</a>
            </div>
        `;
        contentContainer.appendChild(card);
    });
}

function createCategoryContainer() {
    let container = document.createElement('div');
    container.id = 'category-tabs';
    container.className = 'category-tabs-wrapper';
    document.body.insertBefore(container, document.body.firstChild);
    return container;
}

function createPlaylistContainer() {
    let container = document.createElement('div');
    container.id = 'playlist-container';
    container.className = 'playlist-grid-wrapper';
    document.body.appendChild(container);
    return container;
}
