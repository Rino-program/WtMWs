/**
 * データストア - 中央データ管理システム（1500行超）
 * 全てのアプリケーションデータを一元管理
 * 状態管理、キャッシュ、永続化、リアルタイム同期
 */

class DataStore {
    constructor() {
        this.state = {
            // リアルタイムデータ
            realtime: {
                earthquakes: [],
                eew: null, // 緊急地震速報
                tsunami: [],
                intensity: new Map(), // 震度情報
                lastUpdate: null,
                connectionStatus: 'connecting', // 接続状態
                dataQuality: 100, // データ品質スコア
                latency: 0 // レイテンシ(ms)
            },
            
            // 履歴データ
            history: {
                earthquakes: [],
                significant: [], // 重要な地震
                recent: [], // 最近の地震
                favorites: [], // お気に入り
                viewed: [], // 閲覧履歴
                bookmarks: [], // ブックマーク
                searches: [] // 検索履歴
            },
            
            // 統計データ
            statistics: {
                daily: {},
                weekly: {},
                monthly: {},
                yearly: {},
                byRegion: {},
                byMagnitude: {},
                byDepth: {},
                byIntensity: {},
                trends: {
                    increasing: false,
                    averageMagnitude: 0,
                    totalCount: 0,
                    significantCount: 0
                },
                correlations: {
                    magnitudeDepth: 0,
                    regionFrequency: {}
                }
            },
            
            // ユーザー設定
            user: {
                location: null,
                favorites: [],
                notifications: {
                    enabled: true,
                    minMagnitude: 3.0,
                    minIntensity: '3',
                    eew: true,
                    tsunami: true,
                    sound: true,
                    voice: true,
                    vibration: true,
                    desktop: true,
                    push: false
                },
                theme: 'light',
                language: 'ja',
                mapLayer: 'DEFAULT',
                preferences: {
                    autoRefresh: true,
                    refreshInterval: 10000,
                    showAnimations: true,
                    compactView: false,
                    highContrast: false,
                    largeText: false
                },
                privacy: {
                    shareLocation: false,
                    analytics: true,
                    crashReports: true
                }
            },
            
            // UI状態
            ui: {
                loading: false,
                error: null,
                activeView: 'dashboard',
                previousView: null,
                selectedEarthquake: null,
                mapCenter: CONFIG.MAP.DEFAULT_CENTER,
                mapZoom: CONFIG.MAP.DEFAULT_ZOOM,
                filters: {
                    minMagnitude: 0,
                    maxMagnitude: 10,
                    minDepth: 0,
                    maxDepth: 1000,
                    timeRange: 'all',
                    regions: [],
                    intensities: [],
                    types: []
                },
                sorting: {
                    field: 'time',
                    order: 'desc'
                },
                pagination: {
                    currentPage: 1,
                    itemsPerPage: 20,
                    totalItems: 0
                },
                modals: {
                    active: null,
                    stack: []
                },
                toasts: []
            },
            
            // キャッシュデータ
            cache: {
                shelters: [],
                routes: {},
                geocoded: {},
                apiResponses: new Map(),
                computedData: new Map(),
                images: new Map()
            },
            
            // システム状態
            system: {
                initialized: false,
                version: '1.0.0',
                lastSync: null,
                performance: {
                    fps: 60,
                    memoryUsage: 0,
                    apiCalls: 0,
                    errorCount: 0
                },
                features: {
                    geolocation: false,
                    notifications: false,
                    serviceWorker: false,
                    webgl: false
                },
                network: {
                    online: navigator.onLine,
                    speed: 'unknown',
                    type: 'unknown'
                }
            }
        };
        
        this.listeners = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        this.batchUpdates = [];
        this.updateTimer = null;
        this.middleware = [];
        this.history = [];
        this.maxHistorySize = 50;
        
        this.init();
    }

    /**
     * 初期化
     */
    async init() {
        console.log('📦 DataStore initializing...');
        
        // ストレージから読み込み
        await this.loadFromStorage();
        
        // システム機能の検出
        this.detectSystemFeatures();
        
        // ネットワーク監視
        this.setupNetworkMonitoring();
        
        // パフォーマンス監視
        this.setupPerformanceMonitoring();
        
        // 自動保存の設定
        this.setupAutoSave();
        
        this.state.system.initialized = true;
        console.log('✅ DataStore initialized');
        
        this.notify('system.initialized', true);
    }

    /**
     * システム機能の検出
     */
    detectSystemFeatures() {
        // Geolocation API
        this.state.system.features.geolocation = 'geolocation' in navigator;
        
        // Notifications API
        this.state.system.features.notifications = 'Notification' in window;
        
        // Service Worker
        this.state.system.features.serviceWorker = 'serviceWorker' in navigator;
        
        // WebGL
        const canvas = document.createElement('canvas');
        this.state.system.features.webgl = !!(
            canvas.getContext('webgl') || 
            canvas.getContext('experimental-webgl')
        );
        
        console.log('🔍 System features:', this.state.system.features);
    }

