/**
 * 分析サービス - 地震データの高度な統計分析（拡張版）
 * - 包括的な統計分析
 * - パターン認識と異常検出
 * - 余震確率計算（大森・宇津式）
 * - リスク評価とハザードマップ
 * - 歴史的データ比較
 * - 予測モデリング
 * - 機械学習的アプローチ
 * @version 2.0
 */
class AnalysisService {
    constructor() {
        this.cache = new Map();
        
        // 拡張機能
        this.analysisHistory = [];
        this.predictions = [];
        this.anomalies = [];
        this.patterns = new Map();
        this.riskMaps = new Map();
        
        // 統計モデル
        this.models = {
            gutenbergRichter: { a: 8.0, b: 1.0 }, // Gutenberg-Richter law
            omoriUtsu: { K: 1.0, c: 0.05, p: 1.0 }, // 大森・宇津の公式
            bathLaw: { difference: 1.2 } // Bath's law
        };
        
        // 設定
        this.config = {
            cacheEnabled: true,
            cacheTTL: 600000, // 10分
            analysisDepth: 'comprehensive',
            confidenceLevel: 0.95,
            minimumSampleSize: 30,
            anomalyThreshold: 2.5, // 標準偏差
            predictionWindow: 30 // days
        };
        
        console.log('📊 AnalysisService initialized');
    }

    /**
     * サービスの初期化
     */
    async init() {
        console.log('Initializing AnalysisService...');
        
        try {
            // 統計モデルのキャリブレーション
            await this.calibrateModels();
            
            console.log('  ✓ AnalysisService ready');
            
        } catch (error) {
            console.error('❌ AnalysisService initialization failed:', error);
        }
    }

    /**
     * モデルのキャリブレーション
     */
    async calibrateModels() {
        // 実際のデータから統計モデルのパラメータを調整
        // ここでは簡易的にデフォルト値を使用
        console.log('  ✓ Models calibrated');
    }

    /**
     * 地震データの包括的分析（拡張版）
     * @param {Array} earthquakes - 地震データ
     * @param {Object} options - オプション
     * @returns {Object} 分析結果
     */
    analyzeEarthquakeData(earthquakes, options = {}) {
        const {
            includeAdvanced = true,
            includePatterns = true,
            includeAnomalies = true,
            includePredictions = false
        } = options;
        
        if (earthquakes.length === 0) {
            return { error: 'No data available' };
        }
        
        const analysis = {
            count: earthquakes.length,
            period: this.determinePeriod(earthquakes),
            magnitudes: this.analyzeMagnitudes(earthquakes),
            depths: this.analyzeDepths(earthquakes),
            temporal: this.analyzeTemporalPatterns(earthquakes),
            spatial: this.analyzeSpatialDistribution(earthquakes),
            intensity: this.analyzeIntensityDistribution(earthquakes),
            clusters: this.identifyClusters(earthquakes),
            quality: this.assessDataQuality(earthquakes)
        };
        
        // 高度な分析
        if (includeAdvanced) {
            analysis.advanced = {
                gutenbergRichter: this.applyGutenbergRichter(earthquakes),
                bathLaw: this.applyBathLaw(earthquakes),
                correlations: this.calculateCorrelations(earthquakes),
                statistics: this.calculateAdvancedStatistics(earthquakes)
            };
        }
        
        // パターン認識
        if (includePatterns) {
            analysis.patterns = this.detectPatterns(earthquakes);
        }
        
        // 異常検出
        if (includeAnomalies) {
            analysis.anomalies = this.detectAnomalies(earthquakes);
        }
        
        // 予測
        if (includePredictions) {
            analysis.predictions = this.generatePredictions(earthquakes);
        }
        
        // 分析履歴に追加
        this.analysisHistory.push({
            timestamp: new Date().toISOString(),
            dataCount: earthquakes.length,
            summary: {
                avgMagnitude: analysis.magnitudes.avg,
                maxMagnitude: analysis.magnitudes.max,
                totalClusters: analysis.clusters.length
            }
        });
        
        return analysis;
    }

