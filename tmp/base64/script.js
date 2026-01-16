const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
let currentImageBase64 = '';

// Mode tabs
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.mode;
        document.getElementById('textMode').style.display = mode === 'text' ? 'block' : 'none';
        document.getElementById('imageMode').style.display = mode === 'image' ? 'block' : 'none';
        document.getElementById('urlMode').style.display = mode === 'url' ? 'block' : 'none';
    });
});

// Text encoding
function encode() {
    try {
        const text = inputText.value;
        const encoded = btoa(unescape(encodeURIComponent(text)));
        outputText.value = encoded;
        updateStats();
    } catch(e) {
        showToast('エンコードエラー: ' + e.message);
    }
}

function decode() {
    try {
        const encoded = outputText.value;
        const decoded = decodeURIComponent(escape(atob(encoded)));
        inputText.value = decoded;
        updateStats();
    } catch(e) {
        showToast('デコードエラー: 無効なBase64文字列です');
    }
}

function clearInput() {
    inputText.value = '';
    outputText.value = '';
    updateStats();
}

function copyOutput() {
    navigator.clipboard.writeText(outputText.value).then(() => {
        showToast('コピーしました！');
    });
}

function swapTexts() {
    const temp = inputText.value;
    inputText.value = outputText.value;
    outputText.value = temp;
    updateStats();
}

function updateStats() {
    const inLen = inputText.value.length;
    const outLen = outputText.value.length;
    document.getElementById('inputLength').textContent = inLen.toLocaleString();
    document.getElementById('outputLength').textContent = outLen.toLocaleString();
    const ratio = inLen > 0 ? Math.round((outLen / inLen) * 100) : 0;
    document.getElementById('sizeRatio').textContent = ratio + '%';
}

inputText.addEventListener('input', updateStats);
outputText.addEventListener('input', updateStats);

// Image handling
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
});
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
        handleImage(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImage(e.target.files[0]);
    }
});

function handleImage(file) {
    if (!file.type.startsWith('image/')) {
        showToast('画像ファイルを選択してください');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        currentImageBase64 = base64;
        document.getElementById('previewImg').src = base64;
        document.getElementById('imageBase64').value = base64;
        
        const info = document.getElementById('imageInfo');
        const img = new Image();
        img.onload = () => {
            info.innerHTML = `
                <p><strong>ファイル名:</strong> ${file.name}</p>
                <p><strong>サイズ:</strong> ${formatBytes(file.size)}</p>
                <p><strong>タイプ:</strong> ${file.type}</p>
                <p><strong>寸法:</strong> ${img.width} x ${img.height} px</p>
                <p><strong>Base64サイズ:</strong> ${formatBytes(base64.length)}</p>
            `;
        };
        img.src = base64;
        
        document.getElementById('previewArea').classList.add('show');
    };
    reader.readAsDataURL(file);
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function copyImageBase64() {
    navigator.clipboard.writeText(currentImageBase64).then(() => {
        showToast('Base64をコピーしました！');
    });
}

function downloadBase64() {
    const blob = new Blob([currentImageBase64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'base64.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function clearImage() {
    currentImageBase64 = '';
    document.getElementById('previewImg').src = '';
    document.getElementById('imageBase64').value = '';
    document.getElementById('previewArea').classList.remove('show');
    fileInput.value = '';
}

// URL-safe Base64
function urlEncode() {
    try {
        const text = document.getElementById('urlInputText').value;
        let encoded = btoa(unescape(encodeURIComponent(text)));
        // Make URL-safe
        encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        document.getElementById('urlOutputText').value = encoded;
    } catch(e) {
        showToast('エンコードエラー: ' + e.message);
    }
}

function urlDecode() {
    try {
        let encoded = document.getElementById('urlOutputText').value;
        // Restore from URL-safe
        encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding
        while (encoded.length % 4) encoded += '=';
        const decoded = decodeURIComponent(escape(atob(encoded)));
        document.getElementById('urlInputText').value = decoded;
    } catch(e) {
        showToast('デコードエラー: 無効なBase64文字列です');
    }
}

function copyUrlOutput() {
    navigator.clipboard.writeText(document.getElementById('urlOutputText').value).then(() => {
        showToast('コピーしました！');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}
