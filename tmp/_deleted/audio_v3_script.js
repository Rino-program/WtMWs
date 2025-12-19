/**
 * Audio Visualizer Pro
 * Features: Multiple visualizations, Equalizer, Recording, Google Drive, Persistent settings
 */

// ============== STATE ==============
const state = {
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    mode: 0,
    uiVisible: true,
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    
    // Audio nodes
    audioCtx: null,
    analyser: null,
    source: null,
    eqFilters: [],
    
    // Visualization data
    freqData: null,
    timeData: null,
    bufLen: 0,
    particles: [],
    peakValues: new Array(128).fill(0),
    
    // Settings
    settings: {
        smoothing: 0.7,
        sensitivity: 1.0,
        maxHeight: 85,
        fadeSpeed: 0.15,
        barCount: 64,
        lowFreq: 20,
        highFreq: 16000,
        effectLevel: 2,
        glow: true,
        mirror: false,
        rainbow: true,
        fixedColor: '#4facfe',
        persistSettings: true,
        gDriveClientId: '',
        gDriveApiKey: '',
        eq: [0, 0, 0, 0, 0, 0, 0, 0]
    }
};

const modeNames = ['バー', '波形', '周波数分布', 'サークル', 'スペクトラム', 'パーティクル', '数値モニター', 'オシロスコープ', 'ミラーバー'];
const EQ_FREQS = [60, 170, 350, 1000, 3000, 6000, 12000, 14000];

// ============== DOM ELEMENTS ==============
const $ = id => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');
const audio = new Audio();

const els = {
    uiLayer: $('uiLayer'),
    playBtn: $('playBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    seekBar: $('seekBar'),
    currentTime: $('currentTime'),
    duration: $('duration'),
    volSlider: $('volSlider'),
    volIcon: $('volIcon'),
    modeSelect: $('modeSelect'),
    statusText: $('statusText'),
    recordStatus: $('recordStatus'),
    playlistPanel: $('playlistPanel'),
    playlistToggle: $('playlistToggle'),
    playlistItems: $('playlistItems'),
    fileInput: $('fileInput'),
    gDriveBtn: $('gDriveBtn'),
    toggleUIBtn: $('toggleUIBtn'),
    openSettingsBtn: $('openSettingsBtn'),
    recordBtn: $('recordBtn'),
    settingsModal: $('settingsModal'),
    closeSettingsBtn: $('closeSettingsBtn'),
    saveSettingsBtn: $('saveSettingsBtn'),
    controlsBar: $('controlsBar')
};

let W, H;

// ============== INITIALIZATION ==============
function init() {
    loadSettings();
    resize();
    window.addEventListener('resize', resize);
    
    // Audio setup
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    
    // Audio events
    audio.addEventListener('loadedmetadata', onMetadataLoaded);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', () => { state.isPlaying = true; updatePlayBtn(); });
    audio.addEventListener('pause', () => { state.isPlaying = false; updatePlayBtn(); });
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('canplaythrough', () => {
        if (state.isPlaying) audio.play().catch(console.error);
    });
    
    // UI Events
    els.playBtn.onclick = togglePlay;
    els.prevBtn.onclick = prevTrack;
    els.nextBtn.onclick = nextTrack;
    els.seekBar.oninput = seek;
    els.volSlider.oninput = updateVolume;
    els.modeSelect.onchange = e => { state.mode = +e.target.value; if (state.mode === 5) initParticles(); };
    els.toggleUIBtn.onclick = toggleUI;
    els.openSettingsBtn.onclick = openSettings;
    els.closeSettingsBtn.onclick = closeSettings;
    els.saveSettingsBtn.onclick = saveSettings;
    els.recordBtn.onclick = toggleRecording;
    els.playlistToggle.onclick = togglePlaylist;
    els.fileInput.onchange = handleLocalFiles;
    els.gDriveBtn.onclick = openGDrivePicker;
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
    
    // Settings inputs
    setupSettingsInputs();
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
    
    // Apply initial settings
    applySettingsToUI();
    
    // Start render loop
    requestAnimationFrame(draw);
}

function resize() {
    const controlsHeight = els.controlsBar.offsetHeight || 90;
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight - controlsHeight;
}

// ============== SETTINGS ==============
function loadSettings() {
    const saved = localStorage.getItem('audioVisualizerSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state.settings, parsed);
        } catch (e) { console.warn('Settings load failed'); }
    }
}

