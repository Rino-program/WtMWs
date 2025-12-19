/**
 * Audio Visualizer Pro V4
 */

// ============== STATE ==============
const state = {
    playlist: [],
    currentIndex: -1,
    isPlaying: false,
    mode: 0,
    uiVisible: true,
    isExporting: false,
    mediaRecorder: null,
    recordedChunks: [],
    
    // Audio nodes
    audioCtx: null,
    analyser: null,
    source: null,
    eqFilters: [],
    gainNode: null, // For volume/muting
    
    // Visualization data
    freqData: null,
    timeData: null,
    bufLen: 0,
    particles: [],
    peakValues: new Array(128).fill(0),
    volumeHistory: new Array(100).fill(0),
    
    // Settings
    settings: {
        smoothing: 0.7,
        sensitivity: 1.0,
        barCount: 64,
        lowFreq: 20,
        highFreq: 16000,
        effectLevel: 2,
        glowStrength: 20,
        mirror: false,
        rainbow: true,
        fixedColor: '#4facfe',
        showLabels: true,
        persistSettings: true,
        gDriveClientId: '',
        gDriveApiKey: '',
        eq: [0, 0, 0, 0, 0, 0, 0, 0]
    }
};

const EQ_FREQS = [60, 170, 350, 1000, 3000, 6000, 12000, 14000];

// ============== DOM ELEMENTS ==============
const $ = id => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d', { alpha: false }); // Optimize
const audio = new Audio();

const els = {
    uiLayer: $('uiLayer'),
    playBtn: $('playBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    seekBar: $('seekBar'),
    timeDisplay: $('timeDisplay'),
    volSlider: $('volSlider'),
    volIcon: $('volIcon'),
    modeSelect: $('modeSelect'),
    statusText: $('statusText'),
    playlistPanel: $('playlistPanel'),
    playlistToggle: $('playlistToggle'),
    playlistItems: $('playlistItems'),
    fileInput: $('fileInput'),
    gDriveBtn: $('gDriveBtn'),
    toggleUIBtn: $('toggleUIBtn'),
    openSettingsBtn: $('openSettingsBtn'),
    exportBtn: $('exportBtn'),
    settingsModal: $('settingsModal'),
    closeSettingsBtn: $('closeSettingsBtn'),
    saveSettingsBtn: $('saveSettingsBtn'),
    controlsBar: $('controlsBar'),
    overlayMsg: $('overlayMsg')
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
    audio.addEventListener('ended', () => {
        if (state.isExporting) finishExport();
        else nextTrack();
    });
    audio.addEventListener('error', handleAudioError);
    
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
    els.exportBtn.onclick = startExport;
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
    W = cv.width = window.innerWidth;
    // If UI is hidden, full height. If visible, subtract controls height.
    const controlsH = state.uiVisible ? (els.controlsBar.offsetHeight || 90) : 0;
    H = cv.height = window.innerHeight - controlsH;
}

// ============== SETTINGS ==============
function loadSettings() {
    const saved = localStorage.getItem('audioVisualizerSettingsV4');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state.settings, parsed);
        } catch (e) { console.warn('Settings load failed'); }
    }
}

function saveSettingsToStorage() {
    if (state.settings.persistSettings) {
        localStorage.setItem('audioVisualizerSettingsV4', JSON.stringify(state.settings));
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
    $('barCountSelect').onchange = e => { state.settings.barCount = +e.target.value; };
    $('showLabelsCheckbox').onchange = e => { state.settings.showLabels = e.target.checked; };
    
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
    $('glowSlider').oninput = e => { 
        state.settings.glowStrength = +e.target.value; 
        $('glowValue').textContent = state.settings.glowStrength > 30 ? '強' : state.settings.glowStrength > 10 ? '中' : '弱';
    };
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
    $('barCountSelect').value = state.settings.barCount;
    $('showLabelsCheckbox').checked = state.settings.showLabels;
    $('lowFreqSlider').value = state.settings.lowFreq;
    $('lowFreqValue').textContent = state.settings.lowFreq + 'Hz';
    $('highFreqSlider').value = state.settings.highFreq;
    $('highFreqValue').textContent = (state.settings.highFreq >= 1000 ? (state.settings.highFreq/1000) + 'kHz' : state.settings.highFreq + 'Hz');
    $('effectLevelSelect').value = state.settings.effectLevel;
    $('glowSlider').value = state.settings.glowStrength;
    $('mirrorCheckbox').checked = state.settings.mirror;
    $('rainbowCheckbox').checked = state.settings.rainbow;
    $('fixedColorPicker').value = state.settings.fixedColor;
    $('clientIdInput').value = state.settings.gDriveClientId;
    $('apiKeyInput').value = state.settings.gDriveApiKey;
    $('persistSettingsCheckbox').checked = state.settings.persistSettings;
    
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
    
    state.gainNode = state.audioCtx.createGain();
    state.gainNode.gain.value = 1.0;
    
    // Create EQ filters
    state.eqFilters = EQ_FREQS.map((freq, i) => {
        const filter = state.audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = state.settings.eq[i];
        return filter;
    });
    
    // Connect: source -> EQ chain -> analyser -> gain -> destination
    try {
        state.source = state.audioCtx.createMediaElementSource(audio);
        let lastNode = state.source;
        state.eqFilters.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });
        lastNode.connect(state.analyser);
        state.analyser.connect(state.gainNode);
        state.gainNode.connect(state.audioCtx.destination);
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
        audio.play().catch(console.error);
    }
}

