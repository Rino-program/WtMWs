const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const grid = 20;
const cols = cv.width / grid;
const rows = cv.height / grid;

let snake, dir, nextDir, food, powerup, score;
let best = +localStorage.getItem('snakeBest') || 0;
let combo, maxCombo, foodEaten, gameLoop, speed, baseSpeed;
let isPaused = false;
let isPlaying = false;
let mapType = 'classic';
let skinType = 'neon';
let difficulty = 'normal';
let soundEnabled = true;
let obstacles = [];
let activePowerups = [];
let achievements = JSON.parse(localStorage.getItem('snakeAchievements') || '{}');

document.getElementById('best').textContent = best;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(freq, duration = 0.1, type = 'sine') {
    if (!soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch {}
}

const powerupTypes = [
    { type: 'speed', color: '#4facfe', icon: '⚡', duration: 5000, desc: 'スピードアップ' },
    { type: 'slow', color: '#f093fb', icon: '🐢', duration: 5000, desc: 'スローダウン' },
    { type: 'invincible', color: '#ffd700', icon: '⭐', duration: 3000, desc: '無敵' },
    { type: 'double', color: '#43e97b', icon: 'x2', duration: 8000, desc: 'ダブルスコア' }
];

const mazePatterns = {
    maze: [
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 },
        { x: 14, y: 10 }, { x: 14, y: 11 }, { x: 14, y: 12 }, { x: 14, y: 13 }, { x: 14, y: 14 },
        { x: 8, y: 3 }, { x: 9, y: 3 }, { x: 10, y: 3 }, { x: 11, y: 3 },
        { x: 8, y: 16 }, { x: 9, y: 16 }, { x: 10, y: 16 }, { x: 11, y: 16 }
    ],
    arena: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 },
        { x: 19, y: 0 }, { x: 18, y: 0 }, { x: 19, y: 1 },
        { x: 0, y: 19 }, { x: 1, y: 19 }, { x: 0, y: 18 },
        { x: 19, y: 19 }, { x: 18, y: 19 }, { x: 19, y: 18 }
    ]
};

const skins = {
    neon: { head: '#43e97b', body: i => `rgba(67,233,123,${1 - i * 0.03})`, glow: true },
    classic: { head: '#4CAF50', body: () => '#388E3C', glow: false },
    pixel: { head: '#8BC34A', body: () => '#689F38', glow: false, pixelated: true },
    rainbow: { head: '#ff0000', body: i => `hsl(${(i * 15) % 360},70%,50%)`, glow: true }
};

document.getElementById('mapSelect').onchange = e => {
    mapType = e.target.value;
    if (!isPlaying) {
        init();
        draw();
    }
};

document.getElementById('skinSelect').onchange = e => {
    skinType = e.target.value;
    if (!isPlaying) draw();
};

document.getElementById('difficultySelect').onchange = e => {
    difficulty = e.target.value;
    baseSpeed = { easy: 150, normal: 120, hard: 80 }[difficulty];
    if (!isPlaying) {
        init();
        draw();
    }
};

baseSpeed = 120;

function init() {
    snake = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = { ...dir };
    score = 0;
    combo = 1;
    maxCombo = 1;
    foodEaten = 0;
    speed = baseSpeed;
    activePowerups = [];
    obstacles = mazePatterns[mapType] || [];
    placeFood();
    placePowerup();
    updateUI();
}

function placeFood() {
    do {
        food = { x: Math.random() * cols | 0, y: Math.random() * rows | 0 };
    } while (
        snake.some(s => s.x === food.x && s.y === food.y) ||
        obstacles.some(o => o.x === food.x && o.y === food.y)
    );
}

function placePowerup() {
    if (Math.random() > 0.3) {
        powerup = null;
        return;
    }
    const type = powerupTypes[Math.random() * powerupTypes.length | 0];
    do {
        powerup = { x: Math.random() * cols | 0, y: Math.random() * rows | 0, ...type };
    } while (
        snake.some(s => s.x === powerup.x && s.y === powerup.y) ||
        obstacles.some(o => o.x === powerup.x && o.y === powerup.y) ||
        (food && food.x === powerup.x && food.y === powerup.y)
    );
}

function hasActivePowerup(type) {
    return activePowerups.some(p => p.type === type);
}

