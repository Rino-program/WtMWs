// ==========================================
// 🎨 Ultimate Algorithm Visualizer
// バージョン: 2.0
// 作成者: Rino-program
// ==========================================

'use strict';

// ==========================================
// グローバル定数
// ==========================================

const COLORS = {
    DEFAULT: '#667eea',
    COMPARING: '#fbbf24',
    SWAPPING: '#ef4444',
    SORTED: '#10b981',
    VISITING: '#8b5cf6',
    CURRENT: '#ec4899',
    PATH: '#06b6d4',
    WALL: '#1f2937',
    START: '#10b981',
    END: '#ef4444',
};

const MIN_RUN = 32; // ティムソート用の最小Run長

// ==========================================
// アプリケーション状態管理クラス
// ==========================================

class AppState {
    constructor() {
        this.mode = 'single'; // single, compare, benchmark
        this.category = 'sorting';
        this.currentAlgorithm = 'bubble';
        this.array = [];
        this.arraySize = 50;
        this.delay = 50;
        this.isRunning = false;
        this.isPaused = false;
        this.stepMode = false;
        
        // 統計情報
        this.stats = {
            comparisons: 0,
            swaps: 0,
            arrayAccesses: 0,
            startTime: 0,
            currentStep: 0
        };
        
        // 比較モード用
        this.compareAlgo1 = 'bubble';
        this.compareAlgo2 = 'quick';
        this.compareStats1 = this.createStatsObject();
        this.compareStats2 = this.createStatsObject();
        
        // 表示オプション
        this.showValues = true;
        this.showIndices = false;
        this.showCodeHighlight = true;
        this.soundEnabled = false;
        
        // グラフデータ
        this.performanceData = {
            time: [],
            comparisons: [],
            swaps: []
        };
    }
    
    createStatsObject() {
        return {
            comparisons: 0,
            swaps: 0,
            arrayAccesses: 0,
            startTime: 0,
            endTime: 0
        };
    }
    
    resetStats() {
        this.stats.comparisons = 0;
        this.stats.swaps = 0;
        this.stats.arrayAccesses = 0;
        this.stats.startTime = Date.now();
        this.stats.currentStep = 0;
    }
}

// グローバルインスタンス
const appState = new AppState();

// ==========================================
// Canvas管理クラス
// ==========================================

class CanvasManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
    }
    
    setupCanvas() {
        this.canvas.width = 1200;
        this.canvas.height = 400;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawArray(array, highlightIndices = [], colors = []) {
        this.clear();
        
        const barWidth = this.canvas.width / array.length;
        const maxHeight = Math.max(...array, 1);
        
        for (let i = 0; i < array.length; i++) {
            const barHeight = (array[i] / maxHeight) * (this.canvas.height - 60);
            const x = i * barWidth;
            const y = this.canvas.height - barHeight - 10;
            
            // 色の決定
            let color = COLORS.DEFAULT;
            const highlightIndex = highlightIndices.indexOf(i);
            if (highlightIndex !== -1) {
                color = colors[highlightIndex] || COLORS.COMPARING;
            }
            
            // バー描画
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
            
            // 枠線
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x + 2, y, barWidth - 4, barHeight);
            
            // 値の表示
            if (appState.showValues && array.length <= 30) {
                this.ctx.fillStyle = '#2d3748';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(array[i], x + barWidth / 2, y - 5);
            }
            
            // インデックスの表示
            if (appState.showIndices && array.length <= 30) {
                this.ctx.fillStyle = '#718096';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(i, x + barWidth / 2, this.canvas.height - 2);
            }
        }
    }
    
    // グラフアルゴリズム用の描画
    drawGraph(graph, visitedNodes = [], currentNode = null, path = []) {
        this.clear();
        
        const nodes = graph.nodes;
        const edges = graph.edges;
        
        // エッジの描画
        edges.forEach(edge => {
            const from = nodes[edge.from];
            const to = nodes[edge.to];
            
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            
            // パスの一部なら太く
            if (path.includes(edge.from) && path.includes(edge.to)) {
                this.ctx.strokeStyle = COLORS.PATH;
                this.ctx.lineWidth = 4;
            } else {
                this.ctx.strokeStyle = '#cbd5e0';
                this.ctx.lineWidth = 2;
            }
            
            this.ctx.stroke();
            
            // 重みの表示
            if (edge.weight !== undefined) {
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(midX - 15, midY - 10, 30, 20);
                this.ctx.fillStyle = '#2d3748';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(edge.weight, midX, midY + 5);
            }
        });
        
        // ノードの描画
        nodes.forEach((node, index) => {
            let color = COLORS.DEFAULT;
            
            if (index === currentNode) {
                color = COLORS.CURRENT;
            } else if (visitedNodes.includes(index)) {
                color = COLORS.SORTED;
            }
            
            // ノード円
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#2d3748';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // ノード番号
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(index, node.x, node.y);
        });
    }
    
    // 木構造の描画
    drawTree(root, highlightNodes = []) {
        this.clear();
        
        if (!root) return;
        
        const drawNode = (node, x, y, level, offset) => {
            if (!node) return;
            
            // 左右の子を描画
            if (node.left) {
                const childX = x - offset;
                const childY = y + 80;
                
                // 線
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + 20);
                this.ctx.lineTo(childX, childY - 20);
                this.ctx.strokeStyle = '#cbd5e0';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                drawNode(node.left, childX, childY, level + 1, offset / 2);
            }
            
            if (node.right) {
                const childX = x + offset;
                const childY = y + 80;
                
                // 線
                this.ctx.beginPath();
                this.ctx.moveTo(x, y + 20);
                this.ctx.lineTo(childX, childY - 20);
                this.ctx.strokeStyle = '#cbd5e0';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                drawNode(node.right, childX, childY, level + 1, offset / 2);
            }
            
            // ノード円
            let color = COLORS.DEFAULT;
            if (highlightNodes.includes(node.value)) {
                color = COLORS.COMPARING;
            }
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#2d3748';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 値
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(node.value, x, y);
        };
        
        drawNode(root, this.canvas.width / 2, 50, 0, 200);
    }
    
    // 動的計画法のテーブル描画
    drawDPTable(table, currentRow = -1, currentCol = -1) {
        this.clear();
        
        const rows = table.length;
        const cols = table[0].length;
        
        const cellWidth = Math.min(60, this.canvas.width / (cols + 1));
        const cellHeight = Math.min(40, this.canvas.height / (rows + 1));
        
        const startX = (this.canvas.width - cellWidth * cols) / 2;
        const startY = 50;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = startX + j * cellWidth;
                const y = startY + i * cellHeight;
                
                // セル背景
                if (i === currentRow && j === currentCol) {
                    this.ctx.fillStyle = COLORS.CURRENT;
                } else if (table[i][j] !== 0 && table[i][j] !== '') {
                    this.ctx.fillStyle = COLORS.SORTED;
                } else {
                    this.ctx.fillStyle = '#fff';
                }
                
                this.ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);
                
                // 枠線
                this.ctx.strokeStyle = '#cbd5e0';
                this.ctx.strokeRect(x, y, cellWidth - 2, cellHeight - 2);
                
                // 値
                this.ctx.fillStyle = '#2d3748';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    table[i][j].toString(),
                    x + cellWidth / 2,
                    y + cellHeight / 2
                );
            }
        }
    }
}

// ==========================================
// ユーティリティ関数
// ==========================================

// スリープ関数（一時停止対応）
function sleep(ms) {
    return new Promise(resolve => {
        const checkPause = () => {
            if (!appState.isPaused && !appState.stepMode) {
                setTimeout(resolve, ms);
            } else if (appState.stepMode) {
                // ステップモードの場合は次のステップまで待機
                const checkStep = () => {
                    if (!appState.stepMode) {
                        resolve();
                    } else {
                        setTimeout(checkStep, 100);
                    }
                };
                checkStep();
            } else {
                setTimeout(checkPause, 100);
            }
        };
        checkPause();
    });
}