function playTrack(index) {
    if (index < 0 || index >= state.playlist.length) return;
    
    state.currentIndex = index;
    const track = state.playlist[index];
    
    audio.pause();
    audio.currentTime = 0;
    audio.src = track.url;
    audio.load();
    
    els.statusText.textContent = `🎵 ${track.name}`;
    renderPlaylist();
    
    initAudioContext();
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    
    setTimeout(() => {
        audio.play().catch(console.warn);
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
    els.seekBar.max = audio.duration || 0;
    updateTimeDisplay();
}

function updateProgress() {
    if (!isNaN(audio.currentTime)) {
        els.seekBar.value = audio.currentTime;
        updateTimeDisplay();
    }
}

function updateTimeDisplay() {
    const cur = formatTime(audio.currentTime);
    const dur = formatTime(audio.duration);
    els.timeDisplay.textContent = `${cur} / ${dur}`;
}

function updatePlayBtn() {
    els.playBtn.textContent = state.isPlaying ? '⏸' : '▶';
}

function handleAudioError(e) {
    console.error('Audio error:', e);
    els.statusText.textContent = '再生エラー';
    setTimeout(() => { if (state.playlist.length > 1) nextTrack(); }, 1000);
}

function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ============== PLAYLIST & DRIVE ==============
function handleLocalFiles(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    files.forEach(file => {
        const url = URL.createObjectURL(file);
        state.playlist.push({ name: file.name, url, source: 'local' });
    });
    renderPlaylist();
    if (state.currentIndex === -1) playTrack(state.playlist.length - files.length);
    e.target.value = '';
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
    
    els.playlistItems.querySelectorAll('.playlist-item').forEach(item => {
        item.onclick = e => {
            if (!e.target.classList.contains('remove-btn')) playTrack(+item.dataset.index);
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
        if (state.playlist.length > 0) playTrack(index < state.playlist.length ? index : 0);
        else {
            audio.pause();
            state.currentIndex = -1;
            state.isPlaying = false;
            updatePlayBtn();
            els.statusText.textContent = '未選択';
        }
    } else if (state.currentIndex > index) state.currentIndex--;
    renderPlaylist();
}

function togglePlaylist() {
    els.playlistPanel.classList.toggle('collapsed');
    els.playlistToggle.textContent = els.playlistPanel.classList.contains('collapsed') ? '📂' : '✖';
}

// Google Drive (Simplified for brevity, same logic as before)
let accessToken = null;
function openGDrivePicker() {
    if (!state.settings.gDriveClientId || !state.settings.gDriveApiKey) {
        openSettings();
        switchTab('gdrive');
        return;
    }
    if (accessToken) createPicker();
    else initGoogleAuth();
}
function initGoogleAuth() {
    if (typeof google === 'undefined' || !google.accounts) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = requestGoogleToken;
        document.body.appendChild(script);
    } else requestGoogleToken();
}
function requestGoogleToken() {
    const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: state.settings.gDriveClientId,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: r => {
            if (r.error) { alert('認証失敗'); return; }
            accessToken = r.access_token;
            loadPickerApi();
        }
    });
    tokenClient.requestAccessToken({ prompt: 'consent' });
}
function loadPickerApi() {
    if (typeof gapi !== 'undefined' && gapi.picker) createPicker();
    else {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => gapi.load('picker', createPicker);
        document.body.appendChild(script);
    }
}
function createPicker() {
    const docsView = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/mp4');
    new google.picker.PickerBuilder()
        .addView(docsView)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(accessToken)
        .setDeveloperKey(state.settings.gDriveApiKey)
        .setCallback(pickerCallback)
        .build().setVisible(true);
}
async function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const docs = data[google.picker.Response.DOCUMENTS];
        els.statusText.textContent = `⌛ ${docs.length}ファイル読み込み中...`;
        for (const doc of docs) await fetchDriveFile(doc[google.picker.Document.ID], doc[google.picker.Document.NAME]);
        els.statusText.textContent = `✅ 追加完了`;
    }
}
async function fetchDriveFile(fileId, fileName) {
    try {
        const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (!r.ok) throw new Error('Fetch failed');
        const blob = await r.blob();
        state.playlist.push({ name: fileName, url: URL.createObjectURL(blob), source: 'drive' });
        renderPlaylist();
        if (state.currentIndex === -1) playTrack(state.playlist.length - 1);
    } catch (e) { console.error(e); }
}