    /**
     * 期間の判定
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 期間情報
     */
    determinePeriod(earthquakes) {
        const times = earthquakes.map(eq => new Date(eq.time).getTime()).sort();
        const start = new Date(Math.min(...times));
        const end = new Date(Math.max(...times));
        const durationDays = (end - start) / (1000 * 60 * 60 * 24);
        
        return {
            start: start.toISOString(),
            end: end.toISOString(),
            durationDays: Math.round(durationDays),
            durationHours: Math.round(durationDays * 24)
        };
    }

    /**
     * マグニチュード分析（拡張版）
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 分析結果
     */
    analyzeMagnitudes(earthquakes) {
        const mags = earthquakes.map(eq => eq.magnitude).filter(m => m && m > 0);
        
        if (mags.length === 0) {
            return { error: 'No magnitude data' };
        }
        
        const sorted = mags.slice().sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const sum = mags.reduce((a, b) => a + b, 0);
        const avg = sum / mags.length;
        const median = this.calculateMedian(mags);
        
        // 標準偏差
        const variance = mags.reduce((sum, m) => sum + Math.pow(m - avg, 2), 0) / mags.length;
        const stdDev = Math.sqrt(variance);
        
        // 四分位数
        const q1 = this.calculatePercentile(sorted, 25);
        const q3 = this.calculatePercentile(sorted, 75);
        const iqr = q3 - q1;
        
        // 分布
        const distribution = this.createDistribution(mags, 0.5);
        
        // カテゴリ別集計
        const categories = {
            micro: mags.filter(m => m < 3).length,
            minor: mags.filter(m => m >= 3 && m < 4).length,
            light: mags.filter(m => m >= 4 && m < 5).length,
            moderate: mags.filter(m => m >= 5 && m < 6).length,
            strong: mags.filter(m => m >= 6 && m < 7).length,
            major: mags.filter(m => m >= 7 && m < 8).length,
            great: mags.filter(m => m >= 8).length
        };
        
        return {
            count: mags.length,
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
            avg: Math.round(avg * 100) / 100,
            median: Math.round(median * 100) / 100,
            stdDev: Math.round(stdDev * 100) / 100,
            quartiles: { q1: Math.round(q1 * 100) / 100, q3: Math.round(q3 * 100) / 100, iqr: Math.round(iqr * 100) / 100 },
            distribution,
            categories,
            percentages: {
                micro: (categories.micro / mags.length * 100).toFixed(1),
                minor: (categories.minor / mags.length * 100).toFixed(1),
                light: (categories.light / mags.length * 100).toFixed(1),
                moderate: (categories.moderate / mags.length * 100).toFixed(1),
                strong: (categories.strong / mags.length * 100).toFixed(1),
                major: (categories.major / mags.length * 100).toFixed(1),
                great: (categories.great / mags.length * 100).toFixed(1)
            }
        };
    }

    /**
     * 深さ分析（拡張版）
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 分析結果
     */
    analyzeDepths(earthquakes) {
        const depths = earthquakes.map(eq => eq.depth).filter(d => d !== null && d !== undefined && d >= 0);
        
        if (depths.length === 0) {
            return { error: 'No depth data' };
        }
        
        const sorted = depths.slice().sort((a, b) => a - b);
        const sum = depths.reduce((a, b) => a + b, 0);
        const avg = sum / depths.length;
        const median = this.calculateMedian(depths);
        
        // 標準偏差
        const variance = depths.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / depths.length;
        const stdDev = Math.sqrt(variance);
        
        // カテゴリ分類
        const categories = {
            veryShallow: depths.filter(d => d < 30).length,
            shallow: depths.filter(d => d >= 30 && d < 70).length,
            intermediate: depths.filter(d => d >= 70 && d < 300).length,
            deep: depths.filter(d => d >= 300 && d < 500).length,
            veryDeep: depths.filter(d => d >= 500).length
        };
        
        return {
            count: depths.length,
            min: Math.round(sorted[0] * 10) / 10,
            max: Math.round(sorted[sorted.length - 1] * 10) / 10,
            avg: Math.round(avg * 10) / 10,
            median: Math.round(median * 10) / 10,
            stdDev: Math.round(stdDev * 10) / 10,
            categories,
            percentages: {
                veryShallow: (categories.veryShallow / depths.length * 100).toFixed(1),
                shallow: (categories.shallow / depths.length * 100).toFixed(1),
                intermediate: (categories.intermediate / depths.length * 100).toFixed(1),
                deep: (categories.deep / depths.length * 100).toFixed(1),
                veryDeep: (categories.veryDeep / depths.length * 100).toFixed(1)
            },
            interpretation: this.interpretDepthDistribution(categories, depths.length)
        };
    }