// 配列のシャッフル
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 配列の生成
function generateArray(size, min = 1, max = 100) {
    const array = [];
    for (let i = 0; i < size; i++) {
        array.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return array;
}

// プリセット配列生成
function generatePresetArray(type, size) {
    let array = [];
    
    switch(type) {
        case 'sorted':
            // 昇順
            array = Array.from({length: size}, (_, i) => i + 1);
            break;
            
        case 'reversed':
            // 降順
            array = Array.from({length: size}, (_, i) => size - i);
            break;
            
        case 'nearly-sorted':
            // ほぼソート済み（10%をランダムに配置）
            array = Array.from({length: size}, (_, i) => i + 1);
            const swapCount = Math.floor(size * 0.1);
            for (let i = 0; i < swapCount; i++) {
                const idx1 = Math.floor(Math.random() * size);
                const idx2 = Math.floor(Math.random() * size);
                [array[idx1], array[idx2]] = [array[idx2], array[idx1]];
            }
            break;
            
        case 'few-unique':
            // 重複多め（5種類の値のみ）
            const values = [10, 25, 50, 75, 90];
            array = Array.from({length: size}, () => 
                values[Math.floor(Math.random() * values.length)]
            );
            break;
            
        case 'mountain':
            // 山型（中央が最大）
            const mid = Math.floor(size / 2);
            array = Array.from({length: size}, (_, i) => {
                if (i <= mid) {
                    return i + 1;
                } else {
                    return size - i;
                }
            });
            break;
            
        case 'valley':
            // 谷型（中央が最小）
            const middle = Math.floor(size / 2);
            array = Array.from({length: size}, (_, i) => {
                return Math.abs(i - middle) + 1;
            });
            break;
            
        default:
            array = generateArray(size);
    }
    
    return array;
}

// HTMLエスケープ
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// 統計更新
function updateStats(statsObj = null) {
    const stats = statsObj || appState.stats;
    const prefix = statsObj ? (statsObj === appState.compareStats1 ? 'compare-1' : 'compare-2') : 'single';
    
    const comparisonsEl = document.getElementById(`comparisons-${prefix}`);
    const swapsEl = document.getElementById(`swaps-${prefix}`);
    const accessesEl = document.getElementById(`array-accesses-${prefix}`);
    const timeEl = document.getElementById(`elapsed-time-${prefix}`);
    const stepEl = document.getElementById(`current-step-${prefix}`);
    
    if (comparisonsEl) comparisonsEl.textContent = stats.comparisons.toLocaleString();
    if (swapsEl) swapsEl.textContent = stats.swaps.toLocaleString();
    if (accessesEl) accessesEl.textContent = stats.arrayAccesses.toLocaleString();
    
    if (timeEl && stats.startTime > 0) {
        const elapsed = stats.endTime || Date.now() - stats.startTime;
        timeEl.textContent = elapsed + 'ms';
    }
    
    if (stepEl) stepEl.textContent = stats.currentStep.toLocaleString();
}

// ==========================================
// ソートアルゴリズム実装
// ==========================================

class SortingAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    // バブルソート
    async bubbleSort(array) {
        const n = array.length;
        
        for (let i = 0; i < n - 1; i++) {
            let swapped = false;
            
            for (let j = 0; j < n - i - 1; j++) {
                appState.stats.comparisons++;
                appState.stats.arrayAccesses += 2;
                appState.stats.currentStep++;
                updateStats();
                
                this.canvas.drawArray(array, [j, j + 1], [COLORS.COMPARING, COLORS.COMPARING]);
                await sleep(appState.delay);
                
                if (array[j] > array[j + 1]) {
                    [array[j], array[j + 1]] = [array[j + 1], array[j]];
                    appState.stats.swaps++;
                    appState.stats.arrayAccesses += 4;
                    swapped = true;
                    updateStats();
                    
                    this.canvas.drawArray(array, [j, j + 1], [COLORS.SWAPPING, COLORS.SWAPPING]);
                    await sleep(appState.delay);
                }
            }
            
            this.canvas.drawArray(array, [n - i - 1], [COLORS.SORTED]);
            await sleep(appState.delay / 2);
            
            if (!swapped) break;
        }
        
        return array;
    }
    
    // 選択ソート
    async selectionSort(array) {
        const n = array.length;
        
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            
            for (let j = i + 1; j < n; j++) {
                appState.stats.comparisons++;
                appState.stats.arrayAccesses += 2;
                appState.stats.currentStep++;
                updateStats();
                
                this.canvas.drawArray(array, [i, j, minIdx], 
                    [COLORS.SORTED, COLORS.COMPARING, COLORS.SWAPPING]);
                await sleep(appState.delay);
                
                if (array[j] < array[minIdx]) {
                    minIdx = j;
                }
            }
            
            if (minIdx !== i) {
                [array[i], array[minIdx]] = [array[minIdx], array[i]];
                appState.stats.swaps++;
                appState.stats.arrayAccesses += 4;
                updateStats();
                
                this.canvas.drawArray(array, [i, minIdx], [COLORS.SWAPPING, COLORS.SWAPPING]);
                await sleep(appState.delay);
            }
            
            this.canvas.drawArray(array, [i], [COLORS.SORTED]);
            await sleep(appState.delay / 2);
        }
        
        return array;
    }
    
    // 挿入ソート
    async insertionSort(array) {
        const n = array.length;
        
        for (let i = 1; i < n; i++) {
            let key = array[i];
            let j = i - 1;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            
            this.canvas.drawArray(array, [i], [COLORS.COMPARING]);
            await sleep(appState.delay);
            
            while (j >= 0 && array[j] > key) {
                appState.stats.comparisons++;
                appState.stats.arrayAccesses += 2;
                updateStats();
                
                array[j + 1] = array[j];
                appState.stats.swaps++;
                appState.stats.arrayAccesses += 2;
                
                this.canvas.drawArray(array, [j, j + 1], [COLORS.SWAPPING, COLORS.SWAPPING]);
                await sleep(appState.delay);
                
                j--;
            }
            
            if (j >= 0) {
                appState.stats.comparisons++;
            }
            
            array[j + 1] = key;
            appState.stats.arrayAccesses++;
            updateStats();
            
            this.canvas.drawArray(array, [j + 1], [COLORS.SORTED]);
            await sleep(appState.delay / 2);
        }
        
        return array;
    }
    
    // マージソート
    async mergeSort(array, left = 0, right = array.length - 1) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            
            await this.mergeSort(array, left, mid);
            await this.mergeSort(array, mid + 1, right);
            await this.merge(array, left, mid, right);
        }
        
        return array;
    }
    
    async merge(array, left, mid, right) {
        const leftArr = array.slice(left, mid + 1);
        const rightArr = array.slice(mid + 1, right + 1);
        
        let i = 0, j = 0, k = left;
        
        while (i < leftArr.length && j < rightArr.length) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses += 2;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [k, left + i, mid + 1 + j], 
                [COLORS.COMPARING, COLORS.SWAPPING, COLORS.SWAPPING]);
            await sleep(appState.delay);
            
            if (leftArr[i] <= rightArr[j]) {
                array[k] = leftArr[i];
                i++;
            } else {
                array[k] = rightArr[j];
                j++;
            }
            
            appState.stats.swaps++;
            appState.stats.arrayAccesses++;
            k++;
            updateStats();
        }
        
        while (i < leftArr.length) {
            array[k] = leftArr[i];
            this.canvas.drawArray(array, [k], [COLORS.SORTED]);
            await sleep(appState.delay / 2);
            i++;
            k++;
            appState.stats.arrayAccesses++;
        }
        
        while (j < rightArr.length) {
            array[k] = rightArr[j];
            this.canvas.drawArray(array, [k], [COLORS.SORTED]);
            await sleep(appState.delay / 2);
            j++;
            k++;
            appState.stats.arrayAccesses++;
        }
    }
    
    // クイックソート
    async quickSort(array, low = 0, high = array.length - 1) {
        if (low < high) {
            const pi = await this.partition(array, low, high);
            await this.quickSort(array, low, pi - 1);
            await this.quickSort(array, pi + 1, high);
        }
        
        return array;
    }
    
    async partition(array, low, high) {
        const pivot = array[high];
        let i = low - 1;
        appState.stats.arrayAccesses++;
        
        for (let j = low; j < high; j++) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses += 2;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [j, high, i + 1], 
                [COLORS.COMPARING, COLORS.SWAPPING, COLORS.SORTED]);
            await sleep(appState.delay);
            
            if (array[j] < pivot) {
                i++;
                [array[i], array[j]] = [array[j], array[i]];
                appState.stats.swaps++;
                appState.stats.arrayAccesses += 4;
                updateStats();
                
                this.canvas.drawArray(array, [i, j], [COLORS.SWAPPING, COLORS.SWAPPING]);
                await sleep(appState.delay);
            }
        }
        
        [array[i + 1], array[high]] = [array[high], array[i + 1]];
        appState.stats.swaps++;
        appState.stats.arrayAccesses += 4;
        updateStats();
        
        this.canvas.drawArray(array, [i + 1], [COLORS.SORTED]);
        await sleep(appState.delay);
        
        return i + 1;
    }
    
    // ヒープソート
    async heapSort(array) {
        const n = array.length;
        
        // ヒープ構築
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await this.heapify(array, n, i);
        }
        
        // ヒープから要素を取り出す
        for (let i = n - 1; i > 0; i--) {
            [array[0], array[i]] = [array[i], array[0]];
            appState.stats.swaps++;
            appState.stats.arrayAccesses += 4;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [0, i], [COLORS.SWAPPING, COLORS.SORTED]);
            await sleep(appState.delay);
            
            await this.heapify(array, i, 0);
        }
        
        return array;
    }
    
    async heapify(array, n, i) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        
        if (left < n) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses += 2;
            updateStats();
            
            if (array[left] > array[largest]) {
                largest = left;
            }
        }
        
        if (right < n) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses += 2;
            updateStats();
            
            if (array[right] > array[largest]) {
                largest = right;
            }
        }
        
        if (largest !== i) {
            [array[i], array[largest]] = [array[largest], array[i]];
            appState.stats.swaps++;
            appState.stats.arrayAccesses += 4;
            updateStats();
            
            this.canvas.drawArray(array, [i, largest], [COLORS.SWAPPING, COLORS.SWAPPING]);
            await sleep(appState.delay);
            
            await this.heapify(array, n, largest);
        }
    }
    
    // ティムソート（新実装！）
    async timSort(array) {
        const n = array.length;
        const minRun = this.calcMinRun(n);
        
        // 各Runを挿入ソートでソート
        for (let start = 0; start < n; start += minRun) {
            const end = Math.min(start + minRun - 1, n - 1);
            await this.insertionSortRange(array, start, end);
        }
        
        // Runをマージ
        let size = minRun;
        while (size < n) {
            for (let start = 0; start < n; start += size * 2) {
                const mid = start + size - 1;
                const end = Math.min(start + size * 2 - 1, n - 1);
                
                if (mid < end) {
                    await this.merge(array, start, mid, end);
                }
            }
            size *= 2;
        }
        
        return array;
    }
    
    calcMinRun(n) {
        let r = 0;
        while (n >= MIN_RUN) {
            r |= n & 1;
            n >>= 1;
        }
        return n + r;
    }
    
    async insertionSortRange(array, left, right) {
        for (let i = left + 1; i <= right; i++) {
            let key = array[i];
            let j = i - 1;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            
            this.canvas.drawArray(array, [i], [COLORS.COMPARING]);
            await sleep(appState.delay / 2);
            
            while (j >= left && array[j] > key) {
                appState.stats.comparisons++;
                appState.stats.arrayAccesses += 2;
                updateStats();
                
                array[j + 1] = array[j];
                appState.stats.swaps++;
                appState.stats.arrayAccesses += 2;
                
                j--;
            }
            
            if (j >= left) {
                appState.stats.comparisons++;
            }
            
            array[j + 1] = key;
            appState.stats.arrayAccesses++;
            updateStats();
        }
    }
}

// ==========================================
// 探索アルゴリズム実装
// ==========================================

class SearchingAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    // 線形探索
    async linearSearch(array, target) {
        for (let i = 0; i < array.length; i++) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [i], [COLORS.COMPARING]);
            await sleep(appState.delay);
            
            if (array[i] === target) {
                this.canvas.drawArray(array, [i], [COLORS.SORTED]);
                await sleep(appState.delay * 3);
                return i;
            }
            
            this.canvas.drawArray(array, [i], [COLORS.SWAPPING]);
            await sleep(appState.delay / 2);
        }
        
        return -1;
    }
    
    // 二分探索
    async binarySearch(array, target) {
        let left = 0;
        let right = array.length - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            
            appState.stats.comparisons++;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [left, mid, right], 
                [COLORS.COMPARING, COLORS.SWAPPING, COLORS.COMPARING]);
            await sleep(appState.delay * 2);
            
            if (array[mid] === target) {
                this.canvas.drawArray(array, [mid], [COLORS.SORTED]);
                await sleep(appState.delay * 3);
                return mid;
            }
            
            if (array[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return -1;
    }
    
    // ジャンプ探索
    async jumpSearch(array, target) {
        const n = array.length;
        const jumpSize = Math.floor(Math.sqrt(n));
        
        let prev = 0;
        let curr = 0;
        
        // ジャンプして範囲を見つける
        while (curr < n && array[curr] < target) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [curr], [COLORS.COMPARING]);
            await sleep(appState.delay * 2);
            
            prev = curr;
            curr = Math.min(curr + jumpSize, n);
        }
        
        // 範囲内で線形探索
        for (let i = prev; i < Math.min(curr, n); i++) {
            appState.stats.comparisons++;
            appState.stats.arrayAccesses++;
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawArray(array, [i], [COLORS.SWAPPING]);
            await sleep(appState.delay);
            
            if (array[i] === target) {
                this.canvas.drawArray(array, [i], [COLORS.SORTED]);
                await sleep(appState.delay * 3);
                return i;
            }
        }
        
        return -1;
    }
}

// ==========================================
// グラフアルゴリズム実装
// ==========================================

class GraphAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    // グラフ生成（ランダム）
    generateRandomGraph(nodeCount = 8) {
        const nodes = [];
        const edges = [];
        
        // ノード配置（円形）
        const centerX = this.canvas.canvas.width / 2;
        const centerY = this.canvas.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;
        
        for (let i = 0; i < nodeCount; i++) {
            const angle = (i / nodeCount) * Math.PI * 2;
            nodes.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
        
        // エッジ生成（各ノードから2-3本）
        for (let i = 0; i < nodeCount; i++) {
            const edgeCount = 2 + Math.floor(Math.random() * 2);
            const connected = new Set();
            
            for (let j = 0; j < edgeCount; j++) {
                let to = Math.floor(Math.random() * nodeCount);
                while (to === i || connected.has(to)) {
                    to = Math.floor(Math.random() * nodeCount);
                }
                connected.add(to);
                
                edges.push({
                    from: i,
                    to: to,
                    weight: Math.floor(Math.random() * 20) + 1
                });
            }
        }
        
        return { nodes, edges };
    }
    
    // BFS（幅優先探索）
    async bfs(graph, startNode = 0) {
        const visited = new Set();
        const queue = [startNode];
        visited.add(startNode);
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawGraph(graph, Array.from(visited), current);
            await sleep(appState.delay * 3);
            
            // 隣接ノードを探索
            for (const edge of graph.edges) {
                if (edge.from === current && !visited.has(edge.to)) {
                    visited.add(edge.to);
                    queue.push(edge.to);
                    
                    appState.stats.comparisons++;
                    updateStats();
                }
            }
        }
        
        this.canvas.drawGraph(graph, Array.from(visited));
        return Array.from(visited);
    }
    
    // DFS（深さ優先探索）
    async dfs(graph, startNode = 0) {
        const visited = new Set();
        
        const dfsVisit = async (node) => {
            visited.add(node);
            
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawGraph(graph, Array.from(visited), node);
            await sleep(appState.delay * 3);
            
            for (const edge of graph.edges) {
                if (edge.from === node && !visited.has(edge.to)) {
                    appState.stats.comparisons++;
                    updateStats();
                    
                    await dfsVisit(edge.to);
                }
            }
        };
        
        await dfsVisit(startNode);
        
        this.canvas.drawGraph(graph, Array.from(visited));
        return Array.from(visited);
    }
    
    // ダイクストラ法
    async dijkstra(graph, startNode = 0) {
        const n = graph.nodes.length;
        const distances = Array(n).fill(Infinity);
        const visited = new Set();
        const previous = Array(n).fill(null);
        
        distances[startNode] = 0;
        
        for (let i = 0; i < n; i++) {
            // 最小距離のノードを見つける
            let minDist = Infinity;
            let minNode = -1;
            
            for (let j = 0; j < n; j++) {
                if (!visited.has(j) && distances[j] < minDist) {
                    minDist = distances[j];
                    minNode = j;
                }
            }
            
            if (minNode === -1) break;
            
            visited.add(minNode);
            
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawGraph(graph, Array.from(visited), minNode);
            await sleep(appState.delay * 3);
            
            // 隣接ノードの距離を更新
            for (const edge of graph.edges) {
                if (edge.from === minNode) {
                    const newDist = distances[minNode] + edge.weight;
                    
                    appState.stats.comparisons++;
                    updateStats();
                    
                    if (newDist < distances[edge.to]) {
                        distances[edge.to] = newDist;
                        previous[edge.to] = minNode;
                    }
                }
            }
        }
        
        return { distances, previous };
    }
    
    // A*アルゴリズム（簡易版・グリッドベース）
    async astar(graph, startNode = 0, endNode = null) {
        if (endNode === null) {
            endNode = graph.nodes.length - 1;
        }
        
        // ヒューリスティック関数（ユークリッド距離）
        const heuristic = (a, b) => {
            const dx = graph.nodes[a].x - graph.nodes[b].x;
            const dy = graph.nodes[a].y - graph.nodes[b].y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        
        const openSet = new Set([startNode]);
        const closedSet = new Set();
        const gScore = Array(graph.nodes.length).fill(Infinity);
        const fScore = Array(graph.nodes.length).fill(Infinity);
        const cameFrom = Array(graph.nodes.length).fill(null);
        
        gScore[startNode] = 0;
        fScore[startNode] = heuristic(startNode, endNode);
        
        while (openSet.size > 0) {
            // 最小fScoreのノードを見つける
            let current = -1;
            let minF = Infinity;
            
            for (const node of openSet) {
                if (fScore[node] < minF) {
                    minF = fScore[node];
                    current = node;
                }
            }
            
            if (current === endNode) {
                // ゴール到達
                const path = [];
                let temp = current;
                while (temp !== null) {
                    path.unshift(temp);
                    temp = cameFrom[temp];
                }
                
                this.canvas.drawGraph(graph, Array.from(closedSet), current, path);
                return path;
            }
            
            openSet.delete(current);
            closedSet.add(current);
            
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawGraph(graph, Array.from(closedSet), current);
            await sleep(appState.delay * 3);
            
            // 隣接ノードを探索
            for (const edge of graph.edges) {
                if (edge.from === current) {
                    const neighbor = edge.to;
                    
                    if (closedSet.has(neighbor)) continue;
                    
                    const tentativeGScore = gScore[current] + edge.weight;
                    
                    appState.stats.comparisons++;
                    updateStats();
                    
                    if (tentativeGScore < gScore[neighbor]) {
                        cameFrom[neighbor] = current;
                        gScore[neighbor] = tentativeGScore;
                        fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, endNode);
                        
                        if (!openSet.has(neighbor)) {
                            openSet.add(neighbor);
                        }
                    }
                }
            }
        }
        
        return []; // パスが見つからない
    }
}

// ==========================================
// 木構造アルゴリズム実装
// ==========================================

class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
    }
}

class TreeAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
        this.root = null;
    }
    
    // BST挿入
    async insert(value) {
        this.root = await this.insertNode(this.root, value);
    }
    
    async insertNode(node, value) {
        if (node === null) {
            appState.stats.currentStep++;
            updateStats();
            
            const newNode = new TreeNode(value);
            this.canvas.drawTree(this.root, [value]);
            await sleep(appState.delay * 2);
            
            return newNode;
        }
        
        appState.stats.comparisons++;
        appState.stats.currentStep++;
        updateStats();
        
        this.canvas.drawTree(this.root, [node.value]);
        await sleep(appState.delay * 2);
        
        if (value < node.value) {
            node.left = await this.insertNode(node.left, value);
        } else if (value > node.value) {
            node.right = await this.insertNode(node.right, value);
        }
        
        return node;
    }
    
    // BST探索
    async search(value) {
        return await this.searchNode(this.root, value);
    }
    
    async searchNode(node, value) {
        if (node === null) {
            return false;
        }
        
        appState.stats.comparisons++;
        appState.stats.currentStep++;
        updateStats();
        
        this.canvas.drawTree(this.root, [node.value]);
        await sleep(appState.delay * 2);
        
        if (value === node.value) {
            this.canvas.drawTree(this.root, [node.value]);
            await sleep(appState.delay * 3);
            return true;
        }
        
        if (value < node.value) {
            return await this.searchNode(node.left, value);
        } else {
            return await this.searchNode(node.right, value);
        }
    }
    
    // BST削除
    async delete(value) {
        this.root = await this.deleteNode(this.root, value);
    }
    
    async deleteNode(node, value) {
        if (node === null) {
            return null;
        }
        
        appState.stats.comparisons++;
        appState.stats.currentStep++;
        updateStats();
        
        this.canvas.drawTree(this.root, [node.value]);
        await sleep(appState.delay * 2);
        
        if (value < node.value) {
            node.left = await this.deleteNode(node.left, value);
        } else if (value > node.value) {
            node.right = await this.deleteNode(node.right, value);
        } else {
            // ノード削除
            if (node.left === null) {
                return node.right;
            } else if (node.right === null) {
                return node.left;
            }
            
            // 2つの子を持つ場合
            node.value = await this.minValue(node.right);
            node.right = await this.deleteNode(node.right, node.value);
        }
        
        return node;
    }
    
    async minValue(node) {
        let current = node;
        while (current.left !== null) {
            current = current.left;
            
            appState.stats.currentStep++;
            updateStats();
            
            this.canvas.drawTree(this.root, [current.value]);
            await sleep(appState.delay);
        }
        return current.value;
    }
}

// ==========================================
// 再帰アルゴリズム実装
// ==========================================

class RecursiveAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    // フィボナッチ数列
    async fibonacci(n) {
        const memo = {};
        
        const fib = async (num, depth = 0) => {
            if (num in memo) return memo[num];
            
            appState.stats.currentStep++;
            updateStats();
            
            // 視覚化（簡易版）
            this.canvas.clear();
            this.canvas.ctx.fillStyle = '#2d3748';
            this.canvas.ctx.font = 'bold 24px Arial';
            this.canvas.ctx.textAlign = 'center';
            this.canvas.ctx.fillText(
                `計算中: fib(${num}) - 深さ: ${depth}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2
            );
            
            await sleep(appState.delay);
            
            if (num <= 1) {
                memo[num] = num;
                return num;
            }
            
            appState.stats.comparisons++;
            updateStats();
            
            const result = await fib(num - 1, depth + 1) + await fib(num - 2, depth + 1);
            memo[num] = result;
            return result;
        };
        
        const result = await fib(n);
        
        // 結果表示
        this.canvas.clear();
        this.canvas.ctx.fillStyle = '#10b981';
        this.canvas.ctx.font = 'bold 32px Arial';
        this.canvas.ctx.textAlign = 'center';
        this.canvas.ctx.fillText(
            `フィボナッチ(${n}) = ${result}`,
            this.canvas.canvas.width / 2,
            this.canvas.canvas.height / 2
        );
        
        return result;
    }
    
    // ハノイの塔
    async hanoi(n, from = 'A', to = 'C', aux = 'B') {
        const moves = [];
        
        const move = async (disk, source, destination, auxiliary, depth = 0) => {
            if (disk === 1) {
                moves.push([source, destination]);
                
                appState.stats.currentStep++;
                updateStats();
                
                // 視覚化
                this.canvas.clear();
                this.canvas.ctx.fillStyle = '#2d3748';
                this.canvas.ctx.font = 'bold 20px Arial';
                this.canvas.ctx.textAlign = 'center';
                this.canvas.ctx.fillText(
                    `円盤を移動: ${source} → ${destination}`,
                    this.canvas.canvas.width / 2,
                    this.canvas.canvas.height / 2 - 50
                );
                this.canvas.ctx.font = '16px Arial';
                this.canvas.ctx.fillText(
                    `移動回数: ${moves.length}`,
                    this.canvas.canvas.width / 2,
                    this.canvas.canvas.height / 2 + 50
                );
                
                await sleep(appState.delay * 2);
                return;
            }
            
            appState.stats.comparisons++;
            updateStats();
            
            await move(disk - 1, source, auxiliary, destination, depth + 1);
            moves.push([source, destination]);
            
            appState.stats.currentStep++;
            updateStats();
            
            // 視覚化
            this.canvas.clear();
            this.canvas.ctx.fillStyle = '#667eea';
            this.canvas.ctx.font = 'bold 20px Arial';
            this.canvas.ctx.textAlign = 'center';
            this.canvas.ctx.fillText(
                `円盤${disk}を移動: ${source} → ${destination}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2 - 50
            );
            this.canvas.ctx.font = '16px Arial';
            this.canvas.ctx.fillText(
                `移動回数: ${moves.length} / 理論値: ${Math.pow(2, n) - 1}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2 + 50
            );
            
            await sleep(appState.delay * 2);
            
            await move(disk - 1, auxiliary, destination, source, depth + 1);
        };
        
        await move(n, from, to, aux);
        
        // 完了表示
        this.canvas.clear();
        this.canvas.ctx.fillStyle = '#10b981';
        this.canvas.ctx.font = 'bold 28px Arial';
        this.canvas.ctx.textAlign = 'center';
        this.canvas.ctx.fillText(
            `完了！ ${n}枚の円盤を${moves.length}回で移動`,
            this.canvas.canvas.width / 2,
            this.canvas.canvas.height / 2
        );
        
        return moves;
    }
    
    // 階乗計算
    async factorial(n) {
        const fact = async (num, depth = 0) => {
            appState.stats.currentStep++;
            updateStats();
            
            // 視覚化
            this.canvas.clear();
            this.canvas.ctx.fillStyle = '#2d3748';
            this.canvas.ctx.font = 'bold 24px Arial';
            this.canvas.ctx.textAlign = 'center';
            this.canvas.ctx.fillText(
                `計算中: ${num}! - 深さ: ${depth}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2
            );
            
            await sleep(appState.delay);
            
            if (num <= 1) {
                return 1;
            }
            
            appState.stats.comparisons++;
            updateStats();
            
            return num * await fact(num - 1, depth + 1);
        };
        
        const result = await fact(n);
        
        // 結果表示
        this.canvas.clear();
        this.canvas.ctx.fillStyle = '#10b981';
        this.canvas.ctx.font = 'bold 32px Arial';
        this.canvas.ctx.textAlign = 'center';
        this.canvas.ctx.fillText(
            `${n}! = ${result.toLocaleString()}`,
            this.canvas.canvas.width / 2,
            this.canvas.canvas.height / 2
        );
        
        return result;
    }
}

// ==========================================
// 動的計画法アルゴリズム実装
// ==========================================

class DynamicProgramming {
    constructor(canvas) {
        this.canvas = canvas;
    }
    
