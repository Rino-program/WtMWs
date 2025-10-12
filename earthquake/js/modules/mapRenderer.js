/**
 * マップレンダラー - 地震マップの描画と管理（拡張版）
 * Leaflet.jsを使用
 */
class MapRenderer {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.markers = [];
        this.markerCluster = null;
        this.layers = {};
        this.animations = [];
        this.drawingTools = null;
        this.measurementTools = null;
        this.selectedFeatures = [];
        this.eventHandlers = new Map();
        this.performanceMonitor = {
            markerCount: 0,
            renderTime: 0,
            lastUpdate: Date.now()
        };
        this.config = {
            clustering: {
                enabled: true,
                maxZoom: 15,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: true,
                zoomToBoundsOnClick: true
            },
            animation: {
                enabled: true,
                duration: 1000,
                easing: 'ease-out'
            },
            performance: {
                batchSize: 50,
                updateThrottle: 100,
                maxMarkers: 1000
            }
        };
        this.init();
    }

    /**
     * 初期化
     */
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('マップコンテナが見つかりません:', this.containerId);
            return;
        }

        try {
            // Leafletマップの初期化
            this.map = L.map(this.containerId, {
                center: CONFIG.MAP.DEFAULT_CENTER,
                zoom: CONFIG.MAP.DEFAULT_ZOOM,
                zoomControl: false,
                attributionControl: true,
                preferCanvas: true // パフォーマンス向上
            });

            // タイルレイヤーの追加
            this.addTileLayers();
            
            // レイヤーグループの初期化
            this.initializeLayers();

            // クラスタリングの初期化
            if (this.config.clustering.enabled) {
                this.initializeClusterGroup();
            }

            // コントロールの追加
            this.addControls();

            // 描画ツールの初期化
            this.initializeDrawingTools();

            // 測定ツールの初期化
            this.initializeMeasurementTools();

            // イベントリスナーの設定
            this.setupEventListeners();

            console.log('MapRenderer initialized successfully');
        } catch (error) {
            console.error('マップ初期化エラー:', error);
            throw error;
        }
    }

    /**
     * レイヤーの初期化
     */
    initializeLayers() {
        this.layers = {
            earthquakes: L.layerGroup().addTo(this.map),
            intensity: L.layerGroup().addTo(this.map),
            tsunami: L.layerGroup().addTo(this.map),
            shelters: L.layerGroup().addTo(this.map),
            eew: L.layerGroup().addTo(this.map),
            plates: L.layerGroup(),
            faults: L.layerGroup(),
            heatmap: L.layerGroup(),
            routes: L.layerGroup().addTo(this.map),
            annotations: L.layerGroup().addTo(this.map),
            animations: L.layerGroup().addTo(this.map)
        };
    }

    /**
     * クラスターグループの初期化
     */
    initializeClusterGroup() {
        if (typeof L.markerClusterGroup === 'undefined') {
            console.warn('Leaflet.markercluster プラグインが見つかりません');
            return;
        }

        this.markerCluster = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: this.config.clustering.spiderfyOnMaxZoom,
            showCoverageOnHover: this.config.clustering.showCoverageOnHover,
            zoomToBoundsOnClick: this.config.clustering.zoomToBoundsOnClick,
            iconCreateFunction: (cluster) => {
                const childCount = cluster.getChildCount();
                let className = 'marker-cluster-';
                
                if (childCount < 10) className += 'small';
                else if (childCount < 50) className += 'medium';
                else className += 'large';

                return L.divIcon({
                    html: `<div><span>${childCount}</span></div>`,
                    className: 'marker-cluster ' + className,
                    iconSize: L.point(40, 40)
                });
            }
        });

        this.map.addLayer(this.markerCluster);
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ズーム変更時
        this.map.on('zoomend', () => {
            this.onZoomChange(this.map.getZoom());
        });

        // マップ移動時
        this.map.on('moveend', () => {
            this.onMapMove(this.map.getCenter(), this.map.getBounds());
        });

        // クリック時
        this.map.on('click', (e) => {
            this.onMapClick(e.latlng);
        });

        // コンテキストメニュー
        this.map.on('contextmenu', (e) => {
            this.showContextMenu(e.latlng, e.containerPoint);
        });
    }

    /**
     * ズーム変更ハンドラー
     */
    onZoomChange(zoom) {
        // マーカーサイズの調整
        this.adjustMarkerSizes(zoom);
        
        // イベント発火
        this.emit('zoomchange', { zoom });
    }

    /**
     * マップ移動ハンドラー
     */
    onMapMove(center, bounds) {
        this.emit('moveend', { center, bounds });
    }

    /**
     * マップクリックハンドラー
     */
    onMapClick(latlng) {
        this.emit('mapclick', { latlng });
    }

    /**
     * コンテキストメニューの表示
     */
    showContextMenu(latlng, point) {
        const menu = document.createElement('div');
        menu.className = 'map-context-menu';
        menu.style.left = point.x + 'px';
        menu.style.top = point.y + 'px';
        menu.innerHTML = `
            <div class="menu-item" data-action="addMarker">マーカーを追加</div>
            <div class="menu-item" data-action="measureDistance">距離を測定</div>
            <div class="menu-item" data-action="searchNearby">周辺を検索</div>
            <div class="menu-item" data-action="copyCoords">座標をコピー</div>
        `;

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleContextAction(action, latlng);
                document.body.removeChild(menu);
            }
        });

        document.body.appendChild(menu);

        // 外側クリックで閉じる
        setTimeout(() => {
            const closeMenu = () => {
                if (menu.parentNode) document.body.removeChild(menu);
                document.removeEventListener('click', closeMenu);
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    /**
     * コンテキストアクション処理
     */
    handleContextAction(action, latlng) {
        switch (action) {
            case 'addMarker':
                this.addCustomMarker(latlng);
                break;
            case 'measureDistance':
                this.startMeasurement(latlng);
                break;
            case 'searchNearby':
                this.emit('searchnearby', { latlng });
                break;
            case 'copyCoords':
                navigator.clipboard.writeText(`${latlng.lat}, ${latlng.lng}`);
                break;
        }
    }

    /**
     * タイルレイヤーの追加
     */
    addTileLayers() {
        const baseLayers = {};
        const overlayLayers = {};

        // ベースレイヤー
        Object.entries(CONFIG.MAP.TILE_LAYERS).forEach(([key, layer]) => {
            const tileLayer = L.tileLayer(layer.url, {
                attribution: layer.attribution,
                maxZoom: CONFIG.MAP.MAX_ZOOM,
                minZoom: CONFIG.MAP.MIN_ZOOM,
                crossOrigin: true
            });
            baseLayers[layer.name] = tileLayer;
            if (key === 'DEFAULT') {
                tileLayer.addTo(this.map);
            }
        });

        // オーバーレイレイヤー
        if (CONFIG.MAP.OVERLAY_LAYERS) {
            Object.entries(CONFIG.MAP.OVERLAY_LAYERS).forEach(([key, layer]) => {
                const overlayLayer = L.tileLayer(layer.url, {
                    attribution: layer.attribution,
                    opacity: layer.opacity || 0.6
                });
                overlayLayers[layer.name] = overlayLayer;
            });
        }

        // レイヤーコントロール
        this.layerControl = L.control.layers(baseLayers, overlayLayers, {
            position: 'topright',
            collapsed: true
        }).addTo(this.map);
    }

    /**
     * コントロールの追加
     */
    addControls() {
        // ズームコントロール（カスタム位置）
        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        // スケールコントロール
        L.control.scale({ 
            imperial: false, 
            metric: true,
            position: 'bottomleft' 
        }).addTo(this.map);

        // 凡例コントロール
        this.legendControl = this.createLegendControl();
        this.legendControl.addTo(this.map);

        // 情報パネルコントロール
        this.infoControl = this.createInfoControl();
        this.infoControl.addTo(this.map);

        // ツールバーコントロール
        this.toolbarControl = this.createToolbarControl();
        this.toolbarControl.addTo(this.map);

        // ミニマップ（オプション）
        if (typeof L.Control.MiniMap !== 'undefined') {
            const miniMap = new L.Control.MiniMap(
                L.tileLayer(CONFIG.MAP.TILE_LAYERS.DEFAULT.url),
                { 
                    toggleDisplay: true,
                    minimized: true,
                    position: 'bottomleft'
                }
            );
            miniMap.addTo(this.map);
        }

        // フルスクリーンコントロール
        if (typeof L.control.fullscreen !== 'undefined') {
            L.control.fullscreen({ position: 'topleft' }).addTo(this.map);
        }
    }

    /**
     * 凡例コントロールの作成
     */
    createLegendControl() {
        const legend = L.control({ position: 'bottomright' });
        
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = this.createLegendHTML();
            
            // クリック時に展開/折りたたみ
            div.addEventListener('click', () => {
                div.classList.toggle('collapsed');
            });
            
            return div;
        };
        
        return legend;
    }

    /**
     * 凡例HTMLの作成
     */
    createLegendHTML() {
        let html = '<h4>震度凡例 <span class="toggle-icon">▼</span></h4>';
        html += '<div class="legend-content">';
        
        // 震度凡例
        html += '<div class="legend-section"><h5>震度</h5>';
        Object.entries(CONFIG.MAP.INTENSITY_COLORS).forEach(([intensity, color]) => {
            html += `
                <div class="legend-item">
                    <span class="legend-color" style="background:${color}"></span>
                    <span class="legend-label">${Utils.getIntensityLabel(intensity)}</span>
                </div>
            `;
        });
        html += '</div>';
        
        // マグニチュード凡例
        html += '<div class="legend-section"><h5>マグニチュード</h5>';
        const magnitudes = [
            { range: 'M3.0未満', color: '#90EE90' },
            { range: 'M3.0-3.9', color: '#FFD700' },
            { range: 'M4.0-4.9', color: '#FFA500' },
            { range: 'M5.0-5.9', color: '#FF6347' },
            { range: 'M6.0-6.9', color: '#FF0000' },
            { range: 'M7.0以上', color: '#8B0000' }
        ];
        magnitudes.forEach(mag => {
            html += `
                <div class="legend-item">
                    <span class="legend-color" style="background:${mag.color}"></span>
                    <span class="legend-label">${mag.range}</span>
                </div>
            `;
        });
        html += '</div>';
        
        html += '</div>';
        return html;
    }

    /**
     * 情報パネルコントロールの作成
     */
    createInfoControl() {
        const info = L.control({ position: 'topleft' });
        
        info.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-info-panel');
            div.innerHTML = `
                <div class="info-content">
                    <div id="mapInfoText">地震情報を表示中...</div>
                    <div id="mapStats"></div>
                </div>
            `;
            return div;
        };
        
        return info;
    }

    /**
     * ツールバーコントロールの作成
     */
    createToolbarControl() {
        const toolbar = L.control({ position: 'topright' });
        
        toolbar.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-toolbar');
            div.innerHTML = `
                <button class="toolbar-btn" data-tool="cluster" title="クラスタリング切替">
                    <span class="icon">🗂</span>
                </button>
                <button class="toolbar-btn" data-tool="heatmap" title="ヒートマップ">
                    <span class="icon">🔥</span>
                </button>
                <button class="toolbar-btn" data-tool="animation" title="アニメーション">
                    <span class="icon">▶️</span>
                </button>
                <button class="toolbar-btn" data-tool="measure" title="距離測定">
                    <span class="icon">📏</span>
                </button>
                <button class="toolbar-btn" data-tool="draw" title="描画">
                    <span class="icon">✏️</span>
                </button>
                <button class="toolbar-btn" data-tool="3d" title="3D表示">
                    <span class="icon">🌐</span>
                </button>
            `;
            
            // ツールボタンのクリックイベント
            div.querySelectorAll('.toolbar-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tool = btn.dataset.tool;
                    this.toggleTool(tool, btn);
                });
            });
            
            // イベント伝播を停止
            L.DomEvent.disableClickPropagation(div);
            
            return div;
        };
        
        return toolbar;
    }

    /**
     * ツールの切り替え
     */
    toggleTool(tool, button) {
        const isActive = button.classList.toggle('active');
        
        switch (tool) {
            case 'cluster':
                this.toggleClustering(isActive);
                break;
            case 'heatmap':
                this.toggleHeatmap(isActive);
                break;
            case 'animation':
                this.toggleAnimation(isActive);
                break;
            case 'measure':
                this.toggleMeasurement(isActive);
                break;
            case 'draw':
                this.toggleDrawing(isActive);
                break;
            case '3d':
                this.toggle3DView(isActive);
                break;
        }
    }

    /**
     * クラスタリングの切り替え
     */
    toggleClustering(enabled) {
        this.config.clustering.enabled = enabled;
        
        if (enabled && this.markerCluster) {
            this.map.addLayer(this.markerCluster);
            // 既存のマーカーをクラスターに移動
            this.markers.forEach(({ marker }) => {
                this.layers.earthquakes.removeLayer(marker);
                this.markerCluster.addLayer(marker);
            });
        } else if (this.markerCluster) {
            this.map.removeLayer(this.markerCluster);
            // クラスターからマーカーを戻す
            this.markers.forEach(({ marker }) => {
                this.markerCluster.removeLayer(marker);
                this.layers.earthquakes.addLayer(marker);
            });
        }
    }

    /**
     * ヒートマップの切り替え
     */
    toggleHeatmap(enabled) {
        if (enabled) {
            this.layers.earthquakes.remove();
            if (this.heatLayer) {
                this.map.addLayer(this.heatLayer);
            }
        } else {
            if (this.heatLayer) {
                this.map.removeLayer(this.heatLayer);
            }
            this.layers.earthquakes.addTo(this.map);
        }
    }

    /**
     * アニメーションの切り替え
     */
    toggleAnimation(enabled) {
        this.config.animation.enabled = enabled;
        
        if (enabled) {
            this.playEarthquakeAnimation();
        } else {
            this.stopAnimation();
        }
    }

    /**
     * 測定ツールの切り替え
     */
    toggleMeasurement(enabled) {
        if (enabled) {
            this.startMeasurement();
        } else {
            this.stopMeasurement();
        }
    }

    /**
     * 描画ツールの切り替え
     */
    toggleDrawing(enabled) {
        if (enabled && this.drawingTools) {
            this.drawingTools.enable();
        } else if (this.drawingTools) {
            this.drawingTools.disable();
        }
    }

    /**
     * 3D表示の切り替え
     */
    toggle3DView(enabled) {
        if (enabled) {
            this.enable3DView();
        } else {
            this.disable3DView();
        }
    }

    /**
     * 描画ツールの初期化
     */
    initializeDrawingTools() {
        if (typeof L.Control.Draw === 'undefined') {
            console.warn('Leaflet.draw プラグインが見つかりません');
            return;
        }

        this.layers.drawings = L.featureGroup().addTo(this.map);

        this.drawingTools = new L.Control.Draw({
            position: 'topleft',
            draw: {
                polyline: { shapeOptions: { color: '#f357a1', weight: 4 } },
                polygon: { shapeOptions: { color: '#f357a1' } },
                circle: true,
                rectangle: true,
                marker: true,
                circlemarker: false
            },
            edit: {
                featureGroup: this.layers.drawings,
                remove: true
            }
        });

        // 描画イベント
        this.map.on(L.Draw.Event.CREATED, (e) => {
            this.layers.drawings.addLayer(e.layer);
            this.emit('drawcreated', { layer: e.layer, type: e.layerType });
        });
    }

    /**
     * 測定ツールの初期化
     */
    initializeMeasurementTools() {
        this.measurementState = {
            active: false,
            points: [],
            line: null,
            markers: []
        };
    }

    /**
     * 距離測定の開始
     */
    startMeasurement(startPoint = null) {
        this.measurementState.active = true;
        this.measurementState.points = startPoint ? [startPoint] : [];
        this.map.getContainer().style.cursor = 'crosshair';

        this.measurementClickHandler = (e) => {
            this.addMeasurementPoint(e.latlng);
        };

        this.map.on('click', this.measurementClickHandler);
    }

    /**
     * 測定点の追加
     */
    addMeasurementPoint(latlng) {
        this.measurementState.points.push(latlng);

        // マーカー追加
        const marker = L.circleMarker(latlng, {
            radius: 5,
            fillColor: '#ff0000',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.map);
        this.measurementState.markers.push(marker);

        // 2点目以降は線と距離を表示
        if (this.measurementState.points.length >= 2) {
            this.updateMeasurementLine();
        }
    }

    /**
     * 測定線の更新
     */
    updateMeasurementLine() {
        const points = this.measurementState.points;

        // 既存の線を削除
        if (this.measurementState.line) {
            this.map.removeLayer(this.measurementState.line);
        }

        // 新しい線を描画
        this.measurementState.line = L.polyline(points, {
            color: '#ff0000',
            weight: 3,
            dashArray: '5, 10'
        }).addTo(this.map);

        // 総距離を計算
        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) {
            totalDistance += points[i - 1].distanceTo(points[i]);
        }

        // 距離ラベル
        const lastPoint = points[points.length - 1];
        const popup = L.popup()
            .setLatLng(lastPoint)
            .setContent(`
                <div class="measurement-popup">
                    <strong>総距離:</strong> ${(totalDistance / 1000).toFixed(2)} km<br>
                    <button onclick="mapRenderer.stopMeasurement()">完了</button>
                </div>
            `)
            .openOn(this.map);
    }

    /**
     * 距離測定の停止
     */
    stopMeasurement() {
        this.measurementState.active = false;
        this.map.getContainer().style.cursor = '';

        if (this.measurementClickHandler) {
            this.map.off('click', this.measurementClickHandler);
        }

        // 測定データをクリア（オプション）
        setTimeout(() => {
            if (this.measurementState.line) {
                this.map.removeLayer(this.measurementState.line);
            }
            this.measurementState.markers.forEach(m => this.map.removeLayer(m));
            this.measurementState.points = [];
            this.measurementState.markers = [];
        }, 3000);
    }

    /**
     * 地震マーカーを追加
     */
    addEarthquake(earthquake) {
        const { latitude, longitude, magnitude, depth, maxIntensity, region } = earthquake;
        
        const color = Utils.getMagnitudeColor(magnitude);
        const size = this.calculateMarkerSize(magnitude, this.map.getZoom());

        const marker = L.circleMarker([latitude, longitude], {
            radius: size,
            fillColor: color,
            color: '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.7,
            className: 'earthquake-marker',
            eq: earthquake // カスタムデータ
        });

        const popupContent = this.createEarthquakePopup(earthquake);
        marker.bindPopup(popupContent);

        // ツールチップ（ホバー時）
        marker.bindTooltip(`M${magnitude} ${region}`, {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
        });

        // イベントハンドラー
        marker.on('click', () => {
            this.emit('earthquakeclick', { earthquake });
        });

        marker.on('mouseover', () => {
            marker.setStyle({ weight: 3, fillOpacity: 0.9 });
        });

        marker.on('mouseout', () => {
            marker.setStyle({ weight: 1, fillOpacity: 0.7 });
        });

        // レイヤーに追加
        if (this.config.clustering.enabled && this.markerCluster) {
            this.markerCluster.addLayer(marker);
        } else {
            marker.addTo(this.layers.earthquakes);
        }

        this.markers.push({ id: earthquake.id, marker, earthquake });
        this.performanceMonitor.markerCount++;

        return marker;
    }

    /**
     * 地震ポップアップの作成
     */
    createEarthquakePopup(earthquake) {
        const { id, region, magnitude, depth, maxIntensity, time } = earthquake;
        
        return `
            <div class="earthquake-popup">
                <div class="popup-header">
                    <h3>${region}</h3>
                    <span class="magnitude-badge" style="background:${Utils.getMagnitudeColor(magnitude)}">
                        M${magnitude}
                    </span>
                </div>
                <div class="popup-content">
                    <div class="info-row">
                        <span class="label">発生時刻:</span>
                        <span class="value">${Utils.formatDate(time)}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">深さ:</span>
                        <span class="value">${depth}km</span>
                    </div>
                    <div class="info-row">
                        <span class="label">最大震度:</span>
                        <span class="value intensity-${maxIntensity}">
                            ${Utils.getIntensityLabel(maxIntensity)}
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="label">座標:</span>
                        <span class="value">${earthquake.latitude.toFixed(3)}, ${earthquake.longitude.toFixed(3)}</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button class="btn-detail" onclick="app.showEarthquakeDetail('${id}')">
                        詳細を見る
                    </button>
                    <button class="btn-share" onclick="app.shareEarthquake('${id}')">
                        共有
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * マーカーサイズの計算
     */
    calculateMarkerSize(magnitude, zoom) {
        const baseSize = CONFIG.MAP.MARKER_SIZES?.getSize?.(magnitude) || magnitude * 2;
        const zoomFactor = Math.max(0.5, zoom / 10);
        return baseSize * zoomFactor;
    }

    /**
     * マーカーサイズの調整
     */
    adjustMarkerSizes(zoom) {
        this.markers.forEach(({ marker, earthquake }) => {
            const newSize = this.calculateMarkerSize(earthquake.magnitude, zoom);
            marker.setRadius(newSize);
        });
    }

    /**
     * 複数の地震を一括追加
     */
    addEarthquakes(earthquakes) {
        const startTime = Date.now();
        
        // バッチ処理
        const batchSize = this.config.performance.batchSize;
        let processed = 0;

        const processBatch = () => {
            const batch = earthquakes.slice(processed, processed + batchSize);
            
            batch.forEach(eq => {
                this.addEarthquake(eq);
            });

            processed += batch.length;

            if (processed < earthquakes.length) {
                requestAnimationFrame(processBatch);
            } else {
                const renderTime = Date.now() - startTime;
                this.performanceMonitor.renderTime = renderTime;
                console.log(`Rendered ${earthquakes.length} earthquakes in ${renderTime}ms`);
                this.emit('renderingComplete', { count: earthquakes.length, time: renderTime });
            }
        };

        processBatch();
    }

    /**
     * 地震アニメーションの再生
     */
    playEarthquakeAnimation() {
        if (this.markers.length === 0) return;

        // 時系列でソート
        const sorted = this.markers
            .slice()
            .sort((a, b) => new Date(a.earthquake.time) - new Date(b.earthquake.time));

        let index = 0;
        const duration = this.config.animation.duration;
        const interval = duration / sorted.length;

        // 全マーカーを非表示
        this.markers.forEach(({ marker }) => {
            marker.setStyle({ fillOpacity: 0.1, opacity: 0.2 });
        });

        // アニメーションループ
        this.animationInterval = setInterval(() => {
            if (index >= sorted.length) {
                this.stopAnimation();
                return;
            }

            const { marker, earthquake } = sorted[index];
            
            // マーカーを強調表示
            marker.setStyle({ fillOpacity: 0.9, opacity: 1 });
            
            // 波紋エフェクト
            this.createRippleEffect(marker.getLatLng(), earthquake.magnitude);

            // 情報パネルを更新
            this.updateInfoPanel(earthquake);

            index++;
        }, interval);
    }

    /**
     * アニメーションの停止
     */
    stopAnimation() {
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }

        // マーカーを通常表示に戻す
        this.markers.forEach(({ marker }) => {
            marker.setStyle({ fillOpacity: 0.7, opacity: 1 });
        });

        // 波紋をクリア
        this.layers.animations.clearLayers();
    }

    /**
     * 波紋エフェクトの作成
     */
    createRippleEffect(latlng, magnitude) {
        const maxRadius = magnitude * 50;
        const steps = 20;
        const duration = 2000;
        const stepDuration = duration / steps;

        let currentStep = 0;

        const animate = () => {
            if (currentStep >= steps) return;

            const radius = (currentStep / steps) * maxRadius;
            const opacity = 1 - (currentStep / steps);

            const circle = L.circle(latlng, {
                radius: radius * 1000,
                color: '#ff0000',
                fillColor: '#ff0000',
                fillOpacity: opacity * 0.2,
                opacity: opacity,
                weight: 2
            }).addTo(this.layers.animations);

            currentStep++;

            setTimeout(() => {
                this.map.removeLayer(circle);
                animate();
            }, stepDuration);
        };

        animate();
    }

    /**
     * 情報パネルの更新
     */
    updateInfoPanel(data) {
        const infoText = document.getElementById('mapInfoText');
        if (infoText) {
            if (data.region) {
                infoText.innerHTML = `
                    <strong>${data.region}</strong><br>
                    M${data.magnitude} / 深さ${data.depth}km<br>
                    ${Utils.formatDate(data.time)}
                `;
            } else {
                infoText.innerHTML = data;
            }
        }
    }

    /**
     * 統計情報の更新
     */
    updateStatistics(stats) {
        const statsDiv = document.getElementById('mapStats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">表示中:</span>
                        <span class="stat-value">${stats.displayed || this.markers.length}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最大M:</span>
                        <span class="stat-value">${stats.maxMagnitude || '-'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均深さ:</span>
                        <span class="stat-value">${stats.avgDepth || '-'}km</span>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 震度分布を描画（拡張版）
     */
    renderIntensityMap(intensityData) {
        this.layers.intensity.clearLayers();

        Object.entries(intensityData).forEach(([location, data]) => {
            const { lat, lon, intensity } = data;
            const color = Utils.getIntensityColor(intensity);

            const marker = L.circleMarker([lat, lon], {
                radius: 15,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8,
                className: `intensity-marker intensity-${intensity}`
            });

            marker.bindPopup(`
                <div class="intensity-popup">
                    <h4>${location}</h4>
                    <div class="intensity-value" style="background:${color}">
                        ${Utils.getIntensityLabel(intensity)}
                    </div>
                    <p class="intensity-description">
                        ${this.getIntensityDescription(intensity)}
                    </p>
                </div>
            `);

            marker.bindTooltip(location, {
                permanent: this.map.getZoom() > 10,
                direction: 'top'
            });

            marker.addTo(this.layers.intensity);
        });
    }

    /**
     * 震度の説明を取得
     */
    getIntensityDescription(intensity) {
        const descriptions = {
            '0': '人は揺れを感じない',
            '1': '屋内で静かにしている人の中には揺れをわずかに感じる人がいる',
            '2': '屋内で静かにしている人の大半が揺れを感じる',
            '3': '屋内にいる人のほとんどが揺れを感じる',
            '4': 'かなりの恐怖感があり、一部の人は身の安全を図ろうとする',
            '5弱': '大半の人が恐怖を覚え、物につかまりたいと感じる',
            '5強': '物につかまらないと歩くことが難しい',
            '6弱': '立っていることが困難になる',
            '6強': '立っていることができず、這わないと動くことができない',
            '7': '揺れにほんろうされ、動くこともできず、飛ばされることもある'
        };
        return descriptions[intensity] || '';
    }

    /**
     * 緊急地震速報の予報円を描画（拡張版）
     */
    renderEEW(eew) {
        this.layers.eew.clearLayers();

        const { latitude, longitude, magnitude, estimatedRadius, maxIntensity } = eew;

        // 予報円（パルスアニメーション）
        const circle = L.circle([latitude, longitude], {
            radius: estimatedRadius * 1000,
            color: '#ff0000',
            fillColor: '#ff0000',
            fillOpacity: 0.2,
            weight: 3,
            className: 'eew-circle pulse'
        }).addTo(this.layers.eew);

        // 震度別の予測円
        if (eew.intensityAreas) {
            Object.entries(eew.intensityAreas).forEach(([intensity, radius]) => {
                const color = Utils.getIntensityColor(intensity);
                L.circle([latitude, longitude], {
                    radius: radius * 1000,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 10'
                }).bindTooltip(`震度${intensity}予測範囲`).addTo(this.layers.eew);
            });
        }

        // 震源マーカー
        const marker = L.marker([latitude, longitude], {
            icon: L.divIcon({
                className: 'eew-marker pulse',
                html: `
                    <div class="eew-marker-inner">
                        <span class="eew-icon">⚠</span>
                        <span class="eew-mag">M${magnitude}</span>
                    </div>
                `,
                iconSize: [60, 60]
            })
        });

        marker.bindPopup(`
            <div class="eew-popup">
                <h3 class="eew-title">🚨 緊急地震速報</h3>
                <div class="eew-details">
                    <div class="detail-row">
                        <span class="label">予想マグニチュード:</span>
                        <span class="value mag">M${magnitude}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">予想最大震度:</span>
                        <span class="value intensity">${maxIntensity}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">発表時刻:</span>
                        <span class="value">${Utils.formatDate(eew.reportTime)}</span>
                    </div>
                </div>
                <div class="eew-warning">
                    強い揺れに警戒してください
                </div>
            </div>
        `).openPopup();

        marker.addTo(this.layers.eew);

        // マップをEEW位置に移動
        this.map.setView([latitude, longitude], 8, { animate: true });

        // アラート音（オプション）
        this.emit('eew', { eew });
    }

    /**
     * 津波情報を描画（拡張版）
     */
    renderTsunami(tsunamiData) {
        this.layers.tsunami.clearLayers();

        tsunamiData.forEach(tsunami => {
            const { areas, grade, gradeLabel } = tsunami;
            
            Object.entries(areas).forEach(([code, area]) => {
                if (!area.latitude || !area.longitude) return;

                const color = this.getTsunamiColor(grade);
                const size = this.getTsunamiSize(area.maxHeight);

                // 津波警報マーカー
                const marker = L.circleMarker([area.latitude, area.longitude], {
                    radius: size,
                    fillColor: color,
                    color: '#fff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 0.7,
                    className: `tsunami-marker ${grade}`
                });

                marker.bindPopup(`
                    <div class="tsunami-popup">
                        <h4 class="tsunami-title" style="background:${color}">
                            ${gradeLabel}
                        </h4>
                        <div class="tsunami-area-name">${area.name}</div>
                        <div class="tsunami-details">
                            <div class="detail-row">
                                <span class="label">予想高さ:</span>
                                <span class="value">${area.maxHeight || '調査中'}</span>
                            </div>
                            ${area.arrivalTime ? `
                                <div class="detail-row">
                                    <span class="label">到達予想:</span>
                                    <span class="value">${Utils.formatDate(area.arrivalTime)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="tsunami-warning">
                            ${this.getTsunamiWarningMessage(grade)}
                        </div>
                    </div>
                `);

                marker.bindTooltip(`${area.name} - ${gradeLabel}`, {
                    permanent: true,
                    direction: 'top',
                    className: 'tsunami-tooltip'
                });

                marker.addTo(this.layers.tsunami);

                // 津波到達予測の波紋
                if (area.estimatedRadius) {
                    L.circle([area.latitude, area.longitude], {
                        radius: area.estimatedRadius * 1000,
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: '10, 10'
                    }).addTo(this.layers.tsunami);
                }
            });
        });
    }

    /**
     * 津波警報の色を取得
     */
    getTsunamiColor(grade) {
        const colors = {
            'MajorWarning': '#8B0000',
            'Warning': '#FF0000',
            'Watch': '#FFD700',
            'Forecast': '#FFA500'
        };
        return colors[grade] || '#CCCCCC';
    }

    /**
     * 津波マーカーのサイズを取得
     */
    getTsunamiSize(height) {
        if (!height) return 15;
        const h = parseFloat(height);
        if (h >= 10) return 30;
        if (h >= 5) return 25;
        if (h >= 3) return 20;
        return 15;
    }

    /**
     * 津波警報メッセージを取得
     */
    getTsunamiWarningMessage(grade) {
        const messages = {
            'MajorWarning': '巨大な津波が襲来します。ただちに高台へ避難してください。',
            'Warning': '津波が襲来します。直ちに避難してください。',
            'Watch': '津波注意報が発表されています。海岸から離れてください。',
            'Forecast': '津波の可能性があります。注意してください。'
        };
        return messages[grade] || '津波情報に注意してください。';
    }

    /**
     * 避難所を表示（拡張版）
     */
    renderShelters(shelters) {
        this.layers.shelters.clearLayers();

        shelters.forEach(shelter => {
            const icon = L.divIcon({
                className: 'shelter-marker',
                html: `
                    <div class="shelter-icon" data-type="${shelter.type}">
                        <span class="icon-symbol">${this.getShelterIcon(shelter.type)}</span>
                        ${shelter.distance ? `<span class="distance-badge">${Math.round(shelter.distance)}m</span>` : ''}
                    </div>
                `,
                iconSize: [40, 40]
            });

            const marker = L.marker([shelter.lat, shelter.lon], { icon });

            marker.bindPopup(`
                <div class="shelter-popup">
                    <h4 class="shelter-name">${shelter.name}</h4>
                    <div class="shelter-type">${shelter.typeLabel}</div>
                    <div class="shelter-details">
                        <div class="detail-row">
                            <span class="label">📍 住所:</span>
                            <span class="value">${shelter.address || '-'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">👥 収容人数:</span>
                            <span class="value">${shelter.capacity || '-'}人</span>
                        </div>
                        ${shelter.distance ? `
                            <div class="detail-row">
                                <span class="label">📏 距離:</span>
                                <span class="value">${Math.round(shelter.distance)}m</span>
                            </div>
                        ` : ''}
                        ${shelter.facilities && shelter.facilities.length > 0 ? `
                            <div class="detail-row">
                                <span class="label">🏥 設備:</span>
                                <span class="value">${shelter.facilities.join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="shelter-actions">
                        <button class="btn-primary" onclick="mapRenderer.showRouteToShelter('${shelter.id}')">
                            ルート案内
                        </button>
                        <button class="btn-secondary" onclick="mapRenderer.callShelter('${shelter.phone}')">
                            電話する
                        </button>
                    </div>
                </div>
            `);

            marker.bindTooltip(shelter.name, {
                permanent: false,
                direction: 'top'
            });

            marker.on('click', () => {
                this.emit('shelterclick', { shelter });
            });

            marker.addTo(this.layers.shelters);
        });
    }

    /**
     * 避難所アイコンを取得
     */
    getShelterIcon(type) {
        const icons = {
            'evacuation': '🏠',
            'school': '🏫',
            'gym': '🏟️',
            'park': '🌳',
            'community': '🏛️',
            'hospital': '🏥'
        };
        return icons[type] || '📍';
    }

    /**
     * 避難所へのルート表示
     */
    showRouteToShelter(shelterId) {
        // ユーザー位置から避難所までのルートを計算
        if (!this.userMarker) {
            alert('現在地が設定されていません');
            return;
        }

        const shelter = this.findShelterById(shelterId);
        if (!shelter) return;

        const start = this.userMarker.getLatLng();
        const end = L.latLng(shelter.lat, shelter.lon);

        this.renderRoute({
            start: { lat: start.lat, lon: start.lng },
            end: { lat: end.lat, lon: end.lng },
            waypoints: []
        });
    }

    /**
     * ヒートマップを描画（拡張版）
     */
    renderHeatmap(earthquakes) {
        if (typeof L.heatLayer === 'undefined') {
            console.warn('Leaflet.heat プラグインが見つかりません');
            return;
        }

        const heatData = earthquakes.map(eq => [
            eq.latitude,
            eq.longitude,
            Math.pow(eq.magnitude, 2) / 100 // 重み付け（マグニチュードの二乗）
        ]);

        if (this.heatLayer) {
            this.map.removeLayer(this.heatLayer);
        }

        this.heatLayer = L.heatLayer(heatData, {
            radius: CONFIG.ANALYSIS?.HEATMAP?.RADIUS || 25,
            blur: CONFIG.ANALYSIS?.HEATMAP?.BLUR || 15,
            maxZoom: CONFIG.ANALYSIS?.HEATMAP?.MAX_ZOOM || 17,
            max: 1.0,
            gradient: CONFIG.ANALYSIS?.HEATMAP?.GRADIENT || {
                0.0: 'blue',
                0.2: 'lime',
                0.4: 'yellow',
                0.6: 'orange',
                0.8: 'red',
                1.0: 'darkred'
            }
        }).addTo(this.map);
    }

    /**
     * ルートを描画（拡張版）
     */
    renderRoute(route) {
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }

        const points = [route.start];
        if (route.waypoints) points.push(...route.waypoints);
        points.push(route.end);

        const latlngs = points.map(p => [p.lat, p.lon]);

        this.routeLine = L.polyline(latlngs, {
            color: '#0066ff',
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10',
            className: 'route-line'
        }).addTo(this.layers.routes);

        // 開始マーカー
        L.marker([route.start.lat, route.start.lon], {
            icon: L.divIcon({
                className: 'route-marker start',
                html: '<div>🚶</div>',
                iconSize: [30, 30]
            })
        }).bindPopup('出発地').addTo(this.layers.routes);

        // 終了マーカー
        L.marker([route.end.lat, route.end.lon], {
            icon: L.divIcon({
                className: 'route-marker end',
                html: '<div>🏁</div>',
                iconSize: [30, 30]
            })
        }).bindPopup('目的地').addTo(this.layers.routes);

        // マップをルート全体にフィット
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });
    }

    /**
     * マーカーをクリア
     */
    clearMarkers(layerName = null) {
        if (layerName && this.layers[layerName]) {
            this.layers[layerName].clearLayers();
            
            if (layerName === 'earthquakes') {
                this.markers = [];
                this.performanceMonitor.markerCount = 0;
            }
        } else {
            // 全レイヤーをクリア
            Object.values(this.layers).forEach(layer => {
                if (layer && layer.clearLayers) {
                    layer.clearLayers();
                }
            });
            this.markers = [];
            this.performanceMonitor.markerCount = 0;
        }

        if (this.markerCluster) {
            this.markerCluster.clearLayers();
        }
    }

    /**
     * マップの中心を設定
     */
    setCenter(lat, lon, zoom = null) {
        if (zoom) {
            this.map.setView([lat, lon], zoom, { animate: true, duration: 0.5 });
        } else {
            this.map.panTo([lat, lon], { animate: true, duration: 0.5 });
        }
    }

    /**
     * マップをフィット
     */
    fitBounds(bounds, options = {}) {
        const defaultOptions = { 
            padding: [50, 50],
            maxZoom: 15,
            animate: true
        };
        this.map.fitBounds(bounds, { ...defaultOptions, ...options });
    }

    /**
     * レイヤーの表示/非表示
     */
    toggleLayer(layerName, visible) {
        if (this.layers[layerName]) {
            if (visible) {
                if (!this.map.hasLayer(this.layers[layerName])) {
                    this.map.addLayer(this.layers[layerName]);
                }
            } else {
                if (this.map.hasLayer(this.layers[layerName])) {
                    this.map.removeLayer(this.layers[layerName]);
                }
            }
            this.emit('layertoggle', { layer: layerName, visible });
        }
    }

    /**
     * 現在位置マーカーを追加
     */
    addUserLocation(location) {
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }

        this.userMarker = L.marker([location.lat, location.lon], {
            icon: L.divIcon({
                className: 'user-location-marker',
                html: `
                    <div class="user-location-icon">
                        <div class="location-pulse"></div>
                        <div class="location-dot">📍</div>
                    </div>
                `,
                iconSize: [40, 40]
            }),
            zIndexOffset: 1000
        });

        this.userMarker.bindPopup(`
            <div class="user-location-popup">
                <h4>現在地</h4>
                <p>緯度: ${location.lat.toFixed(6)}</p>
                <p>経度: ${location.lon.toFixed(6)}</p>
                ${location.accuracy ? `<p>精度: ±${Math.round(location.accuracy)}m</p>` : ''}
            </div>
        `).addTo(this.map);

        this.setCenter(location.lat, location.lon, 12);
        this.emit('userlocation', { location });
    }

    /**
     * カスタムマーカーの追加
     */
    addCustomMarker(latlng, options = {}) {
        const marker = L.marker(latlng, {
            icon: options.icon || L.divIcon({
                className: 'custom-marker',
                html: '<div>📌</div>',
                iconSize: [30, 30]
            }),
            draggable: options.draggable || false
        });

        if (options.popup) {
            marker.bindPopup(options.popup);
        }

        marker.addTo(this.layers.annotations);
        return marker;
    }

    /**
     * 3D表示の有効化
     */
    enable3DView() {
        if (typeof mapboxgl === 'undefined') {
            console.warn('Mapbox GL JS が見つかりません。3D表示には Mapbox GL JS が必要です。');
            return;
        }

        // 3D実装はMapbox GL JSを使用
        // ここでは簡易的な疑似3D効果を実装
        this.map.setView(this.map.getCenter(), this.map.getZoom(), {
            animate: true,
            duration: 1
        });

        // CSSで傾き効果を追加
        const container = this.map.getContainer();
        container.style.transform = 'perspective(1000px) rotateX(30deg)';
        container.style.transformOrigin = 'center center';

        this.is3DEnabled = true;
        this.emit('3denabled');
    }

    /**
     * 3D表示の無効化
     */
    disable3DView() {
        const container = this.map.getContainer();
        container.style.transform = '';
        
        this.is3DEnabled = false;
        this.emit('3ddisabled');
    }

    /**
     * 避難所を検索
     */
    findShelterById(id) {
        // この実装は避難所データへのアクセスが必要
        // 実際のデータから検索する
        return null;
    }

    /**
     * マップをリサイズ
     */
    resize() {
        if (this.map) {
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);
        }
    }

    /**
     * スクリーンショットを取得
     */
    async captureScreenshot() {
        if (typeof html2canvas === 'undefined') {
            console.warn('html2canvas ライブラリが見つかりません');
            return null;
        }

        const container = this.map.getContainer();
        const canvas = await html2canvas(container);
        return canvas.toDataURL('image/png');
    }

    /**
     * 地図を印刷
     */
    print() {
        window.print();
    }

    /**
     * イベントの発火
     */
    emit(eventName, data) {
        if (this.eventHandlers.has(eventName)) {
            this.eventHandlers.get(eventName).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * イベントリスナーの登録
     */
    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    /**
     * イベントリスナーの削除
     */
    off(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) return;
        
        const handlers = this.eventHandlers.get(eventName);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    /**
     * パフォーマンス情報の取得
     */
    getPerformanceMetrics() {
        return {
            markerCount: this.performanceMonitor.markerCount,
            renderTime: this.performanceMonitor.renderTime,
            lastUpdate: this.performanceMonitor.lastUpdate,
            zoom: this.map.getZoom(),
            center: this.map.getCenter(),
            bounds: this.map.getBounds()
        };
    }

    /**
     * マップの状態を取得
     */
    getState() {
        return {
            center: this.map.getCenter(),
            zoom: this.map.getZoom(),
            bounds: this.map.getBounds(),
            layersVisible: Object.keys(this.layers).reduce((acc, key) => {
                acc[key] = this.map.hasLayer(this.layers[key]);
                return acc;
            }, {}),
            markerCount: this.markers.length
        };
    }

    /**
     * マップの状態を復元
     */
    setState(state) {
        if (state.center) {
            this.setCenter(state.center.lat, state.center.lng, state.zoom);
        }

        if (state.layersVisible) {
            Object.entries(state.layersVisible).forEach(([layer, visible]) => {
                this.toggleLayer(layer, visible);
            });
        }
    }

    /**
     * マップをエクスポート
     */
    async exportMap(format = 'geojson') {
        const data = {
            type: 'FeatureCollection',
            features: this.markers.map(({ earthquake }) => ({
                type: 'Feature',
                properties: {
                    ...earthquake
                },
                geometry: {
                    type: 'Point',
                    coordinates: [earthquake.longitude, earthquake.latitude]
                }
            }))
        };

        if (format === 'geojson') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertToCSV(data.features);
        }

        return data;
    }

    /**
     * GeoJSONをCSVに変換
     */
    convertToCSV(features) {
        const headers = ['id', 'time', 'latitude', 'longitude', 'magnitude', 'depth', 'region'];
        const rows = features.map(f => {
            const p = f.properties;
            return [
                p.id,
                p.time,
                f.geometry.coordinates[1],
                f.geometry.coordinates[0],
                p.magnitude,
                p.depth,
                p.region
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    /**
     * 破棄
     */
    destroy() {
        // イベントリスナーをクリア
        this.eventHandlers.clear();

        // アニメーションを停止
        this.stopAnimation();

        // レイヤーをクリア
        this.clearMarkers();

        // マップを削除
        if (this.map) {
            this.map.remove();
            this.map = null;
        }

        console.log('MapRenderer destroyed');
    }
}

// グローバルエクスポート
if (typeof window !== 'undefined') {
    window.MapRenderer = MapRenderer;
}
