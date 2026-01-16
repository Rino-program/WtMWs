// Word lists
const words = {
    ja: {
        easy: [
            { word: 'りんご', hint: '赤い果物' },
            { word: 'みかん', hint: 'オレンジ色の柑橘類' },
            { word: 'ねこ', hint: 'ニャーと鳴く動物' },
            { word: 'いぬ', hint: 'ワンと鳴く動物' },
            { word: 'そら', hint: '上を見上げると見える' },
            { word: 'うみ', hint: '塩辛い水がある場所' },
            { word: 'やま', hint: '高くそびえる自然' },
            { word: 'かわ', hint: '水が流れる場所' },
            { word: 'ほし', hint: '夜空に輝く' },
            { word: 'つき', hint: '夜に見える丸いもの' },
            { word: 'はな', hint: '美しく咲く植物' },
            { word: 'とり', hint: '空を飛ぶ動物' },
            { word: 'さる', hint: '木登りが得意' },
            { word: 'くも', hint: '空に浮かぶ白いもの' },
            { word: 'ゆき', hint: '冬に空から降る' }
        ],
        medium: [
            { word: 'さくら', hint: '春に咲くピンクの花' },
            { word: 'たいよう', hint: '昼間の空に輝く' },
            { word: 'でんわ', hint: '話すための機械' },
            { word: 'くるま', hint: '道路を走る乗り物' },
            { word: 'がっこう', hint: '勉強する場所' },
            { word: 'ともだち', hint: '一緒に遊ぶ人' },
            { word: 'おんがく', hint: '耳で楽しむ芸術' },
            { word: 'えいが', hint: '映画館で見るもの' },
            { word: 'りょうり', hint: '食べ物を作ること' },
            { word: 'しんぶん', hint: 'ニュースが載っている' },
            { word: 'びょういん', hint: '病気の時に行く場所' },
            { word: 'としょかん', hint: '本を借りる場所' },
            { word: 'コンピュータ', hint: '情報処理機器' },
            { word: 'アイスクリーム', hint: '冷たくて甘いお菓子' },
            { word: 'チョコレート', hint: 'カカオから作るお菓子' }
        ],
        hard: [
            { word: 'プログラミング', hint: 'コードを書くこと' },
            { word: 'インターネット', hint: '世界をつなぐネットワーク' },
            { word: 'スマートフォン', hint: '携帯電話の一種' },
            { word: 'コミュニケーション', hint: '意思疎通すること' },
            { word: 'エンターテイメント', hint: '娯楽のこと' },
            { word: 'レストラン', hint: '食事をする店' },
            { word: 'アパートメント', hint: '集合住宅' },
            { word: 'ボランティア', hint: '無償で社会貢献' },
            { word: 'カレンダー', hint: '日付を確認するもの' },
            { word: 'エレベーター', hint: '上下に移動する箱' }
        ]
    },
    en: {
        easy: [
            { word: 'cat', hint: 'A furry pet that meows' },
            { word: 'dog', hint: 'A loyal pet that barks' },
            { word: 'sun', hint: 'Bright star in the sky' },
            { word: 'moon', hint: 'Shines at night' },
            { word: 'tree', hint: 'Has leaves and branches' },
            { word: 'book', hint: 'You read this' },
            { word: 'fish', hint: 'Lives in water' },
            { word: 'bird', hint: 'Can fly in the sky' },
            { word: 'star', hint: 'Twinkles at night' },
            { word: 'rain', hint: 'Falls from clouds' },
            { word: 'snow', hint: 'Cold and white' },
            { word: 'love', hint: 'Deep affection' },
            { word: 'home', hint: 'Where you live' },
            { word: 'food', hint: 'You eat this' },
            { word: 'game', hint: 'Fun activity' }
        ],
        medium: [
            { word: 'apple', hint: 'Red or green fruit' },
            { word: 'water', hint: 'Essential liquid for life' },
            { word: 'music', hint: 'Sounds that are pleasant' },
            { word: 'happy', hint: 'Feeling of joy' },
            { word: 'world', hint: 'The planet we live on' },
            { word: 'phone', hint: 'Device for calling' },
            { word: 'dream', hint: 'Images during sleep' },
            { word: 'smile', hint: 'Expression of happiness' },
            { word: 'friend', hint: 'Someone you trust' },
            { word: 'school', hint: 'Place for learning' },
            { word: 'flower', hint: 'Beautiful plant' },
            { word: 'orange', hint: 'Citrus fruit' },
            { word: 'purple', hint: 'Color of royalty' },
            { word: 'nature', hint: 'The natural world' },
            { word: 'garden', hint: 'Where plants grow' }
        ],
        hard: [
            { word: 'computer', hint: 'Electronic device' },
            { word: 'beautiful', hint: 'Pleasing to look at' },
            { word: 'adventure', hint: 'Exciting journey' },
            { word: 'knowledge', hint: 'Information learned' },
            { word: 'happiness', hint: 'State of being happy' },
            { word: 'chocolate', hint: 'Sweet brown treat' },
            { word: 'challenge', hint: 'Difficult task' },
            { word: 'butterfly', hint: 'Colorful flying insect' },
            { word: 'wonderful', hint: 'Extremely good' },
            { word: 'delicious', hint: 'Very tasty' },
            { word: 'impossible', hint: 'Cannot be done' },
            { word: 'mysterious', hint: 'Strange and unknown' }
        ]
    }
};