    // 0-1ナップサック問題
    async knapsack(weights, values, capacity) {
        const n = weights.length;
        const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
        
        for (let i = 1; i <= n; i++) {
            for (let w = 1; w <= capacity; w++) {
                appState.stats.currentStep++;
                appState.stats.comparisons++;
                updateStats();
                
                this.canvas.drawDPTable(dp, i, w);
                await sleep(appState.delay);
                
                if (weights[i - 1] <= w) {
                    dp[i][w] = Math.max(
                        values[i - 1] + dp[i - 1][w - weights[i - 1]],
                        dp[i - 1][w]
                    );
                } else {
                    dp[i][w] = dp[i - 1][w];
                }
                
                appState.stats.arrayAccesses += 2;
                updateStats();
            }
        }
        
        return dp[n][capacity];
    }
    
    // 最長共通部分列（LCS）
    async lcs(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                appState.stats.currentStep++;
                appState.stats.comparisons++;
                updateStats();
                
                this.canvas.drawDPTable(dp, i, j);
                await sleep(appState.delay);
                
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
                
                appState.stats.arrayAccesses += 2;
                updateStats();
            }
        }
        
        // LCSの復元
        const lcsStr = [];
        let i = m, j = n;
        
        while (i > 0 && j > 0) {
            if (str1[i - 1] === str2[j - 1]) {
                lcsStr.unshift(str1[i - 1]);
                i--;
                j--;
            } else if (dp[i - 1][j] > dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        
        return { length: dp[m][n], str: lcsStr.join('') };
    }
}

// ==========================================
// 文字列アルゴリズム実装
// ==========================================

