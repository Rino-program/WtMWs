/**
 * Audio Visualizer & Player Script
 * Features: Playlist, Seek, Google Drive Integration, Visualizations
 */

// --- State Management ---
const state = {
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffle: false,
    isRepeat: false, // 0: off, 1: all, 2: one
    audioCtx: null,
    analyser: null,
    source: null,
    gainNode: null,
    mode: 0, // 0: Bar, 1: Wave, 2: Scroll, 3: Circle, 4: Spectrum, 5: Particle
    particles: [],
    waveHistory: [],
    settings: {
        lowFreq: 20,
        highFreq: 16000,
        speed: 5,
        gDriveClientId: localStorage.getItem('gDriveClientId') || '',
        gDriveApiKey: localStorage.getItem('gDriveApiKey') || ''
    }
};

const modeNames = ['バー', '波形', 'スクロール波', 'サークル', 'スペクトラム', 'パーティクル'];
const maxHistory = 300;

// --- DOM Elements ---
const els = {
    cv: document.getElementById('cv'),
    audio: new Audio(), // HTML5 Audio Element
    playBtn: document.getElementById('playBtn'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    seekBar: document.getElementById('seekBar'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    playlistContainer: document.getElementById('playlistItems'),
    playlistPanel: document.getElementById('playlistPanel'),
    playlistToggle: document.getElementById('playlistToggle'),
    fileInput: document.getElementById('fileInput'),
    modeSelect: document.getElementById('modeSelect'),
    volSlider: document.getElementById('volSlider'),
    statusText: document.getElementById('statusText'),
    gDriveModal: document.getElementById('gDriveModal'),
    gDriveBtn: document.getElementById('gDriveBtn'),
    openSettingsBtn: document.getElementById('openSettingsBtn')
};

const ctx = els.cv.getContext('2d');
let W, H;

// --- Initialization ---
function init() {
    resize();
    window.addEventListener('resize', resize);
    
    // Audio Element Events
    els.audio.crossOrigin = "anonymous";
    els.audio.addEventListener('ended', onTrackEnded);
    els.audio.addEventListener('timeupdate', updateProgress);
    els.audio.addEventListener('loadedmetadata', () => {
        els.duration.textContent = formatTime(els.audio.duration);
        els.seekBar.max = els.audio.duration;
    });
    els.audio.addEventListener('play', () => {
        state.isPlaying = true;
        updatePlayBtn();
        initAudioContext(); // Ensure context is running
    });
    els.audio.addEventListener('pause', () => {
        state.isPlaying = false;
        updatePlayBtn();
    });
    els.audio.addEventListener('error', (e) => {
        console.error("Audio Error", e);
        els.statusText.textContent = "再生エラー";
        nextTrack(); // Skip bad track
    });

    // UI Events
    els.playBtn.addEventListener('click', togglePlay);
    els.prevBtn.addEventListener('click', prevTrack);
    els.nextBtn.addEventListener('click', nextTrack);
    els.seekBar.addEventListener('input', seek);
    els.fileInput.addEventListener('change', handleFileSelect);
    els.modeSelect.addEventListener('change', (e) => {
        state.mode = +e.target.value;
        if (state.mode === 5) initParticles();
        if (state.mode === 2) state.waveHistory = [];
    });
    els.volSlider.addEventListener('input', (e) => {
        els.audio.volume = e.target.value;
    });
    els.playlistToggle.addEventListener('click', () => {
        els.playlistPanel.classList.toggle('collapsed');
        els.playlistToggle.textContent = els.playlistPanel.classList.contains('collapsed') ? '📂' : '✖';
    });

    // Settings Button
    els.openSettingsBtn.addEventListener('click', () => {
        document.getElementById('clientIdInput').value = state.settings.gDriveClientId;
        document.getElementById('apiKeyInput').value = state.settings.gDriveApiKey;
        els.gDriveModal.classList.add('open');
    });

    // Google Drive Setup
    document.getElementById('saveGDriveSettings').addEventListener('click', saveGDriveSettings);
    document.getElementById('cancelGDriveSettings').addEventListener('click', () => els.gDriveModal.classList.remove('open'));
    els.gDriveBtn.addEventListener('click', openGDrivePicker);

    // Start Loop
    requestAnimationFrame(draw);
}

function resize() {
    W = els.cv.width = window.innerWidth;
    // Subtract control bar height to avoid overlap
    const controlsHeight = document.querySelector('.controls-bar').offsetHeight || 100;
    H = els.cv.height = window.innerHeight - controlsHeight;
}

// --- Audio Engine ---
function initAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 2048;
        state.analyser.smoothingTimeConstant = 0.6;
        
        // Connect HTML5 Audio to Web Audio API
        // Note: This might fail for some CORS content, but works for local/blob
        try {
            state.source = state.audioCtx.createMediaElementSource(els.audio);
            state.source.connect(state.analyser);
            state.analyser.connect(state.audioCtx.destination);
        } catch (e) {
            console.warn("MediaElementSource connection failed (likely CORS). Visualizer might not work for this track.", e);
        }
        
        state.bufLen = state.analyser.frequencyBinCount;
        state.freqData = new Uint8Array(state.bufLen);
        state.timeData = new Uint8Array(state.bufLen);
    }
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
}

