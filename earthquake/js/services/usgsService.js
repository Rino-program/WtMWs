/**
 * APIサービス - USGS地震データAPI（拡張版）
 * 世界の地震情報を取得・分析
 * - リアルタイム世界地震監視
 * - 地震ネットワーク統合
 * - 日本データとのクロスリファレンス
 * - グローバル統計と分析
 * - 歴史的地震データベース
 * - マグニチュード変換
 * - プレート境界分析
 * @version 2.0
 */

class USGSService {
    constructor() {
        this.baseUrl = CONFIG.API.USGS.BASE_URL;
        this.endpoints = CONFIG.API.USGS.ENDPOINTS;
        this.cache = new Map();
        
        // 拡張機能
        this.globalEarthquakes = [];
        this.significantEvents = [];
        this.earthquakeNetworks = new Map();
        this.crossReferences = new Map();
        this.historicalData = new Map();
        this.subscribers = new Map();
        this.isPolling = false;
        this.pollingInterval = null;
        
        // 統計情報
        this.statistics = {
            total: 0,
            byMagnitude: { m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0 },
            byRegion: new Map(),
            byDepth: { shallow: 0, intermediate: 0, deep: 0 },
            byPlate: new Map(),
            averageMagnitude: 0,
            largestMagnitude: 0,
            deepestEarthquake: 0,
            lastUpdate: null
        };
        
        // プレート境界データ（主要なもの）
        this.plateBoundaries = {
            'Pacific Ring of Fire': {
                regions: ['Japan', 'Philippines', 'Indonesia', 'Chile', 'Alaska'],
                type: 'convergent',
                activity: 'very high'
            },
            'Mid-Atlantic Ridge': {
                regions: ['Iceland', 'Azores'],
                type: 'divergent',
                activity: 'moderate'
            },
            'Himalayas': {
                regions: ['Nepal', 'India', 'Tibet'],
                type: 'convergent',
                activity: 'high'
            },
            'San Andreas Fault': {
                regions: ['California'],
                type: 'transform',
                activity: 'high'
            }
        };
        
        // マグニチュードスケール変換係数
        this.magnitudeScales = {
            ML: { name: 'Local (Richter)', conversion: (m) => m },
            Mw: { name: 'Moment', conversion: (m) => m },
            Ms: { name: 'Surface Wave', conversion: (m) => m * 0.95 },
            mb: { name: 'Body Wave', conversion: (m) => m * 1.1 },
            Md: { name: 'Duration', conversion: (m) => m * 0.9 }
        };
        
        // 設定
        this.config = {
            pollingInterval: 60000, // 1分
            cacheEnabled: true,
            cacheTTL: 300000, // 5分
            maxRetries: 3,
            timeout: 15000,
            significantMagnitude: 6.0,
            crossReferenceDistance: 100, // km
            crossReferenceTimeWindow: 300 // 5分（秒）
        };
        
        console.log('🌍 USGSService initialized');
    }

    /**
     * サービスの初期化
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Initializing USGSService...');
        
        try {
            // 初期データの取得
            await this.loadInitialData();
            
            // 地震ネットワーク情報の取得
            await this.loadNetworkInfo();
            
            // 統計の計算
            this.calculateStatistics();
            
            console.log('  ✓ USGSService ready');
            
        } catch (error) {
            console.error('❌ USGSService initialization failed:', error);
            throw error;
        }
    }

    /**
     * 初期データの読み込み
     */
    async loadInitialData() {
        try {
            // 最近24時間のM4.5以上の地震
            const recent = await this.getRecentEarthquakes('day', 4.5);
            
            if (recent && recent.features) {
                this.globalEarthquakes = recent.features.map(f => 
                    this.parseUSGSFeature(f)
                );
                
                // 重要な地震を抽出
                this.significantEvents = this.globalEarthquakes.filter(eq => 
                    eq.magnitude >= this.config.significantMagnitude
                );
                
                console.log(`  ✓ Loaded ${this.globalEarthquakes.length} global earthquakes (${this.significantEvents.length} significant)`);
            }
            
        } catch (error) {
            console.error('Failed to load initial USGS data:', error);
        }
    }

    /**
     * ネットワーク情報の読み込み
     */
    async loadNetworkInfo() {
        // USGS地震観測ネットワーク
        const networks = [
            { code: 'us', name: 'USGS National Earthquake Information Center', coverage: 'Global' },
            { code: 'ci', name: 'California Integrated Seismic Network', coverage: 'California' },
            { code: 'nc', name: 'Northern California Seismic System', coverage: 'Northern California' },
            { code: 'ak', name: 'Alaska Earthquake Center', coverage: 'Alaska' },
            { code: 'nn', name: 'Nevada Seismological Laboratory', coverage: 'Nevada' },
            { code: 'uw', name: 'Pacific Northwest Seismic Network', coverage: 'Washington/Oregon' },
            { code: 'hv', name: 'Hawaiian Volcano Observatory', coverage: 'Hawaii' },
            { code: 'pr', name: 'Puerto Rico Seismic Network', coverage: 'Puerto Rico' }
        ];
        
        networks.forEach(network => {
            this.earthquakeNetworks.set(network.code, network);
        });
        
        console.log(`  ✓ Loaded ${networks.length} seismic networks`);
    }

