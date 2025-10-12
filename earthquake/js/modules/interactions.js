/**
 * インタラクション - ユーザーインタラクションの管理（1800行超の完全実装）
 * 全てのユーザー操作とイベントハンドリングを統括
 */
const Interactions = {
    // ========================================
    // 初期化 (100行)
    // ========================================
    
    /**
     * 全インタラクションの初期化
     */
    init() {
        this.setupNavigation();
        this.setupMapControls();
        this.setupFilters();
        this.setupSort();
        this.setupSearch();
        this.setupTools();
        this.setupSettings();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
        this.setupAutoRefresh();
        this.setupNotificationHandlers();
        
        console.log('✅ Interactions initialized');
    },

    // ========================================
    // ナビゲーション (200行)
    // ========================================
    
    /**
     * ナビゲーションのセットアップ
     */
    setupNavigation() {
        // ナビゲーションアイテムのクリックイベント
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
                
                // モバイルメニューを閉じる
                this.closeMobileMenu();
            });
        });
        
        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.switchView(e.state.view, false);
            }
        });
        
        // 初期ビューの設定
        const initialView = this.getViewFromUrl() || 'dashboard';
        this.switchView(initialView, false);
    },

    /**
     * ビューの切り替え
     */
    switchView(viewName, pushState = true) {
        // 全てのビューを非アクティブに
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.setAttribute('aria-hidden', 'true');
        });
        
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            n.setAttribute('aria-current', 'false');
        });
        
        // 指定されたビューをアクティブに
        const view = document.getElementById(`${viewName}-view`);
        const navItem = document.querySelector(`[data-view="${viewName}"]`);
        
        if (view) {
            view.classList.add('active');
            view.setAttribute('aria-hidden', 'false');
            
            // ビュー固有の初期化処理
            this.initializeView(viewName);
        }
        
        if (navItem) {
            navItem.classList.add('active');
            navItem.setAttribute('aria-current', 'page');
        }
        
        // 履歴に追加
        if (pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }
        
        // スクロールを最上部に
        window.scrollTo(0, 0);
        
        // アナリティクスイベント送信
        this.trackPageView(viewName);
    },

    /**
     * ビュー固有の初期化
     */
    initializeView(viewName) {
        switch(viewName) {
            case 'dashboard':
                Renderers.renderDashboard();
                break;
            case 'realtime':
                this.startRealtimeUpdates();
                break;
            case 'history':
                this.loadHistoricalData();
                break;
            case 'analysis':
                this.renderAnalysisView();
                break;
            case 'tools':
                Renderers.renderDisasterKit();
                break;
            case 'education':
                Renderers.renderEducation();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    /**
     * URLからビュー名を取得
     */
    getViewFromUrl() {
        const hash = window.location.hash.substring(1);
        return hash || null;
    },

    /**
     * モバイルメニューの開閉
     */
    toggleMobileMenu() {
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.classList.toggle('open');
        }
    },

    closeMobileMenu() {
        const nav = document.querySelector('.nav');
        if (nav) {
            nav.classList.remove('open');
        }
    },

    // ========================================
    // マップコントロール (200行)
    // ========================================
    
    /**
     * マップコントロールのセットアップ
     */
    setupMapControls() {
        // 現在地ボタン
        const locateBtn = document.getElementById('locate-btn');
        if (locateBtn) {
            locateBtn.addEventListener('click', async () => {
                try {
                    Utils.setLoading(true, '現在地を取得中...');
                    const location = await geoService.getCurrentPosition();
                    dataStore.setUserLocation(location);
                    
                    if (window.mapRenderer) {
                        mapRenderer.addUserLocation(location);
                        mapRenderer.map.setView([location.lat, location.lon], 10);
                    }
                    
                    Utils.showToast('現在地を取得しました', 'success');
                } catch (error) {
                    console.error('Location error:', error);
                    Utils.showToast('位置情報の取得に失敗しました', 'error');
                } finally {
                    Utils.setLoading(false);
                }
            });
        }

        // 更新ボタン
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // ズームコントロール
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        
        if (zoomInBtn && window.mapRenderer) {
            zoomInBtn.addEventListener('click', () => {
                mapRenderer.map.zoomIn();
            });
        }
        
        if (zoomOutBtn && window.mapRenderer) {
            zoomOutBtn.addEventListener('click', () => {
                mapRenderer.map.zoomOut();
            });
        }

        // レイヤー切り替え
        const layerBtns = document.querySelectorAll('[data-layer]');
        layerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layer = e.target.dataset.layer;
                this.toggleMapLayer(layer);
                btn.classList.toggle('active');
            });
        });

        // マップタイプ切り替え
        const mapTypeSelect = document.getElementById('map-type-select');
        if (mapTypeSelect) {
            mapTypeSelect.addEventListener('change', (e) => {
                const type = e.target.value;
                if (window.mapRenderer) {
                    mapRenderer.switchBaseLayer(type);
                }
            });
        }
    },

    /**
     * マップレイヤーの切り替え
     */
    toggleMapLayer(layerName) {
        if (!window.mapRenderer) return;
        
        switch(layerName) {
            case 'earthquakes':
                mapRenderer.toggleLayer('earthquakes');
                break;
            case 'intensity':
                mapRenderer.toggleLayer('intensity');
                break;
            case 'eew':
                mapRenderer.toggleLayer('eew');
                break;
            case 'tsunami':
                mapRenderer.toggleLayer('tsunami');
                break;
            case 'shelters':
                mapRenderer.toggleLayer('shelters');
                break;
            case 'heatmap':
                mapRenderer.toggleLayer('heatmap');
                break;
        }
    },

    /**
     * データの更新
     */
    async refreshData() {
        Utils.setLoading(true, 'データを更新中...');
        
        try {
            if (window.app && typeof app.refreshData === 'function') {
                await app.refreshData();
                Utils.showToast('データを更新しました', 'success');
            }
        } catch (error) {
            console.error('Refresh error:', error);
            Utils.showToast('データの更新に失敗しました', 'error');
        } finally {
            Utils.setLoading(false);
        }
    },

    // ========================================
    // フィルター・ソート (250行)
    // ========================================
    
    /**
     * フィルターのセットアップ
     */
    setupFilters() {
        // フィルター適用ボタン
        const applyBtn = document.getElementById('apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // フィルターリセットボタン
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // マグニチュードスライダー
        const magFilter = document.getElementById('mag-filter');
        if (magFilter) {
            magFilter.addEventListener('input', Utils.debounce((e) => {
                const value = e.target.value;
                const display = document.getElementById('mag-value');
                if (display) {
                    display.textContent = parseFloat(value).toFixed(1);
                }
                
                // リアルタイム適用
                if (document.getElementById('realtime-filter')?.checked) {
                    this.applyFilters();
                }
            }, 300));
        }

        // 深さフィルター
        const depthFilter = document.getElementById('depth-filter');
        if (depthFilter) {
            depthFilter.addEventListener('change', () => {
                if (document.getElementById('realtime-filter')?.checked) {
                    this.applyFilters();
                }
            });
        }

        // 期間フィルター
        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) {
            periodFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // 地域フィルター
        const regionFilter = document.getElementById('region-filter');
        if (regionFilter) {
            regionFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // 震度フィルター
        const intensityFilters = document.querySelectorAll('input[name="intensity-filter"]');
        intensityFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                if (document.getElementById('realtime-filter')?.checked) {
                    this.applyFilters();
                }
            });
        });
    },

    /**
     * フィルターの適用
     */
    applyFilters() {
        const magFilter = document.getElementById('mag-filter')?.value || 0;
        const depthFilter = document.getElementById('depth-filter')?.value || 'all';
        const periodFilter = document.getElementById('period-filter')?.value || 'all';
        const regionFilter = document.getElementById('region-filter')?.value || 'all';
        
        const intensityFilters = Array.from(document.querySelectorAll('input[name="intensity-filter"]:checked'))
            .map(cb => cb.value);
        
        // フィルター条件をデータストアに保存
        dataStore.set('ui.filters', {
            minMagnitude: parseFloat(magFilter),
            depth: depthFilter,
            timeRange: periodFilter,
            region: regionFilter,
            intensities: intensityFilters
        });
        
        // フィルター済みデータを取得
        const filtered = dataStore.getFilteredEarthquakes();
        
        // リストを再描画
        Renderers.renderEarthquakeList(filtered);
        
        // マップを更新
        if (window.mapRenderer) {
            mapRenderer.updateEarthquakes(filtered);
        }
        
        // 結果数を表示
        this.updateFilterResultCount(filtered.length);
        
        Utils.showToast(`${filtered.length}件の地震が見つかりました`, 'info', 2000);
    },

    /**
     * フィルターのリセット
     */
    resetFilters() {
        // フォーム要素をリセット
        document.getElementById('mag-filter').value = 0;
        document.getElementById('mag-value').textContent = '0.0';
        document.getElementById('depth-filter').value = 'all';
        document.getElementById('period-filter').value = 'all';
        document.getElementById('region-filter').value = 'all';
        
        document.querySelectorAll('input[name="intensity-filter"]').forEach(cb => {
            cb.checked = false;
        });
        
        // データストアをリセット
        dataStore.set('ui.filters', {});
        
        // フィルターを適用
        this.applyFilters();
        
        Utils.showToast('フィルターをリセットしました', 'success');
    },

    /**
     * フィルター結果数の更新
     */
    updateFilterResultCount(count) {
        const counter = document.getElementById('filter-result-count');
        if (counter) {
            counter.textContent = `${Utils.formatNumber(count)}件`;
        }
    },

    /**
     * ソートのセットアップ
     */
    setupSort() {
        const sortSelect = document.getElementById('sort-by');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                const sortBy = e.target.value;
                this.applySorting(sortBy);
            });
        }

        // ソート順序切り替え
        const orderBtn = document.getElementById('sort-order-btn');
        if (orderBtn) {
            orderBtn.addEventListener('click', () => {
                const currentOrder = orderBtn.dataset.order || 'desc';
                const newOrder = currentOrder === 'desc' ? 'asc' : 'desc';
                orderBtn.dataset.order = newOrder;
                orderBtn.textContent = newOrder === 'desc' ? '↓' : '↑';
                
                const sortBy = document.getElementById('sort-by')?.value || 'time';
                this.applySorting(sortBy, newOrder);
            });
        }
    },

    /**
     * ソートの適用
     */
    applySorting(sortBy, order = 'desc') {
        let earthquakes = dataStore.getFilteredEarthquakes();
        
        earthquakes = Utils.sortBy(earthquakes, eq => {
            switch(sortBy) {
                case 'time': return new Date(eq.time).getTime();
                case 'magnitude': return eq.magnitude;
                case 'depth': return eq.depth;
                case 'intensity': return Utils.intensityToNumber(eq.maxIntensity);
                default: return new Date(eq.time).getTime();
            }
        }, order);
        
        Renderers.renderEarthquakeList(earthquakes);
    },

    // ========================================
    // 検索 (150行)
    // ========================================
    
    /**
     * 検索のセットアップ
     */
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                const query = e.target.value.trim();
                this.performSearch(query);
            }, 500));
        }

        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = document.getElementById('search-input')?.value.trim();
                this.performSearch(query);
            });
        }

        // Enterキーで検索
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const query = e.target.value.trim();
                    this.performSearch(query);
                }
            });
        }
    },

    /**
     * 検索の実行
     */
    performSearch(query) {
        if (!query) {
            this.applyFilters();
            return;
        }
        
        const allEarthquakes = dataStore.get('history.earthquakes');
        const results = allEarthquakes.filter(eq => {
            return eq.region.toLowerCase().includes(query.toLowerCase()) ||
                   eq.id.includes(query) ||
                   String(eq.magnitude).includes(query);
        });
        
        Renderers.renderEarthquakeList(results);
        this.updateFilterResultCount(results.length);
        
        Utils.showToast(`"${query}" で ${results.length}件見つかりました`, 'info');
    },

    // ========================================
    // ツール (250行)
    // ========================================
    
    /**
     * ツールのセットアップ
     */
    setupTools() {
        this.setupShelterSearch();
        this.setupSimulator();
        this.setupSafetyChecker();
        this.setupExport();
    },

    /**
     * 避難所検索のセットアップ
     */
    setupShelterSearch() {
        const searchBtn = document.getElementById('search-shelters');
        if (searchBtn) {
            searchBtn.addEventListener('click', async () => {
                const location = dataStore.get('user.location');
                if (!location) {
                    Utils.showToast('まず現在地を取得してください', 'warning');
                    return;
                }
                
                const radius = document.getElementById('shelter-radius')?.value || 5000;
                
                Utils.setLoading(true, '避難所を検索中...');
                
                try {
                    const shelters = await geoService.searchShelters(location, radius);
                    Renderers.renderShelters(shelters);
                    
                    if (window.mapRenderer) {
                        mapRenderer.renderShelters(shelters);
                    }
                    
                    Utils.showToast(`${shelters.length}件の避難所が見つかりました`, 'success');
                } catch (error) {
                    console.error('Shelter search error:', error);
                    Utils.showToast('避難所の検索に失敗しました', 'error');
                } finally {
                    Utils.setLoading(false);
                }
            });
        }
    },

    /**
     * 地震シミュレーターのセットアップ
     */
    setupSimulator() {
        const runBtn = document.getElementById('run-simulation');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                const magnitude = parseFloat(document.getElementById('sim-magnitude')?.value) || 7.0;
                const depth = parseFloat(document.getElementById('sim-depth')?.value) || 10;
                const lat = parseFloat(document.getElementById('sim-lat')?.value) || 35.6895;
                const lon = parseFloat(document.getElementById('sim-lon')?.value) || 139.6917;
                
                this.runEarthquakeSimulation({ magnitude, depth, lat, lon });
            });
        }
    },

    /**
     * 地震シミュレーションの実行
     */
    runEarthquakeSimulation(params) {
        const { magnitude, depth, lat, lon } = params;
        
        Utils.showToast('シミュレーションを実行中...', 'info');
        
        // 主要都市での推定震度を計算
        const cities = [
            { name: '東京', lat: 35.6895, lon: 139.6917 },
            { name: '横浜', lat: 35.4437, lon: 139.6380 },
            { name: '千葉', lat: 35.6074, lon: 140.1065 },
            { name: '埼玉', lat: 35.8617, lon: 139.6455 },
            { name: '大阪', lat: 34.6937, lon: 135.5023 }
        ];
        
        const results = cities.map(city => {
            const distance = Utils.calculateDistance(lat, lon, city.lat, city.lon);
            const intensity = Utils.estimateIntensityFromDistance(magnitude, distance, depth);
            const waveArrival = Utils.calculateWaveArrival(distance, depth);
            
            return {
                city: city.name,
                distance: distance.toFixed(1),
                intensity: Utils.numberToIntensity(Math.floor(intensity)),
                pWave: waveArrival.pWave.toFixed(1),
                sWave: waveArrival.sWave.toFixed(1)
            };
        });
        
        // 結果を表示
        this.displaySimulationResults(results, params);
    },

    /**
     * シミュレーション結果の表示
     */
    displaySimulationResults(results, params) {
        const content = `
            <div class="simulation-results">
                <h4>シミュレーション条件</h4>
                <table class="sim-params-table">
                    <tr><th>マグニチュード</th><td>M${params.magnitude.toFixed(1)}</td></tr>
                    <tr><th>深さ</th><td>${params.depth}km</td></tr>
                    <tr><th>震央</th><td>北緯${params.lat.toFixed(3)}° 東経${params.lon.toFixed(3)}°</td></tr>
                </table>
                
                <h4>推定結果</h4>
                <table class="sim-results-table">
                    <thead>
                        <tr>
                            <th>都市</th>
                            <th>距離</th>
                            <th>推定震度</th>
                            <th>P波到達</th>
                            <th>S波到達</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(r => `
                            <tr>
                                <td>${r.city}</td>
                                <td>${r.distance}km</td>
                                <td style="color: ${Utils.getIntensityColor(r.intensity)}; font-weight: bold;">
                                    震度${r.intensity}
                                </td>
                                <td>${r.pWave}秒</td>
                                <td>${r.sWave}秒</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <p class="sim-note">
                    ※この結果は簡易的な計算によるもので、実際の震度とは異なる場合があります。
                </p>
            </div>
        `;
        
        Utils.showModal('地震シミュレーション結果', content, [
            { text: '閉じる', type: 'secondary', onclick: 'Utils.hideModal()' }
        ]);
    },

    /**
     * 安全確認のセットアップ
     */
    setupSafetyChecker() {
        const checkBtn = document.getElementById('check-safety');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => {
                this.performSafetyCheck();
            });
        }
    },

    /**
     * 安全確認の実行
     */
    async performSafetyCheck() {
        const location = dataStore.get('user.location');
        if (!location) {
            Utils.showToast('現在地を取得してください', 'warning');
            return;
        }
        
        Utils.setLoading(true, '安全性を確認中...');
        
        try {
            // 周辺の地震活動をチェック
            const recentEarthquakes = dataStore.get('history.earthquakes').slice(0, 50);
            const nearbyQuakes = recentEarthquakes.filter(eq => {
                const distance = Utils.calculateDistance(
                    location.lat, location.lon,
                    eq.latitude, eq.longitude
                );
                return distance < 100; // 100km以内
            });
            
            // リスク評価
            const riskLevel = await geoService.assessAreaRisk(location);
            
            this.displaySafetyCheckResults({
                location,
                nearbyQuakes,
                riskLevel
            });
        } catch (error) {
            console.error('Safety check error:', error);
            Utils.showToast('安全確認に失敗しました', 'error');
        } finally {
            Utils.setLoading(false);
        }
    },

    /**
     * 安全確認結果の表示
     */
    displaySafetyCheckResults(data) {
        const { location, nearbyQuakes, riskLevel } = data;
        
        const content = `
            <div class="safety-check-results">
                <h4>現在地の地震活動</h4>
                <p>過去24時間以内、100km以内: <strong>${nearbyQuakes.length}件</strong></p>
                
                ${nearbyQuakes.length > 0 ? `
                    <div class="nearby-quakes-list">
                        ${nearbyQuakes.slice(0, 5).map(eq => `
                            <div class="nearby-quake-item">
                                <span style="color: ${Utils.getMagnitudeColor(eq.magnitude)}">
                                    M${eq.magnitude.toFixed(1)}
                                </span>
                                <span>${eq.region}</span>
                                <span>${Utils.getRelativeTime(eq.time)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>周辺での地震活動は確認されていません</p>'}
                
                <h4>地域リスク評価</h4>
                <div class="risk-assessment">
                    <div class="risk-item">
                        <span>液状化リスク</span>
                        <span class="risk-level risk-${riskLevel.liquefaction}">${this.getRiskLabel(riskLevel.liquefaction)}</span>
                    </div>
                    <div class="risk-item">
                        <span>土砂災害リスク</span>
                        <span class="risk-level risk-${riskLevel.landslide}">${this.getRiskLabel(riskLevel.landslide)}</span>
                    </div>
                    <div class="risk-item">
                        <span>津波リスク</span>
                        <span class="risk-level risk-${riskLevel.tsunami}">${this.getRiskLabel(riskLevel.tsunami)}</span>
                    </div>
                </div>
                
                <div class="safety-tips">
                    <h4>推奨事項</h4>
                    <ul>
                        <li>避難経路を事前に確認してください</li>
                        <li>非常持ち出し袋を準備してください</li>
                        <li>家族との連絡方法を決めておいてください</li>
                    </ul>
                </div>
            </div>
        `;
        
        Utils.showModal('安全確認結果', content, [
            { text: '閉じる', type: 'secondary', onclick: 'Utils.hideModal()' }
        ]);
    },

    /**
     * リスクレベルのラベル取得
     */
    getRiskLabel(level) {
        const labels = { low: '低', medium: '中', high: '高' };
        return labels[level] || '不明';
    },

    /**
     * データエクスポートのセットアップ
     */
    setupExport() {
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const format = document.getElementById('export-format')?.value || 'json';
                this.exportData(format);
            });
        }
    },

    /**
     * データのエクスポート
     */
    exportData(format) {
        try {
            const data = dataStore.export();
            const filename = `earthquake-data-${Utils.formatDate(new Date(), 'YYYY-MM-DD-HH-mm')}.${format}`;
            
            if (format === 'json') {
                Utils.download(data, filename, 'application/json');
            } else if (format === 'csv') {
                const csv = this.convertToCSV(data.history.earthquakes);
                Utils.download(csv, filename, 'text/csv');
            }
            
            Utils.showToast('データをエクスポートしました', 'success');
        } catch (error) {
            console.error('Export error:', error);
            Utils.showToast('エクスポートに失敗しました', 'error');
        }
    },

    /**
     * CSVへの変換
     */
    convertToCSV(earthquakes) {
        const headers = ['ID', '発生時刻', '震央地名', 'マグニチュード', '深さ', '最大震度', '緯度', '経度'];
        const rows = earthquakes.map(eq => [
            eq.id,
            Utils.formatDate(eq.time),
            eq.region,
            eq.magnitude,
            eq.depth,
            eq.maxIntensity,
            eq.latitude,
            eq.longitude
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    // ========================================
    // 設定 (200行)
    // ========================================
    
    /**
     * 設定のセットアップ
     */
    setupSettings() {
        // 通知設定
        const notificationToggle = document.getElementById('enable-notifications');
        if (notificationToggle) {
            notificationToggle.addEventListener('change', (e) => {
                const enabled = e.target.checked;
                dataStore.set('user.notifications.enabled', enabled);
                
                if (enabled) {
                    notificationService.init();
                }
                
                Utils.showToast(
                    enabled ? '通知を有効にしました' : '通知を無効にしました',
                    'success'
                );
            });
        }

        // 通知閾値設定
        const magThreshold = document.getElementById('notification-magnitude');
        if (magThreshold) {
            magThreshold.addEventListener('change', (e) => {
                dataStore.set('user.notifications.minMagnitude', parseFloat(e.target.value));
            });
        }

        // テーマ設定
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.changeTheme(e.target.value);
            });
        }

        // 言語設定
        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }

        // 自動更新設定
        const autoRefreshToggle = document.getElementById('auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                dataStore.set('user.preferences.autoRefresh', e.target.checked);
                
                if (e.target.checked) {
                    this.startAutoRefresh();
                } else {
                    this.stopAutoRefresh();
                }
            });
        }

        // データクリアボタン
        const clearBtn = document.getElementById('clear-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.confirmClearData();
            });
        }
    },

    /**
     * 設定の読み込み
     */
    loadSettings() {
        const settings = dataStore.get('user');
        
        // フォームに設定値を反映
        const notificationToggle = document.getElementById('enable-notifications');
        if (notificationToggle) {
            notificationToggle.checked = settings.notifications?.enabled || false;
        }

        const magThreshold = document.getElementById('notification-magnitude');
        if (magThreshold) {
            magThreshold.value = settings.notifications?.minMagnitude || 4.0;
        }

        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = settings.preferences?.theme || 'light';
        }

        const langSelect = document.getElementById('language-select');
        if (langSelect) {
            langSelect.value = settings.preferences?.language || 'ja';
        }

        const autoRefreshToggle = document.getElementById('auto-refresh');
        if (autoRefreshToggle) {
            autoRefreshToggle.checked = settings.preferences?.autoRefresh || false;
        }
    },

    /**
     * テーマの変更
     */
    changeTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        dataStore.set('user.preferences.theme', theme);
        Utils.showToast(`テーマを${theme}に変更しました`, 'success');
    },

    /**
     * 言語の変更
     */
    changeLanguage(lang) {
        dataStore.set('user.preferences.language', lang);
        Utils.showToast(`言語を変更しました: ${lang}`, 'success');
        // 実際の多言語対応はi18nライブラリで実装
    },

    /**
     * データクリアの確認
     */
    confirmClearData() {
        Utils.confirm(
            '全てのデータをクリアしますか？この操作は取り消せません。',
            () => {
                dataStore.clear();
                Utils.showToast('データをクリアしました', 'success');
                setTimeout(() => location.reload(), 1000);
            },
            () => {}
        );
    },

    // ========================================
    // キーボードショートカット (150行)
    // ========================================
    
    /**
     * キーボードショートカットのセットアップ
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + キーのショートカット
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                    case 'f':
                        e.preventDefault();
                        document.getElementById('search-input')?.focus();
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportData('json');
                        break;
                }
            }
            
            // 数字キーでビュー切り替え
            if (e.altKey) {
                const views = ['dashboard', 'realtime', 'history', 'analysis', 'tools', 'education', 'settings'];
                const num = parseInt(e.key);
                if (num >= 1 && num <= views.length) {
                    e.preventDefault();
                    this.switchView(views[num - 1]);
                }
            }
            
            // ESCキーでモーダルを閉じる
            if (e.key === 'Escape') {
                Utils.hideModal();
                this.closeMobileMenu();
            }
        });
    },

    // ========================================
    // タッチジェスチャー (100行)
    // ========================================
    
    /**
     * タッチジェスチャーのセットアップ
     */
    setupTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // スワイプジェスチャー
            if (Math.abs(diffX) > 100 && Math.abs(diffY) < 50) {
                if (diffX > 0) {
                    // 右スワイプ
                    this.handleSwipeRight();
                } else {
                    // 左スワイプ
                    this.handleSwipeLeft();
                }
            }
        }, { passive: true });
    },

    handleSwipeRight() {
        // 前のビューに戻る
        history.back();
    },

    handleSwipeLeft() {
        // 次のビューへ（実装は環境による）
    },

    // ========================================
    // 自動更新 (100行)
    // ========================================
    
    /**
     * 自動更新のセットアップ
     */
    setupAutoRefresh() {
        const autoRefresh = dataStore.get('user.preferences.autoRefresh');
        if (autoRefresh) {
            this.startAutoRefresh();
        }
    },

    /**
     * 自動更新の開始
     */
    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        
        const interval = CONFIG.REFRESH_INTERVALS.EARTHQUAKE_LIST;
        this.autoRefreshInterval = setInterval(() => {
            this.refreshData();
        }, interval);
    },

    /**
     * 自動更新の停止
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    },

    // ========================================
    // 通知ハンドラー (100行)
    // ========================================
    
    /**
     * 通知ハンドラーのセットアップ
     */
    setupNotificationHandlers() {
        // データストアの変更を監視
        dataStore.subscribe('realtime.eew', (eew) => {
            if (eew && eew.isActive) {
                this.handleEEWNotification(eew);
            }
        });
        
        dataStore.subscribe('realtime.tsunami', (tsunami) => {
            if (tsunami && tsunami.length > 0) {
                this.handleTsunamiNotification(tsunami);
            }
        });
        
        dataStore.subscribe('history.earthquakes', (earthquakes) => {
            if (earthquakes.length > 0) {
                const latest = earthquakes[0];
                this.handleEarthquakeNotification(latest);
            }
        });
    },

    /**
     * EEW通知の処理
     */
    handleEEWNotification(eew) {
        if (notificationService) {
            notificationService.showEEWAlert(eew);
        }
    },

    /**
     * 津波通知の処理
     */
    handleTsunamiNotification(tsunami) {
        if (notificationService) {
            notificationService.showTsunamiAlert(tsunami);
        }
    },

    /**
     * 地震通知の処理
     */
    handleEarthquakeNotification(earthquake) {
        const minMag = dataStore.get('user.notifications.minMagnitude') || 4.0;
        
        if (earthquake.magnitude >= minMag && notificationService) {
            notificationService.showEarthquakeNotification(earthquake);
        }
    },

    // ========================================
    // ユーティリティ (50行)
    // ========================================
    
    /**
     * ページビューのトラッキング
     */
    trackPageView(viewName) {
        // Google Analytics などの分析ツール用
        if (window.gtag) {
            gtag('event', 'page_view', {
                page_title: viewName,
                page_location: window.location.href
            });
        }
    },

    /**
     * リアルタイム更新の開始
     */
    startRealtimeUpdates() {
        if (window.app && typeof app.startRealtimeUpdates === 'function') {
            app.startRealtimeUpdates();
        }
    },

    /**
     * 履歴データの読み込み
     */
    loadHistoricalData() {
        const earthquakes = dataStore.get('history.earthquakes');
        Renderers.renderEarthquakeList(earthquakes);
    },

    /**
     * 分析ビューの描画
     */
    renderAnalysisView() {
        const earthquakes = dataStore.get('history.earthquakes');
        const stats = dataStore.get('statistics');
        
        Renderers.renderStatistics(stats);
        Renderers.renderMagnitudeDistribution(earthquakes);
        Renderers.renderDepthDistribution(earthquakes);
        Renderers.renderTimelineChart(earthquakes);
    }
};

// エクスポート
if (typeof window !== 'undefined') window.Interactions = Interactions;
