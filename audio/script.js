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
    playlistVisible: false,
    settingsOpen: false,
    isExporting: false,
    mediaRecorder: null,
    recordedChunks: [],
    playTimeout: null,
    uiTimeout: null,
    sleepTimerId: null,
    lastSyncTime: 0,
    
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
        fftSize: 4096,
        opacity: 1.0,
        bgBlur: 0,
        mirror: false,
        rainbow: true,
        fixedColor: '#4facfe',
        showLabels: true,
        persistSettings: true,
        lowPowerMode: false,
        showVideo: true,
        videoMode: 'window', // 'window' or 'background'
        repeatMode: 'none',  // 'none', 'one', 'all'
        shuffle: false,
        gDriveClientId: '',
        gDriveApiKey: '',
        eq: [0, 0, 0, 0, 0, 0, 0, 0],
        playbackRate: 1.0,
        sleepTimer: 0,
        autoPlayNext: true,
        stopOnVideoEnd: false
    }
};

const EQ_FREQS = [60, 170, 350, 1000, 3000, 6000, 12000, 14000];

const COLOR_PRESETS = [
    { name: 'Cyber', color: '#00f2ff' },
    { name: 'Sunset', color: '#ff4e50' },
    { name: 'Lime', color: '#32ff7e' },
    { name: 'Purple', color: '#7d5fff' },
    { name: 'Gold', color: '#f9ca24' },
    { name: 'Sakura', color: '#ff9ff3' },
    { name: 'Ocean', color: '#4facfe' },
    { name: 'Flame', color: '#eb4d4b' }
];

// ============== DOM ELEMENTS ==============
const $ = id => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');
const audio = new Audio();
const bgVideo = $('bgVideo');

