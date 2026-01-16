// ============================================
// Flappy Bird - High Quality Clone
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('startScreen');
const skinScreen = document.getElementById('skinScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const medalContainer = document.getElementById('medalContainer');
const newRecordEl = document.getElementById('newRecord');
const skinGrid = document.getElementById('skinGrid');

// Canvas sizing
function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game dimensions (logical)
const getWidth = () => canvas.width / window.devicePixelRatio;
const getHeight = () => canvas.height / window.devicePixelRatio;

// ============================================
// Sound System (Web Audio API)
// ============================================
class SoundManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }
    
    init() {
        if (this.initialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.initialized = true;
    }
    
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }
    
    jump() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.15), 50);
    }
    
    score() {
        this.playTone(600, 0.1, 'square', 0.15);
        setTimeout(() => this.playTone(800, 0.15, 'square', 0.15), 100);
    }
    
    die() {
        this.playTone(200, 0.3, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.15), 100);
    }
    
    medal() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2, 'sine', 0.2), i * 100);
        });
    }
}

const sound = new SoundManager();

// ============================================
// Game State
// ============================================
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    SKIN_SELECT: 'skin_select'
};

let state = GameState.MENU;
let score = 0;
let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
let isNightMode = localStorage.getItem('flappyNightMode') === 'true';
let selectedSkin = localStorage.getItem('flappySkin') || 'yellow';

// ============================================
// Skin System
// ============================================
const skins = [
    { id: 'yellow', name: 'イエロー', color: '#f1c40f', eye: '#000', beak: '#e67e22', unlock: 0 },
    { id: 'blue', name: 'ブルー', color: '#3498db', eye: '#000', beak: '#2980b9', unlock: 5 },
    { id: 'pink', name: 'ピンク', color: '#e91e63', eye: '#000', beak: '#c2185b', unlock: 15 },
    { id: 'green', name: 'グリーン', color: '#2ecc71', eye: '#000', beak: '#27ae60', unlock: 25 },
    { id: 'purple', name: 'パープル', color: '#9b59b6', eye: '#fff', beak: '#8e44ad', unlock: 40 },
    { id: 'gold', name: 'ゴールド', color: '#ffd700', eye: '#8b4513', beak: '#ff8c00', unlock: 60 },
    { id: 'rainbow', name: 'レインボー', color: 'rainbow', eye: '#fff', beak: '#ff6b6b', unlock: 100 }
];

function getSkin(id) {
    return skins.find(s => s.id === id) || skins[0];
}

function isSkinUnlocked(skin) {
    return highScore >= skin.unlock;
}

function renderSkinGrid() {
    skinGrid.innerHTML = '';
    skins.forEach(skin => {
        const unlocked = isSkinUnlocked(skin);
        const item = document.createElement('div');
        item.className = `skin-item ${skin.id === selectedSkin ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`;
        
        let bgColor = skin.color;
        if (skin.color === 'rainbow') {
            bgColor = 'linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)';
        }
        
        item.innerHTML = `
            <div class="skin-bird" style="background: ${bgColor}"></div>
            <div class="skin-name">${skin.name}</div>
            ${!unlocked ? `<div class="skin-requirement">🔒 ${skin.unlock}点で解放</div>` : ''}
        `;
        
        if (unlocked) {
            item.addEventListener('click', () => {
                selectedSkin = skin.id;
                localStorage.setItem('flappySkin', skin.id);
                renderSkinGrid();
            });
        }
        
        skinGrid.appendChild(item);
    });
}

// ============================================
// Bird Class
// ============================================
class Bird {
    constructor() {
        this.reset();
        this.wingAngle = 0;
        this.wingSpeed = 0.3;
    }
    
    reset() {
        this.x = getWidth() * 0.25;
        this.y = getHeight() * 0.4;
        this.velocity = 0;
        this.rotation = 0;
        this.size = Math.min(getWidth(), getHeight()) * 0.08;
    }
    
    jump() {
        this.velocity = -8;
        sound.jump();
    }
    
