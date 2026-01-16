let board = [];
let solution = [];
let selectedCell = null;
let difficulty = 'easy';
let mistakes = 0;
let hintsLeft = 3;
let timer = 0;
let timerInterval = null;
let gameComplete = false;
let memoMode = false;
let memos = []; // 9x9の配列、各セルに候補数字のSetを持つ
let autoCheck = true;
let highlightSame = false;

const removeCounts = { easy: 30, medium: 40, hard: 50, expert: 55 };

function initMemos() {
    memos = Array(9).fill().map(() => 
        Array(9).fill().map(() => new Set())
    );
}

function generateSudoku() {
    // 解決済みのボードを生成
    const base = Array(9).fill().map(() => Array(9).fill(0));
    fillBoard(base);
    solution = base.map(row => [...row]);
    
    // 難易度に応じて数字を削除
    board = base.map(row => [...row]);
    const cellsToRemove = removeCounts[difficulty];
    let removed = 0;
    
    while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (board[row][col] !== 0) {
            board[row][col] = 0;
            removed++;
        }
    }
    
    initMemos();
}

function fillBoard(board) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        return true;
    }
    
    function solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const nums = shuffle([...numbers]);
                    for (const num of nums) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solve(board)) return true;
                            board[row][col] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    
    solve(board);
}

function renderBoard() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    
    // 選択されたセルの値を取得（ハイライト用）
    let selectedValue = null;
    if (selectedCell) {
        selectedValue = board[selectedCell.row][selectedCell.col];
    }
    
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            const value = board[row][col];
            
            if (value !== 0) {
                cell.textContent = value;
                const isGiven = initialBoard[row][col] !== 0;
                cell.classList.add(isGiven ? 'given' : 'user-input');
                
                // 同じ数字のハイライト
                if (highlightSame && selectedValue !== 0 && value === selectedValue) {
                    cell.classList.add('same-value');
                }
            } else {
                // メモ表示
                const cellMemos = memos[row][col];
                if (cellMemos.size > 0) {
                    const memoGrid = document.createElement('div');
                    memoGrid.className = 'memo-numbers';
                    for (let n = 1; n <= 9; n++) {
                        const span = document.createElement('span');
                        if (cellMemos.has(n)) {
                            span.textContent = n;
                            span.className = 'has-memo';
                        }
                        memoGrid.appendChild(span);
                    }
                    cell.appendChild(memoGrid);
                }
            }
            
            // 選択中のセル
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                cell.classList.add('selected');
            }
            
            // 行・列・ボックスのハイライト
            if (selectedCell) {
                if (selectedCell.row === row || selectedCell.col === col) {
                    cell.classList.add('same-row-col');
                }
                const selBox = Math.floor(selectedCell.row / 3) * 3 + Math.floor(selectedCell.col / 3);
                const cellBox = Math.floor(row / 3) * 3 + Math.floor(col / 3);
                if (selBox === cellBox) {
                    cell.classList.add('same-box');
                }
            }
            
            cell.addEventListener('click', () => selectCell(row, col));
            cell.addEventListener('touchstart', (e) => {
                e.preventDefault();
                selectCell(row, col);
            }, { passive: false });
            
            boardEl.appendChild(cell);
        }
    }
    
    updateNumberPad();
}

let initialBoard = [];

function selectCell(row, col) {
    // 初期値でもメモは見れるように、選択は許可
    selectedCell = { row, col };
    renderBoard();
}

function toggleMemoMode() {
    memoMode = !memoMode;
    const btn = document.getElementById('memo-btn');
    btn.textContent = `📝 メモモード: ${memoMode ? 'ON' : 'OFF'}`;
    btn.classList.toggle('active', memoMode);
}

