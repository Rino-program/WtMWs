const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const stats = document.getElementById('stats');

let cellSize = 8, cols, rows, grid, nextGrid;
let running = false, generation = 0, interval;
let fps = 10, rule = 'conway';
let isDrawing = false, drawState = 1;

const rules = {
    conway: { birth: [3], survive: [2, 3] },
    highlife: { birth: [3, 6], survive: [2, 3] },
    daynight: { birth: [3, 6, 7, 8], survive: [3, 4, 6, 7, 8] },
    seeds: { birth: [2], survive: [] },
    maze: { birth: [3], survive: [1, 2, 3, 4, 5] }
};

const patterns = {
    glider: [[0,1],[1,2],[2,0],[2,1],[2,2]],
    pulsar: (() => {
        const p = [];
        const offsets = [[2,0],[3,0],[4,0],[0,2],[0,3],[0,4],[5,2],[5,3],[5,4],[2,5],[3,5],[4,5]];
        for (let qx = 0; qx < 2; qx++) {
            for (let qy = 0; qy < 2; qy++) {
                offsets.forEach(([x, y]) => {
                    p.push([x + qx * 7, y + qy * 7]);
                });
            }
        }
        return p;
    })(),
    spaceship: [[0,1],[0,2],[1,0],[1,1],[1,2],[1,3],[2,0],[2,1],[2,3],[2,4],[3,2],[3,3]],
    gosper: [[0,4],[0,5],[1,4],[1,5],[10,4],[10,5],[10,6],[11,3],[11,7],[12,2],[12,8],[13,2],[13,8],[14,5],[15,3],[15,7],[16,4],[16,5],[16,6],[17,5],[20,2],[20,3],[20,4],[21,2],[21,3],[21,4],[22,1],[22,5],[24,0],[24,1],[24,5],[24,6],[34,2],[34,3],[35,2],[35,3]]
};

const resize = () => {
    const maxWidth = Math.min(800, innerWidth - 40);
    const maxHeight = Math.min(500, innerHeight - 200);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
    cols = Math.floor(canvas.width / cellSize);
    rows = Math.floor(canvas.height / cellSize);
    initGrid();
};

const initGrid = () => {
    grid = Array(rows).fill().map(() => Array(cols).fill(0));
    nextGrid = Array(rows).fill().map(() => Array(cols).fill(0));
    generation = 0;
};

const countNeighbors = (x, y) => {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + cols) % cols;
            const ny = (y + dy + rows) % rows;
            count += grid[ny][nx];
        }
    }
    return count;
};

const step = () => {
    const r = rules[rule];
    let alive = 0;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const n = countNeighbors(x, y);
            const cell = grid[y][x];
            
            if (cell === 0 && r.birth.includes(n)) nextGrid[y][x] = 1;
            else if (cell === 1 && r.survive.includes(n)) nextGrid[y][x] = 1;
            else nextGrid[y][x] = 0;
            
            if (nextGrid[y][x]) alive++;
        }
    }
    
    [grid, nextGrid] = [nextGrid, grid];
    generation++;
    stats.textContent = `世代: ${generation} | 生存: ${alive}`;
};

const draw = () => {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x]) {
                const hue = (x + y + generation * 2) % 360;
                ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
                ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
            }
        }
    }
    
    // グリッド線（オプション）
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvas.width, y * cellSize);
        ctx.stroke();
    }
};

const placePattern = (pattern, cx, cy) => {
    pattern.forEach(([dx, dy]) => {
        const x = (cx + dx) % cols;
        const y = (cy + dy) % rows;
        if (x >= 0 && y >= 0) grid[y][x] = 1;
    });
};

const toggleCell = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        grid[y][x] = drawState;
        draw();
    }
};

const startStop = () => {
    running = !running;
    document.getElementById('playPause').textContent = running ? '⏸ 停止' : '▶ 再生';
    document.getElementById('playPause').classList.toggle('active', running);
    
    if (running) {
        const loop = () => {
            if (!running) return;
            step();
            draw();
            setTimeout(loop, 1000 / fps);
        };
        loop();
    }
};

canvas.addEventListener('mousedown', e => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        drawState = grid[y][x] ? 0 : 1;
        isDrawing = true;
        toggleCell(e);
    }
});
canvas.addEventListener('mousemove', e => { if (isDrawing) toggleCell(e); });
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

// タッチイベント対応
const handleTouch = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((touch.clientX - rect.left) / cellSize);
    const y = Math.floor((touch.clientY - rect.top) / cellSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
        if (e.type === 'touchstart') {
            drawState = grid[y][x] ? 0 : 1;
            isDrawing = true;
        }
        if (isDrawing) {
            grid[y][x] = drawState;
            draw();
        }
    }
};
canvas.addEventListener('touchstart', handleTouch, { passive: false });
canvas.addEventListener('touchmove', handleTouch, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);

document.getElementById('playPause').addEventListener('click', startStop);
document.getElementById('step').addEventListener('click', () => { step(); draw(); });
document.getElementById('clear').addEventListener('click', () => { initGrid(); draw(); });
document.getElementById('random').addEventListener('click', () => {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            grid[y][x] = Math.random() < 0.3 ? 1 : 0;
        }
    }
    generation = 0;
    draw();
});

document.getElementById('rule').addEventListener('change', e => rule = e.target.value);
document.getElementById('speed').addEventListener('input', e => {
    fps = +e.target.value;
    document.getElementById('speedVal').textContent = fps;
});
document.getElementById('cellSize').addEventListener('input', e => {
    cellSize = +e.target.value;
    document.getElementById('sizeVal').textContent = cellSize;
    resize();
    draw();
});

document.querySelectorAll('[data-pattern]').forEach(btn => {
    btn.addEventListener('click', () => {
        const pattern = patterns[btn.dataset.pattern];
        const cx = Math.floor(cols / 2) - 10;
        const cy = Math.floor(rows / 2) - 5;
        placePattern(pattern, cx, cy);
        draw();
    });
});

addEventListener('resize', () => { resize(); draw(); });

resize();
draw();
