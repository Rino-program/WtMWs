// 数独ゲームクラス
class SudokuGame {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fixedCells = new Set();
        this.selectedCell = null;
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.candidates = {};
        
        // オプション設定
        this.options = {
            highlightEnabled: true,
            errorCheckEnabled: true,
            candidatesMode: 'off'
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.loadOptions();
        this.loadMemo();
    }
    
    // ボードのHTML生成
    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.innerHTML = '';
        
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.selectCell(i));
            boardElement.appendChild(cell);
        }
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // 難易度選択
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.difficulty;
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.startNewGame();
            });
        });
        
        // 数字ボタン
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const number = parseInt(e.target.dataset.number);
                this.placeNumber(number);
            });
        });
        
        // アクションボタン
        document.getElementById('new-game-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('save-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('load-btn').addEventListener('click', () => this.loadGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('check-btn').addEventListener('click', () => this.checkSolution());
        
        // オプション
        document.getElementById('highlight-toggle').addEventListener('change', (e) => {
            this.options.highlightEnabled = e.target.checked;
            this.saveOptions();
            this.updateBoard();
        });
        
        document.getElementById('error-check-toggle').addEventListener('change', (e) => {
            this.options.errorCheckEnabled = e.target.checked;
            this.saveOptions();
        });
        
        document.getElementById('candidates-mode').addEventListener('change', (e) => {
            this.options.candidatesMode = e.target.value;
            this.saveOptions();
            this.updateCandidatesDisplay();
        });
        
        // メモ保存
        document.getElementById('save-memo-btn').addEventListener('click', () => this.saveMemo());
        
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                this.placeNumber(parseInt(e.key));
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                this.placeNumber(0);
            }
        });
    }
    
    // 新しいゲーム開始
    startNewGame() {
        this.stopTimer();
        this.generatePuzzle();
        this.selectedCell = null;
        this.timer = 0;
        this.updateBoard();
        this.startTimer();
        this.updateStatus('新しいゲームを開始しました！');
    }
    
    // 数独パズルの生成
    generatePuzzle() {
        // 完全な解答を生成
        this.solution = this.generateSolution();
        
        // パズルを作成（一部のセルを空にする）
        this.board = this.solution.map(row => [...row]);
        this.fixedCells.clear();
        
        const cellsToRemove = this.getCellsToRemove();
        const indices = Array.from({length: 81}, (_, i) => i);
        this.shuffleArray(indices);
        
        let removed = 0;
        for (const idx of indices) {
            if (removed >= cellsToRemove) break;
            
            const row = Math.floor(idx / 9);
            const col = idx % 9;
            const backup = this.board[row][col];
            this.board[row][col] = 0;
            
            // パズルが一意解を持つか確認（簡易版）
            if (this.hasUniqueSolution()) {
                removed++;
            } else {
                this.board[row][col] = backup;
            }
        }
        
        // 固定セルを記録
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== 0) {
                    this.fixedCells.add(i * 9 + j);
                }
            }
        }
        
        this.updateCandidates();
    }
    
    // 完全な解答の生成
    generateSolution() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solveSudoku(board);
        return board;
    }
    
    // バックトラック法で数独を解く
    solveSudoku(board) {
        const empty = this.findEmpty(board);
        if (!empty) return true;
        
        const [row, col] = empty;
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.shuffleArray(numbers);
        
        for (const num of numbers) {
            if (this.isValid(board, row, col, num)) {
                board[row][col] = num;
                
                if (this.solveSudoku(board)) {
                    return true;
                }
                
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    // 空のセルを探す
    findEmpty(board) {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (board[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }
    
    // 数字が配置可能か確認
    isValid(board, row, col, num) {
        // 行チェック
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        
        // 列チェック
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        
        // 3x3ブロックチェック
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }
        
        return true;
    }
    
    // 配列をシャッフル
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // 難易度に応じて削除するセル数を決定
    getCellsToRemove() {
        const levels = {
            easy: 30,
            medium: 40,
            hard: 50,
            expert: 60
        };
        return levels[this.difficulty] || 40;
    }
    
    // 一意解を持つか確認（簡易版）
    hasUniqueSolution() {
        // 実際には完全な一意性チェックは複雑なため、簡易版を実装
        const testBoard = this.board.map(row => [...row]);
        return this.solveSudoku(testBoard);
    }
    
    // セルを選択
    selectCell(index) {
        if (this.fixedCells.has(index)) return;
        
        this.selectedCell = index;
        this.updateBoard();
    }
    
    // 数字を配置
    placeNumber(number) {
        if (this.selectedCell === null || this.fixedCells.has(this.selectedCell)) {
            this.updateStatus('セルを選択してください');
            return;
        }
        
        const row = Math.floor(this.selectedCell / 9);
        const col = this.selectedCell % 9;
        
        this.board[row][col] = number;
        
        // エラーチェック
        if (this.options.errorCheckEnabled && number !== 0) {
            if (!this.isValid(this.board, row, col, number)) {
                this.showError(this.selectedCell);
                this.updateStatus('⚠️ この数字はここに置けません！');
            } else if (number === this.solution[row][col]) {
                this.showCorrect(this.selectedCell);
                this.updateStatus('✓ 正解！');
            }
        }
        
        this.updateCandidates();
        this.updateBoard();
        this.checkCompletion();
    }
    
    // ボードの表示更新
    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            
            // クラスのリセット
            cell.className = 'cell';
            cell.innerHTML = '';
            
            // 固定セル
            if (this.fixedCells.has(index)) {
                cell.classList.add('fixed');
            }
            
            // 選択セル
            if (index === this.selectedCell) {
                cell.classList.add('selected');
            }
            
            // ハイライト
            if (this.options.highlightEnabled && this.selectedCell !== null) {
                const selectedRow = Math.floor(this.selectedCell / 9);
                const selectedCol = this.selectedCell % 9;
                const selectedValue = this.board[selectedRow][selectedCol];
                
                // 同じ数字
                if (selectedValue !== 0 && value === selectedValue) {
                    cell.classList.add('same-number');
                }
                
                // 同じ行、列、ブロック
                if (row === selectedRow || col === selectedCol ||
                    (Math.floor(row / 3) === Math.floor(selectedRow / 3) &&
                     Math.floor(col / 3) === Math.floor(selectedCol / 3))) {
                    if (index !== this.selectedCell) {
                        cell.classList.add('highlighted');
                    }
                }
            }
            
            // 値の表示
            if (value !== 0) {
                cell.textContent = value;
            } else if (this.options.candidatesMode === 'internal' && this.candidates[index]) {
                // 候補数字の内部表示
                const candidatesDiv = document.createElement('div');
                candidatesDiv.className = 'candidates';
                
                for (let n = 1; n <= 9; n++) {
                    const span = document.createElement('span');
                    if (this.candidates[index].includes(n)) {
                        span.textContent = n;
                    }
                    candidatesDiv.appendChild(span);
                }
                
                cell.appendChild(candidatesDiv);
            }
        });
        
        this.updateCandidatesDisplay();
    }
    
    // 候補数字の更新
    updateCandidates() {
        this.candidates = {};
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const index = i * 9 + j;
                if (this.board[i][j] === 0) {
                    this.candidates[index] = [];
                    for (let num = 1; num <= 9; num++) {
                        if (this.isValid(this.board, i, j, num)) {
                            this.candidates[index].push(num);
                        }
                    }
                }
            }
        }
    }
    
    // 候補数字の外部表示更新
    updateCandidatesDisplay() {
        const panel = document.getElementById('candidates-panel');
        const display = document.getElementById('candidates-display');
        
        if (this.options.candidatesMode === 'external') {
            panel.classList.remove('hidden');
            
            if (this.selectedCell !== null) {
                const row = Math.floor(this.selectedCell / 9);
                const col = this.selectedCell % 9;
                
                if (this.board[row][col] === 0 && this.candidates[this.selectedCell]) {
                    display.innerHTML = `
                        <div class="cell-info">
                            <strong>位置: 行${row + 1}, 列${col + 1}</strong><br>
                            候補数字: ${this.candidates[this.selectedCell].join(', ')}
                        </div>
                    `;
                } else {
                    display.innerHTML = '<div class="cell-info">このセルには候補数字がありません</div>';
                }
            } else {
                display.innerHTML = '<div class="cell-info">セルを選択してください</div>';
            }
        } else {
            panel.classList.add('hidden');
        }
    }
    
    // エラー表示
    showError(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.classList.add('error');
        setTimeout(() => cell.classList.remove('error'), 1000);
    }
    
    // 正解表示
    showCorrect(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.classList.add('correct');
        setTimeout(() => cell.classList.remove('correct'), 1000);
    }
    
    // ヒント表示
    showHint() {
        if (this.selectedCell === null) {
            this.updateStatus('ヒントを表示するセルを選択してください');
            return;
        }
        
        const row = Math.floor(this.selectedCell / 9);
        const col = this.selectedCell % 9;
        
        if (this.fixedCells.has(this.selectedCell)) {
            this.updateStatus('このセルは固定されています');
            return;
        }
        
        if (this.board[row][col] === this.solution[row][col]) {
            this.updateStatus('このセルは既に正しい数字が入っています');
            return;
        }
        
        this.board[row][col] = this.solution[row][col];
        this.updateCandidates();
        this.updateBoard();
        this.updateStatus(`ヒント: ${this.solution[row][col]}`);
        this.checkCompletion();
    }
    
    // 解答チェック
    checkSolution() {
        let errors = 0;
        let completed = true;
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    completed = false;
                } else if (this.board[i][j] !== this.solution[i][j]) {
                    errors++;
                }
            }
        }
        
        if (completed) {
            if (errors === 0) {
                this.updateStatus('🎉 おめでとうございます！完璧です！');
                this.stopTimer();
            } else {
                this.updateStatus(`❌ ${errors}個の間違いがあります`);
            }
        } else {
            if (errors === 0) {
                this.updateStatus('✓ 今のところ全て正解です！');
            } else {
                this.updateStatus(`❌ ${errors}個の間違いがあります`);
            }
        }
    }
    
    // 完成チェック
    checkCompletion() {
        let completed = true;
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === 0) {
                    completed = false;
                    break;
                }
            }
            if (!completed) break;
        }
        
        if (completed) {
            this.checkSolution();
        }
    }
    
    // タイマー開始
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);
    }
    
    // タイマー停止
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // タイマー表示更新
    updateTimerDisplay() {
        const minutes = Math.floor(this.timer / 60);
        const seconds = this.timer % 60;
        document.getElementById('timer').textContent = 
            `時間: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    // ステータス更新
    updateStatus(message) {
        document.getElementById('status-message').textContent = message;
        setTimeout(() => {
            document.getElementById('status-message').textContent = '';
        }, 3000);
    }
    
    // ゲーム保存
    saveGame() {
        const gameState = {
            board: this.board,
            solution: this.solution,
            fixedCells: Array.from(this.fixedCells),
            difficulty: this.difficulty,
            timer: this.timer,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('sudoku_save', JSON.stringify(gameState));
        this.updateStatus('✓ ゲームを保存しました');
    }
    
    // ゲーム読込
    loadGame() {
        const saved = localStorage.getItem('sudoku_save');
        if (!saved) {
            this.updateStatus('保存されたゲームがありません');
            return;
        }
        
        try {
            const gameState = JSON.parse(saved);
            this.board = gameState.board;
            this.solution = gameState.solution;
            this.fixedCells = new Set(gameState.fixedCells);
            this.difficulty = gameState.difficulty;
            this.timer = gameState.timer || 0;
            
            this.stopTimer();
            this.startTimer();
            this.updateCandidates();
            this.updateBoard();
            this.updateStatus('✓ ゲームを読み込みました');
            
            // 難易度ボタンの状態更新
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.difficulty === this.difficulty) {
                    btn.classList.add('active');
                }
            });
        } catch (e) {
            this.updateStatus('❌ 読み込みに失敗しました');
        }
    }
    
    // オプション保存
    saveOptions() {
        localStorage.setItem('sudoku_options', JSON.stringify(this.options));
    }
    
    // オプション読込
    loadOptions() {
        const saved = localStorage.getItem('sudoku_options');
        if (saved) {
            try {
                const options = JSON.parse(saved);
                this.options = options;
                
                document.getElementById('highlight-toggle').checked = options.highlightEnabled;
                document.getElementById('error-check-toggle').checked = options.errorCheckEnabled;
                document.getElementById('candidates-mode').value = options.candidatesMode;
            } catch (e) {
                console.error('Failed to load options');
            }
        }
    }
    
    // メモ保存
    saveMemo() {
        const memo = document.getElementById('memo-area').value;
        localStorage.setItem('sudoku_memo', memo);
        this.updateStatus('✓ メモを保存しました');
    }
    
    // メモ読込
    loadMemo() {
        const memo = localStorage.getItem('sudoku_memo');
        if (memo) {
            document.getElementById('memo-area').value = memo;
        }
    }
}

// ゲーム初期化
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SudokuGame();
    
    // デフォルトの難易度を設定
    document.querySelector('.difficulty-btn[data-difficulty="medium"]').classList.add('active');
});
