// パックマン ゲーム
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ゲーム定数
const CELL_SIZE = 20;
const COLS = 28;
const ROWS = 31;

canvas.width = COLS * CELL_SIZE;
canvas.height = ROWS * CELL_SIZE;

// マップ凡例: 0=空, 1=壁, 2=ドット, 3=パワーエサ, 4=空(ドット無し), 5=ゴーストハウスドア, 6=ワープ
const MAPS = [
    // ステージ1 - クラシック風
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,2,1,1,1,1,1,4,1,1,4,1,1,1,1,1,2,1,1,1,1,1,1],
        [4,4,4,4,4,1,2,1,1,1,1,1,4,1,1,4,1,1,1,1,1,2,1,4,4,4,4,4],
        [4,4,4,4,4,1,2,1,1,4,4,4,4,4,4,4,4,4,4,1,1,2,1,4,4,4,4,4],
        [4,4,4,4,4,1,2,1,1,4,1,1,1,5,5,1,1,1,4,1,1,2,1,4,4,4,4,4],
        [1,1,1,1,1,1,2,1,1,4,1,4,4,4,4,4,4,1,4,1,1,2,1,1,1,1,1,1],
        [6,4,4,4,4,4,2,4,4,4,1,4,4,4,4,4,4,1,4,4,4,2,4,4,4,4,4,6],
        [1,1,1,1,1,1,2,1,1,4,1,4,4,4,4,4,4,1,4,1,1,2,1,1,1,1,1,1],
        [4,4,4,4,4,1,2,1,1,4,1,1,1,1,1,1,1,1,4,1,1,2,1,4,4,4,4,4],
        [4,4,4,4,4,1,2,1,1,4,4,4,4,4,4,4,4,4,4,1,1,2,1,4,4,4,4,4],
        [4,4,4,4,4,1,2,1,1,4,1,1,1,1,1,1,1,1,4,1,1,2,1,4,4,4,4,4],
        [1,1,1,1,1,1,2,1,1,4,1,1,1,1,1,1,1,1,4,1,1,2,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
        [1,3,2,2,1,1,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,1,1,2,2,3,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
        [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ステージ2 - 迷路風
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,2,1],
        [1,3,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,3,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,2,1,1,1,1,2,1,1,2,1,1,1,1,2,1,2,1,1,1,2,1],
        [1,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,1],
        [1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1],
        [4,4,4,4,1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1,4,4,4,4],
        [1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,1,1],
        [4,4,4,4,4,2,1,4,4,1,2,1,1,1,1,1,1,2,1,4,4,1,2,4,4,4,4,4],
        [4,4,4,4,4,2,1,4,4,1,2,1,1,1,1,1,1,2,1,4,4,1,2,4,4,4,4,4],
        [4,4,4,4,4,2,1,4,4,1,2,1,1,5,5,1,1,2,1,4,4,1,2,4,4,4,4,4],
        [1,1,1,1,1,2,1,4,4,1,2,1,4,4,4,4,1,2,1,4,4,1,2,1,1,1,1,1],
        [6,4,4,4,4,2,4,4,4,4,2,1,4,4,4,4,1,2,4,4,4,4,2,4,4,4,4,6],
        [1,1,1,1,1,2,1,4,4,1,2,1,4,4,4,4,1,2,1,4,4,1,2,1,1,1,1,1],
        [4,4,4,4,4,2,1,4,4,1,2,1,1,1,1,1,1,2,1,4,4,1,2,4,4,4,4,4],
        [4,4,4,4,4,2,1,4,4,1,2,2,2,2,2,2,2,2,1,4,4,1,2,4,4,4,4,4],
        [4,4,4,4,4,2,1,4,4,1,1,1,1,1,1,1,1,1,1,4,4,1,2,4,4,4,4,4],
        [1,1,1,1,1,2,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,2,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,1,2,1],
        [1,3,2,2,1,2,2,2,2,2,2,2,2,4,4,2,2,2,2,2,2,2,2,1,2,2,3,1],
        [1,1,1,2,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1,1,1],
        [1,2,2,2,2,2,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,2,1],
        [1,2,1,1,1,2,1,1,1,1,2,1,1,1,1,1,1,2,1,1,1,1,2,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // ステージ3 - オープン風
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,2,1,1,1,1,1,2,2,1,1,1,1,1,2,1,1,2,1,1,2,1],
        [1,3,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,3,1],
        [1,2,2,2,2,2,2,2,1,1,2,1,1,2,2,1,1,2,1,1,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,2,1,1,2,1,1,2,2,1,1,2,1,1,2,1,1,2,1,1,2,1],
        [1,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,1,1,2,1,1,1,1,1,1,2,1,1,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,4,1,1,4,1,1,1,1,1,1,4,1,1,4,1,1,2,1,1,2,1],
        [1,2,1,1,2,1,1,4,1,1,4,1,1,1,1,1,1,4,1,1,4,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,4,1,1,4,1,1,5,5,1,1,4,1,1,4,2,2,2,2,2,2,1],
        [1,1,1,1,2,1,1,4,1,1,4,1,4,4,4,4,1,4,1,1,4,1,1,2,1,1,1,1],
        [6,4,4,4,2,4,4,4,4,4,4,1,4,4,4,4,1,4,4,4,4,4,4,2,4,4,4,6],
        [1,1,1,1,2,1,1,4,1,1,4,1,4,4,4,4,1,4,1,1,4,1,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,4,1,1,4,1,1,1,1,1,1,4,1,1,4,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,4,1,1,4,4,4,4,4,4,4,4,1,1,4,1,1,2,1,1,2,1],
        [1,2,1,1,2,1,1,4,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,1],
        [1,3,1,1,2,1,1,2,1,1,1,1,1,2,2,1,1,1,1,1,2,1,1,2,1,1,3,1],
        [1,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,1,1,2,1,1,2,2,1,1,2,1,1,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,2,1,1,2,1,1,2,2,1,1,2,1,1,2,1,1,2,1,1,2,1],
        [1,2,1,1,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,1,1,1,1,1,2,2,1,1,1,1,1,2,2,2,2,2,2,2,1],
        [1,2,1,1,1,1,1,2,1,1,1,1,1,2,2,1,1,1,1,1,2,1,1,1,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

// ゲーム状態
const GameState = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    DYING: 'dying',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver'
};

// 方向
const Direction = {
    NONE: { x: 0, y: 0 },
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// ゴーストモード
const GhostMode = {
    SCATTER: 'scatter',
    CHASE: 'chase',
    FRIGHTENED: 'frightened',
    EATEN: 'eaten'
};

// サウンドマネージャー
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(frequency, duration, type = 'square', volume = 0.1) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playStart() {
        const notes = [262, 330, 392, 523];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'square', 0.08), i * 100);
        });
    }

    playDot() {
        this.playTone(440, 0.05, 'square', 0.03);
    }

    playPowerPellet() {
        this.playTone(200, 0.3, 'sawtooth', 0.1);
    }

    playEatGhost() {
        const freqs = [300, 400, 500, 600];
        freqs.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.1, 'square', 0.1), i * 50);
        });
    }

    playDeath() {
        const freqs = [500, 450, 400, 350, 300, 250, 200, 150];
        freqs.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.15, 'sawtooth', 0.1), i * 100);
        });
    }

    playLevelComplete() {
        const melody = [523, 587, 659, 698, 784, 880, 988, 1047];
        melody.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.1, 'square', 0.08), i * 80);
        });
    }

    playFruit() {
        this.playTone(800, 0.1, 'sine', 0.1);
        setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.1), 100);
    }
}

