// Tetris - テトリス ゲームロジック (SRS + T-Spin + Combo)

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold');
const holdCtx = holdCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = ['#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];
const SHAPES = [
    [[1, 1, 1, 1]],           // I (type 0)
    [[1, 0, 0], [1, 1, 1]],   // J (type 1)
    [[0, 0, 1], [1, 1, 1]],   // L (type 2)
    [[1, 1], [1, 1]],         // O (type 3)
    [[0, 1, 1], [1, 1, 0]],   // S (type 4)
    [[0, 1, 0], [1, 1, 1]],   // T (type 5)
    [[1, 1, 0], [0, 1, 1]]    // Z (type 6)
];

// SRS壁蹴りデータ（時計回り）
const SRS_KICKS = {
    JLSTZ: [
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 0→1
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],     // 1→2
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 2→3
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]   // 3→0
    ],
    JLSTZ_CCW: [
        [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],      // 0→3
        [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],  // 1→0
        [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],   // 2→1
        [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]      // 3→2
    ],
    I: [
        [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],    // 0→1
        [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 1→2
        [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],    // 2→3
        [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]]     // 3→0
    ],
    I_CCW: [
        [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],    // 0→3
        [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],    // 1→0
        [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],    // 2→1
        [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]]     // 3→2
    ]
};

// T-Spin用の4隅オフセット（回転状態ごと）
const T_CORNERS = [
    [[0, 0], [2, 0], [0, 2], [2, 2]],  // 状態0
    [[0, 0], [2, 0], [0, 2], [2, 2]],  // 状態1
    [[0, 0], [2, 0], [0, 2], [2, 2]],  // 状態2
    [[0, 0], [2, 0], [0, 2], [2, 2]]   // 状態3
];

// T-Spin前面コーナー（回転状態ごと）
const T_FRONT_CORNERS = [
    [[0, 0], [2, 0]],    // 状態0: 上向き→前面は上
    [[2, 0], [2, 2]],    // 状態1: 右向き→前面は右
    [[0, 2], [2, 2]],    // 状態2: 下向き→前面は下
    [[0, 0], [0, 2]]     // 状態3: 左向き→前面は左
];

let board, piece, nextPiece, holdPiece, canHold;
let score, lines, level, gameLoop, dropInterval, lastDrop, isPaused, isPlaying;
let best = +localStorage.getItem('tetrisBest') || 0;
let pieceBag = [];

// 追加変数
let combo = 0;
let backToBack = false;
let lastAction = '';           // 最後のアクション表示用
let lastActionTime = 0;
let lastRotationWasKick = false;  // 壁蹴りで回転したか

// 7-bag randomizer
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function fillBag() {
    const newBag = [0, 1, 2, 3, 4, 5, 6];
    shuffleArray(newBag);
    pieceBag = pieceBag.concat(newBag);
}

function getNextPieceType() {
    if (pieceBag.length < 7) fillBag();
    return pieceBag.shift();
}

function createBoard() {
    return Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

function createPiece(type) {
    if (type === undefined) type = getNextPieceType();
    return {
        shape: SHAPES[type].map(row => [...row]),
        color: COLORS[type],
        type: type,
        rotation: 0,  // 回転状態 (0-3)
        x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2),
        y: 0
    };
}

// 時計回り回転
function rotate(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotated[x][rows - 1 - y] = shape[y][x];
        }
    }
    return rotated;
}

// 反時計回り回転
function rotateCounterClockwise(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            rotated[cols - 1 - x][y] = shape[y][x];
        }
    }
    return rotated;
}

function isValid(shape, px, py) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const nx = px + x;
                const ny = py + y;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
                if (ny >= 0 && board[ny][nx]) return false;
            }
        }
    }
    return true;
}

function merge() {
    piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val && piece.y + y >= 0) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

