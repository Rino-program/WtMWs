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
        
        // 開発用：キャッシュを一時的にスキップしてデバッグ
        // const cachedData = getCachedData();
        // if (cachedData) {
        //     console.log('📦 キャッシュからデータを読み込みました');
        //     earthquakeData = cachedData;
        //     processEarthquakeData();
        //     updateConnectionStatus('connected');
        //     return;
        // }
        
        const response = await fetchWithTimeout(CONFIG.API_ENDPOINTS.JMA, 10000);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 取得したデータ:', data);
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('データが空または不正です');
        }
        
        // 各地震の詳細データを取得
        const detailedData = await Promise.all(
            data.slice(0, 20).map(async (item) => {
                try {
                    const detailUrl = `${CONFIG.API_ENDPOINTS.JMA}${item.json || ''}`;
                    const detailResponse = await fetch(detailUrl);
                    if (detailResponse.ok) {
                        const detail = await detailResponse.json();
                        return { ...item, detail };
                    }
                } catch (e) {
                    console.warn('詳細データの取得に失敗:', e);
                }
                return item;
            })
        );
        
        earthquakeData = detailedData;
        cacheData(detailedData);
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
    renderLocationRanking();
    renderDepthDistribution();
    renderMonthlyChart();
    renderHourlyChart();
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
        // 時刻の取得（複数のフィールドに対応）
        const timeStr = quake.at || quake.time || (quake.detail?.earthquake?.time);
        if (!timeStr) return false;
        
        const quakeTime = new Date(timeStr);
        const timeDiff = now - quakeTime;
        
        if (timeDiff > periodMs) return false;
        
        // 震度の取得（複数のフィールドに対応）
        const maxInt = quake.maxInt || quake.shindo || 
                      (quake.detail?.earthquake?.maxInt) ||
                      (quake.detail?.maxInt);
        const shindo = parseShindo(maxInt);
        
        if (shindoFilter !== 'all') {
            const filterValue = parseInt(shindoFilter);
            if (filterValue === 1 && shindo < 10) return false;
            if (filterValue === 3 && shindo < 30) return false;
            if (filterValue === 4 && shindo < 40) return false;
            if (filterValue === 5 && shindo < 45) return false;
        }
        
        if (searchTerm) {
            const location = (quake.hypocenter?.name || 
                            quake.detail?.earthquake?.hypocenter?.name || 
                            '').toLowerCase();
            if (!location.includes(searchTerm)) return false;
        }
        
        if (settings.filterRegion && settings.region !== 'all') {
            const location = quake.hypocenter?.name || 
                           quake.detail?.earthquake?.hypocenter?.name || '';
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
        
        // 震源地情報を取得（複数のフィールドに対応）
        const hypocenter = latest.hypocenter?.name || 
                         latest.detail?.earthquake?.hypocenter?.name || 
                         '震源地不明';
        
        // マグニチュードを取得
        const mag = latest.mag || 
                   latest.detail?.earthquake?.hypocenter?.magnitude || 
                   '?';
        
        // 震度を取得
        const maxInt = latest.maxInt || 
                      latest.detail?.earthquake?.maxInt || 
                      latest.shindo;
        
        // 時刻を取得
        const timeStr = latest.at || 
                       latest.time || 
                       latest.detail?.earthquake?.time;
        
        document.getElementById('latest-quake-info').innerHTML = `
            <div style="font-size: 0.9rem;">
                <strong>${hypocenter}</strong><br>
                M${mag} / 震度${formatShindo(maxInt)}<br>
                <small>${formatDateTime(timeStr)}</small>
            </div>
        `;
    } else {
        document.getElementById('latest-quake-info').textContent = 'データなし';
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = earthquakeData.filter(q => {
        const timeStr = q.at || q.time || q.detail?.earthquake?.time;
        if (!timeStr) return false;
        const qDate = new Date(timeStr);
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
    
    // 各フィールドを柔軟に取得
    const earthquake = latestQuake.detail?.earthquake || latestQuake;
    const hypocenter = earthquake.hypocenter || latestQuake.hypocenter || {};
    
    const timeStr = latestQuake.at || latestQuake.time || earthquake.time;
    const location = hypocenter.name || '情報なし';
    const mag = hypocenter.magnitude || latestQuake.mag || '不明';
    const depth = hypocenter.depth || latestQuake.depth;
    const maxInt = earthquake.maxInt || latestQuake.maxInt || latestQuake.shindo;
    
    const shindo = parseShindo(maxInt);
    const statusClass = shindo >= 50 ? 'status-danger' : shindo >= 40 ? 'status-warning' : 'status-normal';
    
    const activityHTML = `
        <div class="activity-summary">
            <p><strong style="font-size: 1.2rem;">最新の地震:</strong></p>
            <p class="${statusClass}"><strong>発生時刻:</strong> ${formatDateTime(timeStr)}</p>
            <p><strong>震源地:</strong> ${location}</p>
            <p><strong>マグニチュード:</strong> M${mag}</p>
            <p><strong>最大震度:</strong> <span class="${statusClass}">${formatShindo(maxInt)}</span></p>
            ${depth ? `<p><strong>深さ:</strong> ${depth}${typeof depth === 'string' ? '' : 'km'}</p>` : ''}
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
        // 各フィールドを柔軟に取得
        const earthquake = quake.detail?.earthquake || quake;
        const hypocenter = earthquake.hypocenter || quake.hypocenter || {};
        
        const timeStr = quake.at || quake.time || earthquake.time;
        const location = hypocenter.name || '震源地不明';
        const mag = hypocenter.magnitude || quake.mag || '不明';
        const depth = hypocenter.depth || quake.depth;
        const maxInt = earthquake.maxInt || quake.maxInt || quake.shindo;
        
        const shindo = parseShindo(maxInt);
        const className = getEarthquakeClass(shindo);
        
        listHTML += `
            <div class="earthquake-item ${className}" onclick="showEarthquakeDetail(${index})" role="button" tabindex="0">
                <div class="eq-time">⏰ ${formatDateTime(timeStr)}</div>
                <div class="eq-location"><strong>📍 ${location}</strong></div>
                <div class="eq-details">
                    <span>🔢 M${mag}</span> |
                    <span>📊 最大震度: <strong>${formatShindo(maxInt)}</strong></span>
                    ${depth ? ` | <span>📏 深さ: ${typeof depth === 'string' ? depth : depth + 'km'}</span>` : ''}
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
    
    const weekData = earthquakeData.filter(q => {
        const timeStr = q.at || q.time || q.detail?.earthquake?.time;
        if (!timeStr) return false;
        return new Date(timeStr) >= weekAgo;
    });
    
    document.getElementById('week-total').textContent = weekData.length;
    
    const maxShindo = Math.max(0, ...weekData.map(q => {
        const maxInt = q.maxInt || q.detail?.earthquake?.maxInt || q.shindo || 0;
        return parseShindo(maxInt);
    }));
    document.getElementById('week-max-shindo').textContent = maxShindo > 0 ? formatShindo(maxShindo) : '-';
    
    const maxMag = Math.max(0, ...weekData.map(q => {
        const mag = q.mag || q.detail?.earthquake?.hypocenter?.magnitude || 0;
        return parseFloat(mag) || 0;
    }));
    document.getElementById('week-max-mag').textContent = maxMag > 0 ? `M${maxMag.toFixed(1)}` : '-';
    
    const strongCount = weekData.filter(q => {
        const maxInt = q.maxInt || q.detail?.earthquake?.maxInt || q.shindo || 0;
        return parseShindo(maxInt) >= 40;
    }).length;
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
        const maxInt = q.maxInt || q.detail?.earthquake?.maxInt || q.shindo;
        const shindo = formatShindo(maxInt);
        if (shindoCounts.hasOwnProperty(shindo)) {
            shindoCounts[shindo]++;
        }
    });
    
    // データがあるかチェック
    const totalCount = Object.values(shindoCounts).reduce((a, b) => a + b, 0);
    if (totalCount === 0) {
        chartElement.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 2rem;">表示期間内にデータがありません</p>';
        return;
    }
    
    let chartHTML = '<div style="padding: 1rem;">';
    for (const [shindo, count] of Object.entries(shindoCounts)) {
        if (count > 0) {
            const barWidth = Math.min((count / totalCount) * 100, 100);
            const percentage = ((count / totalCount) * 100).toFixed(1);
            
            chartHTML += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; margin-bottom: 0.25rem;">
                        <span style="width: 70px; font-weight: bold;">震度${shindo}</span>
                        <span style="margin-left: 1rem; color: var(--gray-600);">${count}回 (${percentage}%)</span>
                    </div>
                    <div style="background: var(--gray-300); height: 28px; border-radius: 4px; overflow: hidden;">
                        <div style="background: ${getShindoColor(shindo)}; height: 100%; width: ${barWidth}%; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }
    }
    chartHTML += '</div>';
    
    chartElement.innerHTML = chartHTML;
}

// 震度に応じた色を返す
function getShindoColor(shindo) {
    const colors = {
        '1': '#62a8ea',
        '2': '#4a90e2',
        '3': '#3498db',
        '4': '#f39c12',
        '5弱': '#e67e22',
        '5強': '#d35400',
        '6弱': '#e74c3c',
        '6強': '#c0392b',
        '7': '#8e44ad'
    };
    return colors[shindo] || 'var(--secondary-color)';
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
    
    // 各フィールドを柔軟に取得
    const earthquake = quake.detail?.earthquake || quake;
    const hypocenter = earthquake.hypocenter || quake.hypocenter || {};
    
    const timeStr = quake.at || quake.time || earthquake.time;
    const location = hypocenter.name || '不明';
    const mag = hypocenter.magnitude || quake.mag || '不明';
    const depth = hypocenter.depth || quake.depth;
    const maxInt = earthquake.maxInt || quake.maxInt || quake.shindo;
    const tsunami = earthquake.domesticTsunami || quake.tsunami;
    
    // 震源の位置情報
    const lat = hypocenter.latitude;
    const lon = hypocenter.longitude;
    const positionInfo = (lat && lon) ? `\n🗺️ 位置: 北緯${lat}° 東経${lon}°` : '';
    
    const detail = `
🌏 地震詳細情報

� 発生時刻: ${formatDateTime(timeStr)}
📍 震源地: ${location}
🔢 マグニチュード: M${mag}
📊 最大震度: ${formatShindo(maxInt)}
�📏 深さ: ${depth ? (typeof depth === 'string' ? depth : depth + 'km') : '不明'}${positionInfo}
${tsunami ? '🌊 津波: ' + tsunami : ''}

※ 詳細は気象庁の公式サイトをご確認ください
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
    
    // 文字列の場合
    if (typeof shindo === 'string') {
        const shindoMap = {
            '10': '1', '20': '2', '30': '3', '40': '4',
            '45': '5弱', '46': '5弱', '50': '5強', '55': '6弱', '60': '6強', '70': '7',
            '1': '1', '2': '2', '3': '3', '4': '4',
            '5-': '5弱', '5+': '5強', '6-': '6弱', '6+': '6強', '7': '7'
        };
        return shindoMap[shindo] || shindo;
    }
    
    // 数値の場合
    if (typeof shindo === 'number') {
        if (shindo >= 70) return '7';
        if (shindo >= 60) return '6強';
        if (shindo >= 55) return '6弱';
        if (shindo >= 50) return '5強';
        if (shindo >= 45) return '5弱';
        if (shindo >= 40) return '4';
        if (shindo >= 30) return '3';
        if (shindo >= 20) return '2';
        if (shindo >= 10) return '1';
    }
    
    return '不明';
}

function parseShindo(shindo) {
    if (!shindo) return 0;
    
    if (typeof shindo === 'number') return shindo;
    
    // 文字列を数値に変換
    const shindoStr = String(shindo);
    const shindoValueMap = {
        '1': 10, '2': 20, '3': 30, '4': 40,
        '5-': 45, '5弱': 45, '5+': 50, '5強': 50,
        '6-': 55, '6弱': 55, '6+': 60, '6強': 60,
        '7': 70
    };
    
    if (shindoValueMap[shindoStr]) {
        return shindoValueMap[shindoStr];
    }
    
    const num = parseInt(shindoStr);
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

// 追加の統計グラフ描画関数

// 震源地ランキング
function renderLocationRanking() {
    const rankingElement = document.getElementById('location-ranking');
    if (!rankingElement) return;
    
    // 震源地ごとにカウント
    const locationCounts = {};
    filteredData.forEach(q => {
        const earthquake = q.detail?.earthquake || q;
        const hypocenter = earthquake.hypocenter || q.hypocenter || {};
        const location = hypocenter.name || '不明';
        
        locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    // ソートして上位10件
    const sorted = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sorted.length === 0) {
        rankingElement.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 2rem;">データなし</p>';
        return;
    }
    
    let html = '<div style="padding: 1rem;">';
    sorted.forEach(([location, count], index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
        
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; background: var(--gray-100); border-radius: 6px;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-weight: bold; min-width: 30px;">${medal}</span>
                    <span>${location}</span>
                </div>
                <span style="font-weight: bold; color: var(--primary-color);">${count}回</span>
            </div>
        `;
    });
    html += '</div>';
    
    rankingElement.innerHTML = html;
}