function draw() {
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, cv.width, cv.height);

    // Grid
    ctx.strokeStyle = 'rgba(67,233,123,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * grid, 0);
        ctx.lineTo(i * grid, cv.height);
        ctx.stroke();
    }
    for (let i = 0; i <= rows; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * grid);
        ctx.lineTo(cv.width, i * grid);
        ctx.stroke();
    }

    // Obstacles
    obstacles.forEach(o => {
        ctx.fillStyle = '#444';
        ctx.fillRect(o.x * grid + 1, o.y * grid + 1, grid - 2, grid - 2);
    });

    // Powerup
    if (powerup) {
        ctx.fillStyle = powerup.color;
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.beginPath();
        ctx.arc(powerup.x * grid + grid / 2, powerup.y * grid + grid / 2, grid / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.icon, powerup.x * grid + grid / 2, powerup.y * grid + grid / 2);
    }

    // Food
    ctx.fillStyle = hasActivePowerup('double') ? '#ffd700' : '#f5576c';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(food.x * grid + grid / 2, food.y * grid + grid / 2, grid / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    const skin = skins[skinType];
    snake.forEach((s, i) => {
        const alpha = 1 - i / (snake.length + 10);
        ctx.fillStyle = i === 0 ? skin.head : skin.body(i);
        if (skin.glow) {
            ctx.shadowColor = skin.head;
            ctx.shadowBlur = 8;
        }
        if (hasActivePowerup('invincible')) {
            ctx.fillStyle = `hsl(${(Date.now() * 0.5 + i * 20) % 360},80%,60%)`;
        }
        if (skin.pixelated) {
            ctx.fillRect(s.x * grid + 2, s.y * grid + 2, grid - 4, grid - 4);
        } else {
            ctx.fillRect(s.x * grid + 1, s.y * grid + 1, grid - 2, grid - 2);
        }
        ctx.shadowBlur = 0;

        // Eyes
        if (i === 0) {
            ctx.fillStyle = '#fff';
            const ex = dir.x > 0 ? 5 : dir.x < 0 ? -5 : 0;
            const ey = dir.y > 0 ? 5 : dir.y < 0 ? -5 : 0;
            ctx.beginPath();
            ctx.arc(s.x * grid + grid / 2 + ex / 2 - 3, s.y * grid + grid / 2 + ey / 2 - 3, 2, 0, Math.PI * 2);
            ctx.arc(s.x * grid + grid / 2 + ex / 2 + 3, s.y * grid + grid / 2 + ey / 2 - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function update() {
    if (isPaused) return;

    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall handling
    if (mapType === 'walls') {
        if (head.x < 0) head.x = cols - 1;
        if (head.x >= cols) head.x = 0;
        if (head.y < 0) head.y = rows - 1;
        if (head.y >= rows) head.y = 0;
    } else {
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
            if (!hasActivePowerup('invincible')) {
                gameOver();
                return;
            }
            head.x = (head.x + cols) % cols;
            head.y = (head.y + rows) % rows;
        }
    }

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y) && !hasActivePowerup('invincible')) {
        gameOver();
        return;
    }

    // Obstacle collision
    if (obstacles.some(o => o.x === head.x && o.y === head.y) && !hasActivePowerup('invincible')) {
        gameOver();
        return;
    }

    snake.unshift(head);

    // Food
    if (head.x === food.x && head.y === food.y) {
        const points = hasActivePowerup('double') ? 20 : 10;
        score += points * combo;
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        foodEaten++;
        showCombo(combo);
        playSound(523 + combo * 50, 0.1);
        if (speed > 50) speed -= 2;
        placeFood();
        if (Math.random() < 0.2) placePowerup();
        checkAchievements();
        updateUI();
    } else {
        snake.pop();
        combo = Math.max(1, combo - 0.1);
    }

    // Powerup
    if (powerup && head.x === powerup.x && head.y === powerup.y) {
        activatePowerup(powerup);
        powerup = null;
    }

    draw();
}

function activatePowerup(p) {
    playSound(880, 0.2);
    activePowerups.push({ ...p, endTime: Date.now() + p.duration });
    updatePowerupIndicator();

    if (p.type === 'speed') speed = Math.max(40, speed - 40);
    if (p.type === 'slow') speed += 60;

    setTimeout(() => {
        activePowerups = activePowerups.filter(ap => ap.endTime > Date.now());
        updatePowerupIndicator();
        if (p.type === 'speed' || p.type === 'slow') speed = baseSpeed;
    }, p.duration);
}

function updatePowerupIndicator() {
    document.getElementById('powerupIndicator').innerHTML = activePowerups.map(p =>
        `<span class="powerup-badge ${p.type}">${p.icon} ${p.desc}</span>`
    ).join('');
}

function showCombo(c) {
    if (c < 3) return;
    const el = document.getElementById('comboDisplay');
    el.textContent = `${c}x COMBO!`;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = 'x' + Math.floor(combo);
    document.getElementById('length').textContent = snake.length;
}

function checkAchievements() {
    const newAchievements = [];
    if (score >= 100 && !achievements.score100) {
        achievements.score100 = true;
        newAchievements.push('🏆 100点達成!');
    }
    if (score >= 500 && !achievements.score500) {
        achievements.score500 = true;
        newAchievements.push('🏆 500点達成!');
    }
    if (snake.length >= 10 && !achievements.length10) {
        achievements.length10 = true;
        newAchievements.push('🐍 長さ10達成!');
    }
    if (snake.length >= 20 && !achievements.length20) {
        achievements.length20 = true;
        newAchievements.push('🐍 長さ20達成!');
    }
    if (combo >= 5 && !achievements.combo5) {
        achievements.combo5 = true;
        newAchievements.push('🔥 5コンボ達成!');
    }
    if (combo >= 10 && !achievements.combo10) {
        achievements.combo10 = true;
        newAchievements.push('🔥 10コンボ達成!');
    }

    newAchievements.forEach((a, i) => {
        setTimeout(() => showAchievement(a), i * 600);
    });
    localStorage.setItem('snakeAchievements', JSON.stringify(achievements));
}

function showAchievement(text) {
    const el = document.createElement('div');
    el.className = 'achievement';
    el.textContent = text;
    document.getElementById('achievements').appendChild(el);
    playSound(1047, 0.15);
    setTimeout(() => el.remove(), 3000);
}

function gameOver() {
    isPlaying = false;
    clearInterval(gameLoop);
    playSound(220, 0.3, 'square');
    if (score > best) {
        best = score;
        localStorage.setItem('snakeBest', best);
        document.getElementById('best').textContent = best;
    }
    document.getElementById('overlayTitle').textContent = '💀 ゲームオーバー';
    document.getElementById('overlayText').textContent = '';
    document.getElementById('overlayStats').innerHTML = `
        <div class="overlay-stat"><div class="val">${score}</div><div class="label">スコア</div></div>
        <div class="overlay-stat"><div class="val">${best}</div><div class="label">ベスト</div></div>
        <div class="overlay-stat"><div class="val">${snake.length}</div><div class="label">最終長さ</div></div>
        <div class="overlay-stat"><div class="val">${maxCombo}x</div><div class="label">最大コンボ</div></div>
    `;
    document.getElementById('overlay').classList.add('show');
}

function startGame() {
    document.getElementById('overlay').classList.remove('show');
    init();
    draw();
    clearInterval(gameLoop);
    isPlaying = true;
    isPaused = false;
    gameLoop = setInterval(update, speed);
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
}

function toggleSound() {
    soundEnabled = !soundEnabled;
}

function setDir(d) {
    const dirs = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 }
    };
    const nd = dirs[d];
    if (nd && !(dir.x === -nd.x && dir.y === -nd.y)) nextDir = nd;
}