// T-Spin検出
function checkTSpin() {
    if (piece.type !== 5) return { isTSpin: false, isMini: false };
    
    // Tブロックの中心位置
    const cx = piece.x + 1;
    const cy = piece.y + 1;
    
    // 4隅をチェック
    const corners = [
        [cx - 1, cy - 1],  // 左上
        [cx + 1, cy - 1],  // 右上
        [cx - 1, cy + 1],  // 左下
        [cx + 1, cy + 1]   // 右下
    ];
    
    let filledCorners = 0;
    let frontCornersFilled = 0;
    
    corners.forEach(([x, y], idx) => {
        const isBlocked = x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && board[y] && board[y][x]);
        if (isBlocked) filledCorners++;
    });
    
    // 回転状態に基づく前面コーナーチェック
    const frontIndices = [
        [0, 1],  // 状態0: 上向き→左上、右上
        [1, 3],  // 状態1: 右向き→右上、右下
        [2, 3],  // 状態2: 下向き→左下、右下
        [0, 2]   // 状態3: 左向き→左上、左下
    ][piece.rotation];
    
    frontIndices.forEach(idx => {
        const [x, y] = corners[idx];
        const isBlocked = x < 0 || x >= COLS || y < 0 || y >= ROWS || (y >= 0 && board[y] && board[y][x]);
        if (isBlocked) frontCornersFilled++;
    });
    
    // T-Spin判定: 3隅以上が埋まっている
    if (filledCorners >= 3) {
        // Mini T-Spin: 壁蹴りを使わず、前面コーナーが1つだけ埋まっている
        const isMini = !lastRotationWasKick && frontCornersFilled < 2;
        return { isTSpin: true, isMini: isMini };
    }
    
    return { isTSpin: false, isMini: false };
}

function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++;
            y++;
        }
    }
    
    if (cleared) {
        // T-Spin判定
        const tSpinResult = checkTSpin();
        const isTetris = cleared === 4;
        const isDifficult = tSpinResult.isTSpin || isTetris;
        
        // 基本スコア計算
        let basePoints = 0;
        let actionText = '';
        
        if (tSpinResult.isTSpin) {
            if (tSpinResult.isMini) {
                // Mini T-Spin
                const miniPoints = [0, 100, 200, 400];
                basePoints = miniPoints[cleared];
                actionText = cleared === 0 ? 'Mini T-Spin' : `Mini T-Spin ${['', 'Single', 'Double', 'Triple'][cleared]}`;
            } else {
                // T-Spin
                const tSpinPoints = [400, 800, 1200, 1600];
                basePoints = tSpinPoints[cleared];
                actionText = cleared === 0 ? 'T-Spin' : `T-Spin ${['', 'Single', 'Double', 'Triple'][cleared]}`;
            }
        } else {
            // 通常のライン消去
            const normalPoints = [0, 100, 300, 500, 800];
            basePoints = normalPoints[cleared];
            if (isTetris) actionText = 'TETRIS!';
            else if (cleared === 3) actionText = 'Triple';
            else if (cleared === 2) actionText = 'Double';
            else if (cleared === 1) actionText = 'Single';
        }
        
        // Back-to-Back ボーナス
        if (isDifficult) {
            if (backToBack) {
                basePoints = Math.floor(basePoints * 1.5);
                actionText = 'B2B ' + actionText;
            }
            backToBack = true;
        } else {
            backToBack = false;
        }
        
        // コンボボーナス
        combo++;
        const comboBonus = (combo - 1) * 50 * level;
        if (combo > 1) {
            actionText += ` (${combo - 1} Combo)`;
        }
        
        score += basePoints * level + comboBonus;
        lines += cleared;
        
        // アクション表示
        if (actionText) {
            showAction(actionText);
        }
        
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            dropInterval = Math.max(100, 1000 - level * 80);
        }
        updateUI();
    } else {
        // ライン消去なしでコンボリセット
        combo = 0;
    }
}

function showAction(text) {
    lastAction = text;
    lastActionTime = performance.now();
    const actionDiv = document.getElementById('actionText');
    if (actionDiv) {
        actionDiv.textContent = text;
        actionDiv.classList.remove('show');
        void actionDiv.offsetWidth; // リフロー強制
        actionDiv.classList.add('show');
    }
}

function drop() {
    if (isValid(piece.shape, piece.x, piece.y + 1)) {
        piece.y++;
        lastRotationWasKick = false;  // 移動したら壁蹴りフラグリセット
    } else {
        // T-Spin検出用に設置前にチェック
        const tSpinResult = piece.type === 5 ? checkTSpin() : { isTSpin: false };
        if (tSpinResult.isTSpin && !board[piece.y]?.some((_, x) => board[piece.y].every(cell => cell))) {
            // T-Spinだがライン消去なしの場合
            if (tSpinResult.isMini) {
                showAction('Mini T-Spin');
                score += 100 * level;
            } else {
                showAction('T-Spin');
                score += 400 * level;
            }
            updateUI();
        }
        merge();
        clearLines();
        piece = nextPiece;
        nextPiece = createPiece();
        canHold = true;
        lastRotationWasKick = false;
        if (!isValid(piece.shape, piece.x, piece.y)) {
            gameOver();
        }
    }
}