function saveSettingsToStorage() {
    if (state.settings.persistSettings) {
        localStorage.setItem('audioVisualizerSettings', JSON.stringify(state.settings));
    }
}

function setupSettingsInputs() {
    // Display
    $('smoothingSlider').oninput = e => {
        state.settings.smoothing = +e.target.value;
        $('smoothingValue').textContent = state.settings.smoothing.toFixed(2);
        if (state.analyser) state.analyser.smoothingTimeConstant = state.settings.smoothing;
    };
    $('sensitivitySlider').oninput = e => {
        state.settings.sensitivity = +e.target.value;
        $('sensitivityValue').textContent = state.settings.sensitivity.toFixed(1);
    };
    $('maxHeightSlider').oninput = e => {
        state.settings.maxHeight = +e.target.value;
        $('maxHeightValue').textContent = state.settings.maxHeight + '%';
    };
    $('fadeSpeedSlider').oninput = e => {
        state.settings.fadeSpeed = +e.target.value;
        $('fadeSpeedValue').textContent = state.settings.fadeSpeed.toFixed(2);
    };
    $('barCountSelect').onchange = e => { state.settings.barCount = +e.target.value; };
    
    // Audio
    $('lowFreqSlider').oninput = e => {
        state.settings.lowFreq = +e.target.value;
        $('lowFreqValue').textContent = state.settings.lowFreq + 'Hz';
    };
    $('highFreqSlider').oninput = e => {
        state.settings.highFreq = +e.target.value;
        $('highFreqValue').textContent = (state.settings.highFreq >= 1000 ? (state.settings.highFreq/1000) + 'kHz' : state.settings.highFreq + 'Hz');
    };
    
    // EQ
    EQ_FREQS.forEach((freq, i) => {
        const id = freq >= 1000 ? `eq${freq/1000}k` : `eq${freq}`;
        const el = $(id);
        if (el) {
            el.oninput = e => {
                state.settings.eq[i] = +e.target.value;
                updateEQ(i, +e.target.value);
            };
        }
    });
    $('resetEqBtn').onclick = resetEQ;
    
    // Effects
    $('effectLevelSelect').onchange = e => { state.settings.effectLevel = +e.target.value; };
    $('glowCheckbox').onchange = e => { state.settings.glow = e.target.checked; };
    $('mirrorCheckbox').onchange = e => { state.settings.mirror = e.target.checked; };
    $('rainbowCheckbox').onchange = e => { state.settings.rainbow = e.target.checked; };
    $('fixedColorPicker').oninput = e => { state.settings.fixedColor = e.target.value; };
    
    // Google Drive
    $('clientIdInput').onchange = e => { state.settings.gDriveClientId = e.target.value.trim(); };
    $('apiKeyInput').onchange = e => { state.settings.gDriveApiKey = e.target.value.trim(); };
    
    // Persist
    $('persistSettingsCheckbox').onchange = e => { state.settings.persistSettings = e.target.checked; };
}

