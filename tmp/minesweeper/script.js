const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

let currentDifficulty = 'easy';
let board = [];
let revealed = [];
let flagged = [];
let gameOver = false;
let gameStarted = false;
let timer = 0;
let timerInterval = null;
let minesRemaining = 10;

// ベストタイム読み込み
let bestTimes = JSON.parse(localStorage.getItem('minesweeper-best') || '{}');
updateBestTimesDisplay();

function initGame() {
    const { rows, cols, mines } = difficulties[currentDifficulty];
    
    board = Array(rows).fill().map(() => Array(cols).fill(0));
    revealed = Array(rows).fill().map(() => Array(cols).fill(false));
    flagged = Array(rows).fill().map(() => Array(cols).fill(false));
    gameOver = false;
    gameStarted = false;
    minesRemaining = mines;
    timer = 0;
    
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('mine-count').textContent = mines;
    document.getElementById('timer').textContent = '000';
    document.getElementById('best-time').textContent = bestTimes[currentDifficulty] ? formatTime(bestTimes[currentDifficulty]) : '---';
    
    renderBoard();
}

function placeMines(excludeRow, excludeCol) {
    const { rows, cols, mines } = difficulties[currentDifficulty];
    let placed = 0;
    
    while (placed < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        // 最初にクリックしたセルとその周囲には地雷を置かない
        const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
        
        if (board[row][col] !== -1 && !isExcluded) {
            board[row][col] = -1;
            placed++;
        }
    }
    
    // 数字を計算
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] !== -1) {
                board[r][c] = countAdjacentMines(r, c);
            }
        }
    }
}

function countAdjacentMines(row, col) {
    const { rows, cols } = difficulties[currentDifficulty];
    let count = 0;
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] === -1) {
                count++;
            }
        }
    }
    
    return count;
}

function renderBoard() {
    const { rows, cols } = difficulties[currentDifficulty];
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            if (revealed[r][c]) {
                cell.classList.add('revealed');
                if (board[r][c] === -1) {
                    cell.textContent = '💣';
                    cell.classList.add('mine');
                } else if (board[r][c] > 0) {
                    cell.textContent = board[r][c];
                    cell.classList.add(`num-${board[r][c]}`);
                }
            } else if (flagged[r][c]) {
                cell.textContent = '🚩';
                cell.classList.add('flagged');
            }
            
            cell.addEventListener('click', () => handleClick(r, c));
            cell.addEventListener('contextmenu', e => {
                e.preventDefault();
                handleRightClick(r, c);
            });
            
            boardEl.appendChild(cell);
        }
    }
}

function handleClick(row, col) {
    if (gameOver || flagged[row][col]) return;
    
    if (!gameStarted) {
        gameStarted = true;
        placeMines(row, col);
        startTimer();
    }
    
    revealCell(row, col);
    renderBoard();
    checkWin();
}

function handleRightClick(row, col) {
    if (gameOver || revealed[row][col]) return;
    
    flagged[row][col] = !flagged[row][col];
    minesRemaining += flagged[row][col] ? -1 : 1;
    
    const mineCountEl = document.getElementById('mine-count');
    mineCountEl.textContent = minesRemaining;
    mineCountEl.classList.toggle('red', minesRemaining < 0);
    
    renderBoard();
}

function revealCell(row, col) {
    const { rows, cols } = difficulties[currentDifficulty];
    
    if (row < 0 || row >= rows || col < 0 || col >= cols) return;
    if (revealed[row][col] || flagged[row][col]) return;
    
    revealed[row][col] = true;
    
    if (board[row][col] === -1) {
        // 地雷に当たった
        endGame(false, row, col);
        return;
    }
    
    if (board[row][col] === 0) {
        // 空のセルは周囲も開く
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                revealCell(row + dr, col + dc);
            }
        }
    }
}

function checkWin() {
    const { rows, cols, mines } = difficulties[currentDifficulty];
    let revealedCount = 0;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (revealed[r][c]) revealedCount++;
        }
    }
    
    if (revealedCount === rows * cols - mines) {
        endGame(true);
    }
}

function endGame(won, explodedRow = -1, explodedCol = -1) {
    gameOver = true;
    clearInterval(timerInterval);
    
    const { rows, cols } = difficulties[currentDifficulty];
    
    // すべての地雷を表示
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === -1) {
                revealed[r][c] = true;
            }
        }
    }
    
    renderBoard();
    
    // 爆発したセルにアニメーション
    if (!won && explodedRow >= 0) {
        const cells = document.querySelectorAll('.cell');
        const index = explodedRow * difficulties[currentDifficulty].cols + explodedCol;
        cells[index].classList.add('exploded');
    }
    
    // ベストタイム更新
    if (won) {
        if (!bestTimes[currentDifficulty] || timer < bestTimes[currentDifficulty]) {
            bestTimes[currentDifficulty] = timer;
            localStorage.setItem('minesweeper-best', JSON.stringify(bestTimes));
            updateBestTimesDisplay();
        }
    }
    
    // モーダル表示
    setTimeout(() => {
        const modal = document.getElementById('modal');
        const modalContent = document.getElementById('modal-content');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalStats = document.getElementById('modal-stats');
        
        modalContent.className = `modal-content ${won ? 'win' : 'lose'}`;
        modalTitle.textContent = won ? '🎉 クリア！' : '💥 ゲームオーバー';
        modalMessage.textContent = won ? 'おめでとうございます！' : '地雷を踏んでしまいました...';
        
        modalStats.innerHTML = `
            <div class="stat-row">
                <span>タイム</span>
                <span>${formatTime(timer)}</span>
            </div>
            <div class="stat-row">
                <span>難易度</span>
                <span>${currentDifficulty === 'easy' ? '初級' : currentDifficulty === 'medium' ? '中級' : '上級'}</span>
            </div>
            ${won && (!bestTimes[currentDifficulty] || timer <= bestTimes[currentDifficulty]) ? '<div class="stat-row"><span>🏆 新記録！</span><span></span></div>' : ''}
        `;
        
        modal.classList.add('active');
    }, 500);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timer++;
        document.getElementById('timer').textContent = String(timer).padStart(3, '0');
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : `${secs}秒`;
}

function updateBestTimesDisplay() {
    document.getElementById('best-easy').textContent = bestTimes.easy ? formatTime(bestTimes.easy) : '---';
    document.getElementById('best-medium').textContent = bestTimes.medium ? formatTime(bestTimes.medium) : '---';
    document.getElementById('best-hard').textContent = bestTimes.hard ? formatTime(bestTimes.hard) : '---';
}

function newGame() {
    document.getElementById('modal').classList.remove('active');
    initGame();
}

// イベントリスナー
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDifficulty = btn.dataset.difficulty;
        initGame();
    });
});

document.getElementById('new-game').addEventListener('click', newGame);

// 初期化
initGame();