function hardDrop() {
    let dropDistance = 0;
    while (isValid(piece.shape, piece.x, piece.y + 1)) {
        piece.y++;
        dropDistance++;
    }
    score += dropDistance * 2;  // ハードドロップボーナス
    lastRotationWasKick = false;
    drop();
}

function move(dir) {
    if (isValid(piece.shape, piece.x + dir, piece.y)) {
        piece.x += dir;
        lastRotationWasKick = false;  // 移動したら壁蹴りフラグリセット
    }
}

// SRS壁蹴り対応の回転（時計回り）
function rotatePiece() {
    if (piece.type === 3) return;  // Oピースは回転しない
    
    const rotated = rotate(piece.shape);
    const currentRotation = piece.rotation;
    const newRotation = (currentRotation + 1) % 4;
    
    // 壁蹴りテストを取得
    let kicks;
    if (piece.type === 0) {  // I piece
        kicks = SRS_KICKS.I[currentRotation];
    } else {
        kicks = SRS_KICKS.JLSTZ[currentRotation];
    }
    
    // 各壁蹴り位置を試す
    for (let i = 0; i < kicks.length; i++) {
        const [dx, dy] = kicks[i];
        if (isValid(rotated, piece.x + dx, piece.y - dy)) {  // Y軸は反転
            piece.shape = rotated;
            piece.x += dx;
            piece.y -= dy;
            piece.rotation = newRotation;
            lastRotationWasKick = (i > 0);  // 壁蹴りを使用したか
            return;
        }
    }
}

// SRS壁蹴り対応の回転（反時計回り）
function rotatePieceCCW() {
    if (piece.type === 3) return;  // Oピースは回転しない
    
    const rotated = rotateCounterClockwise(piece.shape);
    const currentRotation = piece.rotation;
    const newRotation = (currentRotation + 3) % 4;  // -1 mod 4
    
    // 壁蹴りテストを取得
    let kicks;
    if (piece.type === 0) {  // I piece
        kicks = SRS_KICKS.I_CCW[currentRotation];
    } else {
        kicks = SRS_KICKS.JLSTZ_CCW[currentRotation];
    }
    
    // 各壁蹴り位置を試す
    for (let i = 0; i < kicks.length; i++) {
        const [dx, dy] = kicks[i];
        if (isValid(rotated, piece.x + dx, piece.y - dy)) {  // Y軸は反転
            piece.shape = rotated;
            piece.x += dx;
            piece.y -= dy;
            piece.rotation = newRotation;
            lastRotationWasKick = (i > 0);  // 壁蹴りを使用したか
            return;
        }
    }
}

function hold() {
    if (!canHold) return;
    canHold = false;
    lastRotationWasKick = false;
    if (holdPiece) {
        const temp = holdPiece;
        holdPiece = createPiece(piece.type);
        piece = createPiece(temp.type);
    } else {
        holdPiece = createPiece(piece.type);
        piece = nextPiece;
        nextPiece = createPiece();
    }
}

function getGhost() {
    let ghostY = piece.y;
    while (isValid(piece.shape, piece.x, ghostY + 1)) {
        ghostY++;
    }
    return ghostY;
}

function draw() {
    // 背景
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // グリッド線
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK, 0);
        ctx.lineTo(x * BLOCK, ROWS * BLOCK);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK);
        ctx.lineTo(COLS * BLOCK, y * BLOCK);
        ctx.stroke();
    }

    if (!board) return;

    // 固定ブロック
    board.forEach((row, y) => {
        row.forEach((color, x) => {
            if (color) drawBlock(ctx, x, y, color);
        });
    });

    if (!piece) return;

    // ゴースト
    const ghostY = getGhost();
    piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect((piece.x + x) * BLOCK + 1, (ghostY + y) * BLOCK + 1, BLOCK - 2, BLOCK - 2);
            }
        });
    });

    // 現在のピース
    piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) drawBlock(ctx, piece.x + x, piece.y + y, piece.color);
        });
    });

    // プレビュー
    drawPreview(nextCtx, nextPiece);
    if (holdPiece) {
        drawPreview(holdCtx, holdPiece);
    } else {
        holdCtx.fillStyle = '#1a1a2e';
        holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
    }
}

function drawBlock(c, x, y, color) {
    const px = x * BLOCK;
    const py = y * BLOCK;
    c.fillStyle = color;
    c.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(px + 3, py + 3, BLOCK - 10, 4);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(px + 3, py + BLOCK - 7, BLOCK - 6, 3);
}