class StringAlgorithms {
    constructor(canvas) {
        this.canvas = canvas;
    }
        // KMP法（Knuth-Morris-Pratt）- 続き
    async kmp(text, pattern) {
        const lps = await this.computeLPSArray(pattern);
        const matches = [];
        
        let i = 0; // textのインデックス
        let j = 0; // patternのインデックス
        
        while (i < text.length) {
            appState.stats.currentStep++;
            appState.stats.comparisons++;
            updateStats();
            
            // 視覚化
            this.canvas.clear();
            this.canvas.ctx.fillStyle = '#2d3748';
            this.canvas.ctx.font = 'bold 20px monospace';
            this.canvas.ctx.textAlign = 'left';
            
            // テキスト表示
            this.canvas.ctx.fillText(
                'Text:    ' + text,
                50,
                this.canvas.canvas.height / 2 - 50
            );
            
            // パターン表示（位置を調整）
            this.canvas.ctx.fillStyle = '#667eea';
            this.canvas.ctx.fillText(
                'Pattern: ' + ' '.repeat(i - j) + pattern,
                50,
                this.canvas.canvas.height / 2
            );
            
            // マッチ部分をハイライト
            if (j > 0) {
                this.canvas.ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
                this.canvas.ctx.fillRect(
                    50 + (i - j) * 12 + 108,
                    this.canvas.canvas.height / 2 - 30,
                    j * 12,
                    30
                );
            }
            
            // 現在比較中の文字をハイライト
            this.canvas.ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
            this.canvas.ctx.fillRect(
                50 + i * 12 + 108,
                this.canvas.canvas.height / 2 - 80,
                12,
                30
            );
            
            await sleep(appState.delay * 2);
            
            if (text[i] === pattern[j]) {
                i++;
                j++;
            }
            
            if (j === pattern.length) {
                // パターンが見つかった
                matches.push(i - j);
                
                this.canvas.ctx.fillStyle = '#10b981';
                this.canvas.ctx.font = 'bold 18px Arial';
                this.canvas.ctx.fillText(
                    `✓ マッチ発見！位置: ${i - j}`,
                    50,
                    this.canvas.canvas.height / 2 + 80
                );
                
                await sleep(appState.delay * 5);
                
                j = lps[j - 1];
            } else if (i < text.length && text[i] !== pattern[j]) {
                if (j !== 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }
        
        // 結果表示
        this.canvas.clear();
        this.canvas.ctx.fillStyle = '#10b981';
        this.canvas.ctx.font = 'bold 24px Arial';
        this.canvas.ctx.textAlign = 'center';
        this.canvas.ctx.fillText(
            `KMP法完了: ${matches.length}個のマッチが見つかりました`,
            this.canvas.canvas.width / 2,
            this.canvas.canvas.height / 2
        );
        
        if (matches.length > 0) {
            this.canvas.ctx.font = '18px Arial';
            this.canvas.ctx.fillText(
                `位置: ${matches.join(', ')}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2 + 40
            );
        }
        
        return matches;
    }
    
    // LPS配列の計算（KMP用）
    async computeLPSArray(pattern) {
        const lps = Array(pattern.length).fill(0);
        let len = 0;
        let i = 1;
        
        while (i < pattern.length) {
            if (pattern[i] === pattern[len]) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len !== 0) {
                    len = lps[len - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        
        return lps;
    }
    
    // Boyer-Moore法
    async boyerMoore(text, pattern) {
        const badChar = this.buildBadCharTable(pattern);
        const matches = [];
        
        let s = 0; // textにおけるシフト
        
        while (s <= text.length - pattern.length) {
            let j = pattern.length - 1;
            
            appState.stats.currentStep++;
            updateStats();
            
            // 視覚化
            this.canvas.clear();
            this.canvas.ctx.fillStyle = '#2d3748';
            this.canvas.ctx.font = 'bold 20px monospace';
            this.canvas.ctx.textAlign = 'left';
            
            // テキスト表示
            this.canvas.ctx.fillText(
                'Text:    ' + text,
                50,
                this.canvas.canvas.height / 2 - 50
            );
            
            // パターン表示
            this.canvas.ctx.fillStyle = '#667eea';
            this.canvas.ctx.fillText(
                'Pattern: ' + ' '.repeat(s) + pattern,
                50,
                this.canvas.canvas.height / 2
            );
            
            await sleep(appState.delay * 2);
            
            // 後ろから前に比較
            while (j >= 0 && pattern[j] === text[s + j]) {
                appState.stats.comparisons++;
                updateStats();
                
                // マッチ部分をハイライト
                this.canvas.ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
                this.canvas.ctx.fillRect(
                    50 + (s + j) * 12 + 108,
                    this.canvas.canvas.height / 2 - 30,
                    12,
                    30
                );
                
                await sleep(appState.delay);
                j--;
            }
            
            if (j < 0) {
                // パターンが見つかった
                matches.push(s);
                
                this.canvas.ctx.fillStyle = '#10b981';
                this.canvas.ctx.font = 'bold 18px Arial';
                this.canvas.ctx.textAlign = 'left';
                this.canvas.ctx.fillText(
                    `✓ マッチ発見！位置: ${s}`,
                    50,
                    this.canvas.canvas.height / 2 + 80
                );
                
                await sleep(appState.delay * 5);
                
                s += (s + pattern.length < text.length) ? 
                     pattern.length - badChar[text[s + pattern.length]] : 1;
            } else {
                appState.stats.comparisons++;
                updateStats();
                
                // ミスマッチした文字をハイライト
                this.canvas.ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
                this.canvas.ctx.fillRect(
                    50 + (s + j) * 12 + 108,
                    this.canvas.canvas.height / 2 - 30,
                    12,
                    30
                );
                
                await sleep(appState.delay * 2);
                
                s += Math.max(1, j - badChar[text[s + j]]);
            }
        }
        
        // 結果表示
        this.canvas.clear();
        this.canvas.ctx.fillStyle = '#10b981';
        this.canvas.ctx.font = 'bold 24px Arial';
        this.canvas.ctx.textAlign = 'center';
        this.canvas.ctx.fillText(
            `Boyer-Moore法完了: ${matches.length}個のマッチが見つかりました`,
            this.canvas.canvas.width / 2,
            this.canvas.canvas.height / 2
        );
        
        if (matches.length > 0) {
            this.canvas.ctx.font = '18px Arial';
            this.canvas.ctx.fillText(
                `位置: ${matches.join(', ')}`,
                this.canvas.canvas.width / 2,
                this.canvas.canvas.height / 2 + 40
            );
        }
        
        return matches;
    }
    
    // Bad Character テーブルの構築
    buildBadCharTable(pattern) {
        const table = {};
        
        // すべての文字に-1を設定
        for (let i = 0; i < 256; i++) {
            table[String.fromCharCode(i)] = -1;
        }
        
        // パターン内の文字の最後の出現位置を記録
        for (let i = 0; i < pattern.length; i++) {
            table[pattern[i]] = i;
        }
        
        return table;
    }
}

// ==========================================
// アルゴリズム実行マネージャー
// ==========================================

class AlgorithmRunner {
    constructor() {
        this.canvasSingle = new CanvasManager('canvas-single');
        this.sortingAlgo = new SortingAlgorithms(this.canvasSingle);
        this.searchingAlgo = new SearchingAlgorithms(this.canvasSingle);
        this.graphAlgo = new GraphAlgorithms(this.canvasSingle);
        this.treeAlgo = new TreeAlgorithms(this.canvasSingle);
        this.recursiveAlgo = new RecursiveAlgorithms(this.canvasSingle);
        this.dpAlgo = new DynamicProgramming(this.canvasSingle);
        this.stringAlgo = new StringAlgorithms(this.canvasSingle);
    }
    
    async run(algorithm, array) {
        appState.resetStats();
        
        try {
            switch(algorithm) {
                // ソートアルゴリズム
                case 'bubble':
                    await this.sortingAlgo.bubbleSort([...array]);
                    break;
                case 'selection':
                    await this.sortingAlgo.selectionSort([...array]);
                    break;
                case 'insertion':
                    await this.sortingAlgo.insertionSort([...array]);
                    break;
                case 'merge':
                    await this.sortingAlgo.mergeSort([...array]);
                    break;
                case 'quick':
                    await this.sortingAlgo.quickSort([...array]);
                    break;
                case 'heap':
                    await this.sortingAlgo.heapSort([...array]);
                    break;
                case 'tim':
                    await this.sortingAlgo.timSort([...array]);
                    break;
                
                // 探索アルゴリズム
                case 'linear':
                    const linearTarget = array[Math.floor(Math.random() * array.length)];
                    alert(`🔍 探索する値: ${linearTarget}\n\n配列の先頭から順番に探します！`);
                    const linearResult = await this.searchingAlgo.linearSearch([...array], linearTarget);
                    if (linearResult !== -1) {
                        alert(`✅ 見つかりました！\n\n値 ${linearTarget} がインデックス ${linearResult} にありました！\n比較回数: ${appState.stats.comparisons}回`);
                    } else {
                        alert('❌ 値が見つかりませんでした');
                    }
                    break;
                    
                case 'binary':
                    const sortedArray = [...array].sort((a, b) => a - b);
                    this.canvasSingle.drawArray(sortedArray);
                    await sleep(500);
                    const binaryTarget = sortedArray[Math.floor(Math.random() * sortedArray.length)];
                    alert(`🔍 探索する値: ${binaryTarget}\n\n配列を半分ずつに分けて探します！\n（配列は自動的にソートされました）`);
                    const binaryResult = await this.searchingAlgo.binarySearch(sortedArray, binaryTarget);
                    if (binaryResult !== -1) {
                        alert(`✅ 見つかりました！\n\n値 ${binaryTarget} がインデックス ${binaryResult} にありました！\n比較回数: ${appState.stats.comparisons}回\n\n線形探索より効率的ですね！`);
                    } else {
                        alert('❌ 値が見つかりませんでした');
                    }
                    break;
                    
                case 'jump':
                    const jumpSortedArray = [...array].sort((a, b) => a - b);
                    this.canvasSingle.drawArray(jumpSortedArray);
                    await sleep(500);
                    const jumpSize = Math.floor(Math.sqrt(jumpSortedArray.length));
                    const jumpTarget = jumpSortedArray[Math.floor(Math.random() * jumpSortedArray.length)];
                    alert(`🔍 探索する値: ${jumpTarget}\n\nジャンプサイズ √${jumpSortedArray.length} = ${jumpSize} でジャンプしながら探します！`);
                    const jumpResult = await this.searchingAlgo.jumpSearch(jumpSortedArray, jumpTarget);
                    if (jumpResult !== -1) {
                        alert(`✅ 見つかりました！\n\n値 ${jumpTarget} がインデックス ${jumpResult} にありました！\n比較回数: ${appState.stats.comparisons}回`);
                    } else {
                        alert('❌ 値が見つかりませんでした');
                    }
                    break;
                
                // グラフアルゴリズム
                case 'bfs':
                    const bfsGraph = this.graphAlgo.generateRandomGraph(8);
                    alert('🕸️ 幅優先探索（BFS）を開始します！\n\n波紋のように広がる探索を観察してください。');
                    await this.graphAlgo.bfs(bfsGraph, 0);
                    alert('✅ BFS完了！\nすべてのノードを幅優先で訪問しました。');
                    break;
                    
                case 'dfs':
                    const dfsGraph = this.graphAlgo.generateRandomGraph(8);
                    alert('🕸️ 深さ優先探索（DFS）を開始します！\n\n深く潜っていく探索を観察してください。');
                    await this.graphAlgo.dfs(dfsGraph, 0);
                    alert('✅ DFS完了！\nすべてのノードを深さ優先で訪問しました。');
                    break;
                    
                case 'dijkstra':
                    const dijkstraGraph = this.graphAlgo.generateRandomGraph(8);
                    alert('🕸️ ダイクストラ法を開始します！\n\n最短距離が更新される様子を観察してください。');
                    const dijkstraResult = await this.graphAlgo.dijkstra(dijkstraGraph, 0);
                    alert(`✅ ダイクストラ法完了！\n\n開始ノード(0)からの最短距離:\n${dijkstraResult.distances.map((d, i) => `ノード${i}: ${d === Infinity ? '到達不可' : d}`).join('\n')}`);
                    break;
                    
                case 'astar':
                    const astarGraph = this.graphAlgo.generateRandomGraph(8);
                    alert('🕸️ A*アルゴリズムを開始します！\n\nヒューリスティック関数を使った効率的な探索を観察してください。');
                    const astarPath = await this.graphAlgo.astar(astarGraph, 0, 7);
                    if (astarPath.length > 0) {
                        alert(`✅ A*完了！\n\n最短経路: ${astarPath.join(' → ')}\n経路長: ${astarPath.length - 1}`);
                    } else {
                        alert('❌ 経路が見つかりませんでした');
                    }
                    break;
                
                // 木構造アルゴリズム
                case 'bst-insert':
                    alert('🌳 二分探索木への挿入を開始します！\n\n複数の値を順番に挿入していきます。');
                    const insertValues = array.slice(0, Math.min(10, array.length));
                    for (const value of insertValues) {
                        await this.treeAlgo.insert(value);
                    }
                    alert('✅ 挿入完了！\n二分探索木が構築されました。');
                    break;
                    
                case 'bst-search':
                    alert('🌳 二分探索木の探索を開始します！\n\nまず木を構築してから探索します。');
                    const searchValues = array.slice(0, Math.min(10, array.length));
                    this.treeAlgo.root = null;
                    for (const value of searchValues) {
                        await this.treeAlgo.insert(value);
                    }
                    const searchTarget = searchValues[Math.floor(Math.random() * searchValues.length)];
                    alert(`探索する値: ${searchTarget}`);
                    const searchResult = await this.treeAlgo.search(searchTarget);
                    alert(searchResult ? `✅ 値 ${searchTarget} が見つかりました！` : '❌ 値が見つかりませんでした');
                    break;
                    
                case 'bst-delete':
                    alert('🌳 二分探索木からの削除を開始します！\n\nまず木を構築してから削除します。');
                    const deleteValues = array.slice(0, Math.min(10, array.length));
                    this.treeAlgo.root = null;
                    for (const value of deleteValues) {
                        await this.treeAlgo.insert(value);
                    }
                    const deleteTarget = deleteValues[Math.floor(Math.random() * deleteValues.length)];
                    alert(`削除する値: ${deleteTarget}`);
                    await this.treeAlgo.delete(deleteTarget);
                    alert(`✅ 値 ${deleteTarget} を削除しました！`);
                    break;
                
                // 再帰アルゴリズム
                case 'fibonacci':
                    const fibN = Math.min(15, Math.max(5, Math.floor(array.length / 5)));
                    alert(`🔄 フィボナッチ数列の計算を開始します！\n\nfib(${fibN})を計算します（メモ化あり）。`);
                    const fibResult = await this.recursiveAlgo.fibonacci(fibN);
                    alert(`✅ 計算完了！\n\nfib(${fibN}) = ${fibResult.toLocaleString()}`);
                    break;
                    
                case 'hanoi':
                    const hanoiN = Math.min(5, Math.max(3, Math.floor(array.length / 15)));
                    alert(`🔄 ハノイの塔を開始します！\n\n${hanoiN}枚の円盤を移動します。\n理論上の最小移動回数: ${Math.pow(2, hanoiN) - 1}回`);
                    const hanoiMoves = await this.recursiveAlgo.hanoi(hanoiN);
                    alert(`✅ 完了！\n\n${hanoiN}枚の円盤を${hanoiMoves.length}回で移動しました。`);
                    break;
                    
                case 'factorial':
                    const factN = Math.min(20, Math.max(5, Math.floor(array.length / 5)));
                    alert(`🔄 階乗の計算を開始します！\n\n${factN}!を計算します。`);
                    const factResult = await this.recursiveAlgo.factorial(factN);
                    alert(`✅ 計算完了！\n\n${factN}! = ${factResult.toLocaleString()}`);
                    break;
                
                // 動的計画法
                case 'knapsack':
                    alert('💎 0-1ナップサック問題を解きます！\n\nランダムな重さと価値のアイテムから最適な組み合わせを見つけます。');
                    const weights = array.slice(0, Math.min(10, array.length)).map(v => Math.max(1, Math.floor(v / 10)));
                    const values = array.slice(0, weights.length).map(v => Math.floor(v / 5));
                    const capacity = Math.floor(weights.reduce((a, b) => a + b, 0) / 2);
                    const knapsackResult = await this.dpAlgo.knapsack(weights, values, capacity);
                    alert(`✅ ナップサック問題完了！\n\n容量: ${capacity}\n最大価値: ${knapsackResult}\n\nアイテム:\n${weights.map((w, i) => `重さ${w}, 価値${values[i]}`).join('\n')}`);
                    break;
                    
                case 'lcs':
                    alert('💎 最長共通部分列（LCS）を求めます！\n\n2つの文字列の最長共通部分列を見つけます。');
                    const str1 = 'ABCDEFGH'.slice(0, Math.min(8, Math.max(4, array.length / 10)));
                    const str2 = 'ACDFG'.slice(0, Math.min(6, Math.max(3, array.length / 12)));
                    const lcsResult = await this.dpAlgo.lcs(str1, str2);
                    alert(`✅ LCS完了！\n\n文字列1: ${str1}\n文字列2: ${str2}\n\n最長共通部分列: ${lcsResult.str}\n長さ: ${lcsResult.length}`);
                    break;
                
                // 文字列アルゴリズム
                case 'kmp':
                    alert('📝 KMP法（Knuth-Morris-Pratt）を開始します！\n\n効率的なパターンマッチングを観察してください。');
                    const kmpText = 'ABABDABACDABABCABAB';
                    const kmpPattern = 'ABABCABAB';
                    const kmpMatches = await this.stringAlgo.kmp(kmpText, kmpPattern);
                    alert(`✅ KMP法完了！\n\nテキスト: ${kmpText}\nパターン: ${kmpPattern}\n\n${kmpMatches.length}個のマッチが見つかりました${kmpMatches.length > 0 ? '\n位置: ' + kmpMatches.join(', ') : ''}`);
                    break;
                    
                case 'boyer-moore':
                    alert('📝 Boyer-Moore法を開始します！\n\n後ろから比較する効率的なアルゴリズムを観察してください。');
                    const bmText = 'ABAAABCDABAAABCDABAAABCD';
                    const bmPattern = 'ABAAABCD';
                    const bmMatches = await this.stringAlgo.boyerMoore(bmText, bmPattern);
                    alert(`✅ Boyer-Moore法完了！\n\nテキスト: ${bmText}\nパターン: ${bmPattern}\n\n${bmMatches.length}個のマッチが見つかりました${bmMatches.length > 0 ? '\n位置: ' + bmMatches.join(', ') : ''}`);
                    break;
                
                default:
                    alert('このアルゴリズムは現在準備中です！🚧');
            }
            
            // 完了アニメーション
            if (appState.category === 'sorting') {
                await this.animateCompletion();
            }
            
        } catch (error) {
            console.error('エラーが発生しました:', error);
            alert(`❌ エラーが発生しました: ${error.message}`);
        }
        
        appState.stats.endTime = Date.now();
        updateStats();
    }
    
    async animateCompletion() {
        const array = appState.array;
        for (let i = 0; i < array.length; i++) {
            this.canvasSingle.drawArray(array, [i], [COLORS.SORTED]);
            await sleep(10);
        }
        await sleep(500);
    }
}

// ==========================================
// UI イベントハンドラー
// ==========================================

class UIController {
    constructor() {
        this.runner = new AlgorithmRunner();
        this.setupEventListeners();
        this.init();
    }
    
    init() {
        // ローディング画面を非表示
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 1000);
        
        // 初期配列生成
        appState.array = generateArray(appState.arraySize);
        this.runner.canvasSingle.drawArray(appState.array);
        
        // アルゴリズム情報更新
        this.updateAlgorithmInfo();
        
        // 比較モード用のセレクト生成
        this.setupCompareSelects();
    }
    
    setupEventListeners() {
        // モード選択
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                appState.mode = btn.dataset.mode;
                this.switchMode(appState.mode);
            });
        });
        
        // カテゴリ選択
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                appState.category = btn.dataset.category;
                this.switchCategory(appState.category);
            });
        });
        
        // アルゴリズム選択
        document.getElementById('algorithm-select').addEventListener('change', (e) => {
            appState.currentAlgorithm = e.target.value;
            this.updateAlgorithmInfo();
        });
        
        // 配列サイズスライダー
        document.getElementById('array-size').addEventListener('input', (e) => {
            appState.arraySize = parseInt(e.target.value);
            document.getElementById('size-value').textContent = appState.arraySize;
            this.generateNewArray();
        });
        
        // 速度スライダー
        document.getElementById('speed').addEventListener('input', (e) => {
            appState.delay = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = appState.delay + 'ms';
        });
        
        // 速度プリセットボタン
        document.querySelectorAll('.speed-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.dataset.speed);
                appState.delay = speed;
                document.getElementById('speed').value = speed;
                document.getElementById('speed-value').textContent = speed + 'ms';
            });
        });
        
        // ランダム配列生成ボタン
        document.getElementById('generate-random-btn').addEventListener('click', () => {
            this.generateNewArray();
        });
        
        // プリセットボタン
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                appState.array = generatePresetArray(preset, appState.arraySize);
                this.runner.canvasSingle.drawArray(appState.array);
            });
        });
        
        // カスタム配列適用ボタン
        document.getElementById('apply-custom-btn').addEventListener('click', () => {
            this.applyCustomArray();
        });
        
        // 入力タブ切り替え
        document.querySelectorAll('.input-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.input-tab-content').forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
            });
        });
        
        // コントロールボタン
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startVisualization();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            appState.isPaused = !appState.isPaused;
            const btn = document.getElementById('pause-btn');
            btn.innerHTML = appState.isPaused ? '<span class="btn-icon">▶️</span>再開' : '<span class="btn-icon">⏸️</span>一時停止';
        });
        
        document.getElementById('step-btn').addEventListener('click', () => {
            appState.stepMode = true;
            setTimeout(() => {
                appState.stepMode = false;
            }, 100);
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetVisualization();
        });
        
        // 表示オプション
        document.getElementById('show-values').addEventListener('change', (e) => {
            appState.showValues = e.target.checked;
            this.runner.canvasSingle.drawArray(appState.array);
        });
        
        document.getElementById('show-indices').addEventListener('change', (e) => {
            appState.showIndices = e.target.checked;
            this.runner.canvasSingle.drawArray(appState.array);
        });
        
        document.getElementById('show-code-highlight').addEventListener('change', (e) => {
            appState.showCodeHighlight = e.target.checked;
        });
        
        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            appState.soundEnabled = e.target.checked;
        });
        
        // コードコピーボタン
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.copyCode();
        });
        
        // コード言語タブ
        document.querySelectorAll('.code-lang-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.code-lang-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.updateCodeExample(tab.dataset.lang);
            });
        });
    }
    
    switchMode(mode) {
        // 選択モードを切り替え
        document.querySelectorAll('.selection-mode').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.visualization-container').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.stats-container').forEach(el => el.classList.remove('active'));
        
        switch(mode) {
            case 'single':
                document.getElementById('single-mode-selection').classList.add('active');
                document.getElementById('single-visualization').classList.add('active');
                document.getElementById('stats-single').classList.add('active');
                break;
            case 'compare':
                document.getElementById('compare-mode-selection').classList.add('active');
                document.getElementById('compare-visualization').classList.add('active');
                document.getElementById('stats-compare').classList.add('active');
                break;
            case 'benchmark':
                document.getElementById('benchmark-mode-selection').classList.add('active');
                document.getElementById('benchmark-visualization').classList.add('active');
                break;
        }
    }
    
    switchCategory(category) {
        // すべてのグループを非表示
        const allGroups = document.querySelectorAll('#algorithm-select optgroup');
        allGroups.forEach(group => {
            group.style.display = 'none';
            Array.from(group.children).forEach(option => option.disabled = true);
        });
        
        // 選択されたカテゴリのグループを表示
        const targetGroup = document.getElementById(category + '-group');
        if (targetGroup) {
            targetGroup.style.display = '';
            Array.from(targetGroup.children).forEach(option => option.disabled = false);
            targetGroup.children[0].selected = true;
            appState.currentAlgorithm = targetGroup.children[0].value;
            this.updateAlgorithmInfo();
        }
        
        this.generateNewArray();
    }
    
    generateNewArray() {
        const min = parseInt(document.getElementById('value-range-min').value) || 1;
        const max = parseInt(document.getElementById('value-range-max').value) || 100;
        
        appState.array = generateArray(appState.arraySize, min, max);
        this.runner.canvasSingle.drawArray(appState.array);
    }
    
    applyCustomArray() {
        const input = document.getElementById('custom-array-input').value;
        const errorEl = document.getElementById('custom-input-error');
        
        try {
            const values = input.split(',').map(v => {
                const num = parseInt(v.trim());
                if (isNaN(num)) throw new Error('無効な数値が含まれています');
                return num;
            });
            
            if (values.length === 0) {
                throw new Error('配列が空です');
            }
            
            if (values.length > 100) {
                throw new Error('配列のサイズは100以下にしてください');
            }
            
            appState.array = values;
            appState.arraySize = values.length;
            
            document.getElementById('array-size').value = values.length;
            document.getElementById('size-value').textContent = values.length;
            
            this.runner.canvasSingle.drawArray(appState.array);
            
            errorEl.classList.remove('show');
            errorEl.textContent = '';
            
            alert(`✅ 配列を適用しました！\n\nサイズ: ${values.length}\n値: ${values.slice(0, 10).join(', ')}${values.length > 10 ? '...' : ''}`);
            
        } catch (error) {
            errorEl.textContent = `❌ エラー: ${error.message}`;
            errorEl.classList.add('show');
        }
    }
    
    async startVisualization() {
        if (appState.isRunning) return;
        
        appState.isRunning = true;
        appState.isPaused = false;
        
        // ボタン状態変更
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;
        document.getElementById('reset-btn').disabled = true;
        
        try {
            if (appState.mode === 'single') {
                await this.runner.run(appState.currentAlgorithm, appState.array);
            } else if (appState.mode === 'compare') {
                await this.runCompareMode();
            } else if (appState.mode === 'benchmark') {
                await this.runBenchmarkMode();
            }
        } catch (error) {
            console.error('実行エラー:', error);
            alert(`❌ エラーが発生しました: ${error.message}`);
        }
        
        appState.isRunning = false;
        
        // ボタン状態を元に戻す
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('reset-btn').disabled = false;
        document.getElementById('pause-btn').innerHTML = '<span class="btn-icon">⏸️</span>一時停止';
    }
    
    async runCompareMode() {
        // 比較モードは現在の実装では簡略化
        alert('⚔️ 比較モードは現在開発中です！\n\n近日公開予定です。お楽しみに！');
    }
    
    async runBenchmarkMode() {
        // ベンチマークモードは現在の実装では簡略化
        alert('📊 ベンチマークモードは現在開発中です！\n\n近日公開予定です。お楽しみに！');
    }
    
    resetVisualization() {
        appState.isRunning = false;
        appState.isPaused = false;
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('reset-btn').disabled = false;
        document.getElementById('pause-btn').innerHTML = '<span class="btn-icon">⏸️</span>一時停止';
        
        appState.resetStats();
        updateStats();
        
        this.runner.canvasSingle.drawArray(appState.array);
    }
    
    setupCompareSelects() {
        const select1 = document.getElementById('algorithm-select-1');
        const select2 = document.getElementById('algorithm-select-2');
        const mainSelect = document.getElementById('algorithm-select');
        
        // メインセレクトの内容をコピー
        select1.innerHTML = mainSelect.innerHTML;
        select2.innerHTML = mainSelect.innerHTML;
        
        select1.value = 'bubble';
        select2.value = 'quick';
    }
    
    copyCode() {
        const codeContent = document.getElementById('code-content').textContent;
        
        navigator.clipboard.writeText(codeContent).then(() => {
            const btn = document.getElementById('copy-code-btn');
            btn.innerHTML = '<span class="btn-icon">✅</span>コピーしました！';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.innerHTML = '<span class="btn-icon">📋</span>コピー';
                btn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            alert('コピーに失敗しました');
            console.error('コピーエラー:', err);
        });
    }
    
    updateCodeExample(lang) {
        // 言語別のコード例を表示（簡略版）
        const algorithms = this.getAlgorithmCode();
        const code = algorithms[appState.currentAlgorithm]?.[lang] || algorithms[appState.currentAlgorithm]?.javascript || '// コードを準備中...';
        
        document.getElementById('code-content').textContent = code;
    }
    
    updateAlgorithmInfo() {
        const info = this.getAlgorithmInfo()[appState.currentAlgorithm];
        
        if (!info) return;
        
        const descEl = document.getElementById('algorithm-description');
        descEl.innerHTML = `
            <h3>${info.title}</h3>
            <p><strong>⏱️ 時間計算量:</strong> <span class="complexity-badge complexity-${info.complexityClass}">${info.timeComplexity}</span></p>
            <p><strong>💾 空間計算量:</strong> <span class="complexity-badge complexity-${info.spaceComplexityClass}">${info.spaceComplexity}</span></p>
            <p><strong>🔄 安定性:</strong> ${info.stable}</p>
            <p><strong>📝 説明:</strong> ${info.description}</p>
            <h4>✨ 特徴</h4>
            <ul>
                ${info.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <h4>💡 適している状況</h4>
            <ul>
                ${info.useCases.map(u => `<li>${u}</li>`).join('')}
            </ul>
        `;
        
        // コード例も更新
        const code = this.getAlgorithmCode()[appState.currentAlgorithm]?.javascript || '// コードを準備中...';
        document.getElementById('code-content').textContent = code;
    }
    
    getAlgorithmInfo() {
        return {
            bubble: {
                title: 'バブルソート (Bubble Sort)',
                timeComplexity: 'O(n²)',
                complexityClass: 'fair',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: '安定',
                description: '隣接する要素を比較し、順序が逆であれば交換する操作を繰り返します。最大の要素が徐々に配列の末尾に「浮かび上がる」様子から「バブル」という名前がついています。シンプルで理解しやすい、アルゴリズム学習の入門として最適です。',
                features: [
                    '✅ 実装が非常にシンプルで理解しやすい',
                    '✅ 安定ソート（同じ値の順序が保たれる）',
                    '✅ ほぼソート済みのデータに対しては効率的（最良O(n)）',
                    '❌ 大規模なデータには不向き',
                    '❌ 平均・最悪ケースの性能が悪い'
                ],
                useCases: [
                    '小規模データ（~100要素）',
                    '教育目的・アルゴリズム学習',
                    'ほぼソート済みのデータ',
                    'メモリが非常に限られている環境'
                ]
            },
            selection: {
                title: '選択ソート (Selection Sort)',
                timeComplexity: 'O(n²)',
                complexityClass: 'fair',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: '不安定',
                description: '未整列部分から最小値（または最大値）を見つけて、未整列部分の先頭と交換する操作を繰り返します。交換回数が少ないのが特徴で、書き込みコストが高いメモリ（EEPROMなど）で有利です。',
                features: [
                    '✅ 実装がシンプル',
                    '✅ 交換回数が少ない（最大n-1回）',
                    '✅ メモリ効率が良い（in-place）',
                    '✅ 書き込みコストが高い場合に有利',
                    '❌ 常にO(n²)の時間がかかる',
                    '❌ 不安定ソート'
                ],
                useCases: [
                    '小規模データ',
                    '書き込みコストが高いメモリ',
                    '交換回数を最小限にしたい場合',
                    'メモリが限られている環境'
                ]
            },
            insertion: {
                title: '挿入ソート (Insertion Sort)',
                timeComplexity: 'O(n²) 平均、O(n) 最良',
                complexityClass: 'good',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: '安定',
                description: '未整列部分の先頭要素を、整列済み部分の適切な位置に挿入する操作を繰り返します。トランプの手札を整理する方法に似ており、小規模データやほぼソート済みデータに非常に効率的です。ティムソートの一部としても使用されています。',
                features: [
                    '✅ 小規模データに非常に効率的',
                    '✅ ほぼソート済みデータに最速クラス（O(n)）',
                    '✅ オンラインアルゴリズム（データが逐次的に来ても対応可能）',
                    '✅ 安定ソート',
                    '✅ 適応的（データの状態に応じて性能が変わる）',
                    '❌ 大規模データには不向き',
                    '❌ 逆順データに弱い'
                ],
                useCases: [
                    '小規模データ（~50要素）',
                    'ほぼソート済みのデータ',
                    'リアルタイムでデータが追加される状況',
                    'ティムソートの内部処理'
                ]
            },
            merge: {
                title: 'マージソート (Merge Sort)',
                timeComplexity: 'O(n log n)',
                complexityClass: 'good',
                spaceComplexity: 'O(n)',
                spaceComplexityClass: 'fair',
                stable: '安定',
                description: '配列を再帰的に半分に分割し、それぞれをソートしてからマージ（結合）します。分割統治法の典型例で、常に安定した性能を発揮します。外部ソート（メモリに収まらないデータのソート）にも使われる信頼性の高いアルゴリズムです。',
                features: [
                    '✅ 常にO(n log n)の性能保証',
                    '✅ 安定ソート',
                    '✅ 大規模データに適している',
                    '✅ 予測可能な性能',
                    '✅ 並列化しやすい',
                    '✅ 外部ソートに利用可能',
                    '❌ 追加のメモリ領域O(n)が必要',
                    '❌ 小規模データにはオーバーヘッドが大きい'
                ],
                useCases: [
                    '大規模データ',
                    '安定性が必要な場合',
                    '最悪ケースの性能保証が必要',
                    '外部ソート（ファイルなど）',
                    '並列処理が可能な環境'
                ]
            },
            quick: {
                title: 'クイックソート (Quick Sort)',
                timeComplexity: 'O(n log n) 平均、O(n²) 最悪',
                complexityClass: 'good',
                spaceComplexity: 'O(log n)',
                spaceComplexityClass: 'good',
                stable: '不安定',
                description: 'ピボット要素を選び、それより小さい要素と大きい要素に分割する操作を再帰的に行います。平均的に最も高速なソートアルゴリズムの一つで、C++の std::sort やJavaの Arrays.sort（プリミティブ型）で採用されています。',
                features: [
                    '✅ 平均的に非常に高速',
                    '✅ インプレースソート（追加メモリが少ない）',
                    '✅ キャッシュ効率が良い',
                    '✅ 実用的に広く使われている',
                    '✅ ピボット選択を工夫すると最悪ケースを回避可能',
                    '❌ 最悪ケースでO(n²)になる可能性',
                    '❌ 不安定ソート',
                    '❌ 再帰的なのでスタックオーバーフローのリスク'
                ],
                useCases: [
                    '一般的な用途（中〜大規模データ）',
                    'メモリが限られている環境',
                    '平均的な性能を重視する場合',
                    'キャッシュ効率を重視する場合'
                ]
            },
            heap: {
                title: 'ヒープソート (Heap Sort)',
                timeComplexity: 'O(n log n)',
                complexityClass: 'good',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: '不安定',
                description: 'ヒープデータ構造を利用したソートアルゴリズム。配列をヒープに変換してから、最大値（または最小値）を取り出す操作を繰り返します。優先度付きキューの実装にも使われる重要なデータ構造で、最悪ケースでもO(n log n)を保証します。',
                features: [
                    '✅ 常にO(n log n)の性能保証',
                    '✅ インプレースソート',
                    '✅ 追加メモリが不要',
                    '✅ 最悪ケースでも性能が保証される',
                    '✅ 優先度付きキューに応用可能',
                    '❌ キャッシュ効率がやや悪い',
                    '❌ 不安定ソート',
                    '❌ 実装がやや複雑',
                    '❌ 実用的には他のアルゴリズムより遅いことが多い'
                ],
                useCases: [
                    'メモリが非常に限られている環境',
                    '最悪ケースの性能保証が必要',
                    '優先度付きキューの実装',
                    'リアルタイムシステム'
                ]
            },
            tim: {
                title: 'ティムソート (Tim Sort)',
                timeComplexity: 'O(n log n) 最悪、O(n) 最良',
                complexityClass: 'excellent',
                spaceComplexity: 'O(n)',
                spaceComplexityClass: 'fair',
                stable: '安定',
                description: 'マージソートと挿入ソートを組み合わせた高度なハイブリッドアルゴリズム。2002年にTim Petersによって開発され、Pythonの標準ソート、Javaの Arrays.sort（オブジェクト型）、Android、V8 JavaScriptエンジンなどで採用されています。実データによく見られる部分的にソート済みのパターンを活用します。',
                features: [
                    '✅ 実用的に最速クラス',
                    '✅ 実データのパターンを活用（適応的）',
                    '✅ 安定ソート',
                    '✅ ほぼソート済みデータで劇的に速い（O(n)）',
                    '✅ 業界標準として広く採用',
                    '✅ 最悪ケースでもO(n log n)を保証',
                    '❌ 実装が複雑',
                    '❌ 追加メモリが必要（O(n)）',
                    '❌ 小規模データではオーバーヘッドがある'
                ],
                useCases: [
                    '実世界のデータ全般',
                    '部分的にソート済みのデータ',
                    '安定性が必要な場合',
                    '大規模データ',
                    '本番環境での汎用ソート'
                ]
            },
            linear: {
                title: '線形探索 (Linear Search)',
                timeComplexity: 'O(n)',
                complexityClass: 'fair',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: 'N/A',
                description: '配列の先頭から順番に目的の値を探します。最もシンプルな探索アルゴリズムで、ソートされていない配列でも使用できます。小規模データや一回限りの探索に適しています。',
                features: [
                    '✅ 実装が非常にシンプル',
                    '✅ ソートされていない配列でも使用可能',
                    '✅ 小規模データに適している',
                    '✅ 追加のメモリ不要',
                    '✅ あらゆるデータ構造に適用可能',
                    '❌ 大規模データには非効率',
                    '❌ 最悪ケースで全要素を確認'
                ],
                useCases: [
                    '小規模データ',
                    'ソートされていないデータ',
                    '一回限りの探索',
                    'リンクリストなどの線形データ構造'
                ]
            },
            binary: {
                title: '二分探索 (Binary Search)',
                timeComplexity: 'O(log n)',
                complexityClass: 'excellent',
                spaceComplexity: 'O(1)',
                spaceComplexityClass: 'excellent',
                stable: 'N/A',
                description: 'ソート済み配列を半分ずつに分割しながら探索します。非常に効率的な探索アルゴリズムで、100万要素でも最大20回程度の比較で見つかります。辞書で単語を探す方法に似ています。',
                features: [
                    '✅ 非常に高速（対数時間）',
                    '✅ 大規模データに適している',
                    '✅ 予測可能な性能',
                    '✅ メモリ効率が良い',
                    '✅ 100万要素でも約20回の比較',
                    '❌ ソート済み配列が必要',
                    '❌ 動的に変化するデータには不向き'
                ],
                useCases: [
                    '大規模なソート済みデータ',
                    '繰り返し探索する場合',
                    'データベースのインデックス',
                    '辞書・電話帳のような静的データ'
                ]
            }
        };
    }
    
    getAlgorithmCode() {
        return {
            bubble: {
                javascript: `// バブルソート
function bubbleSort(array) {
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        
        for (let j = 0; j < n - i - 1; j++) {
            // 隣接要素を比較
            if (array[j] > array[j + 1]) {
                // 交換
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                swapped = true;
            }
        }
        
        // 最適化：交換がなければ終了
        if (!swapped) break;
    }
    
    return array;
}`,
                python: `# バブルソート
def bubble_sort(array):
    n = len(array)
    
    for i in range(n - 1):
        swapped = False
        
        for j in range(n - i - 1):
            # 隣接要素を比較
            if array[j] > array[j + 1]:
                # 交換
                array[j], array[j + 1] = array[j + 1], array[j]
                swapped = True
        
        # 最適化：交換がなければ終了
        if not swapped:
            break
    
    return array`,
                cpp: `// バブルソート
void bubbleSort(vector<int>& array) {
    int n = array.size();
    
    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        
        for (int j = 0; j < n - i - 1; j++) {
            // 隣接要素を比較
            if (array[j] > array[j + 1]) {
                // 交換
                swap(array[j], array[j + 1]);
                swapped = true;
            }
        }
        
        // 最適化：交換がなければ終了
        if (!swapped) break;
    }
}`,
                java: `// バブルソート
public static void bubbleSort(int[] array) {
    int n = array.length;
    
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        
        for (int j = 0; j < n - i - 1; j++) {
            // 隣接要素を比較
            if (array[j] > array[j + 1]) {
                // 交換
                int temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                swapped = true;
            }
        }
        
        // 最適化：交換がなければ終了
        if (!swapped) break;
    }
}`
            },
            tim: {
                javascript: `// ティムソート
const MIN_RUN = 32;

function timSort(array) {
    const n = array.length;
    const minRun = calcMinRun(n);
    
    // 各Runを挿入ソートでソート
    for (let start = 0; start < n; start += minRun) {
        const end = Math.min(start + minRun - 1, n - 1);
        insertionSort(array, start, end);
    }
    
    // Runをマージ
    let size = minRun;
    while (size < n) {
        for (let start = 0; start < n; start += size * 2) {
            const mid = start + size - 1;
            const end = Math.min(start + size * 2 - 1, n - 1);
            
            if (mid < end) {
                merge(array, start, mid, end);
            }
        }
        size *= 2;
    }
    
    return array;
}

function calcMinRun(n) {
    let r = 0;
    while (n >= MIN_RUN) {
        r |= n & 1;
        n >>= 1;
    }
    return n + r;
}`
            }
        };
    }
}

// ==========================================
// アプリケーション起動（続き）
// ==========================================

// UIController クラスの続き...


// ==========================================
// パフォーマンスグラフ管理
// ==========================================

class PerformanceGraph {
    constructor() {
        this.chart = null;
        this.initChart();
    }
    
    initChart() {
        const ctx = document.getElementById('performance-graph').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '実行時間 (ms)',
                    data: [],
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'ミリ秒 (ms)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'アルゴリズムパフォーマンス比較'
                    }
                }
            }
        });
    }
    
    updateGraph(algorithmName, timeMs, comparisons, swaps) {
        // データ追加
        this.chart.data.labels.push(algorithmName);
        this.chart.data.datasets[0].data.push(timeMs);
        
        // 最大10個まで表示
        if (this.chart.data.labels.length > 10) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.update();
    }
    
    switchDataType(type) {
        switch(type) {
            case 'time':
                this.chart.data.datasets[0].label = '実行時間 (ms)';
                break;
            case 'comparisons':
                this.chart.data.datasets[0].label = '比較回数';
                break;
            case 'swaps':
                this.chart.data.datasets[0].label = 'スワップ回数';
                break;
        }
        this.chart.update();
    }
    
    clear() {
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();
    }
}

// ==========================================
// 効果音管理（オプション）
// ==========================================

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = false;
    }
    
    init() {
        if (!this.audioContext && window.AudioContext) {
            this.audioContext = new AudioContext();
        }
    }
    
    playTone(frequency, duration = 50) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
    }
    
    playCompareSound(value) {
        const frequency = 200 + (value * 5);
        this.playTone(frequency, 30);
    }
    
    playSwapSound() {
        this.playTone(440, 50);
    }
    
    playSortedSound() {
        this.playTone(880, 100);
    }
}

// ==========================================
// キーボードショートカット
// ==========================================

class KeyboardShortcuts {
    constructor(uiController) {
        this.uiController = uiController;
        this.setupShortcuts();
    }
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + キーの組み合わせ
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        if (!appState.isRunning) {
                            this.uiController.startVisualization();
                        }
                        break;
                    case 'r':
                        e.preventDefault();
                        this.uiController.resetVisualization();
                        break;
                    case 'g':
                        e.preventDefault();
                        this.uiController.generateNewArray();
                        break;
                }
            } else {
                // 単独キー
                switch(e.key) {
                    case ' ':
                        // スペースキー：開始/一時停止
                        e.preventDefault();
                        if (appState.isRunning) {
                            document.getElementById('pause-btn').click();
                        } else {
                            document.getElementById('start-btn').click();
                        }
                        break;
                    case 'Escape':
                        // ESCキー：リセット
                        if (appState.isRunning) {
                            this.uiController.resetVisualization();
                        }
                        break;
                    case 'ArrowRight':
                        // 右矢印：ステップ実行
                        if (appState.isRunning) {
                            document.getElementById('step-btn').click();
                        }
                        break;
                }
            }
        });
    }
}

// ==========================================
// ローカルストレージ管理
// ==========================================

class StorageManager {
    constructor() {
        this.storageKey = 'algorithmVisualizerSettings';
    }
    
    saveSettings() {
        const settings = {
            arraySize: appState.arraySize,
            delay: appState.delay,
            showValues: appState.showValues,
            showIndices: appState.showIndices,
            showCodeHighlight: appState.showCodeHighlight,
            soundEnabled: appState.soundEnabled,
            category: appState.category,
            algorithm: appState.currentAlgorithm
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem(this.storageKey);
        
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                
                appState.arraySize = settings.arraySize || 50;
                appState.delay = settings.delay || 50;
                appState.showValues = settings.showValues !== false;
                appState.showIndices = settings.showIndices || false;
                appState.showCodeHighlight = settings.showCodeHighlight !== false;
                appState.soundEnabled = settings.soundEnabled || false;
                
                // UI更新
                document.getElementById('array-size').value = appState.arraySize;
                document.getElementById('size-value').textContent = appState.arraySize;
                document.getElementById('speed').value = appState.delay;
                document.getElementById('speed-value').textContent = appState.delay + 'ms';
                document.getElementById('show-values').checked = appState.showValues;
                document.getElementById('show-indices').checked = appState.showIndices;
                document.getElementById('show-code-highlight').checked = appState.showCodeHighlight;
                document.getElementById('sound-enabled').checked = appState.soundEnabled;
                
                return true;
            } catch (error) {
                console.error('設定の読み込みエラー:', error);
                return false;
            }
        }
        
        return false;
    }
    
    clearSettings() {
        localStorage.removeItem(this.storageKey);
    }
}

// ==========================================
// アニメーションヘルパー
// ==========================================

class AnimationHelper {
    static async fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        
        return new Promise(resolve => {
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                
                element.style.opacity = Math.min(progress / duration, 1);
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    static async fadeOut(element, duration = 300) {
        let start = null;
        
        return new Promise(resolve => {
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                
                element.style.opacity = 1 - Math.min(progress / duration, 1);
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
    
    static async slideInUp(element, duration = 500) {
        element.style.transform = 'translateY(30px)';
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        
        return new Promise(resolve => {
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percentage = Math.min(progress / duration, 1);
                
                element.style.transform = `translateY(${30 * (1 - percentage)}px)`;
                element.style.opacity = percentage;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.transform = 'translateY(0)';
                    element.style.opacity = '1';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }
}

// ==========================================
// ユーティリティ関数（追加）
// ==========================================

// デバウンス関数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// スロットル関数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ランダムカラー生成
function getRandomColor() {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#00f2fe', '#43e97b', '#38f9d7', '#fa709a',
        '#fee140', '#30cfd0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 配列の統計情報取得
function getArrayStats(array) {
    const sorted = [...array].sort((a, b) => a - b);
    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        average: array.reduce((a, b) => a + b, 0) / array.length,
        median: sorted[Math.floor(sorted.length / 2)],
        range: sorted[sorted.length - 1] - sorted[0]
    };
}

// 数値フォーマット
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toString();
}

// 時間フォーマット
function formatTime(ms) {
    if (ms < 1000) {
        return ms + 'ms';
    } else if (ms < 60000) {
        return (ms / 1000).toFixed(2) + 's';
    } else {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}m ${seconds}s`;
    }
}

// ==========================================
// エラーハンドリング
// ==========================================

class ErrorHandler {
    static handle(error, context = '') {
        console.error(`エラー発生 [${context}]:`, error);
        
        let message = 'エラーが発生しました。';
        
        if (error instanceof RangeError) {
            message = '配列のサイズまたは値が範囲外です。';
        } else if (error instanceof TypeError) {
            message = '不正なデータ型が使用されました。';
        } else if (error.message) {
            message = error.message;
        }
        
        // ユーザーフレンドリーなエラー表示
        this.showErrorToast(message);
        
        // エラーログをローカルストレージに保存（デバッグ用）
        this.logError(error, context);
    }
    
    static showErrorToast(message) {
        // トースト通知を表示（簡易版）
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ef4444;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            ">
                <strong>⚠️ エラー</strong><br>
                ${message}
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    static logError(error, context) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent
        };
        
        const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        logs.push(errorLog);
        
        // 最新50件のみ保持
        if (logs.length > 50) {
            logs.shift();
        }
        
        localStorage.setItem('errorLogs', JSON.stringify(logs));
    }
}

// グローバルエラーハンドラー
window.addEventListener('error', (event) => {
    ErrorHandler.handle(event.error, 'Global Error');
});

window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(event.reason, 'Unhandled Promise Rejection');
});

