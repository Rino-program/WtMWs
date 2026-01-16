/**
 * Space Invaders - 高品質シューティングゲーム
 * 機能: パワーアップ、ボス戦、ウェーブシステム、パーティクルエフェクト
 */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ゲーム設定
const CONFIG = {
    width: 800,
    height: 600,
    playerSpeed: 8,
    bulletSpeed: 12,
    enemyBulletSpeed: 5,
    invaderSpeed: 1,
    dropDistance: 30
};

canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

// ゲーム状態
let state = {
    score: 0,
    wave: 1,
    lives: 3,
    highScore: +localStorage.getItem('invadersHigh') || 0,
    isPlaying: false,
    isPaused: false,
    gameOver: false
};

// エンティティ
let player = null;
let bullets = [];
let enemyBullets = [];
let invaders = [];
let particles = [];
let powerUps = [];
let shields = [];

// パワーアップ状態
let powerUpState = {
    rapidFire: false,
    multiShot: false,
    shield: false,
    rapidFireTimer: 0,
    multiShotTimer: 0,
    shieldTimer: 0
};

// 入力状態
const keys = {
    left: false,
    right: false,
    fire: false
};

let lastFireTime = 0;
const fireRate = 200; // ms

// プレイヤークラス
class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = CONFIG.width / 2 - this.width / 2;
        this.y = CONFIG.height - 60;
        this.color = '#4facfe';
    }
    
    update() {
        if (keys.left && this.x > 10) {
            this.x -= CONFIG.playerSpeed;
        }
        if (keys.right && this.x < CONFIG.width - this.width - 10) {
            this.x += CONFIG.playerSpeed;
        }
    }
    
    draw() {
        ctx.save();
        
        // シールド表示
        if (powerUpState.shield) {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 40, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(79, 172, 254, ${0.3 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // 機体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x + 10, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        // コックピット
        ctx.fillStyle = '#00f2fe';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + 15, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // エンジン炎
        const flameHeight = 10 + Math.random() * 5;
        ctx.fillStyle = '#f5576c';
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + this.height);
        ctx.lineTo(this.x + 20, this.y + this.height + flameHeight);
        ctx.lineTo(this.x + 25, this.y + this.height);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 25, this.y + this.height);
        ctx.lineTo(this.x + this.width - 20, this.y + this.height + flameHeight);
        ctx.lineTo(this.x + this.width - 15, this.y + this.height);
        ctx.fill();
        
        ctx.restore();
    }
}

// 弾丸クラス
class Bullet {
    constructor(x, y, dx = 0) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 15;
        this.speed = CONFIG.bulletSpeed;
        this.dx = dx;
        this.color = powerUpState.multiShot ? '#43e97b' : '#4facfe';
    }
    
    update() {
        this.y -= this.speed;
        this.x += this.dx;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// 敵の弾丸
class EnemyBullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 12;
        this.speed = CONFIG.enemyBulletSpeed;
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw() {
        ctx.fillStyle = '#f5576c';
        ctx.shadowColor = '#f5576c';
        ctx.shadowBlur = 8;
        ctx.fillRect(this.x - this.width/2, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}

// インベーダークラス
class Invader {
    constructor(x, y, type) {
        this.width = 40;
        this.height = 30;
        this.x = x;
        this.y = y;
        this.type = type; // 0: 弱, 1: 中, 2: 強
        this.alive = true;
        this.animFrame = 0;
        this.colors = ['#43e97b', '#f5af19', '#f5576c'];
        this.points = [10, 20, 30];
    }
    
    draw() {
        if (!this.alive) return;
        
        const color = this.colors[this.type];
        ctx.fillStyle = color;
        
        // 異なるタイプで異なる形状
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.type === 0) {
            // タイプ0: シンプルな形状
            ctx.fillRect(-15, -10, 30, 20);
            ctx.fillRect(-20, -5, 10, 10);
            ctx.fillRect(10, -5, 10, 10);
            // 目
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, -3, 5, 5);
            ctx.fillRect(3, -3, 5, 5);
        } else if (this.type === 1) {
            // タイプ1: カニ型
            ctx.fillRect(-12, -12, 24, 24);
            ctx.fillRect(-18, -6, 6, 12);
            ctx.fillRect(12, -6, 6, 12);
            ctx.fillRect(-6, 12, 4, 6);
            ctx.fillRect(2, 12, 4, 6);
            ctx.fillStyle = '#000';
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(2, -6, 4, 4);
        } else {
            // タイプ2: タコ型
            ctx.beginPath();
            ctx.arc(0, -5, 15, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-15, -5, 30, 15);
            // 触手
            for (let i = -2; i <= 2; i++) {
                const wobble = Math.sin(Date.now() / 200 + i) * 3;
                ctx.fillRect(i * 6 - 2, 10, 4, 8 + wobble);
            }
            ctx.fillStyle = '#000';
            ctx.fillRect(-8, -8, 5, 5);
            ctx.fillRect(3, -8, 5, 5);
        }
        
        ctx.restore();
    }
}

