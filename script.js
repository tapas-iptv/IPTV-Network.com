// Supabase Configuration
const SUPABASE_URL = 'https://liljnnprtqwoimmsjuhy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1HIbJ0EynpqyB-xuwZnruw_CvwaAZ0Z'; // আপনার স্ক্রিনশটের Publishable Key
const BUCKET_NAME = 'IPTV-Network';

// Supabase Storage Base URL for Public Access
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`;
const STORAGE_LIST_URL = `${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`;

document.addEventListener('DOMContentLoaded', () => {
    fetchCategoriesAndFiles();
});

async function fetchCategoriesAndFiles() {
    try {
        // সুপাবেস থেকে রুট ফোল্ডারের লিস্ট আনা
        const response = await fetch(STORAGE_LIST_URL, {
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

        if (!response.ok) throw new Error('Failed to fetch storage categories');

        const items = await response.json();
        
        // ফোল্ডারগুলো ফিল্টার করা
        const folders = items.filter(item => item.id === null); // Supabase-এ ফোল্ডারের id null থাকে

        const categoryContainer = document.getElementById('category-tabs') || createCategoryContainer();
        categoryContainer.innerHTML = '';

        if (folders.length === 0) {
            categoryContainer.innerHTML = '<p style="color:white; text-align:center;">কোনো ক্যাটাগরি ফোল্ডার পাওয়া যায়নি।</p>';
            return;
        }

        let isFirst = true;
        for (const folder of folders) {
            const folderName = folder.name;
            
            // ট্যাব বা বাটন তৈরি
            const tabButton = document.createElement('button');
            tabButton.className = `category-tab ${isFirst ? 'active' : ''}`;
            tabButton.innerText = folderName;
            tabButton.onclick = () => loadFolderContent(folderName, tabButton);
            categoryContainer.appendChild(tabButton);

            // প্রথম ফোল্ডারের কন্টেন্ট ডিফল্টভাবে লোড করা
            if (isFirst) {
                loadFolderContent(folderName, tabButton);
                isFirst = false;
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadFolderContent(folderName, selectedButton) {
    // ট্যাবের অ্যাক্টিভ ক্লাস ম্যানেজ করা
    document.querySelectorAll('.category-tab').forEach(btn => btn.classList.remove('active'));
    if (selectedButton) selectedButton.classList.add('active');

    const contentContainer = document.getElementById('playlist-container') || createPlaylistContainer();
    contentContainer.innerHTML = '<p style="color:white; text-align:center;">লোড হচ্ছে...</p>';

    try {
        // নির্দিষ্ট ফোল্ডারের ভেতরের ফাইলগুলো ফেচ করা
        const response = await fetch(STORAGE_LIST_URL, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prefix: `${folderName}/`,
                limit: 100,
                offset: 0,
                sortBy: { column: 'updated_at', order: 'desc' }
            })
        });

        if (!response.ok) throw new Error('Failed to fetch folder contents');

        const files = await response.json();
        
        // শুধু .m3u বা .m3u8 ফাইলগুলো ফিল্টার করা (ফোল্ডার বা ছবি বাদ দিয়ে)
        const m3uFiles = files.filter(file => file.name && (file.name.endsWith('.m3u') || file.name.endsWith('.m3u8')));

        contentContainer.innerHTML = '';

        if (m3uFiles.length === 0) {
            contentContainer.innerHTML = '<p style="color:white; text-align:center;">এই ফোল্ডারে কোনো প্লেলিস্ট ফাইল নেই।</p>';
            return;
        }

        m3uFiles.forEach(file => {
            const fileName = file.name;
            const cleanTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "); // ফাইলের নাম সুন্দর করা
            const filePubUrl = `${STORAGE_URL}/${folderName}/${fileName}`;
            
            // থাম্বনেইল বা ছবির ইউআরএল বের করা (যদি images ফোল্ডারে একই নামে ছবি থাকে)
            const imagePubUrl = `${STORAGE_URL}/${folderName}/images/${fileName.replace(/\.[^/.]+$/, "")}.png`;

            const card = document.createElement('div');
            card.className = 'playlist-card';
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${imagePubUrl}" onerror="this.src='https://via.placeholder.com/300x150?text=IPTV+Stream'" alt="${cleanTitle}">
                </div>
                <div class="card-details">
                    <h3>${cleanTitle}</h3>
                    <a href="${filePubUrl}" class="download-btn" target="_blank">ডাউনলোড / প্লে করুন</a>
                </div>
            `;
            contentContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading folder files:', error);
        contentContainer.innerHTML = '<p style="color:red; text-align:center;">ফাইল লোড করতে সমস্যা হয়েছে।</p>';
    }
}

// প্রয়োজনীয় কন্টেইনার ডাইনামিকলি তৈরি করার ফাংশন (যদি HTML-এ না থাকে)
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