// ==========================================
// パフォーマンス監視
// ==========================================

class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
    }
    
    start(label) {
        this.marks.set(label, performance.now());
    }
    
    end(label) {
        const startTime = this.marks.get(label);
        if (!startTime) {
            console.warn(`パフォーマンスマーク "${label}" が見つかりません`);
            return 0;
        }
        
        const duration = performance.now() - startTime;
        this.marks.delete(label);
        
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
        return duration;
    }
    
    measure(label, callback) {
        this.start(label);
        const result = callback();
        this.end(label);
        return result;
    }
    
    async measureAsync(label, callback) {
        this.start(label);
        const result = await callback();
        this.end(label);
        return result;
    }
}

// ==========================================
// アプリケーション初期化
// ==========================================

class Application {
    constructor() {
        this.uiController = null;
        this.performanceGraph = null;
        this.soundManager = null;
        this.storageManager = null;
        this.performanceMonitor = null;
    }
    
    async init() {
        console.log('🎨 Algorithm Visualizer を初期化中...');
        
        try {
            // ストレージマネージャー初期化
            this.storageManager = new StorageManager();
            this.storageManager.loadSettings();
            
            // パフォーマンスモニター初期化
            this.performanceMonitor = new PerformanceMonitor();
            
            // サウンドマネージャー初期化
            this.soundManager = new SoundManager();
            this.soundManager.init();
            
            // パフォーマンスグラフ初期化
            this.performanceGraph = new PerformanceGraph();
            
            // UIコントローラー初期化
            this.uiController = new UIController();
            
            // キーボードショートカット初期化
            new KeyboardShortcuts(this.uiController);
            
            // グラフタブイベント
            this.setupGraphTabs();
            
            // ページ離脱時に設定を保存
            window.addEventListener('beforeunload', () => {
                this.storageManager.saveSettings();
            });
            
            // リサイズ時の処理
            window.addEventListener('resize', debounce(() => {
                this.handleResize();
            }, 250));
            
            console.log('✅ 初期化完了！');
            console.log('💡 ヒント:');
            console.log('  - スペースキー: 開始/一時停止');
            console.log('  - Ctrl+S: 開始');
            console.log('  - Ctrl+R: リセット');
            console.log('  - Ctrl+G: 新しい配列生成');
            console.log('  - ESC: リセット');
            console.log('  - →: ステップ実行');
            
        } catch (error) {
            ErrorHandler.handle(error, 'Application Initialization');
        }
    }
    