// パーティクルクラス
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (Math.random() - 0.5) * 8;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 4;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// パワーアップクラス
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 25;
        this.speed = 2;
        this.type = Math.floor(Math.random() * 4); // 0: rapid, 1: shield, 2: multi, 3: bomb
        this.icons = ['⚡', '🛡️', '✦', '💣'];
        this.colors = ['#f5af19', '#4facfe', '#43e97b', '#f5576c'];
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 背景円
        ctx.fillStyle = this.colors[this.type];
        ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.1;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.colors[this.type];
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // アイコン
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icons[this.type], 0, 0);
        
        ctx.restore();
    }
}

// シールドブロック
class Shield {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 40;
        this.blocks = [];
        
        // ブロックで構成
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                // 下部の切り欠き
                if (row >= 2 && (col <= 1 || col >= 4)) continue;
                this.blocks.push({
                    x: x + col * 10,
                    y: y + row * 10,
                    width: 10,
                    height: 10,
                    health: 3
                });
            }
        }
    }
    
    draw() {
        this.blocks.forEach(block => {
            const alpha = block.health / 3;
            ctx.fillStyle = `rgba(67, 233, 123, ${alpha})`;
            ctx.fillRect(block.x, block.y, block.width - 1, block.height - 1);
        });
    }
}

// インベーダー生成
function createInvaders() {
    invaders = [];
    const rows = Math.min(3 + Math.floor(state.wave / 3), 6);
    const cols = Math.min(8 + Math.floor(state.wave / 2), 11);
    const spacing = 55;
    const startX = (CONFIG.width - cols * spacing) / 2;
    const startY = 50;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const type = row < rows / 3 ? 2 : row < rows * 2 / 3 ? 1 : 0;
            invaders.push(new Invader(
                startX + col * spacing,
                startY + row * 45,
                type
            ));
        }
    }
}

// シールド生成
function createShields() {
    shields = [];
    const positions = [150, 350, 550];
    positions.forEach(x => {
        shields.push(new Shield(x, CONFIG.height - 150));
    });
}

// 爆発エフェクト
function createExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// 発射処理
function fire() {
    const now = Date.now();
    const rate = powerUpState.rapidFire ? fireRate / 3 : fireRate;
    
    if (now - lastFireTime < rate) return;
    lastFireTime = now;
    
    if (powerUpState.multiShot) {
        bullets.push(new Bullet(player.x + player.width / 2, player.y, 0));
        bullets.push(new Bullet(player.x + player.width / 2, player.y, -3));
        bullets.push(new Bullet(player.x + player.width / 2, player.y, 3));
    } else {
        bullets.push(new Bullet(player.x + player.width / 2, player.y));
    }
}