const els = {
    uiLayer: $('uiLayer'),
    playBtn: $('playBtn'),
    prevBtn: $('prevBtn'),
    nextBtn: $('nextBtn'),
    shuffleBtn: $('shuffleBtn'),
    repeatBtn: $('repeatBtn'),
    seekBar: $('seekBar'),
    timeDisplay: $('timeDisplay'),
    volSlider: $('volSlider'),
    volIcon: $('volIcon'),
    modeSelect: $('modeSelect'),
    statusText: $('statusText'),
    playlistPanel: $('playlistPanel'),
    playlistToggle: $('playlistToggle'),
    playlistItems: $('playlistItems'),
    playlistSearchInput: $('playlistSearchInput'),
    clearPlaylistBtn: $('clearPlaylistBtn'),
    fileInput: $('fileInput'),
    gDriveBtn: $('gDriveBtn'),
    toggleUIBtn: $('toggleUIBtn'),
    fullscreenBtn: $('fullscreenBtn'),
    openSettingsBtn: $('openSettingsBtn'),
    resetAllSettingsBtn: $('resetAllSettingsBtn'),
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
    playbackControls: $('playbackControls'),
    videoContainer: $('videoContainer'),
    closeVideoBtn: $('closeVideoBtn'),
    toggleVideoModeBtn: $('toggleVideoModeBtn'),
    lowPowerModeCheckbox: $('lowPowerModeCheckbox'),
    showVideoCheckbox: $('showVideoCheckbox'),
    videoModeSelect: $('videoModeSelect'),
    sleepTimerSelect: $('sleepTimerSelect'),
    sleepTimerStatus: $('sleepTimerStatus'),
    autoPlayNextCheckbox: $('autoPlayNextCheckbox'),
    stopOnVideoEndCheckbox: $('stopOnVideoEndCheckbox'),
    persistSettingsCheckbox: $('persistSettingsCheckbox')
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
    audio.addEventListener('play', () => { 
        state.isPlaying = true; 
        updatePlayBtn(); 
        if (bgVideo.src && state.settings.showVideo) {
            bgVideo.play().catch(() => {});
        }
    });
    audio.addEventListener('playing', () => {
        if (bgVideo.src && state.settings.showVideo) {
            // 音声が実際に再生開始された瞬間に動画の時間を同期
            bgVideo.currentTime = audio.currentTime;
            bgVideo.play().catch(() => {});
        }
        const track = state.playlist[state.currentIndex];
        if (track) els.statusText.textContent = `🎵 ${track.name}`;
    });
    audio.addEventListener('waiting', () => {
        if (bgVideo.src) bgVideo.pause();
        els.statusText.textContent = '⏳ 読み込み中...';
    });
    audio.addEventListener('pause', () => { 
        state.isPlaying = false; 
        updatePlayBtn(); 
        bgVideo.pause(); 
    });
    audio.addEventListener('ended', () => {
        if (state.isExporting) finishExport();
        else if (state.settings.autoPlayNext) nextTrack();
        else {
            state.isPlaying = false;
            updatePlayBtn();
        }
    });
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('seeking', () => { if (bgVideo.src) bgVideo.currentTime = audio.currentTime; });
    audio.addEventListener('seeked', () => { if (bgVideo.src) bgVideo.currentTime = audio.currentTime; });

    bgVideo.addEventListener('error', () => {
        console.warn('Video load failed');
        showOverlay('⚠️ 動画の読み込みに失敗しました');
        els.videoContainer.classList.add('hidden');
    });
    bgVideo.addEventListener('ended', () => {
        if (state.settings.stopOnVideoEnd && state.settings.showVideo) {
            audio.pause();
            state.isPlaying = false;
            updatePlayBtn();
            showOverlay('⏹ 動画終了により停止しました');
        }
    });
    
    // UI Events
    els.playBtn.onclick = togglePlay;
    els.prevBtn.onclick = prevTrack;
    els.nextBtn.onclick = nextTrack;
    els.shuffleBtn.onclick = toggleShuffle;
    els.repeatBtn.onclick = toggleRepeat;
    els.seekBar.oninput = seek;
    els.volSlider.oninput = updateVolume;
    els.modeSelect.onchange = e => { 
        state.mode = +e.target.value; 
        const modeName = e.target.options[e.target.selectedIndex].text;
        showOverlay(`📊 モード: ${modeName}`);
    };
    els.toggleUIBtn.onclick = toggleUI;
    // Initialize toggle button label
    els.toggleUIBtn.textContent = state.uiVisible ? '🔳' : '🔲';
    els.fullscreenBtn.onclick = toggleFullscreen;
    els.openSettingsBtn.onclick = openSettings;
    els.closeSettingsBtn.onclick = closeSettings;
    els.saveSettingsBtn.onclick = saveSettings;
    els.resetAllSettingsBtn.onclick = () => {
        if (confirm('すべての設定を初期状態に戻しますか？')) {
            localStorage.removeItem('audioVisualizerSettingsV7');
            location.reload();
        }
    };
    els.exportBtn.onclick = startExport;
    els.playlistToggle.onclick = togglePlaylist;
    els.playlistSearchInput.oninput = renderPlaylist;
    els.clearPlaylistBtn.onclick = () => {
        if (confirm('プレイリストをすべてクリアしますか？')) {
            state.playlist.forEach(t => { if (t.source === 'local') URL.revokeObjectURL(t.url); });
            state.playlist = [];
            state.currentIndex = -1;
            audio.pause();
            state.isPlaying = false;
            updatePlayBtn();
            renderPlaylist();
            els.statusText.textContent = '待機中...';
        }
    };
    els.fileInput.onchange = handleLocalFiles;
    els.gDriveBtn.onclick = openGDrivePicker;
    els.closeVideoBtn.onclick = () => { state.settings.showVideo = false; updateVideoVisibility(); applySettingsToUI(); };
    els.toggleVideoModeBtn.onclick = () => {
        state.settings.videoMode = state.settings.videoMode === 'window' ? 'background' : 'window';
        updateVideoVisibility();
        applySettingsToUI();
    };
    
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
    initDraggableVideo();
    applySettingsToUI();
    updateShuffleRepeatUI();
    
    // Drag & Drop
    document.body.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    // Drag & Drop
    document.body.addEventListener('dragover', e => {
        e.preventDefault();
        document.body.classList.add('drag-over');
    });
    document.body.addEventListener('dragleave', e => {
        e.preventDefault();
        document.body.classList.remove('drag-over');
    });
    document.body.addEventListener('drop', e => {
        e.preventDefault();
        document.body.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    // Auto-hide UI
    document.addEventListener('mousemove', resetUITimeout);
    document.addEventListener('mousedown', resetUITimeout);
    document.addEventListener('touchstart', resetUITimeout);
    document.addEventListener('keydown', e => {
        resetUITimeout();
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch(e.code) {
            case 'Space': e.preventDefault(); togglePlay(); break;
            case 'ArrowLeft': prevTrack(); break;
            case 'ArrowRight': nextTrack(); break;
            case 'ArrowUp': 
                e.preventDefault(); 
                els.volSlider.value = Math.min(1, +els.volSlider.value + 0.1); 
                updateVolume(); 
                showOverlay(`🔊 音量: ${Math.round(audio.volume * 100)}%`);
                break;
            case 'ArrowDown': 
                e.preventDefault(); 
                els.volSlider.value = Math.max(0, +els.volSlider.value - 0.1); 
                updateVolume(); 
                showOverlay(`🔉 音量: ${Math.round(audio.volume * 100)}%`);
                break;
            case 'KeyF': toggleFullscreen(); break;
            case 'KeyH': e.preventDefault(); toggleUI(); break;
            case 'KeyV': 
                state.settings.showVideo = !state.settings.showVideo; 
                updateVideoVisibility(); 
                applySettingsToUI(); 
                showOverlay(state.settings.showVideo ? '📺 動画表示: ON' : '📺 動画表示: OFF');
                break;
            case 'KeyL': 
                state.settings.lowPowerMode = !state.settings.lowPowerMode; 
                applySettingsToUI(); 
                showOverlay(state.settings.lowPowerMode ? '🔋 低電力モード: ON' : '⚡ 低電力モード: OFF'); 
                break;
            case 'KeyR': 
                state.settings.rainbow = !state.settings.rainbow; 
                applySettingsToUI(); 
                showOverlay(state.settings.rainbow ? '🌈 虹色モード: ON' : '🎨 虹色モード: OFF'); 
                break;
            case 'KeyX': 
                state.settings.mirror = !state.settings.mirror; 
                applySettingsToUI(); 
                showOverlay(state.settings.mirror ? '🪞 左右反転: ON' : '🪞 左右反転: OFF'); 
                break;
            case 'KeyS': toggleShuffle(); applySettingsToUI(); break;
            case 'KeyP': toggleRepeat(); applySettingsToUI(); break;
            case 'KeyM': 
                state.mode = (state.mode + 1) % 9; 
                els.modeSelect.value = state.mode;
                const modeName = els.modeSelect.options[els.modeSelect.selectedIndex].text;
                showOverlay(`📊 モード: ${modeName}`);
                break;
        }
    });
    resetUITimeout();
    
    requestAnimationFrame(draw);
}

function resetUITimeout(e) {
    // タップ操作やマウス移動でUIを表示
    if (!state.uiVisible) {
        toggleUI();
    }
    
    if (state.uiTimeout) clearTimeout(state.uiTimeout);
    
    // 設定画面やプレイリストが開いている間、またはマウスがUI上にある間は消さない
    const isOverUI = e && (e.target.closest('.top-bar') || e.target.closest('.controls-bar') || e.target.closest('.settings-modal') || e.target.closest('.playlist-container'));

    if (state.isPlaying && !state.settingsOpen && !state.playlistVisible && !isOverUI) {
        state.uiTimeout = setTimeout(() => {
            if (state.isPlaying && !state.settingsOpen && !state.playlistVisible && state.uiVisible) {
                toggleUI();
            }
        }, 5000);
    }
}

function initDraggableVideo() {
    const container = els.videoContainer;
    const handle = container.querySelector('.video-handle');
    let isDragging = false;
    let startX, startY, initialX, initialY;

    // 保存された位置を復元
    const savedPos = localStorage.getItem('videoWindowPos');
    if (savedPos) {
        const { left, top } = JSON.parse(savedPos);
        container.style.left = left;
        container.style.top = top;
        container.style.transform = 'none';
    }

    handle.onmousedown = e => {
        if (state.settings.videoMode === 'background') return;
        isDragging = true;
        container.classList.add('dragging');
        startX = e.clientX;
        startY = e.clientY;
        initialX = container.offsetLeft;
        initialY = container.offsetTop;
        container.style.transform = 'none';
        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
    };

    function onMouseMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        container.style.left = `${initialX + dx}px`;
        container.style.top = `${initialY + dy}px`;
    }

    function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        container.classList.remove('dragging');
        document.onmousemove = null;
        document.onmouseup = null;
        
        // 位置を保存
        localStorage.setItem('videoWindowPos', JSON.stringify({
            left: container.style.left,
            top: container.style.top
        }));
    }
}