    update(gravity) {
        this.velocity += gravity;
        this.velocity = Math.min(this.velocity, 12);
        this.y += this.velocity;
        
        // Rotation based on velocity
        this.rotation = Math.min(Math.max(this.velocity * 4, -30), 90);
        
        // Wing animation
        this.wingAngle += this.wingSpeed;
    }
    
    draw() {
        const skin = getSkin(selectedSkin);
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        
        const s = this.size;
        
        // Rainbow gradient for rainbow skin
        let bodyColor = skin.color;
        if (skin.color === 'rainbow') {
            const time = Date.now() / 500;
            const gradient = ctx.createLinearGradient(-s, -s, s, s);
            gradient.addColorStop(0, `hsl(${(time * 50) % 360}, 80%, 60%)`);
            gradient.addColorStop(0.5, `hsl(${(time * 50 + 120) % 360}, 80%, 60%)`);
            gradient.addColorStop(1, `hsl(${(time * 50 + 240) % 360}, 80%, 60%)`);
            bodyColor = gradient;
        }
        
        // Body shadow
        ctx.beginPath();
        ctx.arc(3, 3, s * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fill();
        
        // Body
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = bodyColor;
        ctx.fill();
        
        // Body highlight
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fill();
        
        // Wing
        const wingY = Math.sin(this.wingAngle) * s * 0.3;
        ctx.beginPath();
        ctx.ellipse(-s * 0.2, wingY, s * 0.5, s * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fillStyle = skin.color === 'rainbow' ? bodyColor : this.darkenColor(skin.color, 20);
        ctx.fill();
        
        // Eye white
        ctx.beginPath();
        ctx.arc(s * 0.35, -s * 0.15, s * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Eye pupil
        ctx.beginPath();
        ctx.arc(s * 0.45, -s * 0.1, s * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = skin.eye;
        ctx.fill();
        
        // Eye shine
        ctx.beginPath();
        ctx.arc(s * 0.5, -s * 0.2, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Beak
        ctx.beginPath();
        ctx.moveTo(s * 0.6, s * 0.1);
        ctx.lineTo(s * 1.1, s * 0.2);
        ctx.lineTo(s * 0.6, s * 0.35);
        ctx.closePath();
        ctx.fillStyle = skin.beak;
        ctx.fill();
        
        ctx.restore();
    }
    
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return `rgb(${R},${G},${B})`;
    }
    
    getBounds() {
        return {
            x: this.x - this.size * 0.6,
            y: this.y - this.size * 0.6,
            width: this.size * 1.2,
            height: this.size * 1.2
        };
    }
}

// ============================================
// Pipe Class
// ============================================
class Pipe {
    constructor(x) {
        this.width = getWidth() * 0.18;
        this.gap = getHeight() * 0.28;
        this.x = x;
        
        const minTop = getHeight() * 0.15;
        const maxTop = getHeight() * 0.55;
        this.topHeight = minTop + Math.random() * (maxTop - minTop);
        
        this.passed = false;
        this.scored = false;
    }
    
    update(speed) {
        this.x -= speed;
    }
    
    draw() {
        const w = this.width;
        const capH = 30;
        const capExtra = 8;
        
        // Pipe colors
        const pipeColor = isNightMode ? '#2d5a27' : '#73bf2e';
        const pipeDark = isNightMode ? '#1e3d1a' : '#558b2f';
        const pipeLight = isNightMode ? '#3d7a37' : '#8bc34a';
        
        // Top pipe
        // Main body
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, 0, w, this.topHeight - capH);
        
        // Left highlight
        ctx.fillStyle = pipeLight;
        ctx.fillRect(this.x, 0, w * 0.15, this.topHeight - capH);
        
        // Right shadow
        ctx.fillStyle = pipeDark;
        ctx.fillRect(this.x + w * 0.85, 0, w * 0.15, this.topHeight - capH);
        
        // Cap
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x - capExtra, this.topHeight - capH, w + capExtra * 2, capH);
        ctx.fillStyle = pipeLight;
        ctx.fillRect(this.x - capExtra, this.topHeight - capH, (w + capExtra * 2) * 0.15, capH);
        ctx.fillStyle = pipeDark;
        ctx.fillRect(this.x + w + capExtra - (w + capExtra * 2) * 0.15, this.topHeight - capH, (w + capExtra * 2) * 0.15, capH);
        
        // Bottom pipe
        const bottomY = this.topHeight + this.gap;
        const bottomH = getHeight() - bottomY;
        
        // Main body
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x, bottomY + capH, w, bottomH - capH);
        
        // Left highlight
        ctx.fillStyle = pipeLight;
        ctx.fillRect(this.x, bottomY + capH, w * 0.15, bottomH - capH);
        
        // Right shadow
        ctx.fillStyle = pipeDark;
        ctx.fillRect(this.x + w * 0.85, bottomY + capH, w * 0.15, bottomH - capH);
        
        // Cap
        ctx.fillStyle = pipeColor;
        ctx.fillRect(this.x - capExtra, bottomY, w + capExtra * 2, capH);
        ctx.fillStyle = pipeLight;
        ctx.fillRect(this.x - capExtra, bottomY, (w + capExtra * 2) * 0.15, capH);
        ctx.fillStyle = pipeDark;
        ctx.fillRect(this.x + w + capExtra - (w + capExtra * 2) * 0.15, bottomY, (w + capExtra * 2) * 0.15, capH);
    }
    
    checkCollision(bird) {
        const b = bird.getBounds();
        
        // Top pipe
        if (b.x + b.width > this.x && b.x < this.x + this.width) {
            if (b.y < this.topHeight) return true;
            if (b.y + b.height > this.topHeight + this.gap) return true;
        }
        
        return false;
    }
}

// ============================================
// Particle System
// ============================================
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.size = Math.random() * 6 + 3;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2;
        this.life -= 0.02;
    }
    
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