// ============== UI CONTROLS ==============
function toggleUI() {
    state.uiVisible = !state.uiVisible;
    els.uiLayer.classList.toggle('hidden', !state.uiVisible);
    els.toggleUIBtn.textContent = state.uiVisible ? '⛶' : '👁‍🗨';
    resize(); // Trigger resize to adjust canvas height
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

// ============== EXPORT (VIDEO) ==============
function startExport() {
    if (!state.playlist[state.currentIndex]) {
        alert('曲を選択してください');
        return;
    }
    
    if (!confirm('現在の曲を動画として書き出しますか？\n(再生しながら録画します。完了までお待ちください)')) return;
    
    state.isExporting = true;
    
    // Setup recording
    const stream = cv.captureStream(60);
    state.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    state.recordedChunks = [];
    
    state.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) state.recordedChunks.push(e.data);
    };
    
    // Start playback from beginning
    audio.pause();
    audio.currentTime = 0;
    
    // Mute output so user doesn't hear it (optional, but better)
    // Note: We need analyser to still work. Analyser is before Gain.
    // So we set Gain to 0.
    state.gainNode.gain.value = 0;
    
    // Hide UI
    if (state.uiVisible) toggleUI();
    
    // Show overlay
    els.overlayMsg.textContent = '🎬 動画書き出し中... (再生終了までお待ちください)';
    els.overlayMsg.classList.remove('hidden');
    
    state.mediaRecorder.start();
    audio.play();
}

function finishExport() {
    state.mediaRecorder.stop();
    state.isExporting = false;
    
    // Restore UI
    if (!state.uiVisible) toggleUI();
    els.overlayMsg.classList.add('hidden');
    
    // Restore volume
    state.gainNode.gain.value = 1.0; // Or previous volume
    
    // Save file
    setTimeout(() => {
        const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualizer_${state.playlist[state.currentIndex].name}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        alert('書き出しが完了しました');
    }, 500);
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
        const hue = (i / total) * 360 + Date.now() * 0.05;
        return `hsl(${hue}, 80%, ${50 + v * 20}%)`;
    }
    return state.settings.fixedColor;
}

