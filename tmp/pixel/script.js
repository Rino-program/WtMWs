// Pixel Art Editor - ピクセルアートエディタ

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

let gridSize = 16;
let pixelSize = 20;
let zoom = 1;
let currentTool = 'pen';
let currentColor = '#ff0000';
let isDrawing = false;
let pixels = [];
let history = [];

const colorPresets = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088',
    '#333333', '#666666', '#999999', '#cccccc', '#884400', '#448800'
];

// 初期化
init();

function init() {
    setupColorPresets();
    setupEventListeners();
    resizeCanvas();
    clearCanvas();
}

function setupColorPresets() {
    const presetsEl = document.getElementById('colorPresets');
    colorPresets.forEach(color => {
        const preset = document.createElement('div');
        preset.className = 'color-preset';
        preset.style.backgroundColor = color;
        preset.addEventListener('click', () => {
            currentColor = color;
            document.getElementById('colorPicker').value = color;
            document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
            preset.classList.add('selected');
        });
        presetsEl.appendChild(preset);
    });
}

function setupEventListeners() {
    // ツール選択
    document.querySelectorAll('.tool').forEach(tool => {
        tool.addEventListener('click', () => {
            document.querySelectorAll('.tool').forEach(t => t.classList.remove('active'));
            tool.classList.add('active');
            currentTool = tool.dataset.tool;
        });
    });

    // カラーピッカー
    document.getElementById('colorPicker').addEventListener('input', e => {
        currentColor = e.target.value;
        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('selected'));
    });

    // キャンバスサイズ
    document.getElementById('canvasSize').addEventListener('change', e => {
        gridSize = parseInt(e.target.value);
        document.getElementById('sizeValue').textContent = gridSize;
        document.getElementById('sizeValue2').textContent = gridSize;
        resizeCanvas();
        clearCanvas();
    });

    // 描画イベント
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    // ボタン
    document.getElementById('clearBtn').addEventListener('click', () => {
        saveHistory();
        clearCanvas();
    });
    document.getElementById('saveBtn').addEventListener('click', saveImage);
    document.getElementById('undoBtn').addEventListener('click', undo);

    // ズーム
    document.getElementById('zoomIn').addEventListener('click', () => changeZoom(0.25));
    document.getElementById('zoomOut').addEventListener('click', () => changeZoom(-0.25));
}

function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth - 300, 500);
    pixelSize = Math.floor(maxSize / gridSize);
    canvas.width = gridSize * pixelSize;
    canvas.height = gridSize * pixelSize;
    previewCanvas.width = gridSize * 4;
    previewCanvas.height = gridSize * 4;
    
    pixels = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
    history = [];
}

function clearCanvas() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    pixels = Array(gridSize).fill().map(() => Array(gridSize).fill(null));
    updatePreview();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * pixelSize, 0);
        ctx.lineTo(i * pixelSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * pixelSize);
        ctx.lineTo(canvas.width, i * pixelSize);
        ctx.stroke();
    }
}

function getPixelPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    return { x: Math.max(0, Math.min(gridSize - 1, x)), y: Math.max(0, Math.min(gridSize - 1, y)) };
}

function startDraw(e) {
    isDrawing = true;
    saveHistory();
    draw(e);
}

function draw(e) {
    if (!isDrawing && currentTool !== 'eyedropper') return;
    const { x, y } = getPixelPos(e);

    switch (currentTool) {
        case 'pen':
            setPixel(x, y, currentColor);
            break;
        case 'eraser':
            setPixel(x, y, null);
            break;
        case 'fill':
            if (isDrawing) {
                floodFill(x, y, currentColor);
                isDrawing = false;
            }
            break;
        case 'eyedropper':
            if (pixels[y][x]) {
                currentColor = pixels[y][x];
                document.getElementById('colorPicker').value = currentColor;
            }
            break;
    }
}

function endDraw() {
    isDrawing = false;
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function setPixel(x, y, color) {
    pixels[y][x] = color;
    if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
    // グリッド線を再描画
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    updatePreview();
}

function floodFill(x, y, newColor) {
    const targetColor = pixels[y][x];
    if (targetColor === newColor) return;

    const stack = [[x, y]];
    const visited = new Set();

    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        const key = `${cx},${cy}`;

        if (visited.has(key)) continue;
        if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) continue;
        if (pixels[cy][cx] !== targetColor) continue;

        visited.add(key);
        setPixel(cx, cy, newColor);

        stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
}

function updatePreview() {
    previewCtx.fillStyle = '#1a1a1a';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    const pSize = previewCanvas.width / gridSize;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (pixels[y][x]) {
                previewCtx.fillStyle = pixels[y][x];
                previewCtx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
        }
    }
}

function saveHistory() {
    history.push(pixels.map(row => [...row]));
    if (history.length > 50) history.shift();
}

function undo() {
    if (history.length === 0) return;
    pixels = history.pop();
    redrawCanvas();
}

function redrawCanvas() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (pixels[y][x]) {
                ctx.fillStyle = pixels[y][x];
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    drawGrid();
    updatePreview();
}

function changeZoom(delta) {
    zoom = Math.max(0.5, Math.min(2, zoom + delta));
    canvas.style.transform = `scale(${zoom})`;
    document.getElementById('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
}

function saveImage() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = gridSize;
    exportCanvas.height = gridSize;
    const exportCtx = exportCanvas.getContext('2d');

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (pixels[y][x]) {
                exportCtx.fillStyle = pixels[y][x];
                exportCtx.fillRect(x, y, 1, 1);
            }
        }
    }

    const link = document.createElement('a');
    link.download = `pixel-art-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}
