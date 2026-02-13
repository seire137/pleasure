/* script.js */
const DATA_URL = "./posts/list.json"; 
const FIXED_CATEGORIES = ['1차', '2차', '기타'];

let allData = [];
let zIndex = 100;
let isMobile = window.innerWidth <= 768;

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    updateClock();
    setInterval(updateClock, 1000);
});

async function fetchData() {
    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error("Load Failed");
        allData = await res.json();
        renderMobileIcons(); 
    } catch (e) {
        console.error(e);
        allData = [];
    }
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateString = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = isMobile ? timeString : `${dateString} ${timeString}`;
}

function toggleTheme() {
    const body = document.body;
    const btn = document.querySelector('#theme-toggle i');
    body.classList.toggle('dark-mode');
    btn.className = body.classList.contains('dark-mode') ? "fi fi-ss-moon" : "fi fi-bs-sun";
}

function createWindow(id, title, contentHTML, type = 'normal', width = 800, height = 500) {
    const exist = document.getElementById(id);
    if (exist) { bringToFront(exist); return; }

    const win = document.createElement('div');
    win.className = 'mac-window';
    win.id = id;
    win.style.width = isMobile ? '100%' : width + 'px';
    win.style.height = isMobile ? '100%' : height + 'px';
    win.style.zIndex = ++zIndex;
    
    if (!isMobile) {
        const top = 100 + Math.random() * 50;
        const left = 100 + Math.random() * 50;
        win.style.top = top + 'px';
        win.style.left = left + 'px';
    }

    const backBtn = (isMobile && type === 'post') 
        ? `<button class="ctrl-btn" style="background:none; font-size:16px;" onclick="closeWindow('${id}')">🔙</button>` 
        : '';
    
    const controls = isMobile ? 
        (type === 'post' ? backBtn : `<button class="ctrl-btn close-btn" onclick="closeWindow('${id}')"></button>`) : 
        `<div class="controls">
            <button class="ctrl-btn close-btn" onclick="closeWindow('${id}')"></button>
            <button class="ctrl-btn min-btn"></button>
            <button class="ctrl-btn max-btn" onclick="maximizeWindow('${id}')"></button>
        </div>`;

    let headerHTML = `
        <div class="window-header" id="${id}-header">
            ${controls}
            <div class="window-title">${title}</div>
            <div style="width:40px;"></div>
        </div>
    `;

    win.innerHTML = headerHTML + `<div class="window-body">${contentHTML}</div>`;
    document.getElementById('window-layer').appendChild(win);
    
    if (!isMobile) {
        dragElement(win);
        win.addEventListener('mousedown', () => bringToFront(win));
    }
}

function closeWindow(id) { document.getElementById(id)?.remove(); }
function bringToFront(elm) { elm.style.zIndex = ++zIndex; }
function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (win.style.width === '100%') {
        win.style.width = '800px'; win.style.height = '500px'; win.style.top = '100px'; win.style.left = '100px';
    } else {
        win.style.width = '100%'; win.style.height = 'calc(100% - 30px)'; win.style.top = '30px'; win.style.left = '0';
    }
}