function applySettingsToUI() {
    $('smoothingSlider').value = state.settings.smoothing;
    $('smoothingValue').textContent = state.settings.smoothing.toFixed(2);
    $('sensitivitySlider').value = state.settings.sensitivity;
    $('sensitivityValue').textContent = state.settings.sensitivity.toFixed(1);
    $('maxHeightSlider').value = state.settings.maxHeight;
    $('maxHeightValue').textContent = state.settings.maxHeight + '%';
    $('fadeSpeedSlider').value = state.settings.fadeSpeed;
    $('fadeSpeedValue').textContent = state.settings.fadeSpeed.toFixed(2);
    $('barCountSelect').value = state.settings.barCount;
    $('lowFreqSlider').value = state.settings.lowFreq;
    $('lowFreqValue').textContent = state.settings.lowFreq + 'Hz';
    $('highFreqSlider').value = state.settings.highFreq;
    $('highFreqValue').textContent = (state.settings.highFreq >= 1000 ? (state.settings.highFreq/1000) + 'kHz' : state.settings.highFreq + 'Hz');
    $('effectLevelSelect').value = state.settings.effectLevel;
    $('glowCheckbox').checked = state.settings.glow;
    $('mirrorCheckbox').checked = state.settings.mirror;
    $('rainbowCheckbox').checked = state.settings.rainbow;
    $('fixedColorPicker').value = state.settings.fixedColor;
    $('clientIdInput').value = state.settings.gDriveClientId;
    $('apiKeyInput').value = state.settings.gDriveApiKey;
    $('persistSettingsCheckbox').checked = state.settings.persistSettings;
    
    // EQ
    state.settings.eq.forEach((val, i) => {
        const freq = EQ_FREQS[i];
        const id = freq >= 1000 ? `eq${freq/1000}k` : `eq${freq}`;
        const el = $(id);
        if (el) el.value = val;
    });
}

function openSettings() { els.settingsModal.classList.add('open'); }
function closeSettings() { els.settingsModal.classList.remove('open'); }
function saveSettings() {
    state.settings.gDriveClientId = $('clientIdInput').value.trim();
    state.settings.gDriveApiKey = $('apiKeyInput').value.trim();
    saveSettingsToStorage();
    closeSettings();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    $(`tab-${tabId}`).classList.add('active');
}

// ============== AUDIO ENGINE ==============
function initAudioContext() {
    if (state.audioCtx) return;
    
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    state.analyser = state.audioCtx.createAnalyser();
    state.analyser.fftSize = 4096;
    state.analyser.smoothingTimeConstant = state.settings.smoothing;
    
    // Create EQ filters
    state.eqFilters = EQ_FREQS.map((freq, i) => {
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = state.settings.eq[i];
        return filter;
    });
    
    // Connect: source -> EQ chain -> analyser -> destination
    try {
        state.source = state.audioCtx.createMediaElementSource(audio);
        let lastNode = state.source;
        state.eqFilters.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });
        lastNode.connect(state.analyser);
        state.analyser.connect(state.audioCtx.destination);
    } catch (e) {
        console.warn('Audio context connection failed', e);
    }
    
    state.bufLen = state.analyser.frequencyBinCount;
    state.freqData = new Uint8Array(state.bufLen);
    state.timeData = new Uint8Array(state.bufLen);
}

function updateEQ(index, gain) {
    if (state.eqFilters[index]) {
        state.eqFilters[index].gain.value = gain;
    }
}

function resetEQ() {
    state.settings.eq = [0, 0, 0, 0, 0, 0, 0, 0];
    state.eqFilters.forEach((f, i) => {
        f.gain.value = 0;
        const freq = EQ_FREQS[i];
        const id = freq >= 1000 ? `eq${freq/1000}k` : `eq${freq}`;
        const el = $(id);
        if (el) el.value = 0;
    });
}

// ============== PLAYBACK ==============
function togglePlay() {
    if (state.playlist.length === 0) return;
    if (state.currentIndex === -1) { playTrack(0); return; }
    
    initAudioContext();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    
    if (state.isPlaying) {
        audio.pause();
    } else {
        audio.play().catch(e => {
            console.error('Play error:', e);
            // iOS/iPad workaround: reload and play
            const currentTime = audio.currentTime;
            audio.load();
            audio.currentTime = currentTime;
            audio.play().catch(console.error);
        });
    }
}

