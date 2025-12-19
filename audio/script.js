/**
 * Audio Visualizer Pro V7
 * - Removed YouTube
 * - Improved Input Source Switching (File / Mic)
 * - Microphone Device Selection
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
    
    // Input Source
    inputSource: 'file', // 'file' or 'mic'
    micStream: null,
    micDeviceId: '',
    
    // Audio nodes
    audioCtx: null,
    analyser: null,
    source: null,      // Current active source
    fileSource: null,  // MediaElementSource
    micSource: null,   // MediaStreamSource
    eqFilters: [],
    gainNode: null,
    
    // Visualization data
    freqData: null,
    timeData: null,
    bufLen: 0,
    
    // Settings
    settings: {
        smoothing: 0.7,
        sensitivity: 1.0,
        barCount: 64,
        lowFreq: 20,
        highFreq: 16000,
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
const ctx = cv.getContext('2d', { alpha: false });
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
    fullscreenBtn: $('fullscreenBtn'),
    openSettingsBtn: $('openSettingsBtn'),
    exportBtn: $('exportBtn'),
    sourceFileBtn: $('sourceFileBtn'),
    sourceMicBtn: $('sourceMicBtn'),
    micDeviceSelect: $('micDeviceSelect'),
    settingsModal: $('settingsModal'),
    closeSettingsBtn: $('closeSettingsBtn'),
    saveSettingsBtn: $('saveSettingsBtn'),
    controlsBar: $('controlsBar'),
    overlayMsg: $('overlayMsg'),
    progressContainer: $('progressContainer'),
    playbackControls: $('playbackControls')
};

let W, H;
let topBarH = 0;
let bottomBarH = 0;

// ============== INITIALIZATION ==============
function init() {
    loadSettings();
    resize();
    window.addEventListener('resize', resize);
    // Calculate UI heights after initial render
    requestAnimationFrame(() => {
        calculateUIHeights();
    });
    
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
    els.modeSelect.onchange = e => { state.mode = +e.target.value; };
    els.toggleUIBtn.onclick = toggleUI;
    // Initialize toggle button label
    els.toggleUIBtn.textContent = state.uiVisible ? '🔳' : '🔲';
    els.fullscreenBtn.onclick = toggleFullscreen;
    els.openSettingsBtn.onclick = openSettings;
    els.closeSettingsBtn.onclick = closeSettings;
    els.saveSettingsBtn.onclick = saveSettings;
    els.exportBtn.onclick = startExport;
    els.playlistToggle.onclick = togglePlaylist;
    els.fileInput.onchange = handleLocalFiles;
    els.gDriveBtn.onclick = openGDrivePicker;
    
    // Source Toggle
    els.sourceFileBtn.onclick = () => setInputSource('file');
    els.sourceMicBtn.onclick = () => setInputSource('mic');
    
    // Mic Device Select
    els.micDeviceSelect.onchange = e => {
        state.micDeviceId = e.target.value;
        if (state.inputSource === 'mic') startMic();
    };
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => switchTab(btn.dataset.tab);
    });
    
    setupSettingsInputs();
    document.addEventListener('keydown', handleKeyboard);
    applySettingsToUI();
    
    // Enumerate devices
    enumerateMicDevices();
    
    requestAnimationFrame(draw);
}

function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
    // Recalculate UI heights on resize
    requestAnimationFrame(() => {
        calculateUIHeights();
    });
}

function calculateUIHeights() {
    const topBar = document.querySelector('.top-bar');
    const controlsBar = document.querySelector('.controls-bar');
    if (topBar) topBarH = topBar.getBoundingClientRect().height;
    if (controlsBar) bottomBarH = controlsBar.getBoundingClientRect().height;
}

// ============== SETTINGS ==============
function loadSettings() {
    const saved = localStorage.getItem('audioVisualizerSettingsV7');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state.settings, parsed);
        } catch (e) { console.warn('Settings load failed'); }
    }
}

function saveSettingsToStorage() {
    if (state.settings.persistSettings) {
        localStorage.setItem('audioVisualizerSettingsV7', JSON.stringify(state.settings));
    }
}

function setupSettingsInputs() {
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
    $('lowFreqSlider').oninput = e => {
        state.settings.lowFreq = +e.target.value;
        $('lowFreqValue').textContent = state.settings.lowFreq + 'Hz';
    };
    $('highFreqSlider').oninput = e => {
        state.settings.highFreq = +e.target.value;
        $('highFreqValue').textContent = (state.settings.highFreq >= 1000 ? (state.settings.highFreq/1000) + 'kHz' : state.settings.highFreq + 'Hz');
    };
    EQ_FREQS.forEach((freq, i) => {
        const id = freq >= 1000 ? `eq${freq/1000}k` : `eq${freq}`;
        const el = $(id);
        if (el) el.oninput = e => { state.settings.eq[i] = +e.target.value; updateEQ(i, +e.target.value); };
    });
    $('resetEqBtn').onclick = resetEQ;
    $('glowSlider').oninput = e => { 
        state.settings.glowStrength = +e.target.value; 
        $('glowValue').textContent = state.settings.glowStrength > 30 ? '強' : state.settings.glowStrength > 10 ? '中' : '弱';
    };
    $('rainbowCheckbox').onchange = e => { state.settings.rainbow = e.target.checked; };
    $('fixedColorPicker').oninput = e => { state.settings.fixedColor = e.target.value; };
    $('clientIdInput').onchange = e => { state.settings.gDriveClientId = e.target.value.trim(); };
    $('apiKeyInput').onchange = e => { state.settings.gDriveApiKey = e.target.value.trim(); };
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
    $('glowSlider').value = state.settings.glowStrength;
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
function saveSettings() { saveSettingsToStorage(); closeSettings(); }

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    $(`tab-${tabId}`).classList.add('active');
}

// ============== AUDIO ENGINE ==============
function initAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = 4096;
        state.analyser.smoothingTimeConstant = state.settings.smoothing;
        state.gainNode = state.audioCtx.createGain();
        state.gainNode.gain.value = 1.0;
        state.eqFilters = EQ_FREQS.map((freq, i) => {
            const filter = state.audioCtx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1;
            filter.gain.value = state.settings.eq[i];
            return filter;
        });
        let lastNode = state.eqFilters[0];
        for(let i=1; i<state.eqFilters.length; i++) {
            state.eqFilters[i-1].connect(state.eqFilters[i]);
            lastNode = state.eqFilters[i];
        }
        lastNode.connect(state.analyser);
        state.analyser.connect(state.gainNode);
        state.gainNode.connect(state.audioCtx.destination);
        state.bufLen = state.analyser.frequencyBinCount;
        state.freqData = new Uint8Array(state.bufLen);
        state.timeData = new Uint8Array(state.bufLen);
    }
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
}

async function setInputSource(source) {
    state.inputSource = source;
    
    // Update UI
    els.sourceFileBtn.classList.toggle('active', source === 'file');
    els.sourceMicBtn.classList.toggle('active', source === 'mic');
    
    els.progressContainer.classList.toggle('hidden', source === 'mic');
    els.playbackControls.classList.toggle('hidden', source === 'mic');
    
    if (source === 'mic') {
        audio.pause();
        await startMic();
        els.statusText.textContent = '🎤 マイク入力中';
    } else {
        stopMic();
        connectFileSource();
        els.statusText.textContent = state.playlist[state.currentIndex] ? `🎵 ${state.playlist[state.currentIndex].name}` : '待機中...';
    }
}

async function startMic() {
    initAudioContext();
    stopMic(); // Clean up previous
    
    try {
        const constraints = {
            audio: state.micDeviceId ? { deviceId: { exact: state.micDeviceId } } : true
        };
        state.micStream = await navigator.mediaDevices.getUserMedia(constraints);
        state.micSource = state.audioCtx.createMediaStreamSource(state.micStream);
        
        // Disconnect file source if any
        if (state.fileSource) state.fileSource.disconnect();
        
        state.micSource.connect(state.eqFilters[0]);
        state.gainNode.gain.value = 0; // Prevent feedback
        showOverlay('マイク入力開始');
    } catch (e) {
        alert('マイクアクセス失敗: ' + e.message);
        setInputSource('file');
    }
}

function stopMic() {
    if (state.micStream) {
        state.micStream.getTracks().forEach(t => t.stop());
        state.micStream = null;
    }
    if (state.micSource) {
        state.micSource.disconnect();
        state.micSource = null;
    }
}

function connectFileSource() {
    initAudioContext();
    if (!state.fileSource) {
        state.fileSource = state.audioCtx.createMediaElementSource(audio);
    }
    state.fileSource.connect(state.eqFilters[0]);
    state.gainNode.gain.value = els.volSlider.value;
}

async function enumerateMicDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter(d => d.kind === 'audioinput');
        els.micDeviceSelect.innerHTML = mics.map(m => `<option value="${m.deviceId}">${m.label || 'マイク ' + m.deviceId.slice(0,5)}</option>`).join('');
    } catch (e) { console.warn('Device enumeration failed', e); }
}

function updateEQ(index, gain) { if (state.eqFilters[index]) state.eqFilters[index].gain.value = gain; }
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
    if (state.inputSource === 'mic') return;
    if (state.playlist.length === 0) return;
    if (state.currentIndex === -1) { playTrack(0); return; }
    initAudioContext();
    state.isPlaying ? audio.pause() : audio.play().catch(console.error);
}

function playTrack(index) {
    if (index < 0 || index >= state.playlist.length) return;
    state.currentIndex = index;
    const track = state.playlist[index];
    els.statusText.textContent = `🎵 ${track.name}`;
    renderPlaylist();
    audio.pause();
    audio.currentTime = 0;
    audio.src = track.url;
    audio.load();
    connectFileSource();
    setTimeout(() => { audio.play().catch(console.warn); }, 100);
}

function prevTrack() { if (state.playlist.length > 0) playTrack(state.currentIndex <= 0 ? state.playlist.length - 1 : state.currentIndex - 1); }
function nextTrack() { if (state.playlist.length > 0) playTrack((state.currentIndex + 1) % state.playlist.length); }
function seek() { if (state.inputSource === 'file') audio.currentTime = els.seekBar.value; }
function updateVolume() {
    const v = els.volSlider.value;
    audio.volume = v;
    if (state.inputSource === 'file' && state.gainNode) state.gainNode.gain.value = v;
    els.volIcon.textContent = v == 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
}
function onMetadataLoaded() { els.seekBar.max = audio.duration || 0; updateTimeDisplay(); }
function updateProgress() { if (!isNaN(audio.currentTime)) { els.seekBar.value = audio.currentTime; updateTimeDisplay(); } }
function updateTimeDisplay() { els.timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; }
function updatePlayBtn() { els.playBtn.textContent = state.isPlaying ? '⏸' : '▶'; }
function handleAudioError(e) { console.error('Audio error:', e); els.statusText.textContent = '再生エラー'; }
function formatTime(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; }

// ============== PLAYLIST & DRIVE ==============
function handleLocalFiles(e) {
    const files = Array.from(e.target.files);
    files.forEach(file => { state.playlist.push({ name: file.name, url: URL.createObjectURL(file), source: 'local' }); });
    renderPlaylist();
    if (state.currentIndex === -1) playTrack(state.playlist.length - files.length);
    e.target.value = '';
}

function renderPlaylist() {
    if (state.playlist.length === 0) { els.playlistItems.innerHTML = '<div class="playlist-empty">曲を追加してください</div>'; return; }
    els.playlistItems.innerHTML = state.playlist.map((track, i) => `<div class="playlist-item ${i === state.currentIndex ? 'active' : ''}" data-index="${i}"><span class="name">${i + 1}. ${track.name}</span><span class="remove-btn" data-index="${i}">✖</span></div>`).join('');
    els.playlistItems.querySelectorAll('.playlist-item').forEach(item => { item.onclick = e => { if (!e.target.classList.contains('remove-btn')) playTrack(+item.dataset.index); }; });
    els.playlistItems.querySelectorAll('.remove-btn').forEach(btn => { btn.onclick = e => { e.stopPropagation(); removeFromPlaylist(+btn.dataset.index); }; });
}

function removeFromPlaylist(index) {
    const track = state.playlist[index];
    if (track.source === 'local') URL.revokeObjectURL(track.url);
    state.playlist.splice(index, 1);
    if (state.currentIndex === index) {
        if (state.playlist.length > 0) playTrack(index < state.playlist.length ? index : 0);
        else { audio.pause(); state.currentIndex = -1; state.isPlaying = false; updatePlayBtn(); els.statusText.textContent = '待機中...'; }
    } else if (state.currentIndex > index) state.currentIndex--;
    renderPlaylist();
}

function togglePlaylist() { els.playlistPanel.classList.toggle('collapsed'); els.playlistToggle.textContent = els.playlistPanel.classList.contains('collapsed') ? '📂' : '✖'; }

// Google Drive (Simplified)
let accessToken = null;
function openGDrivePicker() { if (!state.settings.gDriveClientId || !state.settings.gDriveApiKey) { openSettings(); switchTab('gdrive'); return; } if (accessToken) createPicker(); else initGoogleAuth(); }
function initGoogleAuth() { if (typeof google === 'undefined' || !google.accounts) { const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.onload = requestGoogleToken; document.body.appendChild(script); } else requestGoogleToken(); }
function requestGoogleToken() { const tokenClient = google.accounts.oauth2.initTokenClient({ client_id: state.settings.gDriveClientId, scope: 'https://www.googleapis.com/auth/drive.readonly', callback: r => { if (r.error) return; accessToken = r.access_token; loadPickerApi(); } }); tokenClient.requestAccessToken({ prompt: 'consent' }); }
function loadPickerApi() { if (typeof gapi !== 'undefined' && gapi.picker) createPicker(); else { const script = document.createElement('script'); script.src = 'https://apis.google.com/js/api.js'; script.onload = () => gapi.load('picker', createPicker); document.body.appendChild(script); } }
function createPicker() { const docsView = new google.picker.DocsView().setIncludeFolders(true).setMimeTypes('audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac,audio/m4a,audio/mp4'); new google.picker.PickerBuilder().addView(docsView).enableFeature(google.picker.Feature.MULTISELECT_ENABLED).setOAuthToken(accessToken).setDeveloperKey(state.settings.gDriveApiKey).setCallback(pickerCallback).build().setVisible(true); }
async function pickerCallback(data) { if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) { const docs = data[google.picker.Response.DOCUMENTS]; for (const doc of docs) await fetchDriveFile(doc[google.picker.Document.ID], doc[google.picker.Document.NAME]); } }
async function fetchDriveFile(fileId, fileName) { try { const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { 'Authorization': 'Bearer ' + accessToken } }); if (!r.ok) return; const blob = await r.blob(); state.playlist.push({ name: fileName, url: URL.createObjectURL(blob), source: 'drive' }); renderPlaylist(); if (state.currentIndex === -1) playTrack(state.playlist.length - 1); } catch (e) {} }

// ============== UI CONTROLS ==============
function toggleUI() { 
    state.uiVisible = !state.uiVisible; 
    els.uiLayer.classList.toggle('hidden', !state.uiVisible); 
    els.toggleUIBtn.textContent = state.uiVisible ? '🔳' : '🔲'; 
}

function toggleFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (requestFullScreen) {
            requestFullScreen.call(docEl);
        } else if (typeof window.ActiveXObject !== "undefined") { // for Internet Explorer
            const wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    } else {
        if (cancelFullScreen) {
            cancelFullScreen.call(doc);
        }
    }
}

function showOverlay(msg, duration = 2000) { els.overlayMsg.textContent = msg; els.overlayMsg.classList.remove('hidden'); if (duration > 0) setTimeout(() => { els.overlayMsg.classList.add('hidden'); }, duration); }
function handleKeyboard(e) { if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return; switch (e.key.toLowerCase()) { case ' ': e.preventDefault(); togglePlay(); break; case 'h': toggleUI(); break; case 'arrowleft': prevTrack(); break; case 'arrowright': nextTrack(); break; } }

// ============== EXPORT ==============
function startExport() {
    if (state.inputSource === 'mic') { alert('マイク入力モードでは書き出しできません'); return; }
    if (!state.playlist[state.currentIndex]) return;
    if (!confirm('現在の曲を動画として書き出しますか？')) return;
    state.isExporting = true;
    const stream = cv.captureStream(60);
    state.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
    state.recordedChunks = [];
    state.mediaRecorder.ondataavailable = e => { if (e.data.size > 0) state.recordedChunks.push(e.data); };
    audio.pause(); audio.currentTime = 0;
    state.gainNode.gain.value = 0;
    if (state.uiVisible) toggleUI();
    showOverlay('🎬 動画書き出し中...', 0);
    state.mediaRecorder.start();
    audio.play();
}
function finishExport() {
    state.mediaRecorder.stop();
    state.isExporting = false;
    if (!state.uiVisible) toggleUI();
    els.overlayMsg.classList.add('hidden');
    state.gainNode.gain.value = els.volSlider.value;
    setTimeout(() => {
        const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `visualizer_${state.playlist[state.currentIndex].name}.webm`;
        a.click();
        alert('書き出し完了');
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
        // 感度をフリークエンシーデータに乗算 → グラフの高さに直接反映
        out[i] = Math.min(255, state.freqData[idx] * state.settings.sensitivity);
    }
    return out;
}
function freqToIdx(f) { return state.audioCtx ? Math.round(f * state.analyser.fftSize / state.audioCtx.sampleRate) : 0; }
function getColor(i, v = 1, total = state.settings.barCount) {
    if (state.settings.rainbow) { const hue = (i / total) * 360 + Date.now() * 0.05; return `hsl(${hue}, 80%, ${50 + v * 20}%)`; }
    return state.settings.fixedColor;
}

function draw() {
    requestAnimationFrame(draw);
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);
    if (!state.analyser) return;
    const fd = getFilteredData();
    
    // Use full screen height for visualization
    const drawH = H;
    const drawStartY = 0;
    const maxH = drawH * 0.9;

    switch (state.mode) {
        case 0: drawBars(fd, maxH, drawH, drawStartY); break;
        case 1: drawWaveform(maxH, drawH, drawStartY); break;
        case 2: drawDigitalBlocks(fd, maxH, drawH, drawStartY); break;
        case 3: drawCircle(fd, maxH, drawH, drawStartY); break;
        case 4: drawSpectrum(fd, maxH, drawH, drawStartY); break;
        case 5: drawGalaxy(fd, drawH, drawStartY); break;
        case 6: drawMonitor(fd, drawH, drawStartY); break;
        case 7: drawHexagon(fd, drawH, drawStartY); break;
        case 8: drawMirrorBars(fd, maxH, drawH, drawStartY); break;
    }
}

// Modes (Same as V6 but with drawH adjustment and Y offset)
function drawBars(fd, maxH, drawH, drawStartY) {
    const n = fd.length; const bw = W / n;
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255; const h = v * maxH; const color = getColor(i, v, n);
        if (state.settings.glowStrength > 0 && v > 0.1) { ctx.shadowBlur = state.settings.glowStrength * v; ctx.shadowColor = color; }
        ctx.fillStyle = color; ctx.fillRect(i * bw + 1, drawStartY + drawH - h, bw - 2, h); ctx.shadowBlur = 0;
    }
}
function drawWaveform(maxH, drawH, drawStartY) {
    let startIdx = 0; for (let i = 0; i < state.bufLen - 1; i++) { if (state.timeData[i] < 128 && state.timeData[i+1] >= 128) { startIdx = i; break; } }
    ctx.beginPath(); const slice = W / (state.bufLen - startIdx); const centerY = drawStartY + drawH / 2;
    for (let i = startIdx; i < state.bufLen; i++) { const v = state.timeData[i] / 128 - 1; const y = centerY + v * maxH * 0.5; i === startIdx ? ctx.moveTo(0, y) : ctx.lineTo((i - startIdx) * slice, y); }
    ctx.strokeStyle = state.settings.rainbow ? `hsl(${(Date.now() * 0.1) % 360}, 80%, 60%)` : state.settings.fixedColor; ctx.lineWidth = 3;
    if (state.settings.glowStrength > 0) { ctx.shadowBlur = state.settings.glowStrength; ctx.shadowColor = ctx.strokeStyle; }
    ctx.stroke(); ctx.shadowBlur = 0;
}
function drawDigitalBlocks(fd, maxH, drawH, drawStartY) {
    const cols = 32; const rows = 20; const cellW = W / cols; const cellH = drawH / rows;
    for (let i = 0; i < cols; i++) {
        const idx = Math.floor(i / cols * fd.length); const v = fd[idx] / 255; const activeRows = Math.floor(v * rows);
        for (let j = 0; j < rows; j++) { if (rows - j <= activeRows) { ctx.fillStyle = getColor(i, (rows-j)/rows, cols); ctx.fillRect(i * cellW + 2, drawStartY + j * cellH + 2, cellW - 4, cellH - 4); } else { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(i * cellW + 2, drawStartY + j * cellH + 2, cellW - 4, cellH - 4); } }
    }
}
function drawCircle(fd, maxH, drawH, drawStartY) {
    const cx = W / 2, cy = drawStartY + drawH / 2; const r = Math.min(W, drawH) * 0.25; const n = fd.length; const circumference = 2 * Math.PI * r; const barW = (circumference / n) * 0.8;
    for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 - Math.PI / 2; const v = fd[i] / 255; const len = v * maxH * 0.6;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); const color = getColor(i, v, n); ctx.fillStyle = color;
        if (state.settings.glowStrength > 0 && v > 0.2) { ctx.shadowBlur = state.settings.glowStrength; ctx.shadowColor = color; }
        ctx.fillRect(r, -barW/2, len, barW); ctx.restore();
    }
}
function drawSpectrum(fd, maxH, drawH, drawStartY) {
    const n = fd.length; const bw = W / n; ctx.beginPath(); ctx.moveTo(0, drawStartY + drawH);
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255; const h = v * maxH; const x = i * bw + bw / 2; const y = drawStartY + drawH - h;
        if (i === 0) ctx.lineTo(x, y); else { const prevX = (i - 1) * bw + bw / 2; const prevY = drawStartY + drawH - (fd[i - 1] / 255) * maxH; const cx = (prevX + x) / 2; ctx.bezierCurveTo(cx, prevY, cx, y, x, y); }
    }
    ctx.lineTo(W, drawStartY + drawH); ctx.closePath(); 
    
    const grad = ctx.createLinearGradient(0, drawStartY + drawH - maxH, 0, drawStartY + drawH); 
    const hue = Math.floor((Date.now() * 0.05) % 360);
    const c = state.settings.rainbow ? `hsl(${hue}, 80%, 60%)` : state.settings.fixedColor; 
    grad.addColorStop(0, c); grad.addColorStop(1, 'transparent'); 
    ctx.fillStyle = grad; ctx.fill(); 
    
    ctx.strokeStyle = state.settings.rainbow ? `hsl(${hue}, 80%, 80%)` : '#fff'; 
    ctx.lineWidth = 2; ctx.stroke();
}
function drawGalaxy(fd, drawH, drawStartY) {
    const cx = W/2, cy = drawStartY + drawH/2; const bass = fd[0] / 255; ctx.save(); ctx.translate(cx, cy); ctx.rotate(Date.now() * 0.0005);
    const arms = 5; const particlesPerArm = 20;
    for(let i=0; i<arms; i++) {
        for(let j=0; j<particlesPerArm; j++) {
            const progress = j / particlesPerArm; const idx = Math.floor(progress * fd.length); const v = fd[idx] / 255;
            const angle = (i / arms) * Math.PI * 2 + progress * Math.PI * 2; const r = progress * Math.min(W, drawH) * 0.4 + (bass * 50);
            const x = Math.cos(angle) * r; const y = Math.sin(angle) * r; const size = (v * 10 + 2) * (1 - progress * 0.5);
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fillStyle = getColor(idx, v, fd.length);
            if(state.settings.glowStrength > 0) { ctx.shadowBlur = size * 2; ctx.shadowColor = ctx.fillStyle; }
            ctx.fill(); ctx.shadowBlur = 0;
        }
    }
    ctx.restore();
}
function drawMonitor(fd, drawH, drawStartY) {
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1; for(let i=0; i<W; i+=50) { ctx.beginPath(); ctx.moveTo(i,drawStartY); ctx.lineTo(i,drawStartY+drawH); ctx.stroke(); } for(let i=0; i<drawH; i+=50) { ctx.beginPath(); ctx.moveTo(0,drawStartY+i); ctx.lineTo(W,drawStartY+i); ctx.stroke(); }
    let sum = 0, max = 0, maxIdx = 0; for(let i=0; i<fd.length; i++) { sum += fd[i]; if(fd[i] > max) { max = fd[i]; maxIdx = i; } }
    const avg = sum / fd.length; const peakFreq = Math.round(maxIdx * (state.settings.highFreq - state.settings.lowFreq) / fd.length + state.settings.lowFreq);
    const boxW = Math.min(320, W - 40); const boxX = W - boxW - 20; const boxY = drawStartY + 20;
    const hue = Math.floor((Date.now() * 0.05) % 360);
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.strokeStyle = state.settings.rainbow ? `hsl(${hue}, 80%, 60%)` : state.settings.fixedColor; ctx.lineWidth = 2; ctx.fillRect(boxX, boxY, boxW, 280); ctx.strokeRect(boxX, boxY, boxW, 280);
    ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.fillText(`PEAK LEVEL: ${max} / 255`, boxX + 20, boxY + 30); ctx.fillText(`AVG LEVEL : ${avg.toFixed(1)}`, boxX + 20, boxY + 50); ctx.fillText(`PEAK FREQ : ${peakFreq} Hz`, boxX + 20, boxY + 70); ctx.fillText(`FFT SIZE  : ${state.analyser.fftSize}`, boxX + 20, boxY + 90);
    const bands = [{name: 'SUB (20-60)', val: (fd[0]+fd[1])/2}, {name: 'LOW (60-250)', val: (fd[2]+fd[3]+fd[4])/3}, {name: 'MID (250-2k)', val: (fd[10]+fd[11]+fd[12])/3}, {name: 'HGH (2k-4k)', val: (fd[20]+fd[21]+fd[22])/3}, {name: 'AIR (4k+)', val: (fd[30]+fd[31])/2}];
    bands.forEach((b, i) => { const y = boxY + 120 + i * 30; ctx.fillText(b.name, boxX + 20, y + 14); ctx.fillStyle = '#333'; ctx.fillRect(boxX + 120, y, boxW - 140, 16); const w = (b.val / 255) * (boxW - 140); ctx.fillStyle = getColor(i * 10, 1, 40); ctx.fillRect(boxX + 120, y, w, 16); });
    const barW = W / fd.length; for(let i=0; i<fd.length; i++) { const h = (fd[i]/255) * (drawH/2); ctx.fillStyle = getColor(i, fd[i]/255, fd.length); ctx.fillRect(i*barW, drawStartY+drawH-h, barW-1, h); }
}
function drawHexagon(fd, drawH, drawStartY) {
    const cx = W/2, cy = drawStartY + drawH/2; const maxR = Math.min(W, drawH) * 0.4; const layers = 10;
    for(let i=0; i<layers; i++) {
        const idx = Math.floor(i / layers * fd.length); const v = fd[idx] / 255; const r = (i + 1) / layers * maxR * (1 + v * 0.5);
        ctx.beginPath(); for(let j=0; j<6; j++) { const angle = j * Math.PI / 3 + (i%2 ? 0 : Math.PI/6) + Date.now() * 0.0002 * (i+1); const x = cx + Math.cos(angle) * r; const y = cy + Math.sin(angle) * r; j===0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.closePath();
        ctx.strokeStyle = getColor(idx, v, fd.length); ctx.lineWidth = 2 + v * 5; if(state.settings.glowStrength > 0) { ctx.shadowBlur = 10; ctx.shadowColor = ctx.strokeStyle; } ctx.stroke(); ctx.shadowBlur = 0;
    }
}
function drawMirrorBars(fd, maxH, drawH, drawStartY) {
    const n = fd.length; const bw = W / n; const cy = drawStartY + drawH / 2;
    for (let i = 0; i < n; i++) {
        const v = fd[i] / 255; const h = v * maxH * 0.5; const color = getColor(i, v, n);
        if (state.settings.glowStrength > 0 && v > 0.1) { ctx.shadowBlur = state.settings.glowStrength; ctx.shadowColor = color; }
        ctx.fillStyle = color; ctx.fillRect(i * bw + 1, cy - h, bw - 2, h); ctx.fillRect(i * bw + 1, cy, bw - 2, h); ctx.shadowBlur = 0;
    }
}

document.addEventListener('DOMContentLoaded', init);