/* === Finder (카테고리 & 태그) === */
function openFinder(mode, value) {
    let allTags = new Set();
    allData.forEach(d => { if(d.tags) d.tags.forEach(t => allTags.add(t)); });

    let sidebar = `
        <div class="finder-sidebar">
            <div class="sidebar-group">Favorites</div>
            <div class="sidebar-item" onclick="openFinder('root')">🏠 Home</div>
            <div class="sidebar-item" onclick="openFinder('all')">📚 All Posts</div>
            <div class="sidebar-group">Tags</div>
            ${[...allTags].map(tag => `<div class="sidebar-item" onclick="openFinder('tag', '${tag}')"># ${tag}</div>`).join('')}
        </div>
    `;

    let mainContent = `<div class="finder-main">`;

    if (mode === 'root' || !mode) {
        FIXED_CATEGORIES.forEach(cat => {
            mainContent += `
            <div class="finder-item" onclick="openFinder('category', '${cat}')">
                <div class="finder-icon">📁</div>
                <div class="finder-name">${cat}</div>
            </div>`;
        });
    } else {
        let posts = [];
        if (mode === 'category') posts = allData.filter(d => d.category === value && d.type === 'post');
        else if (mode === 'tag') posts = allData.filter(d => d.tags && d.tags.includes(value) && d.type === 'post');
        else if (mode === 'all') posts = allData.filter(d => d.type === 'post');

        if (posts.length === 0) mainContent += `<div style="padding:20px; color:#666;">게시글이 없습니다.</div>`;
        else {
            posts.forEach(post => {
                const idx = allData.indexOf(post);
                mainContent += `
                <div class="finder-item" onclick="openPostDetail(${idx})">
                    <div class="finder-icon">📝</div>
                    <div class="finder-name">${post.title}</div>
                </div>`;
            });
        }
    }
    mainContent += `</div>`;
    createWindow('finder-win', value ? value : 'Home', `<div class="finder-layout">${sidebar}${mainContent}</div>`, 'finder');
}

/* === 검색 기능 (리스트 뷰) === */
function openSearch() {
    let sidebar = `
        <div class="finder-sidebar">
            <div class="sidebar-group">Search</div>
            <div class="sidebar-item" style="background:var(--list-hover)">🔍 Results</div>
        </div>
    `;

    let content = `
        <div class="finder-layout">
            ${sidebar}
            <div style="flex:1; display:flex; flex-direction:column;">
                <div class="search-bar-container">
                    <span>🔍</span>
                    <input type="text" id="search-input" class="search-input" placeholder="검색어 입력 (제목, 내용, 태그)..." onkeyup="performSearch(this.value)">
                </div>
                <div class="list-header">
                    <div class="col-name">이름</div>
                    <div class="col-date">날짜</div>
                </div>
                <div id="search-results" style="flex:1; overflow-y:auto;">
                    <div style="padding:20px; color:#888; text-align:center;">검색어를 입력하세요.</div>
                </div>
            </div>
        </div>
    `;
    createWindow('search-win', 'Search', content, 'search');
    setTimeout(() => document.getElementById('search-input').focus(), 100);
}

function performSearch(query) {
    const container = document.getElementById('search-results');
    if (!query) {
        container.innerHTML = `<div style="padding:20px; color:#888; text-align:center;">검색어를 입력하세요.</div>`;
        return;
    }

    const lowerQ = query.toLowerCase();
    const results = allData.filter(d => {
        if (d.type !== 'post') return false;
        return d.title.toLowerCase().includes(lowerQ) ||
               (d.tags && d.tags.some(t => t.toLowerCase().includes(lowerQ))) ||
               (d.content_text && d.content_text.toLowerCase().includes(lowerQ));
    });

    if (results.length === 0) {
        container.innerHTML = `<div style="padding:20px; color:#888; text-align:center;">결과가 없습니다.</div>`;
        return;
    }

    let html = `<div class="finder-list-view">`;
    results.forEach(post => {
        const idx = allData.indexOf(post);
        let snippet = post.content_text || "";
        if(snippet.length > 50) snippet = snippet.substring(0, 50) + "...";

        html += `
        <div class="list-row" onclick="openPostDetail(${idx})">
            <div class="list-icon">📝</div>
            <div class="list-info col-name">
                <div class="list-title">${post.title}</div>
                <div class="list-sub">${snippet}</div>
            </div>
            <div class="list-date col-date">${post.date}</div>
        </div>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

/* === 게시글 상세 === */
async function openPostDetail(idx) {
    const post = allData[idx];
    if(!post) return;

    const tagsHTML = post.tags && post.tags.length > 0 
        ? `<div style="margin-bottom:15px;">` + post.tags.map(t => `<span class="tag-badge">#${t}</span>`).join('') + `</div>`
        : '';

    createWindow('post-' + idx, post.title, `
        <div class="safari-toolbar">
            <div class="url-bar">${post.title}</div>
        </div>
        <div class="post-content scroll-content">
            <h1>${post.title}</h1>
            <p style="color:#888; font-size:13px; margin-bottom:10px;">${post.date} | ${post.category}</p>
            ${tagsHTML}
            <hr style="opacity:0.2; margin:20px 0;">
            <div id="post-body-${idx}">Loading...</div>
        </div>
    `, 'post');

    try {
        const res = await fetch(`./posts/${post.filename}`);
        if (!res.ok) throw new Error("File not found");
        const text = await res.text();
        document.getElementById(`post-body-${idx}`).innerHTML = text;
    } catch (e) {
        document.getElementById(`post-body-${idx}`).innerHTML = "내용을 불러올 수 없습니다.";
    }
}

// 기타 기능
function openGallery() { createWindow('gallery-win', 'Photos', '<div class="finder-main" style="padding:20px;">갤러리 준비중</div>', 'normal'); }
function openMemo() { createWindow('memo-win', 'Notes', '<div style="padding:20px;" contenteditable="true">메모...</div>', 'normal', 300, 400); }
function openGuestbook() { createWindow('guestbook-win', 'Messages', '<div class="finder-main" style="padding:20px;">방명록 준비중</div>', 'normal', 350, 600); }
function openSettings() { alert("관리자 권한이 필요합니다."); }
function openSafari() { createWindow('safari-win', 'Safari', '<div style="padding:50px; text-align:center;">Safari Home</div>', 'normal'); }
function toggleCalendar() { document.getElementById('calendar-widget').classList.toggle('hidden'); }
document.getElementById('search-btn').onclick = openSearch;

function dragElement(elmnt) {
    let pos1=0, pos2=0, pos3=0, pos4=0;
    const header = document.getElementById(elmnt.id + "-header");
    if(header) header.onmousedown = dragMouseDown;
    function dragMouseDown(e) { e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = closeDragElement; document.onmousemove = elementDrag; bringToFront(elmnt); }
    function elementDrag(e) { e.preventDefault(); pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY; pos3 = e.clientX; pos4 = e.clientY; elmnt.style.top = (elmnt.offsetTop - pos2) + "px"; elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"; }
    function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
}

function renderMobileIcons() {
    if (!isMobile) return;
    const grid = document.getElementById('mobile-app-grid');
    let html = '';
    FIXED_CATEGORIES.forEach(cat => {
        html += `<div class="app-icon" onclick="openFinder('category', '${cat}')"><div class="icon-box">📁</div><span>${cat}</span></div>`;
    });
    grid.innerHTML = html;
}

window.addEventListener('resize', () => { isMobile = window.innerWidth <= 768; });
