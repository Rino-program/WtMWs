// ストップウォッチの状態管理
const state = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    intervalId: null,
    laps: []
};

// DOM要素
const elements = {
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
    milliseconds: document.getElementById('milliseconds'),
    display: document.querySelector('.display'),
    startStopBtn: document.getElementById('startStopBtn'),
    lapBtn: document.getElementById('lapBtn'),
    resetBtn: document.getElementById('resetBtn'),
    exportBtn: document.getElementById('exportBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    lapList: document.getElementById('lapList')
};

// 初期化
function init() {
    loadFromLocalStorage();
    updateDisplay();
    renderLaps();
    setupEventListeners();
}

// イベントリスナーの設定
function setupEventListeners() {
    elements.startStopBtn.addEventListener('click', toggleStartStop);
    elements.lapBtn.addEventListener('click', recordLap);
    elements.resetBtn.addEventListener('click', reset);
    elements.exportBtn.addEventListener('click', exportToCSV);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            toggleStartStop();
        } else if (e.code === 'KeyL' && state.isRunning) {
            recordLap();
        } else if (e.code === 'KeyR' && !state.isRunning && state.elapsedTime > 0) {
            reset();
        }
    });
}

// スタート/ストップ切り替え
function toggleStartStop() {
    if (state.isRunning) {
        stop();
    } else {
        start();
    }
}

// スタート
function start() {
    state.isRunning = true;
    state.startTime = Date.now() - state.elapsedTime;
    state.intervalId = setInterval(update, 10);
    
    elements.startStopBtn.textContent = 'ストップ';
    elements.startStopBtn.classList.add('running');
    elements.lapBtn.disabled = false;
    elements.resetBtn.disabled = true;
    elements.display.classList.add('running');
}

// ストップ
function stop() {
    state.isRunning = false;
    clearInterval(state.intervalId);
    state.elapsedTime = Date.now() - state.startTime;
    
    elements.startStopBtn.textContent = 'スタート';
    elements.startStopBtn.classList.remove('running');
    elements.lapBtn.disabled = true;
    elements.resetBtn.disabled = false;
    elements.display.classList.remove('running');
    
    saveToLocalStorage();
}

// リセット
function reset() {
    state.isRunning = false;
    state.elapsedTime = 0;
    state.startTime = 0;
    clearInterval(state.intervalId);
    
    // ラップはリセットしない（履歴として保持）
    
    elements.startStopBtn.textContent = 'スタート';
    elements.startStopBtn.classList.remove('running');
    elements.lapBtn.disabled = true;
    elements.resetBtn.disabled = true;
    elements.display.classList.remove('running');
    
    updateDisplay();
    saveToLocalStorage();
}

// タイマー更新
function update() {
    state.elapsedTime = Date.now() - state.startTime;
    updateDisplay();
}

// 表示更新
function updateDisplay() {
    const time = formatTime(state.elapsedTime);
    elements.hours.textContent = time.hours;
    elements.minutes.textContent = time.minutes;
    elements.seconds.textContent = time.seconds;
    elements.milliseconds.textContent = time.milliseconds;
}

