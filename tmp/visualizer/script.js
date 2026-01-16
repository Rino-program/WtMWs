const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 状態管理
let audioContext, analyser, source, audio;
let isPlaying = false;
let isMicActive = false;
let inputMode = 'file'; // 'file' or 'mic'
let vizMode = 'bars';
let colorTheme = 'rainbow';
let sensitivity = 1;
let barCount = 64;
let animationSpeed = 1;
let bgOpacity = 0.2;
let particles = [];
let spectrogramData = [];
let micStream, micSource;
let lastTime = 0;

// カラーテーマ定義
const colorThemes = {
    rainbow: {
        getColor: (i, total) => `hsl(${(i / total) * 360}, 80%, 60%)`,
        gradient: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#8b00ff']
    },
    neon: {
        getColor: (i, total) => {
            const colors = ['#ff00ff', '#00ffff', '#ff00ff', '#ff0099', '#00ffff'];
            return colors[i % colors.length];
        },
        gradient: ['#ff00ff', '#00ffff']
    },
    ocean: {
        getColor: (i, total) => `hsl(${200 + (i / total) * 40}, 80%, ${50 + (i / total) * 20}%)`,
        gradient: ['#0077b6', '#00b4d8', '#90e0ef']
    },
    sunset: {
        getColor: (i, total) => `hsl(${20 + (i / total) * 30}, 90%, ${50 + (i / total) * 20}%)`,
        gradient: ['#ff6b35', '#f7931e', '#ffd700']
    },
    mono: {
        getColor: (i, total) => {
            const brightness = 40 + (i / total) * 60;
            return `hsl(0, 0%, ${brightness}%)`;
        },
        gradient: ['#333333', '#ffffff']
    }
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // スペクトログラムデータをリセット
    spectrogramData = [];
}
resize();
window.addEventListener('resize', resize);

// オーディオコンテキスト初期化
function initAudio() {
    if (audioContext) return;
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
}

// 設定パネルの折りたたみ
document.getElementById('settings-toggle').addEventListener('click', () => {
    document.getElementById('settings-panel').classList.toggle('collapsed');
});

// 入力モード切替
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        setInputMode(mode);
    });
});

function setInputMode(mode) {
    inputMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('active');
    
    if (mode === 'file') {
        document.getElementById('upload-area').style.display = 'block';
        document.getElementById('upload-area').classList.remove('disabled');
        document.getElementById('mic-control').style.display = 'none';
        stopMic();
    } else {
        document.getElementById('upload-area').style.display = 'none';
        document.getElementById('mic-control').style.display = 'block';
        if (audio) {
            audio.pause();
            isPlaying = false;
        }
        document.getElementById('playback-controls').style.display = 'none';
    }
}

// ビジュアルモード切替
document.querySelectorAll('.viz-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.viz-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        vizMode = btn.dataset.mode;
        particles = [];
        spectrogramData = [];
    });
});

// カラーテーマ切替
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        colorTheme = btn.dataset.theme;
    });
});

// スライダー設定
document.getElementById('sensitivity').addEventListener('input', e => {
    sensitivity = parseFloat(e.target.value);
    document.getElementById('sensitivity-value').textContent = sensitivity.toFixed(1);
});

document.getElementById('bar-count').addEventListener('input', e => {
    barCount = parseInt(e.target.value);
    document.getElementById('bar-count-value').textContent = barCount;
});

document.getElementById('animation-speed').addEventListener('input', e => {
    animationSpeed = parseFloat(e.target.value);
    document.getElementById('animation-speed-value').textContent = animationSpeed.toFixed(1);
});

document.getElementById('bg-opacity').addEventListener('input', e => {
    bgOpacity = (100 - parseInt(e.target.value)) / 100;
    document.getElementById('bg-opacity-value').textContent = e.target.value;
});

// フルスクリーン
document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen');
        document.getElementById('fullscreen-btn').textContent = '✕ フルスクリーン解除';
    } else {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen');
        document.getElementById('fullscreen-btn').textContent = '⛶ フルスクリーン';
    }
});

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.body.classList.remove('fullscreen');
        document.getElementById('fullscreen-btn').textContent = '⛶ フルスクリーン';
    }
});

// ファイルアップロード
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');

uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.style.borderColor = '#00ff88';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(255,255,255,0.3)';
});

uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(255,255,255,0.3)';
    const file = e.dataTransfer.files[0];
    if (file) loadAudioFile(file);
});

fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) loadAudioFile(file);
});

function loadAudioFile(file) {
    initAudio();
    
    if (audio) {
        audio.pause();
        if (source) source.disconnect();
    }
    
    audio = new Audio();
    audio.src = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('duration').textContent = formatTime(audio.duration);
        document.getElementById('playback-controls').style.display = 'flex';
        document.getElementById('track-info').querySelector('h2').textContent = file.name.replace(/\.[^/.]+$/, '');
    });
    
    audio.addEventListener('timeupdate', () => {
        document.getElementById('current-time').textContent = formatTime(audio.currentTime);
        const progress = (audio.currentTime / audio.duration) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    });
    
    audio.addEventListener('ended', () => {
        isPlaying = false;
        document.getElementById('play-btn').textContent = '▶';
    });
    
    source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    uploadArea.classList.add('playing');
    audio.play();
    isPlaying = true;
    document.getElementById('play-btn').textContent = '⏸';
    
    if (isMicActive) stopMic();
}