// 深さ別分布
function renderDepthDistribution() {
    const depthElement = document.getElementById('depth-distribution');
    if (!depthElement) return;
    
    const depthRanges = {
        '0-10km': 0,
        '10-30km': 0,
        '30-50km': 0,
        '50-100km': 0,
        '100-300km': 0,
        '300km以上': 0,
        '不明': 0
    };
    
    filteredData.forEach(q => {
        const earthquake = q.detail?.earthquake || q;
        const hypocenter = earthquake.hypocenter || q.hypocenter || {};
        const depth = hypocenter.depth || q.depth;
        
        if (!depth || depth === '不明') {
            depthRanges['不明']++;
        } else {
            const d = parseFloat(depth);
            if (isNaN(d)) {
                depthRanges['不明']++;
            } else if (d < 10) {
                depthRanges['0-10km']++;
            } else if (d < 30) {
                depthRanges['10-30km']++;
            } else if (d < 50) {
                depthRanges['30-50km']++;
            } else if (d < 100) {
                depthRanges['50-100km']++;
            } else if (d < 300) {
                depthRanges['100-300km']++;
            } else {
                depthRanges['300km以上']++;
            }
        }
    });
    
    const total = Object.values(depthRanges).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        depthElement.innerHTML = '<p style="text-align: center; color: var(--gray-600); padding: 2rem;">データなし</p>';
        return;
    }
    
    let html = '<div style="padding: 1rem;">';
    for (const [range, count] of Object.entries(depthRanges)) {
        if (count > 0) {
            const percentage = ((count / total) * 100).toFixed(1);
            const barWidth = Math.min((count / total) * 100, 100);
            
            html += `
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="font-weight: bold;">${range}</span>
                        <span style="color: var(--gray-600);">${count}回 (${percentage}%)</span>
                    </div>
                    <div style="background: var(--gray-300); height: 24px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--success-color); height: 100%; width: ${barWidth}%; transition: width 0.5s;"></div>
                    </div>
                </div>
            `;
        }
    }
    html += '</div>';
    
    depthElement.innerHTML = html;
}

