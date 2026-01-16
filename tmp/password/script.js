const chars = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

let history = JSON.parse(localStorage.getItem('password-history') || '[]');
let currentPassword = '';

function generatePassword() {
    const length = parseInt(document.getElementById('length').value);
    let charset = '';
    
    if (document.getElementById('uppercase').checked) charset += chars.uppercase;
    if (document.getElementById('lowercase').checked) charset += chars.lowercase;
    if (document.getElementById('numbers').checked) charset += chars.numbers;
    if (document.getElementById('symbols').checked) charset += chars.symbols;
    
    if (!charset) {
        charset = chars.lowercase;
        document.getElementById('lowercase').checked = true;
    }
    
    currentPassword = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
        currentPassword += charset[array[i] % charset.length];
    }
    
    document.getElementById('password').textContent = currentPassword;
    updateStrength();
    addToHistory(currentPassword);
}

function updateStrength() {
    const password = currentPassword;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');
    
    fill.className = 'strength-fill';
    
    if (strength <= 2) {
        fill.classList.add('strength-weak');
        text.textContent = '弱い';
        text.style.color = '#e74c3c';
    } else if (strength <= 4) {
        fill.classList.add('strength-fair');
        text.textContent = 'まあまあ';
        text.style.color = '#f39c12';
    } else if (strength <= 5) {
        fill.classList.add('strength-good');
        text.textContent = '良い';
        text.style.color = '#3498db';
    } else {
        fill.classList.add('strength-strong');
        text.textContent = '強い';
        text.style.color = '#00ff88';
    }
}

function copyPassword() {
    if (!currentPassword) return;
    
    navigator.clipboard.writeText(currentPassword).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = '✓ コピー完了';
        btn.classList.add('copied');
        
        showToast();
        
        setTimeout(() => {
            btn.textContent = '📋 コピー';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function addToHistory(password) {
    history.unshift(password);
    if (history.length > 10) history.pop();
    localStorage.setItem('password-history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = history.map((pw, i) => `
        <div class="history-item">
            <span>${pw.substring(0, 20)}${pw.length > 20 ? '...' : ''}</span>
            <button onclick="copyFromHistory(${i})">📋</button>
        </div>
    `).join('');
}

function copyFromHistory(index) {
    navigator.clipboard.writeText(history[index]).then(() => {
        showToast();
    });
}

// イベントリスナー
document.getElementById('length').addEventListener('input', e => {
    document.getElementById('length-value').textContent = e.target.value;
});

// 初期化
renderHistory();
generatePassword();
