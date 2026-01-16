// ==========================================
// Pixel Runner - プラットフォーマーゲーム
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas サイズ設定
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// ゲーム定数
const GRAVITY = 0.6;
const FRICTION = 0.8;
const TILE_SIZE = 40;

// ゲーム状態
let gameState = 'menu'; // menu, playing, paused, clear, gameover
let currentLevel = 0;
let lives = 3;
let coins = 0;
let totalCoins = 0;
let damageCount = 0;
let startTime = 0;
let elapsedTime = 0;
let cameraX = 0;

// 入力状態
const keys = {
    left: false,
    right: false,
    jump: false,
    dash: false
};

// サウンドシステム
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioCtx();
    }
}

function playSound(type) {
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    switch(type) {
        case 'jump':
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'doubleJump':
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
            break;
        case 'coin':
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(1100, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
            break;
        case 'hurt':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
            break;
        case 'clear':
            osc.type = 'square';
            [523, 659, 784, 1047].forEach((freq, i) => {
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
            });
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        case 'death':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        case 'dash':
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;
        case 'spring':
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
            break;
    }
}

// プレイヤークラス
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpPower = 13;
        this.onGround = false;
        this.canDoubleJump = true;
        this.wallSliding = false;
        this.wallSide = 0;
        this.facing = 1;
        this.dashCooldown = 0;
        this.dashing = false;
        this.dashTime = 0;
        this.invincible = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.particles = [];
    }
    
    update(level) {
        // ダッシュ処理
        if (this.dashing) {
            this.dashTime--;
            if (this.dashTime <= 0) {
                this.dashing = false;
            }
        } else {
            // 通常移動
            if (keys.left) {
                this.vx = -this.speed;
                this.facing = -1;
            } else if (keys.right) {
                this.vx = this.speed;
                this.facing = 1;
            } else {
                this.vx *= FRICTION;
            }
        }
        
        // ダッシュ開始
        if (keys.dash && this.dashCooldown <= 0 && !this.dashing) {
            this.dashing = true;
            this.dashTime = 8;
            this.dashCooldown = 30;
            this.vx = this.facing * 15;
            this.vy = 0;
            playSound('dash');
            
            // ダッシュパーティクル
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    vx: -this.facing * (Math.random() * 3 + 2),
                    vy: (Math.random() - 0.5) * 2,
                    life: 15,
                    color: '#00d9ff'
                });
            }
        }
        
        if (this.dashCooldown > 0) this.dashCooldown--;
        
        // 重力
        if (!this.dashing) {
            this.vy += GRAVITY;
            if (this.vy > 15) this.vy = 15;
        }
        
        // 壁滑り判定
        this.wallSliding = false;
        if (!this.onGround && this.vy > 0) {
            // 左壁
            if (this.checkWallCollision(level, -1)) {
                this.wallSliding = true;
                this.wallSide = -1;
                this.vy = Math.min(this.vy, 3);
            }
            // 右壁
            if (this.checkWallCollision(level, 1)) {
                this.wallSliding = true;
                this.wallSide = 1;
                this.vy = Math.min(this.vy, 3);
            }
        }
        
        // ジャンプ
        if (keys.jump) {
            if (this.onGround) {
                this.vy = -this.jumpPower;
                this.onGround = false;
                playSound('jump');
                this.spawnDust();
            } else if (this.wallSliding) {
                // 壁キック
                this.vy = -this.jumpPower * 0.9;
                this.vx = -this.wallSide * 8;
                this.wallSliding = false;
                playSound('jump');
            } else if (this.canDoubleJump) {
                this.vy = -this.jumpPower * 0.85;
                this.canDoubleJump = false;
                playSound('doubleJump');
                this.spawnDust();
            }
            keys.jump = false;
        }
        
        // 移動
        this.x += this.vx;
        this.handleCollisionX(level);
        
        this.y += this.vy;
        this.handleCollisionY(level);
        
        // 無敵時間
        if (this.invincible > 0) this.invincible--;
        
        // アニメーション
        this.animTimer++;
        if (this.animTimer > 6) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
        
        // パーティクル更新
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
        
        // 落下死
        if (this.y > level.height * TILE_SIZE + 100) {
            this.die();
        }
    }
    
    spawnDust() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.x + this.width/2,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 2,
                life: 20,
                color: '#a0a0a0'
            });
        }
    }
    
    checkWallCollision(level, dir) {
        const checkX = dir < 0 ? this.x - 2 : this.x + this.width + 2;
        const topTile = Math.floor(this.y / TILE_SIZE);
        const botTile = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        const tileX = Math.floor(checkX / TILE_SIZE);
        
        for (let ty = topTile; ty <= botTile; ty++) {
            if (level.getTile(tileX, ty) === 1) {
                return true;
            }
        }
        return false;
    }
    
    handleCollisionX(level) {
        const leftTile = Math.floor(this.x / TILE_SIZE);
        const rightTile = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        const topTile = Math.floor(this.y / TILE_SIZE);
        const botTile = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        
        for (let ty = topTile; ty <= botTile; ty++) {
            // 左
            if (level.getTile(leftTile, ty) === 1) {
                this.x = (leftTile + 1) * TILE_SIZE;
                this.vx = 0;
            }
            // 右
            if (level.getTile(rightTile, ty) === 1) {
                this.x = rightTile * TILE_SIZE - this.width;
                this.vx = 0;
            }
        }
    }
    
    handleCollisionY(level) {
        const leftTile = Math.floor(this.x / TILE_SIZE);
        const rightTile = Math.floor((this.x + this.width - 1) / TILE_SIZE);
        const topTile = Math.floor(this.y / TILE_SIZE);
        const botTile = Math.floor((this.y + this.height - 1) / TILE_SIZE);
        
        this.onGround = false;
        
        for (let tx = leftTile; tx <= rightTile; tx++) {
            // 下
            const botCheck = level.getTile(tx, botTile);
            if (botCheck === 1 || botCheck === 2) {
                if (this.vy >= 0) {
                    this.y = botTile * TILE_SIZE - this.height;
                    this.vy = 0;
                    this.onGround = true;
                    this.canDoubleJump = true;
                }
            }
            // 上
            if (level.getTile(tx, topTile) === 1) {
                if (this.vy < 0) {
                    this.y = (topTile + 1) * TILE_SIZE;
                    this.vy = 0;
                }
            }
        }
    }
    
    die() {
        playSound('death');
        lives--;
        damageCount++;
        
        if (lives <= 0) {
            gameState = 'gameover';
            showScreen('gameover-screen');
        } else {
            // リスポーン
            const level = levels[currentLevel];
            this.x = level.spawn.x * TILE_SIZE;
            this.y = level.spawn.y * TILE_SIZE;
            this.vx = 0;
            this.vy = 0;
            this.invincible = 60;
        }
        updateUI();
    }
    
    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);
        
        // パーティクル
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / 20;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // 無敵点滅
        if (this.invincible > 0 && Math.floor(this.invincible / 4) % 2) {
            ctx.restore();
            return;
        }
        
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        // 体
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 5, 15, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 顔
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(cx + this.facing * 3, cy - 5, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 目
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(cx + this.facing * 6, cy - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 頬
        ctx.fillStyle = '#ffab91';
        ctx.beginPath();
        ctx.arc(cx + this.facing * 10, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 足（アニメーション）
        ctx.fillStyle = '#0288d1';
        const legOffset = Math.sin(this.animFrame * Math.PI / 2) * 4;
        if (Math.abs(this.vx) > 0.5 || !this.onGround) {
            ctx.fillRect(cx - 8, this.y + this.height - 8, 6, 8);
            ctx.fillRect(cx + 2, this.y + this.height - 8 + (this.onGround ? legOffset : 0), 6, 8);
        } else {
            ctx.fillRect(cx - 8, this.y + this.height - 8, 6, 8);
            ctx.fillRect(cx + 2, this.y + this.height - 8, 6, 8);
        }
        
        ctx.restore();
    }
}

// レベルクラス
class Level {
    constructor(data) {
        this.map = data.map;
        this.width = this.map[0].length;
        this.height = this.map.length;
        this.spawn = data.spawn;
        this.goal = data.goal;
        this.coins = [];
        this.spikes = [];
        this.springs = [];
        this.platforms = [];
        this.checkpoints = [];
        
        this.parseMap();
    }
    
    parseMap() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.map[y][x];
                if (tile === 3) { // コイン
                    this.coins.push({ x: x * TILE_SIZE + 10, y: y * TILE_SIZE + 10, collected: false });
                }
                if (tile === 4) { // スパイク
                    this.spikes.push({ x: x * TILE_SIZE, y: y * TILE_SIZE });
                }
                if (tile === 5) { // バネ
                    this.springs.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, active: false });
                }
                if (tile === 6) { // チェックポイント
                    this.checkpoints.push({ x, y, activated: false });
                }
            }
        }
    }
    
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 0;
        return this.map[y][x];
    }
    
    update(player) {
        // コイン収集
        this.coins.forEach(coin => {
            if (!coin.collected) {
                if (player.x < coin.x + 20 && player.x + player.width > coin.x &&
                    player.y < coin.y + 20 && player.y + player.height > coin.y) {
                    coin.collected = true;
                    coins++;
                    playSound('coin');
                    updateUI();
                }
            }
        });
        
        // スパイクダメージ
        this.spikes.forEach(spike => {
            if (player.invincible <= 0 &&
                player.x < spike.x + TILE_SIZE && player.x + player.width > spike.x &&
                player.y < spike.y + TILE_SIZE && player.y + player.height > spike.y + 20) {
                player.die();
            }
        });
        
        // バネ
        this.springs.forEach(spring => {
            if (player.x < spring.x + TILE_SIZE && player.x + player.width > spring.x &&
                player.y + player.height > spring.y && player.y + player.height < spring.y + 20 &&
                player.vy >= 0) {
                player.vy = -20;
                player.canDoubleJump = true;
                spring.active = true;
                setTimeout(() => spring.active = false, 200);
                playSound('spring');
            }
        });
        
        // チェックポイント
        this.checkpoints.forEach(cp => {
            if (!cp.activated &&
                player.x < (cp.x + 1) * TILE_SIZE && player.x + player.width > cp.x * TILE_SIZE &&
                player.y < (cp.y + 1) * TILE_SIZE && player.y + player.height > cp.y * TILE_SIZE) {
                cp.activated = true;
                this.spawn = { x: cp.x, y: cp.y - 1 };
            }
        });
        
        // ゴール判定
        if (player.x < (this.goal.x + 1) * TILE_SIZE && player.x + player.width > this.goal.x * TILE_SIZE &&
            player.y < (this.goal.y + 1) * TILE_SIZE && player.y + player.height > this.goal.y * TILE_SIZE) {
            levelClear();
        }
        
        // 動くプラットフォーム
        this.platforms.forEach(plat => {
            plat.x += plat.vx;
            plat.y += plat.vy;
            
            if (plat.x <= plat.minX || plat.x >= plat.maxX) plat.vx *= -1;
            if (plat.y <= plat.minY || plat.y >= plat.maxY) plat.vy *= -1;
            
            // プレイヤーとの衝突
            if (player.vy >= 0 &&
                player.x < plat.x + plat.width && player.x + player.width > plat.x &&
                player.y + player.height >= plat.y && player.y + player.height <= plat.y + 15) {
                player.y = plat.y - player.height;
                player.vy = 0;
                player.onGround = true;
                player.canDoubleJump = true;
                player.x += plat.vx;
            }
        });
    }
    
    draw() {
        ctx.save();
        ctx.translate(-cameraX, 0);
        
        // 背景（パララックス）
        this.drawBackground();
        
        // タイル
        const startX = Math.max(0, Math.floor(cameraX / TILE_SIZE) - 1);
        const endX = Math.min(this.width, Math.ceil((cameraX + GAME_WIDTH) / TILE_SIZE) + 1);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.map[y][x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                
                if (tile === 1) { // 壁
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                    ctx.fillStyle = '#6d5047';
                    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                    // ブロック模様
                    ctx.fillStyle = '#4d3027';
                    ctx.fillRect(px, py + TILE_SIZE/2 - 1, TILE_SIZE, 2);
                    ctx.fillRect(px + TILE_SIZE/2 - 1, py, 2, TILE_SIZE);
                }
                if (tile === 2) { // 一方向プラットフォーム
                    ctx.fillStyle = '#8bc34a';
                    ctx.fillRect(px, py, TILE_SIZE, 10);
                    ctx.fillStyle = '#689f38';
                    ctx.fillRect(px, py + 5, TILE_SIZE, 5);
                }
            }
        }
        
        // スパイク
        ctx.fillStyle = '#e53935';
        this.spikes.forEach(spike => {
            ctx.beginPath();
            ctx.moveTo(spike.x + TILE_SIZE/2, spike.y + 10);
            ctx.lineTo(spike.x + 5, spike.y + TILE_SIZE);
            ctx.lineTo(spike.x + TILE_SIZE - 5, spike.y + TILE_SIZE);
            ctx.closePath();
            ctx.fill();
        });
        
        // バネ
        this.springs.forEach(spring => {
            ctx.fillStyle = spring.active ? '#ff9800' : '#ffc107';
            const compression = spring.active ? 15 : 0;
            ctx.fillRect(spring.x + 5, spring.y + 20 + compression, TILE_SIZE - 10, TILE_SIZE - 20 - compression);
            ctx.fillStyle = '#f57c00';
            ctx.fillRect(spring.x + 2, spring.y + 20 + compression, TILE_SIZE - 4, 8);
        });
        
        // コイン
        const coinBob = Math.sin(Date.now() / 200) * 3;
        this.coins.forEach(coin => {
            if (!coin.collected) {
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(coin.x + 10, coin.y + 10 + coinBob, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(coin.x + 8, coin.y + 8 + coinBob, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // チェックポイント
        this.checkpoints.forEach(cp => {
            const px = cp.x * TILE_SIZE;
            const py = cp.y * TILE_SIZE;
            ctx.fillStyle = cp.activated ? '#4caf50' : '#9e9e9e';
            ctx.fillRect(px + 15, py, 10, TILE_SIZE);
            ctx.fillStyle = cp.activated ? '#8bc34a' : '#bdbdbd';
            ctx.beginPath();
            ctx.moveTo(px + 25, py);
            ctx.lineTo(px + 40, py + 15);
            ctx.lineTo(px + 25, py + 30);
            ctx.closePath();
            ctx.fill();
        });
        
        // ゴール
        const gx = this.goal.x * TILE_SIZE;
        const gy = this.goal.y * TILE_SIZE;
        ctx.fillStyle = '#e91e63';
        ctx.fillRect(gx + 15, gy - 40, 8, 80);
        ctx.fillStyle = '#f06292';
        const flagWave = Math.sin(Date.now() / 300) * 5;
        ctx.beginPath();
        ctx.moveTo(gx + 23, gy - 40);
        ctx.lineTo(gx + 50 + flagWave, gy - 25);
        ctx.lineTo(gx + 23, gy - 10);
        ctx.closePath();
        ctx.fill();
        
        // 動くプラットフォーム
        this.platforms.forEach(plat => {
            ctx.fillStyle = '#78909c';
            ctx.fillRect(plat.x, plat.y, plat.width, 15);
            ctx.fillStyle = '#546e7a';
            ctx.fillRect(plat.x, plat.y + 10, plat.width, 5);
        });
        
        ctx.restore();
    }
    
    drawBackground() {
        // 空
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f7fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(cameraX, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 遠景の山
        ctx.fillStyle = '#b0bec5';
        for (let i = 0; i < 5; i++) {
            const mx = i * 300 - (cameraX * 0.1) % 300;
            ctx.beginPath();
            ctx.moveTo(cameraX + mx, GAME_HEIGHT);
            ctx.lineTo(cameraX + mx + 150, GAME_HEIGHT - 200);
            ctx.lineTo(cameraX + mx + 300, GAME_HEIGHT);
            ctx.closePath();
            ctx.fill();
        }
        
        // 近景の丘
        ctx.fillStyle = '#81c784';
        for (let i = 0; i < 8; i++) {
            const hx = i * 200 - (cameraX * 0.3) % 200;
            ctx.beginPath();
            ctx.arc(cameraX + hx + 100, GAME_HEIGHT + 50, 150, 0, Math.PI, true);
            ctx.fill();
        }
        
        // 雲
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 6; i++) {
            const cloudX = i * 250 - (cameraX * 0.05 + Date.now() * 0.01) % 250;
            const cloudY = 50 + (i % 3) * 40;
            ctx.beginPath();
            ctx.arc(cameraX + cloudX, cloudY, 30, 0, Math.PI * 2);
            ctx.arc(cameraX + cloudX + 30, cloudY - 10, 25, 0, Math.PI * 2);
            ctx.arc(cameraX + cloudX + 50, cloudY, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// レベルデータ
const levelData = [
    // ステージ1: チュートリアル
    {
        spawn: { x: 2, y: 12 },
        goal: { x: 28, y: 12 },
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,2,2,2,0,0,0,0,3,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
            [0,0,0,0,3,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    },
    // ステージ2: バネとスパイク
    {
        spawn: { x: 2, y: 12 },
        goal: { x: 35, y: 5 },
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,4,4,0,0,0,0,0,0,4,4,4,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    },
    // ステージ3: 壁キック
    {
        spawn: { x: 2, y: 12 },
        goal: { x: 25, y: 2 },
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,1,1,1,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
            [0,0,0,3,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ]
    },
    // ステージ4: 動くプラットフォーム
    {
        spawn: { x: 2, y: 12 },
        goal: { x: 38, y: 3 },
        platforms: [
            { x: 280, y: 400, width: 80, vx: 2, vy: 0, minX: 200, maxX: 400, minY: 400, maxY: 400 },
            { x: 520, y: 350, width: 80, vx: 0, vy: 1.5, minX: 520, maxX: 520, minY: 280, maxY: 420 },
            { x: 760, y: 300, width: 80, vx: 2, vy: 0, minX: 700, maxX: 900, minY: 300, maxY: 300 },
            { x: 1000, y: 250, width: 80, vx: 0, vy: 1.5, minX: 1000, maxX: 1000, minY: 180, maxY: 350 },
            { x: 1240, y: 200, width: 80, vx: 2, vy: 0, minX: 1180, maxX: 1380, minY: 200, maxY: 200 }
        ],
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },
    // ステージ5: 最終ステージ
    {
        spawn: { x: 2, y: 12 },
        goal: { x: 45, y: 2 },
        platforms: [
            { x: 800, y: 300, width: 60, vx: 2, vy: 0, minX: 720, maxX: 880, minY: 300, maxY: 300 },
            { x: 1200, y: 250, width: 60, vx: 0, vy: 2, minX: 1200, maxX: 1200, minY: 150, maxY: 350 }
        ],
        map: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,3,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,2,2,2,0,0,5,0,0,2,2,2,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    }
];

let levels = [];
let player = null;
let unlockedLevels = 1;
let levelStars = {};

// ゲーム初期化
function init() {
    loadProgress();
    setupEventListeners();
    updateUI();
    gameLoop();
}

function loadProgress() {
    const saved = localStorage.getItem('platformer_progress');
    if (saved) {
        const data = JSON.parse(saved);
        unlockedLevels = data.unlocked || 1;
        levelStars = data.stars || {};
    }
}

function saveProgress() {
    localStorage.setItem('platformer_progress', JSON.stringify({
        unlocked: unlockedLevels,
        stars: levelStars
    }));
}

function setupEventListeners() {
    // キーボード
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
            keys.jump = true;
            initAudio();
        }
        if (e.key === 'Shift') keys.dash = true;
        if (e.key === 'Escape' && gameState === 'playing') {
            gameState = 'menu';
            showScreen('menu-screen');
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
        if (e.key === 'Shift') keys.dash = false;
    });
    
    // モバイルボタン
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnJump = document.getElementById('btn-jump');
    const btnDash = document.getElementById('btn-dash');
    
    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; initAudio(); });
    btnLeft.addEventListener('touchend', () => keys.left = false);
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
    btnRight.addEventListener('touchend', () => keys.right = false);
    btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); keys.jump = true; initAudio(); });
    btnDash.addEventListener('touchstart', (e) => { e.preventDefault(); keys.dash = true; });
    btnDash.addEventListener('touchend', () => keys.dash = false);
    
    // メニューボタン
    document.getElementById('start-btn').addEventListener('click', () => startGame(0));
    document.getElementById('select-btn').addEventListener('click', () => showStageSelect());
    document.getElementById('back-btn').addEventListener('click', () => showScreen('menu-screen'));
    document.getElementById('next-btn').addEventListener('click', () => startGame(currentLevel + 1));
    document.getElementById('retry-btn').addEventListener('click', () => startGame(currentLevel));
    document.getElementById('continue-btn').addEventListener('click', () => startGame(currentLevel));
    document.getElementById('menu-btn').addEventListener('click', () => showScreen('menu-screen'));
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

function showStageSelect() {
    const grid = document.getElementById('stage-grid');
    grid.innerHTML = '';
    
    for (let i = 0; i < levelData.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'stage-btn';
        if (i >= unlockedLevels) btn.classList.add('locked');
        if (levelStars[i]) btn.classList.add('cleared');
        
        btn.innerHTML = `
            <span>${i >= unlockedLevels ? '🔒' : (i + 1)}</span>
            <span class="stage-stars">${'⭐'.repeat(levelStars[i] || 0)}</span>
        `;
        
        if (i < unlockedLevels) {
            btn.addEventListener('click', () => startGame(i));
        }
        
        grid.appendChild(btn);
    }
    
    showScreen('select-screen');
}

function startGame(levelIndex) {
    if (levelIndex >= levelData.length) {
        showScreen('menu-screen');
        return;
    }
    
    currentLevel = levelIndex;
    const data = levelData[currentLevel];
    
    // レベル初期化
    levels[currentLevel] = new Level(data);
    const level = levels[currentLevel];
    
    // 動くプラットフォーム追加
    if (data.platforms) {
        level.platforms = data.platforms.map(p => ({...p}));
    }
    
    // プレイヤー初期化
    player = new Player(data.spawn.x * TILE_SIZE, data.spawn.y * TILE_SIZE);
    
    // 状態リセット
    lives = 3;
    coins = 0;
    totalCoins = level.coins.length;
    damageCount = 0;
    startTime = Date.now();
    cameraX = 0;
    
    updateUI();
    showScreen('');
    document.getElementById('ui-overlay').style.display = 'flex';
    gameState = 'playing';
    
    initAudio();
}

function levelClear() {
    gameState = 'clear';
    elapsedTime = (Date.now() - startTime) / 1000;
    playSound('clear');
    
    // スター計算
    let stars = 1;
    if (coins === totalCoins) stars++;
    if (damageCount === 0) stars++;
    
    // 記録保存
    if (!levelStars[currentLevel] || stars > levelStars[currentLevel]) {
        levelStars[currentLevel] = stars;
    }
    
    // 次のレベルアンロック
    if (currentLevel + 1 > unlockedLevels - 1) {
        unlockedLevels = currentLevel + 2;
    }
    
    saveProgress();
    
    // 画面表示
    const mins = Math.floor(elapsedTime / 60);
    const secs = Math.floor(elapsedTime % 60);
    document.getElementById('clear-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('clear-coins').textContent = `${coins}/${totalCoins}`;
    document.getElementById('clear-damage').textContent = `${damageCount}回`;
    document.getElementById('stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    
    showScreen('clear-screen');
}

function updateUI() {
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
    document.getElementById('coins').textContent = `🪙 ${coins}`;
    document.getElementById('level-display').textContent = `Stage ${currentLevel + 1}`;
    
    if (gameState === 'playing') {
        const elapsed = (Date.now() - startTime) / 1000;
        const mins = Math.floor(elapsed / 60);
        const secs = Math.floor(elapsed % 60);
        document.getElementById('time').textContent = `⏱️ ${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

function gameLoop() {
    if (gameState === 'playing') {
        const level = levels[currentLevel];
        
        // 更新
        player.update(level);
        level.update(player);
        
        // カメラ追従
        const targetCameraX = player.x - GAME_WIDTH / 2 + player.width / 2;
        cameraX += (targetCameraX - cameraX) * 0.1;
        cameraX = Math.max(0, Math.min(level.width * TILE_SIZE - GAME_WIDTH, cameraX));
        
        // 描画
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        level.draw();
        player.draw();
        
        updateUI();
    }
    
    requestAnimationFrame(gameLoop);
}

// 開始
init();