function updateVideoVisibility() {
    const track = state.playlist[state.currentIndex];
    const isVideo = track && track.isVideo;
    const container = els.videoContainer;
    
    container.classList.toggle('hidden', !state.settings.showVideo || !isVideo);
    container.classList.toggle('background-mode', state.settings.videoMode === 'background');
    
    // ウィンドウモードで位置が未設定なら中央下に配置
    if (state.settings.videoMode === 'window' && !localStorage.getItem('videoWindowPos')) {
        container.style.top = 'auto';
        container.style.bottom = '120px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
    }

    // 負荷軽減: 背景ぼかしが0の場合はフィルターを完全に削除
    if (state.settings.bgBlur > 0) {
        bgVideo.style.filter = `blur(${state.settings.bgBlur}px)`;
        bgVideo.style.webkitFilter = `blur(${state.settings.bgBlur}px)`;
    } else {
        bgVideo.style.filter = 'none';
        bgVideo.style.webkitFilter = 'none';
    }
    
    if (isVideo && state.settings.showVideo) {
        if (bgVideo.src !== track.url) {
            bgVideo.src = track.url;
            bgVideo.load(); // 明示的にロード
            
            // ロード完了後に時間を合わせる
            const onLoaded = () => {
                bgVideo.currentTime = audio.currentTime;
                if (state.isPlaying) bgVideo.play().catch(() => {});
                bgVideo.removeEventListener('loadedmetadata', onLoaded);
            };
            bgVideo.addEventListener('loadedmetadata', onLoaded);
        }
    } else {
        bgVideo.pause();
        bgVideo.src = '';
        bgVideo.load();
    }
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
    $('qualitySelect').onchange = e => {
        state.settings.fftSize = +e.target.value;
        if (state.analyser) {
            state.analyser.fftSize = state.settings.fftSize;
            state.bufLen = state.analyser.frequencyBinCount;
            state.freqData = new Uint8Array(state.bufLen);
            state.timeData = new Uint8Array(state.bufLen);
        }
    };
    $('barCountSelect').onchange = e => { state.settings.barCount = +e.target.value; };
    $('showLabelsCheckbox').onchange = e => { state.settings.showLabels = e.target.checked; };
    $('lowPowerModeCheckbox').onchange = e => { state.settings.lowPowerMode = e.target.checked; };
    $('showVideoCheckbox').onchange = e => { state.settings.showVideo = e.target.checked; updateVideoVisibility(); };
    $('videoModeSelect').onchange = e => { state.settings.videoMode = e.target.value; updateVideoVisibility(); };
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
    $('mirrorCheckbox').onchange = e => { state.settings.mirror = e.target.checked; };
    $('bgBlurSlider').oninput = e => {
        state.settings.bgBlur = +e.target.value;
        $('bgBlurValue').textContent = state.settings.bgBlur + 'px';
        updateVideoVisibility();
    };
    $('opacitySlider').oninput = e => {
        state.settings.opacity = +e.target.value;
        $('opacityValue').textContent = state.settings.opacity.toFixed(1);
    };
    $('fixedColorPicker').oninput = e => { state.settings.fixedColor = e.target.value; };
    $('clientIdInput').onchange = e => { state.settings.gDriveClientId = e.target.value.trim(); };
    $('apiKeyInput').onchange = e => { state.settings.gDriveApiKey = e.target.value.trim(); };
    $('persistSettingsCheckbox').onchange = e => { state.settings.persistSettings = e.target.checked; };

    $('sleepTimerSelect').onchange = e => {
        state.settings.sleepTimer = +e.target.value;
        updateSleepTimer();
    };
    $('autoPlayNextCheckbox').onchange = e => { state.settings.autoPlayNext = e.target.checked; };
    $('stopOnVideoEndCheckbox').onchange = e => { state.settings.stopOnVideoEnd = e.target.checked; };

    setupPresets();
}