    setupGraphTabs() {
        document.querySelectorAll('.graph-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.graph-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const graphType = tab.dataset.graph;
                this.performanceGraph.switchDataType(graphType);
            });
        });
    }
    
    handleResize() {
        // キャンバスのリサイズ処理
        const canvas = document.getElementById('canvas-single');
        if (canvas && appState.array.length > 0) {
            const canvasManager = new CanvasManager('canvas-single');
            canvasManager.drawArray(appState.array);
        }
    }
}

// ==========================================
// アプリケーション起動
// ==========================================

// DOM読み込み完了後に起動
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    console.log('%c🎨 Ultimate Algorithm Visualizer', 
        'font-size: 24px; font-weight: bold; color: #667eea;');
    console.log('%cバージョン 2.0 - Created by Rino-program', 
        'font-size: 14px; color: #718096;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 
        'color: #cbd5e0;');
    
    const app = new Application();
    await app.init();
    
    // グローバルに公開（デバッグ用）
    window.app = app;
    window.appState = appState;
    
    console.log('%c✨ アプリケーションが正常に起動しました！', 
        'font-size: 16px; font-weight: bold; color: #10b981;');
    console.log('%cヒント: window.app でアプリケーションインスタンスにアクセスできます', 
        'color: #718096;');
}

// ==========================================
// デバッグユーティリティ（開発用）
// ==========================================

