// 地震情報サイト - JavaScript（高機能版）

// 設定管理
const CONFIG = {
    UPDATE_INTERVAL: 60000, // デフォルト: 1分
    API_ENDPOINTS: {
        JMA: 'https://www.jma.go.jp/bosai/quake/data/list.json',
    },
    DISPLAY_COUNT: 10,
    CACHE_DURATION: 5 * 60 * 1000, // 5分
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
};

// グローバル変数
let earthquakeData = [];
let filteredData = [];
let updateTimer = null;
let currentView = 'list';
let displayCount = 10;
let settings = {
    notifyAll: false,
    notifyStrong: true,
    notifyEEW: true,
    sound: 'default',
    theme: 'light',
    updateInterval: 60,
    displayCount: 10,
    region: 'all',
    filterRegion: false,
};

// ローカルストレージキー
const STORAGE_KEYS = {
    SETTINGS: 'earthquake_settings',
    CACHE: 'earthquake_cache',
    LAST_UPDATE: 'earthquake_last_update',
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌏 地震情報サイトを初期化中...');
    loadSettings();
    applyTheme();
    setupEventListeners();
    loadEarthquakeData();
    startAutoUpdate();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    console.log('✅ 初期化完了');
});

// イベントリスナー設定
function setupEventListeners() {
    // フィルター
    const shindoFilter = document.getElementById('shindo-filter');
    const periodFilter = document.getElementById('period-filter');
    const searchInput = document.getElementById('search-input');
    const sortOrder = document.getElementById('sort-order');
    
    if (shindoFilter) shindoFilter.addEventListener('change', () => processEarthquakeData());
    if (periodFilter) periodFilter.addEventListener('change', () => processEarthquakeData());
    if (searchInput) searchInput.addEventListener('input', debounce(() => processEarthquakeData(), 500));
    if (sortOrder) sortOrder.addEventListener('change', () => processEarthquakeData());
}

// デバウンス関数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// データ取得
async function loadEarthquakeData(retryCount = 0) {
    try {
        updateConnectionStatus('loading');
        console.log('🔄 地震データを取得中...');
        
        const cachedData = getCachedData();
        if (cachedData) {
            console.log('📦 キャッシュからデータを読み込みました');
            earthquakeData = cachedData;
            processEarthquakeData();
            updateConnectionStatus('connected');
            return;
        }
        
        const response = await fetchWithTimeout(CONFIG.API_ENDPOINTS.JMA, 10000);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('データが空または不正です');
        }
        
        earthquakeData = data;
        cacheData(data);
        processEarthquakeData();
        updateLastUpdateTime();
        updateConnectionStatus('connected');
        console.log(`✅ ${earthquakeData.length}件の地震データを取得しました`);
        
    } catch (error) {
        console.error('❌ 地震データの取得に失敗:', error);
        
        if (retryCount < CONFIG.MAX_RETRIES) {
            console.log(`🔄 ${CONFIG.RETRY_DELAY / 1000}秒後にリトライします (${retryCount + 1}/${CONFIG.MAX_RETRIES})...`);
            updateConnectionStatus('error');
            setTimeout(() => loadEarthquakeData(retryCount + 1), CONFIG.RETRY_DELAY);
        } else {
            updateConnectionStatus('error');
            displayError(error.message);
            showNotification('エラー', 'データの取得に失敗しました', 'error');
        }
    }
}

// タイムアウト付きfetch
function fetchWithTimeout(url, timeout = 10000) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('タイムアウト')), timeout)
        )
    ]);
}

// データ処理
function processEarthquakeData() {
    applyFilters();
    updateDashboard();
    displayCurrentActivity();
    displayRecentEarthquakes();
    updateStatistics();
    checkEEW();
    renderShindoChart();
}