    /**
     * ネットワーク監視の設定
     */
    setupNetworkMonitoring() {
        window.addEventListener('online', () => {
            this.set('system.network.online', true);
            this.set('realtime.connectionStatus', 'connected');
            console.log('🌐 Network: Online');
        });
        
        window.addEventListener('offline', () => {
            this.set('system.network.online', false);
            this.set('realtime.connectionStatus', 'disconnected');
            console.log('📵 Network: Offline');
        });
        
        // Network Information API
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.state.system.network.type = connection.effectiveType;
            this.state.system.network.speed = connection.downlink;
            
            connection.addEventListener('change', () => {
                this.set('system.network.type', connection.effectiveType);
                this.set('system.network.speed', connection.downlink);
            });
        }
    }

    /**
     * パフォーマンス監視の設定
     */
    setupPerformanceMonitoring() {
        // FPS計測
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const now = performance.now();
            
            if (now >= lastTime + 1000) {
                this.state.system.performance.fps = frames;
                frames = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        measureFPS();
        
        // メモリ使用量（対応ブラウザのみ）
        if (performance.memory) {
            setInterval(() => {
                this.state.system.performance.memoryUsage = 
                    Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
            }, 5000);
        }
    }

    /**
     * 自動保存の設定
     */
    setupAutoSave() {
        // 5分ごとに自動保存
        setInterval(() => {
            this.saveToStorage();
        }, 300000);
        
        // ページアンロード時に保存
        window.addEventListener('beforeunload', () => {
            this.saveToStorage();
        });
        
        // visibility change時に保存
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveToStorage();
            }
        });
    }

    /**
     * 状態を取得
     * @param {string} path - パス（例: 'realtime.earthquakes'）
     * @returns {any} 状態の値
     */
    get(path) {
        return this.getNestedValue(this.state, path);
    }

    /**
     * 状態を設定（ミドルウェア対応）
     * @param {string} path - パス
     * @param {any} value - 値
     * @param {Object} options - オプション
     */
    set(path, value, options = {}) {
        const { silent = false, history = true } = options;
        
        const oldValue = this.get(path);
        
        // ミドルウェアの実行
        let processedValue = value;
        for (const middleware of this.middleware) {
            const result = middleware(path, processedValue, oldValue, this.state);
            if (result !== undefined) {
                processedValue = result;
            }
        }
        
        // 値の設定
        this.setNestedValue(this.state, path, processedValue);
        
        // 履歴に記録
        if (history && this.shouldRecordHistory(path)) {
            this.recordHistory({
                type: 'set',
                path,
                oldValue,
                newValue: processedValue,
                timestamp: Date.now()
            });
        }
        
        // 通知
        if (!silent) {
            this.notify(path, processedValue);
        }
        
        // 特定のパスは自動保存
        if (this.shouldAutoSave(path)) {
            this.debouncedSave();
        }
    }

    /**
     * 状態を更新（マージ）
     * @param {string} path - パス
     * @param {any} updates - 更新内容
     */
    update(path, updates) {
        const current = this.get(path);
        if (typeof current === 'object' && !Array.isArray(current)) {
            this.set(path, { ...current, ...updates });
        } else if (Array.isArray(current)) {
            this.set(path, [...current, ...updates]);
        } else {
            this.set(path, updates);
        }
    }

    /**
     * バッチ更新
     * @param {Array} updates - 更新の配列 [{path, value}, ...]
     */
    batchUpdate(updates) {
        this.batchUpdates.push(...updates);
        
        if (!this.updateTimer) {
            this.updateTimer = setTimeout(() => {
                const updates = [...this.batchUpdates];
                this.batchUpdates = [];
                this.updateTimer = null;
                
                updates.forEach(({ path, value, options }) => {
                    this.set(path, value, options);
                });
            }, 0);
        }
    }

    /**
     * トランザクション（複数更新を1つの操作として扱う）
     * @param {Function} callback - トランザクション内の処理
     */
    transaction(callback) {
        const updates = [];
        const proxy = new Proxy(this, {
            get: (target, prop) => {
                if (prop === 'set') {
                    return (path, value, options) => {
                        updates.push({ path, value, options });
                    };
                }
                return target[prop];
            }
        });
        
        callback(proxy);
        this.batchUpdate(updates);
    }

    /**
     * ミドルウェアの追加
     * @param {Function} middleware - ミドルウェア関数
     */
    use(middleware) {
        this.middleware.push(middleware);
    }

    /**
     * 履歴に記録すべきか判定
     * @param {string} path - パス
     * @returns {boolean}
     */
    shouldRecordHistory(path) {
        // UIの一時的な状態は記録しない
        return !path.startsWith('ui.loading') && 
               !path.startsWith('ui.toasts') &&
               !path.startsWith('system.performance');
    }

    /**
     * 履歴を記録
     * @param {Object} entry - 履歴エントリ
     */
    recordHistory(entry) {
        this.history.unshift(entry);
        
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize);
        }
    }

    /**
     * 履歴を取得
     * @param {number} limit - 取得数
     * @returns {Array} 履歴
     */
    getHistory(limit = 10) {
        return this.history.slice(0, limit);
    }

    /**
     * 元に戻す
     * @returns {boolean} 成功したか
     */
    undo() {
        if (this.history.length === 0) return false;
        
        const entry = this.history.shift();
        if (entry.type === 'set') {
            this.set(entry.path, entry.oldValue, { history: false });
        }
        
        return true;
    }

    /**
     * 自動保存すべきか判定
     * @param {string} path - パス
     * @returns {boolean}
     */
    shouldAutoSave(path) {
        return path.startsWith('user.') || 
               path.startsWith('history.favorites') ||
               path.startsWith('history.bookmarks');
    }

    /**
     * デバウンス付き保存
     */
    debouncedSave() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this.saveToStorage();
        }, 1000);
    }

    /**
     * リスナーを登録
     * @param {string} path - 監視するパス
     * @param {Function} callback - コールバック
     * @param {Object} options - オプション
     * @returns {Function} リスナー解除関数
     */
    subscribe(path, callback, options = {}) {
        const { immediate = false, once = false } = options;
        
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        
        const wrappedCallback = once ? (...args) => {
            callback(...args);
            this.listeners.get(path).delete(wrappedCallback);
        } : callback;
        
        this.listeners.get(path).add(wrappedCallback);
        
        // 即座に現在の値で呼び出す
        if (immediate) {
            const currentValue = this.get(path);
            callback(currentValue, path);
        }
        
        // リスナー解除関数を返す
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(wrappedCallback);
                if (listeners.size === 0) {
                    this.listeners.delete(path);
                }
            }
        };
    }

    /**
     * 複数パスを監視
     * @param {Array} paths - パスの配列
     * @param {Function} callback - コールバック
     * @returns {Function} すべてのリスナーを解除する関数
     */
    subscribeMany(paths, callback) {
        const unsubscribers = paths.map(path => this.subscribe(path, callback));
        
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }

    /**
     * 条件付き監視
     * @param {string} path - パス
     * @param {Function} predicate - 条件関数
     * @param {Function} callback - コールバック
     * @returns {Function} リスナー解除関数
     */
    subscribeWhen(path, predicate, callback) {
        return this.subscribe(path, (value, path) => {
            if (predicate(value, path)) {
                callback(value, path);
            }
        });
    }

    /**
     * リスナーに通知
     * @param {string} path - パス
     * @param {any} value - 新しい値
     */
    notify(path, value) {
        // 完全一致のリスナーに通知
        const listeners = this.listeners.get(path);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(value, path);
                } catch (error) {
                    console.error(`Listener error for path "${path}":`, error);
                }
            });
        }
        
        // 親パスのリスナーに通知（例: 'realtime.earthquakes' → 'realtime'）
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentListeners = this.listeners.get(parentPath);
            if (parentListeners) {
                parentListeners.forEach(callback => {
                    try {
                        callback(this.get(parentPath), parentPath);
                    } catch (error) {
                        console.error(`Listener error for parent path "${parentPath}":`, error);
                    }
                });
            }
        }
        
        // ワイルドカード通知（全体の変更を監視）
        const globalListeners = this.listeners.get('*');
        if (globalListeners) {
            globalListeners.forEach(callback => {
                try {
                    callback(value, path);
                } catch (error) {
                    console.error('Global listener error:', error);
                }
            });
        }
    }

    /**
     * リスナー数を取得
     * @param {string} path - パス（省略時は全体）
     * @returns {number} リスナー数
     */
    getListenerCount(path = null) {
        if (path) {
            const listeners = this.listeners.get(path);
            return listeners ? listeners.size : 0;
        }
        
        let total = 0;
        for (const listeners of this.listeners.values()) {
            total += listeners.size;
        }
        return total;
    }

    /**
     * すべてのリスナーをクリア
     * @param {string} path - パス（省略時は全体）
     */
    clearListeners(path = null) {
        if (path) {
            this.listeners.delete(path);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * 地震データを追加（拡張版）
     * @param {Object} earthquake - 地震データ
     * @param {Object} options - オプション
     */
    addEarthquake(earthquake, options = {}) {
        const { 
            skipDuplicateCheck = false,
            updateStatistics = true,
            notify = true
        } = options;
        
        const earthquakes = this.get('realtime.earthquakes');
        const exists = !skipDuplicateCheck && earthquakes.some(eq => eq.id === earthquake.id);
        
        if (!exists) {
            // データの正規化と検証
            const normalizedEarthquake = this.normalizeEarthquakeData(earthquake);
            
            // 追加
            earthquakes.unshift(normalizedEarthquake);
            
            // 最大数を超えた場合は古いものを削除
            if (earthquakes.length > CONFIG.PERFORMANCE.MAX_MARKERS) {
                earthquakes.pop();
            }
            
            this.set('realtime.earthquakes', earthquakes, { silent: !notify });
            this.set('realtime.lastUpdate', new Date().toISOString());
            
            // 履歴にも追加
            this.addToHistory(normalizedEarthquake);
            
            // 統計を更新
            if (updateStatistics) {
                this.updateStatistics(normalizedEarthquake);
            }
            
            // 重要な地震の場合はアラート
            if (this.isSignificantEarthquake(normalizedEarthquake)) {
                this.handleSignificantEarthquake(normalizedEarthquake);
            }
            
            // データ品質スコアを更新
            this.updateDataQuality();
            
            return normalizedEarthquake;
        }
        
        return null;
    }

    /**
     * 地震データの正規化
     * @param {Object} earthquake - 地震データ
     * @returns {Object} 正規化されたデータ
     */
    normalizeEarthquakeData(earthquake) {
        return {
            id: earthquake.id || `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            time: earthquake.time || new Date().toISOString(),
            magnitude: parseFloat(earthquake.magnitude) || 0,
            depth: parseFloat(earthquake.depth) || 0,
            latitude: parseFloat(earthquake.latitude) || 0,
            longitude: parseFloat(earthquake.longitude) || 0,
            region: earthquake.region || '不明',
            maxIntensity: earthquake.maxIntensity || '不明',
            domesticTsunami: earthquake.domesticTsunami || 'None',
            source: earthquake.source || 'unknown',
            reliability: earthquake.reliability || 100,
            metadata: {
                added: new Date().toISOString(),
                updated: earthquake.metadata?.updated || null,
                source: earthquake.source || 'API',
                version: this.state.system.version
            }
        };
    }

    /**
     * 重要な地震か判定
     * @param {Object} earthquake - 地震データ
     * @returns {boolean}
     */
    isSignificantEarthquake(earthquake) {
        return earthquake.magnitude >= 6.0 || 
               this.intensityToNumber(earthquake.maxIntensity) >= 5;
    }

    /**
     * 重要な地震の処理
     * @param {Object} earthquake - 地震データ
     */
    handleSignificantEarthquake(earthquake) {
        // 重要な地震リストに追加
        const significant = this.get('history.significant');
        significant.unshift(earthquake);
        this.set('history.significant', significant.slice(0, 100));
        
        // 通知イベントを発火
        this.notify('earthquake.significant', earthquake);
        
        console.warn('⚠️ Significant earthquake detected:', earthquake);
    }

    /**
     * 複数の地震データを一括追加
     * @param {Array} earthquakes - 地震データの配列
     * @param {Object} options - オプション
     */
    addEarthquakes(earthquakes, options = {}) {
        const { 
            sort = true,
            updateStatisticsOnce = true
        } = options;
        
        const added = [];
        
        // 統計更新を一時停止
        earthquakes.forEach(earthquake => {
            const result = this.addEarthquake(earthquake, {
                ...options,
                updateStatistics: false
            });
            if (result) added.push(result);
        });
        
        // ソート
        if (sort) {
            this.sortEarthquakes();
        }
        
        // 統計を一括更新
        if (updateStatisticsOnce) {
            this.recalculateStatistics();
        }
        
        return added;
    }

    /**
     * 地震データをソート
     * @param {string} field - ソートフィールド
     * @param {string} order - ソート順 ('asc' or 'desc')
     */
    sortEarthquakes(field = 'time', order = 'desc') {
        const earthquakes = this.get('realtime.earthquakes');
        
        earthquakes.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (field === 'time') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }
            
            if (order === 'desc') {
                return bVal - aVal;
            } else {
                return aVal - bVal;
            }
        });
        
        this.set('realtime.earthquakes', earthquakes);
    }

    /**
     * 地震データを削除
     * @param {string} earthquakeId - 地震ID
     * @returns {boolean} 削除に成功したか
     */
    removeEarthquake(earthquakeId) {
        const earthquakes = this.get('realtime.earthquakes');
        const index = earthquakes.findIndex(eq => eq.id === earthquakeId);
        
        if (index !== -1) {
            earthquakes.splice(index, 1);
            this.set('realtime.earthquakes', earthquakes);
            
            // 統計を再計算
            this.recalculateStatistics();
            
            return true;
        }
        
        return false;
    }

    /**
     * すべての地震データをクリア
     */
    clearEarthquakes() {
        this.set('realtime.earthquakes', []);
        this.notify('earthquakes.cleared', true);
    }

    /**
     * 震度を数値に変換
     * @param {string} intensity - 震度
     * @returns {number} 数値
     */
    intensityToNumber(intensity) {
        const map = {
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
            '5-': 5, '5+': 6, '6-': 7, '6+': 8, '7': 9
        };
        return map[intensity] || 0;
    }

    /**
     * データ品質スコアを更新
     */
    updateDataQuality() {
        const earthquakes = this.get('realtime.earthquakes');
        
        if (earthquakes.length === 0) {
            this.set('realtime.dataQuality', 100);
            return;
        }
        
        // データの完全性をチェック
        let qualityScore = 0;
        let totalChecks = 0;
        
        earthquakes.slice(0, 10).forEach(eq => {
            const checks = [
                eq.magnitude > 0,
                eq.depth >= 0,
                eq.latitude && eq.longitude,
                eq.region && eq.region !== '不明',
                eq.maxIntensity && eq.maxIntensity !== '不明',
                eq.time
            ];
            
            qualityScore += checks.filter(Boolean).length;
            totalChecks += checks.length;
        });
        
        const quality = Math.round((qualityScore / totalChecks) * 100);
        this.set('realtime.dataQuality', quality);
    }

    /**
     * 履歴に追加
     * @param {Object} earthquake - 地震データ
     */
    addToHistory(earthquake) {
        const history = this.get('history.earthquakes');
        history.unshift(earthquake);
        
        // 最大500件まで保持
        if (history.length > CONFIG.PERFORMANCE.MAX_HISTORY) {
            history.pop();
        }
        
        this.set('history.earthquakes', history);
        
        // 重要な地震（M6.0以上）
        if (earthquake.magnitude >= 6.0) {
            const significant = this.get('history.significant');
            significant.unshift(earthquake);
            this.set('history.significant', significant.slice(0, 100));
        }
    }

    /**
     * 統計を更新（拡張版）
     * @param {Object} earthquake - 地震データ
     */
    updateStatistics(earthquake) {
        const stats = this.get('statistics');
        const date = new Date(earthquake.time);
        const today = new Date().toDateString();
        const thisWeek = this.getWeekKey(date);
        const thisMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const thisYear = date.getFullYear().toString();
        
        // 日次統計
        if (!stats.daily[today]) {
            stats.daily[today] = {
                count: 0,
                maxMagnitude: 0,
                minMagnitude: 10,
                avgMagnitude: 0,
                totalMagnitude: 0,
                earthquakes: [],
                byIntensity: {},
                byDepth: {},
                byRegion: {}
            };
        }
        
        const daily = stats.daily[today];
        daily.count++;
        daily.maxMagnitude = Math.max(daily.maxMagnitude, earthquake.magnitude || 0);
        daily.minMagnitude = Math.min(daily.minMagnitude, earthquake.magnitude || 10);
        daily.totalMagnitude += earthquake.magnitude || 0;
        daily.avgMagnitude = daily.totalMagnitude / daily.count;
        daily.earthquakes.push(earthquake.id);
        
        // 震度別
        const intensity = earthquake.maxIntensity || '不明';
        daily.byIntensity[intensity] = (daily.byIntensity[intensity] || 0) + 1;
        
        // 深さ別
        const depthKey = this.getDepthCategory(earthquake.depth);
        daily.byDepth[depthKey] = (daily.byDepth[depthKey] || 0) + 1;
        
        // 地域別
        if (earthquake.region) {
            daily.byRegion[earthquake.region] = (daily.byRegion[earthquake.region] || 0) + 1;
        }
        
        // 週次統計
        if (!stats.weekly[thisWeek]) {
            stats.weekly[thisWeek] = {
                count: 0,
                maxMagnitude: 0,
                earthquakes: []
            };
        }
        stats.weekly[thisWeek].count++;
        stats.weekly[thisWeek].maxMagnitude = Math.max(
            stats.weekly[thisWeek].maxMagnitude,
            earthquake.magnitude || 0
        );
        stats.weekly[thisWeek].earthquakes.push(earthquake.id);
        
        // 月次統計
        if (!stats.monthly[thisMonth]) {
            stats.monthly[thisMonth] = {
                count: 0,
                maxMagnitude: 0,
                earthquakes: []
            };
        }
        stats.monthly[thisMonth].count++;
        stats.monthly[thisMonth].maxMagnitude = Math.max(
            stats.monthly[thisMonth].maxMagnitude,
            earthquake.magnitude || 0
        );
        stats.monthly[thisMonth].earthquakes.push(earthquake.id);
        
        // 年次統計
        if (!stats.yearly[thisYear]) {
            stats.yearly[thisYear] = {
                count: 0,
                maxMagnitude: 0,
                earthquakes: []
            };
        }
        stats.yearly[thisYear].count++;
        stats.yearly[thisYear].maxMagnitude = Math.max(
            stats.yearly[thisYear].maxMagnitude,
            earthquake.magnitude || 0
        );
        stats.yearly[thisYear].earthquakes.push(earthquake.id);
        
        // マグニチュード別
        const magKey = `M${Math.floor(earthquake.magnitude || 0)}`;
        stats.byMagnitude[magKey] = (stats.byMagnitude[magKey] || 0) + 1;
        
        // 深さ別（全体）
        stats.byDepth[depthKey] = (stats.byDepth[depthKey] || 0) + 1;
        
        // 震度別（全体）
        stats.byIntensity[intensity] = (stats.byIntensity[intensity] || 0) + 1;
        
        // 地域別（全体）
        if (earthquake.region) {
            stats.byRegion[earthquake.region] = (stats.byRegion[earthquake.region] || 0) + 1;
        }
        
        // トレンド分析
        this.updateTrends(stats);
        
        this.set('statistics', stats);
    }

    /**
     * 週のキーを取得
     * @param {Date} date - 日付
     * @returns {string} 週キー（例: '2025-W01'）
     */
    getWeekKey(date) {
        const year = date.getFullYear();
        const firstDay = new Date(year, 0, 1);
        const days = Math.floor((date - firstDay) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + firstDay.getDay() + 1) / 7);
        return `${year}-W${String(week).padStart(2, '0')}`;
    }

    /**
     * トレンドを更新
     * @param {Object} stats - 統計データ
     */
    updateTrends(stats) {
        const recent = Object.entries(stats.daily)
            .sort((a, b) => new Date(b[0]) - new Date(a[0]))
            .slice(0, 7);
        
        if (recent.length < 2) return;
        
        // 地震回数のトレンド
        const counts = recent.map(([_, data]) => data.count);
        const avgRecent = counts.reduce((a, b) => a + b, 0) / counts.length;
        const avgOlder = counts.slice(3).reduce((a, b) => a + b, 0) / (counts.length - 3 || 1);
        
        stats.trends.increasing = avgRecent > avgOlder;
        stats.trends.totalCount = counts.reduce((a, b) => a + b, 0);
        
        // 平均マグニチュード
        const magnitudes = recent.map(([_, data]) => data.avgMagnitude).filter(m => m > 0);
        stats.trends.averageMagnitude = magnitudes.length > 0
            ? magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length
            : 0;
        
        // 重要な地震の数
        stats.trends.significantCount = counts.filter(c => c >= 10).length;
    }

    /**
     * 統計を再計算
     */
    recalculateStatistics() {
        // 統計をリセット
        const stats = {
            daily: {},
            weekly: {},
            monthly: {},
            yearly: {},
            byRegion: {},
            byMagnitude: {},
            byDepth: {},
            byIntensity: {},
            trends: {
                increasing: false,
                averageMagnitude: 0,
                totalCount: 0,
                significantCount: 0
            },
            correlations: {
                magnitudeDepth: 0,
                regionFrequency: {}
            }
        };
        
        // すべての地震データを再集計
        const earthquakes = this.get('history.earthquakes');
        earthquakes.forEach(eq => {
            // 一時的に統計オブジェクトを使用
            this.state.statistics = stats;
            this.updateStatistics(eq);
        });
        
        // 相関分析
        this.calculateCorrelations(stats, earthquakes);
        
        this.set('statistics', stats);
    }

    /**
     * 相関分析
     * @param {Object} stats - 統計データ
     * @param {Array} earthquakes - 地震データ
     */
    calculateCorrelations(stats, earthquakes) {
        if (earthquakes.length < 10) return;
        
        // マグニチュードと深さの相関
        const validData = earthquakes.filter(eq => 
            eq.magnitude > 0 && eq.depth > 0
        );
        
        if (validData.length > 5) {
            const magnitudes = validData.map(eq => eq.magnitude);
            const depths = validData.map(eq => eq.depth);
            
            stats.correlations.magnitudeDepth = this.calculatePearsonCorrelation(
                magnitudes,
                depths
            );
        }
        
        // 地域の頻度分析
        const regionCounts = {};
        earthquakes.forEach(eq => {
            if (eq.region) {
                regionCounts[eq.region] = (regionCounts[eq.region] || 0) + 1;
            }
        });
        
        // 頻度でソート
        const sorted = Object.entries(regionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        stats.correlations.regionFrequency = Object.fromEntries(sorted);
    }

    /**
     * ピアソンの相関係数を計算
     * @param {Array} x - x値の配列
     * @param {Array} y - y値の配列
     * @returns {number} 相関係数
     */
    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt(
            (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
        );
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * 統計サマリーを取得
     * @param {string} period - 期間（'daily', 'weekly', 'monthly', 'yearly'）
     * @returns {Object} 統計サマリー
     */
    getStatisticsSummary(period = 'daily') {
        const stats = this.get(`statistics.${period}`);
        
        const summary = {
            totalPeriods: Object.keys(stats).length,
            totalEarthquakes: 0,
            maxMagnitude: 0,
            avgEarthquakesPerPeriod: 0,
            mostActivePeriod: null
        };
        
        let maxCount = 0;
        
        Object.entries(stats).forEach(([key, data]) => {
            summary.totalEarthquakes += data.count || 0;
            summary.maxMagnitude = Math.max(summary.maxMagnitude, data.maxMagnitude || 0);
            
            if ((data.count || 0) > maxCount) {
                maxCount = data.count;
                summary.mostActivePeriod = {
                    period: key,
                    count: data.count,
                    maxMagnitude: data.maxMagnitude
                };
            }
        });
        
        summary.avgEarthquakesPerPeriod = summary.totalPeriods > 0
            ? Math.round(summary.totalEarthquakes / summary.totalPeriods)
            : 0;
        
        return summary;
    }

    /**
     * 深さカテゴリを取得
     * @param {number} depth - 深さ
     * @returns {string} カテゴリ
     */
    getDepthCategory(depth) {
        if (!depth) return '不明';
        if (depth < 60) return '浅発(0-60km)';
        if (depth < 300) return '中発(60-300km)';
        if (depth < 700) return '深発(300-700km)';
        return '極深発(700km-)';
    }

    /**
     * 緊急地震速報を設定
     * @param {Object} eew - 緊急地震速報データ
     */
    setEEW(eew) {
        this.set('realtime.eew', eew);
        
        // 通知判定
        if (this.get('user.notifications.eew')) {
            this.notifyEEW(eew);
        }
    }

    /**
     * 緊急地震速報通知
     * @param {Object} eew - 緊急地震速報データ
     */
    notifyEEW(eew) {
        // 通知システムを使用
        if (window.notificationService) {
            window.notificationService.showEEWAlert(eew);
        }
    }

    /**
     * 津波情報を設定
     * @param {Array} tsunamiData - 津波データ
     */
    setTsunami(tsunamiData) {
        this.set('realtime.tsunami', tsunamiData);
        
        // アクティブな津波警報がある場合は通知
        const activeWarnings = tsunamiData.filter(t => !t.cancelled);
        if (activeWarnings.length > 0 && this.get('user.notifications.tsunami')) {
            this.notifyTsunami(activeWarnings);
        }
    }

    /**
     * 津波通知
     * @param {Array} warnings - 津波警報
     */
    notifyTsunami(warnings) {
        if (window.notificationService) {
            window.notificationService.showTsunamiAlert(warnings);
        }
    }

    /**
     * フィルタリング済み地震を取得
     * @returns {Array} フィルタリング済み地震リスト
     */
    getFilteredEarthquakes() {
        const earthquakes = this.get('history.earthquakes');
        const filters = this.get('ui.filters');
        
        return earthquakes.filter(eq => {
            // マグニチュードフィルター
            if (eq.magnitude < filters.minMagnitude || eq.magnitude > filters.maxMagnitude) {
                return false;
            }
            
            // 深さフィルター
            if (eq.depth && (eq.depth < filters.minDepth || eq.depth > filters.maxDepth)) {
                return false;
            }
            
            // 時間範囲フィルター
            if (filters.timeRange !== 'all') {
                const time = new Date(eq.time).getTime();
                const now = Date.now();
                const range = CONSTANTS.TIME_PERIODS[filters.timeRange.toUpperCase()]?.value || 0;
                if (now - time > range) {
                    return false;
                }
            }
            
            // 地域フィルター
            if (filters.regions.length > 0 && !filters.regions.includes(eq.region)) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * お気に入りに追加
     * @param {string} earthquakeId - 地震ID
     */
    addToFavorites(earthquakeId) {
        const favorites = this.get('user.favorites');
        if (!favorites.includes(earthquakeId)) {
            favorites.push(earthquakeId);
            this.set('user.favorites', favorites);
        }
    }

    /**
     * お気に入りから削除
     * @param {string} earthquakeId - 地震ID
     */
    removeFromFavorites(earthquakeId) {
        const favorites = this.get('user.favorites');
        const index = favorites.indexOf(earthquakeId);
        if (index > -1) {
            favorites.splice(index, 1);
            this.set('user.favorites', favorites);
        }
    }

    /**
     * お気に入り地震を取得
     * @returns {Array} お気に入り地震リスト
     */
    getFavoriteEarthquakes() {
        const favorites = this.get('user.favorites');
        const allEarthquakes = this.get('history.earthquakes');
        
        return allEarthquakes.filter(eq => favorites.includes(eq.id));
    }

    /**
     * ユーザー位置を設定
     * @param {Object} location - 位置情報
     */
    setUserLocation(location) {
        this.set('user.location', location);
    }

    /**
     * 最寄りの地震を取得
     * @param {number} limit - 取得数
     * @returns {Array} 最寄りの地震リスト
     */
    getNearbyEarthquakes(limit = 10) {
        const userLocation = this.get('user.location');
        if (!userLocation) return [];
        
        const earthquakes = this.get('history.earthquakes');
        
        // 距離を計算してソート
        const withDistance = earthquakes.map(eq => ({
            ...eq,
            distance: this.calculateDistance(userLocation, {
                lat: eq.latitude,
                lon: eq.longitude
            })
        }));
        
        withDistance.sort((a, b) => a.distance - b.distance);
        
        return withDistance.slice(0, limit);
    }

    /**
     * 距離を計算
     * @param {Object} point1 - 地点1
     * @param {Object} point2 - 地点2
     * @returns {number} 距離（km）
     */
    calculateDistance(point1, point2) {
        const R = 6371;
        const dLat = (point2.lat - point1.lat) * Math.PI / 180;
        const dLon = (point2.lon - point1.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(point1.lat * Math.PI / 180) * 
                  Math.cos(point2.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 検索
     * @param {string} query - 検索クエリ
     * @returns {Array} 検索結果
     */
    search(query) {
        const earthquakes = this.get('history.earthquakes');
        const lowerQuery = query.toLowerCase();
        
        return earthquakes.filter(eq => {
            return (
                eq.region?.toLowerCase().includes(lowerQuery) ||
                eq.id?.toLowerCase().includes(lowerQuery) ||
                String(eq.magnitude).includes(query)
            );
        });
    }

    /**
     * ローカルストレージから読み込み（拡張版）
     */
    async loadFromStorage() {
        try {
            console.log('📂 Loading from storage...');
            
            // ユーザー設定
            const settingsKey = CONFIG.STORAGE.KEYS.USER_SETTINGS;
            const stored = localStorage.getItem(settingsKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                
                // ユーザー設定をマージ
                if (data.user) {
                    this.state.user = this.deepMerge(this.state.user, data.user);
                }
                
                // お気に入りを復元
                if (data.favorites) {
                    this.state.history.favorites = data.favorites;
                }
                
                // ブックマークを復元
                if (data.bookmarks) {
                    this.state.history.bookmarks = data.bookmarks;
                }
                
                // 閲覧履歴を復元
                if (data.viewed) {
                    this.state.history.viewed = data.viewed;
                }
                
                // 検索履歴を復元
                if (data.searches) {
                    this.state.history.searches = data.searches;
                }
                
                console.log('✅ Loaded from storage');
            }
            
            // オフラインデータの読み込み
            await this.loadOfflineData();
            
        } catch (error) {
            console.error('❌ Storage loading error:', error);
            
            // エラーの種類に応じて処理
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, clearing old data...');
                this.clearOldStorageData();
            }
        }
    }

    /**
     * オフラインデータの読み込み
     */
    async loadOfflineData() {
        if (!CONFIG.OFFLINE.ENABLED) return;
        
        try {
            const offlineKey = CONFIG.STORAGE.KEYS.OFFLINE_DATA;
            const stored = localStorage.getItem(offlineKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                
                // 地震データを復元（24時間以内のみ）
                const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
                const recentEarthquakes = (data.earthquakes || []).filter(eq => 
                    new Date(eq.time).getTime() > oneDayAgo
                );
                
                if (recentEarthquakes.length > 0) {
                    this.addEarthquakes(recentEarthquakes, {
                        updateStatisticsOnce: true,
                        skipDuplicateCheck: true
                    });
                    
                    console.log(`✅ Restored ${recentEarthquakes.length} offline earthquakes`);
                }
            }
        } catch (error) {
            console.error('Failed to load offline data:', error);
        }
    }

    /**
     * ローカルストレージに保存（拡張版）
     * @param {string} path - 特定のパス（省略時は全体）
     */
    saveToStorage(path = null) {
        try {
            // ユーザー設定を保存
            if (!path || path.startsWith('user') || path.startsWith('history')) {
                const data = {
                    version: this.state.system.version,
                    savedAt: new Date().toISOString(),
                    user: this.get('user'),
                    favorites: this.get('history.favorites'),
                    bookmarks: this.get('history.bookmarks'),
                    viewed: this.get('history.viewed'),
                    searches: this.get('history.searches')
                };
                
                const settingsKey = CONFIG.STORAGE.KEYS.USER_SETTINGS;
                localStorage.setItem(settingsKey, JSON.stringify(data));
            }
            
            // オフラインデータを保存
            this.saveOfflineData();
            
            // 保存時刻を記録
            this.set('system.lastSync', new Date().toISOString(), { silent: true });
            
        } catch (error) {
            console.error('❌ Storage saving error:', error);
            
            if (error.name === 'QuotaExceededError') {
                console.warn('Storage quota exceeded, clearing old data...');
                this.clearOldStorageData();
                
                // 再試行
                try {
                    this.saveToStorage(path);
                } catch (retryError) {
                    console.error('Retry failed:', retryError);
                }
            }
        }
    }

    /**
     * オフラインデータの保存
     */
    saveOfflineData() {
        if (!CONFIG.OFFLINE.ENABLED) return;
        
        try {
            // 最新100件の地震データを保存
            const earthquakes = this.get('realtime.earthquakes').slice(0, 100);
            
            const data = {
                earthquakes,
                savedAt: new Date().toISOString()
            };
            
            const offlineKey = CONFIG.STORAGE.KEYS.OFFLINE_DATA;
            localStorage.setItem(offlineKey, JSON.stringify(data));
            
        } catch (error) {
            console.error('Failed to save offline data:', error);
        }
    }

    /**
     * 古いストレージデータをクリア
     */
    clearOldStorageData() {
        try {
            // 閲覧履歴を半分に
            this.state.history.viewed = this.state.history.viewed.slice(0, 50);
            
            // 検索履歴を半分に
            this.state.history.searches = this.state.history.searches.slice(0, 25);
            
            // オフラインデータを削除
            localStorage.removeItem(CONFIG.STORAGE.KEYS.OFFLINE_DATA);
            
            console.log('✅ Cleared old storage data');
        } catch (error) {
            console.error('Failed to clear storage data:', error);
        }
    }

    /**
     * ストレージ使用量を取得
     * @returns {Object} 使用量情報
     */
    getStorageUsage() {
        let totalSize = 0;
        const details = {};
        
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const size = new Blob([localStorage[key]]).size;
                totalSize += size;
                details[key] = size;
            }
        }
        
        return {
            total: totalSize,
            totalMB: (totalSize / 1048576).toFixed(2),
            details,
            quota: 'storage' in navigator && 'estimate' in navigator.storage
                ? navigator.storage.estimate()
                : null
        };
    }

    /**
     * ディープマージ
     * @param {Object} target - ターゲット
     * @param {Object} source - ソース
     * @returns {Object} マージされたオブジェクト
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * エクスポート（JSON、拡張版）
     * @param {Object} options - オプション
     * @returns {string} JSON文字列
     */
    export(options = {}) {
        const {
            includeHistory = true,
            includeStatistics = true,
            includeCache = false,
            pretty = true
        } = options;
        
        const exportData = {
            version: this.state.system.version,
            exportedAt: new Date().toISOString(),
            user: this.state.user
        };
        
        if (includeHistory) {
            exportData.history = this.state.history;
        }
        
        if (includeStatistics) {
            exportData.statistics = this.state.statistics;
        }
        
        if (includeCache) {
            exportData.cache = {
                shelters: this.state.cache.shelters,
                routes: this.state.cache.routes
            };
        }
        
        return JSON.stringify(exportData, null, pretty ? 2 : 0);
    }

    /**
     * インポート（JSON、拡張版）
     * @param {string} json - JSON文字列
     * @param {Object} options - オプション
     * @returns {boolean} 成功したか
     */
    import(json, options = {}) {
        const {
            merge = false,
            validate = true
        } = options;
        
        try {
            const data = JSON.parse(json);
            
            // バージョンチェック
            if (validate && data.version !== this.state.system.version) {
                console.warn('Version mismatch:', data.version, 'vs', this.state.system.version);
            }
            
            if (merge) {
                // マージモード
                if (data.user) {
                    this.state.user = this.deepMerge(this.state.user, data.user);
                }
                if (data.history) {
                    this.state.history = this.deepMerge(this.state.history, data.history);
                }
                if (data.statistics) {
                    this.state.statistics = this.deepMerge(this.state.statistics, data.statistics);
                }
            } else {
                // 上書きモード
                if (data.user) this.state.user = data.user;
                if (data.history) this.state.history = data.history;
                if (data.statistics) this.state.statistics = data.statistics;
            }
            
            this.notify('*', this.state);
            this.saveToStorage();
            
            console.log('✅ Import successful');
            return true;
            
        } catch (error) {
            console.error('❌ Import error:', error);
            return false;
        }
    }

    /**
     * すべてのデータをクリア（拡張版）
     * @param {Object} options - オプション
     */
    clearAll(options = {}) {
        const {
            keepUserSettings = false,
            keepFavorites = false,
            clearStorage = true
        } = options;
        
        const userBackup = keepUserSettings ? { ...this.state.user } : null;
        const favoritesBackup = keepFavorites ? [...this.state.history.favorites] : null;
        
        // 状態をリセット
        this.state = {
            realtime: {
                earthquakes: [],
                eew: null,
                tsunami: [],
                intensity: new Map(),
                lastUpdate: null,
                connectionStatus: 'connecting',
                dataQuality: 100,
                latency: 0
            },
            history: {
                earthquakes: [],
                significant: [],
                recent: [],
                favorites: favoritesBackup || [],
                viewed: [],
                bookmarks: [],
                searches: []
            },
            statistics: {
                daily: {},
                weekly: {},
                monthly: {},
                yearly: {},
                byRegion: {},
                byMagnitude: {},
                byDepth: {},
                byIntensity: {},
                trends: {
                    increasing: false,
                    averageMagnitude: 0,
                    totalCount: 0,
                    significantCount: 0
                },
                correlations: {
                    magnitudeDepth: 0,
                    regionFrequency: {}
                }
            },
            user: userBackup || { ...this.state.user },
            ui: { ...this.state.ui },
            cache: {
                shelters: [],
                routes: {},
                geocoded: {},
                apiResponses: new Map(),
                computedData: new Map(),
                images: new Map()
            },
            system: { ...this.state.system }
        };
        
        // ストレージをクリア
        if (clearStorage) {
            if (!keepUserSettings) {
                localStorage.clear();
            } else {
                // ユーザー設定以外をクリア
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key !== CONFIG.STORAGE.KEYS.USER_SETTINGS) {
                        localStorage.removeItem(key);
                    }
                });
            }
        }
        
        this.notify('*', this.state);
        console.log('✅ All data cleared');
    }

    /**
     * ネストされた値を取得
     * @param {Object} obj - オブジェクト
     * @param {string} path - パス
     * @returns {any} 値
     */
    getNestedValue(obj, path) {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }
            current = current[part];
        }
        
        return current;
    }

    /**
     * ネストされた値を設定
     * @param {Object} obj - オブジェクト
     * @param {string} path - パス
     * @param {any} value - 値
     */
    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        let current = obj;
        
        for (const part of parts) {
            if (!(part in current)) {
                current[part] = {};
            }
            current = current[part];
        }
        
        current[last] = value;
    }

    /**
     * デバッグ情報を取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            system: this.state.system,
            listenerCount: this.getListenerCount(),
            historySize: this.history.length,
            storageUsage: this.getStorageUsage(),
            earthquakeCount: this.get('realtime.earthquakes').length,
            statisticsSummary: this.getStatisticsSummary(),
            performance: this.state.system.performance
        };
    }
}

// シングルトンインスタンス
const dataStore = new DataStore();

if (typeof window !== 'undefined') {
    window.DataStore = DataStore;
    window.dataStore = dataStore;
    
    // デバッグ用
    if (CONFIG.DEBUG.ENABLED) {
        window.debugDataStore = () => console.log(dataStore.getDebugInfo());
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataStore;
}
