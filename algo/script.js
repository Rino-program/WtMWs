// ==========================================
// グローバル変数と初期設定
// ==========================================
let array = [];
let arraySize = 50;
let delay = 50;
let isRunning = false;
let isPaused = false;
let currentAlgorithm = 'bubble';
let currentCategory = 'sorting';

// 統計情報
let comparisons = 0;
let swaps = 0;
let arrayAccesses = 0;
let startTime = 0;

// Canvas設定
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1200;
canvas.height = 400;

// DOM要素取得
const algorithmSelect = document.getElementById('algorithm-select');
const arraySizeSlider = document.getElementById('array-size');
const speedSlider = document.getElementById('speed');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const categoryBtns = document.querySelectorAll('.category-btn');

// ==========================================
// イベントリスナー設定
// ==========================================

// 配列サイズ変更
arraySizeSlider.addEventListener('input', (e) => {
    arraySize = parseInt(e.target.value);
    document.getElementById('size-value').textContent = arraySize;
    generateArray();
});

// 速度変更
speedSlider.addEventListener('input', (e) => {
    delay = parseInt(e.target.value);
    document.getElementById('speed-value').textContent = delay;
});

// アルゴリズム選択
algorithmSelect.addEventListener('change', (e) => {
    currentAlgorithm = e.target.value;
    updateAlgorithmInfo();
    resetStats();
    generateArray();
});

// 新しい配列生成
generateBtn.addEventListener('click', () => {
    if (!isRunning) {
        generateArray();
        resetStats();
    }
});

// 開始ボタン
startBtn.addEventListener('click', async () => {
    if (!isRunning) {
        await startVisualization();
    }
});

// 一時停止ボタン
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶️ 再開' : '⏸️ 一時停止';
});

// リセットボタン
resetBtn.addEventListener('click', () => {
    resetVisualization();
});

// カテゴリボタン
categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        switchCategory(currentCategory);
    });
});

// ==========================================
// 配列操作関数
// ==========================================

// ランダム配列生成
function generateArray() {
    array = [];
    for (let i = 0; i < arraySize; i++) {
        array.push(Math.floor(Math.random() * 300) + 50);
    }
    drawArray();
}

// 配列描画
function drawArray(highlightIndices = [], colors = []) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = canvas.width / array.length;
    const maxHeight = Math.max(...array);
    
    for (let i = 0; i < array.length; i++) {
        const barHeight = (array[i] / maxHeight) * (canvas.height - 50);
        const x = i * barWidth;
        const y = canvas.height - barHeight;
        
        // 色の設定（ハイライト処理）
        let color = '#667eea'; // デフォルト色
        if (highlightIndices.includes(i)) {
            const colorIndex = highlightIndices.indexOf(i);
            color = colors[colorIndex] || '#fbbf24';
        }
        
        // バー描画
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
        
        // 配列が小さい場合は値を表示
        if (array.length <= 30) {
            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(array[i], x + barWidth / 2, y - 5);
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
            if (!isPaused) {
                setTimeout(resolve, ms);
            } else {
                setTimeout(checkPause, 100);
            }
        };
        checkPause();
    });
}

// 統計リセット
function resetStats() {
    comparisons = 0;
    swaps = 0;
    arrayAccesses = 0;
    startTime = 0;
    updateStats();
}

// 統計更新
function updateStats() {
    document.getElementById('comparisons').textContent = comparisons;
    document.getElementById('swaps').textContent = swaps;
    document.getElementById('array-accesses').textContent = arrayAccesses;
    
    if (startTime > 0) {
        const elapsed = Date.now() - startTime;
        document.getElementById('elapsed-time').textContent = elapsed + 'ms';
    }
}

// ==========================================
// 可視化制御
// ==========================================