// フィルタ適用
function applyFilters() {
    const shindoFilter = document.getElementById('shindo-filter')?.value || 'all';
    const periodFilter = document.getElementById('period-filter')?.value || '24h';
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const sortOrder = document.getElementById('sort-order')?.value || 'time-desc';
    
    const now = new Date();
    const periodMs = getPeriodMs(periodFilter);
    
    filteredData = earthquakeData.filter(quake => {
        const quakeTime = new Date(quake.at || quake.time);
        const timeDiff = now - quakeTime;
        
        if (timeDiff > periodMs) return false;
        
        const shindo = parseShindo(quake.maxInt || quake.shindo);
        if (shindoFilter !== 'all' && shindo < parseInt(shindoFilter) * 10) return false;
        
        if (searchTerm) {
            const location = (quake.hypocenter?.name || '').toLowerCase();
            if (!location.includes(searchTerm)) return false;
        }
        
        if (settings.filterRegion && settings.region !== 'all') {
            const location = quake.hypocenter?.name || '';
            if (!isInRegion(location, settings.region)) return false;
        }
        
        return true;
    });
    
    sortData(filteredData, sortOrder);
}

// データソート
function sortData(data, order) {
    switch (order) {
        case 'time-asc':
            data.sort((a, b) => new Date(a.at || a.time) - new Date(b.at || b.time));
            break;
        case 'time-desc':
            data.sort((a, b) => new Date(b.at || b.time) - new Date(a.at || a.time));
            break;
        case 'mag-desc':
            data.sort((a, b) => (parseFloat(b.mag) || 0) - (parseFloat(a.mag) || 0));
            break;
        case 'shindo-desc':
            data.sort((a, b) => parseShindo(b.maxInt || b.shindo) - parseShindo(a.maxInt || a.shindo));
            break;
    }
}

// 期間をミリ秒に変換
function getPeriodMs(period) {
    const periods = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return periods[period] || periods['24h'];
}

// 地域判定
function isInRegion(location, region) {
    const regionMap = {
        'hokkaido': ['北海道'],
        'tohoku': ['青森', '岩手', '宮城', '秋田', '山形', '福島'],
        'kanto': ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'],
        'chubu': ['新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知'],
        'kinki': ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'],
        'chugoku': ['鳥取', '島根', '岡山', '広島', '山口'],
        'shikoku': ['徳島', '香川', '愛媛', '高知'],
        'kyushu': ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島'],
        'okinawa': ['沖縄'],
    };
    
    const prefectures = regionMap[region] || [];
    return prefectures.some(pref => location.includes(pref));
}

