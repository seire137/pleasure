/* script.js */
const DATA_URL = "./posts/list.json"; 

let allData = [];
let zIndex = 100;
let isMobile = window.innerWidth <= 768;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    updateClock();
    setInterval(updateClock, 1000);
});

// 데이터 가져오기
async function fetchData() {
    try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error("list.json 파일을 찾을 수 없습니다.");
        const json = await res.json();
        allData = json; 
        console.log("Data Loaded:", allData);
        
        renderMobileIcons(); 
    } catch (e) {
        console.error("Fetch Error:", e);
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
    
    if (body.classList.contains('dark-mode')) {
        btn.className = "fi fi-ss-moon";
    } else {
        btn.className = "fi fi-bs-sun";
    }
}

// 윈도우 생성 시스템
function createWindow(id, title, contentHTML, type = 'normal', width = 800, height = 500) {
    const exist = document.getElementById(id);
    if (exist) {
        bringToFront(exist);
        return;
    }

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

function closeWindow(id) {
    const win = document.getElementById(id);
    if (win) win.remove();
}

function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (win.style.width === '100%') {
        win.style.width = '800px';
        win.style.height = '500px';
        win.style.top = '100px';
        win.style.left = '100px';
    } else {
        win.style.width = '100%';
        win.style.height = 'calc(100% - 30px)';
        win.style.top = '30px';
        win.style.left = '0';
    }
}

function bringToFront(elm) {
    elm.style.zIndex = ++zIndex;
}

function dragElement(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.getElementById(elmnt.id + "-header");
    if (header) {
        header.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToFront(elmnt);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// 앱 기능
function openFinder(path) {
    const categories = [...new Set(allData.filter(d => d.type === 'post').map(d => d.category))];
    
    let content = `<div class="finder-layout">
        <div class="finder-sidebar">
            <div style="color:#888; margin-bottom:10px; font-weight:bold;">즐겨찾기</div>
            <div onclick="openFinder('root')" style="cursor:pointer; padding:5px; border-radius:5px;">🏠 Home</div>
            <div style="padding:5px;">📄 Documents</div>
        </div>
        <div class="finder-main">`;

    if (path === 'root') {
        categories.forEach(cat => {
            content += `
            <div class="finder-item" onclick="openFinder('${cat}')">
                <div class="finder-icon">📁</div>
                <div class="finder-name">${cat}</div>
            </div>`;
        });
    } else {
        const posts = allData.filter(d => d.category === path && d.type === 'post');
        if (posts.length === 0) content += `<div style="padding:10px;">글이 없습니다.</div>`;

        posts.forEach((post) => {
            const originalIdx = allData.findIndex(d => d === post);
            content += `
            <div class="finder-item" onclick="openPostDetail(${originalIdx})">
                <div class="finder-icon">📝</div>
                <div class="finder-name">${post.title}</div>
            </div>`;
        });
    }
    content += `</div></div>`;
    createWindow('finder-win', path === 'root' ? 'Home' : path, content, 'finder');
}

async function openPostDetail(idx) {
    const post = allData[idx];
    if(!post) return;

    let contentHTML = `
        <div class="safari-toolbar">
            <div class="url-bar">${post.title}</div>
        </div>
        <div class="post-content" style="display:flex; justify-content:center; align-items:center;">
            <p>Loading...</p>
        </div>
    `;
    
    createWindow('post-' + idx, post.title, contentHTML, 'post');

    try {
        const res = await fetch(`./posts/${post.filename}`);
        if (!res.ok) throw new Error("파일을 불러올 수 없습니다: " + post.filename);
        const textData = await res.text();

        const finalContent = `
            <div style="display:flex; flex-direction:column; height:100%;">
                <div class="safari-toolbar">
                    <div style="display:flex; gap:5px;">
                        <button class="ctrl-btn" style="background:#ff5f56"></button>
                        <button class="ctrl-btn" style="background:#ffbd2e"></button>
                    </div>
                    <div class="url-bar">${post.title}</div>
                    <button onclick="alert('댓글 기능 준비중')">💬</button>
                </div>
                <div class="post-content scroll-content">
                    <h1>${post.title}</h1>
                    <p style="color:#888; font-size:12px; margin-bottom:20px;">
                        ${post.date} | ${post.category}
                    </p>
                    <hr style="opacity:0.2; margin-bottom:20px;">
                    ${textData}
                </div>
            </div>
        `;
        const winBody = document.querySelector(`#post-${idx} .window-body`);
        if(winBody) winBody.innerHTML = finalContent;
    } catch (err) {
        console.error(err);
        const winBody = document.querySelector(`#post-${idx} .window-body`);
        if(winBody) winBody.innerHTML = `<div style="padding:20px;">에러가 발생했습니다.<br>${err}</div>`;
    }
}

function openGallery() {
    let content = `<div class="finder-main"><p style="padding:20px;">갤러리 준비중</p></div>`;
    createWindow('gallery-win', 'Photos', content, 'normal');
}

function openMemo() {
    createWindow('memo-win', 'Notes', '<div style="padding:20px;" contenteditable="true">여기에 메모를 작성하세요...</div>', 'normal', 300, 400);
}

function openGuestbook() {
    const content = `<div class="chat-container">
        <div class="chat-list">
            <div class="chat-bubble chat-you">방명록 기능은 현재 준비중입니다.</div>
        </div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" placeholder="작성 불가" disabled>
        </div>
    </div>`;
    createWindow('guestbook-win', 'Messages', content, 'normal', 350, 600);
}

function openSettings() { alert("관리자 권한이 필요합니다."); }

function openSafari() {
    createWindow('safari-home', 'Safari', '<div style="padding:50px; text-align:center;">Safari Home</div>', 'normal');
}

function toggleCalendar() {
    const cal = document.getElementById('calendar-widget');
    cal.classList.toggle('hidden');
}

function renderMobileIcons() {
    if (!isMobile) return;
    const grid = document.getElementById('mobile-app-grid');
    const categories = [...new Set(allData.filter(d => d.type === 'post').map(d => d.category))];
    
    let html = '';
    categories.forEach(cat => {
        html += `
        <div class="app-icon" onclick="openFinder('${cat}')">
            <div class="icon-box">📁</div>
            <span>${cat}</span>
        </div>`;
    });
    grid.innerHTML = html;
}

window.addEventListener('resize', () => { isMobile = window.innerWidth <= 768; });