// 可視化開始
async function startVisualization() {
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    startTime = Date.now();
    
    // ボタン状態変更
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    generateBtn.disabled = true;
    arraySizeSlider.disabled = true;
    algorithmSelect.disabled = true;
    
    resetStats();
    
    // アルゴリズム実行
    try {
        switch(currentAlgorithm) {
            // ソートアルゴリズム
            case 'bubble':
                await bubbleSort();
                break;
            case 'selection':
                await selectionSort();
                break;
            case 'insertion':
                await insertionSort();
                break;
            case 'merge':
                await mergeSort(0, array.length - 1);
                break;
            case 'quick':
                await quickSort(0, array.length - 1);
                break;
            case 'heap':
                await heapSort();
                break;
            
            // 探索アルゴリズム
            case 'linear':
                await linearSearch();
                break;
            case 'binary':
                await binarySearch();
                break;
            case 'jump':
                await jumpSearch();
                break;
            
            // その他は準備中
            default:
                alert('このアルゴリズムは現在準備中です！🚧');
        }
        
        // 完了アニメーション
        if (currentCategory === 'sorting') {
            await animateCompletion();
        }
        
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
    
    // ボタン状態を元に戻す
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    generateBtn.disabled = false;
    arraySizeSlider.disabled = false;
    algorithmSelect.disabled = false;
    pauseBtn.textContent = '⏸️ 一時停止';
    
    updateStats();
}

// リセット
function resetVisualization() {
    isRunning = false;
    isPaused = false;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    generateBtn.disabled = false;
    arraySizeSlider.disabled = false;
    algorithmSelect.disabled = false;
    pauseBtn.textContent = '⏸️ 一時停止';
    
    generateArray();
    resetStats();
}

// ==========================================
// ソートアルゴリズム実装
// ==========================================

/**
 * バブルソート
 * 隣接する要素を比較して交換
 */
async function bubbleSort() {
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        
        for (let j = 0; j < n - i - 1; j++) {
            comparisons++;
            arrayAccesses += 2;
            updateStats();
            
            // 比較中の要素をハイライト
            drawArray([j, j + 1], ['#fbbf24', '#fbbf24']);
            await sleep(delay);
            
            if (array[j] > array[j + 1]) {
                // 交換
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                swaps++;
                arrayAccesses += 4;
                swapped = true;
                updateStats();
                
                // 交換をハイライト
                drawArray([j, j + 1], ['#ef4444', '#ef4444']);
                await sleep(delay);
            }
        }
        
        // ソート済み部分を緑色に
        drawArray([n - i - 1], ['#10b981']);
        await sleep(delay / 2);
        
        // 最適化：交換がなければ終了
        if (!swapped) break;
    }
}

/**
 * 選択ソート
 * 最小値を見つけて先頭と交換
 */
async function selectionSort() {
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        
        // 最小値を探索
        for (let j = i + 1; j < n; j++) {
            comparisons++;
            arrayAccesses += 2;
            updateStats();
            
            // 現在の位置、探索中の位置、最小値の位置をハイライト
            drawArray([i, j, minIdx], ['#10b981', '#fbbf24', '#ef4444']);
            await sleep(delay);
            
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }
        
        // 最小値と交換
        if (minIdx !== i) {
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            swaps++;
            arrayAccesses += 4;
            updateStats();
            
            drawArray([i, minIdx], ['#ef4444', '#ef4444']);
            await sleep(delay);
        }
        
        // ソート済み部分を緑色に
        drawArray([i], ['#10b981']);
        await sleep(delay / 2);
    }
}

/**
 * 挿入ソート
 * 適切な位置に挿入していく
 */
async function insertionSort() {
    const n = array.length;
    
    for (let i = 1; i < n; i++) {
        let key = array[i];
        let j = i - 1;
        arrayAccesses++;
        
        // 挿入する要素をハイライト
        drawArray([i], ['#fbbf24']);
        await sleep(delay);
        
        // 適切な位置を見つけて挿入
        while (j >= 0 && array[j] > key) {
            comparisons++;
            arrayAccesses += 2;
            updateStats();
            
            array[j + 1] = array[j];
            swaps++;
            arrayAccesses += 2;
            
            drawArray([j, j + 1], ['#ef4444', '#ef4444']);
            await sleep(delay);
            
            j--;
        }
        
        if (j >= 0) {
            comparisons++;
        }
        
        array[j + 1] = key;
        arrayAccesses++;
        updateStats();
        
        // 挿入完了
        drawArray([j + 1], ['#10b981']);
        await sleep(delay / 2);
    }
}