if (typeof window !== 'undefined') {
    window.debugAlgorithms = {
        // 配列生成
        generateTestArray: (size = 50, type = 'random') => {
            return generatePresetArray(type, size);
        },
        
        // 統計情報表示
        showStats: () => {
            console.table({
                '配列サイズ': appState.arraySize,
                '比較回数': appState.stats.comparisons,
                'スワップ回数': appState.stats.swaps,
                '配列アクセス': appState.stats.arrayAccesses,
                '実行時間': formatTime(Date.now() - appState.stats.startTime),
                'ステップ数': appState.stats.currentStep
            });
        },
        
        // エラーログ表示
        showErrorLogs: () => {
            const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            console.table(logs);
        },
        
        // エラーログクリア
        clearErrorLogs: () => {
            localStorage.removeItem('errorLogs');
            console.log('✅ エラーログをクリアしました');
        },
        
        // パフォーマンス測定
        benchmark: async (algorithm, arraySize = 100, iterations = 10) => {
            console.log(`📊 ベンチマーク開始: ${algorithm} (${arraySize}要素 × ${iterations}回)`);
            
            const times = [];
            
            for (let i = 0; i < iterations; i++) {
                const testArray = generateArray(arraySize);
                const start = performance.now();
                
                // ここで実際のソート実行（簡略版）
                testArray.sort((a, b) => a - b);
                
                const end = performance.now();
                times.push(end - start);
            }
            
            const average = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);
            
            console.log(`✅ ベンチマーク完了:`);
            console.table({
                '平均時間': average.toFixed(2) + 'ms',
                '最小時間': min.toFixed(2) + 'ms',
                '最大時間': max.toFixed(2) + 'ms',
                '標準偏差': Math.sqrt(times.map(t => Math.pow(t - average, 2)).reduce((a, b) => a + b, 0) / times.length).toFixed(2) + 'ms'
            });
        },
        
        // メモリ使用量表示
        showMemoryUsage: () => {
            if (performance.memory) {
                console.table({
                    '使用メモリ': formatNumber(performance.memory.usedJSHeapSize) + 'B',
                    '総メモリ': formatNumber(performance.memory.totalJSHeapSize) + 'B',
                    '制限': formatNumber(performance.memory.jsHeapSizeLimit) + 'B'
                });
            } else {
                console.log('このブラウザはメモリ情報をサポートしていません');
            }
        }
    };
    
    console.log('%c💡 デバッグコマンド:', 'font-weight: bold; color: #667eea;');
    console.log('  window.debugAlgorithms.generateTestArray(50, "sorted")');
    console.log('  window.debugAlgorithms.showStats()');
    console.log('  window.debugAlgorithms.showErrorLogs()');
    console.log('  window.debugAlgorithms.clearErrorLogs()');
    console.log('  window.debugAlgorithms.benchmark("quicksort", 100, 10)');
    console.log('  window.debugAlgorithms.showMemoryUsage()');
}

// ==========================================
// サービスワーカー登録（PWA対応・オプション）
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // サービスワーカーの登録はオプション
        // navigator.serviceWorker.register('/sw.js')
        //     .then(reg => console.log('✅ Service Worker registered'))
        //     .catch(err => console.log('❌ Service Worker registration failed'));
    });
}

// ==========================================
// エクスポート（モジュール対応）
// ==========================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        CanvasManager,
        SortingAlgorithms,
        SearchingAlgorithms,
        GraphAlgorithms,
        TreeAlgorithms,
        RecursiveAlgorithms,
        DynamicProgramming,
        StringAlgorithms,
        AlgorithmRunner,
        UIController,
        PerformanceGraph,
        SoundManager,
        ErrorHandler,
        PerformanceMonitor,
        Application
    };
}

// ==========================================
// コンソールアート（起動時）
// ==========================================

console.log(`
    ╔═══════════════════════════════════════════╗
    ║                                           ║
    ║     🎨 Algorithm Visualizer v2.0         ║
    ║                                           ║
    ║     Created with ❤️ by Rino-program     ║
    ║                                           ║
    ║     機能:                                 ║
    ║     ✓ 15+ アルゴリズム                    ║
    ║     ✓ リアルタイム可視化                  ║
    ║     ✓ 統計グラフ                          ║
    ║     ✓ コードハイライト                    ║
    ║     ✓ 比較モード                          ║
    ║     ✓ カスタム配列入力                    ║
    ║     ✓ キーボードショートカット            ║
    ║                                           ║
    ╚═══════════════════════════════════════════╝
`);

// ==========================================
// 終了
// ==========================================

console.log('📦 script.js の読み込みが完了しました！');