function playTrack(index) {
    if (index < 0 || index >= state.playlist.length) return;
    
    const wasPlaying = state.isPlaying;
    state.currentIndex = index;
    const track = state.playlist[index];
    
    // Stop current playback cleanly
    audio.pause();
    audio.currentTime = 0;
    
    // Set new source
    audio.src = track.url;
    audio.load();
    
    els.statusText.textContent = `🎵 ${track.name}`;
    renderPlaylist();
    
    initAudioContext();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    
    // Play after a short delay to ensure loading
    setTimeout(() => {
        audio.play().catch(e => {
            console.warn('Autoplay blocked, waiting for user interaction');
        });
    }, 100);
}

function prevTrack() {
    if (state.playlist.length === 0) return;
    const idx = state.currentIndex <= 0 ? state.playlist.length - 1 : state.currentIndex - 1;
    playTrack(idx);
}

function nextTrack() {
    if (state.playlist.length === 0) return;
    const idx = (state.currentIndex + 1) % state.playlist.length;
    playTrack(idx);
}

function seek() {
    audio.currentTime = els.seekBar.value;
}

function updateVolume() {
    audio.volume = els.volSlider.value;
    els.volIcon.textContent = audio.volume === 0 ? '🔇' : audio.volume < 0.5 ? '🔉' : '🔊';
}

function onMetadataLoaded() {
    els.duration.textContent = formatTime(audio.duration);
    els.seekBar.max = audio.duration || 0;
}

function updateProgress() {
    if (!isNaN(audio.currentTime)) {
        els.seekBar.value = audio.currentTime;
        els.currentTime.textContent = formatTime(audio.currentTime);
    }
}

function updatePlayBtn() {
    els.playBtn.textContent = state.isPlaying ? '⏸' : '▶';
}

function handleAudioError(e) {
    console.error('Audio error:', e);
    els.statusText.textContent = '再生エラー';
    // Try next track after error
    setTimeout(() => {
        if (state.playlist.length > 1) nextTrack();
    }, 1000);
}

function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ============== PLAYLIST ==============
function handleLocalFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    files.forEach(file => {
        // Create blob URL for better compatibility (especially iPad)
        const reader = new FileReader();
        reader.onload = () => {
            const blob = new Blob([reader.result], { type: file.type || 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            state.playlist.push({ name: file.name, url, source: 'local' });
            renderPlaylist();
            if (state.currentIndex === -1) playTrack(state.playlist.length - 1);
        };
        reader.readAsArrayBuffer(file);
    });
    
    e.target.value = ''; // Reset input
}

function renderPlaylist() {
    if (state.playlist.length === 0) {
        els.playlistItems.innerHTML = '<div class="playlist-empty">曲を追加してください</div>';
        return;
    }
    
    els.playlistItems.innerHTML = state.playlist.map((track, i) => `
        <div class="playlist-item ${i === state.currentIndex ? 'active' : ''}" data-index="${i}">
            <span class="name">${i + 1}. ${track.name}</span>
            <span class="remove-btn" data-index="${i}">✖</span>
        </div>
    `).join('');
    
    // Add event listeners
    els.playlistItems.querySelectorAll('.playlist-item').forEach(item => {
        item.onclick = e => {
            if (!e.target.classList.contains('remove-btn')) {
                playTrack(+item.dataset.index);
            }
        };
    });
    els.playlistItems.querySelectorAll('.remove-btn').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            removeFromPlaylist(+btn.dataset.index);
        };
    });
}

function removeFromPlaylist(index) {
    const track = state.playlist[index];
    if (track.url.startsWith('blob:')) URL.revokeObjectURL(track.url);
    state.playlist.splice(index, 1);
    
    if (state.currentIndex === index) {
        if (state.playlist.length > 0) {
            playTrack(index < state.playlist.length ? index : 0);
        } else {
            audio.pause();
            audio.src = '';
            state.currentIndex = -1;
            state.isPlaying = false;
            updatePlayBtn();
            els.statusText.textContent = '未選択';
        }
    } else if (state.currentIndex > index) {
        state.currentIndex--;
    }
    renderPlaylist();
}

function togglePlaylist() {
    els.playlistPanel.classList.toggle('collapsed');
    els.playlistToggle.textContent = els.playlistPanel.classList.contains('collapsed') ? '📂' : '✖';
}