function draw() {
    requestAnimationFrame(draw);
    
    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
    
    if (!state.analyser) return;
    
    const fd = getFilteredData();
    const maxH = H * 0.8; // Use 80% of height
    
    // Global Effects
    if (state.settings.effectLevel >= 3) {
        // Screen shake on bass
        const bass = fd[0] + fd[1] + fd[2];
        if (bass > 600) {
            const shake = (bass - 600) * 0.02;
            ctx.translate(Math.random() * shake - shake/2, Math.random() * shake - shake/2);
        }
    }
    
    switch (state.mode) {
        case 0: drawBars(fd, maxH); break;
        case 1: drawWaveform(maxH); break;
        case 2: drawDigitalBlocks(fd, maxH); break;
        case 3: drawCircle(fd, maxH); break;
        case 4: drawSpectrum(fd, maxH); break;
        case 5: drawParticles(fd); break;
        case 6: drawMonitor(fd); break;
        case 7: drawTunnel(fd); break;
        case 8: drawMirrorBars(fd, maxH); break;
    }
    
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// Mode 0: Bars (Improved with labels)
function drawBars(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    const glow = state.settings.effectLevel >= 1;
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH;
        const color = getColor(i, v, n);
        
        if (glow && v > 0.1) {
            ctx.shadowBlur = state.settings.glowStrength * v;
            ctx.shadowColor = color;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(i * bw + 1, H - h, bw - 2, h);
        ctx.shadowBlur = 0;
        
        // Labels
        if (state.settings.showLabels && i % Math.ceil(n/8) === 0) {
            const freq = Math.round(i * (state.settings.highFreq - state.settings.lowFreq) / n + state.settings.lowFreq);
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(freq >= 1000 ? (freq/1000).toFixed(1)+'k' : freq, i * bw, H - 10);
        }
    }
}

// Mode 1: Waveform (Clean line)
function drawWaveform(maxH) {
    if (!state.timeData) return;
    
    ctx.beginPath();
    const slice = W / state.bufLen;
    for (let i = 0; i < state.bufLen; i++) {
        const v = state.timeData[i] / 128 - 1;
        const y = H / 2 + v * maxH * 0.5;
        i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * slice, y);
    }
    
    ctx.strokeStyle = state.settings.rainbow ? `hsl(${(Date.now() * 0.1) % 360}, 80%, 60%)` : state.settings.fixedColor;
    ctx.lineWidth = 2;
    
    if (state.settings.effectLevel >= 2) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.strokeStyle;
    }
    
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Mode 2: Digital Blocks (New)
function drawDigitalBlocks(fd, maxH) {
    const cols = 32;
    const rows = 20;
    const cellW = W / cols;
    const cellH = H / rows;
    
    // Map freq data to columns
    for (let i = 0; i < cols; i++) {
        const idx = Math.floor(i / cols * fd.length);
        const v = fd[idx] / 255;
        const activeRows = Math.floor(v * rows);
        
        for (let j = 0; j < rows; j++) {
            if (rows - j <= activeRows) {
                ctx.fillStyle = getColor(i, (rows-j)/rows, cols);
                ctx.fillRect(i * cellW + 2, j * cellH + 2, cellW - 4, cellH - 4);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.05)';
                ctx.fillRect(i * cellW + 2, j * cellH + 2, cellW - 4, cellH - 4);
            }
        }
    }
}

// Mode 3: Circle (Improved)
function drawCircle(fd, maxH) {
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.25; // Larger base
    const n = fd.length;
    
    // Calculate bar width to avoid overlap at base
    const circumference = 2 * Math.PI * r;
    const barW = (circumference / n) * 0.6;
    
    for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        const v = fd[i] / 255;
        const len = v * maxH * 0.6; // Scale height
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang);
        
        const color = getColor(i, v, n);
        ctx.fillStyle = color;
        
        if (state.settings.effectLevel >= 2 && v > 0.2) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
        }
        
        // Draw bar radiating out
        ctx.fillRect(r, -barW/2, len, barW);
        
        ctx.restore();
    }
}

// Mode 4: Spectrum (Smooth)
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
        
        if (i === 0) ctx.lineTo(x, y);
        else {
            const prevX = (i - 1) * bw + bw / 2;
            const prevY = H - (fd[i - 1] / 255) * maxH;
            const cx = (prevX + x) / 2;
            ctx.bezierCurveTo(cx, prevY, cx, y, x, y);
        }
    }
    
    ctx.lineTo(W, H);
    ctx.closePath();
    
    const grad = ctx.createLinearGradient(0, H - maxH, 0, H);
    const c = state.settings.rainbow ? `hsl(${(Date.now()*0.05)%360}, 80%, 60%)` : state.settings.fixedColor;
    grad.addColorStop(0, c);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Mode 5: Particles
function initParticles() {
    state.particles = [];
    const count = state.settings.effectLevel === 0 ? 0 : state.settings.effectLevel * 50 + 50;
    for (let i = 0; i < count; i++) {
        state.particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 0, vy: 0,
            size: Math.random() * 3 + 1,
            color: Math.random() * 360
        });
    }
}

