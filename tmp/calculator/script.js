// 電卓の状態管理
const state = {
    expression: '',           // 表示する式
    currentInput: '0',        // 現在の入力値
    result: '0',              // 計算結果
    history: [],              // 計算履歴
    memory: 0,                // メモリ値
    hasMemory: false,         // メモリに値があるか
    angleMode: 'deg',         // 角度モード: 'deg' or 'rad'
    isScientificMode: false,  // 関数電卓モード
    waitingForOperand: false, // オペランド待ち
    lastOperator: null,       // 最後の演算子
    openParens: 0,            // 開き括弧の数
    lastResult: null          // 最後の計算結果
};

// DOM要素
const exprEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyEl = document.getElementById('history');
const calculatorEl = document.getElementById('calculator');
const scientificEl = document.getElementById('scientific');
const angleModeEl = document.getElementById('angleMode');
const memoryButtonsEl = document.getElementById('memoryButtons');

// ディスプレイ更新
function updateDisplay() {
    exprEl.textContent = state.expression || '';
    resultEl.textContent = formatNumber(state.currentInput);
    
    // メモリインジケーター
    let memIndicator = document.querySelector('.memory-indicator');
    if (!memIndicator) {
        memIndicator = document.createElement('div');
        memIndicator.className = 'memory-indicator';
        memIndicator.textContent = 'M';
        document.querySelector('.display').appendChild(memIndicator);
    }
    memIndicator.classList.toggle('show', state.hasMemory);
}

// 数値フォーマット
function formatNumber(num) {
    if (num === 'Error' || num === 'Infinity' || num === '-Infinity') return num;
    if (num === '') return '0';
    
    const n = parseFloat(num);
    if (isNaN(n)) return '0';
    
    // 非常に大きい/小さい数は指数表記
    if (Math.abs(n) > 1e12 || (Math.abs(n) < 1e-10 && n !== 0)) {
        return n.toExponential(8);
    }
    
    // 通常の数値
    const formatted = n.toLocaleString('en-US', { maximumFractionDigits: 10 });
    return formatted;
}

// 数値入力
function inputNumber(num) {
    if (state.waitingForOperand) {
        state.currentInput = num;
        state.waitingForOperand = false;
    } else {
        if (num === '.') {
            if (state.currentInput.includes('.')) return;
            state.currentInput += '.';
        } else {
            state.currentInput = state.currentInput === '0' ? num : state.currentInput + num;
        }
    }
    updateDisplay();
}

// 演算子入力
function inputOperator(op) {
    if (op === 'backspace') {
        if (state.currentInput.length > 1) {
            state.currentInput = state.currentInput.slice(0, -1);
        } else {
            state.currentInput = '0';
        }
        updateDisplay();
        return;
    }
    
    if (op === 'percent') {
        const current = parseFloat(state.currentInput);
        if (state.expression) {
            // 式がある場合、パーセント計算
            const match = state.expression.match(/([\d.]+)\s*([+\-])\s*$/);
            if (match) {
                const base = parseFloat(match[1]);
                state.currentInput = String(base * current / 100);
            } else {
                state.currentInput = String(current / 100);
            }
        } else {
            state.currentInput = String(current / 100);
        }
        updateDisplay();
        return;
    }
    
    if (op === 'sign') {
        if (state.currentInput !== '0') {
            if (state.currentInput.startsWith('-')) {
                state.currentInput = state.currentInput.slice(1);
            } else {
                state.currentInput = '-' + state.currentInput;
            }
        }
        updateDisplay();
        return;
    }
    
    // 通常の演算子
    const opSymbols = { '/': ' ÷ ', '*': ' × ', '-': ' − ', '+': ' + ' };
    const opSymbol = opSymbols[op] || ` ${op} `;
    
    if (state.waitingForOperand && state.expression) {
        // 演算子の置き換え
        state.expression = state.expression.replace(/\s*[÷×−+]\s*$/, opSymbol);
    } else {
        state.expression += state.currentInput + opSymbol;
    }
    
    state.lastOperator = op;
    state.waitingForOperand = true;
    updateDisplay();
}

// 計算実行
function calculate() {
    if (!state.expression && !state.currentInput) return;
    
    try {
        let expr = state.expression + state.currentInput;
        
        // 閉じ括弧を追加
        for (let i = 0; i < state.openParens; i++) {
            expr += ')';
        }
        
        // 式を評価用に変換
        const sanitized = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/\^/g, '**')
            .replace(/mod/g, '%');
        
        const calculated = Function('"use strict";return (' + sanitized + ')')();
        
        if (!isFinite(calculated)) {
            throw new Error('Invalid result');
        }
        
        // 履歴に追加
        addHistory(expr, calculated);
        
        state.lastResult = calculated;
        state.currentInput = String(calculated);
        state.expression = '';
        state.openParens = 0;
        state.waitingForOperand = true;
    } catch (e) {
        state.currentInput = 'Error';
        state.expression = '';
        state.openParens = 0;
    }
    
    updateDisplay();
}

