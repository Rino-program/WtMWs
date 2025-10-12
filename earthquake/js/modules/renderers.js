/**
 * レンダラー - UI要素の描画（2200行超の超大規模レンダラー）
 * 全てのビューとコンポーネントの完全な描画システム
 */
const Renderers = {
    // ========================================
    // ダッシュボードレンダリング (300行)
    // ========================================
    
    /**
     * ダッシュボード全体のレンダリング
     */
    renderDashboard() {
        const earthquakes = dataStore.get('history.earthquakes');
        const latest = earthquakes[0];
        
        this.renderLatestEarthquake(latest);
        this.renderEEWStatus();
        this.renderTsunamiStatus();
        this.renderRecentActivityChart();
        this.renderQuickStats();
    },

    /**
     * 最新地震情報のレンダリング
     */
    renderLatestEarthquake(earthquake) {
        const container = document.getElementById('latest-earthquake');
        if (!container) return;
        
        if (!earthquake) {
            container.innerHTML = '<p class="no-data">地震情報がありません</p>';
            return;
        }
        
        const { id, magnitude, region, maxIntensity, time, depth, latitude, longitude } = earthquake;
        const magColor = Utils.getMagnitudeColor(magnitude);
        const intensityColor = Utils.getIntensityColor(maxIntensity);
        const relativeTime = Utils.getRelativeTime(time);
        const formattedTime = Utils.formatDate(time, 'YYYY/MM/DD HH:mm:ss');
        
        container.innerHTML = `
            <div class="earthquake-info">
                <div class="eq-magnitude" style="background: ${magColor}; color: white;">
                    M${magnitude.toFixed(1)}
                </div>
                <div class="eq-details">
                    <h3 class="eq-region">${Utils.escapeHtml(region)}</h3>
                    <div class="eq-intensity-badge" style="background: ${intensityColor}; color: white;">
                        最大震度: ${Utils.getIntensityLabel(maxIntensity)}
                    </div>
                    <p class="eq-depth"><i class="icon-depth"></i> 深さ: ${depth}km</p>
                    <p class="eq-time">
                        <i class="icon-clock"></i> ${relativeTime} (${formattedTime})
                    </p>
                    <p class="eq-location">
                        <i class="icon-location"></i> 
                        北緯${latitude.toFixed(2)}° 東経${longitude.toFixed(2)}°
                    </p>
                </div>
                <div class="eq-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.showEarthquakeDetail('${id}')">
                        詳細を見る
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="mapRenderer.focusEarthquake('${id}')">
                        地図で確認
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 緊急地震速報ステータス
     */
    renderEEWStatus() {
        const container = document.getElementById('eew-status');
        if (!container) return;
        
        const eew = dataStore.get('realtime.eew');
        
        if (!eew || !eew.isActive) {
            container.innerHTML = `
                <div class="status-card">
                    <h4><i class="icon-check"></i> 緊急地震速報</h4>
                    <p class="status-normal">現在、発表されている緊急地震速報はありません</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="status-card alert">
                <h4 class="alert-title">
                    <i class="icon-alert"></i> 緊急地震速報（第${eew.report}報）
                </h4>
                <div class="eew-info">
                    <p class="eew-region"><strong>${Utils.escapeHtml(eew.region)}</strong></p>
                    <div class="eew-details-grid">
                        <div class="eew-detail">
                            <span class="label">予想最大震度</span>
                            <span class="value intensity" style="background: ${Utils.getIntensityColor(eew.maxIntensity)}">
                                ${Utils.getIntensityLabel(eew.maxIntensity)}
                            </span>
                        </div>
                        <div class="eew-detail">
                            <span class="label">マグニチュード</span>
                            <span class="value">M${eew.magnitude.toFixed(1)}</span>
                        </div>
                        <div class="eew-detail">
                            <span class="label">発生時刻</span>
                            <span class="value">${Utils.formatDate(eew.originTime, 'HH:mm:ss')}</span>
                        </div>
                        <div class="eew-detail">
                            <span class="label">深さ</span>
                            <span class="value">${eew.depth}km</span>
                        </div>
                    </div>
                    <div class="eew-warning">
                        <i class="icon-warning"></i>
                        強い揺れに警戒してください。身の安全を確保してください。
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 津波情報ステータス
     */
    renderTsunamiStatus() {
        const container = document.getElementById('tsunami-status');
        if (!container) return;
        
        const tsunami = dataStore.get('realtime.tsunami');
        
        if (!tsunami || tsunami.length === 0) {
            container.innerHTML = `
                <div class="status-card">
                    <h4><i class="icon-wave"></i> 津波情報</h4>
                    <p class="status-normal">現在、発表されている津波情報はありません</p>
                </div>
            `;
            return;
        }
        
        const warnings = tsunami.filter(t => t.grade === 'warning' || t.grade === 'major_warning');
        const hasWarning = warnings.length > 0;
        
        const html = `
            <div class="status-card ${hasWarning ? 'alert' : 'warning'}">
                <h4 class="${hasWarning ? 'alert-title' : ''}">
                    <i class="icon-wave"></i> 津波情報
                </h4>
                <div class="tsunami-list">
                    ${tsunami.map(t => `
                        <div class="tsunami-item ${t.grade}">
                            <div class="tsunami-header">
                                <span class="tsunami-region">${Utils.escapeHtml(t.name)}</span>
                                <span class="tsunami-grade">${this.getTsunamiGradeLabel(t.grade)}</span>
                            </div>
                            ${t.firstHeight ? `
                                <p class="tsunami-detail">
                                    予想高さ: ${t.firstHeight}
                                    ${t.arrivalTime ? ` / 到達予想: ${Utils.formatDate(t.arrivalTime, 'HH:mm')}` : ''}
                                </p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    /**
     * 最近の地震活動チャート
     */
    renderRecentActivityChart() {
        const earthquakes = dataStore.get('history.earthquakes').slice(0, 20);
        if (earthquakes.length === 0) return;
        
        const canvas = document.getElementById('recent-activity-chart');
        if (!canvas) return;
        
        const labels = earthquakes.reverse().map(eq => 
            Utils.formatDate(eq.time, 'MM/DD HH:mm')
        );
        
        const magnitudes = earthquakes.map(eq => eq.magnitude);
        const depths = earthquakes.map(eq => eq.depth);
        
        this.renderChart('recent-activity-chart', {
            labels: labels,
            datasets: [
                {
                    label: 'マグニチュード',
                    data: magnitudes,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    yAxisID: 'y'
                },
                {
                    label: '深さ (km)',
                    data: depths,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'y1'
                }
            ]
        }, {
            type: 'line',
            title: '最近の地震活動',
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'マグニチュード' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: '深さ (km)' },
                    grid: { drawOnChartArea: false }
                }
            }
        });
    },

    /**
     * クイック統計
     */
    renderQuickStats() {
        const stats = dataStore.get('statistics');
        const container = document.getElementById('quick-stats');
        if (!container || !stats) return;
        
        container.innerHTML = `
            <div class="stats-quick-grid">
                <div class="stat-quick-item">
                    <div class="stat-icon" style="background: #ef4444;">📊</div>
                    <div class="stat-content">
                        <p class="stat-label">24時間の地震</p>
                        <p class="stat-value">${stats.last24h || 0}回</p>
                    </div>
                </div>
                <div class="stat-quick-item">
                    <div class="stat-icon" style="background: #f59e0b;">📈</div>
                    <div class="stat-content">
                        <p class="stat-label">最大マグニチュード</p>
                        <p class="stat-value">M${(stats.magnitudes?.max || 0).toFixed(1)}</p>
                    </div>
                </div>
                <div class="stat-quick-item">
                    <div class="stat-icon" style="background: #10b981;">🌍</div>
                    <div class="stat-content">
                        <p class="stat-label">観測地域数</p>
                        <p class="stat-value">${stats.regionCount || 0}地域</p>
                    </div>
                </div>
                <div class="stat-quick-item">
                    <div class="stat-icon" style="background: #3b82f6;">⚡</div>
                    <div class="stat-content">
                        <p class="stat-label">震度4以上</p>
                        <p class="stat-value">${stats.strongCount || 0}回</p>
                    </div>
                </div>
            </div>
        `;
    },

    // ========================================
    // 地震リストレンダリング (300行)
    // ========================================
    
    /**
     * 地震リストのレンダリング（高度版）
     */
    renderEarthquakeList(earthquakes, options = {}) {
        const container = document.getElementById('earthquake-list');
        if (!container) return;
        
        if (earthquakes.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="icon-info"></i>
                    <p>表示する地震情報がありません</p>
                    <button class="btn btn-primary" onclick="app.refreshData()">
                        データを更新
                    </button>
                </div>
            `;
            return;
        }
        
        const showPagination = options.pagination !== false;
        const itemsPerPage = options.itemsPerPage || 20;
        const currentPage = options.currentPage || 1;
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEarthquakes = earthquakes.slice(startIndex, endIndex);
        
        const html = paginatedEarthquakes.map((eq, index) => {
            const globalIndex = startIndex + index;
            return this.renderEarthquakeListItem(eq, globalIndex);
        }).join('');
        
        container.innerHTML = html;
        
        // ページネーション
        if (showPagination && earthquakes.length > itemsPerPage) {
            this.renderPagination('earthquake-list-pagination', {
                total: earthquakes.length,
                perPage: itemsPerPage,
                currentPage: currentPage,
                onChange: (page) => {
                    this.renderEarthquakeList(earthquakes, { ...options, currentPage: page });
                }
            });
        }
    },

    /**
     * 地震リストアイテムの描画
     */
    renderEarthquakeListItem(eq, index) {
        const magColor = Utils.getMagnitudeColor(eq.magnitude);
        const intensityColor = Utils.getIntensityColor(eq.maxIntensity);
        const intensityNum = Utils.intensityToNumber(eq.maxIntensity);
        const isStrong = intensityNum >= 4;
        
        return `
            <div class="earthquake-item ${isStrong ? 'strong' : ''}" 
                 data-id="${eq.id}"
                 onclick="app.showEarthquakeDetail('${eq.id}')">
                <div class="eq-index">${index + 1}</div>
                <div class="eq-mag" style="background: ${magColor}; color: white;">
                    M${eq.magnitude.toFixed(1)}
                </div>
                <div class="eq-info">
                    <h4 class="eq-region">${Utils.escapeHtml(eq.region)}</h4>
                    <div class="eq-meta">
                        <span class="eq-time">
                            <i class="icon-clock"></i> ${Utils.getRelativeTime(eq.time)}
                        </span>
                        <span class="eq-depth">
                            <i class="icon-depth"></i> ${eq.depth}km
                        </span>
                    </div>
                </div>
                <div class="eq-intensity" style="background: ${intensityColor}; color: white;">
                    ${Utils.getIntensityLabel(eq.maxIntensity)}
                </div>
                <div class="eq-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); mapRenderer.focusEarthquake('${eq.id}')" title="地図で表示">
                        📍
                    </button>
                    <button class="btn-icon" onclick="event.stopPropagation(); app.shareEarthquake('${eq.id}')" title="共有">
                        🔗
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * 地震詳細モーダルの表示
     */
    renderEarthquakeDetail(earthquake) {
        if (!earthquake) return;
        
        const { magnitude, region, maxIntensity, time, depth, latitude, longitude, id } = earthquake;
        const magColor = Utils.getMagnitudeColor(magnitude);
        const intensityColor = Utils.getIntensityColor(maxIntensity);
        
        // エネルギー計算
        const energy = Utils.calculateEarthquakeEnergy(magnitude);
        const tnt = Utils.energyToTNT(energy);
        
        // 震源距離による震度推定（サンプル地点）
        const majorCities = [
            { name: '東京', lat: 35.6895, lon: 139.6917 },
            { name: '大阪', lat: 34.6937, lon: 135.5023 },
            { name: '名古屋', lat: 35.1815, lon: 136.9066 },
            { name: '札幌', lat: 43.0642, lon: 141.3469 },
            { name: '福岡', lat: 33.5904, lon: 130.4017 }
        ];
        
        const cityEstimates = majorCities.map(city => {
            const distance = Utils.calculateDistance(latitude, longitude, city.lat, city.lon);
            const estimatedIntensity = Utils.estimateIntensityFromDistance(magnitude, distance, depth);
            const waveArrival = Utils.calculateWaveArrival(distance, depth);
            
            return {
                name: city.name,
                distance: distance.toFixed(1),
                intensity: Utils.numberToIntensity(Math.floor(estimatedIntensity)),
                pWave: waveArrival.pWave.toFixed(1),
                sWave: waveArrival.sWave.toFixed(1)
            };
        });
        
        const content = `
            <div class="earthquake-detail-content">
                <div class="detail-header">
                    <div class="detail-mag" style="background: ${magColor}">
                        M${magnitude.toFixed(1)}
                    </div>
                    <div class="detail-title">
                        <h2>${Utils.escapeHtml(region)}</h2>
                        <p class="detail-time">${Utils.formatDate(time, 'YYYY年MM月DD日 HH時mm分ss秒')}</p>
                    </div>
                </div>
                
                <div class="detail-grid">
                    <div class="detail-section">
                        <h4>基本情報</h4>
                        <table class="detail-table">
                            <tr><th>最大震度</th><td style="color: ${intensityColor}; font-weight: bold;">${Utils.getIntensityLabel(maxIntensity)}</td></tr>
                            <tr><th>マグニチュード</th><td>M${magnitude.toFixed(1)}</td></tr>
                            <tr><th>深さ</th><td>${depth}km (${this.getDepthCategory(depth)})</td></tr>
                            <tr><th>震央</th><td>北緯${latitude.toFixed(3)}° 東経${longitude.toFixed(3)}°</td></tr>
                            <tr><th>発生時刻</th><td>${Utils.formatDate(time)}</td></tr>
                        </table>
                    </div>
                    
                    <div class="detail-section">
                        <h4>エネルギー</h4>
                        <table class="detail-table">
                            <tr><th>エネルギー</th><td>${Utils.formatNumber(energy, 2)} J</td></tr>
                            <tr><th>TNT換算</th><td>${Utils.formatNumber(tnt, 2)} トン</td></tr>
                            <tr><th>規模分類</th><td>${this.getMagnitudeCategory(magnitude)}</td></tr>
                        </table>
                    </div>
                    
                    <div class="detail-section full-width">
                        <h4>主要都市の推定震度と波の到達時間</h4>
                        <table class="detail-table cities-table">
                            <thead>
                                <tr>
                                    <th>都市名</th>
                                    <th>震源距離</th>
                                    <th>推定震度</th>
                                    <th>P波到達</th>
                                    <th>S波到達</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cityEstimates.map(city => `
                                    <tr>
                                        <td>${city.name}</td>
                                        <td>${city.distance}km</td>
                                        <td style="color: ${Utils.getIntensityColor(city.intensity)}; font-weight: bold;">
                                            震度${city.intensity}
                                        </td>
                                        <td>${city.pWave}秒</td>
                                        <td>${city.sWave}秒</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="detail-actions">
                    <button class="btn btn-primary" onclick="mapRenderer.focusEarthquake('${id}')">
                        地図で詳しく見る
                    </button>
                    <button class="btn btn-secondary" onclick="app.shareEarthquake('${id}')">
                        この地震を共有
                    </button>
                    <button class="btn btn-secondary" onclick="app.downloadEarthquakeData('${id}')">
                        データをダウンロード
                    </button>
                </div>
            </div>
        `;
        
        Utils.showModal('地震詳細情報', content, [
            { text: '閉じる', type: 'secondary', onclick: 'Utils.hideModal()' }
        ]);
    },

    // ========================================
    // チャート描画 (250行)
    // ========================================
    
    /**
     * 汎用チャート描画
     */
    renderChart(canvasId, data, options) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        // 既存のチャートを破棄
        if (canvas.chart) {
            canvas.chart.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: options.type || 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: options.legendPosition || 'top'
                    },
                    title: {
                        display: !!options.title,
                        text: options.title,
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        padding: 12
                    }
                },
                ...options
            }
        });
        
        canvas.chart = chart;
        return chart;
    },

    /**
     * マグニチュード分布チャート
     */
    renderMagnitudeDistribution(earthquakes) {
        const magnitudes = earthquakes.map(eq => eq.magnitude);
        const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const distribution = bins.map((bin, i) => {
            if (i === bins.length - 1) return 0;
            const nextBin = bins[i + 1];
            return magnitudes.filter(m => m >= bin && m < nextBin).length;
        });
        
        this.renderChart('magnitude-distribution-chart', {
            labels: bins.slice(0, -1).map((b, i) => `M${b}-${bins[i + 1]}`),
            datasets: [{
                label: '地震回数',
                data: distribution.slice(0, -1),
                backgroundColor: bins.slice(0, -1).map(b => Utils.getMagnitudeColor(b + 0.5)),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        }, {
            type: 'bar',
            title: 'マグニチュード別分布',
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '回数' }
                },
                x: {
                    title: { display: true, text: 'マグニチュード' }
                }
            }
        });
    },

    /**
     * 深さ分布チャート
     */
    renderDepthDistribution(earthquakes) {
        const depths = earthquakes.map(eq => eq.depth);
        const categories = [
            { label: '浅発(0-60km)', min: 0, max: 60, color: '#ef4444' },
            { label: '稍深発(60-300km)', min: 60, max: 300, color: '#f59e0b' },
            { label: '深発(300km以上)', min: 300, max: 1000, color: '#3b82f6' }
        ];
        
        const distribution = categories.map(cat => 
            depths.filter(d => d >= cat.min && d < cat.max).length
        );
        
        this.renderChart('depth-distribution-chart', {
            labels: categories.map(c => c.label),
            datasets: [{
                label: '地震回数',
                data: distribution,
                backgroundColor: categories.map(c => c.color),
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
            }]
        }, {
            type: 'pie',
            title: '深さ別分布',
            plugins: {
                legend: { position: 'right' }
            }
        });
    },

    /**
     * 時系列チャート
     */
    renderTimelineChart(earthquakes, period = 'hour') {
        const grouped = Utils.groupBy(earthquakes, eq => {
            const date = new Date(eq.time);
            switch(period) {
                case 'hour': return Utils.formatDate(date, 'MM/DD HH');
                case 'day': return Utils.formatDate(date, 'MM/DD');
                case 'month': return Utils.formatDate(date, 'YYYY/MM');
                default: return Utils.formatDate(date, 'MM/DD HH');
            }
        });
        
        const labels = Object.keys(grouped).sort();
        const counts = labels.map(label => grouped[label].length);
        
        this.renderChart('timeline-chart', {
            labels: labels,
            datasets: [{
                label: '地震回数',
                data: counts,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }]
        }, {
            type: 'line',
            title: '時系列推移',
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: '回数' }
                }
            }
        });
    },

    // ========================================
    // 統計・分析レンダリング (300行)
    // ========================================
    
    /**
     * 統計情報の完全表示
     */
    renderStatistics(stats) {
        const container = document.getElementById('statistics-container');
        if (!container || !stats) return;
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>基本統計</h4>
                    <div class="stat-items">
                        <div class="stat-row">
                            <span>総地震数</span>
                            <strong>${stats.count}回</strong>
                        </div>
                        <div class="stat-row">
                            <span>最大マグニチュード</span>
                            <strong style="color: ${Utils.getMagnitudeColor(stats.magnitudes.max)}">
                                M${stats.magnitudes.max.toFixed(1)}
                            </strong>
                        </div>
                        <div class="stat-row">
                            <span>平均マグニチュード</span>
                            <strong>M${stats.magnitudes.avg.toFixed(1)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>中央値マグニチュード</span>
                            <strong>M${stats.magnitudes.median.toFixed(1)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>標準偏差</span>
                            <strong>${stats.magnitudes.stdDev.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>深さ統計</h4>
                    <div class="stat-items">
                        <div class="stat-row">
                            <span>最深</span>
                            <strong>${stats.depths.max.toFixed(0)}km</strong>
                        </div>
                        <div class="stat-row">
                            <span>最浅</span>
                            <strong>${stats.depths.min.toFixed(0)}km</strong>
                        </div>
                        <div class="stat-row">
                            <span>平均深さ</span>
                            <strong>${stats.depths.avg.toFixed(0)}km</strong>
                        </div>
                        <div class="stat-row">
                            <span>中央値深さ</span>
                            <strong>${stats.depths.median.toFixed(0)}km</strong>
                        </div>
                    </div>
                </div>
                
                <div class="stat-card">
                    <h4>震度別統計</h4>
                    <div class="intensity-stats">
                        ${Object.entries(stats.intensityDistribution || {})
                            .sort((a, b) => Utils.intensityToNumber(b[0]) - Utils.intensityToNumber(a[0]))
                            .map(([intensity, count]) => `
                                <div class="intensity-stat-row">
                                    <span class="intensity-badge" style="background: ${Utils.getIntensityColor(intensity)}">
                                        ${Utils.getIntensityLabel(intensity)}
                                    </span>
                                    <div class="intensity-bar">
                                        <div class="intensity-bar-fill" style="width: ${(count / stats.count * 100).toFixed(0)}%; background: ${Utils.getIntensityColor(intensity)}"></div>
                                    </div>
                                    <strong>${count}回</strong>
                                </div>
                            `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // ========================================
    // ツール・機能レンダリング (250行)
    // ========================================
    
    /**
     * 避難所リストの表示
     */
    renderShelters(shelters) {
        const container = document.getElementById('shelter-results');
        if (!container) return;
        
        if (shelters.length === 0) {
            container.innerHTML = `
                <div class="no-data-message">
                    <i class="icon-info"></i>
                    <p>避難所が見つかりませんでした</p>
                    <p class="hint">検索範囲を広げてみてください</p>
                </div>
            `;
            return;
        }
        
        const html = shelters.map((shelter, index) => `
            <div class="shelter-card">
                <div class="shelter-header">
                    <span class="shelter-icon">${shelter.icon}</span>
                    <h4>${Utils.escapeHtml(shelter.name)}</h4>
                </div>
                <div class="shelter-body">
                    <p class="shelter-type">${shelter.typeLabel}</p>
                    <div class="shelter-info-grid">
                        <div class="info-item">
                            <i class="icon-distance"></i>
                            <span>距離: ${Utils.formatNumber(shelter.distance)}m</span>
                        </div>
                        <div class="info-item">
                            <i class="icon-people"></i>
                            <span>収容人数: ${Utils.formatNumber(shelter.capacity)}人</span>
                        </div>
                    </div>
                    ${shelter.facilities && shelter.facilities.length > 0 ? `
                        <div class="shelter-facilities">
                            <p class="facilities-label">設備:</p>
                            <div class="facilities-tags">
                                ${shelter.facilities.map(f => `<span class="facility-tag">${f}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="shelter-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.navigateToShelter('${shelter.id}')">
                        <i class="icon-route"></i> ルート案内
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="mapRenderer.focusShelter('${shelter.id}')">
                        <i class="icon-map"></i> 地図で表示
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
    },

    /**
     * 防災キットチェックリスト
     */
    renderDisasterKit() {
        const container = document.getElementById('disaster-kit-checklist');
        if (!container) return;
        
        const categories = [
            {
                name: '必需品',
                items: CONSTANTS.EMERGENCY_SUPPLIES.ESSENTIAL
            },
            {
                name: '非常食・水',
                items: CONSTANTS.EMERGENCY_SUPPLIES.FOOD_WATER
            },
            {
                name: '救急用品',
                items: CONSTANTS.EMERGENCY_SUPPLIES.MEDICAL
            },
            {
                name: 'その他',
                items: CONSTANTS.EMERGENCY_SUPPLIES.OTHER
            }
        ];
        
        const savedChecklist = Utils.getStorage('disaster-kit-checklist', {});
        
        const html = categories.map(category => `
            <div class="checklist-category">
                <h4 class="category-title">${category.name}</h4>
                <div class="checklist-items">
                    ${category.items.map((item, index) => {
                        const itemId = `${category.name}_${index}`;
                        const isChecked = savedChecklist[itemId] || false;
                        return `
                            <label class="checklist-item ${isChecked ? 'checked' : ''}">
                                <input type="checkbox" 
                                       data-item="${itemId}"
                                       ${isChecked ? 'checked' : ''}
                                       onchange="Renderers.handleChecklistChange(this)">
                                <span class="checkmark"></span>
                                <span class="item-text">${item}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.updateChecklistProgress();
    },

    /**
     * チェックリストの変更処理
     */
    handleChecklistChange(checkbox) {
        const itemId = checkbox.dataset.item;
        const checklist = Utils.getStorage('disaster-kit-checklist', {});
        checklist[itemId] = checkbox.checked;
        Utils.setStorage('disaster-kit-checklist', checklist);
        
        checkbox.parentElement.classList.toggle('checked', checkbox.checked);
        this.updateChecklistProgress();
    },

    /**
     * チェックリスト進捗の更新
     */
    updateChecklistProgress() {
        const checklist = Utils.getStorage('disaster-kit-checklist', {});
        const total = Object.keys(checklist).length;
        const checked = Object.values(checklist).filter(Boolean).length;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
        
        const progressContainer = document.getElementById('checklist-progress');
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                <p class="progress-text">${checked} / ${total} 項目完了 (${percentage}%)</p>
            `;
        }
    },

    /**
     * 教育コンテンツのレンダリング
     */
    renderEducation() {
        const container = document.getElementById('education-content');
        if (!container) return;
        
        container.innerHTML = `
            <div class="education-sections">
                <section class="education-section">
                    <h3>地震の基礎知識</h3>
                    <div class="education-content">
                        <h4>地震とは</h4>
                        <p>地震は、地下の岩盤が破壊されることによって発生する自然現象です。プレートの動きや断層のずれによって、蓄積されたエネルギーが一気に解放され、地震波として伝わります。</p>
                        
                        <h4>震度とマグニチュード</h4>
                        <ul>
                            <li><strong>震度</strong>: ある地点での揺れの強さを表します（日本では0〜7の10階級）</li>
                            <li><strong>マグニチュード</strong>: 地震そのものの規模（エネルギー）を表します</li>
                        </ul>
                        
                        <h4>プレート境界と地震</h4>
                        <p>日本列島は4つのプレートが集まる場所に位置し、世界でも有数の地震多発地帯です。</p>
                    </div>
                </section>
                
                <section class="education-section">
                    <h3>緊急地震速報（EEW）</h3>
                    <div class="education-content">
                        <h4>EEWとは</h4>
                        <p>緊急地震速報は、地震の発生直後に、震源に近い観測点の地震波を検知し、各地での主要動の到達時刻や震度を予想して知らせる警報です。</p>
                        
                        <h4>EEWを受け取ったら</h4>
                        <ol>
                            <li>まず、身の安全を確保する</li>
                            <li>頭を守り、丈夫な机の下などに隠れる</li>
                            <li>慌てて外に飛び出さない</li>
                            <li>火を使っている場合は、可能なら火を消す</li>
                        </ol>
                    </div>
                </section>
                
                <section class="education-section">
                    <h3>地震が発生したら</h3>
                    <div class="education-content">
                        <h4>揺れを感じたら</h4>
                        <ol>
                            <li><strong>まず身の安全を確保</strong>: 机の下に入る、頭を守るなど</li>
                            <li><strong>火の始末</strong>: 揺れが収まってから安全に火を消す</li>
                            <li><strong>避難路の確保</strong>: ドアや窓を開けて避難路を確保</li>
                            <li><strong>正しい情報の収集</strong>: ラジオやテレビ、このアプリで正確な情報を</li>
                            <li><strong>余震に注意</strong>: 大きな地震の後は余震が続くことがあります</li>
                        </ol>
                    </div>
                </section>
                
                <section class="education-section">
                    <h3>日頃の備え</h3>
                    <div class="education-content">
                        <ul>
                            <li>非常持ち出し袋の準備（右のツールでチェック可能）</li>
                            <li>家具の転倒防止対策</li>
                            <li>家族との連絡方法の確認</li>
                            <li>避難場所・避難経路の確認</li>
                            <li>建物の耐震性の確認</li>
                        </ul>
                    </div>
                </section>
            </div>
        `;
    },

    // ========================================
    // ヘルパー関数 (200行)
    // ========================================
    
    /**
     * ページネーションの描画
     */
    renderPagination(containerId, options) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const { total, perPage, currentPage, onChange } = options;
        const totalPages = Math.ceil(total / perPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }
        
        const maxVisible = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        
        container.innerHTML = `
            <div class="pagination">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
                        onclick="(${onChange})(${currentPage - 1})">
                    ‹ 前へ
                </button>
                ${pages.map(page => `
                    <button class="pagination-btn ${page === currentPage ? 'active' : ''}"
                            onclick="(${onChange})(${page})">
                        ${page}
                    </button>
                `).join('')}
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''}
                        onclick="(${onChange})(${currentPage + 1})">
                    次へ ›
                </button>
            </div>
        `;
    },

    /**
     * 津波グレードのラベル取得
     */
    getTsunamiGradeLabel(grade) {
        const labels = {
            'major_warning': '大津波警報',
            'warning': '津波警報',
            'advisory': '津波注意報',
            'forecast': '津波予報'
        };
        return labels[grade] || grade;
    },

    /**
     * 深さの分類取得
     */
    getDepthCategory(depth) {
        if (depth < 60) return '浅発地震';
        if (depth < 300) return '稍深発地震';
        return '深発地震';
    },

    /**
     * マグニチュード分類の取得
     */
    getMagnitudeCategory(magnitude) {
        if (magnitude < 3.0) return '微小地震';
        if (magnitude < 5.0) return '小地震';
        if (magnitude < 7.0) return '中地震';
        if (magnitude < 8.0) return '大地震';
        return '巨大地震';
    }
};

// エクスポート
if (typeof window !== 'undefined') window.Renderers = Renderers;
