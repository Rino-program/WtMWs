// 数字ランダム
let numberHistory = [];
function generateNumber() {
    const min = parseInt(document.getElementById('min-num').value);
    const max = parseInt(document.getElementById('max-num').value);
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    
    document.getElementById('number-result').textContent = num;
    
    numberHistory.unshift(num);
    if (numberHistory.length > 5) numberHistory.pop();
    document.getElementById('number-history').textContent = 
        '履歴: ' + numberHistory.join(', ');
}

// サイコロ
function rollDice() {
    const count = parseInt(document.getElementById('dice-count').value);
    const sides = parseInt(document.getElementById('dice-sides').value);
    const container = document.getElementById('dice-container');
    
    container.innerHTML = '';
    let total = 0;
    
    for (let i = 0; i < count; i++) {
        const dice = document.createElement('div');
        dice.className = 'dice rolling';
        container.appendChild(dice);
    }
    
    setTimeout(() => {
        const diceElements = container.querySelectorAll('.dice');
        diceElements.forEach(dice => {
            dice.classList.remove('rolling');
            const value = Math.floor(Math.random() * sides) + 1;
            total += value;
            
            if (sides === 6) {
                const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                dice.textContent = faces[value - 1];
            } else {
                dice.textContent = value;
                dice.style.fontSize = '1.5rem';
            }
        });
        
        document.getElementById('dice-total').textContent = `合計: ${total}`;
    }, 500);
}

// コイントス
let coinStats = { heads: 0, tails: 0 };
function flipCoin() {
    const coin = document.getElementById('coin');
    coin.classList.add('flipping');
    
    setTimeout(() => {
        coin.classList.remove('flipping');
        const isHeads = Math.random() < 0.5;
        
        if (isHeads) {
            coin.textContent = '😊';
            coin.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)';
            coinStats.heads++;
        } else {
            coin.textContent = '🦅';
            coin.style.background = 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)';
            coinStats.tails++;
        }
        
        document.getElementById('coin-stats').textContent = 
            `表: ${coinStats.heads} | 裏: ${coinStats.tails}`;
    }, 500);
}

// 色ランダム
function generateColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
    
    document.getElementById('color-preview').style.background = hex;
    document.getElementById('color-code').textContent = hex;
}

function copyColor() {
    const code = document.getElementById('color-code').textContent;
    navigator.clipboard.writeText(code);
    document.getElementById('color-code').textContent = 'コピーしました!';
    setTimeout(() => {
        document.getElementById('color-code').textContent = code;
    }, 1000);
}

// リストから選択
function selectFromList() {
    const listEl = document.getElementById('name-list');
    const text = listEl.innerText || listEl.textContent;
    const items = text.trim().split('\n').map(item => item.trim()).filter(item => item.length > 0);
    
    if (items.length === 0) {
        document.getElementById('list-result').textContent = '項目を入力してください';
        return;
    }
    
    const selected = items[Math.floor(Math.random() * items.length)];
    const resultEl = document.getElementById('list-result');
    resultEl.style.transform = 'scale(1.2)';
    resultEl.textContent = selected;
    setTimeout(() => resultEl.style.transform = 'scale(1)', 200);
    
    // ハイライト表示
    listEl.innerHTML = items.map(item => 
        `<div class="${item === selected ? 'selected' : ''}">${item}</div>`
    ).join('');
}

// Yes/No
let yesnoHistory = [];
let lastYesNo = null;
function generateYesNo() {
    const result = document.getElementById('yesno-result');
    const isYes = Math.random() < 0.5;
    const newResult = isYes ? 'YES' : 'NO';
    
    // アニメーション効果で連続同じ結果でも分かるように
    result.style.transform = 'scale(0.8) rotate(-10deg)';
    result.style.opacity = '0.5';
    
    setTimeout(() => {
        result.textContent = isYes ? '✅ YES' : '❌ NO';
        result.style.color = isYes ? '#2ecc71' : '#e74c3c';
        result.style.transform = 'scale(1.1) rotate(0deg)';
        result.style.opacity = '1';
        
        setTimeout(() => {
            result.style.transform = 'scale(1)';
        }, 150);
    }, 150);
    
    yesnoHistory.unshift(newResult);
    if (yesnoHistory.length > 5) yesnoHistory.pop();
    document.getElementById('yesno-history').textContent = '履歴: ' + yesnoHistory.join(' → ');
    lastYesNo = newResult;
}

// ランダム文字列
function generateString() {
    const length = parseInt(document.getElementById('string-length').value);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    
    document.getElementById('string-result').textContent = result;
}

// ランダム日付
function generateDate() {
    const startYear = parseInt(document.getElementById('year-start').value);
    const endYear = parseInt(document.getElementById('year-end').value);
    
    const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
    const month = Math.floor(Math.random() * 12) + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const date = new Date(year, month - 1, day);
    const weekday = weekdays[date.getDay()];
    
    document.getElementById('date-result').textContent = 
        `${year}年${month}月${day}日 (${weekday})`;
}

// 初期化
generateNumber();
rollDice();
generateColor();
generateString();
generateDate();
