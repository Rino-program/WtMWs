const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let isDrawing = false;
let lastX = 0, lastY = 0;
let currentTool = 'brush';
let currentColor = '#000000';
let brushSize = 5;
let brushOpacity = 1;
let startX, startY;

// レイヤーシステム
let layers = [];
let activeLayerIndex = 0;
let layerCanvases = [];

// 履歴
let history = [];
let historyIndex = -1;
const maxHistory = 50;

// 初期化
function init() {
    addLayer('背景');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    updateColorDisplay();
}

function addLayer(name = `レイヤー ${layers.length + 1}`) {
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = canvas.width;
    layerCanvas.height = canvas.height;
    
    layers.push({
        name,
        visible: true,
        opacity: 1
    });
    layerCanvases.push(layerCanvas);
    activeLayerIndex = layers.length - 1;
    
    renderLayers();
    renderLayerPanel();
}

function deleteLayer() {
    if (layers.length <= 1) return;
    
    layers.splice(activeLayerIndex, 1);
    layerCanvases.splice(activeLayerIndex, 1);
    activeLayerIndex = Math.min(activeLayerIndex, layers.length - 1);
    
    renderLayers();
    renderLayerPanel();
    saveToHistory();
}

function mergeLayersDown() {
    if (activeLayerIndex === 0 || layers.length <= 1) return;
    
    const upperCtx = layerCanvases[activeLayerIndex].getContext('2d');
    const lowerCtx = layerCanvases[activeLayerIndex - 1].getContext('2d');
    
    lowerCtx.globalAlpha = layers[activeLayerIndex].opacity;
    lowerCtx.drawImage(layerCanvases[activeLayerIndex], 0, 0);
    lowerCtx.globalAlpha = 1;
    
    layers.splice(activeLayerIndex, 1);
    layerCanvases.splice(activeLayerIndex, 1);
    activeLayerIndex--;
    
    renderLayers();
    renderLayerPanel();
    saveToHistory();
}

function renderLayerPanel() {
    const layersEl = document.getElementById('layers');
    layersEl.innerHTML = '';
    
    for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        const div = document.createElement('div');
        div.className = `layer ${i === activeLayerIndex ? 'active' : ''}`;
        div.innerHTML = `
            <canvas class="layer-preview" width="30" height="30"></canvas>
            <span class="layer-name">${layer.name}</span>
            <span class="layer-visibility">${layer.visible ? '👁️' : '👁️‍🗨️'}</span>
        `;
        
        // プレビュー更新
        const previewCanvas = div.querySelector('.layer-preview');
        const previewCtx = previewCanvas.getContext('2d');
        previewCtx.drawImage(layerCanvases[i], 0, 0, 30, 30);
        
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('layer-visibility')) {
                layers[i].visible = !layers[i].visible;
                renderLayers();
                renderLayerPanel();
            } else {
                activeLayerIndex = i;
                renderLayerPanel();
            }
        });
        
        layersEl.appendChild(div);
    }
}

function renderLayers() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    layerCanvases.forEach((layerCanvas, i) => {
        if (layers[i].visible) {
            ctx.globalAlpha = layers[i].opacity;
            ctx.drawImage(layerCanvas, 0, 0);
        }
    });
    ctx.globalAlpha = 1;
}

function getActiveLayerCtx() {
    return layerCanvases[activeLayerIndex].getContext('2d');
}

function updateColorDisplay() {
    document.getElementById('color-display').style.background = currentColor;
}

function saveToHistory() {
    // 現在の状態を保存
    const state = layerCanvases.map(c => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = c.width;
        tempCanvas.height = c.height;
        tempCanvas.getContext('2d').drawImage(c, 0, 0);
        return tempCanvas;
    });
    
    // 現在位置より先の履歴を削除
    history = history.slice(0, historyIndex + 1);
    history.push(state);
    
    if (history.length > maxHistory) {
        history.shift();
    }
    historyIndex = history.length - 1;
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreFromHistory();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreFromHistory();
    }
}