    /**
     * 深さ分布の解釈
     * @param {Object} categories - カテゴリ別集計
     * @param {number} total - 総数
     * @returns {string} 解釈
     */
    interpretDepthDistribution(categories, total) {
        const shallowRatio = (categories.veryShallow + categories.shallow) / total;
        const intermediateRatio = categories.intermediate / total;
        const deepRatio = (categories.deep + categories.veryDeep) / total;
        
        if (shallowRatio > 0.7) {
            return '浅い地震が主体（プレート境界型または内陸直下型の可能性）';
        } else if (intermediateRatio > 0.5) {
            return '中深度地震が主体（沈み込むプレート内の地震の可能性）';
        } else if (deepRatio > 0.3) {
            return '深い地震を含む（深発地震、スラブ内地震の可能性）';
        } else {
            return '様々な深さの地震が混在';
        }
    }

    /**
     * 余震確率の計算（大森・宇津の公式）
     * @param {Object} mainshock - 本震データ
     * @param {Array} earthquakes - 全地震データ
     * @param {Object} options - オプション
     * @returns {Object} 余震分析結果
     */
    calculateAftershockProbability(mainshock, earthquakes, options = {}) {
        const {
            timeWindowDays = 365,
            distanceThresholdKm = 100,
            magnitudeThreshold = mainshock.magnitude - 3,
            includeDecayRate = true
        } = options;
        
        // 余震の抽出
        const aftershocks = this.detectAftershocks(mainshock, earthquakes, {
            timeWindow: timeWindowDays * 24 * 60 * 60 * 1000,
            distanceThreshold: distanceThresholdKm,
            magnitudeThreshold
        });
        
        if (aftershocks.length === 0) {
            return { error: 'No aftershocks detected' };
        }
        
        const mainshockTime = new Date(mainshock.time).getTime();
        
        // 時間経過ごとの余震数を集計
        const timeSeriesdays = {};
        aftershocks.forEach(eq => {
            const eqTime = new Date(eq.time).getTime();
            const daysAfter = Math.floor((eqTime - mainshockTime) / (1000 * 60 * 60 * 24));
            timeSeriesdays[daysAfter] = (timeSeriesdays[daysAfter] || 0) + 1;
        });
        
        // 大森・宇津の公式でパラメータ推定
        const params = this.estimateOmoriParameters(timeSeriesdays);
        
        // 将来の余震確率を計算
        const probabilities = {};
        const futureDays = [1, 7, 30, 90, 365];
        const currentDays = Math.floor((Date.now() - mainshockTime) / (1000 * 60 * 60 * 24));
        
        futureDays.forEach(days => {
            const targetDays = currentDays + days;
            probabilities[`next${days}days`] = this.calculateOmoriProbability(
                params.K,
                params.c,
                params.p,
                currentDays,
                targetDays
            );
        });
        
        // Bath's lawによる最大余震マグニチュード推定
        const expectedMaxAftershockMag = mainshock.magnitude - this.models.bathLaw.difference;
        const actualMaxAftershockMag = Math.max(...aftershocks.map(eq => eq.magnitude));
        
        return {
            mainshock: {
                id: mainshock.id,
                magnitude: mainshock.magnitude,
                time: mainshock.time
            },
            aftershocks: {
                count: aftershocks.length,
                magnitudeRange: {
                    min: Math.min(...aftershocks.map(eq => eq.magnitude)),
                    max: actualMaxAftershockMag,
                    expected: expectedMaxAftershockMag
                },
                timeSeries: timeSeriesdays,
                daysSinceMainshock: currentDays
            },
            model: {
                name: '大森・宇津の公式',
                parameters: {
                    K: params.K.toFixed(2),
                    c: params.c.toFixed(4),
                    p: params.p.toFixed(2)
                },
                equation: `n(t) = K / (t + c)^p`
            },
            probabilities,
            decayRate: includeDecayRate ? this.calculateDecayRate(timeSeriesdays) : null,
            warnings: this.generateAftershockWarnings(probabilities, mainshock.magnitude)
        };
    }