function drawPreview(c, p) {
    c.fillStyle = '#1a1a2e';
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    const size = 20;
    const ox = (c.canvas.width - p.shape[0].length * size) / 2;
    const oy = (c.canvas.height - p.shape.length * size) / 2;
    p.shape.forEach((row, y) => {
        row.forEach((val, x) => {
            if (val) {
                c.fillStyle = p.color;
                c.fillRect(ox + x * size + 1, oy + y * size + 1, size - 2, size - 2);
            }
        });
    });
}

function updateUI() {
    document.getElementById('score').textContent = score.toLocaleString();
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
    document.getElementById('levelBar').style.width = ((lines % 10) / 10 * 100) + '%';
    document.getElementById('combo').textContent = combo > 1 ? combo - 1 : '-';
    document.getElementById('b2b').textContent = backToBack ? '🔥' : '-';
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(gameLoop);
    if (score > best) {
        best = score;
        localStorage.setItem('tetrisBest', best);
    }
    document.getElementById('overlayTitle').textContent = '💀 ゲームオーバー';
    document.getElementById('overlayScore').textContent = `スコア: ${score.toLocaleString()}`;
    document.getElementById('overlayLines').textContent = `ベスト: ${best.toLocaleString()}`;
    document.getElementById('overlayBtn').textContent = 'リトライ';
    document.getElementById('overlay').classList.add('show');
}

function start() {
    board = createBoard();
    piece = createPiece();
    nextPiece = createPiece();
    holdPiece = null;
    canHold = true;
    score = 0;
    lines = 0;
    level = 1;
    combo = 0;
    backToBack = false;
    lastAction = '';
    lastRotationWasKick = false;
    dropInterval = 1000;
    lastDrop = performance.now();
    isPaused = false;
    isPlaying = true;
    document.getElementById('overlay').classList.remove('show');
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    const actionDiv = document.getElementById('actionText');
    if (actionDiv) actionDiv.classList.remove('show');
    updateUI();
    gameLoop = requestAnimationFrame(update);
}

function update(time) {
    if (!isPlaying || isPaused) return;
    if (time - lastDrop > dropInterval) {
        drop();
        lastDrop = time;
    }
    draw();
    gameLoop = requestAnimationFrame(update);
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? '▶ 再開' : '⏸ 一時停止';
    if (!isPaused) {
        lastDrop = performance.now();
        gameLoop = requestAnimationFrame(update);
    }
}

// キーボード入力
document.addEventListener('keydown', e => {
    const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyS', 'KeyW', 'KeyC', 'KeyZ', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight'];
    if (isPlaying && gameKeys.includes(e.code)) {
        e.preventDefault();
    }
    if (!isPlaying || isPaused) return;
    switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
            move(-1);
            break;
        case 'ArrowRight':
        case 'KeyD':
            move(1);
            break;
        case 'ArrowDown':
        case 'KeyS':
            drop();
            score += 1;
            updateUI();
            break;
        case 'ArrowUp':
        case 'KeyW':
            rotatePiece();
            break;
        case 'KeyZ':
        case 'ControlLeft':
        case 'ControlRight':
            rotatePieceCCW();
            break;
        case 'Space':
            hardDrop();
            break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
            hold();
            break;
    }
    draw();
});

// タッチコントロール
document.querySelectorAll('.touch-btn').forEach(btn => {
    const handler = () => {
        if (!isPlaying || isPaused) return;
        switch (btn.dataset.action) {
            case 'left':
                move(-1);
                break;
            case 'right':
                move(1);
                break;
            case 'down':
                drop();
                score += 1;
                updateUI();
                break;
            case 'rotate':
            case 'up':
                rotatePiece();
                break;
            case 'rotateCCW':
                rotatePieceCCW();
                break;
            case 'drop':
                hardDrop();
                break;
            case 'hold':
                hold();
                break;
        }
        draw();
    };
    btn.ontouchstart = btn.onmousedown = e => {
        e.preventDefault();
        handler();
    };
});

// ボタンイベント
document.getElementById('startBtn').onclick = start;
document.getElementById('pauseBtn').onclick = togglePause;
document.getElementById('overlayBtn').onclick = start;

// 初期表示
document.getElementById('overlay').classList.add('show');
document.getElementById('overlayTitle').textContent = '🎮 テトリス';
document.getElementById('overlayScore').textContent = '←→: 移動 | ↑/Z: 回転 | C/Shift: ホールド';
document.getElementById('overlayLines').textContent = '↓: 落下 | Space: ハードドロップ';
draw();