let particles = [];

function createScoreParticles(x, y) {
    const colors = ['#ffd700', '#ffeb3b', '#fff176', '#ffffff'];
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]));
    }
}

// ============================================
// Background
// ============================================
class Background {
    constructor() {
        this.cloudX = 0;
        this.hillX = 0;
        this.groundX = 0;
        
        // Generate clouds
        this.clouds = [];
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * getWidth() * 2,
                y: Math.random() * getHeight() * 0.3 + 30,
                size: Math.random() * 40 + 30
            });
        }
    }
    
    update(speed) {
        this.cloudX -= speed * 0.2;
        this.hillX -= speed * 0.5;
        this.groundX -= speed;
        
        // Wrap clouds
        this.clouds.forEach(cloud => {
            cloud.x -= speed * 0.3;
            if (cloud.x < -100) {
                cloud.x = getWidth() + 100;
                cloud.y = Math.random() * getHeight() * 0.3 + 30;
            }
        });
    }
    
    draw() {
        const w = getWidth();
        const h = getHeight();
        
        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
        if (isNightMode) {
            skyGradient.addColorStop(0, '#0c1445');
            skyGradient.addColorStop(0.5, '#1a237e');
            skyGradient.addColorStop(1, '#283593');
        } else {
            skyGradient.addColorStop(0, '#87ceeb');
            skyGradient.addColorStop(0.5, '#b0e0e6');
            skyGradient.addColorStop(1, '#e0f7fa');
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, w, h);
        
        // Stars (night mode)
        if (isNightMode) {
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                const sx = (i * 73 + this.cloudX * 0.1) % w;
                const sy = (i * 37) % (h * 0.5);
                const ss = (Math.sin(Date.now() / 500 + i) + 1) * 1.5 + 0.5;
                ctx.beginPath();
                ctx.arc(sx, sy, ss, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Moon/Sun
        if (isNightMode) {
            ctx.beginPath();
            ctx.arc(w * 0.8, h * 0.15, 35, 0, Math.PI * 2);
            ctx.fillStyle = '#f5f5dc';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(w * 0.8 + 10, h * 0.15 - 5, 30, 0, Math.PI * 2);
            ctx.fillStyle = skyGradient;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(w * 0.85, h * 0.12, 40, 0, Math.PI * 2);
            ctx.fillStyle = '#fff59d';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(w * 0.85, h * 0.12, 45, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 245, 157, 0.3)';
            ctx.fill();
        }
        
        // Clouds
        ctx.fillStyle = isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)';
        this.clouds.forEach(cloud => {
            this.drawCloud(cloud.x, cloud.y, cloud.size);
        });
        
        // Far hills
        this.drawHills(h * 0.65, isNightMode ? '#1b5e20' : '#81c784', this.hillX * 0.5, 80);
        
        // Near hills
        this.drawHills(h * 0.72, isNightMode ? '#2e7d32' : '#66bb6a', this.hillX, 60);
    }
    
    drawCloud(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawHills(baseY, color, offset, height) {
        const w = getWidth();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, getHeight());
        
        for (let x = 0; x <= w + 100; x += 5) {
            const y = baseY + Math.sin((x + offset) * 0.02) * height * 0.5 
                           + Math.sin((x + offset) * 0.01) * height * 0.3;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(w + 100, getHeight());
        ctx.closePath();
        ctx.fill();
    }
    
    drawGround() {
        const w = getWidth();
        const h = getHeight();
        const groundH = h * 0.12;
        const groundY = h - groundH;
        
        // Ground
        ctx.fillStyle = isNightMode ? '#5d4037' : '#8d6e63';
        ctx.fillRect(0, groundY, w, groundH);
        
        // Grass
        ctx.fillStyle = isNightMode ? '#33691e' : '#7cb342';
        ctx.fillRect(0, groundY, w, 15);
        
        // Grass detail
        ctx.fillStyle = isNightMode ? '#558b2f' : '#9ccc65';
        const gw = 30;
        for (let x = (this.groundX % gw) - gw; x < w + gw; x += gw) {
            ctx.beginPath();
            ctx.moveTo(x, groundY + 15);
            ctx.lineTo(x + gw / 2, groundY);
            ctx.lineTo(x + gw, groundY + 15);
            ctx.fill();
        }
        
        // Ground pattern
        ctx.fillStyle = isNightMode ? '#4e342e' : '#795548';
        const pw = 40;
        for (let x = (this.groundX % pw) - pw; x < w + pw; x += pw) {
            ctx.fillRect(x, groundY + 20, 20, 8);
            ctx.fillRect(x + 20, groundY + 35, 20, 8);
        }
        
        return groundY;
    }
}

// ============================================
// Game Class
// ============================================
class Game {
    constructor() {
        this.bird = new Bird();
        this.background = new Background();
        this.pipes = [];
        this.gravity = 0.4;
        this.baseSpeed = 4;
        this.speed = this.baseSpeed;
        this.groundY = 0;
        this.lastPipeX = 0;
        this.pipeInterval = getWidth() * 0.55;
        this.minPipeInterval = getWidth() * 0.4;
        this.frameCount = 0;
    }
    
    reset() {
        this.bird.reset();
        this.pipes = [];
        this.speed = this.baseSpeed;
        this.pipeInterval = getWidth() * 0.55;
        this.frameCount = 0;
        score = 0;
        particles = [];
        
        // Initial pipe
        this.addPipe(getWidth() * 1.5);
    }
    
    addPipe(x) {
        this.pipes.push(new Pipe(x));
        this.lastPipeX = x;
    }
    
    update() {
        if (state !== GameState.PLAYING) return;
        
        this.frameCount++;
        
        // Update bird
        this.bird.update(this.gravity);
        
        // Update background
        this.background.update(this.speed);
        
        // Update pipes
        this.pipes.forEach(pipe => {
            pipe.update(this.speed);
            
            // Score check
            if (!pipe.scored && pipe.x + pipe.width < this.bird.x) {
                pipe.scored = true;
                score++;
                sound.score();
                createScoreParticles(this.bird.x, this.bird.y);
                scoreDisplay.textContent = score;
                
                // Increase difficulty
                if (score % 5 === 0) {
                    this.speed = Math.min(this.speed + 0.3, 8);
                    this.pipeInterval = Math.max(this.pipeInterval - 10, this.minPipeInterval);
                }
            }
            
            // Collision check
            if (pipe.checkCollision(this.bird)) {
                this.gameOver();
            }
        });
        
        // Remove off-screen pipes
        this.pipes = this.pipes.filter(p => p.x + p.width > -50);
        
        // Add new pipes
        if (this.lastPipeX < getWidth()) {
            this.addPipe(this.lastPipeX + this.pipeInterval);
        }
        this.lastPipeX -= this.speed;
        
        // Update particles
        particles.forEach(p => p.update());
        particles = particles.filter(p => p.life > 0);
        
        // Ground collision
        if (this.bird.y + this.bird.size > this.groundY) {
            this.gameOver();
        }
        
        // Ceiling collision
        if (this.bird.y - this.bird.size < 0) {
            this.bird.y = this.bird.size;
            this.bird.velocity = 0;
        }
    }
    
    draw() {
        // Clear
        ctx.clearRect(0, 0, getWidth(), getHeight());
        
        // Background
        this.background.draw();
        
        // Pipes
        this.pipes.forEach(pipe => pipe.draw());
        
        // Ground (draw after pipes)
        this.groundY = this.background.drawGround();
        
        // Particles
        particles.forEach(p => p.draw());
        
        // Bird
        this.bird.draw();
    }
    
    gameOver() {
        state = GameState.GAME_OVER;
        sound.die();
        
        // Update high score
        const isNewRecord = score > highScore;
        if (isNewRecord) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
            sound.medal();
        }
        
        // Show game over screen
        setTimeout(() => {
            finalScoreEl.textContent = score;
            bestScoreEl.textContent = highScore;
            
            // Medal
            let medal = '';
            if (score >= 40) medal = '🏆'; // Platinum
            else if (score >= 25) medal = '🥇'; // Gold
            else if (score >= 15) medal = '🥈'; // Silver
            else if (score >= 5) medal = '🥉'; // Bronze
            medalContainer.textContent = medal;
            
            // New record
            if (isNewRecord && score > 0) {
                newRecordEl.classList.remove('hidden');
            } else {
                newRecordEl.classList.add('hidden');
            }
            
            scoreDisplay.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
        }, 500);
    }
    
    start() {
        state = GameState.PLAYING;
        this.reset();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        scoreDisplay.textContent = '0';
        scoreDisplay.classList.remove('hidden');
    }
}