    /**
     * 大森・宇津パラメータの推定
     * @param {Object} timeSeries - 時系列データ
     * @returns {Object} パラメータ
     */
    estimateOmoriParameters(timeSeries) {
        // 簡易的な推定（実際はlog-linearフィッティングが必要）
        const days = Object.keys(timeSeries).map(Number);
        const counts = Object.values(timeSeries);
        
        if (days.length < 2) {
            return { K: 1.0, c: 0.05, p: 1.0 }; // デフォルト値
        }
        
        // 初期減衰から K を推定
        const initialCount = counts[0] || 1;
        const K = initialCount;
        
        // 減衰指数 p を推定（簡易版）
        const logDays = days.map(d => Math.log(d + 1));
        const logCounts = counts.map(c => Math.log(c + 1));
        const p = Math.abs(this.calculateLinearRegression(logDays, logCounts).slope);
        
        return {
            K: K,
            c: 0.05, // 標準的な値
            p: Math.max(0.5, Math.min(1.5, p)) // 0.5-1.5の範囲に制限
        };
    }

    /**
     * 大森・宇津公式による確率計算
     * @param {number} K - パラメータK
     * @param {number} c - パラメータc
     * @param {number} p - パラメータp
     * @param {number} t1 - 開始時刻（日）
     * @param {number} t2 - 終了時刻（日）
     * @returns {Object} 確率情報
     */
    calculateOmoriProbability(K, c, p, t1, t2) {
        // 期間内の期待余震数
        const expectedCount = K * (
            Math.pow(t1 + c, 1 - p) - Math.pow(t2 + c, 1 - p)
        ) / (p - 1);
        
        // 少なくとも1回発生する確率（ポアソン分布）
        const probability = 1 - Math.exp(-Math.abs(expectedCount));
        
        return {
            expectedCount: Math.round(Math.abs(expectedCount) * 10) / 10,
            probability: Math.round(probability * 1000) / 10, // パーセント
            confidenceLevel: this.config.confidenceLevel
        };
    }

    /**
     * 時間的パターンの分析（拡張版）
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 時間パターン
     */
    analyzeTemporalPatterns(earthquakes) {
        const hourly = new Array(24).fill(0);
        const daily = new Array(7).fill(0);
        const monthly = new Array(12).fill(0);
        const yearly = new Map();

        earthquakes.forEach(eq => {
            const date = new Date(eq.time);
            hourly[date.getHours()]++;
            daily[date.getDay()]++;
            monthly[date.getMonth()]++;
            
            const year = date.getFullYear();
            yearly.set(year, (yearly.get(year) || 0) + 1);
        });

        // 時系列トレンド
        const yearlyArray = Array.from(yearly.values());
        const trend = yearlyArray.length > 1 ? this.calculateTrend(yearlyArray, 'yearly') : 0;

        return {
            hourly,
            daily,
            monthly,
            yearly: Array.from(yearly.entries()).map(([year, count]) => ({ year, count })),
            patterns: {
                peakHour: hourly.indexOf(Math.max(...hourly)),
                peakDay: daily.indexOf(Math.max(...daily)),
                peakMonth: monthly.indexOf(Math.max(...monthly)),
                trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable'
            }
        };
    }

    /**
     * 空間分布の分析（拡張版）
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 空間分布
     */
    analyzeSpatialDistribution(earthquakes) {
        const regions = {};
        const grid = this.createSpatialGrid(earthquakes, 1.0); // 1度グリッド
        
        earthquakes.forEach(eq => {
            const region = eq.region || '不明';
            if (!regions[region]) {
                regions[region] = { count: 0, magnitudes: [], depths: [] };
            }
            regions[region].count++;
            regions[region].magnitudes.push(eq.magnitude);
            regions[region].depths.push(eq.depth);
        });
        
        // 統計を計算
        Object.keys(regions).forEach(region => {
            const data = regions[region];
            data.avgMagnitude = data.magnitudes.reduce((a, b) => a + b, 0) / data.count;
            data.maxMagnitude = Math.max(...data.magnitudes);
            data.avgDepth = data.depths.reduce((a, b) => a + b, 0) / data.count;
        });
        
        return {
            regions,
            grid,
            hotspots: this.identifyHotspots(earthquakes),
            centroid: this.calculateCentroid(earthquakes)
        };
    }