// ============== GOOGLE DRIVE ==============
let accessToken = null;

function openGDrivePicker() {
    if (!state.settings.gDriveClientId || !state.settings.gDriveApiKey) {
        openSettings();
        switchTab('gdrive');
        return;
    }
    
    if (accessToken) {
        createPicker();
    } else {
        initGoogleAuth();
    }
}

function initGoogleAuth() {
    if (typeof google === 'undefined' || !google.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = requestGoogleToken;
        document.body.appendChild(script);
    } else {
        requestGoogleToken();
    }
}

function requestGoogleToken() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: state.settings.gDriveClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: response => {
            if (response.error) {
                console.error('Google auth error:', response);
                alert('Google認証に失敗しました');
                return;
            }
            accessToken = response.access_token;
            loadPickerApi();
        }
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

function loadPickerApi() {
    if (typeof gapi !== 'undefined' && gapi.picker) {
        createPicker();
        return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => gapi.load('picker', createPicker);
    document.body.appendChild(script);
}

function createPicker() {
    const docsView = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setMimeTypes('audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/x-m4a,audio/mp4,audio/flac');
    
    const picker = new google.picker.PickerBuilder()
        .addView(docsView)
        .addView(new google.picker.DocsUploadView())
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED) // Enable multiple selection
        .setOAuthToken(accessToken)
        .setDeveloperKey(state.settings.gDriveApiKey)
        .setCallback(pickerCallback)
        .setOrigin(window.location.protocol + '//' + window.location.host)
        .setTitle('音楽ファイルを選択')
        .build();
    picker.setVisible(true);
}

async function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const docs = data[google.picker.Response.DOCUMENTS];
        els.statusText.textContent = `⌛ ${docs.length}ファイル読み込み中...`;
        
        for (const doc of docs) {
            await fetchDriveFile(doc[google.picker.Document.ID], doc[google.picker.Document.NAME]);
        }
        
        els.statusText.textContent = `✅ ${docs.length}ファイル追加完了`;
    }
}

async function fetchDriveFile(fileId, fileName) {
    try {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const response = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!response.ok) throw new Error('Fetch failed');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        state.playlist.push({ name: fileName, url: blobUrl, source: 'drive' });
        renderPlaylist();
        
        if (state.currentIndex === -1) playTrack(state.playlist.length - 1);
    } catch (e) {
        console.error('Drive fetch error:', e);
    }
}

// ============== UI CONTROLS ==============
function toggleUI() {
    state.uiVisible = !state.uiVisible;
    els.uiLayer.classList.toggle('hidden', !state.uiVisible);
    els.toggleUIBtn.textContent = state.uiVisible ? '👁' : '👁‍🗨';
}

function handleKeyboard(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    
    switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'h': toggleUI(); break;
        case 'arrowleft': prevTrack(); break;
        case 'arrowright': nextTrack(); break;
        case 'arrowup': els.volSlider.value = Math.min(1, +els.volSlider.value + 0.1); updateVolume(); break;
        case 'arrowdown': els.volSlider.value = Math.max(0, +els.volSlider.value - 0.1); updateVolume(); break;
    }
}

// ============== RECORDING ==============
function toggleRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!state.isPlaying || state.playlist.length === 0) {
        alert('録画を開始するには、曲を再生してください。');
        return;
    }
    
    // Hide UI for recording
    const wasUIVisible = state.uiVisible;
    els.uiLayer.classList.add('hidden');
    
    const stream = cv.captureStream(30);
    state.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    state.recordedChunks = [];
    
    state.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) state.recordedChunks.push(e.data);
    };
    
    state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualizer_${state.playlist[state.currentIndex]?.name || 'recording'}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        
        if (wasUIVisible) els.uiLayer.classList.remove('hidden');
        els.recordStatus.textContent = '';
        els.recordStatus.classList.remove('active');
        els.recordBtn.style.color = '';
    };
    
    // Record entire song from current position
    const remainingTime = audio.duration - audio.currentTime;
    
    state.mediaRecorder.start();
    state.isRecording = true;
    els.recordStatus.textContent = '● 録画中...';
    els.recordStatus.classList.add('active');
    els.recordBtn.style.color = '#ff6b6b';
    
    // Auto-stop when song ends
    audio.addEventListener('ended', stopRecording, { once: true });
}