function drawParticles(fd) {
    if (state.particles.length === 0) initParticles();
    
    // Get bass energy for movement
    const bass = (fd[0] + fd[1] + fd[2] + fd[3]) / 4 / 255;
    
    state.particles.forEach((p, i) => {
        const band = i % fd.length;
        const v = fd[band] / 255;
        
        p.vx += (Math.random() - 0.5) * 0.5;
        p.vy += (Math.random() - 0.5) * 0.5 - v * 0.5; // Upward flow
        
        // Bass kick
        if (bass > 0.8) {
            p.vx += (p.x - W/2) * 0.01;
            p.vy += (p.y - H/2) * 0.01;
        }
        
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + v), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.color}, 80%, 60%, ${0.3 + v})`;
        ctx.fill();
    });
}

// Mode 6: Detailed Monitor
function drawMonitor(fd) {
    // Background grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for(let i=0; i<W; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for(let i=0; i<H; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }
    
    // Calculate stats
    let sum = 0, max = 0;
    for(let v of fd) { sum += v; max = Math.max(max, v); }
    const avg = sum / fd.length;
    const rms = Math.sqrt(sum*sum/fd.length); // Rough RMS
    
    // Draw Stats Box
    const boxW = 300;
    const boxX = W - boxW - 20;
    const boxY = 20;
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.strokeStyle = state.settings.fixedColor;
    ctx.lineWidth = 2;
    ctx.fillRect(boxX, boxY, boxW, 200);
    ctx.strokeRect(boxX, boxY, boxW, 200);
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`PEAK: ${max} / 255`, boxX + 20, boxY + 30);
    ctx.fillText(`AVG : ${avg.toFixed(1)}`, boxX + 20, boxY + 50);
    ctx.fillText(`RMS : ${rms.toFixed(1)}`, boxX + 20, boxY + 70);
    
    // Draw dB Bars for bands
    const bands = [
        {name: 'SUB', val: (fd[0]+fd[1])/2},
        {name: 'LOW', val: (fd[2]+fd[3]+fd[4])/3},
        {name: 'MID', val: (fd[10]+fd[11]+fd[12])/3},
        {name: 'HGH', val: (fd[20]+fd[21]+fd[22])/3}
    ];
    
    bands.forEach((b, i) => {
        const y = boxY + 100 + i * 25;
        ctx.fillText(b.name, boxX + 20, y + 14);
        
        // Bar bg
        ctx.fillStyle = '#333';
        ctx.fillRect(boxX + 60, y, 200, 16);
        
        // Bar fill
        const w = (b.val / 255) * 200;
        ctx.fillStyle = getColor(i * 10, 1, 40);
        ctx.fillRect(boxX + 60, y, w, 16);
    });
    
    // Main Spectrum at bottom
    const barW = W / fd.length;
    for(let i=0; i<fd.length; i++) {
        const h = (fd[i]/255) * (H/2);
        ctx.fillStyle = getColor(i, fd[i]/255, fd.length);
        ctx.fillRect(i*barW, H-h, barW-1, h);
    }
}

// Mode 7: Tunnel (New)
function drawTunnel(fd) {
    const cx = W/2, cy = H/2;
    const maxR = Math.max(W, H) * 0.8;
    const rings = 20;
    
    // Bass affects speed/rotation
    const bass = fd[0] / 255;
    const rotation = Date.now() * 0.001 + bass;
    
    for(let i=0; i<rings; i++) {
        const progress = (i / rings + Date.now() * 0.0002) % 1;
        const r = progress * maxR;
        const idx = Math.floor(progress * fd.length);
        const v = fd[idx] / 255;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * (i%2 ? 1 : -1));
        
        ctx.beginPath();
        const sides = 6;
        for(let j=0; j<=sides; j++) {
            const ang = j * 2 * Math.PI / sides;
            const rad = r * (1 + v * 0.2);
            j===0 ? ctx.moveTo(Math.cos(ang)*rad, Math.sin(ang)*rad) 
                  : ctx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad);
        }
        
        ctx.strokeStyle = getColor(idx, v, fd.length);
        ctx.lineWidth = 2 + v * 5;
        if(state.settings.effectLevel >= 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.strokeStyle;
        }
        ctx.stroke();
        ctx.restore();
    }
}

// Mode 8: Mirror Bars
function drawMirrorBars(fd, maxH) {
    const n = fd.length;
    const bw = W / n;
    const cy = H / 2;
    
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255;
        const h = v * maxH * 0.5;
        const color = getColor(i, v, n);
        
        if (state.settings.effectLevel >= 1 && v > 0.1) {
            ctx.shadowBlur = state.settings.glowStrength;
            ctx.shadowColor = color;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(i * bw + 1, cy - h, bw - 2, h);
        ctx.fillRect(i * bw + 1, cy, bw - 2, h);
        ctx.shadowBlur = 0;
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);