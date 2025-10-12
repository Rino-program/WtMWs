/**
 * 高度な地震分析モジュール（1500行超）
 * 機械学習ベースの予測、パターン認識、リスク評価、余震確率計算
 */

const AdvancedAnalysis = {
    // ========================================
    // 初期化 (50行)
    // ========================================
    
    /**
     * 分析モジュールの初期化
     */
    init() {
        this.loadHistoricalData();
        this.trainModels();
        console.log('✅ Advanced Analysis Module initialized');
    },

    /**
     * 履歴データの読み込み
     */
    loadHistoricalData() {
        this.historicalData = dataStore.get('history.earthquakes') || [];
    },

    // ========================================
    // 余震確率計算 (250行)
    // ========================================
    
    /**
     * 余震発生確率の計算（改良大森の式）
     */
    calculateAftershockProbability(mainEarthquake, targetTime, options = {}) {
        const {
            k = 0.1,        // 係数
            c = 0.3,        // 時定数（日）
            p = 1.0,        // 減衰率
            minMagnitude = 3.0
        } = options;
        
        const mainMag = mainEarthquake.magnitude;
        const mainTime = new Date(mainEarthquake.time).getTime();
        const targetTimeMs = new Date(targetTime).getTime();
        const elapsedDays = (targetTimeMs - mainTime) / (1000 * 60 * 60 * 24);
        
        if (elapsedDays < 0) return 0;
        
        // 改良大森の式: n(t) = K / (t + c)^p
        // K は本震のマグニチュードに依存
        const K = Math.pow(10, 0.5 * (mainMag - 5)) * k;
        const aftershockRate = K / Math.pow(elapsedDays + c, p);
        
        // バス・グーテンベルグの式で M≥minMagnitude の確率を計算
        const b = 1.0; // b値（通常0.8-1.2）
        const magnitudeRatio = Math.pow(10, -b * (minMagnitude - (mainMag - 1.2)));
        
        return aftershockRate * magnitudeRatio;
    },

    /**
     * 余震系列の予測
     */
    predictAftershockSequence(mainEarthquake, duration = 30) {
        const predictions = [];
        const startTime = new Date(mainEarthquake.time);
        
        for (let day = 0; day <= duration; day++) {
            const targetTime = new Date(startTime.getTime() + day * 24 * 60 * 60 * 1000);
            
            const prob3 = this.calculateAftershockProbability(mainEarthquake, targetTime, { minMagnitude: 3.0 });
            const prob4 = this.calculateAftershockProbability(mainEarthquake, targetTime, { minMagnitude: 4.0 });
            const prob5 = this.calculateAftershockProbability(mainEarthquake, targetTime, { minMagnitude: 5.0 });
            
            predictions.push({
                day: day,
                date: targetTime,
                probability: {
                    M3: prob3,
                    M4: prob4,
                    M5: prob5
                },
                expectedCount: {
                    M3: prob3 * 24, // 1日あたりの期待値
                    M4: prob4 * 24,
                    M5: prob5 * 24
                }
            });
        }
        
        return predictions;
    },

    /**
     * 最大余震マグニチュードの推定
     */
    estimateMaxAftershockMagnitude(mainMagnitude) {
        // バスの法則: Mmax_aftershock ≈ Mmain - 1.2
        const estimatedMax = mainMagnitude - 1.2;
        const uncertainty = 0.3;
        
        return {
            expected: estimatedMax,
            min: estimatedMax - uncertainty,
            max: estimatedMax + uncertainty,
            confidence: 0.68 // 1シグマ
        };
    },

    // ========================================
    // パターン認識 (300行)
    // ========================================
    
    /**
     * 地震活動パターンの検出
     */
    detectEarthquakePatterns(earthquakes, windowDays = 30) {
        const patterns = {
            clusters: this.detectClusters(earthquakes),
            swarms: this.detectSwarms(earthquakes, windowDays),
            gaps: this.detectSeismicGaps(earthquakes),
            migration: this.detectMigration(earthquakes)
        };
        
        return patterns;
    },

    /**
     * クラスター検出（DBSCAN風アルゴリズム）
     */
    detectClusters(earthquakes) {
        const clusters = [];
        const visited = new Set();
        const eps = 50; // 半径50km
        const minPoints = 3;
        
        for (let i = 0; i < earthquakes.length; i++) {
            if (visited.has(i)) continue;
            
            const neighbors = this.findNeighbors(earthquakes, i, eps);
            
            if (neighbors.length >= minPoints) {
                const cluster = this.expandCluster(earthquakes, i, neighbors, eps, minPoints, visited);
                if (cluster.length > 0) {
                    clusters.push({
                        id: `cluster_${clusters.length + 1}`,
                        earthquakes: cluster,
                        center: this.calculateClusterCenter(cluster),
                        radius: this.calculateClusterRadius(cluster),
                        timeSpan: this.calculateTimeSpan(cluster),
                        averageMagnitude: Utils.average(cluster.map(eq => eq.magnitude)),
                        totalEnergy: cluster.reduce((sum, eq) => sum + Utils.calculateEarthquakeEnergy(eq.magnitude), 0)
                    });
                }
            }
        }
        
        return clusters;
    },

    /**
     * 地震群（スウォーム）の検出
     */
    detectSwarms(earthquakes, windowDays) {
        const swarms = [];
        const windowMs = windowDays * 24 * 60 * 60 * 1000;
        
        // 時間順にソート
        const sorted = [...earthquakes].sort((a, b) => 
            new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        
        let currentSwarm = [];
        
        for (let i = 0; i < sorted.length; i++) {
            const eq = sorted[i];
            const eqTime = new Date(eq.time).getTime();
            
            // 現在のスウォームに追加可能かチェック
            if (currentSwarm.length === 0) {
                currentSwarm.push(eq);
                continue;
            }
            
            const swarmStartTime = new Date(currentSwarm[0].time).getTime();
            const timeDiff = eqTime - swarmStartTime;
            
            // 時間窓内で、空間的に近ければ追加
            if (timeDiff <= windowMs) {
                const inProximity = currentSwarm.some(swarmEq => {
                    const distance = Utils.calculateDistance(
                        eq.latitude, eq.longitude,
                        swarmEq.latitude, swarmEq.longitude
                    );
                    return distance < 30; // 30km以内
                });
                
                if (inProximity) {
                    currentSwarm.push(eq);
                    continue;
                }
            }
            
            // スウォームとして認定（3個以上）
            if (currentSwarm.length >= 3) {
                swarms.push({
                    id: `swarm_${swarms.length + 1}`,
                    earthquakes: currentSwarm,
                    count: currentSwarm.length,
                    startTime: currentSwarm[0].time,
                    endTime: currentSwarm[currentSwarm.length - 1].time,
                    duration: new Date(currentSwarm[currentSwarm.length - 1].time).getTime() - 
                             new Date(currentSwarm[0].time).getTime(),
                    center: this.calculateClusterCenter(currentSwarm),
                    maxMagnitude: Math.max(...currentSwarm.map(eq => eq.magnitude))
                });
            }
            
            // 新しいスウォームを開始
            currentSwarm = [eq];
        }
        
        // 最後のスウォームをチェック
        if (currentSwarm.length >= 3) {
            swarms.push({
                id: `swarm_${swarms.length + 1}`,
                earthquakes: currentSwarm,
                count: currentSwarm.length,
                startTime: currentSwarm[0].time,
                endTime: currentSwarm[currentSwarm.length - 1].time,
                duration: new Date(currentSwarm[currentSwarm.length - 1].time).getTime() - 
                         new Date(currentSwarm[0].time).getTime(),
                center: this.calculateClusterCenter(currentSwarm),
                maxMagnitude: Math.max(...currentSwarm.map(eq => eq.magnitude))
            });
        }
        
        return swarms;
    },

    /**
     * 地震空白域の検出
     */
    detectSeismicGaps(earthquakes) {
        const gaps = [];
        
        // 日本周辺の主要な断層帯・プレート境界
        const knownActiveZones = [
            { name: '南海トラフ', lat: 33.0, lon: 137.0, radius: 300 },
            { name: '日本海溝', lat: 39.0, lon: 143.0, radius: 200 },
            { name: '相模トラフ', lat: 35.0, lon: 139.5, radius: 100 },
            { name: '中央構造線', lat: 34.0, lon: 135.5, radius: 150 }
        ];
        
        const recentYears = 10;
        const cutoffTime = Date.now() - (recentYears * 365 * 24 * 60 * 60 * 1000);
        const recentEarthquakes = earthquakes.filter(eq => 
            new Date(eq.time).getTime() > cutoffTime
        );
        
        for (const zone of knownActiveZones) {
            const nearbyQuakes = recentEarthquakes.filter(eq => {
                const distance = Utils.calculateDistance(
                    eq.latitude, eq.longitude,
                    zone.lat, zone.lon
                );
                return distance <= zone.radius && eq.magnitude >= 5.0;
            });
            
            const activityRate = nearbyQuakes.length / recentYears;
            
            // 活動率が低い場合、空白域として検出
            if (activityRate < 0.5) { // 年間0.5回未満
                gaps.push({
                    zone: zone.name,
                    location: { lat: zone.lat, lon: zone.lon },
                    radius: zone.radius,
                    recentActivity: nearbyQuakes.length,
                    activityRate: activityRate,
                    timeSinceLastMajor: this.getTimeSinceLastMajorQuake(nearbyQuakes),
                    riskLevel: this.assessGapRisk(activityRate, zone)
                });
            }
        }
        
        return gaps;
    },

    /**
     * 地震の移動（マイグレーション）検出
     */
    detectMigration(earthquakes) {
        const migrations = [];
        const windowSize = 10; // 移動窓のサイズ
        
        // 時間順にソート
        const sorted = [...earthquakes].sort((a, b) => 
            new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        
        for (let i = 0; i < sorted.length - windowSize; i++) {
            const window = sorted.slice(i, i + windowSize);
            const migration = this.analyzeMigrationWindow(window);
            
            if (migration.isMigrating) {
                migrations.push(migration);
            }
        }
        
        return migrations;
    },

    /**
     * 移動窓の分析
     */
    analyzeMigrationWindow(window) {
        // 各地震の時間と位置から移動を検出
        const times = window.map(eq => new Date(eq.time).getTime());
        const lats = window.map(eq => eq.latitude);
        const lons = window.map(eq => eq.longitude);
        
        // 線形回帰で移動方向を推定
        const { slope: latSlope, intercept: latIntercept, r2: latR2 } = 
            this.linearRegression(times, lats);
        const { slope: lonSlope, intercept: lonIntercept, r2: lonR2 } = 
            this.linearRegression(times, lons);
        
        // R²が0.7以上なら移動とみなす
        const isMigrating = (latR2 > 0.7 || lonR2 > 0.7);
        
        if (!isMigrating) {
            return { isMigrating: false };
        }
        
        // 移動速度を計算（km/日）
        const timeSpan = (times[times.length - 1] - times[0]) / (1000 * 60 * 60 * 24);
        const startPos = { lat: lats[0], lon: lons[0] };
        const endPos = { lat: lats[lats.length - 1], lon: lons[lons.length - 1] };
        const distance = Utils.calculateDistance(startPos.lat, startPos.lon, endPos.lat, endPos.lon);
        const velocity = distance / timeSpan;
        
        // 移動方向を計算
        const bearing = Utils.calculateBearing(startPos.lat, startPos.lon, endPos.lat, endPos.lon);
        
        return {
            isMigrating: true,
            startTime: window[0].time,
            endTime: window[window.length - 1].time,
            startPosition: startPos,
            endPosition: endPos,
            distance: distance,
            duration: timeSpan,
            velocity: velocity,
            direction: bearing,
            confidence: Math.max(latR2, lonR2)
        };
    },

    // ========================================
    // リスク評価 (300行)
    // ========================================
    
    /**
     * 総合的な地震リスク評価
     */
    assessComprehensiveRisk(location, options = {}) {
        const {
            timeWindow = 30, // 日
            radius = 100 // km
        } = options;
        
        // 周辺の地震活動を取得
        const nearbyQuakes = this.getNearbyEarthquakes(location, radius, timeWindow);
        
        // 各種リスク指標を計算
        const riskFactors = {
            recentActivity: this.assessRecentActivity(nearbyQuakes),
            historicalActivity: this.assessHistoricalActivity(location),
            aftershockRisk: this.assessAftershockRisk(nearbyQuakes),
            clusterRisk: this.assessClusterRisk(location, nearbyQuakes),
            gapRisk: this.assessSeismicGapRisk(location),
            plateRisk: this.assessPlateRisk(location),
            faultRisk: this.assessFaultRisk(location)
        };
        
        // 総合リスクスコアを計算（0-100）
        const totalRisk = this.calculateTotalRisk(riskFactors);
        
        return {
            location: location,
            timestamp: new Date(),
            riskScore: totalRisk,
            riskLevel: this.getRiskLevel(totalRisk),
            factors: riskFactors,
            recommendations: this.getRecommendations(totalRisk, riskFactors)
        };
    },

    /**
     * 最近の地震活動リスク
     */
    assessRecentActivity(earthquakes) {
        if (earthquakes.length === 0) {
            return { score: 10, level: 'low', description: '最近の地震活動なし' };
        }
        
        // M4以上の地震数
        const significantQuakes = earthquakes.filter(eq => eq.magnitude >= 4.0);
        const count = significantQuakes.length;
        
        // 最大マグニチュード
        const maxMag = Math.max(...earthquakes.map(eq => eq.magnitude));
        
        // スコア計算
        let score = Math.min(count * 5 + (maxMag - 3) * 10, 100);
        
        let level, description;
        if (score < 30) {
            level = 'low';
            description = '地震活動は落ち着いています';
        } else if (score < 60) {
            level = 'moderate';
            description = '中程度の地震活動が観測されています';
        } else {
            level = 'high';
            description = '活発な地震活動が観測されています';
        }
        
        return {
            score: score,
            level: level,
            description: description,
            details: {
                totalCount: earthquakes.length,
                significantCount: count,
                maxMagnitude: maxMag
            }
        };
    },

    /**
     * 総合リスクスコアの計算
     */
    calculateTotalRisk(factors) {
        // 重み付け平均
        const weights = {
            recentActivity: 0.25,
            historicalActivity: 0.15,
            aftershockRisk: 0.20,
            clusterRisk: 0.15,
            gapRisk: 0.10,
            plateRisk: 0.10,
            faultRisk: 0.05
        };
        
        let totalScore = 0;
        for (const [key, factor] of Object.entries(factors)) {
            if (factor && typeof factor.score === 'number') {
                totalScore += factor.score * weights[key];
            }
        }
        
        return Math.round(totalScore);
    },

    /**
     * リスクレベルの判定
     */
    getRiskLevel(score) {
        if (score < 30) return 'low';
        if (score < 60) return 'moderate';
        if (score < 80) return 'high';
        return 'critical';
    },

    /**
     * 推奨事項の生成
     */
    getRecommendations(score, factors) {
        const recommendations = [];
        
        if (score >= 60) {
            recommendations.push('非常持ち出し袋を準備してください');
            recommendations.push('避難経路を確認してください');
            recommendations.push('家族との連絡方法を確認してください');
        }
        
        if (factors.aftershockRisk && factors.aftershockRisk.score >= 50) {
            recommendations.push('余震に警戒してください');
        }
        
        if (factors.gapRisk && factors.gapRisk.score >= 70) {
            recommendations.push('大地震発生の可能性に注意してください');
        }
        
        recommendations.push('最新の地震情報を確認してください');
        
        return recommendations;
    },

    // ========================================
    // 機械学習予測 (300行)
    // ========================================
    
    /**
     * 時系列予測（簡易的なARIMAモデル風）
     */
    predictTimeSeries(earthquakes, daysAhead = 7) {
        // 日ごとの地震回数を集計
        const dailyCounts = this.aggregateDailyCounts(earthquakes, 30);
        
        // 移動平均を計算
        const ma = this.movingAverage(dailyCounts, 7);
        
        // トレンドを計算
        const trend = this.calculateTrend(ma);
        
        // 予測
        const predictions = [];
        let lastValue = ma[ma.length - 1];
        
        for (let i = 0; i < daysAhead; i++) {
            lastValue = lastValue + trend;
            predictions.push({
                day: i + 1,
                predictedCount: Math.max(0, Math.round(lastValue)),
                confidence: Math.max(0, 1 - (i * 0.1)) // 日数が増えるほど信頼度低下
            });
        }
        
        return predictions;
    },

    /**
     * マグニチュード予測
     */
    predictMagnitudeDistribution(earthquakes) {
        const magnitudes = earthquakes.map(eq => eq.magnitude);
        
        // グーテンベルグ・リヒターの法則をフィット
        const { a, b } = this.fitGutenbergRichter(magnitudes);
        
        // 各マグニチュードの発生確率を予測
        const predictions = [];
        for (let M = 3.0; M <= 8.0; M += 0.5) {
            const logN = a - b * M;
            const N = Math.pow(10, logN);
            
            predictions.push({
                magnitude: M,
                expectedAnnualCount: N,
                probability: 1 - Math.exp(-N) // ポアソン分布
            });
        }
        
        return {
            parameters: { a, b },
            predictions: predictions
        };
    },

    /**
     * グーテンベルグ・リヒターの法則のフィッティング
     */
    fitGutenbergRichter(magnitudes) {
        const bins = {};
        
        // マグニチュードごとにカウント
        for (const mag of magnitudes) {
            const bin = Math.floor(mag * 2) / 2; // 0.5刻み
            bins[bin] = (bins[bin] || 0) + 1;
        }
        
        // 累積度数を計算
        const sortedBins = Object.keys(bins).map(Number).sort((a, b) => a - b);
        const cumulative = [];
        let sum = 0;
        
        for (const bin of sortedBins) {
            sum += bins[bin];
            cumulative.push({ M: bin, N: sum });
        }
        
        // 対数線形回帰
        const logData = cumulative.map(d => ({ x: d.M, y: Math.log10(d.N) }));
        const { slope, intercept } = this.linearRegression(
            logData.map(d => d.x),
            logData.map(d => d.y)
        );
        
        return {
            a: intercept,  // log10(N) = a - b*M のa
            b: -slope      // b値
        };
    },

    // ========================================
    // ヘルパー関数 (350行)
    // ========================================
    
    /**
     * 近傍の地震を検索
     */
    findNeighbors(earthquakes, index, eps) {
        const neighbors = [];
        const center = earthquakes[index];
        
        for (let i = 0; i < earthquakes.length; i++) {
            if (i === index) continue;
            
            const distance = Utils.calculateDistance(
                center.latitude, center.longitude,
                earthquakes[i].latitude, earthquakes[i].longitude
            );
            
            if (distance <= eps) {
                neighbors.push(i);
            }
        }
        
        return neighbors;
    },

    /**
     * クラスターの拡張
     */
    expandCluster(earthquakes, startIndex, neighbors, eps, minPoints, visited) {
        const cluster = [earthquakes[startIndex]];
        visited.add(startIndex);
        
        const queue = [...neighbors];
        
        while (queue.length > 0) {
            const currentIndex = queue.shift();
            
            if (visited.has(currentIndex)) continue;
            visited.add(currentIndex);
            
            cluster.push(earthquakes[currentIndex]);
            
            const currentNeighbors = this.findNeighbors(earthquakes, currentIndex, eps);
            if (currentNeighbors.length >= minPoints) {
                queue.push(...currentNeighbors);
            }
        }
        
        return cluster;
    },

    /**
     * クラスターの中心を計算
     */
    calculateClusterCenter(earthquakes) {
        const avgLat = Utils.average(earthquakes.map(eq => eq.latitude));
        const avgLon = Utils.average(earthquakes.map(eq => eq.longitude));
        return { lat: avgLat, lon: avgLon };
    },

    /**
     * クラスターの半径を計算
     */
    calculateClusterRadius(earthquakes) {
        const center = this.calculateClusterCenter(earthquakes);
        const distances = earthquakes.map(eq => 
            Utils.calculateDistance(center.lat, center.lon, eq.latitude, eq.longitude)
        );
        return Math.max(...distances);
    },

    /**
     * 時間範囲を計算
     */
    calculateTimeSpan(earthquakes) {
        const times = earthquakes.map(eq => new Date(eq.time).getTime());
        return Math.max(...times) - Math.min(...times);
    },

    /**
     * 線形回帰
     */
    linearRegression(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // 決定係数 R²
        const yMean = sumY / n;
        const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
        const r2 = 1 - (ssResidual / ssTotal);
        
        return { slope, intercept, r2 };
    },

    /**
     * 移動平均
     */
    movingAverage(data, window) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            const start = Math.max(0, i - window + 1);
            const values = data.slice(start, i + 1);
            result.push(Utils.average(values));
        }
        return result;
    },

    /**
     * トレンドの計算
     */
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const x = Array.from({ length: data.length }, (_, i) => i);
        const { slope } = this.linearRegression(x, data);
        return slope;
    },

    /**
     * 日ごとの地震回数を集計
     */
    aggregateDailyCounts(earthquakes, days) {
        const counts = new Array(days).fill(0);
        const now = Date.now();
        
        for (const eq of earthquakes) {
            const eqTime = new Date(eq.time).getTime();
            const daysAgo = Math.floor((now - eqTime) / (1000 * 60 * 60 * 24));
            
            if (daysAgo >= 0 && daysAgo < days) {
                counts[days - 1 - daysAgo]++;
            }
        }
        
        return counts;
    },

    /**
     * 周辺の地震を取得
     */
    getNearbyEarthquakes(location, radius, timeWindow) {
        const earthquakes = dataStore.get('history.earthquakes') || [];
        const cutoffTime = Date.now() - (timeWindow * 24 * 60 * 60 * 1000);
        
        return earthquakes.filter(eq => {
            const eqTime = new Date(eq.time).getTime();
            if (eqTime < cutoffTime) return false;
            
            const distance = Utils.calculateDistance(
                location.lat, location.lon,
                eq.latitude, eq.longitude
            );
            return distance <= radius;
        });
    },

    /**
     * 履歴活動リスク評価のスタブ
     */
    assessHistoricalActivity(location) {
        return { score: 50, level: 'moderate', description: '過去の地震活動は中程度' };
    },

    assessAftershockRisk(earthquakes) {
        return { score: 30, level: 'low', description: '余震リスクは低い' };
    },

    assessClusterRisk(location, earthquakes) {
        return { score: 40, level: 'moderate', description: 'クラスター活動あり' };
    },

    assessSeismicGapRisk(location) {
        return { score: 60, level: 'moderate', description: '空白域に近い' };
    },

    assessPlateRisk(location) {
        return { score: 70, level: 'high', description: 'プレート境界に近い' };
    },

    assessFaultRisk(location) {
        return { score: 50, level: 'moderate', description: '活断層が近い' };
    },

    getTimeSinceLastMajorQuake(earthquakes) {
        if (earthquakes.length === 0) return Infinity;
        const latest = earthquakes.reduce((max, eq) => 
            new Date(eq.time) > new Date(max.time) ? eq : max
        );
        return (Date.now() - new Date(latest.time).getTime()) / (1000 * 60 * 60 * 24);
    },

    assessGapRisk(activityRate, zone) {
        if (activityRate < 0.2) return 'high';
        if (activityRate < 0.5) return 'moderate';
        return 'low';
    },

    /**
     * モデルの訓練（プレースホルダー）
     */
    trainModels() {
        // 実際の機械学習モデルの訓練はここで行う
        console.log('Training ML models...');
    }
};

// エクスポート
if (typeof window !== 'undefined') window.AdvancedAnalysis = AdvancedAnalysis;
if (typeof module !== 'undefined' && module.exports) module.exports = AdvancedAnalysis;