// --- Player Logic ---
function togglePlay() {
    if (state.playlist.length === 0) return;
    
    if (state.isPlaying) {
        els.audio.pause();
    } else {
        // Bug Fix: Ensure AudioContext is resumed on user gesture
        initAudioContext();
        els.audio.play().catch(e => {
            console.error("Play failed", e);
            // If it fails, it might be because no source is set yet
            if (state.currentIndex === -1) playTrack(0);
        });
    }
}

function updatePlayBtn() {
    els.playBtn.textContent = state.isPlaying ? '⏸' : '▶';
}

function playTrack(index) {
    if (index < 0 || index >= state.playlist.length) return;
    
    state.currentIndex = index;
    const track = state.playlist[index];
    
    els.audio.src = track.url;
    els.statusText.textContent = `🎵 ${track.name}`;
    
    // Highlight in playlist
    renderPlaylist();
    
    els.audio.play().then(() => {
        initAudioContext();
    }).catch(e => console.error("Auto-play failed", e));
}

function nextTrack() {
    if (state.playlist.length === 0) return;
    let nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.playlist.length) nextIndex = 0;
    playTrack(nextIndex);
}

function prevTrack() {
    if (state.playlist.length === 0) return;
    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) prevIndex = state.playlist.length - 1;
    playTrack(prevIndex);
}

function onTrackEnded() {
    nextTrack();
}

function seek() {
    const time = els.seekBar.value;
    els.audio.currentTime = time;
}

function updateProgress() {
    els.seekBar.value = els.audio.currentTime;
    els.currentTime.textContent = formatTime(els.audio.currentTime);
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- Playlist Management ---
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    files.forEach(file => {
        const url = URL.createObjectURL(file);
        state.playlist.push({
            name: file.name,
            url: url,
            source: 'local'
        });
    });
    
    renderPlaylist();
    
    // If first tracks added, play first one
    if (state.currentIndex === -1) {
        playTrack(0);
    }
}

function renderPlaylist() {
    els.playlistContainer.innerHTML = '';
    state.playlist.forEach((track, i) => {
        const div = document.createElement('div');
        div.className = `playlist-item ${i === state.currentIndex ? 'active' : ''}`;
        div.innerHTML = `
            <span class="name">${i + 1}. ${track.name}</span>
            <span class="remove-btn" title="削除">✖</span>
        `;
        div.querySelector('.name').onclick = () => playTrack(i);
        div.querySelector('.remove-btn').onclick = (e) => {
            e.stopPropagation();
            removeFromPlaylist(i);
        };
        els.playlistContainer.appendChild(div);
    });
}

function removeFromPlaylist(index) {
    state.playlist.splice(index, 1);
    if (state.currentIndex === index) {
        // If removing current track, play next or stop
        if (state.playlist.length > 0) {
            playTrack(index < state.playlist.length ? index : 0);
        } else {
            els.audio.pause();
            els.audio.src = '';
            state.currentIndex = -1;
            state.isPlaying = false;
            updatePlayBtn();
            els.statusText.textContent = "未選択";
        }
    } else if (state.currentIndex > index) {
        state.currentIndex--;
    }
    renderPlaylist();
}

// --- Google Drive Integration ---
let tokenClient;
let accessToken = null;

function openGDrivePicker() {
    if (!state.settings.gDriveClientId || !state.settings.gDriveApiKey) {
        document.getElementById('clientIdInput').value = state.settings.gDriveClientId;
        document.getElementById('apiKeyInput').value = state.settings.gDriveApiKey;
        els.gDriveModal.classList.add('open');
        return;
    }
    
    if (accessToken) {
        createPicker();
    } else {
        initTokenClient();
    }
}