function restoreFromHistory() {
    const state = history[historyIndex];
    state.forEach((savedCanvas, i) => {
        if (layerCanvases[i]) {
            const ctx = layerCanvases[i].getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(savedCanvas, 0, 0);
        }
    });
    renderLayers();
    renderLayerPanel();
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = getMousePos(e);
    [startX, startY] = [lastX, lastY];
    
    if (currentTool === 'fill') {
        floodFill(lastX, lastY);
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const [x, y] = getMousePos(e);
    const layerCtx = getActiveLayerCtx();
    
    layerCtx.globalAlpha = brushOpacity;
    layerCtx.lineCap = 'round';
    layerCtx.lineJoin = 'round';
    
    switch (currentTool) {
        case 'brush':
        case 'pencil':
            layerCtx.strokeStyle = currentColor;
            layerCtx.lineWidth = currentTool === 'pencil' ? 1 : brushSize;
            layerCtx.beginPath();
            layerCtx.moveTo(lastX, lastY);
            layerCtx.lineTo(x, y);
            layerCtx.stroke();
            break;
            
        case 'eraser':
            layerCtx.globalCompositeOperation = 'destination-out';
            layerCtx.lineWidth = brushSize;
            layerCtx.beginPath();
            layerCtx.moveTo(lastX, lastY);
            layerCtx.lineTo(x, y);
            layerCtx.stroke();
            layerCtx.globalCompositeOperation = 'source-over';
            break;
            
        case 'line':
        case 'rect':
        case 'circle':
        case 'triangle':
            // 図形描画中はプレビュー表示
            renderLayers();
            drawShapePreview(ctx, x, y);
            return;
    }
    
    [lastX, lastY] = [x, y];
    renderLayers();
}

function drawShapePreview(context, x, y) {
    context.strokeStyle = currentColor;
    context.fillStyle = currentColor;
    context.lineWidth = brushSize;
    context.globalAlpha = brushOpacity;
    context.setLineDash([5, 5]);
    
    switch (currentTool) {
        case 'line':
            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(x, y);
            context.stroke();
            break;
            
        case 'rect':
            context.strokeRect(startX, startY, x - startX, y - startY);
            break;
            
        case 'circle':
            const radius = Math.hypot(x - startX, y - startY);
            context.beginPath();
            context.arc(startX, startY, radius, 0, Math.PI * 2);
            context.stroke();
            break;
            
        case 'triangle':
            context.beginPath();
            context.moveTo(startX, startY);
            context.lineTo(x, y);
            context.lineTo(startX * 2 - x, y);
            context.closePath();
            context.stroke();
            break;
    }
    
    context.setLineDash([]);
    context.globalAlpha = 1;
}

function stopDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;
    
    const [x, y] = getMousePos(e);
    const layerCtx = getActiveLayerCtx();
    
    layerCtx.strokeStyle = currentColor;
    layerCtx.fillStyle = currentColor;
    layerCtx.lineWidth = brushSize;
    layerCtx.globalAlpha = brushOpacity;
    layerCtx.lineCap = 'round';
    layerCtx.lineJoin = 'round';
    
    switch (currentTool) {
        case 'line':
            layerCtx.beginPath();
            layerCtx.moveTo(startX, startY);
            layerCtx.lineTo(x, y);
            layerCtx.stroke();
            break;
            
        case 'rect':
            layerCtx.strokeRect(startX, startY, x - startX, y - startY);
            break;
            
        case 'circle':
            const radius = Math.hypot(x - startX, y - startY);
            layerCtx.beginPath();
            layerCtx.arc(startX, startY, radius, 0, Math.PI * 2);
            layerCtx.stroke();
            break;
            
        case 'triangle':
            layerCtx.beginPath();
            layerCtx.moveTo(startX, startY);
            layerCtx.lineTo(x, y);
            layerCtx.lineTo(startX * 2 - x, y);
            layerCtx.closePath();
            layerCtx.stroke();
            break;
    }
    
    layerCtx.globalAlpha = 1;
    renderLayers();
    renderLayerPanel();
    saveToHistory();
}

function floodFill(startX, startY) {
    const layerCtx = getActiveLayerCtx();
    const imageData = layerCtx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];
    
    // 新しい色をパース
    const fillColor = hexToRgb(currentColor);
    
    // 同じ色なら何もしない
    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) return;
    
    const stack = [[startX, startY]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        
        const pos = (y * canvas.width + x) * 4;
        
        if (data[pos] !== startR || data[pos + 1] !== startG || 
            data[pos + 2] !== startB || data[pos + 3] !== startA) continue;
        
        visited.add(key);
        
        data[pos] = fillColor.r;
        data[pos + 1] = fillColor.g;
        data[pos + 2] = fillColor.b;
        data[pos + 3] = Math.round(brushOpacity * 255);
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    layerCtx.putImageData(imageData, 0, 0);
    renderLayers();
    saveToHistory();
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    return [Math.round(x), Math.round(y)];
}

function clearCanvas() {
    if (confirm('キャンバスをクリアしますか？')) {
        layerCanvases.forEach(c => {
            const ctx = c.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        layers = [];
        layerCanvases = [];
        addLayer('背景');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    }
}

function saveImage() {
    renderLayers();
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// イベントリスナー
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseleave', stopDrawing);

canvas.addEventListener('touchstart', e => { e.preventDefault(); startDrawing(e); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(e); }, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); stopDrawing(e); }, { passive: false });

// ツール選択
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

// 色選択
document.getElementById('color-picker').addEventListener('input', e => {
    currentColor = e.target.value;
    updateColorDisplay();
});

document.getElementById('color-display').addEventListener('click', () => {
    document.getElementById('color-picker').click();
});

document.querySelectorAll('.preset-color').forEach(el => {
    el.addEventListener('click', () => {
        currentColor = el.dataset.color;
        document.getElementById('color-picker').value = currentColor;
        updateColorDisplay();
    });
});

// スライダー
document.getElementById('brush-size').addEventListener('input', e => {
    brushSize = parseInt(e.target.value);
    document.getElementById('size-value').textContent = brushSize;
});

document.getElementById('brush-opacity').addEventListener('input', e => {
    brushOpacity = parseInt(e.target.value) / 100;
    document.getElementById('opacity-value').textContent = e.target.value;
});

// アクションボタン
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);
document.getElementById('clear-btn').addEventListener('click', clearCanvas);
document.getElementById('save-btn').addEventListener('click', saveImage);

// レイヤーコントロール
document.getElementById('add-layer').addEventListener('click', () => addLayer());
document.getElementById('delete-layer').addEventListener('click', deleteLayer);
document.getElementById('merge-layers').addEventListener('click', mergeLayersDown);

// キーボードショートカット
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 's') { e.preventDefault(); saveImage(); }
    }
});

// 初期化
init();
