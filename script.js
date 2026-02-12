// 구글 앱스 스크립트 배포 URL (JSON 리턴)
const API_URL = "https://script.google.com/macros/s/AKfycbwWpLrT6SCJvIROr5ZhJXL83GJfd5MumQv5E706TNQ1DMZdJ-tYVOiIdpgAhA9h4NOIdA/exec";

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
        const res = await fetch(API_URL);
        const json = await res.json();
        // 구글 시트 데이터 구조가 { data: [...] } 라고 가정
        // 만약 직접 배열로 온다면 json 자체를 사용
        allData = json.data || json; 
        console.log("Data Loaded:", allData);
        
        renderMobileIcons(); // 모바일 홈 아이콘 렌더링
    } catch (e) {
        console.error("Fetch Error:", e);
        // 테스트용 더미 데이터 (연결 실패시)
        allData = [
            {title: "테스트 게시글", category: "1차", content: "내용입니다.<br>이미지가 있다면 여기에...", date: "2023-10-01", type: "post"},
            {title: "방명록 1", content: "안녕하세요!", type: "guestbook", date: "2023-10-01", author: "visitor"},
            {title: "방명록 2", content: "잘 보고 갑니다.", type: "guestbook", date: "2023-10-02", author: "me"}
        ];
    }
}

// 시계
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateString = now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
    
    const clockEl = document.getElementById('clock');
    if(clockEl) clockEl.innerText = isMobile ? timeString : `${dateString} ${timeString}`;
}

// 테마 토글
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

// 윈도우 생성 시스템 (핵심)
function createWindow(id, title, contentHTML, type = 'normal', width = 800, height = 500) {
    // 이미 열려있으면 포커스만
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
    
    // 위치 랜덤 (데스크탑만)
    if (!isMobile) {
        const top = 100 + Math.random() * 50;
        const left = 100 + Math.random() * 50;
        win.style.top = top + 'px';
        win.style.left = left + 'px';
    }

    // 헤더 (제목 및 컨트롤)
    // 모바일 뒤로가기 버튼 로직 추가
    const backBtn = isMobile && type === 'post' ? `<button class="ctrl-btn" style="background:none; font-size:16px;" onclick="closeWindow('${id}')">🔙</button>` : '';
    
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
            <div style="width:40px;"></div> </div>
    `;

    win.innerHTML = headerHTML + `<div class="window-body">${contentHTML}</div>`;
    
    document.getElementById('window-layer').appendChild(win);
    
    // 이벤트 연결
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
        win.style.height = 'calc(100% - 30px)'; // 탑바 제외
        win.style.top = '30px';
        win.style.left = '0';
    }
}

function bringToFront(elm) {
    elm.style.zIndex = ++zIndex;
}

// 드래그 앤 드롭 (데스크탑)
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

/* === 앱 기능 구현 === */

// 1. Finder (카테고리/폴더)
function openFinder(path) {
    // 카테고리 추출 (중복제거)
    const categories = [...new Set(allData.filter(d => d.type === 'post').map(d => d.category))];
    
    let content = `<div class="finder-layout">
        <div class="finder-sidebar">
            <div>즐겨찾기</div>
            <div onclick="openFinder('root')" style="cursor:pointer">🏠 Home</div>
            <div>📄 Documents</div>
        </div>
        <div class="finder-main">`;

    if (path === 'root') {
        // 상위 카테고리 폴더 표시
        categories.forEach(cat => {
            content += `
            <div class="finder-item" onclick="openFinder('${cat}')">
                <div class="finder-icon">📁</div>
                <div class="finder-name">${cat}</div>
            </div>`;
        });
    } else {
        // 해당 카테고리의 글 목록 표시
        const posts = allData.filter(d => d.category === path && d.type === 'post');
        posts.forEach((post, idx) => {
            content += `
            <div class="finder-item" onclick="openPostDetail(${idx})">
                <div class="finder-icon">📝</div>
                <div class="finder-name">${post.title}</div>
            </div>`;
        });
    }
    content += `</div></div>`;
    
    createWindow('finder-win', path === 'root' ? 'Home' : path, content, 'finder');
}

// 2. 게시글 상세 (메인)
function openPostDetail(idx) {
    // 전체 데이터 중 idx번째 (실제 구현시엔 고유 ID 사용 권장)
    // 여기선 편의상 필터링된 인덱스가 아니라 전체 데이터 검색 필요. 
    // 간소화를 위해 제목으로 찾는다고 가정
    const post = allData.filter(d => d.type === 'post')[idx]; 
    if(!post) return;

    const content = `
        <div style="display:flex; flex-direction:column; height:100%;">
            <div class="safari-toolbar">
                <div style="display:flex; gap:5px;">
                    <button>◀</button><button>▶</button>
                </div>
                <div class="url-bar">${post.title}</div>
                <button onclick="openGuestbook()">💬</button>
            </div>
            <div class="scroll-content post-content">
                <h1>${post.title}</h1>
                <p style="color:#888; font-size:12px;">${post.date} | ${post.category}</p>
                <hr>
                ${post.content}
            </div>
        </div>
    `;
    createWindow('post-' + idx, post.title, content, 'post');
}

// 3. 방명록 (메세지)
function openGuestbook() {
    const msgs = allData.filter(d => d.type === 'guestbook');
    let listHTML = `<div class="chat-list">`;
    
    msgs.forEach(msg => {
        const isMe = msg.author === 'me'; // 구글시트에 author 컬럼 필요
        const cls = isMe ? 'chat-me' : 'chat-you';
        listHTML += `<div class="chat-bubble ${cls}">${msg.content}</div>`;
    });
    listHTML += `</div>`;

    const inputHTML = `
        <div class="chat-input-area">
            <input type="text" class="chat-input" placeholder="iMessage">
        </div>
    `;

    const content = `<div class="chat-container">${listHTML}${inputHTML}</div>`;
    createWindow('guestbook-win', 'Messages', content, 'normal', 350, 600);
}

// 4. 갤러리 (이미지 모아보기)
function openGallery() {
    // 게시글 내용 중 img 태그 src 추출 (간이 구현)
    let images = [];
    allData.filter(d => d.type === 'post').forEach(p => {
        const div = document.createElement('div');
        div.innerHTML = p.content;
        const imgs = div.querySelectorAll('img');
        imgs.forEach(img => images.push(img.src));
    });

    let html = `<div class="finder-main" style="grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));">`;
    if(images.length === 0) html += `<p style="padding:20px;">이미지가 없습니다.</p>`;
    
    images.forEach(src => {
        html += `<div class="finder-item"><img src="${src}" style="width:100%; height:100px; object-fit:cover; border-radius:5px;"></div>`;
    });
    html += `</div>`;
    
    createWindow('gallery-win', 'Photos', html, 'normal');
}

// 5. 설정
function openSettings() {
    alert("권한이 없습니다.");
    // 관리자라면 location.href = 'GITHUB_REPO_URL';
}

// 6. 캘린더 위젯 토글
function toggleCalendar() {
    const cal = document.getElementById('calendar-widget');
    cal.classList.toggle('hidden');
}

// 모바일 아이콘 렌더링
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

// 리사이즈 감지 (모바일/데스크탑 전환)
window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 768;
    // 필요 시 UI 새로고침 로직 추가
});