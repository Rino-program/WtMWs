/**
 * APIサービス - P2P地震情報API
 * リアルタイムの地震情報を取得
 */

class P2PEarthquakeService {
    constructor() {
        this.baseUrl = CONFIG.API.P2P_EARTHQUAKE.BASE_URL;
        this.endpoints = CONFIG.API.P2P_EARTHQUAKE.ENDPOINTS;
        this.cache = new Map();
        this.lastFetchTime = 0;
        this.isPolling = false;
        this.pollingInterval = null;
    }

    /**
     * 地震履歴を取得
     * @param {Object} options - オプション
     * @returns {Promise<Array>} 地震データの配列
     */
    async getEarthquakeHistory(options = {}) {
        const { limit = 100, offset = 0, type = 'all' } = options;
        
        try {
            const cacheKey = `history_${limit}_${offset}_${type}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const url = `${this.baseUrl}${this.endpoints.HISTORY}?limit=${limit}&offset=${offset}`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();

            // データの型でフィルタリング
            let filtered = data;
            if (type !== 'all') {
                filtered = data.filter(item => {
                    switch(type) {
                        case 'earthquake':
                            return item.code === 551 || item.code === 552;
                        case 'tsunami':
                            return item.code === 552;
                        case 'eew':
                            return item.code === 556;
                        default:
                            return true;
                    }
                });
            }

            this.setCache(cacheKey, filtered);
            return filtered;
        } catch (error) {
            console.error('地震履歴の取得エラー:', error);
            throw new Error(CONFIG.ERROR.MESSAGES.API_ERROR);
        }
    }

    /**
     * 最新の地震情報を取得
     * @returns {Promise<Object|null>} 最新の地震データ
     */
    async getLatestEarthquake() {
        try {
            const history = await this.getEarthquakeHistory({ limit: 1 });
            return history.length > 0 ? history[0] : null;
        } catch (error) {
            console.error('最新地震情報の取得エラー:', error);
            return null;
        }
    }

    /**
     * 緊急地震速報を取得
     * @returns {Promise<Array>} 緊急地震速報の配列
     */
    async getEEW() {
        try {
            const history = await this.getEarthquakeHistory({ limit: 50 });
            return history.filter(item => item.code === 556);
        } catch (error) {
            console.error('緊急地震速報の取得エラー:', error);
            return [];
        }
    }

    /**
     * 地震詳細情報を取得
     * @param {string} id - 地震ID
     * @returns {Promise<Object>} 地震詳細データ
     */
    async getEarthquakeDetail(id) {
        try {
            const cacheKey = `detail_${id}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const history = await this.getEarthquakeHistory({ limit: 100 });
            const detail = history.find(item => item.id === id);
            
            if (detail) {
                this.setCache(cacheKey, detail);
                return detail;
            }
            
            throw new Error('地震情報が見つかりません');
        } catch (error) {
            console.error('地震詳細の取得エラー:', error);
            throw error;
        }
    }

    /**
     * 津波情報を取得
     * @returns {Promise<Array>} 津波情報の配列
     */
    async getTsunamiInfo() {
        try {
            const history = await this.getEarthquakeHistory({ limit: 50 });
            return history.filter(item => 
                item.code === 552 && item.tsunami && item.tsunami.grade !== 'None'
            );
        } catch (error) {
            console.error('津波情報の取得エラー:', error);
            return [];
        }
    }

    /**
     * エリアピア情報を取得
     * @returns {Promise<Object>} エリアごとのピア数
     */
    async getAreaPeers() {
        try {
            const url = `${this.baseUrl}${this.endpoints.AREA_PEER}`;
            const response = await this.fetchWithRetry(url);
            return await response.json();
        } catch (error) {
            console.error('エリアピア情報の取得エラー:', error);
            return {};
        }
    }