// 角度変換（度→ラジアン）
function toRadians(deg) {
    return state.angleMode === 'deg' ? deg * Math.PI / 180 : deg;
}

// 角度変換（ラジアン→度）
function fromRadians(rad) {
    return state.angleMode === 'deg' ? rad * 180 / Math.PI : rad;
}

// 関数適用
function applyFunction(func) {
    const n = parseFloat(state.currentInput);
    let r;
    
    switch (func) {
        // 三角関数
        case 'sin':
            r = Math.sin(toRadians(n));
            break;
        case 'cos':
            r = Math.cos(toRadians(n));
            break;
        case 'tan':
            r = Math.tan(toRadians(n));
            break;
        case 'asin':
            r = fromRadians(Math.asin(n));
            break;
        case 'acos':
            r = fromRadians(Math.acos(n));
            break;
        case 'atan':
            r = fromRadians(Math.atan(n));
            break;
        
        // 対数・指数
        case 'log':
            r = Math.log10(n);
            break;
        case 'ln':
            r = Math.log(n);
            break;
        case 'exp':
            r = Math.exp(n);
            break;
        case '10pow':
            r = Math.pow(10, n);
            break;
        
        // 累乗・ルート
        case 'pow2':
            r = n * n;
            break;
        case 'pow3':
            r = n * n * n;
            break;
        case 'sqrt':
            r = Math.sqrt(n);
            break;
        case 'cbrt':
            r = Math.cbrt(n);
            break;
        case 'pow':
            state.expression += state.currentInput + '^';
            state.waitingForOperand = true;
            updateDisplay();
            return;
        case 'nroot':
            state.expression += state.currentInput + '^(1/';
            state.openParens++;
            state.waitingForOperand = true;
            updateDisplay();
            return;
        
        // 定数
        case 'pi':
            r = Math.PI;
            break;
        case 'e':
            r = Math.E;
            break;
        
        // その他
        case 'abs':
            r = Math.abs(n);
            break;
        case 'inv':
            r = 1 / n;
            break;
        case 'fact':
            r = factorial(Math.floor(n));
            break;
        case 'mod':
            state.expression += state.currentInput + ' mod ';
            state.waitingForOperand = true;
            updateDisplay();
            return;
        
        // 括弧
        case '(':
            state.expression += '(';
            state.openParens++;
            state.waitingForOperand = true;
            updateDisplay();
            return;
        case ')':
            if (state.openParens > 0) {
                state.expression += state.currentInput + ')';
                state.openParens--;
                state.waitingForOperand = true;
            }
            updateDisplay();
            return;
        
        default:
            return;
    }
    
    if (!isFinite(r) || isNaN(r)) {
        state.currentInput = 'Error';
    } else {
        state.currentInput = String(r);
    }
    
    updateDisplay();
}

// 階乗計算
function factorial(n) {
    if (n < 0 || n > 170) return Infinity;
    if (n <= 1) return 1;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
}

// メモリ操作
function memoryOperation(op) {
    const current = parseFloat(state.currentInput) || 0;
    
    switch (op) {
        case 'mc': // Memory Clear
            state.memory = 0;
            state.hasMemory = false;
            break;
        case 'mr': // Memory Recall
            if (state.hasMemory) {
                state.currentInput = String(state.memory);
            }
            break;
        case 'm+': // Memory Add
            state.memory += current;
            state.hasMemory = true;
            state.waitingForOperand = true;
            break;
        case 'm-': // Memory Subtract
            state.memory -= current;
            state.hasMemory = true;
            state.waitingForOperand = true;
            break;
        case 'ms': // Memory Store
            state.memory = current;
            state.hasMemory = true;
            state.waitingForOperand = true;
            break;
    }
    
    updateDisplay();
}

// クリア
function clear() {
    state.expression = '';
    state.currentInput = '0';
    state.waitingForOperand = false;
    state.lastOperator = null;
    state.openParens = 0;
    updateDisplay();
}

// クリアエントリ（現在の入力のみクリア）
function clearEntry() {
    state.currentInput = '0';
    updateDisplay();
}

// 履歴追加
function addHistory(expr, res) {
    state.history.unshift({ expr, res, timestamp: new Date() });
    if (state.history.length > 20) state.history.pop();
    renderHistory();
    saveHistory();
}