// UI Text translations
const uiText = {
    ja: {
        title: '単語スクランブル',
        language: '言語 / Language:',
        difficulty: '難易度:',
        easy: '簡単 (3-4文字)',
        medium: '普通 (5-6文字)',
        hard: '難しい (7文字以上)',
        timerEnabled: 'タイマー有効',
        score: 'スコア',
        streak: '連続正解',
        bestStreak: '最高連続',
        timeLeft: '残り時間:',
        seconds: '秒',
        start: 'スタート',
        hint: 'ヒント',
        skip: 'スキップ',
        placeholder: '答えを入力...',
        pressStart: 'スタートを押してね',
        correct: '正解！ 🎉',
        wrong: '不正解... もう一度！',
        skipped: 'スキップしました。答え: ',
        hintUsed: 'ヒント: 最初の文字は「',
        hintEnd: '」',
        timeUp: '時間切れ！ 答え: ',
        gameOver: 'ゲームオーバー！ 最終スコア: '
    },
    en: {
        title: 'Word Scramble',
        language: 'Language / 言語:',
        difficulty: 'Difficulty:',
        easy: 'Easy (3-4 letters)',
        medium: 'Medium (5-6 letters)',
        hard: 'Hard (7+ letters)',
        timerEnabled: 'Timer enabled',
        score: 'Score',
        streak: 'Streak',
        bestStreak: 'Best',
        timeLeft: 'Time left:',
        seconds: 's',
        start: 'Start',
        hint: 'Hint',
        skip: 'Skip',
        placeholder: 'Enter your answer...',
        pressStart: 'Press Start to play',
        correct: 'Correct! 🎉',
        wrong: 'Wrong... Try again!',
        skipped: 'Skipped. Answer: ',
        hintUsed: 'Hint: First letter is "',
        hintEnd: '"',
        timeUp: 'Time\'s up! Answer: ',
        gameOver: 'Game Over! Final score: '
    }
};

// Game state
let currentWord = null;
let currentLanguage = 'ja';
let currentDifficulty = 'medium';
let score = 0;
let streak = 0;
let bestStreak = 0;
let hintUsed = false;
let gameActive = false;
let timerEnabled = false;
let timerDuration = 60;
let timeLeft = 60;
let timerInterval = null;