// 敵の発射
function enemyFire() {
    const aliveInvaders = invaders.filter(i => i.alive);
    if (aliveInvaders.length === 0) return;
    
    // ランダムに発射
    if (Math.random() < 0.02 * (1 + state.wave * 0.1)) {
        const shooter = aliveInvaders[Math.floor(Math.random() * aliveInvaders.length)];
        enemyBullets.push(new EnemyBullet(
            shooter.x + shooter.width / 2,
            shooter.y + shooter.height
        ));
    }
}

// パワーアップ適用
function applyPowerUp(type) {
    const duration = 8000;
    
    switch(type) {
        case 0: // Rapid Fire
            powerUpState.rapidFire = true;
            powerUpState.rapidFireTimer = duration;
            showMessage('⚡ 連射モード！');
            break;
        case 1: // Shield
            powerUpState.shield = true;
            powerUpState.shieldTimer = duration;
            showMessage('🛡️ シールド展開！');
            break;
        case 2: // Multi Shot
            powerUpState.multiShot = true;
            powerUpState.multiShotTimer = duration;
            showMessage('✦ 3方向発射！');
            break;
        case 3: // Bomb
            // 画面上の敵を全て破壊
            invaders.forEach(inv => {
                if (inv.alive) {
                    inv.alive = false;
                    state.score += inv.points[inv.type];
                    createExplosion(inv.x + inv.width/2, inv.y + inv.height/2, inv.colors[inv.type], 10);
                }
            });
            showMessage('💣 全体攻撃！');
            break;
    }
}