function stopRecording() {
    if (state.mediaRecorder && state.isRecording) {
        state.mediaRecorder.stop();
        state.isRecording = false;
    }
}

// ============== VISUALIZATION ==============
function getFilteredData() {
    if (!state.analyser) return new Uint8Array(state.settings.barCount);
    
    state.analyser.getByteFrequencyData(state.freqData);
    state.analyser.getByteTimeDomainData(state.timeData);
    
    const loIdx = freqToIdx(state.settings.lowFreq);
    const hiIdx = Math.min(freqToIdx(state.settings.highFreq), state.bufLen);
    const out = new Uint8Array(state.settings.barCount);
    const step = (hiIdx - loIdx) / state.settings.barCount;
    
    for (let i = 0; i < state.settings.barCount; i++) {
        const idx = Math.min(loIdx + Math.floor(i * step), state.bufLen - 1);
        out[i] = Math.min(255, state.freqData[idx] * state.settings.sensitivity);
    }
    return out;
}

function freqToIdx(f) {
    return state.audioCtx ? Math.round(f * state.analyser.fftSize / state.audioCtx.sampleRate) : 0;
}

function getColor(i, v = 1, total = state.settings.barCount) {
    if (state.settings.rainbow) {
        const hue = (i / total) * 360;
        return `hsl(${hue}, 85%, ${50 + v * 25}%)`;
    }
    return state.settings.fixedColor;
}

function draw() {
    requestAnimationFrame(draw);
    
    // Clear with fade
    ctx.fillStyle = `rgba(10, 10, 15, ${state.settings.fadeSpeed})`;
    ctx.fillRect(0, 0, W, H);
    
    const fd = getFilteredData();
    const maxH = H * (state.settings.maxHeight / 100);
    
    // Draw based on mode
    switch (state.mode) {
        case 0: drawBars(fd, maxH); break;
        case 1: drawWaveform(maxH); break;
        case 2: drawFreqDist(fd, maxH); break;
        case 3: drawCircle(fd, maxH); break;
        case 4: drawSpectrum(fd, maxH); break;
        case 5: drawParticles(fd); break;
        case 6: drawMonitor(fd); break;
        case 7: drawOscilloscope(maxH); break;
        case 8: drawMirrorBars(fd, maxH); break;
    }
}

// Mode 0: Bars
function drawBars(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    const glow = state.settings.glow && state.settings.effectLevel >= 2;
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const color = getColor(i, v, n);
        
        if (glow && v > 0.1) {
            ctx.shadowBlur = 15 * state.settings.effectLevel;
            ctx.shadowColor = color;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(i * bw + 2, H - h, bw - 4, h);
        
        ctx.shadowBlur = 0;
    }
    
    // Mirror reflection
    if (state.settings.mirror) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < n; i++) {
            const v = fd[i] / 255;
            const h = v * maxH * 0.3;
            ctx.fillStyle = getColor(i, v, n);
            ctx.fillRect(i * bw + 2, H, bw - 4, h);
        }
        ctx.globalAlpha = 1;
    }
}

// Mode 1: Waveform
function drawWaveform(maxH) {
    if (!state.timeData) return;
    
    ctx.beginPath();
    const slice = W / state.bufLen;
    for (let i = 0; i < state.bufLen; i++) {
        const v = state.timeData[i] / 128 - 1;
        const y = H / 2 + v * maxH * 0.5;
        i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y);
    }
    
    ctx.strokeStyle = state.settings.rainbow ? `hsl(${(Date.now() * 0.05) % 360}, 80%, 60%)` : state.settings.fixedColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill below
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 172, 254, 0.1)';
    ctx.fill();
}