// パックマンクラス
class Pacman {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.pixelX = this.x * CELL_SIZE + CELL_SIZE / 2;
        this.pixelY = this.y * CELL_SIZE + CELL_SIZE / 2;
        this.direction = Direction.NONE;
        this.nextDirection = Direction.NONE;
        this.mouthAngle = 0;
        this.mouthOpening = true;
        this.speed = 2;
        this.alive = true;
        this.deathAnimation = 0;
    }

    update(map) {
        if (!this.alive) {
            this.deathAnimation += 0.1;
            return;
        }

        // 口のアニメーション
        if (this.mouthOpening) {
            this.mouthAngle += 0.15;
            if (this.mouthAngle >= 0.5) this.mouthOpening = false;
        } else {
            this.mouthAngle -= 0.15;
            if (this.mouthAngle <= 0) this.mouthOpening = true;
        }

        // 次の方向へ変更可能かチェック
        if (this.nextDirection !== Direction.NONE) {
            const nextX = this.x + this.nextDirection.x;
            const nextY = this.y + this.nextDirection.y;
            if (this.canMove(nextX, nextY, map)) {
                // セル中央付近でのみ方向転換
                const centerX = this.x * CELL_SIZE + CELL_SIZE / 2;
                const centerY = this.y * CELL_SIZE + CELL_SIZE / 2;
                if (Math.abs(this.pixelX - centerX) < this.speed + 1 && 
                    Math.abs(this.pixelY - centerY) < this.speed + 1) {
                    this.direction = this.nextDirection;
                    this.pixelX = centerX;
                    this.pixelY = centerY;
                }
            }
        }

        // 移動
        if (this.direction !== Direction.NONE) {
            const targetX = this.pixelX + this.direction.x * this.speed;
            const targetY = this.pixelY + this.direction.y * this.speed;
            
            const cellX = Math.floor(targetX / CELL_SIZE);
            const cellY = Math.floor(targetY / CELL_SIZE);
            
            // ワープトンネル
            if (cellX < 0) {
                this.pixelX = COLS * CELL_SIZE - CELL_SIZE / 2;
                this.x = COLS - 1;
                return;
            } else if (cellX >= COLS) {
                this.pixelX = CELL_SIZE / 2;
                this.x = 0;
                return;
            }

            const nextCellX = this.x + this.direction.x;
            const nextCellY = this.y + this.direction.y;

            if (this.canMove(nextCellX, nextCellY, map)) {
                this.pixelX = targetX;
                this.pixelY = targetY;
                this.x = Math.floor(this.pixelX / CELL_SIZE);
                this.y = Math.floor(this.pixelY / CELL_SIZE);
            } else {
                // 壁に当たったらセル中央に戻す
                this.pixelX = this.x * CELL_SIZE + CELL_SIZE / 2;
                this.pixelY = this.y * CELL_SIZE + CELL_SIZE / 2;
            }
        }
    }

    canMove(x, y, map) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return x < 0 || x >= COLS; // ワープ許可
        const cell = map[y][x];
        return cell !== 1 && cell !== 5;
    }

    draw(ctx) {
        const angle = this.getAngle();
        
        if (!this.alive) {
            // 死亡アニメーション
            ctx.save();
            ctx.translate(this.pixelX, this.pixelY);
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            
            const deathAngle = Math.min(this.deathAnimation, Math.PI);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, CELL_SIZE / 2 - 2, deathAngle, Math.PI * 2 - deathAngle);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(this.pixelX, this.pixelY);
        ctx.rotate(angle);
        
        // グロー効果
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        
        // パックマン本体
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, CELL_SIZE / 2 - 2, this.mouthAngle, Math.PI * 2 - this.mouthAngle);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    getAngle() {
        if (this.direction === Direction.RIGHT) return 0;
        if (this.direction === Direction.DOWN) return Math.PI / 2;
        if (this.direction === Direction.LEFT) return Math.PI;
        if (this.direction === Direction.UP) return -Math.PI / 2;
        return 0;
    }
}