// メッセージ表示
let messageTimeout;
function showMessage(text) {
    // 既存のメッセージを削除
    const existing = document.querySelector('.game-message');
    if (existing) existing.remove();
    
    const msg = document.createElement('div');
    msg.className = 'game-message';
    msg.textContent = text;
    msg.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: #fff;
        padding: 15px 30px;
        border-radius: 10px;
        font-size: 1.2rem;
        font-weight: bold;
        z-index: 100;
        animation: fadeInOut 1.5s ease;
    `;
    
    document.querySelector('.canvas-wrapper').appendChild(msg);
    
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => msg.remove(), 1500);
}

// 衝突判定
function checkCollisions() {
    // 弾丸とインベーダー
    bullets.forEach((bullet, bi) => {
        invaders.forEach(inv => {
            if (!inv.alive) return;
            if (bullet.x > inv.x && bullet.x < inv.x + inv.width &&
                bullet.y > inv.y && bullet.y < inv.y + inv.height) {
                inv.alive = false;
                bullets.splice(bi, 1);
                state.score += inv.points[inv.type];
                createExplosion(inv.x + inv.width/2, inv.y + inv.height/2, inv.colors[inv.type]);
                
                // パワーアップドロップ（15%確率）
                if (Math.random() < 0.15) {
                    powerUps.push(new PowerUp(inv.x + inv.width/2, inv.y + inv.height/2));
                }
            }
        });
    });
    
    // 弾丸とシールド
    bullets.forEach((bullet, bi) => {
        shields.forEach(shield => {
            shield.blocks.forEach((block, blockIndex) => {
                if (bullet.x > block.x && bullet.x < block.x + block.width &&
                    bullet.y > block.y && bullet.y < block.y + block.height) {
                    block.health--;
                    if (block.health <= 0) {
                        shield.blocks.splice(blockIndex, 1);
                    }
                    bullets.splice(bi, 1);
                }
            });
        });
    });
    
    // 敵の弾丸とプレイヤー
    enemyBullets.forEach((bullet, bi) => {
        // シールドとの衝突
        shields.forEach(shield => {
            shield.blocks.forEach((block, blockIndex) => {
                if (bullet.x > block.x && bullet.x < block.x + block.width &&
                    bullet.y > block.y && bullet.y < block.y + block.height) {
                    block.health--;
                    if (block.health <= 0) {
                        shield.blocks.splice(blockIndex, 1);
                    }
                    enemyBullets.splice(bi, 1);
                }
            });
        });
        
        // プレイヤーとの衝突
        if (bullet.x > player.x && bullet.x < player.x + player.width &&
            bullet.y > player.y && bullet.y < player.y + player.height) {
            if (powerUpState.shield) {
                powerUpState.shield = false;
                powerUpState.shieldTimer = 0;
                enemyBullets.splice(bi, 1);
                createExplosion(bullet.x, bullet.y, '#4facfe', 8);
            } else {
                enemyBullets.splice(bi, 1);
                playerHit();
            }
        }
    });
    
    // パワーアップとプレイヤー
    powerUps.forEach((pu, pi) => {
        const dx = pu.x - (player.x + player.width/2);
        const dy = pu.y - (player.y + player.height/2);
        if (Math.sqrt(dx*dx + dy*dy) < 40) {
            applyPowerUp(pu.type);
            powerUps.splice(pi, 1);
        }
    });
    
    // インベーダーがプレイヤーに到達
    invaders.forEach(inv => {
        if (inv.alive && inv.y + inv.height >= player.y) {
            gameOver();
        }
    });
}

// プレイヤー被弾
function playerHit() {
    state.lives--;
    updateUI();
    createExplosion(player.x + player.width/2, player.y + player.height/2, '#4facfe', 20);
    document.querySelector('.canvas-wrapper').classList.add('shake');
    setTimeout(() => document.querySelector('.canvas-wrapper').classList.remove('shake'), 300);
    
    if (state.lives <= 0) {
        gameOver();
    }
}

// インベーダー移動
let invaderDirection = 1;
let invaderMoveTimer = 0;
const invaderMoveInterval = 1000;

function moveInvaders(dt) {
    invaderMoveTimer += dt;
    
    const aliveInvaders = invaders.filter(i => i.alive);
    if (aliveInvaders.length === 0) {
        nextWave();
        return;
    }
    
    // 移動速度はウェーブと残り数で増加
    const speedMultiplier = 1 + state.wave * 0.2 + (1 - aliveInvaders.length / invaders.length) * 2;
    const interval = invaderMoveInterval / speedMultiplier;
    
    if (invaderMoveTimer >= interval) {
        invaderMoveTimer = 0;
        
        // 端に到達したかチェック
        let hitEdge = false;
        aliveInvaders.forEach(inv => {
            if ((invaderDirection > 0 && inv.x + inv.width >= CONFIG.width - 20) ||
                (invaderDirection < 0 && inv.x <= 20)) {
                hitEdge = true;
            }
        });
        
        if (hitEdge) {
            invaderDirection *= -1;
            aliveInvaders.forEach(inv => {
                inv.y += CONFIG.dropDistance;
            });
        } else {
            aliveInvaders.forEach(inv => {
                inv.x += CONFIG.invaderSpeed * 20 * invaderDirection;
            });
        }
    }
}

// 次のウェーブ
function nextWave() {
    state.wave++;
    showMessage(`🌟 WAVE ${state.wave}`);
    createInvaders();
    
    // ウェーブボーナス
    state.score += state.wave * 100;
    updateUI();
}

// ゲームオーバー
function gameOver() {
    state.isPlaying = false;
    state.gameOver = true;
    
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('invadersHigh', state.highScore);
    }
    
    document.getElementById('overlayTitle').textContent = '💀 GAME OVER';
    document.getElementById('overlaySubtitle').textContent = `最終スコア: ${state.score.toLocaleString()}`;
    document.getElementById('startBtn').textContent = 'リトライ';
    document.getElementById('overlay').classList.add('show');
    updateUI();
}

// UI更新
function updateUI() {
    document.getElementById('score').textContent = state.score.toLocaleString();
    document.getElementById('wave').textContent = state.wave;
    document.getElementById('lives').textContent = '❤️'.repeat(state.lives) || '💀';
    document.getElementById('highScore').textContent = state.highScore.toLocaleString();
}

// パワーアップタイマー更新
function updatePowerUps(dt) {
    if (powerUpState.rapidFire) {
        powerUpState.rapidFireTimer -= dt;
        if (powerUpState.rapidFireTimer <= 0) {
            powerUpState.rapidFire = false;
        }
    }
    if (powerUpState.multiShot) {
        powerUpState.multiShotTimer -= dt;
        if (powerUpState.multiShotTimer <= 0) {
            powerUpState.multiShot = false;
        }
    }
    if (powerUpState.shield) {
        powerUpState.shieldTimer -= dt;
        if (powerUpState.shieldTimer <= 0) {
            powerUpState.shield = false;
        }
    }
}

// 描画
function draw() {
    // 背景
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    
    // グリッド
    ctx.strokeStyle = 'rgba(79, 172, 254, 0.05)';
    for (let i = 0; i < CONFIG.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CONFIG.height);
        ctx.stroke();
    }
    for (let i = 0; i < CONFIG.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CONFIG.width, i);
        ctx.stroke();
    }
    
    // シールド
    shields.forEach(s => s.draw());
    
    // インベーダー
    invaders.forEach(inv => inv.draw());
    
    // プレイヤー
    if (player) player.draw();
    
    // 弾丸
    bullets.forEach(b => b.draw());
    enemyBullets.forEach(b => b.draw());
    
    // パワーアップ
    powerUps.forEach(p => p.draw());
    
    // パーティクル
    particles.forEach(p => p.draw());
    
    // ポーズ表示
    if (state.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ PAUSED', CONFIG.width/2, CONFIG.height/2);
    }
}

// ゲームループ
let lastTime = 0;
function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;
    
    if (state.isPlaying && !state.isPaused) {
        // 入力処理
        player.update();
        if (keys.fire) fire();
        
        // 更新
        bullets.forEach(b => b.update());
        enemyBullets.forEach(b => b.update());
        powerUps.forEach(p => p.update());
        particles.forEach(p => p.update());
        
        moveInvaders(dt);
        enemyFire();
        
        // クリーンアップ
        bullets = bullets.filter(b => b.y > 0 && b.x > 0 && b.x < CONFIG.width);
        enemyBullets = enemyBullets.filter(b => b.y < CONFIG.height);
        powerUps = powerUps.filter(p => p.y < CONFIG.height);
        particles = particles.filter(p => p.life > 0);
        
        checkCollisions();
        updatePowerUps(dt);
        updateUI();
    }
    
    draw();
    requestAnimationFrame(gameLoop);
}

// ゲーム開始
function startGame() {
    state = {
        score: 0,
        wave: 1,
        lives: 3,
        highScore: state.highScore,
        isPlaying: true,
        isPaused: false,
        gameOver: false
    };
    
    powerUpState = {
        rapidFire: false,
        multiShot: false,
        shield: false,
        rapidFireTimer: 0,
        multiShotTimer: 0,
        shieldTimer: 0
    };
    
    player = new Player();
    bullets = [];
    enemyBullets = [];
    particles = [];
    powerUps = [];
    invaderDirection = 1;
    invaderMoveTimer = 0;
    
    createInvaders();
    createShields();
    
    document.getElementById('overlay').classList.remove('show');
    updateUI();
}

// イベントリスナー
document.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Space') {
        e.preventDefault();
        keys.fire = true;
    }
    if (e.code === 'KeyP' && state.isPlaying) {
        state.isPaused = !state.isPaused;
    }
});

document.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'Space') keys.fire = false;
});

// タッチコントロール
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const fireBtn = document.getElementById('fireBtn');

leftBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.left = true; });
leftBtn.addEventListener('touchend', () => keys.left = false);
rightBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.right = true; });
rightBtn.addEventListener('touchend', () => keys.right = false);
fireBtn.addEventListener('touchstart', e => { e.preventDefault(); keys.fire = true; });
fireBtn.addEventListener('touchend', () => keys.fire = false);

document.getElementById('startBtn').addEventListener('click', startGame);

// アニメーションCSS追加
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// 初期化
document.getElementById('overlay').classList.add('show');
updateUI();
requestAnimationFrame(gameLoop);