// Mode 2: Frequency Distribution (replaces scroll wave)
function drawFreqDist(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    
    // Draw filled area
    ctx.beginPath();
    ctx.moveTo(0, H);
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const x = i * bw + bw / 2;
        ctx.lineTo(x, H - h);
    }
    
    ctx.lineTo(W, H);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, H - maxH, 0, H);
    grad.addColorStop(0, 'rgba(240, 147, 251, 0.6)');
    grad.addColorStop(0.5, 'rgba(245, 87, 108, 0.4)');
    grad.addColorStop(1, 'rgba(79, 172, 254, 0.2)');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Top line
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const x = i * bw + bw / 2;
        i === 0 ? ctx.moveTo(x, H - h) : ctx.lineTo(x, H - h);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Frequency labels
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    const labels = ['60Hz', '250Hz', '1kHz', '4kHz', '16kHz'];
    labels.forEach((label, i) => {
        ctx.fillText(label, (i / (labels.length - 1)) * W * 0.9 + 10, H - 5);
    });
}

// Mode 3: Circle
function drawCircle(fd, maxH) {
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.2;
    const n = fd.length;
    
    for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const v = fd[i] / 255;
        // Minimum length is very small when no sound
        const minLen = r * 0.05;
        const len = minLen + v * r * 1.5;
        
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * minLen, cy + Math.sin(ang) * minLen);
        ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
        
        const color = getColor(i, v, n);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 + v * 4;
        
        if (state.settings.glow && v > 0.2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
}

// Mode 4: Spectrum (smooth curve)
function drawSpectrum(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    
    ctx.beginPath();
    ctx.moveTo(0, H);
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const x = i * bw + bw / 2;
        const y = H - h;
        
        if (i === 0) {
            ctx.lineTo(x, y);
        } else {
            const px = (i - 1) * bw + bw / 2;
            const py = H - (fd[i - 1] / 255) * maxH;
            const cx1 = px + bw / 2;
            const cx2 = x - bw / 2;
            ctx.bezierCurveTo(cx1, py, cx2, y, x, y);
        }
    }
    
    ctx.lineTo(W, H);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(79, 172, 254, 0.5)');
    grad.addColorStop(0.5, 'rgba(240, 147, 251, 0.3)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Glowing top line
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const x = i * bw + bw / 2;
        const y = H - h;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            const px = (i - 1) * bw + bw / 2;
            const py = H - (fd[i - 1] / 255) * maxH;
            const cx1 = px + bw / 2;
            const cx2 = x - bw / 2;
            ctx.bezierCurveTo(cx1, py, cx2, y, x, y);
        }
    }
    
    if (state.settings.glow) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#4facfe';
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Mode 5: Particles
function initParticles() {
    state.particles = [];
    const count = 80 + state.settings.effectLevel * 40;
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 0,
            vy: 0,
            r: Math.random() * 4 + 2,
            hue: Math.random() * 360,
            band: Math.floor(Math.random() * state.settings.barCount)
        });
    }
}