// ゴーストクラス
class Ghost {
    constructor(name, color, x, y, cornerX, cornerY) {
        this.name = name;
        this.color = color;
        this.startX = x;
        this.startY = y;
        this.cornerX = cornerX;
        this.cornerY = cornerY;
        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.pixelX = this.x * CELL_SIZE + CELL_SIZE / 2;
        this.pixelY = this.y * CELL_SIZE + CELL_SIZE / 2;
        this.direction = Direction.UP;
        this.mode = GhostMode.SCATTER;
        this.speed = 1.5;
        this.frightenedTimer = 0;
        this.waveOffset = Math.random() * Math.PI * 2;
        this.inHouse = true;
        this.releaseTimer = 0;
        this.flashTimer = 0;
    }

    update(map, pacman, blinky, level) {
        // リリースタイマー
        if (this.inHouse) {
            this.releaseTimer++;
            const releaseTime = this.getReleaseTime();
            if (this.releaseTimer > releaseTime) {
                this.inHouse = false;
                this.y = 11;
                this.pixelY = this.y * CELL_SIZE + CELL_SIZE / 2;
            }
            return;
        }

        // 恐怖モードタイマー
        if (this.mode === GhostMode.FRIGHTENED) {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                this.mode = GhostMode.CHASE;
            }
        }