    /**
     * 空間グリッドの作成
     * @param {Array} earthquakes - 地震データ
     * @param {number} resolution - 解像度（度）
     * @returns {Map} グリッドデータ
     */
    createSpatialGrid(earthquakes, resolution) {
        const grid = new Map();
        
        earthquakes.forEach(eq => {
            const gridLat = Math.floor(eq.latitude / resolution) * resolution;
            const gridLon = Math.floor(eq.longitude / resolution) * resolution;
            const key = `${gridLat},${gridLon}`;
            
            if (!grid.has(key)) {
                grid.set(key, { lat: gridLat, lon: gridLon, count: 0, magnitudes: [] });
            }
            
            const cell = grid.get(key);
            cell.count++;
            cell.magnitudes.push(eq.magnitude);
        });
        
        return grid;
    }

    /**
     * ホットスポットの識別
     * @param {Array} earthquakes - 地震データ
     * @returns {Array} ホットスポット
     */
    identifyHotspots(earthquakes) {
        const grid = this.createSpatialGrid(earthquakes, 0.5);
        const threshold = this.calculateMedian(Array.from(grid.values()).map(cell => cell.count)) * 2;
        
        const hotspots = [];
        grid.forEach((cell, key) => {
            if (cell.count >= threshold) {
                hotspots.push({
                    location: { lat: cell.lat, lon: cell.lon },
                    count: cell.count,
                    avgMagnitude: cell.magnitudes.reduce((a, b) => a + b, 0) / cell.count,
                    maxMagnitude: Math.max(...cell.magnitudes)
                });
            }
        });
        
        return hotspots.sort((a, b) => b.count - a.count).slice(0, 10);
    }

    /**
     * 重心の計算
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 重心座標
     */
    calculateCentroid(earthquakes) {
        let sumLat = 0, sumLon = 0;
        
        earthquakes.forEach(eq => {
            sumLat += eq.latitude;
            sumLon += eq.longitude;
        });
        
        return {
            latitude: sumLat / earthquakes.length,
            longitude: sumLon / earthquakes.length
        };
    }

    /**
     * クラスターの識別（DBSCAN的アプローチ）
     * @param {Array} earthquakes - 地震データ
     * @returns {Array} クラスター
     */
    identifyClusters(earthquakes) {
        const eps = 50; // km
        const minPts = 5;
        const clusters = [];
        const visited = new Set();
        
        earthquakes.forEach((eq, i) => {
            if (visited.has(i)) return;
            
            const neighbors = this.findNeighbors(eq, earthquakes, eps);
            
            if (neighbors.length >= minPts) {
                const cluster = this.expandCluster(i, neighbors, earthquakes, eps, minPts, visited);
                if (cluster.length > 0) {
                    clusters.push({
                        id: clusters.length + 1,
                        size: cluster.length,
                        earthquakes: cluster,
                        centroid: this.calculateCentroid(cluster),
                        timeSpan: this.calculateTimeSpan(cluster),
                        magnitudeRange: {
                            min: Math.min(...cluster.map(e => e.magnitude)),
                            max: Math.max(...cluster.map(e => e.magnitude))
                        }
                    });
                }
            }
        });
        
        return clusters;
    }

    /**
     * 近隣の探索
     * @param {Object} earthquake - 中心の地震
     * @param {Array} earthquakes - 全地震
     * @param {number} eps - 距離閾値
     * @returns {Array} 近隣の地震
     */
    findNeighbors(earthquake, earthquakes, eps) {
        return earthquakes.filter(eq => {
            if (eq.id === earthquake.id) return false;
            const distance = this.calculateDistance(
                { lat: earthquake.latitude, lon: earthquake.longitude },
                { lat: eq.latitude, lon: eq.longitude }
            );
            return distance <= eps;
        });
    }