function drawParticles(fd) {
    if (state.particles.length === 0) initParticles();
    
    let avg = 0;
    for (let i = 0; i < fd.length; i++) avg += fd[i];
    avg /= fd.length;
    
    state.particles.forEach(p => {
        const v = fd[p.band] / 255;
        
        // Movement based on frequency
        const angle = p.hue * Math.PI / 180 + Date.now() * 0.0005;
        p.vx += Math.cos(angle) * v * 0.5;
        p.vy += Math.sin(angle) * v * 0.5 - 0.1; // Slight upward bias
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        // Wrap around
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        
        // Draw
        const size = p.r * (0.5 + v);
        const alpha = 0.3 + v * 0.7;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = state.settings.rainbow 
            ? `hsla(${p.hue + v * 60}, 80%, ${50 + v * 30}%, ${alpha})`
            : state.settings.fixedColor.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        ctx.fill();
        
        if (state.settings.glow && v > 0.3) {
            ctx.shadowBlur = size * 3;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
}

// Mode 6: Numeric Monitor
function drawMonitor(fd) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10, 10, 15, 1)';
    ctx.fillRect(0, 0, W, H);
    
    ctx.font = '14px monospace';
    ctx.fillStyle = '#4facfe';
    
    // Calculate stats
    let min = 255, max = 0, sum = 0;
    for (let i = 0; i < fd.length; i++) {
        min = Math.min(min, fd[i]);
        max = Math.max(max, fd[i]);
        sum += fd[i];
    }
    const avg = sum / fd.length;
    
    // Peak detection
    const bass = (fd[0] + fd[1] + fd[2] + fd[3]) / 4;
    const mid = (fd[15] + fd[16] + fd[17] + fd[18]) / 4;
    const high = (fd[fd.length - 4] + fd[fd.length - 3] + fd[fd.length - 2] + fd[fd.length - 1]) / 4;
    
    const lines = [
        '╔══════════════════════════════════════════╗',
        '║     AUDIO VISUALIZER - NUMERIC MONITOR   ║',
        '╠══════════════════════════════════════════╣',
        `║  Average Level:    ${avg.toFixed(1).padStart(6)} / 255          ║`,
        `║  Min Level:        ${min.toString().padStart(6)} / 255          ║`,
        `║  Max Level:        ${max.toString().padStart(6)} / 255          ║`,
        '╠══════════════════════════════════════════╣',
        `║  Bass (60-250Hz):  ${bass.toFixed(1).padStart(6)} ${getBar(bass)}  ║`,
        `║  Mid (250-4kHz):   ${mid.toFixed(1).padStart(6)} ${getBar(mid)}  ║`,
        `║  High (4k-16kHz):  ${high.toFixed(1).padStart(6)} ${getBar(high)}  ║`,
        '╠══════════════════════════════════════════╣',
        `║  Time:             ${formatTime(audio.currentTime).padStart(6)}              ║`,
        `║  Duration:         ${formatTime(audio.duration).padStart(6)}              ║`,
        '╚══════════════════════════════════════════╝'
    ];
    
    const startY = H / 2 - lines.length * 10;
    lines.forEach((line, i) => {
        ctx.fillText(line, W / 2 - 180, startY + i * 20);
    });
    
    // Frequency bars at bottom
    ctx.fillStyle = '#333';
    ctx.fillRect(50, H - 100, W - 100, 60);
    
    const barW = (W - 120) / fd.length;
    for (let i = 0; i < fd.length; i++) {
        const v = fd[i] / 255;
        const h = v * 50;
        ctx.fillStyle = getColor(i, v, fd.length);
        ctx.fillRect(60 + i * barW, H - 45 - h, barW - 1, h);
    }
}

function getBar(val) {
    const filled = Math.floor(val / 255 * 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

// Mode 7: Oscilloscope
function drawOscilloscope(maxH) {
    if (!state.timeData) return;
    
    // Grid
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const y = i * H / 10;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        
        const x = i * W / 10;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    }
    
    // Waveform
    ctx.beginPath();
    const slice = W / state.bufLen;
    for (let i = 0; i < state.bufLen; i++) {
        const v = state.timeData[i] / 128 - 1;
        const y = H / 2 + v * maxH * 0.4;
        i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y);
    }
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    if (state.settings.glow) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ff00';
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Center line
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.strokeStyle = '#00ff0044';
    ctx.stroke();
}

// Mode 8: Mirror Bars
function drawMirrorBars(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    const centerY = H / 2;
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH * 0.5;
        const color = getColor(i, v, n);
        
        if (state.settings.glow && v > 0.1) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
        }
        
        ctx.fillStyle = color;
        // Top half (going up)
        ctx.fillRect(i * bw + 2, centerY - h, bw - 4, h);
        // Bottom half (going down)
        ctx.fillRect(i * bw + 2, centerY, bw - 4, h);
        
        ctx.shadowBlur = 0;
    }
    
    // Center line
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, centerY - 1, W, 2);
}

// ============== START ==============
document.addEventListener('DOMContentLoaded', init);