const TIMEZONES = [
    { id: 'Pacific/Auckland', city: 'オークランド', country: 'ニュージーランド', offset: 12 },
    { id: 'Australia/Sydney', city: 'シドニー', country: 'オーストラリア', offset: 10 },
    { id: 'Asia/Tokyo', city: '東京', country: '日本', offset: 9 },
    { id: 'Asia/Seoul', city: 'ソウル', country: '韓国', offset: 9 },
    { id: 'Asia/Shanghai', city: '上海', country: '中国', offset: 8 },
    { id: 'Asia/Hong_Kong', city: '香港', country: '香港', offset: 8 },
    { id: 'Asia/Singapore', city: 'シンガポール', country: 'シンガポール', offset: 8 },
    { id: 'Asia/Bangkok', city: 'バンコク', country: 'タイ', offset: 7 },
    { id: 'Asia/Jakarta', city: 'ジャカルタ', country: 'インドネシア', offset: 7 },
    { id: 'Asia/Kolkata', city: 'ムンバイ', country: 'インド', offset: 5.5 },
    { id: 'Asia/Dubai', city: 'ドバイ', country: 'UAE', offset: 4 },
    { id: 'Europe/Moscow', city: 'モスクワ', country: 'ロシア', offset: 3 },
    { id: 'Europe/Istanbul', city: 'イスタンブール', country: 'トルコ', offset: 3 },
    { id: 'Africa/Cairo', city: 'カイロ', country: 'エジプト', offset: 2 },
    { id: 'Europe/Paris', city: 'パリ', country: 'フランス', offset: 1 },
    { id: 'Europe/Berlin', city: 'ベルリン', country: 'ドイツ', offset: 1 },
    { id: 'Europe/Rome', city: 'ローマ', country: 'イタリア', offset: 1 },
    { id: 'Europe/Madrid', city: 'マドリード', country: 'スペイン', offset: 1 },
    { id: 'Europe/London', city: 'ロンドン', country: 'イギリス', offset: 0 },
    { id: 'Atlantic/Reykjavik', city: 'レイキャビク', country: 'アイスランド', offset: 0 },
    { id: 'America/Sao_Paulo', city: 'サンパウロ', country: 'ブラジル', offset: -3 },
    { id: 'America/New_York', city: 'ニューヨーク', country: 'アメリカ', offset: -5 },
    { id: 'America/Toronto', city: 'トロント', country: 'カナダ', offset: -5 },
    { id: 'America/Chicago', city: 'シカゴ', country: 'アメリカ', offset: -6 },
    { id: 'America/Denver', city: 'デンバー', country: 'アメリカ', offset: -7 },
    { id: 'America/Los_Angeles', city: 'ロサンゼルス', country: 'アメリカ', offset: -8 },
    { id: 'America/Vancouver', city: 'バンクーバー', country: 'カナダ', offset: -8 },
    { id: 'America/Anchorage', city: 'アンカレッジ', country: 'アメリカ', offset: -9 },
    { id: 'Pacific/Honolulu', city: 'ホノルル', country: 'アメリカ', offset: -10 }
];

let clocks = JSON.parse(localStorage.getItem('world_clocks') || '[]');
const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

function saveClocks() {
    localStorage.setItem('world_clocks', JSON.stringify(clocks));
}

function formatTime(date, tz) {
    return date.toLocaleTimeString('ja-JP', { 
        timeZone: tz, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false 
    });
}

function formatDate(date, tz) {
    return date.toLocaleDateString('ja-JP', { 
        timeZone: tz, 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    });
}

function getOffset(tz) {
    const now = new Date();
    const localOffset = now.getTimezoneOffset();
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const diff = (targetDate - now) / (1000 * 60 * 60) + localOffset / 60;
    return Math.round(diff * 2) / 2;
}

function formatOffset(offset) {
    const sign = offset >= 0 ? '+' : '';
    const hours = Math.floor(Math.abs(offset));
    const mins = (Math.abs(offset) % 1) * 60;
    return `UTC${sign}${offset}${mins ? ':30' : ''}`;
}

function updateClocks() {
    const now = new Date();
    
    // Local time
    document.getElementById('localTime').textContent = formatTime(now, localTz);
    document.getElementById('localDate').textContent = formatDate(now, localTz);
    document.getElementById('localTimezone').textContent = localTz + ' (' + formatOffset(getOffset(localTz)) + ')';
    
    // Other clocks
    clocks.forEach((clock, i) => {
        const timeEl = document.getElementById(`clock-time-${i}`);
        const dateEl = document.getElementById(`clock-date-${i}`);
        if (timeEl) {
            timeEl.textContent = formatTime(now, clock.tz);
            dateEl.textContent = formatDate(now, clock.tz);
        }
    });
}