function inputNumber(num) {
    if (!selectedCell || gameComplete) return;
    
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== 0) return;
    
    // メモモード
    if (memoMode) {
        if (board[row][col] !== 0) return; // 数字が入っているセルにはメモ不可
        const cellMemos = memos[row][col];
        if (cellMemos.has(num)) {
            cellMemos.delete(num);
        } else {
            cellMemos.add(num);
        }
        renderBoard();
        return;
    }
    
    // 通常入力モード
    if (autoCheck) {
        if (num === solution[row][col]) {
            board[row][col] = num;
            memos[row][col].clear(); // メモをクリア
            // 同じ行・列・ボックスのメモから数字を削除
            removeMemoNumber(row, col, num);
            renderBoard();
            checkWin();
        } else {
            mistakes++;
            document.getElementById('mistakes').textContent = `${mistakes}/3`;
            
            // エラー表示（振動アニメーション）
            const cells = document.querySelectorAll('.cell');
            const index = row * 9 + col;
            cells[index].classList.add('error');
            cells[index].textContent = num;
            
            setTimeout(() => {
                cells[index].classList.remove('error');
                cells[index].textContent = board[row][col] || '';
                renderBoard();
            }, 500);
            
            if (mistakes >= 3) {
                gameComplete = true;
                clearInterval(timerInterval);
                document.getElementById('lose-modal').classList.add('active');
            }
        }
    } else {
        // 自動チェックOFF - 間違っても入力可能
        board[row][col] = num;
        memos[row][col].clear();
        removeMemoNumber(row, col, num);
        renderBoard();
        checkWin();
    }
}

// 数字を入力した時、関連セルのメモから削除
function removeMemoNumber(row, col, num) {
    // 同じ行
    for (let c = 0; c < 9; c++) {
        memos[row][c].delete(num);
    }
    // 同じ列
    for (let r = 0; r < 9; r++) {
        memos[r][col].delete(num);
    }
    // 同じボックス
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            memos[boxRow + r][boxCol + c].delete(num);
        }
    }
}

function eraseCell() {
    if (!selectedCell || gameComplete) return;
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== 0) return;
    
    // メモモードの場合はメモをクリア
    if (memoMode || board[row][col] === 0) {
        memos[row][col].clear();
    }
    board[row][col] = 0;
    renderBoard();
}

// ヒント機能強化 - 理由を説明
function useHint() {
    if (hintsLeft <= 0 || gameComplete) return;
    
    // 空のセルを探す
    const emptyCells = [];
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) {
                emptyCells.push({ row: r, col: c });
            }
        }
    }
    
    if (emptyCells.length === 0) return;
    
    // 論理的に確定できるセルを探す
    let hintCell = null;
    let hintReason = null;
    
    for (const cell of emptyCells) {
        const reason = analyzeCell(cell.row, cell.col);
        if (reason) {
            hintCell = cell;
            hintReason = reason;
            break;
        }
    }
    
    // 論理的に確定できるセルがなければランダム
    if (!hintCell) {
        hintCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        hintReason = {
            answer: solution[hintCell.row][hintCell.col],
            explanation: 'このセルは複数の制約の組み合わせで確定します。',
            details: []
        };
    }
    
    const answer = solution[hintCell.row][hintCell.col];
    board[hintCell.row][hintCell.col] = answer;
    memos[hintCell.row][hintCell.col].clear();
    removeMemoNumber(hintCell.row, hintCell.col, answer);
    
    hintsLeft--;
    document.getElementById('hints').textContent = hintsLeft;
    
    // ヒント解説を表示
    showHintExplanation(hintCell, hintReason);
    
    renderBoard();
    
    // ヒントアニメーション
    setTimeout(() => {
        const cells = document.querySelectorAll('.cell');
        const index = hintCell.row * 9 + hintCell.col;
        cells[index].classList.add('hint-target');
        setTimeout(() => {
            cells[index].classList.remove('hint-target');
            cells[index].classList.add('hint');
        }, 2000);
    }, 50);
    
    checkWin();
}