// DOM Elements
const titleEl = document.getElementById('title');
const languageSelect = document.getElementById('language');
const difficultySelect = document.getElementById('difficulty');
const timerToggle = document.getElementById('timerToggle');
const timerDurationSelect = document.getElementById('timerDuration');
const timerDisplay = document.getElementById('timerDisplay');
const timerEl = document.getElementById('timer');
const scrambledWordEl = document.getElementById('scrambledWord');
const hintAreaEl = document.getElementById('hintArea');
const hintTextEl = document.getElementById('hintText');
const answerInput = document.getElementById('answerInput');
const startBtn = document.getElementById('startBtn');
const hintBtn = document.getElementById('hintBtn');
const skipBtn = document.getElementById('skipBtn');
const messageEl = document.getElementById('message');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const bestStreakEl = document.getElementById('bestStreak');

// Initialize
function init() {
    loadFromStorage();
    updateUI();
    setupEventListeners();
}

// Load saved data from localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('scrambleGame');
    if (saved) {
        const data = JSON.parse(saved);
        bestStreak = data.bestStreak || 0;
        currentLanguage = data.language || 'ja';
        currentDifficulty = data.difficulty || 'medium';
        timerEnabled = data.timerEnabled || false;
        timerDuration = data.timerDuration || 60;
    }
    
    languageSelect.value = currentLanguage;
    difficultySelect.value = currentDifficulty;
    timerToggle.checked = timerEnabled;
    timerDurationSelect.value = timerDuration;
    bestStreakEl.textContent = bestStreak;
}

// Save data to localStorage
function saveToStorage() {
    localStorage.setItem('scrambleGame', JSON.stringify({
        bestStreak,
        language: currentLanguage,
        difficulty: currentDifficulty,
        timerEnabled,
        timerDuration
    }));
}

// Setup event listeners
function setupEventListeners() {
    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateUI();
        saveToStorage();
    });
    
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        saveToStorage();
    });
    
    timerToggle.addEventListener('change', (e) => {
        timerEnabled = e.target.checked;
        timerDisplay.classList.toggle('active', timerEnabled && gameActive);
        saveToStorage();
    });
    
    timerDurationSelect.addEventListener('change', (e) => {
        timerDuration = parseInt(e.target.value);
        timeLeft = timerDuration;
        timerEl.textContent = timeLeft;
        saveToStorage();
    });
    
    startBtn.addEventListener('click', startGame);
    hintBtn.addEventListener('click', showHint);
    skipBtn.addEventListener('click', skipWord);
    
    answerInput.addEventListener('input', checkAnswer);
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
}

// Update UI text based on language
function updateUI() {
    const text = uiText[currentLanguage];
    
    titleEl.textContent = text.title;
    document.querySelector('label[for="language"]').textContent = text.language;
    document.querySelector('label[for="difficulty"]').textContent = text.difficulty;
    
    const diffOptions = difficultySelect.options;
    diffOptions[0].textContent = text.easy;
    diffOptions[1].textContent = text.medium;
    diffOptions[2].textContent = text.hard;
    
    document.querySelector('label[for="timerToggle"]').innerHTML = 
        `<input type="checkbox" id="timerToggle" ${timerEnabled ? 'checked' : ''}> ${text.timerEnabled}`;
    
    // Re-attach timer toggle listener
    document.getElementById('timerToggle').addEventListener('change', (e) => {
        timerEnabled = e.target.checked;
        timerDisplay.classList.toggle('active', timerEnabled && gameActive);
        saveToStorage();
    });
    
    document.getElementById('scoreLabel').textContent = text.score;
    document.getElementById('streakLabel').textContent = text.streak;
    document.getElementById('bestStreakLabel').textContent = text.bestStreak;
    document.getElementById('timerLabel').textContent = text.timeLeft;
    document.getElementById('timerUnit').textContent = text.seconds;
    
    startBtn.textContent = text.start;
    hintBtn.textContent = text.hint;
    skipBtn.textContent = text.skip;
    answerInput.placeholder = text.placeholder;
    
    if (!gameActive) {
        scrambledWordEl.textContent = text.pressStart;
    }
}