function renderClocks() {
    const grid = document.getElementById('clocksGrid');
    const localOffset = getOffset(localTz);
    
    let html = clocks.map((clock, i) => {
        const offset = getOffset(clock.tz);
        const diff = offset - localOffset;
        const diffStr = diff === 0 ? '同じ' : (diff > 0 ? `+${diff}時間` : `${diff}時間`);
        const diffClass = diff === 0 ? '' : (diff > 0 ? 'ahead' : 'behind');
        
        return `
            <div class="clock-card">
                <div class="clock-header">
                    <div>
                        <div class="clock-city">${clock.city}</div>
                        <div class="clock-country">${clock.country}</div>
                    </div>
                    <button class="remove-btn" onclick="removeClock(${i})">×</button>
                </div>
                <div class="clock-time" id="clock-time-${i}">--:--:--</div>
                <div class="clock-date" id="clock-date-${i}">----年--月--日</div>
                <span class="clock-offset ${diffClass}">${diffStr}</span>
            </div>
        `;
    }).join('');
    
    html += `
        <div class="add-clock" onclick="openModal()">
            <span>+</span>
            <p>時計を追加</p>
        </div>
    `;
    
    grid.innerHTML = html;
    updateClocks();
}

function addClock(tz, city, country) {
    if (clocks.some(c => c.tz === tz)) return;
    clocks.push({ tz, city, country });
    saveClocks();
    renderClocks();
}

function addQuickCity(tz, city, country) {
    addClock(tz, city, country);
}

function removeClock(index) {
    clocks.splice(index, 1);
    saveClocks();
    renderClocks();
}

// Modal
function openModal() {
    document.getElementById('modal').classList.add('show');
    renderTimezoneList();
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

function renderTimezoneList(filter = '') {
    const list = document.getElementById('tzList');
    const filtered = TIMEZONES.filter(tz => 
        tz.city.toLowerCase().includes(filter.toLowerCase()) ||
        tz.country.toLowerCase().includes(filter.toLowerCase()) ||
        tz.id.toLowerCase().includes(filter.toLowerCase())
    );
    
    list.innerHTML = filtered.map(tz => `
        <div class="timezone-item" onclick="selectTimezone('${tz.id}', '${tz.city}', '${tz.country}')">
            <span class="timezone-item-name">${tz.city}, ${tz.country}</span>
            <span class="timezone-item-offset">${formatOffset(tz.offset)}</span>
        </div>
    `).join('');
}

function selectTimezone(tz, city, country) {
    addClock(tz, city, country);
    closeModal();
}

document.getElementById('tzSearch').addEventListener('input', (e) => {
    renderTimezoneList(e.target.value);
});

// Converter
function populateSelects() {
    const fromSel = document.getElementById('fromTz');
    const toSel = document.getElementById('toTz');
    
    const options = TIMEZONES.map(tz => 
        `<option value="${tz.id}">${tz.city} (${formatOffset(tz.offset)})</option>`
    ).join('');
    
    fromSel.innerHTML = options;
    toSel.innerHTML = options;
    
    // Set defaults
    const tokyoIdx = TIMEZONES.findIndex(t => t.id === 'Asia/Tokyo');
    const nyIdx = TIMEZONES.findIndex(t => t.id === 'America/New_York');
    if (tokyoIdx >= 0) fromSel.selectedIndex = tokyoIdx;
    if (nyIdx >= 0) toSel.selectedIndex = nyIdx;
    
    // Set current time
    const now = new Date();
    const local = now.toISOString().slice(0, 16);
    document.getElementById('fromTime').value = local;
}

function convertTime() {
    const fromTz = document.getElementById('fromTz').value;
    const toTz = document.getElementById('toTz').value;
    const fromTimeStr = document.getElementById('fromTime').value;
    
    if (!fromTimeStr) return;
    
    const fromDate = new Date(fromTimeStr);
    
    document.getElementById('fromResult').textContent = formatTime(fromDate, fromTz);
    document.getElementById('toResult').textContent = formatTime(fromDate, toTz);
}

document.getElementById('fromTz').addEventListener('change', convertTime);
document.getElementById('toTz').addEventListener('change', convertTime);
document.getElementById('fromTime').addEventListener('input', convertTime);

// Initialize
populateSelects();
renderClocks();
convertTime();
setInterval(updateClocks, 1000);

// Close modal on outside click
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});
