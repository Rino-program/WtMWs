/**
 * APIサービス - 津波情報サービス（拡張版）
 * 津波警報・注意報などの情報を管理
 * - リアルタイム津波監視
 * - 警報分類と重要度判定
 * - 地域別詳細情報
 * - 波高予測とシミュレーション
 * - 到達時刻計算
 * - 避難勧告生成
 * - 履歴管理と分析
 * @version 2.0
 */

class TsunamiService {
    constructor() {
        this.baseUrl = CONFIG.API.P2P_EARTHQUAKE.BASE_URL;
        this.cache = new Map();
        this.activeTsunamiWarnings = [];
        this.isPolling = false;
        this.pollingInterval = null;
        
        // 拡張機能
        this.warningHistory = [];
        this.affectedAreas = new Map();
        this.evacuationRecommendations = new Map();
        this.arrivalPredictions = new Map();
        this.waveHeightRecords = [];
        this.subscribers = new Map();
        this.lastKnownWarnings = null;
        this.alertSound = null;
        this.notificationQueue = [];
        
        // 統計情報
        this.statistics = {
            totalWarnings: 0,
            totalWatches: 0,
            totalMajorWarnings: 0,
            affectedRegions: new Set(),
            averageWaveHeight: 0,
            lastUpdate: null
        };
        
        // 設定
        this.config = {
            pollingInterval: CONFIG.UPDATE?.TSUNAMI || 30000,
            cacheEnabled: true,
            cacheTTL: 60000, // 1分
            notificationEnabled: true,
            soundEnabled: true,
            historylimit: 100,
            predictionAccuracy: 0.8
        };
        
        console.log('🌊 TsunamiService initialized');
    }