// Scramble a word
function scrambleWord(word) {
    const chars = word.split('');
    let scrambled;
    
    // Keep scrambling until it's different from original
    do {
        for (let i = chars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [chars[i], chars[j]] = [chars[j], chars[i]];
        }
        scrambled = chars.join('');
    } while (scrambled === word && word.length > 1);
    
    return scrambled;
}

// Get a random word
function getRandomWord() {
    const wordList = words[currentLanguage][currentDifficulty];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}

// Start game
function startGame() {
    gameActive = true;
    score = 0;
    streak = 0;
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    
    answerInput.disabled = false;
    hintBtn.disabled = false;
    skipBtn.disabled = false;
    startBtn.textContent = uiText[currentLanguage].start;
    
    if (timerEnabled) {
        timerDisplay.classList.add('active');
    }
    
    nextWord();
    answerInput.focus();
}

// Load next word
function nextWord() {
    currentWord = getRandomWord();
    hintUsed = false;
    hintTextEl.textContent = '';
    messageEl.textContent = '';
    messageEl.className = 'message';
    answerInput.value = '';
    
    const scrambled = scrambleWord(currentWord.word);
    scrambledWordEl.textContent = scrambled;
    scrambledWordEl.classList.add('bounce');
    setTimeout(() => scrambledWordEl.classList.remove('bounce'), 300);
    
    if (timerEnabled) {
        startTimer();
    }
}

// Start timer
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = timerDuration;
    timerEl.textContent = timeLeft;
    timerDisplay.classList.remove('warning');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        
        if (timeLeft <= 10) {
            timerDisplay.classList.add('warning');
        }
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            handleTimeout();
        }
    }, 1000);
}

// Handle timeout
function handleTimeout() {
    const text = uiText[currentLanguage];
    showMessage(text.timeUp + currentWord.word, 'wrong');
    streak = 0;
    streakEl.textContent = streak;
    
    setTimeout(() => {
        if (gameActive) {
            nextWord();
        }
    }, 2000);
}

// Check answer
function checkAnswer() {
    if (!gameActive || !currentWord) return;
    
    const answer = answerInput.value.trim().toLowerCase();
    const correct = currentWord.word.toLowerCase();
    
    if (answer === correct) {
        handleCorrect();
    }
}

// Handle correct answer
function handleCorrect() {
    clearInterval(timerInterval);
    const text = uiText[currentLanguage];
    
    // Calculate score (more points for no hint, faster time)
    let points = 10;
    if (!hintUsed) points += 5;
    if (timerEnabled && timeLeft > timerDuration / 2) points += 5;
    
    score += points;
    streak++;
    
    if (streak > bestStreak) {
        bestStreak = streak;
        bestStreakEl.textContent = bestStreak;
        saveToStorage();
    }
    
    scoreEl.textContent = score;
    scoreEl.classList.add('bounce');
    setTimeout(() => scoreEl.classList.remove('bounce'), 300);
    
    streakEl.textContent = streak;
    
    showMessage(text.correct, 'correct');
    
    setTimeout(() => {
        nextWord();
    }, 1000);
}

// Show hint
function showHint() {
    if (!currentWord || hintUsed) return;
    
    hintUsed = true;
    const text = uiText[currentLanguage];
    const firstChar = currentWord.word.charAt(0);
    hintTextEl.textContent = text.hintUsed + firstChar + text.hintEnd + ' - ' + currentWord.hint;
    hintBtn.disabled = true;
}

// Skip word
function skipWord() {
    if (!currentWord) return;
    
    clearInterval(timerInterval);
    const text = uiText[currentLanguage];
    showMessage(text.skipped + currentWord.word, 'info');
    streak = 0;
    streakEl.textContent = streak;
    
    setTimeout(() => {
        nextWord();
        hintBtn.disabled = false;
    }, 1500);
}

// Show message
function showMessage(msg, type) {
    messageEl.textContent = msg;
    messageEl.className = 'message ' + type;
    
    if (type === 'wrong') {
        answerInput.classList.add('shake');
        setTimeout(() => answerInput.classList.remove('shake'), 300);
    }
}

// Initialize game
init();
