// 数独ゲームクラス
class SudokuGame {
    constructor() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fixedCells = new Set();
        this.userEnteredCells = new Set(); // Track user-entered numbers
        this.selectedCell = null;
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.candidates = {};
        this.memo = ''; // Memo attached to game state
        this.isLocked = false; // Board lock state after check
        this.isAutoSolving = false; // Auto-solve state
        this.autoSolvePaused = false; // Auto-solve pause state
        
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
        this.loadMemoFromGame(); // Load memo attached to game
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
        document.getElementById('save-btn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('load-btn').addEventListener('click', () => this.showLoadModal());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('check-btn').addEventListener('click', () => this.checkSolution());
        document.getElementById('auto-solve-btn').addEventListener('click', () => this.toggleAutoSolve());
        
        // Modal
        document.getElementById('close-modal-btn').addEventListener('click', () => this.closeModal());
        
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
        document.getElementById('save-memo-btn').addEventListener('click', () => {
            this.memo = document.getElementById('memo-area').value;
            this.updateStatus('✓ メモを保存しました（ゲームと一緒に保存されます）');
        });
        
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
        this.isLocked = false;
        this.isAutoSolving = false;
        this.autoSolvePaused = false;
        this.generatePuzzle();
        this.selectedCell = null;
        this.userEnteredCells.clear(); // Clear user-entered tracking
        this.timer = 0;
        this.memo = ''; // Reset memo for new game
        document.getElementById('memo-area').value = '';
        this.updateBoard();
        this.updateNumberButtons();
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
        this.updateNumberButtons();
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
    
    // 一意解を持つか確認（改良版）
    hasUniqueSolution() {
        const testBoard = this.board.map(row => [...row]);
        let solutionCount = 0;
        
        const countSolutions = (board, maxCount = 2) => {
            if (solutionCount >= maxCount) return;
            
            const empty = this.findEmpty(board);
            if (!empty) {
                solutionCount++;
                return;
            }
            
            const [row, col] = empty;
            for (let num = 1; num <= 9; num++) {
                if (this.isValid(board, row, col, num)) {
                    board[row][col] = num;
                    countSolutions(board, maxCount);
                    board[row][col] = 0;
                    
                    if (solutionCount >= maxCount) return;
                }
            }
        };
        
        countSolutions(testBoard);
        return solutionCount === 1;
    }
    
    // セルを選択
    selectCell(index) {
        this.selectedCell = index;
        this.updateBoard();
    }
    
    // 数字を配置
    placeNumber(number) {
        if (this.isLocked) {
            this.updateStatus('⚠️ ボードがロックされています。新しいゲームを開始してください。');
            return;
        }
        
        if (this.selectedCell === null || this.fixedCells.has(this.selectedCell)) {
            this.updateStatus('セルを選択してください');
            return;
        }
        
        const row = Math.floor(this.selectedCell / 9);
        const col = this.selectedCell % 9;
        
        this.board[row][col] = number;
        
        // Track user-entered cells
        if (number !== 0) {
            this.userEnteredCells.add(this.selectedCell);
        } else {
            this.userEnteredCells.delete(this.selectedCell);
        }
        
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
        this.updateNumberButtons();
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
            
            // User-entered cells (different color)
            if (this.userEnteredCells.has(index)) {
                cell.classList.add('user-entered');
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
        if (this.isLocked) {
            this.updateStatus('⚠️ ボードがロックされています。新しいゲームを開始してください。');
            return;
        }
        
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
        this.updateNumberButtons();
        this.updateStatus(`ヒント: ${this.solution[row][col]}`);
        this.checkCompletion();
    }
    
    // Count occurrences of each number on the board
    countNumbers() {
        const counts = {};
        for (let i = 1; i <= 9; i++) {
            counts[i] = 0;
        }
        
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const num = this.board[i][j];
                if (num >= 1 && num <= 9) {
                    counts[num]++;
                }
            }
        }
        
        return counts;
    }
    