// マイク入力
document.getElementById('mic-start-btn').addEventListener('click', async () => {
    if (isMicActive) {
        stopMic();
    } else {
        await startMic();
    }
});

async function startMic() {
    try {
        initAudio();
        
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        
        micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            }
        });
        
        micSource = audioContext.createMediaStreamSource(micStream);
        micSource.connect(analyser);
        // マイク入力は出力に接続しない（フィードバック防止）
        
        isMicActive = true;
        document.getElementById('mic-start-btn').classList.add('active');
        document.getElementById('mic-start-btn').textContent = '⏹ マイク停止';
        document.getElementById('mic-status').textContent = '🔴 録音中...';
        document.getElementById('track-info').querySelector('h2').textContent = '🎤 マイク入力中';
        document.getElementById('track-info').querySelector('p').textContent = '音声を検出しています';
        
        if (audio) {
            audio.pause();
            isPlaying = false;
        }
        document.getElementById('playback-controls').style.display = 'none';
        
    } catch (err) {
        console.error('マイクアクセスエラー:', err);
        document.getElementById('mic-status').textContent = '❌ マイクにアクセスできません';
        alert('マイクにアクセスできませんでした。\nブラウザの設定でマイクの許可を確認してください。');
    }
}

function stopMic() {
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    if (micSource) {
        micSource.disconnect();
        micSource = null;
    }
    isMicActive = false;
    document.getElementById('mic-start-btn').classList.remove('active');
    document.getElementById('mic-start-btn').textContent = '🎤 マイク開始';
    document.getElementById('mic-status').textContent = 'マイクをクリックして開始';
    document.getElementById('mic-level-bar').style.width = '0%';
    document.getElementById('track-info').querySelector('h2').textContent = '🎵 音楽ビジュアライザー';
    document.getElementById('track-info').querySelector('p').textContent = '音楽ファイルをアップロードまたはマイク入力で開始';
}

// 再生コントロール
document.getElementById('play-btn').addEventListener('click', () => {
    if (!audio) return;
    
    if (isPlaying) {
        audio.pause();
        document.getElementById('play-btn').textContent = '▶';
    } else {
        audio.play();
        document.getElementById('play-btn').textContent = '⏸';
    }
    isPlaying = !isPlaying;
});