// セルの論理的な確定理由を分析
function analyzeCell(row, col) {
    const answer = solution[row][col];
    
    // この位置で使えない数字を集める
    const usedInRow = new Set();
    const usedInCol = new Set();
    const usedInBox = new Set();
    
    // 行をチェック
    for (let c = 0; c < 9; c++) {
        if (board[row][c] !== 0) usedInRow.add(board[row][c]);
    }
    
    // 列をチェック
    for (let r = 0; r < 9; r++) {
        if (board[r][col] !== 0) usedInCol.add(board[r][col]);
    }
    
    // ボックスをチェック
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[boxRow + r][boxCol + c] !== 0) {
                usedInBox.add(board[boxRow + r][boxCol + c]);
            }
        }
    }
    
    // 候補数字を計算
    const candidates = [];
    for (let n = 1; n <= 9; n++) {
        if (!usedInRow.has(n) && !usedInCol.has(n) && !usedInBox.has(n)) {
            candidates.push(n);
        }
    }
    
    // 候補が1つなら確定
    if (candidates.length === 1) {
        const details = [];
        
        if (usedInRow.size > 0) {
            details.push(`行${row + 1}には既に [${[...usedInRow].sort().join(', ')}] が入っています`);
        }
        if (usedInCol.size > 0) {
            details.push(`列${col + 1}には既に [${[...usedInCol].sort().join(', ')}] が入っています`);
        }
        if (usedInBox.size > 0) {
            const boxNum = Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
            details.push(`ボックス${boxNum}には既に [${[...usedInBox].sort().join(', ')}] が入っています`);
        }
        
        return {
            answer,
            explanation: `このセルに入る数字は ${answer} しかありません！`,
            details,
            type: 'naked-single'
        };
    }
    
    // 行での唯一の候補チェック
    for (const candidate of candidates) {
        let canPlaceElsewhere = false;
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row][c] === 0) {
                // この位置に候補を置けるか
                if (canPlace(row, c, candidate)) {
                    canPlaceElsewhere = true;
                    break;
                }
            }
        }
        if (!canPlaceElsewhere && candidate === answer) {
            return {
                answer,
                explanation: `行${row + 1}で ${answer} を入れられるのはこのセルだけです！`,
                details: [`他のセルには既に数字が入っているか、${answer} を置けません`],
                type: 'hidden-single-row'
            };
        }
    }
    
    // 列での唯一の候補チェック
    for (const candidate of candidates) {
        let canPlaceElsewhere = false;
        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r][col] === 0) {
                if (canPlace(r, col, candidate)) {
                    canPlaceElsewhere = true;
                    break;
                }
            }
        }
        if (!canPlaceElsewhere && candidate === answer) {
            return {
                answer,
                explanation: `列${col + 1}で ${answer} を入れられるのはこのセルだけです！`,
                details: [`他のセルには既に数字が入っているか、${answer} を置けません`],
                type: 'hidden-single-col'
            };
        }
    }
    
    // ボックスでの唯一の候補チェック
    for (const candidate of candidates) {
        let canPlaceElsewhere = false;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const rr = boxRow + r;
                const cc = boxCol + c;
                if ((rr !== row || cc !== col) && board[rr][cc] === 0) {
                    if (canPlace(rr, cc, candidate)) {
                        canPlaceElsewhere = true;
                        break;
                    }
                }
            }
            if (canPlaceElsewhere) break;
        }
        if (!canPlaceElsewhere && candidate === answer) {
            const boxNum = Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
            return {
                answer,
                explanation: `ボックス${boxNum}で ${answer} を入れられるのはこのセルだけです！`,
                details: [`他のセルには既に数字が入っているか、${answer} を置けません`],
                type: 'hidden-single-box'
            };
        }
    }
    
    return null;
}

// ある位置に数字を置けるかチェック
function canPlace(row, col, num) {
    // 行チェック
    for (let c = 0; c < 9; c++) {
        if (board[row][c] === num) return false;
    }
    // 列チェック
    for (let r = 0; r < 9; r++) {
        if (board[r][col] === num) return false;
    }
    // ボックスチェック
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[boxRow + r][boxCol + c] === num) return false;
        }
    }
    return true;
}