// ダッシュボード更新
function updateDashboard() {
    if (filteredData.length > 0) {
        const latest = filteredData[0];
        document.getElementById('latest-quake-info').innerHTML = `
            <div style="font-size: 0.9rem;">
                <strong>${latest.hypocenter?.name || '震源地不明'}</strong><br>
                M${latest.mag || '?'} / 震度${formatShindo(latest.maxInt || latest.shindo)}<br>
                <small>${formatDateTime(latest.at || latest.time)}</small>
            </div>
        `;
    } else {
        document.getElementById('latest-quake-info').textContent = 'データなし';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = earthquakeData.filter(q => {
        const qDate = new Date(q.at || q.time);
        return qDate >= today;
    }).length;
    document.getElementById('today-count').textContent = todayCount;
}

// 現在の地震活動表示
function displayCurrentActivity() {
    const activityElement = document.getElementById('current-activity');
    
    if (!filteredData || filteredData.length === 0) {
        activityElement.innerHTML = '<p style="color: var(--success-color);">✅ 現在、顕著な地震活動はありません</p>';
        activityElement.classList.remove('loading');
        return;
    }
    
    const latestQuake = filteredData[0];
    const shindo = parseShindo(latestQuake.maxInt || latestQuake.shindo);
    const statusClass = shindo >= 50 ? 'status-danger' : shindo >= 40 ? 'status-warning' : 'status-normal';
    
    const activityHTML = `
        <div class="activity-summary">
            <p><strong style="font-size: 1.2rem;">最新の地震:</strong></p>
            <p class="${statusClass}"><strong>発生時刻:</strong> ${formatDateTime(latestQuake.at || latestQuake.time)}</p>
            <p><strong>震源地:</strong> ${latestQuake.hypocenter?.name || '情報なし'}</p>
            <p><strong>マグニチュード:</strong> M${latestQuake.mag || '不明'}</p>
            <p><strong>最大震度:</strong> <span class="${statusClass}">${formatShindo(latestQuake.maxInt || latestQuake.shindo)}</span></p>
            ${latestQuake.depth ? `<p><strong>深さ:</strong> ${latestQuake.depth}km</p>` : ''}
            <p class="update-time">⏰ 最終更新: ${new Date().toLocaleTimeString('ja-JP')}</p>
        </div>
    `;
    
    activityElement.innerHTML = activityHTML;
    activityElement.classList.remove('loading');
}

// 最近の地震情報表示
function displayRecentEarthquakes() {
    const listElement = document.getElementById('recent-list');
    
    if (!filteredData || filteredData.length === 0) {
        listElement.innerHTML = '<div class="loading-placeholder"><p>条件に一致する地震情報はありません</p></div>';
        return;
    }
    
    const displayData = filteredData.slice(0, displayCount);
    
    let listHTML = '';
    displayData.forEach((quake, index) => {
        const shindo = parseShindo(quake.maxInt || quake.shindo);
        const className = getEarthquakeClass(shindo);
        
        listHTML += `
            <div class="earthquake-item ${className}" onclick="showEarthquakeDetail(${index})" role="button" tabindex="0">
                <div class="eq-time">⏰ ${formatDateTime(quake.at || quake.time)}</div>
                <div class="eq-location"><strong>📍 ${quake.hypocenter?.name || '震源地不明'}</strong></div>
                <div class="eq-details">
                    <span>🔢 M${quake.mag || '不明'}</span> |
                    <span>📊 最大震度: <strong>${formatShindo(shindo)}</strong></span>
                    ${quake.depth ? ` | <span>📏 深さ: ${quake.depth}km</span>` : ''}
                </div>
            </div>
        `;
    });
    
    listElement.innerHTML = listHTML;
    listElement.className = `earthquake-list ${currentView === 'grid' ? 'grid-view' : ''}`;
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = displayCount < filteredData.length ? 'inline-flex' : 'none';
    }
}

// EEWチェック
function checkEEW() {
    const eewElement = document.getElementById('eew-info');
    const eewStatus = document.getElementById('eew-status');
    
    const hasEEW = false; // 実際のAPIから取得
    
    if (hasEEW) {
        eewElement.innerHTML = `
            <div class="status-indicator-large">
                <span class="status-dot-large danger"></span>
                <span style="color: var(--danger-color); font-weight: bold;">⚠️ 緊急地震速報が発表されています！</span>
            </div>
            <p class="update-time">最終確認: ${new Date().toLocaleTimeString('ja-JP')}</p>
        `;
        
        if (eewStatus) {
            eewStatus.className = 'status-danger';
            eewStatus.textContent = '発表中';
        }
        
        showEmergencyBanner('緊急地震速報が発表されています！身の安全を確保してください！');
    } else {
        eewElement.innerHTML = `
            <div class="status-indicator-large">
                <span class="status-dot-large ok"></span>
                <span>✅ 現在、緊急地震速報は発表されていません</span>
            </div>
            <p class="update-time">最終確認: ${new Date().toLocaleTimeString('ja-JP')}</p>
        `;
        
        if (eewStatus) {
            eewStatus.className = 'status-normal';
            eewStatus.textContent = '現在なし';
        }
    }
}

// 統計更新
function updateStatistics() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekData = earthquakeData.filter(q => new Date(q.at || q.time) >= weekAgo);
    
    document.getElementById('week-total').textContent = weekData.length;
    
    const maxShindo = Math.max(...weekData.map(q => parseShindo(q.maxInt || q.shindo)));
    document.getElementById('week-max-shindo').textContent = maxShindo > 0 ? formatShindo(maxShindo) : '-';
    
    const maxMag = Math.max(...weekData.map(q => parseFloat(q.mag) || 0));
    document.getElementById('week-max-mag').textContent = maxMag > 0 ? `M${maxMag.toFixed(1)}` : '-';
    
    const strongCount = weekData.filter(q => parseShindo(q.maxInt || q.shindo) >= 40).length;
    document.getElementById('week-strong').textContent = `${strongCount}回`;
}