/**
 * マージソート
 * 分割統治法による効率的なソート
 */
async function mergeSort(left, right) {
    if (left < right) {
        const mid = Math.floor((left + right) / 2);
        
        // 再帰的に分割
        await mergeSort(left, mid);
        await mergeSort(mid + 1, right);
        
        // マージ
        await merge(left, mid, right);
    }
}

async function merge(left, mid, right) {
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    // 2つの配列をマージ
    while (i < leftArr.length && j < rightArr.length) {
        comparisons++;
        arrayAccesses += 2;
        updateStats();
        
        drawArray([k, left + i, mid + 1 + j], ['#fbbf24', '#ef4444', '#ef4444']);
        await sleep(delay);
        
        if (leftArr[i] <= rightArr[j]) {
            array[k] = leftArr[i];
            i++;
        } else {
            array[k] = rightArr[j];
            j++;
        }
        
        swaps++;
        arrayAccesses++;
        k++;
        updateStats();
    }
    
    // 残りの要素をコピー
    while (i < leftArr.length) {
        array[k] = leftArr[i];
        drawArray([k], ['#10b981']);
        await sleep(delay / 2);
        i++;
        k++;
        arrayAccesses++;
    }
    
    while (j < rightArr.length) {
        array[k] = rightArr[j];
        drawArray([k], ['#10b981']);
        await sleep(delay / 2);
        j++;
        k++;
        arrayAccesses++;
    }
}

/**
 * クイックソート
 * ピボットを使った分割統治法
 */
async function quickSort(low, high) {
    if (low < high) {
        const pi = await partition(low, high);
        await quickSort(low, pi - 1);
        await quickSort(pi + 1, high);
    }
}

async function partition(low, high) {
    const pivot = array[high];
    let i = low - 1;
    arrayAccesses++;
    
    // ピボットより小さい要素を左に移動
    for (let j = low; j < high; j++) {
        comparisons++;
        arrayAccesses += 2;
        updateStats();
        
        drawArray([j, high, i + 1], ['#fbbf24', '#ef4444', '#10b981']);
        await sleep(delay);
        
        if (array[j] < pivot) {
            i++;
            [array[i], array[j]] = [array[j], array[i]];
            swaps++;
            arrayAccesses += 4;
            updateStats();
            
            drawArray([i, j], ['#ef4444', '#ef4444']);
            await sleep(delay);
        }
    }
    
    // ピボットを正しい位置に配置
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    swaps++;
    arrayAccesses += 4;
    updateStats();
    
    drawArray([i + 1], ['#10b981']);
    await sleep(delay);
    
    return i + 1;
}

/**
 * ヒープソート
 * ヒープデータ構造を利用
 */
async function heapSort() {
    const n = array.length;
    
    // ヒープを構築（配列を再配置）
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(n, i);
    }
    
    // ヒープから要素を一つずつ取り出す
    for (let i = n - 1; i > 0; i--) {
        // 現在のルートを末尾に移動
        [array[0], array[i]] = [array[i], array[0]];
        swaps++;
        arrayAccesses += 4;
        updateStats();
        
        drawArray([0, i], ['#ef4444', '#10b981']);
        await sleep(delay);
        
        // 縮小したヒープに対してheapifyを呼び出す
        await heapify(i, 0);
    }
}

async function heapify(n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    // 左の子が親より大きいか
    if (left < n) {
        comparisons++;
        arrayAccesses += 2;
        updateStats();
        
        if (array[left] > array[largest]) {
            largest = left;
        }
    }
    
    // 右の子が現在最大値より大きいか
    if (right < n) {
        comparisons++;
        arrayAccesses += 2;
        updateStats();
        
        if (array[right] > array[largest]) {
            largest = right;
        }
    }
    
    // 最大値が親でない場合
    if (largest !== i) {
        [array[i], array[largest]] = [array[largest], array[i]];
        swaps++;
        arrayAccesses += 4;
        updateStats();
        
        drawArray([i, largest], ['#ef4444', '#ef4444']);
        await sleep(delay);
        
        // 再帰的にヒープ化
        await heapify(n, largest);
    }
}