    // Update number button states based on usage
    updateNumberButtons() {
        const counts = this.countNumbers();
        
        document.querySelectorAll('.number-btn').forEach(btn => {
            const number = parseInt(btn.dataset.number);
            
            if (number >= 1 && number <= 9) {
                if (counts[number] >= 9) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.classList.remove('disabled');
                    btn.disabled = false;
                }
            }
        });
    }
    
    // Toggle auto-solve mode
    toggleAutoSolve() {
        const btn = document.getElementById('auto-solve-btn');
        
        if (this.isAutoSolving) {
            // Stop auto-solve
            this.isAutoSolving = false;
            this.autoSolvePaused = false;
            btn.textContent = '自動解答';
            btn.classList.remove('active');
            this.updateStatus('自動解答を停止しました');
        } else {
            // Start auto-solve
            if (this.isLocked) {
                this.updateStatus('⚠️ ボードがロックされています。新しいゲームを開始してください。');
                return;
            }
            
            this.isAutoSolving = true;
            btn.textContent = '停止';
            btn.classList.add('active');
            this.updateStatus('自動解答を開始します...');
            this.autoSolveWithVisualization();
        }
    }
    
    // Auto-solve with visualization
    async autoSolveWithVisualization() {
        const delay = 100; // milliseconds between steps
        const boardCopy = this.board.map(row => [...row]);
        
        const solveStep = async (row, col) => {
            if (!this.isAutoSolving) return false;
            
            // Find next empty cell
            while (row < 9) {
                while (col < 9) {
                    if (boardCopy[row][col] === 0) {
                        // Try numbers 1-9
                        for (let num = 1; num <= 9; num++) {
                            if (!this.isAutoSolving) return false;
                            
                            if (this.isValid(boardCopy, row, col, num)) {
                                boardCopy[row][col] = num;
                                this.board = boardCopy.map(r => [...r]);
                                this.selectedCell = row * 9 + col;
                                this.updateBoard();
                                this.updateNumberButtons();
                                
                                await this.sleep(delay);
                                
                                // Try to solve rest
                                let nextCol = col + 1;
                                let nextRow = row;
                                if (nextCol >= 9) {
                                    nextCol = 0;
                                    nextRow++;
                                }
                                
                                if (await solveStep(nextRow, nextCol)) {
                                    return true;
                                }
                                
                                if (!this.isAutoSolving) return false;
                                
                                // Backtrack
                                boardCopy[row][col] = 0;
                                this.board = boardCopy.map(r => [...r]);
                                this.updateBoard();
                                this.updateNumberButtons();
                                await this.sleep(delay);
                            }
                        }
                        return false;
                    }
                    col++;
                }
                col = 0;
                row++;
            }
            return true; // Solved
        };
        
        const result = await solveStep(0, 0);
        
        if (result && this.isAutoSolving) {
            this.updateStatus('✓ 自動解答が完了しました！');
            this.isAutoSolving = false;
            document.getElementById('auto-solve-btn').textContent = '自動解答';
            document.getElementById('auto-solve-btn').classList.remove('active');
            this.checkSolution();
        } else if (!this.isAutoSolving) {
            // Stopped by user
        } else {
            this.updateStatus('❌ 解答できませんでした');
            this.isAutoSolving = false;
            document.getElementById('auto-solve-btn').textContent = '自動解答';
            document.getElementById('auto-solve-btn').classList.remove('active');
        }
    }
    
    // Sleep utility
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
                this.isLocked = true;
                this.showSuccessAnimation();
            } else {
                this.updateStatus(`❌ ${errors}個の間違いがあります`);
                this.isLocked = true;
                this.showFailureAnimation();
            }
        } else {
            if (errors === 0) {
                this.updateStatus('✓ 今のところ全て正解です！');
            } else {
                this.updateStatus(`❌ ${errors}個の間違いがあります`);
            }
        }
    }
    
    // Success animation
    showSuccessAnimation() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.classList.add('success-animation');
        
        setTimeout(() => {
            boardElement.classList.remove('success-animation');
        }, 2000);
    }
    
    // Failure animation
    showFailureAnimation() {
        const boardElement = document.getElementById('sudoku-board');
        boardElement.classList.add('failure-animation');
        
        setTimeout(() => {
            boardElement.classList.remove('failure-animation');
        }, 1000);
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
    
    // モーダル表示（保存）
    showSaveModal() {
        this.memo = document.getElementById('memo-area').value; // Save current memo
        const modal = document.getElementById('save-load-modal');
        document.getElementById('modal-title').textContent = 'セーブスロット選択';
        
        const slotsContainer = document.getElementById('save-slots');
        slotsContainer.innerHTML = '';
        
        const saves = this.getAllSaves();
        
        for (let i = 1; i <= 5; i++) {
            const slotData = saves[`slot${i}`];
            const slotDiv = document.createElement('div');
            slotDiv.className = 'save-slot' + (slotData ? '' : ' empty');
            
            if (slotData) {
                slotDiv.innerHTML = `
                    <div class="save-slot-header">
                        <span class="save-slot-title">スロット ${i}</span>
                        <button class="save-slot-delete" onclick="game.deleteSave(${i}); event.stopPropagation();">削除</button>
                    </div>
                    <div class="save-slot-info">
                        難易度: ${this.getDifficultyName(slotData.difficulty)}<br>
                        日時: ${new Date(slotData.timestamp).toLocaleString('ja-JP')}<br>
                        タイマー: ${this.formatTime(slotData.timer)}
                    </div>
                `;
            } else {
                slotDiv.innerHTML = `
                    <div class="save-slot-title">スロット ${i}</div>
                    <div class="save-slot-info">空き</div>
                `;
            }
            
            slotDiv.addEventListener('click', () => {
                this.saveToSlot(i);
                this.closeModal();
            });
            
            slotsContainer.appendChild(slotDiv);
        }
        
        modal.classList.remove('hidden');
    }
    
    // モーダル表示（読込）
    showLoadModal() {
        const modal = document.getElementById('save-load-modal');
        document.getElementById('modal-title').textContent = 'ロードスロット選択';
        
        const slotsContainer = document.getElementById('save-slots');
        slotsContainer.innerHTML = '';
        
        const saves = this.getAllSaves();
        let hasData = false;
        
        for (let i = 1; i <= 5; i++) {
            const slotData = saves[`slot${i}`];
            if (slotData) hasData = true;
            
            const slotDiv = document.createElement('div');
            slotDiv.className = 'save-slot' + (slotData ? '' : ' empty');
            
            if (slotData) {
                slotDiv.innerHTML = `
                    <div class="save-slot-header">
                        <span class="save-slot-title">スロット ${i}</span>
                        <button class="save-slot-delete" onclick="game.deleteSave(${i}); event.stopPropagation();">削除</button>
                    </div>
                    <div class="save-slot-info">
                        難易度: ${this.getDifficultyName(slotData.difficulty)}<br>
                        日時: ${new Date(slotData.timestamp).toLocaleString('ja-JP')}<br>
                        タイマー: ${this.formatTime(slotData.timer)}
                    </div>
                `;
                
                slotDiv.addEventListener('click', () => {
                    this.loadFromSlot(i);
                    this.closeModal();
                });
            } else {
                slotDiv.innerHTML = `
                    <div class="save-slot-title">スロット ${i}</div>
                    <div class="save-slot-info">データなし</div>
                `;
                slotDiv.style.cursor = 'not-allowed';
            }
            
            slotsContainer.appendChild(slotDiv);
        }
        
        if (!hasData) {
            slotsContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">保存されたデータがありません</div>';
        }
        
        modal.classList.remove('hidden');
    }
    
    // モーダルを閉じる
    closeModal() {
        document.getElementById('save-load-modal').classList.add('hidden');
    }
    
    // 全てのセーブデータを取得
    getAllSaves() {
        const saves = localStorage.getItem('sudoku_saves');
        return saves ? JSON.parse(saves) : {};
    }
    
    // スロットに保存
    saveToSlot(slotNumber) {
        const saves = this.getAllSaves();
        
        saves[`slot${slotNumber}`] = {
            board: this.board,
            solution: this.solution,
            fixedCells: Array.from(this.fixedCells),
            userEnteredCells: Array.from(this.userEnteredCells),
            difficulty: this.difficulty,
            timer: this.timer,
            memo: this.memo,
            isLocked: this.isLocked,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('sudoku_saves', JSON.stringify(saves));
        this.updateStatus(`✓ スロット${slotNumber}に保存しました`);
    }
    
    // スロットから読込
    loadFromSlot(slotNumber) {
        const saves = this.getAllSaves();
        const slotData = saves[`slot${slotNumber}`];
        
        if (!slotData) {
            this.updateStatus('❌ データがありません');
            return;
        }
        
        try {
            this.board = slotData.board;
            this.solution = slotData.solution;
            this.fixedCells = new Set(slotData.fixedCells);
            this.userEnteredCells = new Set(slotData.userEnteredCells || []);
            this.difficulty = slotData.difficulty;
            this.timer = slotData.timer || 0;
            this.memo = slotData.memo || '';
            this.isLocked = slotData.isLocked || false;
            
            // Load memo into textarea
            document.getElementById('memo-area').value = this.memo;
            
            this.stopTimer();
            this.startTimer();
            this.updateCandidates();
            this.updateBoard();
            this.updateNumberButtons();
            this.updateStatus(`✓ スロット${slotNumber}から読み込みました`);
            
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
    
    // セーブデータ削除
    deleteSave(slotNumber) {
        const saves = this.getAllSaves();
        delete saves[`slot${slotNumber}`];
        localStorage.setItem('sudoku_saves', JSON.stringify(saves));
        
        // モーダルを再表示
        this.closeModal();
        setTimeout(() => {
            const modalTitle = document.getElementById('modal-title').textContent;
            if (modalTitle.includes('セーブ')) {
                this.showSaveModal();
            } else {
                this.showLoadModal();
            }
        }, 100);
        
        this.updateStatus(`✓ スロット${slotNumber}を削除しました`);
    }
    
    // 難易度名取得
    getDifficultyName(difficulty) {
        const names = {
            easy: '簡単',
            medium: '普通',
            hard: '難しい',
            expert: '超難'
        };
        return names[difficulty] || difficulty;
    }
    
    // 時間フォーマット
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
    
    // メモを現在のゲームから読込
    loadMemoFromGame() {
        document.getElementById('memo-area').value = this.memo;
    }
}

// ゲーム初期化
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new SudokuGame();
    
    // デフォルトの難易度を設定
    document.querySelector('.difficulty-btn[data-difficulty="medium"]').classList.add('active');
});