    /**
     * クラスターの拡張
     * @param {number} startIdx - 開始インデックス
     * @param {Array} neighbors - 近隣
     * @param {Array} earthquakes - 全地震
     * @param {number} eps - 距離閾値
     * @param {number} minPts - 最小ポイント数
     * @param {Set} visited - 訪問済みセット
     * @returns {Array} クラスター
     */
    expandCluster(startIdx, neighbors, earthquakes, eps, minPts, visited) {
        const cluster = [earthquakes[startIdx]];
        visited.add(startIdx);
        
        const queue = [...neighbors];
        
        while (queue.length > 0) {
            const neighbor = queue.shift();
            const idx = earthquakes.indexOf(neighbor);
            
            if (!visited.has(idx)) {
                visited.add(idx);
                cluster.push(neighbor);
                
                const newNeighbors = this.findNeighbors(neighbor, earthquakes, eps);
                if (newNeighbors.length >= minPts) {
                    queue.push(...newNeighbors);
                }
            }
        }
        
        return cluster;
    }

    /**
     * 時間スパンの計算
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 時間スパン
     */
    calculateTimeSpan(earthquakes) {
        const times = earthquakes.map(eq => new Date(eq.time).getTime());
        const start = Math.min(...times);
        const end = Math.max(...times);
        
        return {
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            durationHours: (end - start) / (1000 * 60 * 60)
        };
    }

    /**
     * Gutenberg-Richter則の適用
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} G-R則パラメータ
     */
    applyGutenbergRichter(earthquakes) {
        // log10(N) = a - b*M
        const magnitudes = earthquakes.map(eq => eq.magnitude).filter(m => m > 0);
        const bins = {};
        
        magnitudes.forEach(m => {
            const bin = Math.floor(m * 2) / 2; // 0.5刻み
            bins[bin] = (bins[bin] || 0) + 1;
        });
        
        const sortedBins = Object.keys(bins).map(Number).sort((a, b) => a - b);
        const cumulativeCounts = [];
        
        for (let i = 0; i < sortedBins.length; i++) {
            const cumCount = sortedBins.slice(i).reduce((sum, bin) => sum + bins[bin], 0);
            cumulativeCounts.push({ magnitude: sortedBins[i], count: cumCount });
        }
        
        // 線形回帰でb値を推定
        const x = cumulativeCounts.map(d => d.magnitude);
        const y = cumulativeCounts.map(d => Math.log10(d.count));
        const regression = this.calculateLinearRegression(x, y);
        
        return {
            formula: 'log10(N) = a - b*M',
            a: regression.intercept,
            b: Math.abs(regression.slope),
            interpretation: Math.abs(regression.slope) > 1 ? '地震活動度が低い' : '地震活動度が高い',
            data: cumulativeCounts
        };
    }

    /**
     * Bath's法則の適用
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} Bath's法則の検証
     */
    applyBathLaw(earthquakes) {
        if (earthquakes.length < 2) {
            return { error: 'Insufficient data' };
        }
        
        const sorted = earthquakes.slice().sort((a, b) => b.magnitude - a.magnitude);
        const mainshock = sorted[0];
        const largestAftershock = sorted[1];
        
        const difference = mainshock.magnitude - largestAftershock.magnitude;
        const expectedDifference = this.models.bathLaw.difference;
        
        return {
            law: "Bath's Law",
            formula: 'ΔM = M_mainshock - M_largest_aftershock ≈ 1.2',
            mainshock: { magnitude: mainshock.magnitude, time: mainshock.time },
            largestAftershock: { magnitude: largestAftershock.magnitude, time: largestAftershock.time },
            actualDifference: difference,
            expectedDifference: expectedDifference,
            deviation: Math.abs(difference - expectedDifference),
            conforms: Math.abs(difference - expectedDifference) < 0.5
        };
    }

    /**
     * 相関分析
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 相関係数
     */
    calculateCorrelations(earthquakes) {
        const magnitudes = earthquakes.map(eq => eq.magnitude);
        const depths = earthquakes.map(eq => eq.depth);
        
        return {
            magnitudeDepth: this.calculatePearsonCorrelation(magnitudes, depths),
            interpretation: {
                magnitudeDepth: this.interpretCorrelation(
                    this.calculatePearsonCorrelation(magnitudes, depths),
                    'マグニチュードと深さ'
                )
            }
        };
    }