document.addEventListener('keydown', e => {
    // ゲームが開始されていない場合はスタート操作のみ許可
    if (!isPlaying) {
        if (e.code === 'Space' && document.getElementById('overlay').classList.contains('show')) {
            startGame();
        }
        return;
    }
    // ゲームプレイ中のキーがページに影響しないよう防止
    const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape', 'KeyW', 'KeyS', 'KeyA', 'KeyD'];
    if (gameKeys.includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'Space') {
        togglePause();
        return;
    }
    if (e.code === 'Escape') togglePause();
    if (isPaused) return;
    const map = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        KeyW: 'up',
        KeyS: 'down',
        KeyA: 'left',
        KeyD: 'right'
    };
    if (map[e.code]) setDir(map[e.code]);
});

document.querySelectorAll('.touch-btn').forEach(btn => {
    const handler = () => {
        if (btn.dataset.d === 'pause') togglePause();
        else setDir(btn.dataset.d);
    };
    btn.ontouchstart = btn.onmousedown = e => {
        e.preventDefault();
        handler();
    };
});

// Swipe
let tx, ty;
cv.ontouchstart = e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
};
cv.ontouchend = e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 'right' : 'left');
        else setDir(dy > 0 ? 'down' : 'up');
    }
};

init();
draw();
document.getElementById('overlay').classList.add('show');
