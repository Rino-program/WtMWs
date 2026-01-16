let currentValue = 0;

function convertFrom(base) {
    const input = document.getElementById(base).value.trim();
    if (!input) {
        clearAll();
        return;
    }

    let value;
    try {
        switch (base) {
            case 'dec':
                value = parseInt(input, 10);
                break;
            case 'bin':
                value = parseInt(input.replace(/\s/g, ''), 2);
                break;
            case 'hex':
                value = parseInt(input.replace(/^0x/i, ''), 16);
                break;
            case 'oct':
                value = parseInt(input.replace(/^0o/i, ''), 8);
                break;
        }

        if (isNaN(value) || value < 0) {
            return;
        }

        currentValue = value;
        updateAll(base);
    } catch (e) {
        // Invalid input
    }
}

function updateAll(skipBase) {
    if (skipBase !== 'dec') {
        document.getElementById('dec').value = currentValue;
    }
    if (skipBase !== 'bin') {
        document.getElementById('bin').value = currentValue.toString(2);
    }
    if (skipBase !== 'hex') {
        document.getElementById('hex').value = currentValue.toString(16).toUpperCase();
    }
    if (skipBase !== 'oct') {
        document.getElementById('oct').value = currentValue.toString(8);
    }

    updateBitDisplay();
    updateInfo();
    updateOperations();
}

function clearAll() {
    currentValue = 0;
    document.getElementById('dec').value = '';
    document.getElementById('bin').value = '';
    document.getElementById('hex').value = '';
    document.getElementById('oct').value = '';
    updateBitDisplay();
    updateInfo();
}

function updateBitDisplay() {
    const container = document.getElementById('bitDisplay');
    const binary = currentValue.toString(2).padStart(8, '0').slice(-8);
    
    container.innerHTML = binary.split('').map((bit, i) => `
        <div class="bit ${bit === '1' ? 'on' : ''}">
            <span class="bit-value">${bit}</span>
            <span class="bit-pos">${7 - i}</span>
        </div>
    `).join('');
}

function updateInfo() {
    const binary = currentValue.toString(2);
    const bitCount = binary.length;
    const byteCount = Math.ceil(bitCount / 8);
    const oneCount = (binary.match(/1/g) || []).length;
    const zeroCount = bitCount - oneCount;

    document.getElementById('bitCount').textContent = bitCount;
    document.getElementById('byteCount').textContent = byteCount;
    document.getElementById('oneCount').textContent = oneCount;
    document.getElementById('zeroCount').textContent = zeroCount;
}

function updateOperations() {
    const shiftLeft = currentValue << 1;
    const shiftRight = currentValue >> 1;
    const notValue = (~currentValue) & 0xFF;
    const twos = ((~currentValue) + 1) & 0xFF;

    document.getElementById('shiftLeftResult').textContent = shiftLeft;
    document.getElementById('shiftRightResult').textContent = shiftRight;
    document.getElementById('notResult').textContent = notValue + ' (0x' + notValue.toString(16).toUpperCase() + ')';
    document.getElementById('twosResult').textContent = twos + ' (0x' + twos.toString(16).toUpperCase() + ')';
}

function bitShiftLeft() {
    currentValue = currentValue << 1;
    updateAll('none');
    showToast('左シフトしました');
}

function bitShiftRight() {
    currentValue = currentValue >> 1;
    updateAll('none');
    showToast('右シフトしました');
}

function bitNot() {
    currentValue = (~currentValue) & 0xFF;
    updateAll('none');
    showToast('ビット反転しました (8bit)');
}

function twosComplement() {
    currentValue = ((~currentValue) + 1) & 0xFF;
    updateAll('none');
    showToast('2の補数に変換しました (8bit)');
}

function setQuick(value) {
    currentValue = value;
    updateAll('none');
}

function copyValue(base) {
    const value = document.getElementById(base).value;
    if (!value) {
        showToast('コピーする値がありません');
        return;
    }
    navigator.clipboard.writeText(value).then(() => {
        showToast('コピーしました！');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// Initialize
updateBitDisplay();
updateInfo();