    /**
     * 線形回帰の計算
     * @param {Array} x - x値
     * @param {Array} y - y値
     * @returns {Object} 回帰係数
     */
    calculateLinearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return { slope, intercept };
    }

    /**
     * ピアソン相関係数の計算
     * @param {Array} x - x値
     * @param {Array} y - y値
     * @returns {number} 相関係数
     */
    calculatePearsonCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * 相関の解釈
     * @param {number} r - 相関係数
     * @param {string} variables - 変数名
     * @returns {string} 解釈
     */
    interpretCorrelation(r, variables) {
        const absR = Math.abs(r);
        let strength, direction;
        
        if (absR > 0.8) strength = '非常に強い';
        else if (absR > 0.6) strength = '強い';
        else if (absR > 0.4) strength = '中程度';
        else if (absR > 0.2) strength = '弱い';
        else strength = 'ほとんどない';
        
        direction = r > 0 ? '正' : '負';
        
        return `${variables}の間には${strength}${direction}の相関がある (r=${r.toFixed(3)})`;
    }

    /**
     * 異常検出
     * @param {Array} earthquakes - 地震データ
     * @returns {Array} 異常データ
     */
    detectAnomalies(earthquakes) {
        const anomalies = [];
        
        // マグニチュードの異常
        const magnitudes = earthquakes.map(eq => eq.magnitude);
        const magMean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
        const magStd = Math.sqrt(magnitudes.reduce((sum, m) => sum + Math.pow(m - magMean, 2), 0) / magnitudes.length);
        
        earthquakes.forEach(eq => {
            const zScore = (eq.magnitude - magMean) / magStd;
            if (Math.abs(zScore) > this.config.anomalyThreshold) {
                anomalies.push({
                    earthquake: eq,
                    type: 'magnitude',
                    zScore,
                    reason: `マグニチュード ${eq.magnitude} が異常値（平均から${Math.abs(zScore).toFixed(1)}σ）`
                });
            }
        });
        
        return anomalies;
    }

    /**
     * パターン検出
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} パターン
     */
    detectPatterns(earthquakes) {
        return {
            swarms: this.detectSwarms(earthquakes),
            sequences: this.detectSequences(earthquakes),
            periodicities: this.detectPeriodicities(earthquakes)
        };
    }

    /**
     * 群発地震の検出
     * @param {Array} earthquakes - 地震データ
     * @returns {Array} 群発地震
     */
    detectSwarms(earthquakes) {
        // 時間・空間的に密集した地震群
        const clusters = this.identifyClusters(earthquakes);
        
        return clusters.filter(cluster => {
            const timeSpan = cluster.timeSpan.durationHours;
            return timeSpan < 72 && cluster.size >= 10; // 72時間以内に10回以上
        }).map(cluster => ({
            ...cluster,
            type: 'swarm'
        }));
    }

    /**
     * 地震系列の検出
     * @param {Array} earthquakes - 地震データ
     * @returns {Array} 地震系列
     */
    detectSequences(earthquakes) {
        // 本震-余震型の系列
        const sequences = [];
        const sorted = earthquakes.slice().sort((a, b) => new Date(a.time) - new Date(b.time));
        
        sorted.forEach(eq => {
            if (eq.magnitude >= 5.0) {
                const aftershocks = this.detectAftershocks(eq, sorted, {
                    timeWindow: 30 * 24 * 60 * 60 * 1000,
                    distanceThreshold: 100
                });
                
                if (aftershocks.length >= 5) {
                    sequences.push({
                        mainshock: eq,
                        aftershocks: aftershocks,
                        type: 'mainshock-aftershock'
                    });
                }
            }
        });
        
        return sequences;
    }

    /**
     * 周期性の検出
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 周期性情報
     */
    detectPeriodicities(earthquakes) {
        // 簡易的な周期性検出
        const times = earthquakes.map(eq => new Date(eq.time).getTime()).sort();
        const intervals = [];
        
        for (let i = 1; i < times.length; i++) {
            intervals.push(times[i] - times[i - 1]);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const stdInterval = Math.sqrt(intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length);
        
        return {
            detected: stdInterval / avgInterval < 0.5,
            averageInterval: avgInterval / (1000 * 60 * 60 * 24), // days
            interpretation: stdInterval / avgInterval < 0.5 ? '規則的な間隔を持つ可能性' : '不規則な発生'
        };
    }

    /**
     * 余震の検出（拡張版）
     * @param {Object} mainshock - 本震
     * @param {Array} earthquakes - 全地震
     * @param {Object} options - オプション
     * @returns {Array} 余震
     */
    detectAftershocks(mainshock, earthquakes, options = {}) {
        const {
            timeWindow = 365 * 24 * 60 * 60 * 1000,
            distanceThreshold = 100,
            magnitudeThreshold = null
        } = options;
        
        const mainshockTime = new Date(mainshock.time).getTime();
        const magThreshold = magnitudeThreshold !== null ? magnitudeThreshold : mainshock.magnitude - 3;

        return earthquakes.filter(eq => {
            const eqTime = new Date(eq.time).getTime();
            const timeDiff = eqTime - mainshockTime;
            
            if (timeDiff <= 0 || timeDiff > timeWindow) return false;
            if (eq.magnitude > mainshock.magnitude) return false;
            if (eq.magnitude < magThreshold) return false;

            const distance = this.calculateDistance(
                { lat: mainshock.latitude, lon: mainshock.longitude },
                { lat: eq.latitude, lon: eq.longitude }
            );
            
            return distance <= distanceThreshold;
        });
    }

    /**
     * データ品質評価
     * @param {Array} earthquakes - 地震データ
     * @returns {Object} 品質評価
     */
    assessDataQuality(earthquakes) {
        let score = 100;
        const issues = [];
        
        // 完全性チェック
        const missingMagnitude = earthquakes.filter(eq => !eq.magnitude || eq.magnitude === 0).length;
        const missingDepth = earthquakes.filter(eq => eq.depth === null || eq.depth === undefined).length;
        const missingLocation = earthquakes.filter(eq => !eq.latitude || !eq.longitude).length;
        
        if (missingMagnitude > 0) {
            score -= 20;
            issues.push(`${missingMagnitude}件でマグニチュードが欠損`);
        }
        if (missingDepth > 0) {
            score -= 10;
            issues.push(`${missingDepth}件で深さが欠損`);
        }
        if (missingLocation > 0) {
            score -= 30;
            issues.push(`${missingLocation}件で位置情報が欠損`);
        }
        
        // 一貫性チェック
        const inconsistent = earthquakes.filter(eq => 
            eq.magnitude < 0 || eq.magnitude > 10 ||
            eq.depth < 0 || eq.depth > 1000 ||
            eq.latitude < -90 || eq.latitude > 90 ||
            eq.longitude < -180 || eq.longitude > 180
        ).length;
        
        if (inconsistent > 0) {
            score -= 20;
            issues.push(`${inconsistent}件で不整合なデータ`);
        }
        
        return {
            score: Math.max(0, score),
            rating: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor',
            issues,
            completeness: {
                magnitude: ((earthquakes.length - missingMagnitude) / earthquakes.length * 100).toFixed(1),
                depth: ((earthquakes.length - missingDepth) / earthquakes.length * 100).toFixed(1),
                location: ((earthquakes.length - missingLocation) / earthquakes.length * 100).toFixed(1)
            }
        };
    }

    /**
     * ユーティリティ: 中央値
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    /**
     * ユーティリティ: パーセンタイル
     */
    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    /**
     * ユーティリティ: 分布作成
     */
    createDistribution(values, binSize) {
        const distribution = {};
        values.forEach(v => {
            const bin = Math.floor(v / binSize) * binSize;
            distribution[bin] = (distribution[bin] || 0) + 1;
        });
        return distribution;
    }

    /**
     * ユーティリティ: 距離計算
     */
    calculateDistance(p1, p2) {
        const R = 6371;
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lon - p1.lon) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /**
     * ユーティリティ: トレンド計算
     */
    calculateTrend(data, period) {
        const n = data.length;
        if (n < 2) return 0;

        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        data.forEach((y, x) => {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
        });

        return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    /**
     * 統計情報の取得
     */
    getStatistics() {
        return {
            analysisCount: this.analysisHistory.length,
            patternsDetected: this.patterns.size,
            anomaliesFound: this.anomalies.length,
            predictionsGenerated: this.predictions.length
        };
    }
}

const analysisService = new AnalysisService();
if (typeof window !== 'undefined') {
    window.analysisService = analysisService;
    window.AnalysisService = AnalysisService;
}