document.getElementById('progress-bar').addEventListener('click', e => {
    if (!audio) return;
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

document.getElementById('volume').addEventListener('input', e => {
    if (audio) audio.volume = e.target.value;
    updateVolumeIcon(e.target.value);
});

document.getElementById('volume-icon').addEventListener('click', () => {
    const volumeSlider = document.getElementById('volume');
    if (audio) {
        if (audio.volume > 0) {
            audio.dataset.prevVolume = audio.volume;
            audio.volume = 0;
            volumeSlider.value = 0;
        } else {
            audio.volume = audio.dataset.prevVolume || 1;
            volumeSlider.value = audio.volume;
        }
        updateVolumeIcon(audio.volume);
    }
});

function updateVolumeIcon(volume) {
    const icon = document.getElementById('volume-icon');
    if (volume == 0) icon.textContent = '🔇';
    else if (volume < 0.5) icon.textContent = '🔉';
    else icon.textContent = '🔊';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ビジュアライザー描画
function draw(timestamp) {
    requestAnimationFrame(draw);
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // 背景（トレイル効果）
    ctx.fillStyle = `rgba(0, 0, 0, ${bgOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    // マイクレベル表示
    if (isMicActive) {
        const avgLevel = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        document.getElementById('mic-level-bar').style.width = `${(avgLevel / 255) * 100}%`;
    }
    
    switch (vizMode) {
        case 'bars': drawBars(dataArray); break;
        case 'wave': drawWave(); break;
        case 'circle': drawCircle(dataArray); break;
        case 'particles': drawParticles(dataArray, deltaTime); break;
        case 'spectrogram': drawSpectrogram(dataArray); break;
    }
}

function drawBars(dataArray) {
    const barWidth = canvas.width / barCount;
    const theme = colorThemes[colorTheme];
    
    for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * dataArray.length / barCount);
        const value = dataArray[dataIndex] * sensitivity;
        const height = (value / 255) * canvas.height * 0.8;
        
        const x = i * barWidth + 2;
        const y = canvas.height - height;
        const width = barWidth - 4;
        
        // メインバー
        ctx.fillStyle = theme.getColor(i, barCount);
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.getColor(i, barCount);
        ctx.fillRect(x, y, width, height);
        
        // 反射
        ctx.shadowBlur = 0;
        ctx.fillStyle = theme.getColor(i, barCount).replace(')', ', 0.2)').replace('hsl', 'hsla').replace('rgb', 'rgba');
        ctx.fillRect(x, canvas.height, width, height * 0.3);
    }
    ctx.shadowBlur = 0;
}

function drawWave() {
    const timeData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(timeData);
    const theme = colorThemes[colorTheme];
    
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    
    // グラデーションラインを描画
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    theme.gradient.forEach((color, i) => {
        gradient.addColorStop(i / (theme.gradient.length - 1), color);
    });
    ctx.strokeStyle = gradient;
    ctx.shadowColor = theme.gradient[0];
    
    ctx.beginPath();
    const sliceWidth = canvas.width / timeData.length;
    let x = 0;
    
    for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = (v * canvas.height / 2) * sensitivity;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        x += sliceWidth;
    }
    
    ctx.stroke();
    
    // ミラー効果
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    x = 0;
    for (let i = 0; i < timeData.length; i++) {
        const v = timeData[i] / 128.0;
        const y = canvas.height - (v * canvas.height / 2) * sensitivity;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        x += sliceWidth;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawCircle(dataArray) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.2;
    const theme = colorThemes[colorTheme];
    
    const circleBarCount = 180;
    
    for (let i = 0; i < circleBarCount; i++) {
        const dataIndex = Math.floor(i * dataArray.length / circleBarCount);
        const value = dataArray[dataIndex] * sensitivity;
        const barHeight = (value / 255) * radius;
        
        const angle = (i / circleBarCount) * Math.PI * 2 - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);
        
        ctx.strokeStyle = theme.getColor(i, circleBarCount);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        ctx.shadowColor = theme.getColor(i, circleBarCount);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // 中央の円（パルス効果）
    const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const pulseRadius = radius * 0.8 + (avgValue / 255) * 50 * sensitivity;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
    gradient.addColorStop(0, theme.gradient[0]);
    gradient.addColorStop(0.5, theme.gradient[Math.floor(theme.gradient.length / 2)] + '80');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawParticles(dataArray, deltaTime) {
    const avgValue = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const theme = colorThemes[colorTheme];
    const speedMultiplier = animationSpeed * (deltaTime / 16);
    
    // パーティクル生成
    if (avgValue > 30) {
        const particleCount = Math.floor((avgValue / 50) * animationSpeed);
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (avgValue / 10) * sensitivity;
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                vx: Math.cos(angle) * speed * (0.5 + Math.random()),
                vy: Math.sin(angle) * speed * (0.5 + Math.random()),
                size: Math.random() * 4 + 2,
                life: 1,
                colorIndex: Math.floor(Math.random() * barCount)
            });
        }
    }
    
    // パーティクル更新と描画
    particles = particles.filter(p => p.life > 0);
    
    particles.forEach(p => {
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;
        p.life -= 0.01 * speedMultiplier;
        p.size *= 0.995;
        
        ctx.fillStyle = theme.getColor(p.colorIndex, barCount).replace(')', `, ${p.life})`).replace('hsl', 'hsla');
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.getColor(p.colorIndex, barCount);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.shadowBlur = 0;
    
    // パーティクル数制限
    if (particles.length > 2000) {
        particles = particles.slice(-1000);
    }
}

function drawSpectrogram(dataArray) {
    const theme = colorThemes[colorTheme];
    const columnWidth = 2;
    
    // 新しいデータを追加
    spectrogramData.push([...dataArray]);
    
    // 画面幅を超えたら古いデータを削除
    const maxColumns = Math.ceil(canvas.width / columnWidth);
    if (spectrogramData.length > maxColumns) {
        spectrogramData.shift();
    }
    
    // スペクトログラムを描画
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let x = 0; x < spectrogramData.length; x++) {
        const column = spectrogramData[x];
        const pixelX = x * columnWidth;
        
        for (let y = 0; y < column.length; y++) {
            const value = column[y] * sensitivity;
            const normalizedValue = value / 255;
            
            if (normalizedValue > 0.05) {
                const pixelY = canvas.height - (y / column.length) * canvas.height;
                const pixelHeight = Math.max(1, canvas.height / column.length);
                
                // カラーテーマに基づいた色
                if (colorTheme === 'rainbow') {
                    ctx.fillStyle = `hsla(${normalizedValue * 270}, 100%, ${normalizedValue * 50 + 25}%, ${normalizedValue})`;
                } else if (colorTheme === 'neon') {
                    const hue = normalizedValue > 0.5 ? 300 : 180;
                    ctx.fillStyle = `hsla(${hue}, 100%, ${normalizedValue * 50 + 30}%, ${normalizedValue})`;
                } else if (colorTheme === 'ocean') {
                    ctx.fillStyle = `hsla(${200 + normalizedValue * 40}, 80%, ${normalizedValue * 50 + 20}%, ${normalizedValue})`;
                } else if (colorTheme === 'sunset') {
                    ctx.fillStyle = `hsla(${normalizedValue * 40}, 100%, ${normalizedValue * 50 + 30}%, ${normalizedValue})`;
                } else {
                    ctx.fillStyle = `rgba(${normalizedValue * 255}, ${normalizedValue * 255}, ${normalizedValue * 255}, ${normalizedValue})`;
                }
                
                ctx.fillRect(pixelX, pixelY, columnWidth, pixelHeight);
            }
        }
    }
}

// 描画開始
draw(0);