// ==========================================
// 探索アルゴリズム実装
// ==========================================

/**
 * 線形探索
 * 順番に探索
 */
async function linearSearch() {
    const target = array[Math.floor(Math.random() * array.length)];
    alert(`🔍 探索する値: ${target}\n\n配列の先頭から順番に探します！`);
    
    for (let i = 0; i < array.length; i++) {
        comparisons++;
        arrayAccesses++;
        updateStats();
        
        drawArray([i], ['#fbbf24']);
        await sleep(delay);
        
        if (array[i] === target) {
            drawArray([i], ['#10b981']);
            await sleep(delay * 3);
            alert(`✅ 見つかりました！\n\n値 ${target} がインデックス ${i} にありました！\n比較回数: ${comparisons}回`);
            return i;
        }
        
        // 見つからなかった要素は赤く
        drawArray([i], ['#ef4444']);
        await sleep(delay / 2);
    }
    
    alert('❌ 値が見つかりませんでした');
    return -1;
}

/**
 * 二分探索
 * ソート済み配列を半分ずつ探索
 */
async function binarySearch() {
    // まずソート
    array.sort((a, b) => a - b);
    drawArray();
    await sleep(500);
    
    const target = array[Math.floor(Math.random() * array.length)];
    alert(`🔍 探索する値: ${target}\n\n配列を半分ずつに分けて探します！\n（配列は自動的にソートされました）`);
    
    let left = 0;
    let right = array.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        comparisons++;
        arrayAccesses++;
        updateStats();
        
        // 探索範囲と中央値をハイライト
        drawArray([left, mid, right], ['#fbbf24', '#ef4444', '#fbbf24']);
        await sleep(delay * 2);
        
        if (array[mid] === target) {
            drawArray([mid], ['#10b981']);
            await sleep(delay * 3);
            alert(`✅ 見つかりました！\n\n値 ${target} がインデックス ${mid} にありました！\n比較回数: ${comparisons}回\n\n線形探索より効率的ですね！`);
            return mid;
        }
        
        if (array[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    alert('❌ 値が見つかりませんでした');
    return -1;
}

/**
 * ジャンプ探索
 * √n ずつジャンプして探索
 */
async function jumpSearch() {
    // まずソート
    array.sort((a, b) => a - b);
    drawArray();
    await sleep(500);
    
    const target = array[Math.floor(Math.random() * array.length)];
    const jumpSize = Math.floor(Math.sqrt(array.length));
    
    alert(`🔍 探索する値: ${target}\n\nジャンプサイズ √${array.length} = ${jumpSize} でジャンプしながら探します！`);
    
    let prev = 0;
    let curr = 0;
    
    // ジャンプして範囲を見つける
    while (curr < array.length && array[curr] < target) {
        comparisons++;
        arrayAccesses++;
        updateStats();
        
        drawArray([curr], ['#fbbf24']);
        await sleep(delay * 2);
        
        prev = curr;
        curr = Math.min(curr + jumpSize, array.length);
    }
    
    // 範囲内で線形探索
    for (let i = prev; i < Math.min(curr, array.length); i++) {
        comparisons++;
        arrayAccesses++;
        updateStats();
        
        drawArray([i], ['#ef4444']);
        await sleep(delay);
        
        if (array[i] === target) {
            drawArray([i], ['#10b981']);
            await sleep(delay * 3);
            alert(`✅ 見つかりました！\n\n値 ${target} がインデックス ${i} にありました！\n比較回数: ${comparisons}回`);
            return i;
        }
    }
    
    alert('❌ 値が見つかりませんでした');
    return -1;
}

// ==========================================
// UI制御関数
// ==========================================

/**
 * 完了アニメーション
 * 左から右へ緑色に変化
 */
async function animateCompletion() {
    for (let i = 0; i < array.length; i++) {
        drawArray([i], ['#10b981']);
        await sleep(10);
    }
    await sleep(500);
}

/**
 * カテゴリ切り替え
 */
function switchCategory(category) {
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
        currentAlgorithm = targetGroup.children[0].value;
        updateAlgorithmInfo();
    }
    
    resetVisualization();
}

/**
 * アルゴリズム情報更新
 * 各アルゴリズムの詳細情報を表示
 */
function updateAlgorithmInfo() {
    const descriptions = {
        bubble: {
            title: 'バブルソート (Bubble Sort)',
            timeComplexity: 'O(n²) - 最悪・平均、O(n) - 最良',
            spaceComplexity: 'O(1)',
            stable: '安定',
            description: '隣接する要素を比較し、順序が逆であれば交換する操作を繰り返します。最大の要素が徐々に配列の末尾に「浮かび上がる」様子から「バブル」という名前がついています。シンプルで理解しやすいアルゴリズムです。',
            features: [
                '✅ 実装が非常にシンプルで理解しやすい',
                '✅ 小規模なデータセット（~100要素）に適している',
                '✅ ほぼソート済みのデータに対しては効率的',
                '✅ 安定ソート（同じ値の順序が保たれる）',
                '❌ 大規模なデータには不向き',
                '❌ 平均・最悪ケースの性能が悪い'
            ],
            code: `async function bubbleSort(array) {
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        
        for (let j = 0; j < n - i - 1; j++) {
            // 隣接要素を比較
            if (array[j] > array[j + 1]) {
                // 交換
                [array[j], array[j + 1]] = [array[j + 1], array[j]];
                swapped = true;
                await sleep(delay);
            }
        }
        
        // 最適化：交換がなければ終了
        if (!swapped) break;
    }
    return array;
}`
        },
        selection: {
            title: '選択ソート (Selection Sort)',
            timeComplexity: 'O(n²) - すべてのケース',
            spaceComplexity: 'O(1)',
            stable: '不安定',
            description: '未整列部分から最小値（または最大値）を見つけて、未整列部分の先頭と交換する操作を繰り返します。交換回数が少ないのが特徴で、書き込みコストが高い場合に有利です。',
            features: [
                '✅ 実装がシンプル',
                '✅ 交換回数が少ない（最大n-1回）',
                '✅ メモリ効率が良い（in-place）',
                '✅ 書き込みコストが高い場合に有利',
                '❌ 常にO(n²)の時間がかかる',
                '❌ 大規模データには不向き',
                '❌ 不安定ソート'
            ],
            code: `async function selectionSort(array) {
    const n = array.length;
    
    for (let i = 0; i < n - 1; i++) {
        // 最小値のインデックスを探す
        let minIdx = i;
        
        for (let j = i + 1; j < n; j++) {
            if (array[j] < array[minIdx]) {
                minIdx = j;
            }
        }
        
        // 最小値と交換
        if (minIdx !== i) {
            [array[i], array[minIdx]] = [array[minIdx], array[i]];
            await sleep(delay);
        }
    }
    return array;
}`
        },
        insertion: {
            title: '挿入ソート (Insertion Sort)',
            timeComplexity: 'O(n²) - 最悪・平均、O(n) - 最良',
            spaceComplexity: 'O(1)',
            stable: '安定',
            description: '未整列部分の先頭要素を、整列済み部分の適切な位置に挿入する操作を繰り返します。トランプの手札を整理する方法に似ており、小規模データやほぼソート済みデータに非常に効率的です。',
            features: [
                '✅ 小規模データ（~50要素）に非常に効率的',
                '✅ ほぼソート済みデータに最速クラス',
                '✅ オンラインアルゴリズム（データが逐次的に来ても対応可能）',
                '✅ 安定ソート',
                '✅ 適応的（データの状態に応じて性能が変わる）',
                '❌ 大規模データには不向き',
                '❌ 逆順データに弱い'
            ],
            code: `async function insertionSort(array) {
    const n = array.length;
    
    for (let i = 1; i < n; i++) {
        let key = array[i];
        let j = i - 1;
        
        // keyより大きい要素を後ろにずらす
        while (j >= 0 && array[j] > key) {
            array[j + 1] = array[j];
            j--;
            await sleep(delay);
        }
        
        // keyを適切な位置に挿入
        array[j + 1] = key;
    }
    return array;
}`
        },
        merge: {
            title: 'マージソート (Merge Sort)',
            timeComplexity: 'O(n log n) - すべてのケース',
            spaceComplexity: 'O(n)',
            stable: '安定',
            description: '配列を再帰的に半分に分割し、それぞれをソートしてからマージ（結合）します。分割統治法の典型例で、常に安定した性能を発揮します。外部ソート（メモリに収まらないデータのソート）にも使われます。',
            features: [
                '✅ 常にO(n log n)の性能保証',
                '✅ 安定ソート',
                '✅ 大規模データに適している',
                '✅ 予測可能な性能',
                '✅ 並列化しやすい',
                '❌ 追加のメモリ領域O(n)が必要',
                '❌ 小規模データにはオーバーヘッドが大きい'
            ],
            code: `async function mergeSort(array, left, right) {
    if (left < right) {
        const mid = Math.floor((left + right) / 2);
        
        // 分割
        await mergeSort(array, left, mid);
        await mergeSort(array, mid + 1, right);
        
        // 結合
        await merge(array, left, mid, right);
    }
    return array;
}

async function merge(array, left, mid, right) {
    // 左右の部分配列をマージ
    const leftArr = array.slice(left, mid + 1);
    const rightArr = array.slice(mid + 1, right + 1);
    
    let i = 0, j = 0, k = left;
    
    while (i < leftArr.length && j < rightArr.length) {
        if (leftArr[i] <= rightArr[j]) {
            array[k++] = leftArr[i++];
        } else {
            array[k++] = rightArr[j++];
        }
        await sleep(delay);
    }
    
    // 残りをコピー
    while (i < leftArr.length) array[k++] = leftArr[i++];
    while (j < rightArr.length) array[k++] = rightArr[j++];
}`
        },
        quick: {
            title: 'クイックソート (Quick Sort)',
            timeComplexity: 'O(n log n) - 平均、O(n²) - 最悪',
            spaceComplexity: 'O(log n)',
            stable: '不安定',
            description: 'ピボット要素を選び、それより小さい要素と大きい要素に分割する操作を再帰的に行います。平均的に最も高速なソートアルゴリズムの一つで、多くのプログラミング言語の標準ライブラリで採用されています。',
            features: [
                '✅ 平均的に非常に高速',
                '✅ インプレースソート（追加メモリが少ない）',
                '✅ キャッシュ効率が良い',
                '✅ 実用的に広く使われている',
                '✅ ピボット選択を工夫すると最悪ケースを回避可能',
                '❌ 最悪ケースでO(n²)になる可能性',
                '❌ 不安定ソート'
            ],
            code: `async function quickSort(array, low, high) {
    if (low < high) {
        // パーティション分割
        const pi = await partition(array, low, high);
        
        // 再帰的にソート
        await quickSort(array, low, pi - 1);
        await quickSort(array, pi + 1, high);
    }
    return array;
}

async function partition(array, low, high) {
    const pivot = array[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (array[j] < pivot) {
            i++;
            [array[i], array[j]] = [array[j], array[i]];
            await sleep(delay);
        }
    }
    
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    return i + 1;
}`
        },
        heap: {
            title: 'ヒープソート (Heap Sort)',
            timeComplexity: 'O(n log n) - すべてのケース',
            spaceComplexity: 'O(1)',
            stable: '不安定',
            description: 'ヒープデータ構造を利用したソートアルゴリズム。配列をヒープに変換してから、最大値（または最小値）を取り出す操作を繰り返します。優先度付きキューの実装にも使われる重要なデータ構造です。',
            features: [
                '✅ 常にO(n log n)の性能保証',
                '✅ インプレースソート',
                '✅ 追加メモリが不要',
                '✅ 最悪ケースでも性能が保証される',
                '✅ 優先度付きキューに応用可能',
                '❌ キャッシュ効率がやや悪い',
                '❌ 不安定ソート',
                '❌ 実装がやや複雑'
            ],
            code: `async function heapSort(array) {
    const n = array.length;
    
    // ヒープ構築（配列を再配置）
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await heapify(array, n, i);
    }
    
    // ヒープから要素を一つずつ取り出す
    for (let i = n - 1; i > 0; i--) {
        [array[0], array[i]] = [array[i], array[0]];
        await heapify(array, i, 0);
    }
    return array;
}

async function heapify(array, n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    
    if (left < n && array[left] > array[largest]) {
        largest = left;
    }
    if (right < n && array[right] > array[largest]) {
        largest = right;
    }
    
    if (largest !== i) {
        [array[i], array[largest]] = [array[largest], array[i]];
        await heapify(array, n, largest);
    }
}`
        },
        linear: {
            title: '線形探索 (Linear Search)',
            timeComplexity: 'O(n) - 最悪・平均、O(1) - 最良',
            spaceComplexity: 'O(1)',
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
            code: `async function linearSearch(array, target) {
    // 先頭から順番に探索
    for (let i = 0; i < array.length; i++) {
        if (array[i] === target) {
            return i; // 見つかった
        }
        await sleep(delay);
    }
    return -1; // 見つからない
}`
        },
        binary: {
            title: '二分探索 (Binary Search)',
            timeComplexity: 'O(log n) - 最悪・平均、O(1) - 最良',
            spaceComplexity: 'O(1)',
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
            code: `async function binarySearch(array, target) {
    let left = 0;
    let right = array.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        if (array[mid] === target) {
            return mid; // 見つかった
        }
        
        // 探索範囲を半分に
        if (array[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
        await sleep(delay);
    }
    return -1; // 見つからない
}`
        },
        jump: {
            title: 'ジャンプ探索 (Jump Search)',
            timeComplexity: 'O(√n) - 最悪・平均',
            spaceComplexity: 'O(1)',
            stable: 'N/A',
            description: 'ソート済み配列を√n個の要素ずつジャンプして範囲を特定し、その範囲内で線形探索します。線形探索と二分探索の中間的な性能を持ちます。',
            features: [
                '✅ 線形探索より高速',
                '✅ 二分探索より実装が簡単',
                '✅ バックトラックが不要',
                '✅ キャッシュフレンドリー',
                '❌ ソート済み配列が必要',
                '❌ 二分探索より遅い'
            ],
            code: `async function jumpSearch(array, target) {
    const n = array.length;
    const jump = Math.floor(Math.sqrt(n));
    let prev = 0;
    
    // ジャンプして範囲を見つける
    while (array[Math.min(jump, n) - 1] < target) {
        prev = jump;
        jump += Math.floor(Math.sqrt(n));
        if (prev >= n) return -1;
    }
    
    // 範囲内で線形探索
    for (let i = prev; i < Math.min(jump, n); i++) {
        if (array[i] === target) {
            return i;
        }
        await sleep(delay);
    }
    return -1;
}`
        }
    };
    
    const info = descriptions[currentAlgorithm];
    if (!info) return;
    
    // アルゴリズム情報を更新
    const descriptionDiv = document.getElementById('algorithm-description');
    descriptionDiv.innerHTML = `
        <h3>${info.title}</h3>
        <p><strong>⏱️ 時間計算量:</strong> ${info.timeComplexity}</p>
        <p><strong>💾 空間計算量:</strong> ${info.spaceComplexity}</p>
        <p><strong>🔄 安定性:</strong> ${info.stable}</p>
        <p><strong>📝 説明:</strong> ${info.description}</p>
        <p><strong>✨ 特徴:</strong></p>
        <ul>
            ${info.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
    `;
    
    // コード例を更新
    const codeExample = document.getElementById('code-example');
    codeExample.innerHTML = `<code>${escapeHtml(info.code)}</code>`;
}

/**
 * HTMLエスケープ
 */
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

// ==========================================
// 初期化処理
// ==========================================
generateArray();
updateAlgorithmInfo();

console.log('🎉 Algorithm Visualizer が起動しました！');
console.log('💡 各アルゴリズムを選んで、リアルタイムで動作を確認できます！');