function updateSleepTimer() {
    if (state.sleepTimerId) {
        clearTimeout(state.sleepTimerId);
        state.sleepTimerId = null;
    }
    
    const status = $('sleepTimerStatus');
    if (state.settings.sleepTimer > 0) {
        const ms = state.settings.sleepTimer * 60 * 1000;
        const endTime = Date.now() + ms;
        status.style.display = 'block';
        
        const updateStatus = () => {
            const remaining = Math.max(0, endTime - Date.now());
            const min = Math.floor(remaining / 60000);
            const sec = Math.floor((remaining % 60000) / 1000);
            status.textContent = `あと ${min}:${sec.toString().padStart(2, '0')} で停止します`;
            if (remaining > 0) {
                state.sleepTimerId = setTimeout(updateStatus, 1000);
            } else {
                audio.pause();
                state.isPlaying = false;
                updatePlayBtn();
                showOverlay('💤 スリープタイマーにより停止しました');
                status.style.display = 'none';
                state.settings.sleepTimer = 0;
                $('sleepTimerSelect').value = 0;
            }
        };
        updateStatus();
    } else {
        status.style.display = 'none';
    }
}

function setupPresets() {
    const list = $('colorPresetList');
    if (!list) return;
    
    COLOR_PRESETS.forEach(p => {
        const btn = document.createElement('div');
        btn.className = 'color-preset-btn';
        btn.style.backgroundColor = p.color;
        btn.textContent = p.name;
        btn.onclick = () => {
            state.settings.fixedColor = p.color;
            state.settings.rainbow = false;
            applySettingsToUI();
            showOverlay(`🎨 ${p.name} カラー適用`);
        };
        list.appendChild(btn);
    });

    [1, 2, 3].forEach(slot => {
        $(`savePreset${slot}`).onclick = () => savePreset(slot);
        $(`loadPreset${slot}`).onclick = () => loadPreset(slot);
    });
}