function initTokenClient() {
    if (typeof google === 'undefined' || !google.accounts) {
        const script = document.createElement('script');
        script.src = "https://accounts.google.com/gsi/client";
        script.onload = () => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: state.settings.gDriveClientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (response) => {
                    if (response.error !== undefined) {
                        throw (response);
                    }
                    accessToken = response.access_token;
                    loadGoogleApis();
                },
            });
            tokenClient.requestAccessToken({ prompt: 'consent' });
        };
        document.body.appendChild(script);
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function saveGDriveSettings() {
    const clientId = document.getElementById('clientIdInput').value.trim();
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    
    if (clientId && apiKey) {
        state.settings.gDriveClientId = clientId;
        state.settings.gDriveApiKey = apiKey;
        localStorage.setItem('gDriveClientId', clientId);
        localStorage.setItem('gDriveApiKey', apiKey);
        els.gDriveModal.classList.remove('open');
        accessToken = null; // Reset token to re-auth with new credentials
        openGDrivePicker();
    } else {
        alert('Client IDとAPI Keyを入力してください。');
    }
}

let gapiLoaded = false;
function loadGoogleApis() {
    if (gapiLoaded) {
        createPicker();
        return;
    }
    
    const script = document.createElement('script');
    script.src = "https://apis.google.com/js/api.js";
    script.onload = () => {
        gapi.load('picker', { 'callback': () => {
            gapiLoaded = true;
            createPicker();
        }});
    };
    document.body.appendChild(script);
}

function createPicker() {
    // DocsViewを使用して詳細なフィルターを設定
    const docsView = new google.picker.DocsView()
        .setIncludeFolders(true) // フォルダを表示
        .setMimeTypes("audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/x-m4a,audio/mp4");

    const picker = new google.picker.PickerBuilder()
        .addView(docsView) // ドライブ内のファイルを表示
        .addView(new google.picker.DocsUploadView()) // アップロードタブを追加
        .setOAuthToken(accessToken)
        .setDeveloperKey(state.settings.gDriveApiKey)
        .setCallback(pickerCallback)
        .setOrigin(window.location.protocol + '//' + window.location.host)
        .setTitle("音楽ファイルを選択")
        .build();
    picker.setVisible(true);
}

function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        const fileId = doc[google.picker.Document.ID];
        const fileName = doc[google.picker.Document.NAME];
        fetchDriveFile(fileId, fileName);
    }
}

async function fetchDriveFile(fileId, fileName) {
    els.statusText.textContent = "⌛ 読み込み中...";
    try {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        
        if (!response.ok) throw new Error('Drive fetch failed');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        state.playlist.push({
            name: fileName,
            url: blobUrl,
            source: 'drive'
        });
        
        renderPlaylist();
        if (state.currentIndex === -1) playTrack(state.playlist.length - 1);
        els.statusText.textContent = "✅ 追加完了";
    } catch (e) {
        console.error(e);
        alert("ファイルの取得に失敗しました。");
        els.statusText.textContent = "エラー";
    }
}


// --- Visualization Logic ---
function initParticles() {
    state.particles = [];
    for (let i = 0; i < 120; i++) {
        state.particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 0,
            vy: 0,
            r: Math.random() * 3 + 2,
            hue: Math.random() * 360
        });
    }
}

function getFiltered() {
    if (!state.freqData) return new Uint8Array(64);
    
    state.analyser.getByteFrequencyData(state.freqData);
    state.analyser.getByteTimeDomainData(state.timeData);
    
    const loIdx = freqToIdx(state.settings.lowFreq);
    const hiIdx = Math.min(freqToIdx(state.settings.highFreq), state.bufLen);
    const out = new Uint8Array(64);
    const step = (hiIdx - loIdx) / 64;
    
    for (let i = 0; i < 64; i++) {
        const idx = Math.min(loIdx + Math.floor(i * step), state.bufLen - 1);
        out[i] = state.freqData[idx];
    }
    return out;
}

function freqToIdx(f) {
    return state.audioCtx ? Math.round(f * state.analyser.fftSize / state.audioCtx.sampleRate) : 0;
}

function draw() {
    requestAnimationFrame(draw);
    
    // Background
    const fade = 0.15 + state.settings.speed * 0.03;
    ctx.fillStyle = `rgba(10,10,15,${fade})`;
    ctx.fillRect(0, 0, W, H);
    
    if (!state.analyser) return;
    
    const fd = getFiltered();
    const bw = W / 64;
    
    // Draw based on mode
    if (state.mode === 0) drawBar(fd, bw);
    else if (state.mode === 1) drawWave();
    else if (state.mode === 2) drawScrollWave(fd);
    else if (state.mode === 3) drawCircle(fd);
    else if (state.mode === 4) drawSpectrum(fd, bw);
    else if (state.mode === 5) drawParticles(fd);
}

