// メトロノーム - JavaScript

class Metronome {
    constructor() {
        // オーディオコンテキスト
        this.audioContext = null;
        
        // 状態
        this.isPlaying = false;
        this.bpm = 120;
        this.beatsPerMeasure = 4;
        this.noteValue = 4;
        this.currentBeat = 0;
        this.accentEnabled = true;
        this.soundType = 'click';
        
        // タイミング
        this.nextNoteTime = 0;
        this.scheduleAheadTime = 0.1;
        this.lookahead = 25;
        this.timerID = null;
        
        // タップテンポ
        this.tapTimes = [];
        this.tapTimeout = null;
        
        // 振り子の向き
        this.pendulumLeft = true;
        
        // DOM要素
        this.elements = {
            startBtn: document.getElementById('start-btn'),
            tapBtn: document.getElementById('tap-btn'),
            bpmInput: document.getElementById('bpm-input'),
            bpmSlider: document.getElementById('bpm-slider'),
            soundSelect: document.getElementById('sound-select'),
            accentCheckbox: document.getElementById('accent-checkbox'),
            pendulum: document.querySelector('.pendulum'),
            beatDots: document.querySelectorAll('.beat-dot'),
            container: document.querySelector('.container'),
            timeBtns: document.querySelectorAll('.time-btn')
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateBeatDots();
    }
    
    bindEvents() {
        // 開始/停止ボタン
        this.elements.startBtn.addEventListener('click', () => this.toggle());
        
        // タップテンポボタン
        this.elements.tapBtn.addEventListener('click', () => this.tap());
        
        // BPM入力
        this.elements.bpmInput.addEventListener('input', (e) => {
            let value = parseInt(e.target.value);
            if (!isNaN(value)) {
                value = Math.max(20, Math.min(300, value));
                this.setBpm(value);
            }
        });
        
        this.elements.bpmInput.addEventListener('blur', (e) => {
            let value = parseInt(e.target.value);
            if (isNaN(value) || value < 20) value = 20;
            if (value > 300) value = 300;
            this.setBpm(value);
            e.target.value = this.bpm;
        });
        
        // BPMスライダー
        this.elements.bpmSlider.addEventListener('input', (e) => {
            this.setBpm(parseInt(e.target.value));
        });
        
        // 音色選択
        this.elements.soundSelect.addEventListener('change', (e) => {
            this.soundType = e.target.value;
        });
        
        // 強拍アクセント
        this.elements.accentCheckbox.addEventListener('change', (e) => {
            this.accentEnabled = e.target.checked;
        });
        
        // 拍子選択
        this.elements.timeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.elements.timeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.beatsPerMeasure = parseInt(btn.dataset.beats);
                this.noteValue = parseInt(btn.dataset.note);
                this.currentBeat = 0;
                this.updateBeatDots();
            });
        });
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggle();
            } else if (e.code === 'KeyT') {
                e.preventDefault();
                this.tap();
            }
        });
    }
    
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
    
    setBpm(value) {
        this.bpm = value;
        this.elements.bpmInput.value = value;
        this.elements.bpmSlider.value = value;
    }
    
    updateBeatDots() {
        this.elements.beatDots.forEach((dot, index) => {
            if (index < this.beatsPerMeasure) {
                dot.classList.remove('hidden');
            } else {
                dot.classList.add('hidden');
            }
            dot.classList.remove('active', 'accent');
        });
    }
    
    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    start() {
        this.initAudioContext();
        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
        
        // UI更新
        this.elements.startBtn.classList.add('playing');
        this.elements.startBtn.querySelector('.play-icon').textContent = '⏸';
        this.elements.startBtn.querySelector('.btn-text').textContent = '停止';
    }
    
    stop() {
        this.isPlaying = false;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        
        // UI更新
        this.elements.startBtn.classList.remove('playing');
        this.elements.startBtn.querySelector('.play-icon').textContent = '▶';
        this.elements.startBtn.querySelector('.btn-text').textContent = '開始';
        
        // ビートインジケーターをリセット
        this.elements.beatDots.forEach(dot => {
            dot.classList.remove('active', 'accent');
        });
        
        // 振り子をリセット
        this.elements.pendulum.classList.remove('swing-left', 'swing-right');
    }
    
    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = setTimeout(() => this.scheduler(), this.lookahead);
    }
    
    nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        // 6/8拍子の場合は8分音符基準
        const multiplier = this.noteValue === 8 ? 0.5 : 1;
        this.nextNoteTime += secondsPerBeat * multiplier;
        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    }
    
    scheduleNote(beatNumber, time) {
        // 音を鳴らす
        const isAccent = beatNumber === 0 && this.accentEnabled;
        this.playSound(isAccent, time);
        
        // ビジュアルフィードバックをスケジュール
        const delay = (time - this.audioContext.currentTime) * 1000;
        setTimeout(() => {
            this.visualFeedback(beatNumber, isAccent);
        }, Math.max(0, delay));
    }
    
    playSound(isAccent, time) {
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 音色設定
        const settings = this.getSoundSettings(isAccent);
        osc.type = settings.type;
        osc.frequency.setValueAtTime(settings.frequency, time);
        
        // エンベロープ
        gainNode.gain.setValueAtTime(settings.volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + settings.duration);
        
        osc.start(time);
        osc.stop(time + settings.duration);
    }
    
    getSoundSettings(isAccent) {
        const baseVolume = isAccent ? 0.8 : 0.5;
        const baseFrequency = isAccent ? 1000 : 800;
        
        switch (this.soundType) {
            case 'click':
                return {
                    type: 'sine',
                    frequency: isAccent ? 1200 : 900,
                    volume: baseVolume,
                    duration: 0.05
                };
            case 'wood':
                return {
                    type: 'triangle',
                    frequency: isAccent ? 800 : 600,
                    volume: baseVolume * 0.8,
                    duration: 0.03
                };
            case 'beep':
                return {
                    type: 'square',
                    frequency: isAccent ? 880 : 660,
                    volume: baseVolume * 0.4,
                    duration: 0.08
                };
            case 'drum':
                return {
                    type: 'sine',
                    frequency: isAccent ? 150 : 100,
                    volume: baseVolume,
                    duration: 0.1
                };
            default:
                return {
                    type: 'sine',
                    frequency: baseFrequency,
                    volume: baseVolume,
                    duration: 0.05
                };
        }
    }
    
    visualFeedback(beatNumber, isAccent) {
        // ビートインジケーター更新
        this.elements.beatDots.forEach((dot, index) => {
            dot.classList.remove('active', 'accent');
            if (index === beatNumber) {
                dot.classList.add(isAccent ? 'accent' : 'active');
            }
        });
        
        // 振り子アニメーション
        this.elements.pendulum.classList.remove('swing-left', 'swing-right');
        if (this.pendulumLeft) {
            this.elements.pendulum.classList.add('swing-left');
        } else {
            this.elements.pendulum.classList.add('swing-right');
        }
        this.pendulumLeft = !this.pendulumLeft;
        
        // コンテナフラッシュ（強拍時）
        if (isAccent) {
            this.elements.container.classList.add('flash');
            setTimeout(() => {
                this.elements.container.classList.remove('flash');
            }, 100);
        }
    }
    
    tap() {
        const now = Date.now();
        
        // タイムアウトをクリア
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }
        
        // 2秒以上経過していたらリセット
        if (this.tapTimes.length > 0 && now - this.tapTimes[this.tapTimes.length - 1] > 2000) {
            this.tapTimes = [];
        }
        
        this.tapTimes.push(now);
        
        // 最新の8回分のタップを保持
        if (this.tapTimes.length > 8) {
            this.tapTimes.shift();
        }
        
        // 2回以上のタップでBPMを計算
        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            let newBpm = Math.round(60000 / avgInterval);
            newBpm = Math.max(20, Math.min(300, newBpm));
            this.setBpm(newBpm);
        }
        
        // タップボタンのビジュアルフィードバック
        this.elements.tapBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.elements.tapBtn.style.transform = '';
        }, 100);
        
        // 2秒後にタップをリセット
        this.tapTimeout = setTimeout(() => {
            this.tapTimes = [];
        }, 2000);
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new Metronome();
});
