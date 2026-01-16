let count = 0;
let goal = 100;
let step = 1;
let soundEnabled = true;
let vibrationEnabled = true;
let miniCounts = [0, 0, 0, 0];
let history = [];

// 音声
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency = 800, duration = 0.1) {
    if (!soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function vibrate(pattern = [50]) {
    if (vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function updateDisplay() {
    const valueEl = document.getElementById('counter-value');
    valueEl.textContent = count;
    valueEl.classList.add('bump');
    setTimeout(() => valueEl.classList.remove('bump'), 100);
    
    const progress = Math.min(100, (count / goal) * 100);
    document.getElementById('goal-fill').style.width = `${progress}%`;
    document.getElementById('goal-text').textContent = `目標: ${count} / ${goal}`;
    
    if (count >= goal) {
        document.getElementById('goal-text').textContent = '🎉 目標達成！';
    }
    
    // ローカルストレージに保存
    localStorage.setItem('counter-value', count);
}

function increment() {
    count += step;
    playSound(880);
    vibrate([30]);
    updateDisplay();
    addHistory(`+${step}`);
}

function decrement() {
    count = Math.max(0, count - step);
    playSound(440);
    vibrate([20, 20, 20]);
    updateDisplay();
    addHistory(`-${step}`);
}

function resetCounter() {
    if (confirm('カウンターをリセットしますか？')) {
        count = 0;
        playSound(220, 0.3);
        vibrate([100]);
        updateDisplay();
        addHistory('リセット');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    playSound(soundEnabled ? 1000 : 500);
}

function toggleVibration() {
    vibrationEnabled = !vibrationEnabled;
    vibrate([100, 50, 100]);
}

function miniIncrement(n) {
    miniCounts[n - 1]++;
    document.getElementById(`mini-${n}`).textContent = miniCounts[n - 1];
    playSound(660);
    vibrate([20]);
    localStorage.setItem(`mini-counter-${n}`, miniCounts[n - 1]);
}

function miniDecrement(n) {
    miniCounts[n - 1] = Math.max(0, miniCounts[n - 1] - 1);
    document.getElementById(`mini-${n}`).textContent = miniCounts[n - 1];
    playSound(330);
    vibrate([15]);
    localStorage.setItem(`mini-counter-${n}`, miniCounts[n - 1]);
}

function addHistory(action) {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    history.unshift({ time, action, value: count });
    if (history.length > 50) history.pop();
    
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = history.slice(0, 10).map(h => `
        <div class="history-item">
            <span>${h.time}</span>
            <span>${h.action}</span>
            <span>→ ${h.value}</span>
        </div>
    `).join('');
}

// イベントリスナー
document.getElementById('tap-counter').addEventListener('click', increment);

document.getElementById('goal-input').addEventListener('change', e => {
    goal = parseInt(e.target.value) || 100;
    updateDisplay();
});

document.getElementById('step-input').addEventListener('change', e => {
    step = parseInt(e.target.value) || 1;
});

document.getElementById('label-input').addEventListener('input', e => {
    document.getElementById('counter-label').textContent = e.target.value || 'タップでカウント';
});

// キーボードショートカット
document.addEventListener('keydown', e => {
    if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
    }
    if (e.key === '-' || e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
    }
    if (e.key === 'r') {
        resetCounter();
    }
});

// 初期化
count = parseInt(localStorage.getItem('counter-value')) || 0;
for (let i = 1; i <= 4; i++) {
    miniCounts[i - 1] = parseInt(localStorage.getItem(`mini-counter-${i}`)) || 0;
    document.getElementById(`mini-${i}`).textContent = miniCounts[i - 1];
}
updateDisplay();