// ヒント解説モーダルを表示
function showHintExplanation(cell, reason) {
    const detailEl = document.getElementById('hint-detail');
    
    let html = `
        <div class="hint-position">📍 位置: 行${cell.row + 1}、列${cell.col + 1}</div>
        <div class="hint-answer">答え: ${reason.answer}</div>
        <p>${reason.explanation}</p>
    `;
    
    if (reason.details && reason.details.length > 0) {
        html += `
            <div class="hint-reason">
                <h4>🔍 理由:</h4>
                <ul>
                    ${reason.details.map(d => `<li>${d}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    detailEl.innerHTML = html;
    document.getElementById('hint-modal').classList.add('active');
}

function closeHintModal() {
    document.getElementById('hint-modal').classList.remove('active');
}

function updateNumberPad() {
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== 0) counts[board[r][c]]++;
        }
    }
    
    // 選択されたセルの値を取得
    let selectedValue = 0;
    if (selectedCell) {
        selectedValue = board[selectedCell.row][selectedCell.col];
    }
    
    document.querySelectorAll('.num-btn').forEach(btn => {
        const num = parseInt(btn.dataset.num);
        const remaining = 9 - counts[num];
        btn.classList.toggle('exhausted', remaining <= 0);
        btn.classList.toggle('selected-num', selectedValue === num && selectedValue !== 0);
        btn.dataset.remaining = remaining;
    });
}

function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] !== solution[r][c]) return;
        }
    }
    
    gameComplete = true;
    clearInterval(timerInterval);
    
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    document.getElementById('win-message').textContent = 
        `タイム: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    createConfetti();
    document.getElementById('win-modal').classList.add('active');
}

function createConfetti() {
    const colors = ['#667eea', '#764ba2', '#f39c12', '#e74c3c', '#2ecc71'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            left: ${Math.random() * 100}%;
            top: -10px;
            width: ${Math.random() * 10 + 5}px;
            height: ${Math.random() * 10 + 5}px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation: fall ${Math.random() * 3 + 2}s linear forwards;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fall {
            to { transform: translateY(100vh) rotate(${Math.random() * 720}deg); }
        }
    `;
    document.head.appendChild(style);
}

function startTimer() {
    timer = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        const minutes = Math.floor(timer / 60);
        const seconds = timer % 60;
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function startNewGame() {
    document.getElementById('win-modal').classList.remove('active');
    document.getElementById('lose-modal').classList.remove('active');
    document.getElementById('hint-modal').classList.remove('active');
    
    generateSudoku();
    initialBoard = board.map(row => [...row]);
    selectedCell = null;
    mistakes = 0;
    hintsLeft = 3;
    gameComplete = false;
    memoMode = false;
    
    document.getElementById('mistakes').textContent = '0/3';
    document.getElementById('hints').textContent = '3';
    
    const memoBtn = document.getElementById('memo-btn');
    memoBtn.textContent = '📝 メモモード: OFF';
    memoBtn.classList.remove('active');
    
    renderBoard();
    startTimer();
}

// イベントリスナー
document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.level;
        startNewGame();
    });
});

document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        inputNumber(parseInt(btn.dataset.num));
    });
});

document.getElementById('hint-btn').addEventListener('click', useHint);
document.getElementById('erase-btn').addEventListener('click', eraseCell);
document.getElementById('new-game-btn').addEventListener('click', startNewGame);
document.getElementById('memo-btn').addEventListener('click', toggleMemoMode);

// オプション設定
document.getElementById('auto-check').addEventListener('change', (e) => {
    autoCheck = e.target.checked;
});

document.getElementById('highlight-same').addEventListener('change', (e) => {
    highlightSame = e.target.checked;
    renderBoard();
});

// キーボード入力
document.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') {
        inputNumber(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        eraseCell();
    } else if (e.key === 'ArrowUp' && selectedCell) {
        const newRow = Math.max(0, selectedCell.row - 1);
        selectCell(newRow, selectedCell.col);
    } else if (e.key === 'ArrowDown' && selectedCell) {
        const newRow = Math.min(8, selectedCell.row + 1);
        selectCell(newRow, selectedCell.col);
    } else if (e.key === 'ArrowLeft' && selectedCell) {
        const newCol = Math.max(0, selectedCell.col - 1);
        selectCell(selectedCell.row, newCol);
    } else if (e.key === 'ArrowRight' && selectedCell) {
        const newCol = Math.min(8, selectedCell.col + 1);
        selectCell(selectedCell.row, newCol);
    } else if (e.key === 'm' || e.key === 'M') {
        toggleMemoMode();
    } else if (e.key === 'h' || e.key === 'H') {
        useHint();
    } else if (e.key === 'Escape') {
        closeHintModal();
    }
});

// 初期化
startNewGame();