        // 速度調整
        let currentSpeed = this.speed + (level - 1) * 0.1;
        if (this.mode === GhostMode.FRIGHTENED) currentSpeed *= 0.5;
        if (this.mode === GhostMode.EATEN) currentSpeed *= 2;

        // 移動
        const centerX = this.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = this.y * CELL_SIZE + CELL_SIZE / 2;

        if (Math.abs(this.pixelX - centerX) < currentSpeed && 
            Math.abs(this.pixelY - centerY) < currentSpeed) {
            this.pixelX = centerX;
            this.pixelY = centerY;
            this.chooseDirection(map, pacman, blinky);
        }

        this.pixelX += this.direction.x * currentSpeed;
        this.pixelY += this.direction.y * currentSpeed;

        // ワープ
        if (this.pixelX < 0) {
            this.pixelX = COLS * CELL_SIZE;
            this.x = COLS - 1;
        } else if (this.pixelX > COLS * CELL_SIZE) {
            this.pixelX = 0;
            this.x = 0;
        }

        this.x = Math.floor(this.pixelX / CELL_SIZE);
        this.y = Math.floor(this.pixelY / CELL_SIZE);

        // 食べられた後、家に戻ったらリセット
        if (this.mode === GhostMode.EATEN && 
            this.x >= 12 && this.x <= 15 && this.y >= 13 && this.y <= 15) {
            this.mode = GhostMode.CHASE;
            this.x = this.startX;
            this.y = this.startY;
            this.pixelX = this.x * CELL_SIZE + CELL_SIZE / 2;
            this.pixelY = this.y * CELL_SIZE + CELL_SIZE / 2;
        }
    }

    getReleaseTime() {
        switch (this.name) {
            case 'Blinky': return 0;
            case 'Pinky': return 60;
            case 'Inky': return 180;
            case 'Clyde': return 300;
            default: return 0;
        }
    }

    chooseDirection(map, pacman, blinky) {
        const possibleDirs = [];
        const dirs = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
        const opposite = { x: -this.direction.x, y: -this.direction.y };

        for (const dir of dirs) {
            if (dir.x === opposite.x && dir.y === opposite.y) continue;
            const nextX = this.x + dir.x;
            const nextY = this.y + dir.y;
            if (this.canMove(nextX, nextY, map)) {
                possibleDirs.push(dir);
            }
        }

        if (possibleDirs.length === 0) {
            this.direction = { x: opposite.x, y: opposite.y };
            return;
        }

        let target;
        if (this.mode === GhostMode.EATEN) {
            target = { x: 13, y: 14 }; // 家に戻る
        } else if (this.mode === GhostMode.FRIGHTENED) {
            // ランダム
            this.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
            return;
        } else if (this.mode === GhostMode.SCATTER) {
            target = { x: this.cornerX, y: this.cornerY };
        } else {
            target = this.getChaseTarget(pacman, blinky);
        }

        // 最も近い方向を選択
        let bestDir = possibleDirs[0];
        let bestDist = Infinity;

        for (const dir of possibleDirs) {
            const nextX = this.x + dir.x;
            const nextY = this.y + dir.y;
            const dist = Math.pow(nextX - target.x, 2) + Math.pow(nextY - target.y, 2);
            if (dist < bestDist) {
                bestDist = dist;
                bestDir = dir;
            }
        }

        this.direction = bestDir;
    }

    getChaseTarget(pacman, blinky) {
        switch (this.name) {
            case 'Blinky': // 直接追跡
                return { x: pacman.x, y: pacman.y };
            
            case 'Pinky': // 4マス先を狙う
                return {
                    x: pacman.x + pacman.direction.x * 4,
                    y: pacman.y + pacman.direction.y * 4
                };
            
            case 'Inky': // Blinkyとの位置関係で決定（ランダム要素追加）
                if (Math.random() < 0.3) {
                    return { 
                        x: Math.floor(Math.random() * COLS), 
                        y: Math.floor(Math.random() * ROWS) 
                    };
                }
                const ahead = {
                    x: pacman.x + pacman.direction.x * 2,
                    y: pacman.y + pacman.direction.y * 2
                };
                return {
                    x: ahead.x + (ahead.x - blinky.x),
                    y: ahead.y + (ahead.y - blinky.y)
                };
            
            case 'Clyde': // 近いと逃げる
                const dist = Math.pow(this.x - pacman.x, 2) + Math.pow(this.y - pacman.y, 2);
                if (dist < 64) {
                    return { x: this.cornerX, y: this.cornerY };
                }
                return { x: pacman.x, y: pacman.y };
            
            default:
                return { x: pacman.x, y: pacman.y };
        }
    }

    canMove(x, y, map) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return x < 0 || x >= COLS;
        const cell = map[y][x];
        if (this.mode === GhostMode.EATEN) {
            return cell !== 1;
        }
        return cell !== 1 && cell !== 5;
    }

    setFrightened(duration) {
        if (this.mode !== GhostMode.EATEN) {
            this.mode = GhostMode.FRIGHTENED;
            this.frightenedTimer = duration;
            // 方向反転
            this.direction = { x: -this.direction.x, y: -this.direction.y };
        }
    }

    draw(ctx, time) {
        const waveY = Math.sin(time / 100 + this.waveOffset) * 2;
        
        ctx.save();
        ctx.translate(this.pixelX, this.pixelY + waveY);

        let bodyColor;
        if (this.mode === GhostMode.EATEN) {
            // 目だけ描画
            this.drawEyes(ctx);
            ctx.restore();
            return;
        } else if (this.mode === GhostMode.FRIGHTENED) {
            // 点滅
            if (this.frightenedTimer < 120 && Math.floor(this.frightenedTimer / 15) % 2 === 0) {
                bodyColor = '#ffffff';
            } else {
                bodyColor = '#2222ff';
            }
        } else {
            bodyColor = this.color;
        }

        // グロー効果
        ctx.shadowColor = bodyColor;
        ctx.shadowBlur = 10;

        // ボディ
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, -2, CELL_SIZE / 2 - 2, Math.PI, 0);
        ctx.lineTo(CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 4);
        
        // 波形の下部
        const waves = 3;
        const waveWidth = (CELL_SIZE - 4) / waves;
        for (let i = 0; i < waves; i++) {
            const x1 = CELL_SIZE / 2 - 2 - i * waveWidth;
            const x2 = x1 - waveWidth;
            ctx.quadraticCurveTo(x1 - waveWidth / 2, CELL_SIZE / 2 - 8 + waveY, x2, CELL_SIZE / 2 - 4);
        }
        ctx.closePath();
        ctx.fill();

        // 目
        if (this.mode === GhostMode.FRIGHTENED) {
            // 恐怖時の目
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-4, -3, 3, 0, Math.PI * 2);
            ctx.arc(4, -3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            this.drawEyes(ctx);
        }

        ctx.restore();
    }

    drawEyes(ctx) {
        // 白目
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-4, -3, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(4, -3, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 黒目（方向に応じて）
        ctx.fillStyle = '#0000ff';
        const eyeOffsetX = this.direction.x * 2;
        const eyeOffsetY = this.direction.y * 2;
        ctx.beginPath();
        ctx.arc(-4 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(4 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// フルーツクラス
class Fruit {
    constructor() {
        this.x = 13;
        this.y = 17;
        this.active = false;
        this.timer = 0;
        this.type = 0;
        this.points = [100, 300, 500, 700, 1000];
        this.colors = ['#ff0000', '#ffaa00', '#ff00ff', '#00ff00', '#00ffff'];
    }

    spawn(level) {
        this.active = true;
        this.timer = 600;
        this.type = Math.min(level - 1, this.points.length - 1);
    }

    update() {
        if (this.active) {
            this.timer--;
            if (this.timer <= 0) {
                this.active = false;
            }
        }
    }

    draw(ctx, time) {
        if (!this.active) return;

        const bounce = Math.sin(time / 100) * 3;
        const px = this.x * CELL_SIZE + CELL_SIZE / 2;
        const py = this.y * CELL_SIZE + CELL_SIZE / 2 + bounce;

        ctx.save();
        ctx.translate(px, py);
        
        ctx.shadowColor = this.colors[this.type];
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.colors[this.type];
        
        // フルーツ形状
        ctx.beginPath();
        ctx.arc(0, 0, CELL_SIZE / 2 - 3, 0, Math.PI * 2);
        ctx.fill();

        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-2, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getPoints() {
        return this.points[this.type];
    }
}

// メインゲームクラス
class Game {
    constructor() {
        this.sound = new SoundManager();
        this.state = GameState.WAITING;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore')) || 0;
        this.level = 1;
        this.lives = 3;
        this.map = [];
        this.dotsRemaining = 0;
        this.ghostsEaten = 0;
        this.modeTimer = 0;
        this.scatterMode = true;
        this.dotsEaten = 0;
        this.time = 0;
        
        this.pacman = null;
        this.ghosts = [];
        this.fruit = new Fruit();
        
        this.setupControls();
        this.updateUI();
        this.loadMap();
        this.gameLoop();
    }

    loadMap() {
        const mapIndex = (this.level - 1) % MAPS.length;
        this.map = MAPS[mapIndex].map(row => [...row]);
        this.dotsRemaining = 0;
        
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.map[y][x] === 2 || this.map[y][x] === 3) {
                    this.dotsRemaining++;
                }
            }
        }

        // パックマン初期位置
        this.pacman = new Pacman(14, 23);
        
        // ゴースト作成
        this.ghosts = [
            new Ghost('Blinky', '#ff0000', 13, 14, 25, 0),
            new Ghost('Pinky', '#ffb8ff', 14, 14, 2, 0),
            new Ghost('Inky', '#00ffff', 12, 14, 27, 30),
            new Ghost('Clyde', '#ffb852', 15, 14, 0, 30)
        ];

        this.fruit = new Fruit();
        this.dotsEaten = 0;
    }

    setupControls() {
        // キーボード
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleStart();
                return;
            }

            if (this.state !== GameState.PLAYING) return;

            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    e.preventDefault();
                    this.pacman.nextDirection = Direction.UP;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    e.preventDefault();
                    this.pacman.nextDirection = Direction.DOWN;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    e.preventDefault();
                    this.pacman.nextDirection = Direction.LEFT;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    e.preventDefault();
                    this.pacman.nextDirection = Direction.RIGHT;
                    break;
            }
        });

        // タッチスワイプ
        let touchStartX = 0;
        let touchStartY = 0;

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart();
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchend', (e) => {
            if (this.state !== GameState.PLAYING) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.pacman.nextDirection = dx > 0 ? Direction.RIGHT : Direction.LEFT;
                } else {
                    this.pacman.nextDirection = dy > 0 ? Direction.DOWN : Direction.UP;
                }
            }
        });

        // モバイルボタン
        const mobileControls = document.getElementById('mobileControls');
        mobileControls.querySelectorAll('.control-btn').forEach(btn => {
            const handler = (e) => {
                e.preventDefault();
                if (this.state !== GameState.PLAYING) return;
                const dir = btn.dataset.direction;
                switch (dir) {
                    case 'up': this.pacman.nextDirection = Direction.UP; break;
                    case 'down': this.pacman.nextDirection = Direction.DOWN; break;
                    case 'left': this.pacman.nextDirection = Direction.LEFT; break;
                    case 'right': this.pacman.nextDirection = Direction.RIGHT; break;
                }
            };
            btn.addEventListener('touchstart', handler, { passive: false });
            btn.addEventListener('mousedown', handler);
        });

        // オーバーレイクリック
        document.getElementById('overlay').addEventListener('click', () => this.handleStart());
    }

    handleStart() {
        this.sound.init();
        
        if (this.state === GameState.WAITING) {
            this.state = GameState.PLAYING;
            this.sound.playStart();
            document.getElementById('overlay').classList.add('hidden');
        } else if (this.state === GameState.GAME_OVER) {
            this.resetGame();
        }
    }

    resetGame() {
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.loadMap();
        this.state = GameState.PLAYING;
        this.sound.playStart();
        this.updateUI();
        document.getElementById('overlay').classList.add('hidden');
    }

    update() {
        if (this.state !== GameState.PLAYING) return;

        this.time++;

        // ゴーストモード切り替え
        this.modeTimer++;
        if (this.scatterMode && this.modeTimer > 420) {
            this.scatterMode = false;
            this.modeTimer = 0;
            this.ghosts.forEach(g => {
                if (g.mode !== GhostMode.FRIGHTENED && g.mode !== GhostMode.EATEN) {
                    g.mode = GhostMode.CHASE;
                }
            });
        } else if (!this.scatterMode && this.modeTimer > 1200) {
            this.scatterMode = true;
            this.modeTimer = 0;
            this.ghosts.forEach(g => {
                if (g.mode !== GhostMode.FRIGHTENED && g.mode !== GhostMode.EATEN) {
                    g.mode = GhostMode.SCATTER;
                }
            });
        }

        // パックマン更新
        this.pacman.update(this.map);

        if (!this.pacman.alive) {
            if (this.pacman.deathAnimation > Math.PI) {
                this.lives--;
                this.updateUI();
                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.respawn();
                }
            }
            return;
        }

        // ドット取得チェック
        const cell = this.map[this.pacman.y]?.[this.pacman.x];
        if (cell === 2) {
            this.map[this.pacman.y][this.pacman.x] = 4;
            this.score += 10;
            this.dotsRemaining--;
            this.dotsEaten++;
            this.sound.playDot();
            this.updateUI();
        } else if (cell === 3) {
            this.map[this.pacman.y][this.pacman.x] = 4;
            this.score += 50;
            this.dotsRemaining--;
            this.dotsEaten++;
            this.ghostsEaten = 0;
            const duration = Math.max(300 - this.level * 30, 120);
            this.ghosts.forEach(g => g.setFrightened(duration));
            this.sound.playPowerPellet();
            this.updateUI();
        }

        // フルーツ出現
        if ((this.dotsEaten === 70 || this.dotsEaten === 170) && !this.fruit.active) {
            this.fruit.spawn(this.level);
        }
        this.fruit.update();

        // フルーツ取得
        if (this.fruit.active && 
            this.pacman.x === this.fruit.x && this.pacman.y === this.fruit.y) {
            this.score += this.fruit.getPoints();
            this.fruit.active = false;
            this.sound.playFruit();
            this.updateUI();
        }

        // ゴースト更新
        const blinky = this.ghosts[0];
        this.ghosts.forEach(ghost => {
            ghost.update(this.map, this.pacman, blinky, this.level);

            // 衝突判定
            const dist = Math.pow(ghost.pixelX - this.pacman.pixelX, 2) + 
                        Math.pow(ghost.pixelY - this.pacman.pixelY, 2);
            
            if (dist < Math.pow(CELL_SIZE - 4, 2)) {
                if (ghost.mode === GhostMode.FRIGHTENED) {
                    ghost.mode = GhostMode.EATEN;
                    this.ghostsEaten++;
                    const points = 200 * Math.pow(2, this.ghostsEaten - 1);
                    this.score += points;
                    this.sound.playEatGhost();
                    this.updateUI();
                } else if (ghost.mode !== GhostMode.EATEN) {
                    this.pacman.alive = false;
                    this.sound.playDeath();
                }
            }
        });

        // レベルクリアチェック
        if (this.dotsRemaining <= 0) {
            this.levelComplete();
        }
    }

    respawn() {
        this.pacman.reset();
        this.ghosts.forEach(g => g.reset());
        this.modeTimer = 0;
        this.scatterMode = true;
    }

    levelComplete() {
        this.state = GameState.LEVEL_COMPLETE;
        this.sound.playLevelComplete();
        
        setTimeout(() => {
            this.level++;
            this.loadMap();
            this.state = GameState.PLAYING;
            this.updateUI();
        }, 2000);
    }

    gameOver() {
        this.state = GameState.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore);
        }
        
        const overlay = document.getElementById('overlay');
        document.getElementById('overlay-title').textContent = 'GAME OVER';
        document.getElementById('overlay-message').textContent = 'Tap or Press SPACE to Restart';
        document.getElementById('final-score').textContent = `Final Score: ${this.score}`;
        overlay.classList.remove('hidden');
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('highscore').textContent = this.highScore;

        const livesContainer = document.getElementById('lives');
        livesContainer.innerHTML = '';
        for (let i = 0; i < this.lives; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';
            livesContainer.appendChild(life);
        }
    }

    draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // マップ描画
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const cell = this.map[y][x];
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE;

                if (cell === 1) {
                    // 壁
                    ctx.fillStyle = '#2222ff';
                    ctx.shadowColor = '#2222ff';
                    ctx.shadowBlur = 5;
                    ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                    ctx.shadowBlur = 0;
                } else if (cell === 2) {
                    // ドット
                    ctx.fillStyle = '#ffb897';
                    ctx.shadowColor = '#ffb897';
                    ctx.shadowBlur = 5;
                    ctx.beginPath();
                    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (cell === 3) {
                    // パワーエサ
                    const pulse = Math.sin(this.time / 10) * 2 + 6;
                    ctx.fillStyle = '#ffb897';
                    ctx.shadowColor = '#ffb897';
                    ctx.shadowBlur = 15;
                    ctx.beginPath();
                    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, pulse, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (cell === 5) {
                    // ゴーストハウスドア
                    ctx.fillStyle = '#ffb8de';
                    ctx.fillRect(px, py + CELL_SIZE / 2 - 2, CELL_SIZE, 4);
                }
            }
        }

        // フルーツ描画
        this.fruit.draw(ctx, this.time);

        // ゴースト描画
        this.ghosts.forEach(ghost => ghost.draw(ctx, this.time));

        // パックマン描画
        this.pacman.draw(ctx);

        // レベルクリア演出
        if (this.state === GameState.LEVEL_COMPLETE) {
            if (Math.floor(this.time / 15) % 2 === 0) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ゲーム開始
const game = new Game();