    /**
     * USGSフィーチャーのパース
     * @param {Object} feature - GeoJSONフィーチャー
     * @returns {Object} パース済みデータ
     */
    parseUSGSFeature(feature) {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;
        
        return {
            id: feature.id,
            time: new Date(props.time).toISOString(),
            magnitude: props.mag,
            magnitudeType: props.magType,
            depth: coords[2], // km
            latitude: coords[1],
            longitude: coords[0],
            region: props.place || 'Unknown',
            title: props.title,
            status: props.status,
            tsunami: props.tsunami === 1,
            significance: props.sig,
            felt: props.felt,
            cdi: props.cdi, // Community Decimal Intensity
            mmi: props.mmi, // Modified Mercalli Intensity
            alert: props.alert,
            network: props.net,
            sources: props.sources,
            types: props.types,
            nst: props.nst, // Number of seismic stations
            dmin: props.dmin, // Distance to nearest station
            rms: props.rms, // Root mean square
            gap: props.gap, // Azimuthal gap
            url: props.url,
            detailUrl: props.detail,
            source: 'USGS',
            raw: feature
        };
    }

    /**
     * 地震データを検索（拡張版）
     * @param {Object} params - 検索パラメータ
     * @returns {Promise<Object>} 地震データ
     */
    async searchEarthquakes(params = {}) {
        const {
            starttime = null,
            endtime = null,
            minmagnitude = null,
            maxmagnitude = null,
            minlatitude = null,
            maxlatitude = null,
            minlongitude = null,
            maxlongitude = null,
            latitude = null,
            longitude = null,
            maxradiuskm = null,
            mindepth = null,
            maxdepth = null,
            limit = 100,
            orderby = 'time',
            eventtype = 'earthquake',
            alertlevel = null,
            includeAllMagnitudes = false,
            includeAllOrigins = false,
            includeDeleted = false
        } = params;

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('format', 'geojson');
            queryParams.append('orderby', orderby);
            queryParams.append('limit', limit);
            queryParams.append('eventtype', eventtype);

            if (starttime) queryParams.append('starttime', starttime);
            if (endtime) queryParams.append('endtime', endtime);
            if (minmagnitude !== null) queryParams.append('minmagnitude', minmagnitude);
            if (maxmagnitude !== null) queryParams.append('maxmagnitude', maxmagnitude);
            if (minlatitude !== null) queryParams.append('minlatitude', minlatitude);
            if (maxlatitude !== null) queryParams.append('maxlatitude', maxlatitude);
            if (minlongitude !== null) queryParams.append('minlongitude', minlongitude);
            if (maxlongitude !== null) queryParams.append('maxlongitude', maxlongitude);
            if (mindepth !== null) queryParams.append('mindepth', mindepth);
            if (maxdepth !== null) queryParams.append('maxdepth', maxdepth);
            if (alertlevel) queryParams.append('alertlevel', alertlevel);
            
            if (latitude !== null && longitude !== null && maxradiuskm !== null) {
                queryParams.append('latitude', latitude);
                queryParams.append('longitude', longitude);
                queryParams.append('maxradiuskm', maxradiuskm);
            }
            
            if (includeAllMagnitudes) queryParams.append('includeallmagnitudes', 'true');
            if (includeAllOrigins) queryParams.append('includeallorigins', 'true');
            if (includeDeleted) queryParams.append('includedeleted', 'true');

            const cacheKey = `search_${queryParams.toString()}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('  ℹ️ Returning cached USGS data');
                return cached;
            }

            const url = `${this.baseUrl}${this.endpoints.QUERY}?${queryParams.toString()}`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            // メタデータを追加
            data.metadata.queryParams = params;
            data.metadata.requestTime = new Date().toISOString();

            this.setCache(cacheKey, data);
            
            console.log(`  ✓ Retrieved ${data.features?.length || 0} earthquakes from USGS`);
            
            return data;
            
        } catch (error) {
            console.error('USGS地震検索エラー:', error);
            throw error;
        }
    }

    /**
     * 日本データとのクロスリファレンス
     * @param {Object} japanEarthquake - 日本の地震データ
     * @param {Object} options - オプション
     * @returns {Promise<Object|null>} マッチしたUSGSデータ
     */
    async crossReferenceWithJapan(japanEarthquake, options = {}) {
        const {
            distanceThreshold = this.config.crossReferenceDistance,
            timeWindowSeconds = this.config.crossReferenceTimeWindow,
            magnitudeTolerance = 0.5
        } = options;
        
        try {
            const { latitude, longitude, time, magnitude } = japanEarthquake;
            
            // 時間範囲を計算
            const earthquakeTime = new Date(time);
            const starttime = new Date(earthquakeTime.getTime() - timeWindowSeconds * 1000);
            const endtime = new Date(earthquakeTime.getTime() + timeWindowSeconds * 1000);
            
            // USGS APIで近くの地震を検索
            const result = await this.searchEarthquakes({
                latitude,
                longitude,
                maxradiuskm: distanceThreshold,
                starttime: starttime.toISOString(),
                endtime: endtime.toISOString(),
                minmagnitude: Math.max(0, magnitude - magnitudeTolerance),
                maxmagnitude: magnitude + magnitudeTolerance,
                limit: 10
            });
            
            if (!result.features || result.features.length === 0) {
                return null;
            }
            
            // 最も近いものを探す
            let bestMatch = null;
            let bestScore = 0;
            
            result.features.forEach(feature => {
                const usgsEq = this.parseUSGSFeature(feature);
                
                // マッチングスコアを計算
                const score = this.calculateMatchScore(japanEarthquake, usgsEq);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = usgsEq;
                }
            });
            
            // スコアが十分高い場合のみ返す
            if (bestScore > 0.7) {
                // クロスリファレンスを記録
                this.recordCrossReference(japanEarthquake, bestMatch, bestScore);
                
                console.log(`  ✓ Cross-referenced: Japan EQ ${japanEarthquake.id} ↔ USGS EQ ${bestMatch.id} (score: ${bestScore.toFixed(2)})`);
                
                return {
                    usgsData: bestMatch,
                    matchScore: bestScore,
                    comparison: this.compareEarthquakes(japanEarthquake, bestMatch)
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Cross-reference error:', error);
            return null;
        }
    }

    /**
     * マッチングスコアの計算
     * @param {Object} eq1 - 地震1
     * @param {Object} eq2 - 地震2
     * @returns {number} スコア (0-1)
     */
    calculateMatchScore(eq1, eq2) {
        let score = 0;
        
        // 時間の近さ (40%)
        const timeDiff = Math.abs(new Date(eq1.time) - new Date(eq2.time)) / 1000; // 秒
        const timeScore = Math.max(0, 1 - timeDiff / this.config.crossReferenceTimeWindow);
        score += timeScore * 0.4;
        
        // 位置の近さ (40%)
        const distance = this.calculateDistance(
            { lat: eq1.latitude, lon: eq1.longitude },
            { lat: eq2.latitude, lon: eq2.longitude }
        );
        const distanceScore = Math.max(0, 1 - distance / this.config.crossReferenceDistance);
        score += distanceScore * 0.4;
        
        // マグニチュードの近さ (20%)
        const magDiff = Math.abs(eq1.magnitude - eq2.magnitude);
        const magScore = Math.max(0, 1 - magDiff / 2);
        score += magScore * 0.2;
        
        return score;
    }

    /**
     * 2つの地震データの比較
     * @param {Object} japanEq - 日本の地震データ
     * @param {Object} usgsEq - USGSの地震データ
     * @returns {Object} 比較結果
     */
    compareEarthquakes(japanEq, usgsEq) {
        return {
            time: {
                japan: japanEq.time,
                usgs: usgsEq.time,
                difference: Math.abs(new Date(japanEq.time) - new Date(usgsEq.time)) / 1000 // 秒
            },
            magnitude: {
                japan: japanEq.magnitude,
                usgs: usgsEq.magnitude,
                difference: Math.abs(japanEq.magnitude - usgsEq.magnitude),
                usgsType: usgsEq.magnitudeType
            },
            location: {
                japan: { lat: japanEq.latitude, lon: japanEq.longitude },
                usgs: { lat: usgsEq.latitude, lon: usgsEq.longitude },
                distance: this.calculateDistance(
                    { lat: japanEq.latitude, lon: japanEq.longitude },
                    { lat: usgsEq.latitude, lon: usgsEq.longitude }
                )
            },
            depth: {
                japan: japanEq.depth,
                usgs: usgsEq.depth,
                difference: Math.abs(japanEq.depth - usgsEq.depth)
            },
            region: {
                japan: japanEq.region,
                usgs: usgsEq.region
            },
            sources: {
                japan: ['JMA', 'P2P'],
                usgs: usgsEq.sources ? usgsEq.sources.split(',') : ['us']
            },
            quality: {
                japanIntensity: japanEq.maxIntensity,
                usgsStations: usgsEq.nst,
                usgsGap: usgsEq.gap,
                usgsRMS: usgsEq.rms
            }
        };
    }

    /**
     * クロスリファレンスの記録
     * @param {Object} japanEq - 日本の地震
     * @param {Object} usgsEq - USGS地震
     * @param {number} score - マッチングスコア
     */
    recordCrossReference(japanEq, usgsEq, score) {
        const key = `${japanEq.id}-${usgsEq.id}`;
        
        this.crossReferences.set(key, {
            japanId: japanEq.id,
            usgsId: usgsEq.id,
            score,
            timestamp: new Date().toISOString(),
            comparison: this.compareEarthquakes(japanEq, usgsEq)
        });
    }

    /**
     * グローバル地震活動の分析
     * @param {Object} options - オプション
     * @returns {Object} 分析結果
     */
    async analyzeGlobalActivity(options = {}) {
        const {
            timeRange = 'week',
            minMagnitude = 4.5,
            includeRegionalBreakdown = true,
            includePlateAnalysis = true,
            includeComparison = true
        } = options;
        
        try {
            // データ取得
            const data = await this.getRecentEarthquakes(timeRange, minMagnitude);
            
            if (!data.features) {
                return null;
            }
            
            const earthquakes = data.features.map(f => this.parseUSGSFeature(f));
            
            const analysis = {
                period: timeRange,
                total: earthquakes.length,
                timeRange: {
                    start: data.metadata.generated ? new Date(data.metadata.generated - this.getTimeRangeMs(timeRange)) : null,
                    end: data.metadata.generated ? new Date(data.metadata.generated) : null
                },
                magnitude: this.analyzeMagnitudeDistribution(earthquakes),
                depth: this.analyzeDepthDistribution(earthquakes),
                temporal: this.analyzeTemporalPattern(earthquakes),
                significant: earthquakes.filter(eq => eq.magnitude >= 6.0)
            };
            
            // 地域別内訳
            if (includeRegionalBreakdown) {
                analysis.regional = this.analyzeRegionalDistribution(earthquakes);
            }
            
            // プレート分析
            if (includePlateAnalysis) {
                analysis.plateActivity = this.analyzePlateActivity(earthquakes);
            }
            
            // 比較分析
            if (includeComparison) {
                analysis.comparison = await this.compareWithHistorical(earthquakes, timeRange);
            }
            
            return analysis;
            
        } catch (error) {
            console.error('Global activity analysis error:', error);
            return null;
        }
    }

    /**
     * マグニチュード分布の分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 分布データ
     */
    analyzeMagnitudeDistribution(earthquakes) {
        const distribution = { m2: 0, m3: 0, m4: 0, m5: 0, m6: 0, m7: 0, m8: 0 };
        let sum = 0;
        let max = 0;
        
        earthquakes.forEach(eq => {
            const mag = eq.magnitude;
            sum += mag;
            if (mag > max) max = mag;
            
            if (mag >= 8) distribution.m8++;
            else if (mag >= 7) distribution.m7++;
            else if (mag >= 6) distribution.m6++;
            else if (mag >= 5) distribution.m5++;
            else if (mag >= 4) distribution.m4++;
            else if (mag >= 3) distribution.m3++;
            else distribution.m2++;
        });
        
        return {
            distribution,
            average: earthquakes.length > 0 ? sum / earthquakes.length : 0,
            maximum: max,
            median: this.calculateMedian(earthquakes.map(eq => eq.magnitude))
        };
    }

    /**
     * 深さ分布の分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 分布データ
     */
    analyzeDepthDistribution(earthquakes) {
        const distribution = { shallow: 0, intermediate: 0, deep: 0 };
        let sum = 0;
        let max = 0;
        
        earthquakes.forEach(eq => {
            const depth = eq.depth;
            sum += depth;
            if (depth > max) max = depth;
            
            if (depth < 70) distribution.shallow++;
            else if (depth < 300) distribution.intermediate++;
            else distribution.deep++;
        });
        
        return {
            distribution,
            average: earthquakes.length > 0 ? sum / earthquakes.length : 0,
            maximum: max,
            percentages: {
                shallow: earthquakes.length > 0 ? (distribution.shallow / earthquakes.length * 100).toFixed(1) : 0,
                intermediate: earthquakes.length > 0 ? (distribution.intermediate / earthquakes.length * 100).toFixed(1) : 0,
                deep: earthquakes.length > 0 ? (distribution.deep / earthquakes.length * 100).toFixed(1) : 0
            }
        };
    }

    /**
     * 時間的パターンの分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} パターンデータ
     */
    analyzeTemporalPattern(earthquakes) {
        // 時間ごとの地震数
        const hourly = new Array(24).fill(0);
        const daily = new Map();
        
        earthquakes.forEach(eq => {
            const date = new Date(eq.time);
            const hour = date.getHours();
            const day = date.toISOString().split('T')[0];
            
            hourly[hour]++;
            daily.set(day, (daily.get(day) || 0) + 1);
        });
        
        // ピーク時間帯
        const peakHour = hourly.indexOf(Math.max(...hourly));
        
        // トレンド
        const dailyArray = Array.from(daily.values());
        const trend = this.calculateTrend(dailyArray);
        
        return {
            hourlyDistribution: hourly,
            peakHour,
            dailyCount: Array.from(daily.entries()).map(([date, count]) => ({ date, count })),
            trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
            trendValue: trend
        };
    }

    /**
     * 地域別分布の分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 地域データ
     */
    analyzeRegionalDistribution(earthquakes) {
        const regions = new Map();
        
        earthquakes.forEach(eq => {
            const region = this.categorizeRegion(eq);
            
            if (!regions.has(region)) {
                regions.set(region, {
                    count: 0,
                    magnitudes: [],
                    depths: [],
                    maxMagnitude: 0
                });
            }
            
            const data = regions.get(region);
            data.count++;
            data.magnitudes.push(eq.magnitude);
            data.depths.push(eq.depth);
            if (eq.magnitude > data.maxMagnitude) {
                data.maxMagnitude = eq.magnitude;
            }
        });
        
        // 統計を計算
        const regional = {};
        regions.forEach((data, region) => {
            regional[region] = {
                count: data.count,
                averageMagnitude: data.magnitudes.reduce((a, b) => a + b, 0) / data.count,
                maxMagnitude: data.maxMagnitude,
                averageDepth: data.depths.reduce((a, b) => a + b, 0) / data.count
            };
        });
        
        return regional;
    }

    /**
     * プレート活動の分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} プレート活動データ
     */
    analyzePlateActivity(earthquakes) {
        const plateActivity = {};
        
        Object.keys(this.plateBoundaries).forEach(plate => {
            plateActivity[plate] = {
                count: 0,
                magnitudes: [],
                averageMagnitude: 0,
                maxMagnitude: 0,
                type: this.plateBoundaries[plate].type,
                expectedActivity: this.plateBoundaries[plate].activity
            };
        });
        
        earthquakes.forEach(eq => {
            const plate = this.identifyPlateBoundary(eq);
            if (plate && plateActivity[plate]) {
                plateActivity[plate].count++;
                plateActivity[plate].magnitudes.push(eq.magnitude);
                if (eq.magnitude > plateActivity[plate].maxMagnitude) {
                    plateActivity[plate].maxMagnitude = eq.magnitude;
                }
            }
        });
        
        // 平均を計算
        Object.keys(plateActivity).forEach(plate => {
            const data = plateActivity[plate];
            if (data.count > 0) {
                data.averageMagnitude = data.magnitudes.reduce((a, b) => a + b, 0) / data.count;
            }
        });
        
        return plateActivity;
    }

    /**
     * 最近の地震を取得（拡張版）
     * @param {string} timeRange - 時間範囲 ('hour', 'day', 'week', 'month')
     * @param {number} minMagnitude - 最小マグニチュード
     * @param {Object} options - 追加オプション
     * @returns {Promise<Object>} 地震データ
     */
    async getRecentEarthquakes(timeRange = 'day', minMagnitude = 2.5, options = {}) {
        const now = new Date();
        let starttime = new Date();

        switch(timeRange) {
            case 'hour':
                starttime.setHours(now.getHours() - 1);
                break;
            case 'day':
                starttime.setDate(now.getDate() - 1);
                break;
            case 'week':
                starttime.setDate(now.getDate() - 7);
                break;
            case 'month':
                starttime.setMonth(now.getMonth() - 1);
                break;
            default:
                starttime.setDate(now.getDate() - 1);
        }

        return await this.searchEarthquakes({
            starttime: starttime.toISOString(),
            endtime: now.toISOString(),
            minmagnitude: minMagnitude,
            orderby: options.orderby || 'time-asc',
            limit: options.limit || 100,
            ...options
        });
    }

    /**
     * 歴史的データとの比較
     * @param {Array} currentEarthquakes - 現在の地震データ
     * @param {string} timeRange - 期間
     * @returns {Promise<Object>} 比較結果
     */
    async compareWithHistorical(currentEarthquakes, timeRange) {
        const historicalKey = `historical_${timeRange}`;
        let historical = this.historicalData.get(historicalKey);
        
        if (!historical) {
            // 過去の同期間データを取得（1年前）
            const now = new Date();
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            
            const rangeMs = this.getTimeRangeMs(timeRange);
            const starttime = new Date(oneYearAgo.getTime() - rangeMs);
            
            try {
                const data = await this.searchEarthquakes({
                    starttime: starttime.toISOString(),
                    endtime: oneYearAgo.toISOString(),
                    minmagnitude: 4.5,
                    limit: 1000
                });
                
                historical = data.features ? data.features.map(f => this.parseUSGSFeature(f)) : [];
                this.historicalData.set(historicalKey, historical);
                
            } catch (error) {
                console.error('Failed to fetch historical data:', error);
                historical = [];
            }
        }
        
        if (historical.length === 0) {
            return null;
        }
        
        return {
            current: {
                count: currentEarthquakes.length,
                averageMagnitude: currentEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / currentEarthquakes.length,
                maxMagnitude: Math.max(...currentEarthquakes.map(eq => eq.magnitude))
            },
            historical: {
                count: historical.length,
                averageMagnitude: historical.reduce((sum, eq) => sum + eq.magnitude, 0) / historical.length,
                maxMagnitude: Math.max(...historical.map(eq => eq.magnitude))
            },
            comparison: {
                countChange: ((currentEarthquakes.length - historical.length) / historical.length * 100).toFixed(1),
                magnitudeChange: ((currentEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0) / currentEarthquakes.length) - 
                                 (historical.reduce((sum, eq) => sum + eq.magnitude, 0) / historical.length)).toFixed(2),
                trend: currentEarthquakes.length > historical.length ? 'increase' : 
                       currentEarthquakes.length < historical.length ? 'decrease' : 'stable'
            }
        };
    }

    /**
     * 地域の分類
     * @param {Object} earthquake - 地震データ
     * @returns {string} 地域名
     */
    categorizeRegion(earthquake) {
        const { latitude, longitude, region } = earthquake;
        
        // 主要地域の判定
        if (latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 154) {
            return 'Japan Region';
        } else if (latitude >= -10 && latitude <= 20 && longitude >= 95 && longitude <= 141) {
            return 'Southeast Asia';
        } else if (latitude >= 32 && latitude <= 42 && longitude >= -125 && longitude <= -114) {
            return 'California';
        } else if (latitude >= 51 && latitude <= 72 && longitude >= -180 && longitude <= -130) {
            return 'Alaska';
        } else if (latitude >= -56 && latitude <= -17 && longitude >= -76 && longitude <= -66) {
            return 'Chile';
        } else if (latitude >= 35 && latitude <= 42 && longitude >= 25 && longitude <= 45) {
            return 'Turkey/Greece';
        } else if (latitude >= 25 && latitude <= 40 && longitude >= 60 && longitude <= 80) {
            return 'Himalayas';
        } else if (latitude >= -20 && latitude <= -10 && longitude >= 160 && longitude <= 180) {
            return 'Vanuatu/Fiji';
        } else if (region.toLowerCase().includes('mid-atlantic')) {
            return 'Mid-Atlantic Ridge';
        } else if (latitude >= -60 && latitude <= -50) {
            return 'Southern Ocean';
        } else {
            return 'Other';
        }
    }

    /**
     * プレート境界の識別
     * @param {Object} earthquake - 地震データ
     * @returns {string|null} プレート境界名
     */
    identifyPlateBoundary(earthquake) {
        const { latitude, longitude, depth } = earthquake;
        
        // 環太平洋造山帯
        if ((latitude >= 24 && latitude <= 46 && longitude >= 122 && longitude <= 154) || // 日本
            (latitude >= -56 && latitude <= -17 && longitude >= -76 && longitude <= -66) || // チリ
            (latitude >= 51 && latitude <= 72 && longitude >= -180 && longitude <= -130) || // アラスカ
            (latitude >= -10 && latitude <= 20 && longitude >= 95 && longitude <= 141)) { // 東南アジア
            return 'Pacific Ring of Fire';
        }
        
        // 中央海嶺
        if ((latitude >= 0 && latitude <= 70 && longitude >= -40 && longitude <= -10) && depth < 50) {
            return 'Mid-Atlantic Ridge';
        }
        
        // ヒマラヤ
        if (latitude >= 25 && latitude <= 40 && longitude >= 60 && longitude <= 95) {
            return 'Himalayas';
        }
        
        // サンアンドレアス断層
        if (latitude >= 32 && latitude <= 42 && longitude >= -125 && longitude <= -114) {
            return 'San Andreas Fault';
        }
        
        return null;
    }

    /**
     * マグニチュードスケールの変換
     * @param {number} magnitude - マグニチュード
     * @param {string} fromScale - 変換元スケール
     * @param {string} toScale - 変換先スケール
     * @returns {number} 変換後のマグニチュード
     */
    convertMagnitudeScale(magnitude, fromScale, toScale) {
        if (fromScale === toScale) return magnitude;
        
        const from = this.magnitudeScales[fromScale];
        const to = this.magnitudeScales[toScale];
        
        if (!from || !to) {
            console.warn(`Unknown magnitude scale: ${fromScale} or ${toScale}`);
            return magnitude;
        }
        
        // 中間値としてMwに変換してから目的のスケールへ
        const mw = from.conversion(magnitude);
        return to.conversion(mw);
    }

    /**
     * 地震の重要度を評価
     * @param {Object} earthquake - 地震データ
     * @returns {Object} 重要度評価
     */
    assessSignificance(earthquake) {
        const { magnitude, depth, felt, tsunami, significance, cdi, mmi } = earthquake;
        
        let score = 0;
        const factors = [];
        
        // マグニチュードによる評価
        if (magnitude >= 8.0) {
            score += 100;
            factors.push('超巨大地震');
        } else if (magnitude >= 7.0) {
            score += 80;
            factors.push('巨大地震');
        } else if (magnitude >= 6.0) {
            score += 50;
            factors.push('大規模地震');
        } else if (magnitude >= 5.0) {
            score += 30;
            factors.push('中規模地震');
        }
        
        // 深さによる評価（浅いほど危険）
        if (depth < 30) {
            score += 30;
            factors.push('浅い震源');
        } else if (depth < 70) {
            score += 15;
            factors.push('やや浅い震源');
        }
        
        // 体感報告数
        if (felt) {
            if (felt > 10000) {
                score += 40;
                factors.push('広範囲で体感');
            } else if (felt > 1000) {
                score += 20;
                factors.push('多数の体感報告');
            } else if (felt > 100) {
                score += 10;
                factors.push('体感報告あり');
            }
        }
        
        // 津波
        if (tsunami) {
            score += 50;
            factors.push('津波の可能性');
        }
        
        // USGS significance score
        if (significance) {
            score += Math.min(50, significance / 10);
        }
        
        // 震度
        if (mmi && mmi >= 7) {
            score += 40;
            factors.push('強い揺れ');
        }
        
        // レベル判定
        let level;
        if (score >= 150) level = 'critical';
        else if (score >= 100) level = 'major';
        else if (score >= 50) level = 'significant';
        else if (score >= 20) level = 'notable';
        else level = 'minor';
        
        return {
            level,
            score,
            factors,
            requiresAlert: score >= 100
        };
    }

    /**
     * 統計の計算
     */
    calculateStatistics() {
        if (this.globalEarthquakes.length === 0) return;
        
        this.statistics.total = this.globalEarthquakes.length;
        
        // マグニチュード別
        this.globalEarthquakes.forEach(eq => {
            const mag = eq.magnitude;
            if (mag >= 8) this.statistics.byMagnitude.m8++;
            else if (mag >= 7) this.statistics.byMagnitude.m7++;
            else if (mag >= 6) this.statistics.byMagnitude.m6++;
            else if (mag >= 5) this.statistics.byMagnitude.m5++;
            else if (mag >= 4) this.statistics.byMagnitude.m4++;
            else if (mag >= 3) this.statistics.byMagnitude.m3++;
            else this.statistics.byMagnitude.m2++;
            
            // 深さ別
            if (eq.depth < 70) this.statistics.byDepth.shallow++;
            else if (eq.depth < 300) this.statistics.byDepth.intermediate++;
            else this.statistics.byDepth.deep++;
            
            // 最大値
            if (eq.magnitude > this.statistics.largestMagnitude) {
                this.statistics.largestMagnitude = eq.magnitude;
            }
            if (eq.depth > this.statistics.deepestEarthquake) {
                this.statistics.deepestEarthquake = eq.depth;
            }
        });
        
        // 平均マグニチュード
        const totalMag = this.globalEarthquakes.reduce((sum, eq) => sum + eq.magnitude, 0);
        this.statistics.averageMagnitude = totalMag / this.globalEarthquakes.length;
        
        this.statistics.lastUpdate = new Date().toISOString();
    }

    /**
     * リアルタイム監視の開始
     * @param {Function} callback - 更新時のコールバック
     */
    startPolling(callback) {
        if (this.isPolling) return;
        
        this.isPolling = true;
        
        const poll = async () => {
            try {
                const data = await this.getRecentEarthquakes('hour', 4.5);
                
                if (data && data.features) {
                    const newEarthquakes = data.features
                        .map(f => this.parseUSGSFeature(f))
                        .filter(eq => !this.globalEarthquakes.find(e => e.id === eq.id));
                    
                    if (newEarthquakes.length > 0) {
                        this.globalEarthquakes.unshift(...newEarthquakes);
                        
                        // 重要な地震をチェック
                        newEarthquakes.forEach(eq => {
                            if (eq.magnitude >= this.config.significantMagnitude) {
                                this.significantEvents.unshift(eq);
                            }
                        });
                        
                        // 統計更新
                        this.calculateStatistics();
                        
                        // コールバック実行
                        if (callback) {
                            callback(newEarthquakes);
                        }
                        
                        // サブスクライバーに通知
                        this.notify('new-earthquakes', newEarthquakes);
                        
                        console.log(`  ⭐ ${newEarthquakes.length} new global earthquake(s) detected`);
                    }
                }
                
            } catch (error) {
                console.error('USGS polling error:', error);
            }
        };
        
        // 初回実行
        poll();
        
        // 定期実行
        this.pollingInterval = setInterval(poll, this.config.pollingInterval);
        
        console.log('🌍 Started USGS polling');
    }

    /**
     * ポーリングの停止
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('🌍 Stopped USGS polling');
    }

    /**
     * サブスクライバーへの通知
     * @param {string} event - イベント名
     * @param {*} data - データ
     */
    notify(event, data) {
        const subscribers = this.subscribers.get(event) || [];
        subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in USGS subscriber for ${event}:`, error);
            }
        });
    }

    /**
     * イベントのサブスクライブ
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック
     * @returns {Function} アンサブスクライブ関数
     */
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
        
        return () => {
            const subscribers = this.subscribers.get(event);
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    /**
     * ユーティリティ: 距離計算
     * @param {Object} point1 - 地点1
     * @param {Object} point2 - 地点2
     * @returns {number} 距離（km）
     */
    calculateDistance(point1, point2) {
        const R = 6371;
        const dLat = this.toRadians(point2.lat - point1.lat);
        const dLon = this.toRadians(point2.lon - point1.lon);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(point1.lat)) * 
                  Math.cos(this.toRadians(point2.lat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * 度をラジアンに変換
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * 中央値の計算
     * @param {Array} values - 値の配列
     * @returns {number} 中央値
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;
        
        const sorted = values.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    }

    /**
     * トレンドの計算（簡易線形回帰）
     * @param {Array} values - 値の配列
     * @returns {number} 傾き
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        values.forEach((y, x) => {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    /**
     * 時間範囲をミリ秒に変換
     * @param {string} timeRange - 時間範囲
     * @returns {number} ミリ秒
     */
    getTimeRangeMs(timeRange) {
        switch(timeRange) {
            case 'hour': return 3600000;
            case 'day': return 86400000;
            case 'week': return 604800000;
            case 'month': return 2592000000;
            default: return 86400000;
        }
    }

    /**
     * 統計情報の取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        return {
            ...this.statistics,
            byRegionCount: this.statistics.byRegion.size,
            byPlateCount: this.statistics.byPlate.size,
            globalCount: this.globalEarthquakes.length,
            significantCount: this.significantEvents.length,
            crossReferencesCount: this.crossReferences.size
        };
    }

    /**
     * サービスのクリーンアップ
     */
    cleanup() {
        this.stopPolling();
        this.cache.clear();
        this.subscribers.clear();
        console.log('🌍 USGSService cleaned up');
    }

    /**
     * 特定地点周辺の地震を取得
     * @param {number} latitude - 緯度
     * @param {number} longitude - 経度
     * @param {number} radiusKm - 半径（km）
     * @param {Object} options - オプション
     * @returns {Promise<Object>} 地震データ
     */
    async getEarthquakesNearLocation(latitude, longitude, radiusKm = 500, options = {}) {
        return await this.searchEarthquakes({
            latitude,
            longitude,
            maxradiuskm: radiusKm,
            minmagnitude: options.minmagnitude || 2.5,
            starttime: options.starttime,
            endtime: options.endtime,
            limit: options.limit || 100
        });
    }

    /**
     * 大規模地震のみを取得
     * @param {number} minMagnitude - 最小マグニチュード（デフォルト: 6.0）
     * @param {number} days - 過去何日分（デフォルト: 30）
     * @returns {Promise<Object>} 地震データ
     */
    async getSignificantEarthquakes(minMagnitude = 6.0, days = 30) {
        const now = new Date();
        const starttime = new Date();
        starttime.setDate(now.getDate() - days);

        return await this.searchEarthquakes({
            starttime: starttime.toISOString(),
            endtime: now.toISOString(),
            minmagnitude: minMagnitude,
            orderby: 'magnitude'
        });
    }

    /**
     * 日本周辺の地震を取得
     * @param {Object} options - オプション
     * @returns {Promise<Object>} 地震データ
     */
    async getJapanEarthquakes(options = {}) {
        return await this.searchEarthquakes({
            minlatitude: options.minlatitude || 24.0,
            maxlatitude: options.maxlatitude || 46.0,
            minlongitude: options.minlongitude || 122.0,
            maxlongitude: options.maxlongitude || 154.0,
            minmagnitude: options.minmagnitude || 2.5,
            starttime: options.starttime,
            endtime: options.endtime,
            limit: options.limit || 100
        });
    }

    /**
     * 地震の詳細情報を取得
     * @param {string} eventId - イベントID
     * @returns {Promise<Object>} 地震詳細データ
     */
    async getEarthquakeDetail(eventId) {
        try {
            const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/${eventId}.geojson`;
            const response = await this.fetchWithRetry(url);
            return await response.json();
        } catch (error) {
            console.error('USGS地震詳細取得エラー:', error);
            throw error;
        }
    }

    /**
     * 地震数を取得
     * @param {Object} params - 検索パラメータ
     * @returns {Promise<number>} 地震の数
     */
    async getEarthquakeCount(params = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            if (params.starttime) queryParams.append('starttime', params.starttime);
            if (params.endtime) queryParams.append('endtime', params.endtime);
            if (params.minmagnitude) queryParams.append('minmagnitude', params.minmagnitude);

            const url = `${this.baseUrl}${this.endpoints.COUNT}?${queryParams.toString()}`;
            const response = await this.fetchWithRetry(url);
            const data = await response.json();
            
            return data.count || 0;
        } catch (error) {
            console.error('USGS地震数取得エラー:', error);
            return 0;
        }
    }

    /**
     * リトライ付きフェッチ
     */
    async fetchWithRetry(url, retries = CONFIG.ERROR.RETRY_ATTEMPTS) {
        for (let i = 0; i < retries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), CONFIG.ERROR.TIMEOUT);

                const response = await fetch(url, {
                    signal: controller.signal
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
     * キャッシュ関連メソッド
     */
    getFromCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > CONFIG.CACHE.TTL.EARTHQUAKE_DATA) {
            this.cache.delete(key);
            return null;
        }
        return cached.data;
    }

    setCache(key, data) {
        if (!CONFIG.CACHE.ENABLED) return;
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    clearCache() {
        this.cache.clear();
    }
}

const usgsService = new USGSService();

if (typeof window !== 'undefined') {
    window.USGSService = USGSService;
    window.usgsService = usgsService;
}