function savePreset(slot) {
    const presetData = JSON.stringify(state.settings);
    localStorage.setItem(`visualizerPreset_${slot}`, presetData);
    showOverlay(`💾 プリセット ${slot} を保存しました`);
}

function loadPreset(slot) {
    const saved = localStorage.getItem(`visualizerPreset_${slot}`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state.settings, parsed);
            applySettingsToUI();
            updateVideoVisibility();
            if (state.analyser) {
                state.analyser.smoothingTimeConstant = state.settings.smoothing;
                state.analyser.fftSize = state.settings.fftSize;
            }
            showOverlay(`📂 プリセット ${slot} を読み込みました`);
        } catch (e) {
            showOverlay('❌ 読み込みに失敗しました');
        }
    } else {
        showOverlay(`❌ プリセット ${slot} は空です`);
    }
}

function applySettingsToUI() {
    $('smoothingSlider').value = state.settings.smoothing;
    $('smoothingValue').textContent = state.settings.smoothing.toFixed(2);
    $('sensitivitySlider').value = state.settings.sensitivity;
    $('sensitivityValue').textContent = state.settings.sensitivity.toFixed(1);
    $('qualitySelect').value = state.settings.fftSize;
    $('barCountSelect').value = state.settings.barCount;
    $('showLabelsCheckbox').checked = state.settings.showLabels;
    $('lowPowerModeCheckbox').checked = state.settings.lowPowerMode;
    $('showVideoCheckbox').checked = state.settings.showVideo;
    $('videoModeSelect').value = state.settings.videoMode;
    $('lowFreqSlider').value = state.settings.lowFreq;
    $('lowFreqValue').textContent = state.settings.lowFreq + 'Hz';
    $('highFreqSlider').value = state.settings.highFreq;
    $('highFreqValue').textContent = (state.settings.highFreq >= 1000 ? (state.settings.highFreq/1000) + 'kHz' : state.settings.highFreq + 'Hz');
    $('glowSlider').value = state.settings.glowStrength;
    $('rainbowCheckbox').checked = state.settings.rainbow;
    $('mirrorCheckbox').checked = state.settings.mirror;
    $('bgBlurSlider').value = state.settings.bgBlur;
    $('bgBlurValue').textContent = state.settings.bgBlur + 'px';
    $('opacitySlider').value = state.settings.opacity;
    $('opacityValue').textContent = state.settings.opacity.toFixed(1);
    $('fixedColorPicker').value = state.settings.fixedColor;
    $('clientIdInput').value = state.settings.gDriveClientId;
    $('apiKeyInput').value = state.settings.gDriveApiKey;
    $('persistSettingsCheckbox').checked = state.settings.persistSettings;
    
    $('showVideoCheckbox').value = state.settings.showVideo;
    $('videoModeSelect').value = state.settings.videoMode;
    $('sleepTimerSelect').value = state.settings.sleepTimer;
    $('autoPlayNextCheckbox').checked = state.settings.autoPlayNext;
    $('stopOnVideoEndCheckbox').checked = state.settings.stopOnVideoEnd;

    state.settings.eq.forEach((val, i) => {
        const freq = EQ_FREQS[i];
        const id = freq >= 1000 ? `eq${freq/1000}k` : `eq${freq}`;
        const el = $(id);
        if (el) el.value = val;
    });
}

function openSettings() { els.settingsModal.classList.add('open'); state.settingsOpen = true; }
function closeSettings() { els.settingsModal.classList.remove('open'); state.settingsOpen = false; }
function saveSettings() { saveSettingsToStorage(); closeSettings(); }

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    $(`tab-${tabId}`).classList.add('active');

    // 音声タブが開かれた時のみデバイスを列挙（権限エラー対策）
    if (tabId === 'audio') {
        enumerateMicDevices();
    }
}

// ============== AUDIO ENGINE ==============
function initAudioContext() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.analyser = state.audioCtx.createAnalyser();
        state.analyser.fftSize = state.settings.fftSize;
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
        state.fileSource.connect(state.eqFilters[0]);
    }
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