// ... Drawing functions (ported from original) ...
function drawBar(fd, bw) {
    for (let i = 0; i < 64; i++) {
        const v = fd[i] / 255;
        const h = v * H * 0.85;
        const hue = i * 5.6;
        
        // Main bar
        ctx.fillStyle = `hsl(${hue}, 85%, 50%)`;
        ctx.fillRect(i * bw + 2, H - h, bw - 4, h);
        
        // Glossy top
        ctx.fillStyle = `hsl(${hue}, 85%, 70%)`;
        ctx.fillRect(i * bw + 2, H - h, bw - 4, 2);
        
        // Reflection/Glow
        if (v > 0.1) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = `hsl(${hue}, 85%, 60%)`;
            ctx.fillRect(i * bw + 4, H - h, bw - 8, 2);
            ctx.shadowBlur = 0;
        }
    }
}

function drawWave() {
    if (!state.timeData) return;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    const slice = W / state.bufLen;
    for (let i = 0; i < state.bufLen; i++) {
        const v = state.timeData[i] / 128 - 1;
        ctx.lineTo(i * slice, H / 2 + v * H * 0.4);
    }
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawScrollWave(fd) {
    let wv = 0;
    for (let i = 0; i < 64; i++) wv += fd[i];
    wv = wv / 64 / 255;
    state.waveHistory.push(wv);
    if (state.waveHistory.length > maxHistory) state.waveHistory.shift();
    
    const sw = W / maxHistory;
    ctx.beginPath();
    for (let i = 0; i < state.waveHistory.length; i++) {
        const v = state.waveHistory[i] * H * 0.8;
        const x = i * sw;
        const y = H / 2;
        if (i === 0) ctx.moveTo(x, y - v);
        else ctx.lineTo(x, y - v);
    }
    for (let i = state.waveHistory.length - 1; i >= 0; i--) {
        const v = state.waveHistory[i] * H * 0.8;
        const x = i * sw;
        ctx.lineTo(x, H / 2 + v);
    }
    ctx.closePath();
    const hue = (Date.now() * 0.1) % 360;
    ctx.fillStyle = `hsla(${hue},100%,60%,0.2)`;
    ctx.fill();
    ctx.strokeStyle = `hsl(${hue},100%,60%)`;
    ctx.stroke();
}

function drawCircle(fd) {
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.25;
    for (let i = 0; i < 64; i++) {
        const ang = (i / 64) * Math.PI * 2 - Math.PI / 2;
        const v = fd[i] / 255;
        const len = r + v * r * 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r * 0.3, cy + Math.sin(ang) * r * 0.3);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        ctx.strokeStyle = `hsl(${i * 5.6 + Date.now() * 0.1}, 80%, 60%)`;
        ctx.lineWidth = 3 + v * 3;
        ctx.stroke();
    }
}

function drawSpectrum(fd, bw) {
    const g = ctx.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0, 'rgba(240, 147, 251, 0.5)');
    g.addColorStop(0.5, 'rgba(245, 87, 108, 0.5)');
    g.addColorStop(1, 'rgba(79, 172, 254, 0.5)');
    
    ctx.beginPath();
    ctx.moveTo(0, H);
    
    for (let i = 0; i < 64; i++) {
        const v = fd[i] / 255;
        const h = v * H * 0.8;
        const x = i * bw + bw / 2;
        const y = H - h;
        if (i === 0) ctx.lineTo(x, y);
        else ctx.bezierCurveTo(x - bw / 2, y, x - bw / 2, y, x, y);
    }
    
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    
    // Top line
    ctx.beginPath();
    for (let i = 0; i < 64; i++) {
        const v = fd[i] / 255;
        const h = v * H * 0.8;
        const x = i * bw + bw / 2;
        const y = H - h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.bezierCurveTo(x - bw / 2, y, x - bw / 2, y, x, y);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawParticles(fd) {
    let avg = 0; for (let i = 0; i < 64; i++) avg += fd[i]; avg /= 64;
    state.particles.forEach((p, idx) => {
        const v = fd[idx % 64] / 255;
        const f = fd[Math.floor(idx / 2) % 64] / 255;
        p.vx += Math.sin(idx + Date.now() * 0.001) * f * state.settings.speed * 0.02;
        p.vy += Math.cos(idx + Date.now() * 0.001) * f * state.settings.speed * 0.02 - 0.2;
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.94; p.vy *= 0.94;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.7 + v * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + (f * 60)},80%,${50 + v * 30}%,${0.4 + f * 0.6})`;
        ctx.fill();
    });
}

// Start
init();
