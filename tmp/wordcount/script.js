// DOM要素の取得
const textInput = document.getElementById('textInput');
const charWithSpaces = document.getElementById('charWithSpaces');
const charWithoutSpaces = document.getElementById('charWithoutSpaces');
const wordCount = document.getElementById('wordCount');
const lineCount = document.getElementById('lineCount');
const paragraphCount = document.getElementById('paragraphCount');
const readingTime = document.getElementById('readingTime');
const wordRanking = document.getElementById('wordRanking');
const searchText = document.getElementById('searchText');
const replaceText = document.getElementById('replaceText');
const highlightBtn = document.getElementById('highlightBtn');
const replaceBtn = document.getElementById('replaceBtn');
const replaceAllBtn = document.getElementById('replaceAllBtn');
const clearHighlightBtn = document.getElementById('clearHighlightBtn');
const searchResult = document.getElementById('searchResult');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

// 統計情報を更新
function updateStats() {
    const text = textInput.value;
    
    // 文字数（スペース含む）
    charWithSpaces.textContent = text.length.toLocaleString();
    
    // 文字数（スペース除く）
    const textWithoutSpaces = text.replace(/\s/g, '');
    charWithoutSpaces.textContent = textWithoutSpaces.length.toLocaleString();
    
    // 単語数（日本語と英語の両方に対応）
    const words = countWords(text);
    wordCount.textContent = words.toLocaleString();
    
    // 行数
    const lines = text ? text.split('\n').length : 0;
    lineCount.textContent = lines.toLocaleString();
    
    // 段落数（空行で区切られた段落）
    const paragraphs = countParagraphs(text);
    paragraphCount.textContent = paragraphs.toLocaleString();
    
    // 読了時間（日本語は400文字/分、英語は200単語/分として計算）
    const time = calculateReadingTime(text);
    readingTime.textContent = time;
    
    // 頻出単語ランキング
    updateWordRanking(text);
}

// 単語数をカウント
function countWords(text) {
    if (!text.trim()) return 0;
    
    // 英単語をカウント
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    
    // 日本語の文字をカウント（漢字、ひらがな、カタカナ）
    const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || [];
    
    // 数字をカウント
    const numbers = text.match(/\d+/g) || [];
    
    return englishWords.length + japaneseChars.length + numbers.length;
}

// 段落数をカウント
function countParagraphs(text) {
    if (!text.trim()) return 0;
    
    // 連続する改行で分割し、空でないものをカウント
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    return paragraphs.length || (text.trim() ? 1 : 0);
}

// 読了時間を計算
function calculateReadingTime(text) {
    if (!text.trim()) return '0分';
    
    // 日本語文字数
    const japaneseChars = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
    
    // 英単語数
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    // 日本語は400文字/分、英語は200単語/分
    const japaneseTime = japaneseChars / 400;
    const englishTime = englishWords / 200;
    
    const totalMinutes = japaneseTime + englishTime;
    
    if (totalMinutes < 1) {
        const seconds = Math.ceil(totalMinutes * 60);
        return `${seconds}秒`;
    } else if (totalMinutes < 60) {
        return `${Math.ceil(totalMinutes)}分`;
    } else {
        const hours = Math.floor(totalMinutes / 60);
        const mins = Math.ceil(totalMinutes % 60);
        return `${hours}時間${mins}分`;
    }
}

