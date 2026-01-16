// Word data with categories and hints
const wordData = {
    animals: [
        { word: 'elephant', hint: '長い鼻を持つ大きな灰色の動物' },
        { word: 'giraffe', hint: '首がとても長い動物' },
        { word: 'penguin', hint: '飛べない鳥、南極に住む' },
        { word: 'dolphin', hint: '海に住む賢い哺乳類' },
        { word: 'kangaroo', hint: 'お腹の袋で子供を育てる' },
        { word: 'butterfly', hint: '美しい羽を持つ昆虫' },
        { word: 'crocodile', hint: '大きな口と鋭い歯を持つ爬虫類' },
        { word: 'octopus', hint: '8本の足を持つ海の生き物' },
        { word: 'squirrel', hint: '木の実を集めるふわふわの尾を持つ動物' },
        { word: 'flamingo', hint: 'ピンク色の長い足の鳥' }
    ],
    food: [
        { word: 'hamburger', hint: 'パンに挟まれた肉料理' },
        { word: 'spaghetti', hint: 'イタリアの細長い麺料理' },
        { word: 'chocolate', hint: 'カカオから作られる甘いお菓子' },
        { word: 'pineapple', hint: 'とげとげの外見の熱帯果物' },
        { word: 'strawberry', hint: '赤くて小さな種が外側にある果物' },
        { word: 'sandwich', hint: 'パンで具材を挟んだ食べ物' },
        { word: 'broccoli', hint: '緑色の木のような野菜' },
        { word: 'mushroom', hint: '傘の形をしたキノコ' },
        { word: 'avocado', hint: 'クリーミーな緑色の果物' },
        { word: 'watermelon', hint: '夏に人気の大きな緑と赤の果物' }
    ],
    countries: [
        { word: 'australia', hint: 'カンガルーとコアラの国' },
        { word: 'brazil', hint: 'サッカーとカーニバルで有名な南米の国' },
        { word: 'canada', hint: 'メープルシロップで有名な北米の国' },
        { word: 'germany', hint: 'ビールとソーセージで有名なヨーロッパの国' },
        { word: 'thailand', hint: '微笑みの国と呼ばれる東南アジアの国' },
        { word: 'argentina', hint: 'タンゴの発祥地' },
        { word: 'egypt', hint: 'ピラミッドとスフィンクスがある国' },
        { word: 'sweden', hint: 'オーロラが見られる北欧の国' },
        { word: 'mexico', hint: 'タコスとマリアッチで有名な国' },
        { word: 'vietnam', hint: 'フォーが有名な東南アジアの国' }
    ],
    sports: [
        { word: 'basketball', hint: 'オレンジ色のボールをゴールに入れるスポーツ' },
        { word: 'swimming', hint: '水の中で行うスポーツ' },
        { word: 'volleyball', hint: 'ネット越しにボールを打ち合うスポーツ' },
        { word: 'badminton', hint: 'シャトルを使うラケットスポーツ' },
        { word: 'gymnastics', hint: '体操競技' },
        { word: 'wrestling', hint: '相手を倒す格闘技' },
        { word: 'snowboard', hint: '雪山で板に乗って滑るスポーツ' },
        { word: 'archery', hint: '弓と矢を使うスポーツ' },
        { word: 'fencing', hint: '剣を使う競技' },
        { word: 'marathon', hint: '42.195kmを走る競技' }
    ],
    colors: [
        { word: 'turquoise', hint: '青と緑の中間色' },
        { word: 'crimson', hint: '深い赤色' },
        { word: 'lavender', hint: '薄い紫色、花の名前でもある' },
        { word: 'magenta', hint: '赤紫色、印刷でよく使われる' },
        { word: 'burgundy', hint: 'ワインのような深い赤紫色' },
        { word: 'chartreuse', hint: '黄緑色、フランスのリキュールの名前' },
        { word: 'sapphire', hint: '宝石の名前でもある青色' },
        { word: 'emerald', hint: '宝石の名前でもある緑色' },
        { word: 'coral', hint: '海の生き物の名前でもあるオレンジピンク' },
        { word: 'indigo', hint: '藍色、虹の7色の一つ' }
    ]
};

// Game state
let currentWord = '';
let currentHint = '';
let guessedLetters = [];
let wrongGuesses = 0;
let maxWrong = 6;
let gameOver = false;
let hintUsed = false;

// Stats
let stats = {
    wins: 0,
    losses: 0,
    streak: 0
};

// DOM Elements
const wordDisplay = document.getElementById('word-display');
const keyboard = document.getElementById('keyboard');
const hintBtn = document.getElementById('hint-btn');
const hintText = document.getElementById('hint-text');
const newGameBtn = document.getElementById('new-game-btn');
const categorySelect = document.getElementById('category');
const livesDisplay = document.getElementById('lives');
const message = document.getElementById('message');
const modal = document.getElementById('modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalWord = document.getElementById('modal-word');
const modalBtn = document.getElementById('modal-btn');
const winsDisplay = document.getElementById('wins');
const lossesDisplay = document.getElementById('losses');
const streakDisplay = document.getElementById('streak');

// Body parts for hangman
const bodyParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];

