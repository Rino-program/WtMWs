const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let W, H;
let grid, prevGrid, nextGrid;
let resolution = 4;
let cols, rows;
let autoMode = false;
let autoInterval;

let settings = {
    amplitude: 50,
    wavelength: 30,
    damping: 0.98,
    mode: 'ripple',
    colorMode: 'gradient'
};

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.floor(W / resolution);
    rows = Math.floor(H / resolution);
    initGrid();
}

function initGrid() {
    grid = new Float32Array(cols * rows);
    prevGrid = new Float32Array(cols * rows);
    nextGrid = new Float32Array(cols * rows);
}

function idx(x, y) {
    return y * cols + x;
}

function addWave(cx, cy, amp) {
    const gridX = Math.floor(cx / resolution);
    const gridY = Math.floor(cy / resolution);
    const radius = 3;
    
    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            const x = gridX + dx;
            const y = gridY + dy;
            if (x >= 0 && x < cols && y >= 0 && y < rows) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= radius) {
                    grid[idx(x, y)] = amp * (1 - dist / radius);
                }
            }
        }
    }
}

function updateWaves() {
    for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
            const i = idx(x, y);
            // 2D波動方程式
            nextGrid[i] = (
                grid[idx(x-1, y)] +
                grid[idx(x+1, y)] +
                grid[idx(x, y-1)] +
                grid[idx(x, y+1)]
            ) / 2 - prevGrid[i];
            
            nextGrid[i] *= settings.damping;
        }
    }
    
    // グリッドをスワップ
    const temp = prevGrid;
    prevGrid = grid;
    grid = nextGrid;
    nextGrid = temp;
}

function getColor(val) {
    const normalized = Math.max(-1, Math.min(1, val / settings.amplitude));
    const intensity = Math.abs(normalized);
    
    switch (settings.colorMode) {
        case 'neon':
            if (normalized > 0) {
                return `rgba(${Math.floor(255 * intensity)}, ${Math.floor(50 * intensity)}, ${Math.floor(255 * intensity)}, ${intensity})`;
            } else {
                return `rgba(${Math.floor(50 * intensity)}, ${Math.floor(255 * intensity)}, ${Math.floor(255 * intensity)}, ${intensity})`;
            }
            
        case 'ocean':
            const blue = 150 + normalized * 100;
            const green = 100 + Math.abs(normalized) * 100;
            return `rgba(${Math.floor(30 * intensity)}, ${Math.floor(green)}, ${Math.floor(blue)}, ${0.3 + intensity * 0.7})`;
            
        case 'fire':
            if (normalized > 0) {
                return `rgba(255, ${Math.floor(100 + 155 * (1 - intensity))}, ${Math.floor(50 * (1 - intensity))}, ${intensity})`;
            } else {
                return `rgba(${Math.floor(50 + 100 * intensity)}, ${Math.floor(50 * intensity)}, ${Math.floor(200 * intensity)}, ${intensity})`;
            }
            
        default: // gradient
            const hue = normalized > 0 ? 
                320 + normalized * 40 : // ピンク〜紫
                180 - normalized * 40;  // シアン〜青
            return `hsla(${hue}, 80%, ${50 + intensity * 30}%, ${0.2 + intensity * 0.8})`;
    }
}

function render() {
    ctx.fillStyle = 'rgba(10, 10, 26, 0.3)';
    ctx.fillRect(0, 0, W, H);
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const val = grid[idx(x, y)];
            if (Math.abs(val) > 0.5) {
                ctx.fillStyle = getColor(val);
                ctx.fillRect(x * resolution, y * resolution, resolution, resolution);
            }
        }
    }
}

function animate() {
    updateWaves();
    render();
    requestAnimationFrame(animate);
}

function startAuto() {
    if (autoInterval) clearInterval(autoInterval);
    
    switch (settings.mode) {
        case 'rain':
            autoInterval = setInterval(() => {
                const x = Math.random() * W;
                const y = Math.random() * H;
                addWave(x, y, settings.amplitude * (0.5 + Math.random() * 0.5));
            }, 200);
            break;
            
        case 'interference':
            // 複数の固定波源
            const sources = [
                { x: W * 0.3, y: H * 0.5 },
                { x: W * 0.7, y: H * 0.5 }
            ];
            let phase = 0;
            autoInterval = setInterval(() => {
                sources.forEach(s => {
                    addWave(s.x, s.y, settings.amplitude * Math.sin(phase));
                });
                phase += 0.3;
            }, 50);
            break;
            
        default: // ripple
            autoInterval = setInterval(() => {
                const x = W / 2 + (Math.random() - 0.5) * W * 0.5;
                const y = H / 2 + (Math.random() - 0.5) * H * 0.5;
                addWave(x, y, settings.amplitude);
            }, 1000);
    }
}

// イベントリスナー
window.addEventListener('resize', resize);

canvas.addEventListener('mousedown', e => {
    addWave(e.clientX, e.clientY, settings.amplitude);
});

canvas.addEventListener('mousemove', e => {
    if (e.buttons === 1) {
        addWave(e.clientX, e.clientY, settings.amplitude * 0.5);
    }
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    Array.from(e.touches).forEach(t => {
        addWave(t.clientX, t.clientY, settings.amplitude);
    });
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    Array.from(e.touches).forEach(t => {
        addWave(t.clientX, t.clientY, settings.amplitude * 0.3);
    });
}, { passive: false });

// コントロール
document.getElementById('amplitude').addEventListener('input', e => {
    settings.amplitude = parseInt(e.target.value);
    document.getElementById('ampVal').textContent = settings.amplitude;
});

document.getElementById('wavelength').addEventListener('input', e => {
    settings.wavelength = parseInt(e.target.value);
    document.getElementById('waveVal').textContent = settings.wavelength;
});

document.getElementById('damping').addEventListener('input', e => {
    settings.damping = parseFloat(e.target.value);
    document.getElementById('dampVal').textContent = settings.damping;
});

document.getElementById('mode').addEventListener('change', e => {
    settings.mode = e.target.value;
    if (autoMode) startAuto();
});

document.getElementById('colorMode').addEventListener('change', e => {
    settings.colorMode = e.target.value;
});

document.getElementById('clear').addEventListener('click', () => {
    initGrid();
});

document.getElementById('auto').addEventListener('click', e => {
    autoMode = !autoMode;
    e.target.textContent = autoMode ? '停止' : '自動生成';
    
    if (autoMode) {
        startAuto();
    } else {
        if (autoInterval) clearInterval(autoInterval);
    }
});

// 初期化
resize();
animate();