function toggleShuffle() {
    state.settings.shuffle = !state.settings.shuffle;
    updateShuffleRepeatUI();
    showOverlay(state.settings.shuffle ? '🔀 シャッフルON' : '🔀 シャッフルOFF');
}

function toggleRepeat() {
    const modes = ['none', 'one', 'all'];
    const idx = modes.indexOf(state.settings.repeatMode);
    state.settings.repeatMode = modes[(idx + 1) % modes.length];
    updateShuffleRepeatUI();
    const labels = { none: '🔁 リピートOFF', one: '🔂 1曲リピート', all: '🔁 全曲リピート' };
    showOverlay(labels[state.settings.repeatMode]);
}

function updateShuffleRepeatUI() {
    els.shuffleBtn.classList.toggle('active', state.settings.shuffle);
    const repeatIcons = { none: '🔁', one: '🔂', all: '🔁' };
    els.repeatBtn.textContent = repeatIcons[state.settings.repeatMode];
    els.repeatBtn.classList.toggle('active', state.settings.repeatMode !== 'none');
}

function nextTrack() {
    if (state.playlist.length === 0) return;
    if (state.settings.repeatMode === 'one') {
        playTrack(state.currentIndex);
        return;
    }
    if (state.settings.shuffle) {
        let nextIdx;
        do { nextIdx = Math.floor(Math.random() * state.playlist.length); } while (nextIdx === state.currentIndex && state.playlist.length > 1);
        playTrack(nextIdx);
    } else {
        const nextIdx = (state.currentIndex + 1) % state.playlist.length;
        if (nextIdx === 0 && state.settings.repeatMode === 'none') {
            audio.pause();
            state.isPlaying = false;
            updatePlayBtn();
        } else {
            playTrack(nextIdx);
        }
    }
}

function prevTrack() {
    if (state.playlist.length === 0) return;
    const prevIdx = state.currentIndex <= 0 ? state.playlist.length - 1 : state.currentIndex - 1;
    playTrack(prevIdx);
}

function playTrack(index) {
    if (index < 0 || index >= state.playlist.length) return;
    state.currentIndex = index;
    const track = state.playlist[index];
    els.statusText.textContent = `🎵 ${track.name}`;
    document.title = `${track.name} - Audio Visualizer`;
    renderPlaylist();
    
    // 再生中の曲をオーバーレイで表示
    showOverlay(`Now Playing: ${track.name}`, 3000);
    
    if (state.playTimeout) clearTimeout(state.playTimeout);
    
    audio.pause();
    audio.currentTime = 0;
    audio.src = track.url;
    audio.playbackRate = state.settings.playbackRate;
    audio.load();
    connectFileSource();
    updateVideoVisibility();
    state.playTimeout = setTimeout(() => { 
        audio.play().catch(e => {
            console.warn("Playback failed:", e);
            showOverlay('⚠️ 再生に失敗しました');
            // 失敗した場合は次の曲へ（無限ループ防止のため少し待つ）
            setTimeout(nextTrack, 2000);
        }); 
        state.playTimeout = null;
    }, 100);
}

function seek() { if (state.inputSource === 'file') audio.currentTime = els.seekBar.value; }
function updateVolume() {
    const v = els.volSlider.value;
    // 対数スケールに近い感覚にするため、2乗を使用
    const volume = v * v;
    audio.volume = volume;
    if (state.inputSource === 'file' && state.gainNode) state.gainNode.gain.value = volume;
    els.volIcon.textContent = v == 0 ? '🔇' : v < 0.5 ? '🔉' : '🔊';
}
function onMetadataLoaded() { els.seekBar.max = audio.duration || 0; updateTimeDisplay(); }
function updateProgress() { if (!isNaN(audio.currentTime)) { els.seekBar.value = audio.currentTime; updateTimeDisplay(); } }
function updateTimeDisplay() { els.timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; }
function updatePlayBtn() { els.playBtn.textContent = state.isPlaying ? '⏸' : '▶'; }
function handleAudioError(e) { 
    console.error('Audio error:', e); 
    els.statusText.textContent = '再生エラー'; 
    showOverlay('⚠️ オーディオエラーが発生しました');
    // エラー時は次の曲へ
    setTimeout(nextTrack, 3000);
}
function formatTime(s) { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; }

