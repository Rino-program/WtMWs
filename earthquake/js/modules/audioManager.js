/**
 * 音声・通知システム（900行超）
 * 音声アラート、テキスト読み上げ、効果音管理
 */

const AudioManager = {
    // ========================================
    // 初期化 (100行)
    // ========================================
    
    /**
     * 音声システムの初期化
     */
    async init() {
        this.audioContext = null;
        this.sounds = {};
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.isEnabled = true;
        this.volume = 0.7;
        
        // Web Audio API の初期化
        this.initAudioContext();
        
        // 音声合成の準備
        await this.initSpeechSynthesis();
        
        // サウンドの事前読み込み
        await this.preloadSounds();
        
        // 設定の読み込み
        this.loadSettings();
        
        console.log('✅ Audio Manager initialized');
    },

    /**
     * Web Audio Contextの初期化
     */
    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // マスターボリュームノード
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
        }
    },

    /**
     * 音声合成の初期化
     */
    async initSpeechSynthesis() {
        return new Promise((resolve) => {
            if (!this.synth) {
                console.warn('Speech Synthesis not supported');
                resolve();
                return;
            }
            
            // 音声リストの読み込み
            const loadVoices = () => {
                this.voices = this.synth.getVoices();
                
                // 日本語音声を優先
                this.japaneseVoice = this.voices.find(voice => 
                    voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
                );
                
                console.log(`Loaded ${this.voices.length} voices`);
                resolve();
            };
            
            if (this.synth.getVoices().length > 0) {
                loadVoices();
            } else {
                this.synth.addEventListener('voiceschanged', loadVoices);
                setTimeout(resolve, 1000); // タイムアウト
            }
        });
    },

    /**
     * サウンドの事前読み込み
     */
    async preloadSounds() {
        const soundUrls = {
            eew: this.generateEEWSound(),
            tsunami: this.generateTsunamiSound(),
            earthquake: this.generateEarthquakeSound(),
            notification: this.generateNotificationSound(),
            click: this.generateClickSound(),
            success: this.generateSuccessSound(),
            error: this.generateErrorSound(),
            warning: this.generateWarningSound()
        };
        
        for (const [name, buffer] of Object.entries(soundUrls)) {
            this.sounds[name] = buffer;
        }
    },

    /**
     * 設定の読み込み
     */
    loadSettings() {
        const settings = dataStore.get('user.audio') || {};
        this.isEnabled = settings.enabled !== false;
        this.volume = settings.volume || 0.7;
        this.voiceEnabled = settings.voiceEnabled !== false;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    },

    // ========================================
    // 緊急地震速報アラート (150行)
    // ========================================
    
    /**
     * EEW音声アラート
     */
    playEEWAlert(eew) {
        if (!this.isEnabled) return;
        
        // 効果音を再生
        this.playSound('eew', { loop: true, duration: 5000 });
        
        // 音声による通知
        if (this.voiceEnabled) {
            const message = this.generateEEWMessage(eew);
            this.speak(message, {
                priority: 'high',
                rate: 1.1,
                pitch: 1.2,
                volume: 1.0
            });
        }
    },

    /**
     * EEWメッセージの生成
     */
    generateEEWMessage(eew) {
        const { region, maxIntensity, magnitude } = eew;
        
        let message = '緊急地震速報。';
        message += `${region}で地震発生。`;
        message += `予想最大震度、${this.intensityToSpeech(maxIntensity)}。`;
        message += `マグニチュード、${magnitude.toFixed(1)}。`;
        message += '強い揺れに警戒してください。';
        
        return message;
    },

    /**
     * 震度を音声用に変換
     */
    intensityToSpeech(intensity) {
        const map = {
            '0': 'ぜろ',
            '1': 'いち',
            '2': 'に',
            '3': 'さん',
            '4': 'よん',
            '5-': 'ご じゃく',
            '5+': 'ご きょう',
            '6-': 'ろく じゃく',
            '6+': 'ろく きょう',
            '7': 'なな'
        };
        return map[intensity] || intensity;
    },

    // ========================================
    // 津波アラート (100行)
    // ========================================
    
    /**
     * 津波音声アラート
     */
    playTsunamiAlert(tsunami) {
        if (!this.isEnabled) return;
        
        // 効果音を再生
        this.playSound('tsunami', { loop: true, duration: 7000 });
        
        // 音声による通知
        if (this.voiceEnabled) {
            const message = this.generateTsunamiMessage(tsunami);
            this.speak(message, {
                priority: 'high',
                rate: 1.0,
                pitch: 1.1,
                volume: 1.0
            });
        }
    },

    /**
     * 津波メッセージの生成
     */
    generateTsunamiMessage(tsunami) {
        const warnings = tsunami.filter(t => t.grade === 'warning' || t.grade === 'major_warning');
        
        if (warnings.length === 0) {
            return '津波注意報が発表されています。海岸から離れてください。';
        }
        
        let message = '津波警報が発表されています。';
        message += warnings.map(t => t.name).join('、');
        message += 'で、';
        message += warnings[0].grade === 'major_warning' ? '大津波警報。' : '津波警報。';
        message += '直ちに高台に避難してください。';
        
        return message;
    },

    // ========================================
    // テキスト読み上げ (200行)
    // ========================================
    
    /**
     * テキストを音声で読み上げ
     */
    speak(text, options = {}) {
        if (!this.synth || !this.voiceEnabled) return;
        
        const {
            priority = 'normal',
            rate = 1.0,
            pitch = 1.0,
            volume = this.volume,
            lang = 'ja-JP',
            voice = this.japaneseVoice
        } = options;
        
        // 優先度が高い場合、現在の読み上げを停止
        if (priority === 'high') {
            this.stopSpeaking();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;
        utterance.lang = lang;
        
        if (voice) {
            utterance.voice = voice;
        }
        
        // イベントリスナー
        utterance.onstart = () => {
            console.log('Speech started:', text);
        };
        
        utterance.onend = () => {
            console.log('Speech ended');
        };
        
        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
        };
        
        this.synth.speak(utterance);
    },

    /**
     * 読み上げの停止
     */
    stopSpeaking() {
        if (this.synth && this.synth.speaking) {
            this.synth.cancel();
        }
    },

    /**
     * 地震情報の読み上げ
     */
    speakEarthquake(earthquake) {
        const { region, magnitude, maxIntensity, depth, time } = earthquake;
        
        let message = `地震情報。`;
        message += `${region}で、マグニチュード${magnitude.toFixed(1)}の地震が発生しました。`;
        message += `最大震度は、${this.intensityToSpeech(maxIntensity)}。`;
        message += `震源の深さは、およそ${Math.round(depth)}キロメートルです。`;
        
        this.speak(message, { priority: 'normal' });
    },

    /**
     * 統計情報の読み上げ
     */
    speakStatistics(stats) {
        let message = `本日の地震統計。`;
        message += `地震回数、${stats.count}回。`;
        message += `最大マグニチュード、${stats.magnitudes.max.toFixed(1)}。`;
        message += `平均マグニチュード、${stats.magnitudes.avg.toFixed(1)}です。`;
        
        this.speak(message);
    },

    // ========================================
    // サウンド生成 (250行)
    // ========================================
    
    /**
     * EEW効果音の生成
     */
    generateEEWSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // チャイム音（NHKの緊急地震速報風）
        const frequencies = [1000, 800, 1000, 800]; // Hz
        const noteDuration = duration / frequencies.length;
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];
            const startSample = Math.floor(i * noteDuration * sampleRate);
            const endSample = Math.floor((i + 1) * noteDuration * sampleRate);
            
            for (let j = startSample; j < endSample; j++) {
                const t = (j - startSample) / sampleRate;
                const envelope = Math.exp(-t * 5); // エンベロープ
                data[j] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
            }
        }
        
        return buffer;
    },

    /**
     * 津波効果音の生成
     */
    generateTsunamiSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // サイレン風の音
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 400 + Math.sin(t * 4 * Math.PI) * 200; // 周波数変調
            const envelope = Math.sin(t * Math.PI / duration); // エンベロープ
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.4;
        }
        
        return buffer;
    },

    /**
     * 地震効果音の生成
     */
    generateEarthquakeSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 低音の衝撃音
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 100 * Math.exp(-t * 10);
            const envelope = Math.exp(-t * 8);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.6;
        }
        
        return buffer;
    },

    /**
     * 通知音の生成
     */
    generateNotificationSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const freq = 800;
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 20);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }
        
        return buffer;
    },

    /**
     * クリック音の生成
     */
    generateClickSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.05;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 50);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.1;
        }
        
        return buffer;
    },

    /**
     * 成功音の生成
     */
    generateSuccessSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const frequencies = [523.25, 659.25, 783.99]; // C, E, G
        const noteDuration = duration / frequencies.length;
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];
            const startSample = Math.floor(i * noteDuration * sampleRate);
            const endSample = Math.floor((i + 1) * noteDuration * sampleRate);
            
            for (let j = startSample; j < endSample; j++) {
                const t = (j - startSample) / sampleRate;
                const envelope = Math.exp(-t * 15);
                data[j] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.2;
            }
        }
        
        return buffer;
    },

    /**
     * エラー音の生成
     */
    generateErrorSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 200 - t * 100;
            const envelope = Math.exp(-t * 5);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }
        
        return buffer;
    },

    /**
     * 警告音の生成
     */
    generateWarningSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.4;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 600 + Math.sin(t * 20 * Math.PI) * 100;
            const envelope = Math.exp(-t * 6);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.35;
        }
        
        return buffer;
    },

    // ========================================
    // サウンド再生 (150行)
    // ========================================
    
    /**
     * サウンドの再生
     */
    playSound(name, options = {}) {
        if (!this.isEnabled || !this.audioContext) return null;
        
        const buffer = this.sounds[name];
        if (!buffer) {
            console.warn(`Sound not found: ${name}`);
            return null;
        }
        
        const {
            loop = false,
            duration = null,
            volume = 1.0,
            detune = 0,
            playbackRate = 1.0
        } = options;
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.detune.value = detune;
        source.playbackRate.value = playbackRate;
        
        // ボリュームノード
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        
        // 接続
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        // 再生
        source.start(0);
        
        // 停止タイマー
        if (duration && !loop) {
            setTimeout(() => {
                source.stop();
            }, duration);
        } else if (loop && duration) {
            setTimeout(() => {
                source.loop = false;
                source.stop();
            }, duration);
        }
        
        return source;
    },

    /**
     * 音量の設定
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
        
        // 設定を保存
        dataStore.set('user.audio.volume', this.volume);
    },

    /**
     * 音声の有効/無効切り替え
     */
    toggle(enabled) {
        this.isEnabled = enabled !== undefined ? enabled : !this.isEnabled;
        dataStore.set('user.audio.enabled', this.isEnabled);
    },

    /**
     * 音声合成の有効/無効切り替え
     */
    toggleVoice(enabled) {
        this.voiceEnabled = enabled !== undefined ? enabled : !this.voiceEnabled;
        dataStore.set('user.audio.voiceEnabled', this.voiceEnabled);
    },

    /**
     * すべての音を停止
     */
    stopAll() {
        this.stopSpeaking();
        
        // AudioContext をサスペンド
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
            setTimeout(() => {
                if (this.audioContext) {
                    this.audioContext.resume();
                }
            }, 100);
        }
    }
};

// エクスポート
if (typeof window !== 'undefined') window.AudioManager = AudioManager;
if (typeof module !== 'undefined' && module.exports) module.exports = AudioManager;