// 月別グラフ
function renderMonthlyChart() {
    const chartElement = document.getElementById('monthly-chart');
    if (!chartElement) return;
    
    // 過去12ヶ月のデータ
    const now = new Date();
    const monthlyCounts = {};
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[key] = 0;
    }
    
    earthquakeData.forEach(q => {
        const timeStr = q.at || q.time || q.detail?.earthquake?.time;
        if (!timeStr) return;
        
        const date = new Date(timeStr);
        const key = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyCounts.hasOwnProperty(key)) {
            monthlyCounts[key]++;
        }
    });
    
    const maxCount = Math.max(...Object.values(monthlyCounts), 1);
    
    let html = '<div style="padding: 1rem;">';
    for (const [month, count] of Object.entries(monthlyCounts)) {
        const barHeight = (count / maxCount) * 100;
        
        html += `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="font-weight: bold;">${month}</span>
                    <span style="color: var(--gray-600);">${count}回</span>
                </div>
                <div style="background: var(--gray-300); height: 24px; border-radius: 4px; overflow: hidden;">
                    <div style="background: var(--secondary-color); height: 100%; width: ${barHeight}%; transition: width 0.5s;"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    
    chartElement.innerHTML = html;
}

// 時間帯別グラフ
function renderHourlyChart() {
    const chartElement = document.getElementById('hourly-chart');
    if (!chartElement) return;
    
    const hourlyCounts = {};
    for (let i = 0; i < 24; i++) {
        hourlyCounts[i] = 0;
    }
    
    filteredData.forEach(q => {
        const timeStr = q.at || q.time || q.detail?.earthquake?.time;
        if (!timeStr) return;
        
        const date = new Date(timeStr);
        const hour = date.getHours();
        hourlyCounts[hour]++;
    });
    
    const maxCount = Math.max(...Object.values(hourlyCounts), 1);
    
    let html = '<div style="padding: 1rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 0.5rem;">';
    for (let hour = 0; hour < 24; hour++) {
        const count = hourlyCounts[hour];
        const barHeight = (count / maxCount) * 100;
        
        html += `
            <div style="text-align: center;">
                <div style="height: 100px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 0.25rem;">
                    <div style="background: var(--warning-color); width: 30px; height: ${barHeight}%; border-radius: 4px 4px 0 0; transition: height 0.5s;" title="${count}回"></div>
                </div>
                <div style="font-size: 0.85rem; font-weight: bold;">${hour}時</div>
                <div style="font-size: 0.75rem; color: var(--gray-600);">${count}回</div>
            </div>
        `;
    }
    html += '</div>';
    
    chartElement.innerHTML = html;
}