// 時間のフォーマット
function formatTime(ms) {
    const totalMs = Math.max(0, ms);
    const hours = Math.floor(totalMs / 3600000);
    const minutes = Math.floor((totalMs % 3600000) / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const milliseconds = totalMs % 1000;
    
    return {
        hours: String(hours).padStart(2, '0'),
        minutes: String(minutes).padStart(2, '0'),
        seconds: String(seconds).padStart(2, '0'),
        milliseconds: String(milliseconds).padStart(3, '0')
    };
}

// 時間を文字列に変換
function formatTimeString(ms) {
    const time = formatTime(ms);
    return `${time.hours}:${time.minutes}:${time.seconds}.${time.milliseconds}`;
}

// ラップ記録
function recordLap() {
    if (!state.isRunning) return;
    
    const currentTime = state.elapsedTime;
    const lastLapTime = state.laps.length > 0 ? state.laps[state.laps.length - 1].totalTime : 0;
    const splitTime = currentTime - lastLapTime;
    
    const lap = {
        number: state.laps.length + 1,
        totalTime: currentTime,
        splitTime: splitTime,
        timestamp: new Date().toISOString()
    };
    
    state.laps.push(lap);
    renderLaps();
    saveToLocalStorage();
}

// ラップ一覧の描画
function renderLaps() {
    if (state.laps.length === 0) {
        elements.lapList.innerHTML = '<p class="no-laps">ラップタイムがありません</p>';
        elements.exportBtn.disabled = true;
        elements.clearHistoryBtn.disabled = true;
        return;
    }
    
    elements.exportBtn.disabled = false;
    elements.clearHistoryBtn.disabled = false;
    
    // ベストとワーストを特定
    const splitTimes = state.laps.map(lap => lap.splitTime);
    const bestSplit = Math.min(...splitTimes);
    const worstSplit = Math.max(...splitTimes);
    
    // 逆順で表示（最新が上）
    const reversedLaps = [...state.laps].reverse();
    
    elements.lapList.innerHTML = reversedLaps.map((lap, index) => {
        const prevLap = index < reversedLaps.length - 1 ? reversedLaps[index + 1] : null;
        let diffClass = 'neutral';
        let diffText = '-';
        
        if (prevLap) {
            const diff = lap.splitTime - prevLap.splitTime;
            if (diff > 0) {
                diffClass = 'positive';
                diffText = `+${formatTimeString(diff)}`;
            } else if (diff < 0) {
                diffClass = 'negative';
                diffText = `-${formatTimeString(Math.abs(diff))}`;
            } else {
                diffText = '±0';
            }
        }
        
        let lapClass = '';
        if (state.laps.length > 1) {
            if (lap.splitTime === bestSplit) {
                lapClass = 'best';
            } else if (lap.splitTime === worstSplit) {
                lapClass = 'worst';
            }
        }
        
        return `
            <div class="lap-item ${lapClass}">
                <span class="lap-number">#${lap.number}</span>
                <span class="lap-time">${formatTimeString(lap.totalTime)}</span>
                <span class="lap-split">+${formatTimeString(lap.splitTime)}</span>
                <span class="lap-diff ${diffClass}">${diffText}</span>
            </div>
        `;
    }).join('');
}

// LocalStorageに保存
function saveToLocalStorage() {
    const data = {
        elapsedTime: state.elapsedTime,
        laps: state.laps,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('stopwatch_data', JSON.stringify(data));
}

// LocalStorageから読み込み
function loadFromLocalStorage() {
    try {
        const data = JSON.parse(localStorage.getItem('stopwatch_data'));
        if (data) {
            state.elapsedTime = data.elapsedTime || 0;
            state.laps = data.laps || [];
            
            if (state.elapsedTime > 0) {
                elements.resetBtn.disabled = false;
            }
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// CSVエクスポート
function exportToCSV() {
    if (state.laps.length === 0) return;
    
    const headers = ['ラップ番号', '累計タイム', 'スプリットタイム', '前ラップとの差', '記録日時'];
    
    const rows = state.laps.map((lap, index) => {
        const prevLap = index > 0 ? state.laps[index - 1] : null;
        let diff = '-';
        
        if (prevLap) {
            const diffMs = lap.splitTime - prevLap.splitTime;
            if (diffMs > 0) {
                diff = `+${formatTimeString(diffMs)}`;
            } else if (diffMs < 0) {
                diff = `-${formatTimeString(Math.abs(diffMs))}`;
            } else {
                diff = '±0';
            }
        }
        
        return [
            lap.number,
            formatTimeString(lap.totalTime),
            formatTimeString(lap.splitTime),
            diff,
            new Date(lap.timestamp).toLocaleString('ja-JP')
        ];
    });
    
    // BOM付きUTF-8でCSV作成
    const bom = '\uFEFF';
    const csvContent = bom + [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `stopwatch_laps_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 履歴クリア
function clearHistory() {
    if (!confirm('すべてのラップ履歴を削除しますか？')) return;
    
    state.laps = [];
    renderLaps();
    saveToLocalStorage();
}

// 初期化実行
init();