// 履歴表示
function renderHistory() {
    if (state.history.length === 0) {
        historyEl.innerHTML = '<div class="history-empty">履歴がありません</div>';
        return;
    }
    
    historyEl.innerHTML = state.history.map((h, i) => `
        <div class="history-item" onclick="loadHistory(${i})">
            <span class="history-expr">${escapeHtml(h.expr)}</span>
            <span class="history-result">= ${formatNumber(String(h.res))}</span>
        </div>
    `).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 履歴読み込み
function loadHistory(i) {
    state.currentInput = String(state.history[i].res);
    state.expression = '';
    state.waitingForOperand = false;
    updateDisplay();
}

// 履歴クリア
function clearHistory() {
    state.history = [];
    renderHistory();
    saveHistory();
}

// 履歴保存
function saveHistory() {
    try {
        localStorage.setItem('calculator_history', JSON.stringify(state.history));
    } catch (e) {}
}

// 履歴読み込み
function loadSavedHistory() {
    try {
        const saved = localStorage.getItem('calculator_history');
        if (saved) {
            state.history = JSON.parse(saved);
            renderHistory();
        }
    } catch (e) {}
}

// モード切替
function setMode(mode) {
    state.isScientificMode = mode === 'scientific';
    
    // UIの更新
    calculatorEl.classList.toggle('scientific-mode', state.isScientificMode);
    scientificEl.classList.toggle('show', state.isScientificMode);
    angleModeEl.classList.toggle('show', state.isScientificMode);
    memoryButtonsEl.classList.toggle('show', state.isScientificMode);
    
    // モード保存
    try {
        localStorage.setItem('calculator_mode', mode);
    } catch (e) {}
}

// 角度モード切替
function setAngleMode(mode) {
    state.angleMode = mode;
    
    // UIの更新
    document.querySelectorAll('.angle-mode button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.angle === mode);
    });
    
    // 角度モード保存
    try {
        localStorage.setItem('calculator_angle', mode);
    } catch (e) {}
}

// イベントリスナー設定
function setupEventListeners() {
    // 数字ボタン
    document.querySelectorAll('[data-num]').forEach(btn => {
        btn.onclick = () => inputNumber(btn.dataset.num);
    });
    
    // 演算子ボタン
    document.querySelectorAll('[data-op]').forEach(btn => {
        btn.onclick = () => inputOperator(btn.dataset.op);
    });
    
    // 関数ボタン
    document.querySelectorAll('[data-func]').forEach(btn => {
        btn.onclick = () => applyFunction(btn.dataset.func);
    });
    
    // メモリボタン
    document.querySelectorAll('[data-mem]').forEach(btn => {
        btn.onclick = () => memoryOperation(btn.dataset.mem);
    });
    
    // クリアボタン
    document.getElementById('clear').onclick = clear;
    document.getElementById('clearEntry').onclick = clearEntry;
    
    // イコールボタン
    document.getElementById('equals').onclick = calculate;
    
    // 履歴クリア
    document.getElementById('clearHistory').onclick = clearHistory;
    
    // モード切替
    document.querySelectorAll('.mode-switch button').forEach(btn => {
        btn.onclick = function() {
            document.querySelector('.mode-switch .active').classList.remove('active');
            this.classList.add('active');
            setMode(this.dataset.mode);
        };
    });
    
    // 角度モード切替
    document.querySelectorAll('.angle-mode button').forEach(btn => {
        btn.onclick = function() {
            document.querySelector('.angle-mode .active').classList.remove('active');
            this.classList.add('active');
            setAngleMode(this.dataset.angle);
        };
    });
    
    // キーボード入力
    document.addEventListener('keydown', e => {
        // 数字とドット
        if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
            e.preventDefault();
            inputNumber(e.key);
        }
        // 演算子
        else if (['+', '-', '*', '/'].includes(e.key)) {
            e.preventDefault();
            inputOperator(e.key);
        }
        // Enter/=で計算
        else if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            calculate();
        }
        // Escapeでクリア
        else if (e.key === 'Escape') {
            e.preventDefault();
            clear();
        }
        // Backspaceで削除
        else if (e.key === 'Backspace') {
            e.preventDefault();
            inputOperator('backspace');
        }
        // %でパーセント
        else if (e.key === '%') {
            e.preventDefault();
            inputOperator('percent');
        }
        // 括弧
        else if (e.key === '(') {
            e.preventDefault();
            applyFunction('(');
        }
        else if (e.key === ')') {
            e.preventDefault();
            applyFunction(')');
        }
        // ^で累乗
        else if (e.key === '^') {
            e.preventDefault();
            applyFunction('pow');
        }
    });
}

// 初期化
function init() {
    setupEventListeners();
    loadSavedHistory();
    
    // 保存されたモードを復元
    try {
        const savedMode = localStorage.getItem('calculator_mode');
        if (savedMode === 'scientific') {
            document.querySelector('.mode-switch button[data-mode="scientific"]').click();
        }
        
        const savedAngle = localStorage.getItem('calculator_angle');
        if (savedAngle === 'rad') {
            setAngleMode('rad');
        }
    } catch (e) {}
    
    updateDisplay();
    renderHistory();
}

// 起動
init();