// Initialize
function init() {
    loadStats();
    createKeyboard();
    startNewGame();
    
    // Event listeners
    hintBtn.addEventListener('click', showHint);
    newGameBtn.addEventListener('click', startNewGame);
    categorySelect.addEventListener('change', startNewGame);
    modalBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        startNewGame();
    });
    
    // Keyboard input
    document.addEventListener('keydown', handleKeyPress);
}

// Load stats from localStorage
function loadStats() {
    const saved = localStorage.getItem('hangmanStats');
    if (saved) {
        stats = JSON.parse(saved);
        updateStatsDisplay();
    }
}

// Save stats to localStorage
function saveStats() {
    localStorage.setItem('hangmanStats', JSON.stringify(stats));
    updateStatsDisplay();
}

// Update stats display
function updateStatsDisplay() {
    winsDisplay.textContent = stats.wins;
    lossesDisplay.textContent = stats.losses;
    streakDisplay.textContent = stats.streak;
}

// Create keyboard
function createKeyboard() {
    keyboard.innerHTML = '';
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    
    letters.split('').forEach(letter => {
        const btn = document.createElement('button');
        btn.className = 'key-btn';
        btn.textContent = letter;
        btn.dataset.letter = letter;
        btn.addEventListener('click', () => handleGuess(letter));
        keyboard.appendChild(btn);
    });
}

// Get random word
function getRandomWord() {
    const category = categorySelect.value;
    let wordPool = [];
    
    if (category === 'all') {
        Object.values(wordData).forEach(words => {
            wordPool = wordPool.concat(words);
        });
    } else {
        wordPool = wordData[category];
    }
    
    const randomItem = wordPool[Math.floor(Math.random() * wordPool.length)];
    return randomItem;
}

// Start new game
function startNewGame() {
    const wordItem = getRandomWord();
    currentWord = wordItem.word.toLowerCase();
    currentHint = wordItem.hint;
    guessedLetters = [];
    wrongGuesses = 0;
    gameOver = false;
    hintUsed = false;
    
    // Reset UI
    hintText.textContent = '';
    hintBtn.disabled = false;
    message.textContent = '';
    
    // Reset keyboard
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'wrong');
    });
    
    // Reset hangman
    bodyParts.forEach(part => {
        document.getElementById(part).classList.remove('visible');
    });
    
    // Update displays
    updateWordDisplay();
    updateLivesDisplay();
}

// Update word display
function updateWordDisplay() {
    wordDisplay.innerHTML = '';
    
    currentWord.split('').forEach((letter, index) => {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box';
        
        if (guessedLetters.includes(letter)) {
            letterBox.textContent = letter;
            letterBox.classList.add('revealed');
        }
        
        wordDisplay.appendChild(letterBox);
    });
}

// Update lives display
function updateLivesDisplay() {
    const remaining = maxWrong - wrongGuesses;
    const hearts = '❤️'.repeat(remaining) + '🖤'.repeat(wrongGuesses);
    livesDisplay.textContent = hearts;
}

// Handle guess
function handleGuess(letter) {
    if (gameOver || guessedLetters.includes(letter)) return;
    
    guessedLetters.push(letter);
    const btn = document.querySelector(`.key-btn[data-letter="${letter}"]`);
    btn.disabled = true;
    
    if (currentWord.includes(letter)) {
        // Correct guess
        btn.classList.add('correct');
        updateWordDisplay();
        
        // Check win
        if (checkWin()) {
            endGame(true);
        }
    } else {
        // Wrong guess
        btn.classList.add('wrong');
        wrongGuesses++;
        
        // Show body part
        if (wrongGuesses <= bodyParts.length) {
            document.getElementById(bodyParts[wrongGuesses - 1]).classList.add('visible');
        }
        
        updateLivesDisplay();
        
        // Check lose
        if (wrongGuesses >= maxWrong) {
            endGame(false);
        }
    }
}

// Handle keyboard press
function handleKeyPress(e) {
    if (gameOver) return;
    
    const letter = e.key.toLowerCase();
    if (/^[a-z]$/.test(letter) && !guessedLetters.includes(letter)) {
        handleGuess(letter);
    }
}

// Check if player won
function checkWin() {
    return currentWord.split('').every(letter => guessedLetters.includes(letter));
}

// Show hint
function showHint() {
    if (!hintUsed) {
        hintText.textContent = `💡 ${currentHint}`;
        hintUsed = true;
        hintBtn.disabled = true;
    }
}

// End game
function endGame(won) {
    gameOver = true;
    
    // Disable all keys
    document.querySelectorAll('.key-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Update stats
    if (won) {
        stats.wins++;
        stats.streak++;
        modalIcon.textContent = '🎉';
        modalTitle.textContent = 'おめでとう！';
        modalMessage.textContent = `素晴らしい！単語を当てました！`;
    } else {
        stats.losses++;
        stats.streak = 0;
        modalIcon.textContent = '😢';
        modalTitle.textContent = '残念...';
        modalMessage.textContent = 'もう一度挑戦しよう！';
        
        // Reveal the word
        currentWord.split('').forEach(letter => {
            if (!guessedLetters.includes(letter)) {
                guessedLetters.push(letter);
            }
        });
        updateWordDisplay();
    }
    
    saveStats();
    
    // Show modal
    modalWord.textContent = currentWord;
    setTimeout(() => {
        modal.classList.add('show');
    }, 500);
}

// Start the game
init();