function handleFiles(files) {
    const allowedExt = new Set(['mp3', 'wav', 'm4a', 'aac', 'mp4', 'webm', 'mkv', 'mov', 'ogg', 'flac', 'opus']);
    const videoExt = new Set(['mp4', 'webm', 'mkv', 'mov']);
    
    const accepted = [];
    files.forEach(file => {
        const name = (file.name || '').toLowerCase();
        const ext = name.includes('.') ? name.split('.').pop() : '';
        const isAudioMime = typeof file.type === 'string' && file.type.startsWith('audio/');
        const isVideoMime = typeof file.type === 'string' && file.type.startsWith('video/');
        if (isAudioMime || isVideoMime || allowedExt.has(ext)) {
            const isVideo = videoExt.has(ext) || isVideoMime;
            accepted.push({ file, isVideo });
        }
    });

    if (accepted.length === 0) {
        showOverlay('対応するファイルを選択してください');
        return;
    }

    showOverlay(`📥 ${accepted.length}個のファイルを取り込み中...`);

    accepted.forEach(item => {
        state.playlist.push({ name: item.file.name, url: URL.createObjectURL(item.file), source: 'local', isVideo: item.isVideo });
    });
    renderPlaylist();
    if (state.currentIndex === -1) playTrack(state.playlist.length - accepted.length);
    
    setTimeout(() => {
        showOverlay(`✅ ${accepted.length}個のファイルを追加しました`);
    }, 500);
}

function handleLocalFiles(e) {
    handleFiles(Array.from(e.target.files));
    e.target.value = '';
}