    /**
     * 指定期間の地震を取得
     * @param {Date} startDate - 開始日時
     * @param {Date} endDate - 終了日時
     * @returns {Promise<Array>} 地震データの配列
     */
    async getEarthquakesByDateRange(startDate, endDate) {
        try {
            const history = await this.getEarthquakeHistory({ limit: 500 });
            return history.filter(item => {
                const itemDate = new Date(item.time || item.earthquake?.time);
                return itemDate >= startDate && itemDate <= endDate;
            });
        } catch (error) {
            console.error('期間指定地震取得エラー:', error);
            return [];
        }
    }

    /**
     * マグニチュードでフィルタリング
     * @param {number} minMagnitude - 最小マグニチュード
     * @param {number} maxMagnitude - 最大マグニチュード
     * @returns {Promise<Array>} フィルタリングされた地震データ
     */
    async getEarthquakesByMagnitude(minMagnitude, maxMagnitude = 10) {
        try {
            const history = await this.getEarthquakeHistory({ limit: 500 });
            return history.filter(item => {
                const mag = item.earthquake?.hypocenter?.magnitude;
                return mag && mag >= minMagnitude && mag <= maxMagnitude;
            });
        } catch (error) {
            console.error('マグニチュードフィルタリングエラー:', error);
            return [];
        }
    }

    /**
     * 震度でフィルタリング
     * @param {string} minIntensity - 最小震度
     * @returns {Promise<Array>} フィルタリングされた地震データ
     */
    async getEarthquakesByIntensity(minIntensity) {
        try {
            const history = await this.getEarthquakeHistory({ limit: 500 });
            const intensityLevels = CONFIG.INTENSITY.LEVELS;
            const minIndex = intensityLevels.indexOf(minIntensity);
            
            return history.filter(item => {
                const maxInt = item.earthquake?.maxScale;
                if (!maxInt) return false;
                
                const maxIndex = intensityLevels.indexOf(String(maxInt).replace('弱', '-').replace('強', '+'));
                return maxIndex >= minIndex;
            });
        } catch (error) {
            console.error('震度フィルタリングエラー:', error);
            return [];
        }
    }

    /**
     * リアルタイム監視を開始
     * @param {Function} callback - 新しい地震が検出されたときのコールバック
     */
    startPolling(callback) {
        if (this.isPolling) return;

        this.isPolling = true;
        let lastId = null;

        this.pollingInterval = setInterval(async () => {
            try {
                const latest = await this.getLatestEarthquake();
                if (latest && latest.id !== lastId) {
                    lastId = latest.id;
                    callback(latest);
                }
            } catch (error) {
                console.error('ポーリングエラー:', error);
            }
        }, CONFIG.API.P2P_EARTHQUAKE.POLLING_INTERVAL);
    }

    /**
     * リアルタイム監視を停止
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }

    /**
     * リトライ付きフェッチ
     * @param {string} url - URL
     * @param {number} retries - リトライ回数
     * @returns {Promise<Response>} レスポンス
     */
    async fetchWithRetry(url, retries = CONFIG.ERROR.RETRY_ATTEMPTS) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.ERROR.TIMEOUT);

                const response = await fetch(url, {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response;
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, CONFIG.ERROR.RETRY_DELAY * (i + 1)));
            }
        }
    }

    /**
     * キャッシュから取得
     * @param {string} key - キャッシュキー
     * @returns {any|null} キャッシュされたデータ
     */
    getFromCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;

        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > CONFIG.CACHE.TTL.EARTHQUAKE_DATA) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    /**
     * キャッシュに保存
     * @param {string} key - キャッシュキー
     * @param {any} data - データ
     */
    setCache(key, data) {
        if (!CONFIG.CACHE.ENABLED) return;

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    /**
     * キャッシュをクリア
     */
    clearCache() {
        this.cache.clear();
    }
}

// シングルトンインスタンス
const p2pEarthquakeService = new P2PEarthquakeService();

if (typeof window !== 'undefined') {
    window.P2PEarthquakeService = P2PEarthquakeService;
    window.p2pEarthquakeService = p2pEarthquakeService;
}