// 震度グラフ描画
function renderShindoChart() {
    const chartElement = document.getElementById('shindo-chart');
    if (!chartElement) return;
    
    const shindoCounts = {
        '1': 0, '2': 0, '3': 0, '4': 0, '5弱': 0, '5強': 0, '6弱': 0, '6強': 0, '7': 0
    };
    
    filteredData.forEach(q => {
        const shindo = formatShindo(q.maxInt || q.shindo);
        if (shindoCounts.hasOwnProperty(shindo)) {
            shindoCounts[shindo]++;
        }
    });
    
    let chartHTML = '<div style="padding: 1rem;">';
    for (const [shindo, count] of Object.entries(shindoCounts)) {
        if (count > 0) {
            const barWidth = Math.min((count / filteredData.length) * 100, 100);
            chartHTML += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
                        <span style="width: 60px; font-weight: bold;">震度${shindo}</span>
                        <span style="margin-left: 1rem; color: var(--gray-600);">${count}回</span>
                    </div>
                    <div style="background: var(--gray-300); height: 24px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--secondary-color); height: 100%; width: ${barWidth}%; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }
    }
    chartHTML += '</div>';
    
    chartElement.innerHTML = chartHTML || '<p style="text-align: center; color: var(--gray-600);">データなし</p>';
}

// UI操作関数
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    displayRecentEarthquakes();
}

function loadMoreEarthquakes() {
    displayCount += 10;
    displayRecentEarthquakes();
}

function showEarthquakeDetail(index) {
    const quake = filteredData[index];
    if (!quake) return;
    
    const detail = `
🌏 地震詳細情報

📅 発生時刻: ${formatDateTime(quake.at || quake.time)}
📍 震源地: ${quake.hypocenter?.name || '不明'}
🔢 マグニチュード: ${quake.mag || '不明'}
📊 最大震度: ${formatShindo(quake.maxInt || quake.shindo)}
📏 深さ: ${quake.depth ? quake.depth + 'km' : '不明'}
${quake.tsunami ? '🌊 津波: ' + quake.tsunami : ''}
    `.trim();
    
    alert(detail);
}

function showEmergencyBanner(message) {
    const banner = document.getElementById('emergency-banner');
    const text = banner?.querySelector('.emergency-text');
    if (banner && text) {
        text.textContent = message;
        banner.classList.remove('hidden');
    }
}

function closeEmergencyBanner() {
    document.getElementById('emergency-banner')?.classList.add('hidden');
}

// 設定関連
function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
            applySettings();
        }
    } catch (e) {
        console.error('設定の読み込みに失敗:', e);
    }
}

function applySettings() {
    document.getElementById('notify-all').checked = settings.notifyAll;
    document.getElementById('notify-strong').checked = settings.notifyStrong;
    document.getElementById('notify-eew').checked = settings.notifyEEW;
    document.getElementById('sound-select').value = settings.sound;
    document.getElementById('theme-select').value = settings.theme;
    document.getElementById('update-interval').value = settings.updateInterval;
    document.getElementById('display-count').value = settings.displayCount;
    document.getElementById('region-select').value = settings.region;
    document.getElementById('filter-region').checked = settings.filterRegion;
}

function updateSettings() {
    settings.notifyAll = document.getElementById('notify-all').checked;
    settings.notifyStrong = document.getElementById('notify-strong').checked;
    settings.notifyEEW = document.getElementById('notify-eew').checked;
    settings.sound = document.getElementById('sound-select').value;
    settings.theme = document.getElementById('theme-select').value;
    settings.updateInterval = parseInt(document.getElementById('update-interval').value);
    settings.displayCount = parseInt(document.getElementById('display-count').value);
    settings.region = document.getElementById('region-select').value;
    settings.filterRegion = document.getElementById('filter-region').checked;
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    
    CONFIG.UPDATE_INTERVAL = settings.updateInterval * 1000;
    displayCount = settings.displayCount;
    
    startAutoUpdate();
    processEarthquakeData();
    
    showNotification('設定', '設定を保存しました', 'success');
}

function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    settings.theme = theme;
    applyTheme();
    updateSettings();
}

