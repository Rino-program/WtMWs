// Morse Code - モールス信号変換器

const MORSE_CODE = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
    "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
    '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
};

const REVERSE_MORSE = Object.fromEntries(
    Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
);

let mode = 'text-to-morse';
let audioContext = null;
let isPlaying = false;
let currentOutput = '';

// DOM要素
const inputEl = document.getElementById('input');
const outputEl = document.getElementById('output');
const inputLabelEl = document.getElementById('inputLabel');
const convertBtn = document.getElementById('convertBtn');
const playBtn = document.getElementById('playBtn');
const copyBtn = document.getElementById('copyBtn');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const visualMorse = document.getElementById('visualMorse');
const referenceGrid = document.getElementById('referenceGrid');
const tabs = document.querySelectorAll('.tab');

// 初期化
init();

function init() {
    generateReference();
    setupEventListeners();
}

function generateReference() {
    referenceGrid.innerHTML = '';
    Object.entries(MORSE_CODE).forEach(([char, morse]) => {
        const item = document.createElement('div');
        item.className = 'ref-item';
        item.innerHTML = `
            <div class="ref-char">${char}</div>
            <div class="ref-morse">${morse}</div>
        `;
        referenceGrid.appendChild(item);
    });
}

function setupEventListeners() {
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            mode = tab.dataset.mode;
            updatePlaceholder();
            inputEl.value = '';
            outputEl.textContent = '';
            visualMorse.innerHTML = '';
            playBtn.disabled = true;
        });
    });

    convertBtn.addEventListener('click', convert);
    playBtn.addEventListener('click', togglePlay);
    copyBtn.addEventListener('click', copyOutput);
    speedSlider.addEventListener('input', () => {
        speedValue.textContent = speedSlider.value;
    });
    inputEl.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'Enter') convert();
    });
}

function updatePlaceholder() {
    if (mode === 'text-to-morse') {
        inputEl.placeholder = 'Hello World';
        inputLabelEl.textContent = 'テキストを入力';
    } else {
        inputEl.placeholder = '.... . .-.. .-.. --- / .-- --- .-. .-.. -..';
        inputLabelEl.textContent = 'モールス信号を入力（スペースで区切り、/で単語区切り）';
    }
}

function convert() {
    const input = inputEl.value.trim();
    if (!input) return;

    if (mode === 'text-to-morse') {
        currentOutput = textToMorse(input);
    } else {
        currentOutput = morseToText(input);
    }

    outputEl.textContent = currentOutput;
    if (mode === 'text-to-morse') {
        visualizeMorse(currentOutput);
        playBtn.disabled = false;
    } else {
        visualMorse.innerHTML = '<span style="color:#888">テキスト出力時は視覚化なし</span>';
        playBtn.disabled = true;
    }
}

function textToMorse(text) {
    return text.toUpperCase().split('').map(char => {
        if (char === ' ') return '/';
        return MORSE_CODE[char] || '';
    }).filter(m => m).join(' ');
}

function morseToText(morse) {
    return morse.split(' / ').map(word => {
        return word.split(' ').map(code => {
            return REVERSE_MORSE[code] || '';
        }).join('');
    }).join(' ');
}

function visualizeMorse(morse) {
    visualMorse.innerHTML = '';
    const elements = [];

    morse.split('').forEach(char => {
        if (char === '.') {
            const dot = document.createElement('div');
            dot.className = 'morse-dot';
            visualMorse.appendChild(dot);
            elements.push(dot);
        } else if (char === '-') {
            const dash = document.createElement('div');
            dash.className = 'morse-dash';
            visualMorse.appendChild(dash);
            elements.push(dash);
        } else if (char === ' ') {
            const space = document.createElement('div');
            space.className = 'morse-space';
            visualMorse.appendChild(space);
        } else if (char === '/') {
            const space = document.createElement('div');
            space.className = 'morse-word-space';
            visualMorse.appendChild(space);
        }
    });

    return elements;
}

async function togglePlay() {
    if (isPlaying) {
        isPlaying = false;
        playBtn.textContent = '▶ 再生';
        playBtn.classList.remove('playing');
        return;
    }

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    isPlaying = true;
    playBtn.textContent = '⏹ 停止';
    playBtn.classList.add('playing');

    const wpm = parseInt(speedSlider.value);
    const dotDuration = 1200 / wpm;
    const dashDuration = dotDuration * 3;
    const symbolGap = dotDuration;
    const letterGap = dotDuration * 3;
    const wordGap = dotDuration * 7;

    const visualElements = visualMorse.querySelectorAll('.morse-dot, .morse-dash');
    let visualIndex = 0;

    for (let i = 0; i < currentOutput.length && isPlaying; i++) {
        const char = currentOutput[i];

        if (char === '.') {
            if (visualElements[visualIndex]) {
                visualElements[visualIndex].classList.add('active');
            }
            await playTone(dotDuration);
            if (visualElements[visualIndex]) {
                visualElements[visualIndex].classList.remove('active');
            }
            visualIndex++;
            await sleep(symbolGap);
        } else if (char === '-') {
            if (visualElements[visualIndex]) {
                visualElements[visualIndex].classList.add('active');
            }
            await playTone(dashDuration);
            if (visualElements[visualIndex]) {
                visualElements[visualIndex].classList.remove('active');
            }
            visualIndex++;
            await sleep(symbolGap);
        } else if (char === ' ') {
            await sleep(letterGap);
        } else if (char === '/') {
            await sleep(wordGap);
        }
    }

    isPlaying = false;
    playBtn.textContent = '▶ 再生';
    playBtn.classList.remove('playing');
}

function playTone(duration) {
    return new Promise(resolve => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = 600;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration / 1000);

        setTimeout(resolve, duration);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function copyOutput() {
    if (!currentOutput) return;
    try {
        await navigator.clipboard.writeText(currentOutput);
        copyBtn.textContent = '✓ コピー済';
        setTimeout(() => {
            copyBtn.textContent = '📋 コピー';
        }, 2000);
    } catch (err) {
        console.error('Copy failed:', err);
    }
}