    /**
     * サービスの初期化
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Initializing TsunamiService...');
        
        try {
            // 初期データの取得
            await this.getTsunamiInfo();
            
            // アクティブな警報をチェック
            const activeWarnings = await this.getActiveTsunamiWarnings();
            
            if (activeWarnings.length > 0) {
                console.warn(`⚠️ ${activeWarnings.length} active tsunami warning(s) detected!`);
                this.handleActiveWarnings(activeWarnings);
            }
            
            // 履歴の読み込み
            this.loadHistoryFromStorage();
            
            console.log('  ✓ TsunamiService ready');
            
        } catch (error) {
            console.error('❌ TsunamiService initialization failed:', error);
            throw error;
        }
    }

    /**
     * 津波情報を取得（拡張版）
     * @param {Object} options - オプション
     * @returns {Promise<Array>} 津波情報の配列
     */
    async getTsunamiInfo(options = {}) {
        try {
            const {
                limit = 50,
                forceRefresh = false,
                includeHistory = false
            } = options;
            
            const cacheKey = `tsunami_info_${limit}`;
            
            // キャッシュチェック
            if (!forceRefresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    console.log('  ℹ️ Returning cached tsunami data');
                    return cached;
                }
            }

            const url = `${this.baseUrl}/history?limit=${limit}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();

            // 津波情報のみをフィルタリング
            const tsunamiData = data.filter(item => {
                return item.code === 552 && item.tsunami && item.tsunami.grade !== 'None';
            });

            // データを整形
            const formattedData = tsunamiData.map(item => this.formatTsunamiData(item));
            
            // 重要度順にソート
            formattedData.sort((a, b) => {
                const priority = { 'MajorWarning': 3, 'Warning': 2, 'Watch': 1 };
                return (priority[b.grade] || 0) - (priority[a.grade] || 0);
            });
            
            // 統計の更新
            this.updateStatistics(formattedData);
            
            // 履歴に追加
            if (includeHistory) {
                this.addToHistory(formattedData);
            }

            this.setCache(cacheKey, formattedData);
            this.statistics.lastUpdate = new Date().toISOString();
            
            return formattedData;
            
        } catch (error) {
            console.error('津波情報取得エラー:', error);
            
            // フォールバック: キャッシュされた古いデータを返す
            const cacheKey = `tsunami_info_${options.limit || 50}`;
            const oldCached = this.cache.get(cacheKey);
            if (oldCached) {
                console.warn('  ⚠️ Returning stale cached data due to error');
                return oldCached.data;
            }
            
            return [];
        }
    }

    /**
     * アクティブな警報の処理
     * @param {Array} warnings - 警報リスト
     */
    handleActiveWarnings(warnings) {
        warnings.forEach(warning => {
            // 重大度に応じた処理
            switch(warning.grade) {
                case 'MajorWarning':
                    this.handleMajorWarning(warning);
                    break;
                case 'Warning':
                    this.handleWarning(warning);
                    break;
                case 'Watch':
                    this.handleWatch(warning);
                    break;
            }
            
            // 影響地域の記録
            this.recordAffectedAreas(warning);
            
            // 避難勧告の生成
            this.generateEvacuationRecommendations(warning);
        });
    }

    /**
     * 大津波警報の処理
     * @param {Object} warning - 警報データ
     */
    handleMajorWarning(warning) {
        console.error('🚨 大津波警報発令!', warning);
        
        this.statistics.totalMajorWarnings++;
        
        // 緊急通知
        if (this.config.notificationEnabled) {
            this.sendEmergencyNotification({
                title: '🚨 大津波警報',
                message: `${warning.earthquake.name}で大津波警報が発令されました。直ちに高台へ避難してください!`,
                urgency: 'critical',
                data: warning
            });
        }
        
        // 音声アラート
        if (this.config.soundEnabled) {
            this.playEmergencySound('major-warning');
        }
        
        // データストアへの記録
        if (typeof dataStore !== 'undefined') {
            dataStore.set('realtime.tsunami.majorWarning', warning);
        }
    }

    /**
     * 津波警報の処理
     * @param {Object} warning - 警報データ
     */
    handleWarning(warning) {
        console.warn('⚠️ 津波警報発令', warning);
        
        this.statistics.totalWarnings++;
        
        if (this.config.notificationEnabled) {
            this.sendEmergencyNotification({
                title: '⚠️ 津波警報',
                message: `${warning.earthquake.name}で津波警報が発令されました。避難の準備をしてください。`,
                urgency: 'high',
                data: warning
            });
        }
        
        if (this.config.soundEnabled) {
            this.playEmergencySound('warning');
        }
    }

    /**
     * 津波注意報の処理
     * @param {Object} watch - 注意報データ
     */
    handleWatch(watch) {
        console.log('ℹ️ 津波注意報発令', watch);
        
        this.statistics.totalWatches++;
        
        if (this.config.notificationEnabled) {
            this.sendNotification({
                title: 'ℹ️ 津波注意報',
                message: `${watch.earthquake.name}で津波注意報が発令されました。海岸から離れてください。`,
                urgency: 'medium',
                data: watch
            });
        }
    }

    /**
     * 影響地域の記録
     * @param {Object} warning - 警報データ
     */
    recordAffectedAreas(warning) {
        if (!warning.areas) return;
        
        Object.entries(warning.areas).forEach(([code, area]) => {
            if (!this.affectedAreas.has(code)) {
                this.affectedAreas.set(code, []);
            }
            
            this.affectedAreas.get(code).push({
                time: warning.time,
                grade: warning.grade,
                gradeLabel: warning.gradeLabel,
                areaData: area,
                earthquakeId: warning.id
            });
            
            this.statistics.affectedRegions.add(code);
        });
    }

    /**
     * 避難勧告の生成
     * @param {Object} warning - 警報データ
     * @returns {Object} 避難勧告
     */
    generateEvacuationRecommendations(warning) {
        const recommendations = {
            id: `evac_${warning.id}`,
            warningId: warning.id,
            level: this.getEvacuationLevel(warning.grade),
            actions: [],
            shelters: [],
            routes: [],
            estimatedTime: null,
            priority: 'high',
            createdAt: new Date().toISOString()
        };
        
        // 警報レベルに応じた行動指針
        switch(warning.grade) {
            case 'MajorWarning':
                recommendations.actions = [
                    '直ちに高台または避難ビルへ避難',
                    '津波は繰り返し襲来します',
                    '第一波が最大とは限りません',
                    '警報解除まで海岸に近づかない',
                    '避難は徒歩で行う（車は使用しない）'
                ];
                recommendations.estimatedTime = '5分以内';
                recommendations.priority = 'critical';
                break;
                
            case 'Warning':
                recommendations.actions = [
                    '高台または避難ビルへ避難',
                    '海岸から離れてください',
                    '河川の河口付近から離れる',
                    '情報に注意し続ける',
                    '避難は徒歩で行う'
                ];
                recommendations.estimatedTime = '10分以内';
                recommendations.priority = 'high';
                break;
                
            case 'Watch':
                recommendations.actions = [
                    '海岸から離れてください',
                    '海水浴や釣りは中止',
                    '船舶は港外退避または固定',
                    '河口付近に近づかない',
                    '情報に注意する'
                ];
                recommendations.estimatedTime = '30分以内';
                recommendations.priority = 'medium';
                break;
        }
        
        // 地域ごとの詳細情報を追加
        if (warning.areas) {
            Object.entries(warning.areas).forEach(([code, area]) => {
                recommendations.shelters.push({
                    regionCode: code,
                    regionName: area.name,
                    arrivalTime: area.arrivalTime,
                    expectedHeight: area.maxHeight
                });
            });
        }
        
        this.evacuationRecommendations.set(warning.id, recommendations);
        
        return recommendations;
    }

    /**
     * 避難レベルの判定
     * @param {string} grade - 警報レベル
     * @returns {number} 避難レベル (1-5)
     */
    getEvacuationLevel(grade) {
        const levels = {
            'MajorWarning': 5, // 緊急避難
            'Warning': 4,      // 避難指示
            'Watch': 3,        // 避難準備
            'None': 1          // 通常
        };
        return levels[grade] || 1;
    }

    /**
     * 緊急通知の送信
     * @param {Object} notification - 通知内容
     */
    sendEmergencyNotification(notification) {
        console.log('📢 Emergency notification:', notification.title);
        
        this.notificationQueue.push({
            ...notification,
            timestamp: new Date().toISOString(),
            type: 'emergency'
        });
        
        // 実際の通知送信
        if (typeof notificationService !== 'undefined') {
            notificationService.showTsunamiAlert(notification.data);
        }
        
        // サブスクライバーへの通知
        this.notify('emergency', notification);
    }

    /**
     * 通常通知の送信
     * @param {Object} notification - 通知内容
     */
    sendNotification(notification) {
        this.notificationQueue.push({
            ...notification,
            timestamp: new Date().toISOString(),
            type: 'normal'
        });
        
        this.notify('notification', notification);
    }

    /**
     * アクティブな津波警報を取得
     * @returns {Promise<Array>} アクティブな津波警報
     */
    async getActiveTsunamiWarnings() {
        try {
            const allTsunami = await this.getTsunamiInfo();
            const now = Date.now();
            const sixHoursAgo = now - (6 * 60 * 60 * 1000);

            // 6時間以内の津波警報のみを取得
            const active = allTsunami.filter(item => {
                const itemTime = new Date(item.time).getTime();
                return itemTime > sixHoursAgo;
            });

            this.activeTsunamiWarnings = active;
            return active;
        } catch (error) {
            console.error('アクティブ津波警報取得エラー:', error);
            return [];
        }
    }

    /**
     * 地域別津波情報を取得
     * @param {string} regionCode - 地域コード
     * @returns {Promise<Object|null>} 地域の津波情報
     */
    async getTsunamiByRegion(regionCode) {
        try {
            const warnings = await this.getActiveTsunamiWarnings();
            
            for (const warning of warnings) {
                if (warning.areas && warning.areas[regionCode]) {
                    return {
                        region: CONSTANTS.REGION_CODES[regionCode] || regionCode,
                        ...warning.areas[regionCode],
                        earthquakeInfo: warning.earthquake
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('地域別津波情報取得エラー:', error);
            return null;
        }
    }

    /**
     * 津波予想高さを計算
     * @param {Object} earthquakeData - 地震データ
     * @returns {Object} 津波予想情報
     */
    calculateTsunamiEstimate(earthquakeData) {
        const { magnitude, depth, hypocenter } = earthquakeData;
        
        // 簡易的な津波予想計算（実際はもっと複雑）
        let estimatedHeight = 0;
        let warning = 'なし';

        if (magnitude >= 6.5 && depth < 100) {
            if (magnitude >= 8.0) {
                estimatedHeight = 10;
                warning = '大津波警報';
            } else if (magnitude >= 7.5) {
                estimatedHeight = 3;
                warning = '津波警報';
            } else if (magnitude >= 6.5) {
                estimatedHeight = 1;
                warning = '津波注意報';
            }
        }

        return {
            estimatedHeight,
            warning,
            calculation: {
                magnitude,
                depth,
                location: hypocenter?.name || '不明'
            }
        };
    }

    /**
     * 津波到達予想時刻を計算（拡張版）
     * @param {Object} epicenter - 震源位置 { lat, lon, depth }
     * @param {Object} location - 対象地点 { lat, lon }
     * @param {Object} options - オプション
     * @returns {Object} 到達予想情報
     */
    calculateArrivalTime(epicenter, location, options = {}) {
        const {
            magnitude = 7.0,
            depth = 10,
            includeMultipleWaves = true,
            bathymetryData = null
        } = options;
        
        // 距離を計算（km）
        const distance = this.calculateDistance(epicenter, location);
        
        // 水深に基づく津波速度の計算
        // v = √(g * h)  where g = 9.8 m/s², h = 水深(m)
        const averageDepth = bathymetryData?.averageDepth || 4000; // デフォルト4000m
        const tsunamiSpeed = Math.sqrt(9.8 * averageDepth) * 3.6; // km/h に変換
        
        // 第一波の到達時間
        const arrivalHours = distance / tsunamiSpeed;
        const arrivalMinutes = Math.ceil(arrivalHours * 60);
        const arrivalTime = new Date(Date.now() + arrivalMinutes * 60000);
        
        // 予測精度の計算
        const accuracy = this.calculatePredictionAccuracy(distance, depth, magnitude);
        
        const result = {
            distance: Math.round(distance),
            tsunamiSpeed: Math.round(tsunamiSpeed),
            firstWave: {
                estimatedArrivalMinutes: arrivalMinutes,
                estimatedArrivalTime: arrivalTime,
                timeString: this.formatArrivalTime(arrivalTime),
                uncertainty: Math.ceil(arrivalMinutes * (1 - accuracy))
            },
            urgencyLevel: this.getUrgencyLevel(arrivalMinutes),
            warning: arrivalMinutes < 30 ? '緊急' : arrivalMinutes < 60 ? '注意' : '監視',
            accuracy: Math.round(accuracy * 100),
            factors: {
                distance,
                depth: averageDepth,
                magnitude,
                terrainEffect: bathymetryData ? 'computed' : 'estimated'
            }
        };
        
        // 複数波の計算
        if (includeMultipleWaves) {
            result.additionalWaves = this.calculateAdditionalWaves(arrivalTime, magnitude);
        }
        
        // 警告メッセージ
        result.message = this.generateArrivalMessage(result);
        
        // 予測をキャッシュ
        const predictionKey = `${epicenter.lat},${epicenter.lon}-${location.lat},${location.lon}`;
        this.arrivalPredictions.set(predictionKey, {
            ...result,
            calculatedAt: new Date().toISOString()
        });
        
        return result;
    }

    /**
     * 追加波の計算
     * @param {Date} firstWaveTime - 第一波の時刻
     * @param {number} magnitude - マグニチュード
     * @returns {Array} 追加波の情報
     */
    calculateAdditionalWaves(firstWaveTime, magnitude) {
        const waves = [];
        const intervals = this.getWaveIntervals(magnitude);
        
        for (let i = 0; i < Math.min(intervals.length, 5); i++) {
            const waveTime = new Date(firstWaveTime.getTime() + intervals[i] * 60000);
            const relativeHeight = this.getRelativeWaveHeight(i, magnitude);
            
            waves.push({
                waveNumber: i + 2, // 第二波から
                arrivalTime: waveTime,
                timeString: this.formatArrivalTime(waveTime),
                relativeHeight: Math.round(relativeHeight * 100), // パーセント
                isMaximum: i === intervals.indexOf(Math.max(...intervals))
            });
        }
        
        return waves;
    }

    /**
     * 波の間隔を取得（マグニチュードに基づく）
     * @param {number} magnitude - マグニチュード
     * @returns {Array} 各波の間隔（分）
     */
    getWaveIntervals(magnitude) {
        // マグニチュードが大きいほど波の間隔が長い
        const baseInterval = magnitude >= 8 ? 60 : magnitude >= 7 ? 45 : 30;
        
        return [
            baseInterval,
            baseInterval * 1.5,
            baseInterval * 2,
            baseInterval * 2.5,
            baseInterval * 3
        ];
    }

    /**
     * 相対波高を計算
     * @param {number} waveIndex - 波の番号（0が第二波）
     * @param {number} magnitude - マグニチュード
     * @returns {number} 相対波高（1.0が第一波）
     */
    getRelativeWaveHeight(waveIndex, magnitude) {
        // 第一波が最大とは限らない
        // マグニチュードが大きい場合、第二波や第三波が大きいことがある
        const patterns = magnitude >= 8.0 ? [1.2, 1.5, 1.0, 0.8, 0.6] : // M8+: 第二・三波が大きい
                        magnitude >= 7.5 ? [1.0, 1.3, 1.1, 0.7, 0.5] : // M7.5+: 第二波が大きい
                        [1.0, 0.8, 0.6, 0.4, 0.3]; // M7未満: 第一波が最大
        
        return patterns[waveIndex] || 0.3;
    }

    /**
     * 予測精度の計算
     * @param {number} distance - 距離（km）
     * @param {number} depth - 深さ（km）
     * @param {number} magnitude - マグニチュード
     * @returns {number} 精度（0-1）
     */
    calculatePredictionAccuracy(distance, depth, magnitude) {
        let accuracy = this.config.predictionAccuracy;
        
        // 距離による精度低下
        if (distance > 1000) accuracy *= 0.9;
        if (distance > 2000) accuracy *= 0.8;
        
        // 深さによる精度低下（深いほど不確実）
        if (depth > 50) accuracy *= 0.95;
        if (depth > 100) accuracy *= 0.9;
        
        // マグニチュードによる精度変化
        if (magnitude < 6.5) accuracy *= 0.85; // 小規模は不確実
        if (magnitude > 8.5) accuracy *= 0.9;  // 大規模も複雑
        
        return Math.max(0.5, Math.min(1.0, accuracy));
    }

    /**
     * 緊急度レベルの判定
     * @param {number} minutes - 到達までの分数
     * @returns {string} 緊急度レベル
     */
    getUrgencyLevel(minutes) {
        if (minutes < 10) return 'critical';
        if (minutes < 30) return 'high';
        if (minutes < 60) return 'medium';
        return 'low';
    }

    /**
     * 到達時刻のフォーマット
     * @param {Date} time - 時刻
     * @returns {string} フォーマットされた文字列
     */
    formatArrivalTime(time) {
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * 到達メッセージの生成
     * @param {Object} prediction - 予測データ
     * @returns {string} メッセージ
     */
    generateArrivalMessage(prediction) {
        const { firstWave, urgencyLevel, warning } = prediction;
        
        if (urgencyLevel === 'critical') {
            return `津波が${firstWave.estimatedArrivalMinutes}分後に到達する可能性があります！直ちに避難してください！`;
        } else if (urgencyLevel === 'high') {
            return `津波が約${firstWave.estimatedArrivalMinutes}分後に到達する見込みです。避難を開始してください。`;
        } else if (urgencyLevel === 'medium') {
            return `津波が約${firstWave.estimatedArrivalMinutes}分後に到達する可能性があります。避難の準備をしてください。`;
        } else {
            return `津波が約${Math.round(firstWave.estimatedArrivalMinutes / 60)}時間後に到達する可能性があります。情報に注意してください。`;
        }
    }

    /**
     * 波高予測シミュレーション（拡張版）
     * @param {Object} earthquakeData - 地震データ
     * @param {Object} location - 位置情報
     * @param {Object} options - オプション
     * @returns {Object} 波高予測
     */
    calculateWaveHeightPrediction(earthquakeData, location, options = {}) {
        const { magnitude, depth, hypocenter } = earthquakeData;
        const {
            includeUncertainty = true,
            detailedAnalysis = false,
            coastalGeometry = null
        } = options;
        
        // 基本波高の計算
        const baseHeight = this.calculateBaseWaveHeight(magnitude, depth);
        
        // 距離減衰の計算
        const distance = this.calculateDistance(
            { lat: hypocenter.latitude, lon: hypocenter.longitude },
            location
        );
        const attenuationFactor = this.calculateAttenuation(distance);
        
        // 海底地形の影響
        const bathymetryFactor = coastalGeometry ? 
            this.calculateBathymetryEffect(coastalGeometry) : 1.0;
        
        // 海岸線形状の影響（湾の形状など）
        const coastalFactor = coastalGeometry ? 
            this.calculateCoastalGeometryEffect(coastalGeometry) : 1.0;
        
        // 最終波高の計算
        const estimatedHeight = baseHeight * attenuationFactor * bathymetryFactor * coastalFactor;
        
        const prediction = {
            estimatedHeight: Math.round(estimatedHeight * 10) / 10,
            range: {
                min: Math.round(estimatedHeight * 0.7 * 10) / 10,
                max: Math.round(estimatedHeight * 1.5 * 10) / 10
            },
            warningLevel: this.getWarningLevelByHeight(estimatedHeight),
            factors: {
                baseMagnitude: magnitude,
                depth: depth,
                distance: Math.round(distance),
                attenuation: Math.round(attenuationFactor * 100),
                bathymetry: Math.round(bathymetryFactor * 100),
                coastal: Math.round(coastalFactor * 100)
            },
            message: this.generateWaveHeightMessage(estimatedHeight)
        };
        
        // 不確実性の追加
        if (includeUncertainty) {
            prediction.uncertainty = this.calculateHeightUncertainty(
                magnitude,
                depth,
                distance,
                coastalGeometry
            );
        }
        
        // 詳細分析
        if (detailedAnalysis) {
            prediction.detailed = {
                runupHeight: estimatedHeight * (1.5 + Math.random() * 0.5), // 遡上高
                inundationDistance: this.estimateInundationDistance(estimatedHeight),
                floodDepth: this.estimateFloodDepth(estimatedHeight),
                waveForce: this.calculateWaveForce(estimatedHeight),
                damageEstimate: this.estimateDamage(estimatedHeight)
            };
        }
        
        // 予測を記録
        this.waveHeightRecords.push({
            ...prediction,
            earthquakeId: earthquakeData.id,
            location,
            timestamp: new Date().toISOString()
        });
        
        return prediction;
    }

    /**
     * 基本波高の計算
     * @param {number} magnitude - マグニチュード
     * @param {number} depth - 深さ（km）
     * @returns {number} 基本波高（m）
     */
    calculateBaseWaveHeight(magnitude, depth) {
        // 簡易的な経験式
        // 実際はMomment Magnitudeや断層パラメータが必要
        
        if (depth > 100) {
            // 深い地震は津波を発生させにくい
            return 0;
        }
        
        let height = 0;
        
        if (magnitude >= 9.0) {
            height = 15 + (magnitude - 9.0) * 5;
        } else if (magnitude >= 8.5) {
            height = 10 + (magnitude - 8.5) * 10;
        } else if (magnitude >= 8.0) {
            height = 5 + (magnitude - 8.0) * 10;
        } else if (magnitude >= 7.5) {
            height = 3 + (magnitude - 7.5) * 4;
        } else if (magnitude >= 7.0) {
            height = 1 + (magnitude - 7.0) * 4;
        } else if (magnitude >= 6.5) {
            height = 0.5 + (magnitude - 6.5) * 1;
        } else {
            height = 0.1;
        }
        
        // 深さによる補正
        if (depth > 50) {
            height *= 0.7;
        }
        if (depth > 70) {
            height *= 0.5;
        }
        
        return height;
    }

    /**
     * 距離減衰の計算
     * @param {number} distance - 距離（km）
     * @returns {number} 減衰係数
     */
    calculateAttenuation(distance) {
        // 津波は距離とともに減衰するが、音波ほど速くない
        // 簡易モデル: 1 / √distance
        if (distance < 10) return 1.0;
        return Math.max(0.1, 1.0 / Math.sqrt(distance / 10));
    }

    /**
     * 海底地形の影響を計算
     * @param {Object} geometry - 地形データ
     * @returns {number} 影響係数
     */
    calculateBathymetryEffect(geometry) {
        // 浅い海域では波高が増幅される
        const { shelfWidth, depth } = geometry;
        
        let factor = 1.0;
        
        if (depth < 200) {
            factor = 1.5; // 大陸棚は増幅
        }
        if (depth < 100) {
            factor = 2.0;
        }
        if (depth < 50) {
            factor = 2.5;
        }
        
        return factor;
    }

    /**
     * 海岸線形状の影響を計算
     * @param {Object} geometry - 形状データ
     * @returns {number} 影響係数
     */
    calculateCoastalGeometryEffect(geometry) {
        const { type, openingAngle } = geometry;
        
        let factor = 1.0;
        
        switch(type) {
            case 'bay': // 湾
                // V字型の湾は津波を増幅
                factor = 1.5 + (90 - openingAngle) / 90; // 狭いほど増幅
                break;
            case 'cape': // 岬
                factor = 0.8; // 岬は波を分散
                break;
            case 'straight': // 直線
                factor = 1.0;
                break;
            case 'ria': // リアス式海岸
                factor = 2.5; // 大きく増幅
                break;
        }
        
        return factor;
    }

    /**
     * 波高による警報レベルの判定
     * @param {number} height - 波高（m）
     * @returns {string} 警報レベル
     */
    getWarningLevelByHeight(height) {
        if (height >= 10) return 'MajorWarning'; // 大津波警報
        if (height >= 3) return 'Warning';        // 津波警報
        if (height >= 1) return 'Watch';          // 津波注意報
        if (height >= 0.2) return 'Advisory';     // 注意
        return 'None';
    }

    /**
     * 波高メッセージの生成
     * @param {number} height - 波高（m）
     * @returns {string} メッセージ
     */
    generateWaveHeightMessage(height) {
        if (height >= 10) {
            return `予想される津波の高さは${height.toFixed(1)}mです。巨大な津波が襲来します！直ちに避難してください！`;
        } else if (height >= 3) {
            return `予想される津波の高さは${height.toFixed(1)}mです。高い津波が予想されます。避難してください。`;
        } else if (height >= 1) {
            return `予想される津波の高さは${height.toFixed(1)}mです。津波に注意してください。`;
        } else if (height >= 0.2) {
            return `予想される津波の高さは${height.toFixed(1)}mです。海岸や河口付近に注意してください。`;
        } else {
            return '津波の心配はありません。';
        }
    }

    /**
     * 波高の不確実性を計算
     * @param {number} magnitude - マグニチュード
     * @param {number} depth - 深さ
     * @param {number} distance - 距離
     * @param {Object} geometry - 地形データ
     * @returns {Object} 不確実性情報
     */
    calculateHeightUncertainty(magnitude, depth, distance, geometry) {
        let uncertainty = 0.3; // 基本不確実性 ±30%
        
        // マグニチュードによる不確実性
        if (magnitude < 7.0) uncertainty += 0.2;
        if (magnitude > 8.5) uncertainty += 0.1;
        
        // 距離による不確実性
        if (distance > 500) uncertainty += 0.1;
        if (distance > 1000) uncertainty += 0.2;
        
        // 地形データの有無による不確実性
        if (!geometry) uncertainty += 0.2;
        
        return {
            percentage: Math.round(uncertainty * 100),
            description: uncertainty > 0.5 ? '高い' : uncertainty > 0.3 ? '中程度' : '低い',
            factors: {
                magnitude: magnitude < 7.0 || magnitude > 8.5,
                distance: distance > 500,
                geometry: !geometry
            }
        };
    }

    /**
     * 浸水距離の推定
     * @param {number} height - 波高（m）
     * @returns {number} 浸水距離（m）
     */
    estimateInundationDistance(height) {
        // 簡易モデル: 波高の100-300倍程度
        const factor = 150 + Math.random() * 150;
        return Math.round(height * factor);
    }

    /**
     * 浸水深の推定
     * @param {number} height - 波高（m）
     * @returns {number} 浸水深（m）
     */
    estimateFloodDepth(height) {
        // 陸上での浸水深は波高の50-80%程度
        const factor = 0.5 + Math.random() * 0.3;
        return Math.round(height * factor * 10) / 10;
    }

    /**
     * 波力の計算
     * @param {number} height - 波高（m）
     * @returns {Object} 波力情報
     */
    calculateWaveForce(height) {
        // 波圧 P = ρ * g * h (Pa)
        // ρ (海水密度) ≈ 1025 kg/m³
        // g (重力加速度) = 9.8 m/s²
        const pressure = 1025 * 9.8 * height;
        
        return {
            pressure: Math.round(pressure), // Pa
            pressureKPa: Math.round(pressure / 1000), // kPa
            description: pressure > 50000 ? '壊滅的' : 
                        pressure > 20000 ? '非常に強い' :
                        pressure > 10000 ? '強い' : '中程度',
            canDestroy: {
                woodenHouse: height > 2,
                concreteWall: height > 5,
                reinforcedBuilding: height > 10
            }
        };
    }

    /**
     * 被害の推定
     * @param {number} height - 波高（m）
     * @returns {Object} 被害推定
     */
    estimateDamage(height) {
        let level = 'minor';
        const impacts = [];
        
        if (height >= 10) {
            level = 'catastrophic';
            impacts.push('沿岸部の壊滅的な破壊');
            impacts.push('広範囲な浸水');
            impacts.push('多数の人的被害の可能性');
            impacts.push('インフラの全壊');
        } else if (height >= 5) {
            level = 'severe';
            impacts.push('建物の全壊・半壊');
            impacts.push('広範囲な浸水被害');
            impacts.push('人的被害の危険');
            impacts.push('インフラへの重大な損傷');
        } else if (height >= 3) {
            level = 'major';
            impacts.push('木造建築物の損壊');
            impacts.push('浸水被害');
            impacts.push('車両の流失');
            impacts.push('インフラへの損傷');
        } else if (height >= 1) {
            level = 'moderate';
            impacts.push('沿岸部の浸水');
            impacts.push('船舶への被害');
            impacts.push('低地の冠水');
        } else {
            level = 'minor';
            impacts.push('わずかな浸水の可能性');
            impacts.push('養殖施設への影響');
        }
        
        return {
            level,
            impacts,
            economicLoss: this.estimateEconomicLoss(height),
            evacuationRequired: height >= 1
        };
    }

    /**
     * 経済損失の推定
     * @param {number} height - 波高（m）
     * @returns {string} 損失レベル
     */
    estimateEconomicLoss(height) {
        if (height >= 10) return '数兆円規模';
        if (height >= 5) return '数千億円規模';
        if (height >= 3) return '数百億円規模';
        if (height >= 1) return '数十億円規模';
        return '数億円規模';
    }

    /**
     * 2点間の距離を計算（Haversine formula）
     * @param {Object} point1 - 地点1 { lat, lon }
     * @param {Object} point2 - 地点2 { lat, lon }
     * @returns {number} 距離（km）
     */
    calculateDistance(point1, point2) {
        const R = 6371; // 地球の半径（km）
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
     * 津波データを整形
     * @param {Object} rawData - 生データ
     * @returns {Object} 整形されたデータ
     */
    formatTsunamiData(rawData) {
        const tsunami = rawData.tsunami || {};
        const earthquake = rawData.earthquake || {};

        return {
            id: rawData.id,
            time: rawData.time || earthquake.time,
            grade: tsunami.grade,
            gradeLabel: this.getGradeLabel(tsunami.grade),
            areas: this.formatAreas(tsunami.forecast || []),
            earthquake: {
                magnitude: earthquake.hypocenter?.magnitude,
                depth: earthquake.hypocenter?.depth,
                name: earthquake.hypocenter?.name,
                latitude: earthquake.hypocenter?.latitude,
                longitude: earthquake.hypocenter?.longitude,
                maxIntensity: earthquake.maxScale
            },
            cancelled: tsunami.cancelled || false
        };
    }

    /**
     * 津波警報レベルのラベルを取得
     * @param {string} grade - 警報レベル
     * @returns {string} ラベル
     */
    getGradeLabel(grade) {
        const labels = {
            'MajorWarning': '大津波警報',
            'Warning': '津波警報',
            'Watch': '津波注意報',
            'None': 'なし'
        };
        return labels[grade] || '不明';
    }

    /**
     * 地域情報を整形
     * @param {Array} forecast - 予報データ
     * @returns {Object} 地域ごとの情報
     */
    formatAreas(forecast) {
        const areas = {};
        
        forecast.forEach(item => {
            areas[item.code] = {
                name: item.name,
                grade: item.grade,
                gradeLabel: this.getGradeLabel(item.grade),
                immediate: item.immediate || false,
                firstHeight: item.firstHeight,
                maxHeight: item.maxHeight,
                arrivalTime: item.arrivalTime
            };
        });

        return areas;
    }

    /**
     * 津波リスク評価（拡張版）
     * @param {Object} location - 位置情報 { lat, lon }
     * @param {Object} earthquakeData - 地震データ
     * @param {Object} options - オプション
     * @returns {Object} リスク評価
     */
    assessTsunamiRisk(location, earthquakeData, options = {}) {
        const { magnitude, depth, hypocenter } = earthquakeData;
        const {
            includeEvacuation = true,
            includeHistory = false,
            detailedAnalysis = false
        } = options;
        
        // 海岸線からの距離を判定
        const isCoastal = this.isCoastalArea(location);
        const coastalDistance = this.estimateCoastalDistance(location);
        
        // 標高の推定（簡易版）
        const elevation = this.estimateElevation(location);
        
        // 基本リスク判定
        let riskLevel = 'none';
        let riskScore = 0;
        let recommendation = '通常通り';
        const factors = [];
        
        // 地震の規模によるリスク
        if (magnitude >= 6.5 && depth < 100) {
            if (magnitude >= 9.0) {
                riskScore += 100;
                factors.push('超巨大地震');
            } else if (magnitude >= 8.5) {
                riskScore += 80;
                factors.push('巨大地震');
            } else if (magnitude >= 8.0) {
                riskScore += 60;
                factors.push('大規模地震');
            } else if (magnitude >= 7.5) {
                riskScore += 40;
                factors.push('中規模地震');
            } else {
                riskScore += 20;
                factors.push('津波発生の可能性');
            }
        }
        
        // 海岸線proximity によるリスク
        if (isCoastal) {
            if (coastalDistance < 1) {
                riskScore += 40;
                factors.push('海岸直近');
            } else if (coastalDistance < 5) {
                riskScore += 30;
                factors.push('海岸近く');
            } else if (coastalDistance < 10) {
                riskScore += 20;
                factors.push('沿岸部');
            } else {
                riskScore += 10;
                factors.push('内陸寄り');
            }
        }
        
        // 標高によるリスク
        if (elevation < 5) {
            riskScore += 30;
            factors.push('低地');
        } else if (elevation < 10) {
            riskScore += 20;
            factors.push('低標高');
        } else if (elevation < 20) {
            riskScore += 10;
            factors.push('やや低い標高');
        } else {
            riskScore -= 20;
            factors.push('高台');
        }
        
        // 深さによる補正
        if (depth > 70) {
            riskScore *= 0.5;
            factors.push('深い震源（津波小）');
        } else if (depth < 30) {
            riskScore *= 1.2;
            factors.push('浅い震源（津波大）');
        }
        
        // リスクレベルの判定
        if (riskScore >= 100) {
            riskLevel = 'critical';
            recommendation = '直ちに高台へ避難してください！津波が襲来します！';
        } else if (riskScore >= 70) {
            riskLevel = 'high';
            recommendation = '直ちに避難してください。津波警報に注意してください。';
        } else if (riskScore >= 50) {
            riskLevel = 'elevated';
            recommendation = '避難の準備をしてください。海岸から離れてください。';
        } else if (riskScore >= 30) {
            riskLevel = 'moderate';
            recommendation = '津波情報に注意してください。海岸・河口に近づかないでください。';
        } else if (riskScore >= 10) {
            riskLevel = 'low';
            recommendation = '情報に注意してください。';
        } else {
            riskLevel = 'none';
            recommendation = '通常通り。';
        }
        
        const assessment = {
            riskLevel,
            riskScore,
            recommendation,
            factors,
            location: {
                isCoastal,
                coastalDistance,
                elevation,
                lat: location.lat,
                lon: location.lon
            },
            earthquake: {
                magnitude,
                depth,
                name: hypocenter?.name || '不明'
            },
            assessedAt: new Date().toISOString()
        };
        
        // 避難計画
        if (includeEvacuation && riskLevel !== 'none') {
            assessment.evacuation = this.generateEvacuationPlan(location, riskLevel, elevation);
        }
        
        // 履歴分析
        if (includeHistory) {
            assessment.history = this.analyzeHistoricalTsunamis(location);
        }
        
        // 詳細分析
        if (detailedAnalysis) {
            assessment.detailed = {
                arrivalPrediction: this.calculateArrivalTime(
                    { lat: hypocenter.latitude, lon: hypocenter.longitude },
                    location,
                    { magnitude, depth }
                ),
                waveHeightPrediction: this.calculateWaveHeightPrediction(
                    earthquakeData,
                    location
                ),
                impactAnalysis: this.analyzeImpact(location, riskLevel)
            };
        }
        
        return assessment;
    }

    /**
     * 海岸線からの距離を推定
     * @param {Object} location - 位置
     * @returns {number} 距離（km）
     */
    estimateCoastalDistance(location) {
        // 実際は詳細な地理データが必要
        // ここでは簡易的な推定
        const { lat, lon } = location;
        
        // 日本の主要海岸線との最短距離を簡易計算
        const coastlines = [
            { lat: 35.0, lon: 139.7, name: '東京湾' },
            { lat: 34.7, lon: 135.2, name: '大阪湾' },
            { lat: 33.6, lon: 130.4, name: '博多湾' },
            { lat: 38.3, lon: 141.0, name: '仙台湾' },
            { lat: 43.1, lon: 141.3, name: '石狩湾' }
        ];
        
        const distances = coastlines.map(coast => 
            this.calculateDistance(location, coast)
        );
        
        return Math.min(...distances);
    }

    /**
     * 標高の推定（簡易版）
     * @param {Object} location - 位置
     * @returns {number} 標高（m）
     */
    estimateElevation(location) {
        // 実際は標高データAPIが必要
        // ここでは緯度経度から簡易推定
        
        // 海岸部は低い、内陸部は高い傾向を簡易モデル化
        const coastalDist = this.estimateCoastalDistance(location);
        
        if (coastalDist < 1) return 0 + Math.random() * 5;
        if (coastalDist < 5) return 5 + Math.random() * 10;
        if (coastalDist < 10) return 10 + Math.random() * 20;
        return 20 + Math.random() * 50;
    }

    /**
     * 避難計画の生成
     * @param {Object} location - 位置
     * @param {string} riskLevel - リスクレベル
     * @param {number} elevation - 標高
     * @returns {Object} 避難計画
     */
    generateEvacuationPlan(location, riskLevel, elevation) {
        const plan = {
            urgency: riskLevel,
            targetElevation: 0,
            actions: [],
            shelters: [],
            routes: [],
            estimatedTime: null
        };
        
        // リスクレベルに応じた目標標高
        switch(riskLevel) {
            case 'critical':
                plan.targetElevation = 30;
                plan.estimatedTime = '5分以内';
                plan.actions = [
                    '今すぐ避難を開始',
                    '最も近い高台へ',
                    '避難ビルの3階以上へ',
                    '徒歩で避難（車は使用しない）',
                    '持ち物は最小限に'
                ];
                break;
            case 'high':
                plan.targetElevation = 20;
                plan.estimatedTime = '10分以内';
                plan.actions = [
                    '直ちに避難を開始',
                    '指定避難場所へ',
                    '避難ビルへ',
                    '徒歩で避難',
                    '貴重品のみ持参'
                ];
                break;
            case 'elevated':
                plan.targetElevation = 15;
                plan.estimatedTime = '20分以内';
                plan.actions = [
                    '避難の準備を開始',
                    '避難場所を確認',
                    '避難経路を確認',
                    '非常持ち出し袋を準備',
                    '家族と連絡を取る'
                ];
                break;
            default:
                plan.targetElevation = 10;
                plan.estimatedTime = '30分以内';
                plan.actions = [
                    '避難場所を確認',
                    '情報を収集',
                    '避難の準備'
                ];
        }
        
        // 現在の標高と目標標高の差
        plan.elevationGain = Math.max(0, plan.targetElevation - elevation);
        
        return plan;
    }

    /**
     * 履歴津波の分析
     * @param {Object} location - 位置
     * @returns {Object} 履歴分析
     */
    analyzeHistoricalTsunamis(location) {
        // 実際は詳細な津波データベースが必要
        // ここでは既知の主要津波を簡易的にリスト
        
        const majorTsunamis = [
            { year: 2011, name: '東日本大震災', maxHeight: 40.5, affected: '東北・関東太平洋岸' },
            { year: 1960, name: 'チリ地震津波', maxHeight: 6.0, affected: '日本全国太平洋岸' },
            { year: 1946, name: '昭和南海地震', maxHeight: 6.0, affected: '紀伊半島・四国' },
            { year: 1933, name: '昭和三陸地震', maxHeight: 28.7, affected: '三陸海岸' }
        ];
        
        return {
            count: majorTsunamis.length,
            events: majorTsunamis,
            nextPrediction: '南海トラフ巨大地震（今後30年以内に70-80%）',
            preparednessLevel: 'high'
        };
    }

    /**
     * 影響分析
     * @param {Object} location - 位置
     * @param {string} riskLevel - リスクレベル
     * @returns {Object} 影響分析
     */
    analyzeImpact(location, riskLevel) {
        const impacts = {
            population: this.estimateAffectedPopulation(location, riskLevel),
            infrastructure: this.analyzeInfrastructureImpact(riskLevel),
            economy: this.analyzeEconomicImpact(riskLevel),
            environment: this.analyzeEnvironmentalImpact(riskLevel)
        };
        
        return impacts;
    }

    /**
     * 影響人口の推定
     * @param {Object} location - 位置
     * @param {string} riskLevel - リスクレベル
     * @returns {Object} 人口影響
     */
    estimateAffectedPopulation(location, riskLevel) {
        // 簡易推定
        const densityFactors = {
            'critical': 10000,
            'high': 5000,
            'elevated': 2000,
            'moderate': 1000,
            'low': 500
        };
        
        const affected = densityFactors[riskLevel] || 0;
        
        return {
            estimated: affected,
            evacuationRequired: riskLevel !== 'low' && riskLevel !== 'none',
            vulnerableGroups: ['高齢者', '子供', '障害者', '観光客']
        };
    }

    /**
     * インフラ影響の分析
     * @param {string} riskLevel - リスクレベル
     * @returns {Object} インフラ影響
     */
    analyzeInfrastructureImpact(riskLevel) {
        const impacts = {
            transportation: [],
            utilities: [],
            communications: [],
            facilities: []
        };
        
        if (riskLevel === 'critical' || riskLevel === 'high') {
            impacts.transportation.push('道路の冠水・損壊', '鉄道の運休', '港湾施設の損傷');
            impacts.utilities.push('停電', '断水', 'ガス停止');
            impacts.communications.push('通信障害', 'インターネット断絶');
            impacts.facilities.push('病院・学校の浸水', '避難所の機能停止');
        } else if (riskLevel === 'elevated' || riskLevel === 'moderate') {
            impacts.transportation.push('一部道路の通行止め', '交通混雑');
            impacts.utilities.push('一部停電の可能性');
            impacts.communications.push('通信混雑');
            impacts.facilities.push('一部施設の閉鎖');
        }
        
        return impacts;
    }

    /**
     * 経済影響の分析
     * @param {string} riskLevel - リスクレベル
     * @returns {Object} 経済影響
     */
    analyzeEconomicImpact(riskLevel) {
        const impactLevels = {
            'critical': { level: '壊滅的', estimated: '数兆円', recovery: '数年' },
            'high': { level: '重大', estimated: '数千億円', recovery: '1-2年' },
            'elevated': { level: '大きい', estimated: '数百億円', recovery: '数ヶ月' },
            'moderate': { level: '中程度', estimated: '数十億円', recovery: '数週間' },
            'low': { level: '軽微', estimated: '数億円', recovery: '数日' }
        };
        
        return impactLevels[riskLevel] || impactLevels['low'];
    }

    /**
     * 環境影響の分析
     * @param {string} riskLevel - リスクレベル
     * @returns {Object} 環境影響
     */
    analyzeEnvironmentalImpact(riskLevel) {
        const impacts = {
            coastal: [],
            marine: [],
            contamination: [],
            recovery: ''
        };
        
        if (riskLevel === 'critical' || riskLevel === 'high') {
            impacts.coastal.push('海岸線の変化', '砂浜の消失', '地形の変化');
            impacts.marine.push('海洋生態系への影響', '養殖施設の破壊');
            impacts.contamination.push('海水の陸上流入', '土壌汚染', '地下水汚染');
            impacts.recovery = '長期（数年〜数十年）';
        } else {
            impacts.coastal.push('一時的な海岸環境の変化');
            impacts.marine.push('軽微な影響');
            impacts.recovery = '短期（数ヶ月〜1年）';
        }
        
        return impacts;
    }

    /**
     * 統計の更新
     * @param {Array} warnings - 警報リスト
     */
    updateStatistics(warnings) {
        warnings.forEach(warning => {
            switch(warning.grade) {
                case 'MajorWarning':
                    this.statistics.totalMajorWarnings++;
                    break;
                case 'Warning':
                    this.statistics.totalWarnings++;
                    break;
                case 'Watch':
                    this.statistics.totalWatches++;
                    break;
            }
            
            // 影響地域の記録
            if (warning.areas) {
                Object.keys(warning.areas).forEach(code => {
                    this.statistics.affectedRegions.add(code);
                });
            }
        });
    }

    /**
     * 履歴への追加
     * @param {Array} warnings - 警報リスト
     */
    addToHistory(warnings) {
        warnings.forEach(warning => {
            // 重複チェック
            const exists = this.warningHistory.find(w => w.id === warning.id);
            if (!exists) {
                this.warningHistory.unshift(warning);
            }
        });
        
        // 履歴の制限
        if (this.warningHistory.length > this.config.historylimit) {
            this.warningHistory = this.warningHistory.slice(0, this.config.historylimit);
        }
        
        // ストレージに保存
        this.saveHistoryToStorage();
    }

    /**
     * 履歴の読み込み
     */
    loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('tsunami_history');
            if (stored) {
                this.warningHistory = JSON.parse(stored);
                console.log(`  ✓ Loaded ${this.warningHistory.length} tsunami records from storage`);
            }
        } catch (error) {
            console.error('Failed to load tsunami history:', error);
        }
    }

    /**
     * 履歴の保存
     */
    saveHistoryToStorage() {
        try {
            localStorage.setItem('tsunami_history', JSON.stringify(this.warningHistory));
        } catch (error) {
            console.error('Failed to save tsunami history:', error);
        }
    }

    /**
     * 緊急音声の再生
     * @param {string} type - 音声タイプ
     */
    playEmergencySound(type) {
        // 実際の音声再生はAudioManagerに委譲
        if (typeof AudioManager !== 'undefined') {
            switch(type) {
                case 'major-warning':
                    AudioManager.playTsunamiAlert({ grade: 'MajorWarning' });
                    break;
                case 'warning':
                    AudioManager.playTsunamiAlert({ grade: 'Warning' });
                    break;
                default:
                    console.log('Playing tsunami alert sound:', type);
            }
        }
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
                console.error(`Error in tsunami service subscriber for ${event}:`, error);
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
        
        // アンサブスクライブ関数を返す
        return () => {
            const subscribers = this.subscribers.get(event);
            const index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    /**
     * 統計情報の取得
     * @returns {Object} 統計情報
     */
    getStatistics() {
        return {
            ...this.statistics,
            affectedRegionsCount: this.statistics.affectedRegions.size,
            historyCount: this.warningHistory.length,
            cacheSize: this.cache.size
        };
    }

    /**
     * サービスのクリーンアップ
     */
    cleanup() {
        this.stopPolling();
        this.cache.clear();
        this.subscribers.clear();
        console.log('🌊 TsunamiService cleaned up');
    }

    /**
     * 海岸地域かどうかを判定（簡易版）
     * @param {Object} location - 位置 { lat, lon }
     * @returns {boolean} 海岸地域かどうか
     */
    isCoastalArea(location) {
        // 実際は詳細な地理データが必要
        // ここでは簡易的に日本の海岸線に近いかを判定
        const { lat, lon } = location;
        
        // 日本の主要都市の海岸線判定（簡易版）
        const coastalRanges = [
            { minLat: 33, maxLat: 36, minLon: 139, maxLon: 141 }, // 関東
            { minLat: 34, maxLat: 35, minLon: 135, maxLon: 136 }, // 関西
            { minLat: 32, maxLat: 34, minLon: 130, maxLon: 132 }  // 九州
        ];

        return coastalRanges.some(range => 
            lat >= range.minLat && lat <= range.maxLat &&
            lon >= range.minLon && lon <= range.maxLon
        );
    }

    /**
     * 津波監視を開始
     * @param {Function} callback - 津波情報更新時のコールバック
     */
    startPolling(callback) {
        if (this.isPolling) return;

        this.isPolling = true;
        let lastUpdate = null;

        this.pollingInterval = setInterval(async () => {
            try {
                const warnings = await this.getActiveTsunamiWarnings();
                const currentUpdate = JSON.stringify(warnings);
                
                if (currentUpdate !== lastUpdate) {
                    lastUpdate = currentUpdate;
                    callback(warnings);
                }
            } catch (error) {
                console.error('津波監視ポーリングエラー:', error);
            }
        }, CONFIG.UPDATE.TSUNAMI);
    }

    /**
     * 津波監視を停止
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
    }

    /**
     * キャッシュ関連メソッド
     */
    getFromCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > CONFIG.CACHE.TTL.TSUNAMI_DATA) {
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

const tsunamiService = new TsunamiService();

if (typeof window !== 'undefined') {
    window.TsunamiService = TsunamiService;
    window.tsunamiService = tsunamiService;
}