function applyTheme() {
    if (settings.theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

function clearCache() {
    localStorage.removeItem(STORAGE_KEYS.CACHE);
    localStorage.removeItem(STORAGE_KEYS.LAST_UPDATE);
    showNotification('キャッシュ', 'キャッシュをクリアしました', 'success');
    loadEarthquakeData();
}

function exportData() {
    const data = JSON.stringify(earthquakeData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earthquake_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('エクスポート', 'データをエクスポートしました', 'success');
}

function resetSettings() {
    if (confirm('すべての設定をリセットしますか？')) {
        localStorage.clear();
        location.reload();
    }
}

// キャッシュ関連
function getCachedData() {
    try {
        const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE);
        if (lastUpdate) {
            const elapsed = Date.now() - parseInt(lastUpdate);
            if (elapsed < CONFIG.CACHE_DURATION) {
                const cached = localStorage.getItem(STORAGE_KEYS.CACHE);
                return cached ? JSON.parse(cached) : null;
            }
        }
    } catch (e) {
        console.error('キャッシュ読み込みエラー:', e);
    }
    return null;
}

function cacheData(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, Date.now().toString());
    } catch (e) {
        console.error('キャッシュ保存エラー:', e);
    }
}

// ユーティリティ関数
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    document.querySelectorAll('.current-time').forEach(el => {
        el.textContent = timeString;
    });
}

function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connection-status');
    const dot = statusEl?.querySelector('.status-dot');
    const text = statusEl?.querySelector('.status-text');
    
    if (dot && text) {
        dot.classList.remove('error');
        switch (status) {
            case 'connected':
                text.textContent = '接続中';
                break;
            case 'loading':
                text.textContent = '更新中...';
                break;
            case 'error':
                text.textContent = 'エラー';
                dot.classList.add('error');
                break;
        }
    }
}

function updateLastUpdateTime() {
    const el = document.getElementById('last-update');
    if (el) {
        el.textContent = `最終更新: ${new Date().toLocaleTimeString('ja-JP')}`;
    }
}

function formatDateTime(dateString) {
    if (!dateString) return '不明';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function formatShindo(shindo) {
    if (!shindo) return '不明';
    const shindoMap = {
        '10': '1', '20': '2', '30': '3', '40': '4',
        '45': '5弱', '50': '5強', '55': '6弱', '60': '6強', '70': '7'
    };
    return shindoMap[shindo] || shindo;
}

function parseShindo(shindo) {
    if (typeof shindo === 'number') return shindo;
    const num = parseInt(shindo);
    return isNaN(num) ? 0 : num;
}

function getEarthquakeClass(shindo) {
    if (shindo >= 50) return 'very-strong';
    if (shindo >= 40) return 'strong';
    return '';
}

function displayError(message) {
    const activityElement = document.getElementById('current-activity');
    const listElement = document.getElementById('recent-list');
    
    const errorHTML = `
        <div class="error-message">
            <p>⚠️ データの取得に失敗しました</p>
            <p>${message || 'しばらくしてから再度お試しください'}</p>
            <button class="btn btn-refresh" onclick="loadEarthquakeData()">🔄 再試行</button>
        </div>
    `;
    
    if (activityElement) {
        activityElement.innerHTML = errorHTML;
        activityElement.classList.remove('loading');
    }
    if (listElement) {
        listElement.innerHTML = errorHTML;
    }
}

function showNotification(title, message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    // 実際の通知機能は将来実装
}

function startAutoUpdate() {
    if (updateTimer) clearInterval(updateTimer);
    updateTimer = setInterval(() => {
        console.log('🔄 地震データを自動更新中...');
        loadEarthquakeData();
    }, CONFIG.UPDATE_INTERVAL);
}

window.addEventListener('beforeunload', () => {
    if (updateTimer) clearInterval(updateTimer);
});

// グローバル関数をエクスポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadEarthquakeData,
        formatDateTime,
        formatShindo,
        switchView,
        loadMoreEarthquakes,
        showEarthquakeDetail,
        updateSettings,
        changeTheme,
        clearCache,
        exportData,
        resetSettings,
        closeEmergencyBanner,
    };
}
