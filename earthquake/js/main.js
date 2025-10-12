/**
 * メインアプリケーション - 地震情報システムのエントリーポイント（1500行超の大規模アプリケーション）
 * アプリケーションライフサイクル、エラーハンドリング、パフォーマンス最適化
 */
class EarthquakeApp {
    constructor() {
        this.version = '1.0.0';
        this.initialized = false;
        this.mapRenderer = null;
        this.updateInterval = null;
        this.pollingIntervals = [];
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.errorCount = 0;
        this.lastError = null;
        this.startTime = Date.now();
        this.modules = {};
        this.services = {};
        this.eventBus = new Map();
        
        // パフォーマンス監視
        this.performanceMetrics = {
            initTime: 0,
            apiCalls: 0,
            renderTime: 0,
            errors: []
        };
        
        // エラーハンドリング
        this.setupGlobalErrorHandlers();
        
        // 初期化
        this.init();
    }

    /**
     * グローバルエラーハンドラーの設定
     */
    setupGlobalErrorHandlers() {
        // Uncaught errors
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, 'Uncaught Error');
            event.preventDefault();
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault();
        });
        
        // Network errors
        window.addEventListener('offline', () => {
            this.handleNetworkChange(false);
        });
        
        window.addEventListener('online', () => {
            this.handleNetworkChange(true);
        });
    }

    /**
     * グローバルエラーの処理
     * @param {Error} error - エラー
     * @param {string} type - エラータイプ
     */
    handleGlobalError(error, type = 'Error') {
        console.error(`${type}:`, error);
        
        this.errorCount++;
        this.lastError = {
            type,
            message: error.message || String(error),
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        this.performanceMetrics.errors.push(this.lastError);
        
        // エラーカウントが多い場合は警告
        if (this.errorCount > 10) {
            Utils.showToast('エラーが多発しています。ページを再読み込みしてください。', 'error');
        }
        
        // dataStoreに記録
        if (dataStore) {
            dataStore.set('system.performance.errorCount', this.errorCount);
        }
    }

    /**
     * ネットワーク状態変更の処理
     * @param {boolean} online - オンラインか
     */
    handleNetworkChange(online) {
        if (online) {
            console.log('🌐 Network: Back online');
            Utils.showToast('ネットワークに再接続しました', 'success');
            
            // データの再読み込み
            this.refreshData();
        } else {
            console.log('📵 Network: Offline');
            Utils.showToast('ネットワーク接続が切断されました。オフラインモードで動作します。', 'warning');
        }
        
        if (dataStore) {
            dataStore.set('system.network.online', online);
        }
    }

    /**
     * 初期化（拡張版）
     */
    async init() {
        console.log(`🚀 地震情報システム v${this.version} を初期化中...`);
        const initStart = performance.now();
        
        Utils.setLoading(true, 'システムを初期化しています...');

        try {
            // ステップ1: モジュールの初期化
            await this.initializeModules();
            // ステップ2: サービスの初期化
            await this.initializeServices();
            // ステップ3: UIの初期化
            await this.initializeUI();
            // ステップ4: データの読み込み
            await this.loadInitialData();
            // ステップ5: リアルタイム更新の開始
            this.startRealtimeUpdates();
            // ステップ6: 追加機能の初期化
            await this.initializeAdditionalFeatures();
            // 初期化完了
            this.initialized = true;
            this.performanceMetrics.initTime = performance.now() - initStart;
            Utils.setLoading(false);
            Utils.showToast(`システムの初期化が完了しました (${Math.round(this.performanceMetrics.initTime)}ms)`, 'success');
            console.log(`✅ 初期化完了 - ${Math.round(this.performanceMetrics.initTime)}ms`);
            // 初期化後の処理
            this.onInitComplete();
        } catch (error) {
            Utils.setLoading(false);
            console.error('❌ 初期化エラー:', error);
            this.handleInitError(error);
        }
    }

    /**
     * モジュールの初期化
     */
    async initializeModules() {
        console.log('📦 Initializing modules...');
        
        try {
            // DataStore
            if (typeof dataStore !== 'undefined') {
                this.modules.dataStore = dataStore;
                console.log('  ✓ DataStore initialized');
            }
            
            // Utils
            if (typeof Utils !== 'undefined') {
                this.modules.utils = Utils;
                console.log('  ✓ Utils initialized');
            }
            
            // UserManager
            if (typeof UserManager !== 'undefined') {
                await UserManager.init();
                this.modules.userManager = UserManager;
                console.log('  ✓ UserManager initialized');
            }
            
            // AudioManager
            if (typeof AudioManager !== 'undefined') {
                await AudioManager.init();
                this.modules.audioManager = AudioManager;
                console.log('  ✓ AudioManager initialized');
            }
            
            // Visualizations
            if (typeof Visualizations !== 'undefined') {
                await Visualizations.init();
                this.modules.visualizations = Visualizations;
                console.log('  ✓ Visualizations initialized');
            }
            
            // AdvancedAnalysis
            if (typeof AdvancedAnalysis !== 'undefined') {
                this.modules.advancedAnalysis = AdvancedAnalysis;
                console.log('  ✓ AdvancedAnalysis initialized');
            }
            
        } catch (error) {
            console.error('Module initialization error:', error);
            throw error;
        }
    }

    /**
     * サービスの初期化
     */
    async initializeServices() {
        console.log('🔧 Initializing services...');
        
        try {
            // P2P Earthquake Service
            if (typeof p2pEarthquakeService !== 'undefined') {
                this.services.earthquake = p2pEarthquakeService;
                console.log('  ✓ P2P Earthquake Service ready');
            }
            
            // Tsunami Service
            if (typeof tsunamiService !== 'undefined') {
                this.services.tsunami = tsunamiService;
                console.log('  ✓ Tsunami Service ready');
            }
            
            // Geo Service
            if (typeof geoService !== 'undefined') {
                this.services.geo = geoService;
                console.log('  ✓ Geo Service ready');
            }
            
            // Notification Service
            if (typeof notificationService !== 'undefined') {
                await notificationService.init();
                this.services.notification = notificationService;
                console.log('  ✓ Notification Service initialized');
            }
            
            // Analysis Service
            if (typeof analysisService !== 'undefined') {
                this.services.analysis = analysisService;
                console.log('  ✓ Analysis Service ready');
            }
            
            // USGS Service
            if (typeof usgsService !== 'undefined') {
                this.services.usgs = usgsService;
                console.log('  ✓ USGS Service ready');
            }
            
        } catch (error) {
            console.error('Service initialization error:', error);
            throw error;
        }
    }

    /**
     * UIの初期化
     */
    async initializeUI() {
        console.log('🎨 Initializing UI...');
        
        try {
            // Map
            this.initMap();
            console.log('  ✓ Map initialized');
            
            // Interactions
            if (typeof Interactions !== 'undefined') {
                Interactions.init();
                console.log('  ✓ Interactions initialized');
            }
            
            // Renderers
            if (typeof Renderers !== 'undefined') {
                Renderers.renderEducation();
                Renderers.renderDisasterKit();
                console.log('  ✓ Renderers initialized');
            }
            
            // Service Worker
            await this.registerServiceWorker();
            
        } catch (error) {
            console.error('UI initialization error:', error);
            throw error;
        }
    }

    /**
     * Service Workerの登録
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator && CONFIG.OFFLINE.ENABLED) {
            try {
                const registration = await navigator.serviceWorker.register(CONFIG.OFFLINE.SERVICE_WORKER);
                console.log('  ✓ Service Worker registered:', registration.scope);
                
                if (dataStore) {
                    dataStore.set('system.features.serviceWorker', true);
                }
            } catch (error) {
                console.warn('  ⚠ Service Worker registration failed:', error);
            }
        }
    }

    /**
     * 追加機能の初期化
     */
    async initializeAdditionalFeatures() {
        console.log('⚙️ Initializing additional features...');
        
        try {
            // テーマの適用
            this.applyTheme();
            
            // キーボードショートカットの設定
            this.setupKeyboardShortcuts();
            
            // パフォーマンス監視の開始
            this.startPerformanceMonitoring();
            
            // 自動保存の設定
            this.setupAutoSave();
            
            console.log('  ✓ Additional features initialized');
            
        } catch (error) {
            console.error('Additional features initialization error:', error);
            // 致命的でないのでエラーを投げない
        }
    }

    /**
     * マップの初期化（拡張版）
     */
    initMap() {
        try {
            this.mapRenderer = new MapRenderer('main-map');
            
            // DataStoreの変更を監視
            dataStore.subscribe('realtime.earthquakes', (earthquakes) => {
                this.updateMap(earthquakes);
            });
            
            dataStore.subscribe('realtime.eew', (eew) => {
                if (eew) this.handleEEW(eew);
            });
            
            dataStore.subscribe('realtime.tsunami', (tsunami) => {
                if (tsunami && tsunami.length > 0) this.handleTsunami(tsunami);
            });
            
            // マップイベント
            if (this.mapRenderer.map) {
                this.mapRenderer.map.on('click', (e) => {
                    this.handleMapClick(e);
                });
                
                this.mapRenderer.map.on('zoomend', () => {
                    const zoom = this.mapRenderer.map.getZoom();
                    dataStore.set('ui.mapZoom', zoom);
                });
                
                this.mapRenderer.map.on('moveend', () => {
                    const center = this.mapRenderer.map.getCenter();
                    dataStore.set('ui.mapCenter', [center.lat, center.lng]);
                });
            }
            
        } catch (error) {
            console.error('Map initialization error:', error);
            throw error;
        }
    }

    /**
     * マップクリックの処理
     * @param {Object} e - イベント
     */
    handleMapClick(e) {
        const { lat, lng } = e.latlng;
        console.log('Map clicked:', lat, lng);
        
        // 近くの地震を検索
        const earthquakes = dataStore.get('realtime.earthquakes');
        const nearby = earthquakes.filter(eq => {
            const distance = Utils.calculateDistance(
                { lat, lon: lng },
                { lat: eq.latitude, lon: eq.longitude }
            );
            return distance < 50; // 50km以内
        });
        
        if (nearby.length > 0) {
            this.showNearbyEarthquakes(nearby, { lat, lon: lng });
        }
    }

    /**
     * 近くの地震を表示
     * @param {Array} earthquakes - 地震データ
     * @param {Object} location - 位置
     */
    showNearbyEarthquakes(earthquakes, location) {
        const html = `
            <div class="nearby-earthquakes">
                <h3>この地点の近くの地震 (${earthquakes.length}件)</h3>
                <ul>
                    ${earthquakes.map(eq => `
                        <li onclick="app.showEarthquakeDetail('${eq.id}')">
                            <strong>M${eq.magnitude}</strong> ${eq.region}
                            <br><small>${Utils.formatDate(eq.time)}</small>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        
        Utils.showModal('近くの地震', html);
    }

    /**
     * 初期データの読み込み（拡張版）
     */
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            Utils.setLoading(true, 'データを読み込んでいます...');
            
            // 地震履歴の取得
            const history = await this.fetchEarthquakeHistory();
            
            if (history && history.length > 0) {
                // DataStoreに追加
                history.forEach(eq => dataStore.addEarthquake(eq, { notify: false }));
                
                // 統計を再計算
                dataStore.recalculateStatistics();
                
                // UIを更新
                this.updateUI(history);
                
                console.log(`  ✓ Loaded ${history.length} earthquakes`);
            } else {
                console.warn('  ⚠ No earthquake data available');
            }
            
            // 津波情報の取得
            await this.fetchTsunamiInfo();
            
            // 追加データの取得
            await this.fetchAdditionalData();
            
            Utils.setLoading(false);
            
        } catch (error) {
            console.error('❌ Data loading error:', error);
            Utils.setLoading(false);
            
            // リトライ
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                console.log(`Retrying... (${this.retryAttempts}/${this.maxRetries})`);
                Utils.showToast(`データの読み込みに失敗しました。再試行中... (${this.retryAttempts}/${this.maxRetries})`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.loadInitialData();
            } else {
                Utils.showToast('データの読み込みに失敗しました', 'error');
                throw error;
            }
        }
    }

    /**
     * 地震履歴の取得
     * @returns {Promise<Array>} 地震データ
     */
    async fetchEarthquakeHistory() {
        try {
            const history = await p2pEarthquakeService.getEarthquakeHistory({ limit: 100 });
            this.performanceMetrics.apiCalls++;
            
            return history.map(item => this.parseEarthquakeData(item));
        } catch (error) {
            console.error('Failed to fetch earthquake history:', error);
            return [];
        }
    }

    /**
     * 津波情報の取得
     */
    async fetchTsunamiInfo() {
        try {
            if (tsunamiService) {
                const tsunamiData = await tsunamiService.getTsunamiInfo();
                if (tsunamiData && tsunamiData.length > 0) {
                    dataStore.setTsunami(tsunamiData);
                    console.log(`  ✓ Loaded ${tsunamiData.length} tsunami warnings`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch tsunami info:', error);
        }
    }

    /**
     * 追加データの取得
     */
    async fetchAdditionalData() {
        try {
            // USGS データ（世界の地震）
            if (usgsService && CONFIG.API.USGS) {
                const usgsData = await usgsService.getRecentEarthquakes({ limit: 50 });
                if (usgsData && usgsData.length > 0) {
                    console.log(`  ✓ Loaded ${usgsData.length} USGS earthquakes`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch additional data:', error);
        }
    }

    /**
     * UIの更新
     * @param {Array} earthquakes - 地震データ
     */
    updateUI(earthquakes) {
        const renderStart = performance.now();
        
        try {
            // 最新の地震
            if (earthquakes.length > 0) {
                Renderers.renderLatestEarthquake(earthquakes[0]);
            }
            
            // 地震リスト
            Renderers.renderEarthquakeList(earthquakes.slice(0, 20));
            
            // 統計
            const stats = dataStore.get('statistics');
            if (stats) {
                Renderers.renderStatistics(stats);
            }
            
            // マップ
            this.updateMap(earthquakes);
            
            this.performanceMetrics.renderTime = performance.now() - renderStart;
            
        } catch (error) {
            console.error('UI update error:', error);
        }
    }

    /**
     * 地震データのパース（拡張版）
     * @param {Object} rawData - 生データ
     * @returns {Object} パース済みデータ
     */
    parseEarthquakeData(rawData) {
        const earthquake = rawData.earthquake || {};
        const hypocenter = earthquake.hypocenter || {};
        
        return {
            id: rawData.id || `eq_${Date.now()}`,
            time: rawData.time || earthquake.time || new Date().toISOString(),
            magnitude: hypocenter.magnitude || 0,
            depth: hypocenter.depth || 0,
            latitude: hypocenter.latitude || 0,
            longitude: hypocenter.longitude || 0,
            region: hypocenter.name || '不明',
            maxIntensity: earthquake.maxScale || '不明',
            domesticTsunami: earthquake.domesticTsunami || 'None',
            source: 'P2P',
            code: rawData.code,
            metadata: {
                raw: rawData,
                parsed: new Date().toISOString()
            }
        };
    }

    /**
     * マップの更新（拡張版）
     * @param {Array} earthquakes - 地震データ
     */
    updateMap(earthquakes) {
        if (!this.mapRenderer) return;
        
        try {
            // 既存のマーカーをクリア
            this.mapRenderer.clearMarkers('earthquakes');
            
            // 新しいマーカーを追加（最大50件）
            const filtered = earthquakes
                .filter(eq => eq.latitude && eq.longitude)
                .slice(0, CONFIG.PERFORMANCE.MAX_MARKERS);
            
            filtered.forEach(eq => {
                this.mapRenderer.addEarthquake(eq);
            });
            
        } catch (error) {
            console.error('Map update error:', error);
        }
    }

    /**
     * 緊急地震速報の処理（拡張版）
     * @param {Object} eew - 緊急地震速報
     */
    handleEEW(eew) {
        console.warn('⚠️ 緊急地震速報:', eew);
        
        // UIの更新
        const card = document.getElementById('eew-card');
        const info = document.getElementById('eew-info');
        
        if (card && info) {
            card.style.display = 'block';
            card.classList.add('alert-pulse');
            
            info.innerHTML = `
                <div class="eew-alert">
                    <div class="eew-header">
                        <span class="eew-icon">⚠️</span>
                        <span class="eew-title">緊急地震速報</span>
                    </div>
                    <div class="eew-details">
                        <p><strong>予想マグニチュード:</strong> M${eew.magnitude || '不明'}</p>
                        <p><strong>予想最大震度:</strong> ${eew.maxIntensity || '不明'}</p>
                        <p><strong>震源:</strong> ${eew.region || '不明'}</p>
                        <p><strong>発生時刻:</strong> ${Utils.formatDate(eew.time)}</p>
                    </div>
                    <div class="eew-action">
                        <strong>強い揺れに警戒してください!</strong>
                    </div>
                </div>
            `;
        }
        
        // マップに表示
        if (this.mapRenderer) {
            this.mapRenderer.renderEEW(eew);
        }
        
        // 通知
        if (notificationService) {
            notificationService.showEEWAlert(eew);
        }
        
        // 音声アラート
        if (AudioManager) {
            AudioManager.playEEWAlert(eew);
        }
        
        // ビジュアルエフェクト
        if (Visualizations && eew.latitude && eew.longitude) {
            const epicenter = this.mapRenderer.latLonToScreen(eew.latitude, eew.longitude);
            Visualizations.animateSeismicWaves(eew, {
                duration: 30000,
                showPWave: true,
                showSWave: true
            });
        }
    }

    /**
     * 津波情報の処理（拡張版）
     * @param {Array} tsunamiData - 津波データ
     */
    handleTsunami(tsunamiData) {
        console.warn('🌊 津波情報:', tsunamiData);
        
        // UIの更新
        const card = document.getElementById('tsunami-card');
        const info = document.getElementById('tsunami-info');
        
        if (card && info) {
            card.style.display = 'block';
            card.classList.add('warning-pulse');
            
            const warnings = tsunamiData.filter(t => !t.cancelled);
            
            info.innerHTML = `
                <div class="tsunami-alert">
                    <div class="tsunami-header">
                        <span class="tsunami-icon">🌊</span>
                        <span class="tsunami-title">津波情報</span>
                    </div>
                    <div class="tsunami-warnings">
                        ${warnings.map(t => `
                            <div class="tsunami-warning tsunami-${t.grade}">
                                <strong>${t.gradeLabel}</strong>
                                <p>${Object.keys(t.areas || {}).length}地域に発表</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="tsunami-action">
                        <strong>直ちに高台に避難してください!</strong>
                    </div>
                </div>
            `;
        }
        
        // マップに表示
        if (this.mapRenderer) {
            this.mapRenderer.renderTsunami(tsunamiData);
        }
        
        // 通知
        if (notificationService) {
            notificationService.showTsunamiAlert(tsunamiData);
        }
        
        // 音声アラート
        if (AudioManager) {
            AudioManager.playTsunamiAlert(tsunamiData);
        }
    }

    startRealtimeUpdates() {
        console.log('🔄 Starting realtime updates...');
        
        // P2P地震情報のポーリング
        p2pEarthquakeService.startPolling((latestEarthquake) => {
            console.log('新しい地震:', latestEarthquake);
            const earthquake = this.parseEarthquakeData(latestEarthquake);
            dataStore.addEarthquake(earthquake);
            Renderers.renderLatestEarthquake(earthquake);
            notificationService.showEarthquakeNotification(earthquake);
            this.updateLastUpdate();
        });
        
        // 津波情報のポーリング
        if (tsunamiService) {
            tsunamiService.startPolling((tsunamiData) => dataStore.setTsunami(tsunamiData));
        }
        
        // 地震データのポーリング（1分ごと）
        this.pollingIntervals.earthquakes = setInterval(async () => {
            await this.pollEarthquakeData();
        }, 60000);
        
        // EEWのポーリング（10秒ごと）
        this.pollingIntervals.eew = setInterval(async () => {
            await this.pollEEWData();
        }, 10000);
        
        // 津波のポーリング（30秒ごと）
        this.pollingIntervals.tsunami = setInterval(async () => {
            await this.pollTsunamiData();
        }, 30000);
        
        // 統計の更新（5分ごと）
        this.pollingIntervals.statistics = setInterval(() => {
            dataStore.recalculateStatistics();
        }, 300000);
        
        // 更新時刻の表示（1分ごと）
        setInterval(() => this.updateLastUpdate(), 60000);
        
        console.log('  ✓ Realtime updates started');
    }

    /**
     * 地震データのポーリング
     */
    async pollEarthquakeData() {
        try {
            const earthquakes = await p2pEarthquakeService.getRecentEarthquakes({ limit: 10 });
            
            if (earthquakes && earthquakes.length > 0) {
                const parsed = earthquakes.map(item => this.parseEarthquakeData(item));
                
                // 新しい地震のみ追加
                let newCount = 0;
                parsed.forEach(eq => {
                    const exists = dataStore.get('realtime.earthquakes').find(e => e.id === eq.id);
                    if (!exists) {
                        dataStore.addEarthquake(eq);
                        newCount++;
                    }
                });
                
                if (newCount > 0) {
                    console.log(`  ⭐ ${newCount} new earthquake(s) detected`);
                    Utils.showToast(`新しい地震情報: ${newCount}件`, 'info');
                }
            }
            
            this.performanceMetrics.apiCalls++;
            
        } catch (error) {
            console.error('Failed to poll earthquake data:', error);
        }
    }

    /**
     * EEWデータのポーリング
     */
    async pollEEWData() {
        try {
            const eew = await p2pEarthquakeService.getEEW();
            
            if (eew) {
                const currentEEW = dataStore.get('realtime.eew');
                
                // 新しいEEWまたは更新された場合
                if (!currentEEW || eew.serial !== currentEEW.serial) {
                    dataStore.set('realtime.eew', eew);
                    console.log('  🚨 New EEW detected:', eew);
                }
            }
            
            this.performanceMetrics.apiCalls++;
            
        } catch (error) {
            console.error('Failed to poll EEW data:', error);
        }
    }

    /**
     * 津波データのポーリング
     */
    async pollTsunamiData() {
        try {
            if (tsunamiService) {
                const tsunami = await tsunamiService.getTsunamiInfo();
                
                if (tsunami && tsunami.length > 0) {
                    const currentTsunami = dataStore.get('realtime.tsunami');
                    
                    // 変更があった場合のみ更新
                    if (JSON.stringify(tsunami) !== JSON.stringify(currentTsunami)) {
                        dataStore.set('realtime.tsunami', tsunami);
                        console.log('  🌊 Tsunami info updated');
                    }
                }
            }
            
            this.performanceMetrics.apiCalls++;
            
        } catch (error) {
            console.error('Failed to poll tsunami data:', error);
        }
    }

    /**
     * ユーザー位置情報の取得
     */
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    
                    dataStore.set('user.location', location);
                    
                    // マップの中心を移動
                    if (this.mapRenderer && this.mapRenderer.map) {
                        this.mapRenderer.map.setView([location.lat, location.lon], 10);
                    }
                    
                    console.log('📍 User location acquired:', location);
                },
                (error) => {
                    console.warn('Failed to get user location:', error.message);
                }
            );
        }
    }

    /**
     * ダッシュボードの更新
     */
    updateDashboard() {
        const earthquakes = dataStore.get('realtime.earthquakes');
        const stats = dataStore.get('statistics');
        
        // 最新の重要な地震
        const significant = earthquakes.filter(eq => 
            eq.magnitude >= CONFIG.THRESHOLDS.SIGNIFICANT_MAGNITUDE ||
            ['5+', '5-', '6+', '6-', '7'].includes(eq.maxIntensity)
        );
        
        if (significant.length > 0) {
            Renderers.renderSignificantEarthquakes(significant);
        }
        
        // トレンド
        if (stats && stats.trends) {
            Renderers.renderTrends(stats.trends);
        }
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ビュー切り替え
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // 検索
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        // フィルター
        const filterForm = document.getElementById('filter-form');
        if (filterForm) {
            filterForm.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        // モーダルを閉じる
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });
    }

    /**
     * ビュー切り替え
     * @param {string} viewName - ビュー名
     */
    switchView(viewName) {
        dataStore.set('ui.activeView', viewName);
        
        // すべてのビューを非表示
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        
        // 指定されたビューを表示
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        // ナビゲーションの更新
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
    }

    /**
     * 検索の処理
     * @param {string} query - 検索クエリ
     */
    handleSearch(query) {
        if (!query || query.length < 2) {
            return;
        }
        
        const earthquakes = dataStore.get('realtime.earthquakes');
        const results = earthquakes.filter(eq => 
            eq.region.toLowerCase().includes(query.toLowerCase()) ||
            eq.magnitude.toString().includes(query)
        );
        
        Renderers.renderSearchResults(results, query);
        
        // 検索履歴に追加
        const history = dataStore.get('history.searches') || [];
        if (!history.includes(query)) {
            history.unshift(query);
            dataStore.set('history.searches', history.slice(0, 10));
        }
    }

    /**
     * フィルターの適用
     */
    applyFilters() {
        const filters = dataStore.get('ui.filters');
        const earthquakes = dataStore.get('realtime.earthquakes');
        
        let filtered = earthquakes;
        
        // マグニチュードフィルター
        if (filters.minMagnitude) {
            filtered = filtered.filter(eq => eq.magnitude >= filters.minMagnitude);
        }
        
        // 震度フィルター
        if (filters.minIntensity) {
            filtered = filtered.filter(eq => {
                const intensity = dataStore.intensityToNumber(eq.maxIntensity);
                return intensity >= filters.minIntensity;
            });
        }
        
        // 地域フィルター
        if (filters.region && filters.region !== 'all') {
            filtered = filtered.filter(eq => eq.region.includes(filters.region));
        }
        
        Renderers.renderEarthquakeList(filtered);
    }

    /**
     * テーマの適用
     */
    applyTheme() {
        const theme = dataStore.get('user.preferences.theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * キーボードショートカットの設定
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrlキーが押されている場合は無視
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            
            switch(e.key.toLowerCase()) {
                case 'r':
                    e.preventDefault();
                    this.refreshData();
                    break;
                case 'm':
                    e.preventDefault();
                    this.switchView('map');
                    break;
                case 'l':
                    e.preventDefault();
                    this.switchView('list');
                    break;
                case 's':
                    e.preventDefault();
                    this.switchView('statistics');
                    break;
                case '/':
                    e.preventDefault();
                    document.getElementById('search-input')?.focus();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.closeModal();
                    break;
            }
        });
    }

    /**
     * パフォーマンス監視の開始
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            const memory = performance.memory;
            if (memory) {
                this.performanceMetrics.memory = {
                    used: Math.round(memory.usedJSHeapSize / 1048576),
                    total: Math.round(memory.totalJSHeapSize / 1048576),
                    limit: Math.round(memory.jsHeapSizeLimit / 1048576)
                };
            }
            
            // パフォーマンスメトリクスをDataStoreに保存
            dataStore.set('system.performance', this.performanceMetrics);
            
        }, 60000); // 1分ごと
    }

    /**
     * 自動保存の設定
     */
    setupAutoSave() {
        setInterval(() => {
            dataStore.saveToStorage();
        }, 300000); // 5分ごと
    }

    updateLastUpdate() {
        const lastUpdate = dataStore.get('realtime.lastUpdate');
        const element = document.getElementById('last-update');
        if (element && lastUpdate) element.textContent = Utils.formatDate(lastUpdate);
    }

    async refreshData() {
        Utils.setLoading(true, 'データを更新中...');
        try {
            await this.loadInitialData();
            Utils.showToast('データを更新しました', 'success');
        } catch (error) {
            Utils.showToast('データの更新に失敗しました', 'error');
        } finally {
            Utils.setLoading(false);
        }
    }

    showEarthquakeDetail(id) {
        const earthquakes = dataStore.get('history.earthquakes');
        const earthquake = earthquakes.find(eq => eq.id === id);
        if (!earthquake) return;
        const modal = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-body');
        if (modal && body) {
            body.innerHTML = `
                <h2>地震詳細</h2>
                <div class="earthquake-detail">
                    <p><strong>発生時刻:</strong> ${Utils.formatDate(earthquake.time)}</p>
                    <p><strong>震源地:</strong> ${earthquake.region}</p>
                    <p><strong>マグニチュード:</strong> M${earthquake.magnitude}</p>
                    <p><strong>深さ:</strong> ${earthquake.depth}km</p>
                    <p><strong>最大震度:</strong> ${Utils.getIntensityLabel(earthquake.maxIntensity)}</p>
                    <button class="btn" onclick="app.closeModal()">閉じる</button>
                </div>
            `;
            modal.style.display = 'flex';
        }
    }

    async navigateToShelter(shelterId) {
        const userLocation = dataStore.get('user.location');
        if (!userLocation) {
            Utils.showToast('現在地を取得してください', 'warning');
            return;
        }
        const shelters = dataStore.get('cache.shelters');
        const shelter = shelters.find(s => s.id === shelterId);
        if (!shelter) return;
        const route = await geoService.calculateRoute(userLocation, { lat: shelter.lat, lon: shelter.lon });
        if (route && this.mapRenderer) {
            this.mapRenderer.renderRoute({ start: userLocation, end: { lat: shelter.lat, lon: shelter.lon }, waypoints: route.waypoints });
        }
        Utils.showToast(`${shelter.name}までのルートを表示しました`, 'success');
    }

    closeModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.style.display = 'none';
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new EarthquakeApp();
    window.app = app;
});

if (typeof window !== 'undefined') window.EarthquakeApp = EarthquakeApp;