// 頻出単語ランキングを更新
function updateWordRanking(text) {
    if (!text.trim()) {
        wordRanking.innerHTML = '<p class="no-data">テキストを入力してください</p>';
        return;
    }
    
    const wordFreq = {};
    
    // 英単語を抽出（2文字以上）
    const englishWords = text.toLowerCase().match(/[a-zA-Z]{2,}/g) || [];
    englishWords.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 日本語の単語を簡易的に抽出（連続する漢字、カタカナ）
    const kanjiWords = text.match(/[\u4E00-\u9FAF]{2,}/g) || [];
    kanjiWords.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const katakanaWords = text.match(/[\u30A0-\u30FF]{2,}/g) || [];
    katakanaWords.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 頻度でソート
    const sorted = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sorted.length === 0) {
        wordRanking.innerHTML = '<p class="no-data">単語が見つかりません</p>';
        return;
    }
    
    wordRanking.innerHTML = sorted.map((entry, index) => {
        const [word, count] = entry;
        let rankClass = '';
        if (index === 0) rankClass = 'gold';
        else if (index === 1) rankClass = 'silver';
        else if (index === 2) rankClass = 'bronze';
        
        return `
            <div class="ranking-item">
                <span class="rank-number ${rankClass}">${index + 1}</span>
                <span class="rank-word">${escapeHtml(word)}</span>
                <span class="rank-count">${count}回</span>
            </div>
        `;
    }).join('');
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 検索結果のハイライト
let originalText = '';
let isHighlighted = false;

highlightBtn.addEventListener('click', () => {
    const search = searchText.value;
    if (!search) {
        searchResult.textContent = '検索文字列を入力してください';
        return;
    }
    
    const text = textInput.value;
    const regex = new RegExp(escapeRegex(search), 'gi');
    const matches = text.match(regex);
    
    if (matches) {
        searchResult.textContent = `${matches.length}件見つかりました`;
        searchResult.style.color = '#4facfe';
    } else {
        searchResult.textContent = '見つかりませんでした';
        searchResult.style.color = '#ff6b6b';
    }
});

// 単一置換
replaceBtn.addEventListener('click', () => {
    const search = searchText.value;
    const replace = replaceText.value;
    
    if (!search) {
        searchResult.textContent = '検索文字列を入力してください';
        return;
    }
    
    const text = textInput.value;
    const regex = new RegExp(escapeRegex(search), 'i');
    
    if (regex.test(text)) {
        textInput.value = text.replace(regex, replace);
        searchResult.textContent = '1件置換しました';
        searchResult.style.color = '#4facfe';
        updateStats();
    } else {
        searchResult.textContent = '見つかりませんでした';
        searchResult.style.color = '#ff6b6b';
    }
});

// すべて置換
replaceAllBtn.addEventListener('click', () => {
    const search = searchText.value;
    const replace = replaceText.value;
    
    if (!search) {
        searchResult.textContent = '検索文字列を入力してください';
        return;
    }
    
    const text = textInput.value;
    const regex = new RegExp(escapeRegex(search), 'gi');
    const matches = text.match(regex);
    
    if (matches) {
        textInput.value = text.replace(regex, replace);
        searchResult.textContent = `${matches.length}件置換しました`;
        searchResult.style.color = '#4facfe';
        updateStats();
    } else {
        searchResult.textContent = '見つかりませんでした';
        searchResult.style.color = '#ff6b6b';
    }
});

// ハイライトクリア
clearHighlightBtn.addEventListener('click', () => {
    searchText.value = '';
    replaceText.value = '';
    searchResult.textContent = '';
});

// 正規表現の特殊文字をエスケープ
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// コピーボタン
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(textInput.value);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ コピーしました';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    } catch (err) {
        // フォールバック
        textInput.select();
        document.execCommand('copy');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓ コピーしました';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }
});

// クリアボタン
clearBtn.addEventListener('click', () => {
    if (textInput.value && !confirm('テキストをクリアしますか？')) {
        return;
    }
    textInput.value = '';
    searchText.value = '';
    replaceText.value = '';
    searchResult.textContent = '';
    updateStats();
});

// リアルタイム更新（デバウンス処理）
let debounceTimer;
textInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateStats, 100);
});

// 初期化
updateStats();

// ローカルストレージに保存
textInput.addEventListener('input', () => {
    localStorage.setItem('wordCounterText', textInput.value);
});

// ページ読み込み時に復元
window.addEventListener('load', () => {
    const savedText = localStorage.getItem('wordCounterText');
    if (savedText) {
        textInput.value = savedText;
        updateStats();
    }
});
