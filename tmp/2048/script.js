const SIZE = 4;
let grid, score, best = +localStorage.getItem('2048best') || 0, history = [];

document.getElementById('best').textContent = best;

// ===== Theme Management =====
const THEMES = ['classic', 'ocean', 'dark'];

function loadTheme() {
    const savedTheme = localStorage.getItem('2048theme') || 'classic';
    setTheme(savedTheme);
}

function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'classic';
    
    if (theme === 'classic') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
    
    // Update button states
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    localStorage.setItem('2048theme', theme);
}

// Initialize theme buttons
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setTheme(btn.dataset.theme);
    });
});

// Load saved theme on startup
loadTheme();

function newGame() {
    grid = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    score = 0;
    history = [];
    addTile();
    addTile();
    render();
    document.getElementById('overlay').classList.remove('show');
}

function addTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) empty.push({ r, c });
        }
    }
    if (!empty.length) return false;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c };
}

function render(newTile = null, mergedCells = []) {
    const board = document.getElementById('board');
    board.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    board.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            const val = grid[r][c];
            if (val) {
                cell.textContent = val;
                cell.dataset.value = val;
                if (newTile && newTile.r === r && newTile.c === c) cell.classList.add('new');
                if (mergedCells.some(m => m.r === r && m.c === c)) cell.classList.add('merged');
            }
            board.appendChild(cell);
        }
    }
    document.getElementById('score').textContent = score;
    if (score > best) {
        best = score;
        localStorage.setItem('2048best', best);
        document.getElementById('best').textContent = best;
    }
}

function move(dir) {
    const prev = grid.map(r => [...r]);
    const prevScore = score;
    let moved = false;
    const merged = [];

    const rotated = (g, times) => {
        let result = g.map(r => [...r]);
        for (let t = 0; t < times; t++) {
            const newGrid = [];
            for (let c = 0; c < SIZE; c++) {
                const row = [];
                for (let r = SIZE - 1; r >= 0; r--) row.push(result[r][c]);
                newGrid.push(row);
            }
            result = newGrid;
        }
        return result;
    };

    const slideLeft = (g) => {
        const mergePos = [];
        for (let r = 0; r < SIZE; r++) {
            const row = g[r].filter(v => v);
            const newRow = [];
            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    newRow.push(row[i] * 2);
                    score += row[i] * 2;
                    mergePos.push({ r, c: newRow.length - 1 });
                    i++;
                } else {
                    newRow.push(row[i]);
                }
            }
            while (newRow.length < SIZE) newRow.push(0);
            g[r] = newRow;
        }
        return mergePos;
    };

    const rot = { up: 1, down: 3, left: 0, right: 2 };
    let g = rotated(grid, rot[dir]);
    const mergePos = slideLeft(g);
    g = rotated(g, (4 - rot[dir]) % 4);

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] !== g[r][c]) moved = true;
        }
    }

    if (moved) {
        history.push({ grid: prev, score: prevScore });
        if (history.length > 20) history.shift();
        grid = g;

        // Calculate merged positions after rotation back
        mergePos.forEach(p => {
            let pos = { r: p.r, c: p.c };
            for (let t = 0; t < (4 - rot[dir]) % 4; t++) {
                pos = { r: pos.c, c: SIZE - 1 - pos.r };
            }
            merged.push(pos);
        });

        const newTile = addTile();
        render(newTile, merged);

        if (checkWin()) showOverlay('win');
        else if (isGameOver()) showOverlay('lose');
    }
}

function undo() {
    if (!history.length) return;
    const state = history.pop();
    grid = state.grid;
    score = state.score;
    render();
    document.getElementById('overlay').classList.remove('show');
}

function checkWin() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 2048) return true;
        }
    }
    return false;
}

function isGameOver() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (grid[r][c] === 0) return false;
            if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
            if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
        }
    }
    return true;
}

function showOverlay(type) {
    const overlay = document.getElementById('overlay');
    overlay.classList.add('show');
    overlay.classList.toggle('win', type === 'win');
    document.getElementById('overlayTitle').textContent = type === 'win' ? '🎉 2048達成！' : 'ゲームオーバー';
    document.getElementById('finalScore').textContent = `スコア: ${score}`;
}

document.addEventListener('keydown', e => {
    const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (dirs[e.key]) {
        e.preventDefault();
        move(dirs[e.key]);
    }
});

let touchStartX, touchStartY;
const board = document.getElementById('board');

board.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

board.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
}, { passive: true });

newGame();