function renderPlaylist() {
    const query = els.playlistSearchInput.value.toLowerCase();
    const filtered = state.playlist.map((track, originalIndex) => ({ ...track, originalIndex }))
                                  .filter(track => track.name.toLowerCase().includes(query));

    if (state.playlist.length === 0) { 
        els.playlistItems.innerHTML = '<div class="playlist-empty">曲を追加してください</div>'; 
        return; 
    }
    
    if (filtered.length === 0) {
        els.playlistItems.innerHTML = '<div class="playlist-empty">見つかりませんでした</div>';
        return;
    }

    els.playlistItems.innerHTML = filtered.map(track => `
        <div class="playlist-item ${track.originalIndex === state.currentIndex ? 'active' : ''}" data-index="${track.originalIndex}">
            <span class="name">${track.originalIndex + 1}. ${track.name}</span>
            <span class="remove-btn" data-index="${track.originalIndex}">✖</span>
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
    if (track.source === 'local') URL.revokeObjectURL(track.url);
    state.playlist.splice(index, 1);
    if (state.currentIndex === index) {
        if (state.playlist.length > 0) playTrack(index < state.playlist.length ? index : 0);
        else { audio.pause(); state.currentIndex = -1; state.isPlaying = false; updatePlayBtn(); els.statusText.textContent = '待機中...'; }
    } else if (state.currentIndex > index) state.currentIndex--;
    renderPlaylist();
}

function togglePlaylist() {
    const isCollapsed = els.playlistPanel.classList.toggle('collapsed');
    state.playlistVisible = !isCollapsed;
    els.playlistToggle.textContent = isCollapsed ? '📂' : '✖';
}

// Google Drive (Simplified)
let accessToken = null;
function openGDrivePicker() { if (!state.settings.gDriveClientId || !state.settings.gDriveApiKey) { openSettings(); switchTab('gdrive'); return; } if (accessToken) createPicker(); else initGoogleAuth(); }
function initGoogleAuth() { if (typeof google === 'undefined' || !google.accounts) { const script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.onload = requestGoogleToken; document.body.appendChild(script); } else requestGoogleToken(); }
function requestGoogleToken() { const tokenClient = google.accounts.oauth2.initTokenClient({ client_id: state.settings.gDriveClientId, scope: 'https://www.googleapis.com/auth/drive.readonly', callback: r => { if (r.error) return; accessToken = r.access_token; loadPickerApi(); } }); tokenClient.requestAccessToken({ prompt: 'consent' }); }
function loadPickerApi() { if (typeof gapi !== 'undefined' && gapi.picker) createPicker(); else { const script = document.createElement('script'); script.src = 'https://apis.google.com/js/api.js'; script.onload = () => gapi.load('picker', createPicker); document.body.appendChild(script); } }
function createPicker() { 
    // MIMEタイプフィルタを使用せず、すべてのファイルを表示可能にする
    const docsView = new google.picker.DocsView()
        .setIncludeFolders(true);
    
    new google.picker.PickerBuilder()
        .addView(docsView)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setOAuthToken(accessToken)
        .setDeveloperKey(state.settings.gDriveApiKey)
        .setCallback(pickerCallback)
        .build()
        .setVisible(true);
}
async function pickerCallback(data) { 
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) { 
        const docs = data[google.picker.Response.DOCUMENTS]; 
        const promises = docs.map(doc => {
            const fileName = doc[google.picker.Document.NAME];
            const ext = fileName.toLowerCase().split('.').pop();
            const allowedExt = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'webm', 'opus', 'mkv']);
            
            if (allowedExt.has(ext)) {
                return fetchDriveFile(doc[google.picker.Document.ID], fileName);
            } else {
                console.warn(`非対応ファイル: ${fileName}`);
                return Promise.resolve();
            }
        });
        await Promise.all(promises);
    } 
}
async function fetchDriveFile(fileId, fileName) { 
    try { 
        showOverlay(`☁️ Google Driveから取得中...`);
        const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { 'Authorization': 'Bearer ' + accessToken } }); 
        if (!r.ok) {
            showOverlay('❌ 取得に失敗しました');
            return; 
        }
        const blob = await r.blob(); 
        const ext = fileName.toLowerCase().split('.').pop();
        const videoExt = new Set(['mp4', 'webm', 'mkv', 'mov']);
        const isVideo = videoExt.has(ext);
        state.playlist.push({ name: fileName, url: URL.createObjectURL(blob), source: 'drive', isVideo: isVideo }); 
        renderPlaylist(); 
        if (state.currentIndex === -1) playTrack(state.playlist.length - 1); 
        showOverlay(`✅ ${fileName} を追加しました`);
    } catch (e) {
        showOverlay('❌ エラーが発生しました');
    } 
}

// ============== UI CONTROLS ==============
function toggleUI() { 
    state.uiVisible = !state.uiVisible; 
    els.uiLayer.classList.toggle('hidden', !state.uiVisible); 
    els.toggleUIBtn.textContent = state.uiVisible ? '🔳' : '🔲'; 

    // When hiding UI, also close any open panels/modals to avoid mixed visibility states.
    if (!state.uiVisible) {
        if (state.settingsOpen) closeSettings();
        if (state.playlistVisible) {
            els.playlistPanel.classList.add('collapsed');
            state.playlistVisible = false;
            els.playlistToggle.textContent = '📂';
        }
    } else {
        resetUITimeout();
    }
}

function toggleFullscreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    try {
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
    } catch (e) {
        console.warn("Fullscreen toggle failed:", e);
        showOverlay("⚠️ フルスクリーン切替に失敗しました");
    }
}

function showOverlay(msg, duration = 2000) { els.overlayMsg.textContent = msg; els.overlayMsg.classList.remove('hidden'); if (duration > 0) setTimeout(() => { els.overlayMsg.classList.add('hidden'); }, duration); }

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
    if (state.settings.rainbow) {
        const baseHue = (i / total) * 360;
        const timeHue = (state.mode === 1 || state.mode === 4) ? (Date.now() * 0.05) : 0;
        const hue = Math.floor((baseHue + timeHue) % 360);
        const lightness = Math.max(0, Math.min(100, Math.round(50 + v * 20)));
        return `hsl(${hue}, 80%, ${lightness}%)`;
    }
    return state.settings.fixedColor;
}

function draw() {
    if (document.hidden) {
        // バックグラウンドでも動画のタイミングを同期
        if (bgVideo.src && state.isPlaying && state.settings.showVideo) {
            const timeDiff = Math.abs(bgVideo.currentTime - audio.currentTime);
            if (timeDiff > 0.5) {
                bgVideo.currentTime = audio.currentTime;
            }
        }
        requestAnimationFrame(draw);
        return;
    }

    if (state.settings.lowPowerMode) {
        // 軽量化モード: 30FPSに制限
        setTimeout(() => {
            requestAnimationFrame(draw);
        }, 1000 / 30);
    } else {
        requestAnimationFrame(draw);
    }

    if (state.settings.videoMode === 'background' && state.playlist[state.currentIndex]?.isVideo && state.settings.showVideo) {
        // 背景モード時はCanvasを透明にして動画を直接見せる
        ctx.clearRect(0, 0, W, H);
    } else {
        // 通常時は背景色で塗りつぶし
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);
    }
    
    if (!state.analyser) return;
    const fd = getFilteredData();
    
    // Use full screen height for visualization
    const drawH = H;
    const drawStartY = 0;
    const maxH = drawH * 0.9;

    // 軽量化モード時はシャドウを無効化
    const originalGlow = state.settings.glowStrength;
    if (state.settings.lowPowerMode) state.settings.glowStrength = 0;

    ctx.globalAlpha = state.settings.opacity;

    if (state.settings.mirror) {
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
    }

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

    if (state.settings.mirror) {
        ctx.restore();
    }

    ctx.globalAlpha = 1.0;

    if (state.settings.lowPowerMode) state.settings.glowStrength = originalGlow;
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