// ============================================
// Game Instance & Loop
// ============================================
const game = new Game();

function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

// ============================================
// Event Listeners
// ============================================
function handleJump() {
    sound.init();
    if (state === GameState.PLAYING) {
        game.bird.jump();
    }
}

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
    }
});

// Mouse/Touch on canvas
canvas.addEventListener('click', handleJump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleJump();
}, { passive: false });

// UI Buttons
document.getElementById('startBtn').addEventListener('click', () => {
    sound.init();
    game.start();
});

document.getElementById('retryBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    game.start();
});

document.getElementById('menuBtn').addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    state = GameState.MENU;
});

document.getElementById('skinBtn').addEventListener('click', () => {
    renderSkinGrid();
    startScreen.classList.add('hidden');
    skinScreen.classList.remove('hidden');
    state = GameState.SKIN_SELECT;
});

document.getElementById('skinBackBtn').addEventListener('click', () => {
    skinScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    state = GameState.MENU;
});

document.getElementById('themeBtn').addEventListener('click', () => {
    isNightMode = !isNightMode;
    localStorage.setItem('flappyNightMode', isNightMode);
    document.getElementById('themeBtn').textContent = isNightMode ? '☀️ 昼モード' : '🌙 夜モード';
});

// Initial theme button text
document.getElementById('themeBtn').textContent = isNightMode ? '☀️ 昼モード' : '🌙 夜モード';

// Start game loop
gameLoop();
