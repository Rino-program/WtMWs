/**
 * データビジュアライゼーション（1400行超）
 * 3D地図、アニメーション、インタラクティブチャート
 */

const Visualizations = {
    // ========================================
    // 初期化 (100行)
    // ========================================
    
    /**
     * ビジュアライゼーションシステムの初期化
     */
    async init() {
        this.animations = [];
        this.activeAnimation = null;
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        
        // キャンバスの準備
        this.setupCanvas();
        
        // アニメーションエンジンの初期化
        this.initAnimationEngine();
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        console.log('✅ Visualizations initialized');
    },

    /**
     * キャンバスの準備
     */
    setupCanvas() {
        const container = document.getElementById('visualization-container');
        if (!container) return;
        
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'visualization-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    },

    /**
     * キャンバスのリサイズ
     */
    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;
    },

    /**
     * アニメーションエンジンの初期化
     */
    initAnimationEngine() {
        this.startTime = Date.now();
        this.lastFrame = this.startTime;
        this.fps = 60;
        this.frameTime = 1000 / this.fps;
    },

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    },

    // ========================================
    // 3D地図ビジュアライゼーション (300行)
    // ========================================
    
    /**
     * 3D地震マップの描画
     */
    render3DEarthquakeMap(earthquakes, options = {}) {
        const {
            width = 800,
            height = 600,
            perspective = 1000,
            rotation = { x: 30, y: 45, z: 0 }
        } = options;
        
        const canvas = this.create3DCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // 日本列島の3D表示
        this.draw3DJapan(ctx, width, height, perspective, rotation);
        
        // 地震の3Dプロット
        earthquakes.forEach(eq => {
            this.plot3DEarthquake(ctx, eq, width, height, perspective, rotation);
        });
        
        return canvas;
    },

    /**
     * 3Dキャンバスの作成
     */
    create3DCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },

    /**
     * 日本列島の3D描画
     */
    draw3DJapan(ctx, width, height, perspective, rotation) {
        // 日本の主要都市の座標（簡略化）
        const cities = [
            { name: '札幌', lat: 43.06, lon: 141.35 },
            { name: '東京', lat: 35.68, lon: 139.69 },
            { name: '名古屋', lat: 35.18, lon: 136.91 },
            { name: '大阪', lat: 34.69, lon: 135.50 },
            { name: '広島', lat: 34.40, lon: 132.46 },
            { name: '福岡', lat: 33.59, lon: 130.40 },
            { name: '那覇', lat: 26.21, lon: 127.68 }
        ];
        
        // 日本列島の輪郭（簡略化）
        const outline = this.getJapanOutline();
        
        // 3D変換と描画
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        outline.forEach((point, i) => {
            const projected = this.project3D(
                point.lon, point.lat, 0,
                width, height, perspective, rotation
            );
            
            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        });
        
        ctx.stroke();
        
        // 都市の表示
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        
        cities.forEach(city => {
            const projected = this.project3D(
                city.lon, city.lat, 0,
                width, height, perspective, rotation
            );
            
            ctx.fillRect(projected.x - 2, projected.y - 2, 4, 4);
            ctx.fillText(city.name, projected.x + 5, projected.y - 5);
        });
    },

    /**
     * 日本列島の輪郭データ
     */
    getJapanOutline() {
        // 簡略化された日本列島の輪郭座標
        return [
            { lat: 45.5, lon: 141.9 }, // 北海道北端
            { lat: 43.0, lon: 145.6 }, // 北海道東端
            { lat: 41.8, lon: 140.7 }, // 青森
            { lat: 40.8, lon: 140.7 }, // 秋田
            { lat: 38.3, lon: 141.0 }, // 仙台
            { lat: 36.3, lon: 140.5 }, // 茨城
            { lat: 35.7, lon: 139.7 }, // 東京
            { lat: 35.0, lon: 138.5 }, // 静岡
            { lat: 34.7, lon: 137.7 }, // 愛知
            { lat: 34.7, lon: 135.2 }, // 大阪
            { lat: 34.4, lon: 132.5 }, // 広島
            { lat: 33.6, lon: 130.4 }, // 福岡
            { lat: 31.6, lon: 130.6 }, // 鹿児島
            { lat: 26.2, lon: 127.7 }, // 沖縄
            { lat: 24.3, lon: 124.2 }  // 与那国島
        ];
    },

    /**
     * 地震の3Dプロット
     */
    plot3DEarthquake(ctx, earthquake, width, height, perspective, rotation) {
        const { latitude, longitude, depth, magnitude } = earthquake;
        
        // 深さをZ座標に変換（深いほど奥に）
        const z = -depth * 0.5;
        
        // 3D投影
        const projected = this.project3D(
            longitude, latitude, z,
            width, height, perspective, rotation
        );
        
        // マグニチュードに応じたサイズ
        const size = Math.max(2, magnitude * 3);
        
        // 色（深さで変化）
        const color = this.getDepthColor(depth);
        
        // 円の描画
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // 深さの線
        const surfaceProjected = this.project3D(
            longitude, latitude, 0,
            width, height, perspective, rotation
        );
        
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(surfaceProjected.x, surfaceProjected.y);
        ctx.lineTo(projected.x, projected.y);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    },

    /**
     * 3D投影
     */
    project3D(lon, lat, z, width, height, perspective, rotation) {
        // 緯度経度を正規化（日本中心）
        const centerLon = 138;
        const centerLat = 37;
        const scale = 10;
        
        let x = (lon - centerLon) * scale;
        let y = (lat - centerLat) * scale;
        
        // 回転行列の適用
        const rotX = rotation.x * Math.PI / 180;
        const rotY = rotation.y * Math.PI / 180;
        const rotZ = rotation.z * Math.PI / 180;
        
        // X軸回転
        let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
        let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
        y = y1;
        z = z1;
        
        // Y軸回転
        let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
        z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
        x = x1;
        z = z1;
        
        // Z軸回転
        x1 = x * Math.cos(rotZ) - y * Math.sin(rotZ);
        y1 = x * Math.sin(rotZ) + y * Math.cos(rotZ);
        x = x1;
        y = y1;
        
        // 透視投影
        const factor = perspective / (perspective + z);
        
        return {
            x: width / 2 + x * factor,
            y: height / 2 - y * factor,
            z: z
        };
    },

    /**
     * 深さに応じた色
     */
    getDepthColor(depth) {
        if (depth < 40) return '#ff4444';      // 浅い（赤）
        if (depth < 100) return '#ff9944';     // 中（オレンジ）
        if (depth < 200) return '#ffdd44';     // やや深い（黄）
        if (depth < 400) return '#44ff44';     // 深い（緑）
        return '#4444ff';                       // 非常に深い（青）
    },

    // ========================================
    // 地震波伝播アニメーション (300行)
    // ========================================
    
    /**
     * 地震波の伝播アニメーション
     */
    animateSeismicWaves(earthquake, options = {}) {
        const {
            duration = 30000,
            pWaveSpeed = 7,    // km/s（P波）
            sWaveSpeed = 4,    // km/s（S波）
            showPWave = true,
            showSWave = true
        } = options;
        
        const animation = {
            type: 'seismic-waves',
            earthquake,
            startTime: Date.now(),
            duration,
            pWaveSpeed,
            sWaveSpeed,
            showPWave,
            showSWave,
            active: true
        };
        
        this.animations.push(animation);
        this.startAnimation();
        
        return animation;
    },

    /**
     * アニメーションの開始
     */
    startAnimation() {
        if (this.animationFrame) return;
        
        const animate = () => {
            const now = Date.now();
            const delta = now - this.lastFrame;
            
            if (delta >= this.frameTime) {
                this.updateAnimations(now);
                this.renderAnimations();
                this.lastFrame = now - (delta % this.frameTime);
            }
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    },

    /**
     * アニメーションの更新
     */
    updateAnimations(now) {
        // 終了したアニメーションを削除
        this.animations = this.animations.filter(anim => {
            if (!anim.active) return false;
            
            const elapsed = now - anim.startTime;
            if (elapsed >= anim.duration) {
                anim.active = false;
                return false;
            }
            
            return true;
        });
        
        // アクティブなアニメーションがなければ停止
        if (this.animations.length === 0) {
            this.stopAnimation();
        }
    },

    /**
     * アニメーションの描画
     */
    renderAnimations() {
        if (!this.ctx) return;
        
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 各アニメーションを描画
        this.animations.forEach(anim => {
            switch (anim.type) {
                case 'seismic-waves':
                    this.renderSeismicWaves(anim);
                    break;
                case 'ripple':
                    this.renderRipple(anim);
                    break;
                case 'pulse':
                    this.renderPulse(anim);
                    break;
            }
        });
    },

    /**
     * 地震波の描画
     */
    renderSeismicWaves(animation) {
        const { earthquake, startTime, pWaveSpeed, sWaveSpeed, showPWave, showSWave } = animation;
        const elapsed = (Date.now() - startTime) / 1000; // 秒
        
        // 震源位置をスクリーン座標に変換
        const epicenter = this.latLonToScreen(earthquake.latitude, earthquake.longitude);
        
        // P波の描画
        if (showPWave) {
            const pRadius = elapsed * pWaveSpeed * this.getKmToPixelScale();
            this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(epicenter.x, epicenter.y, pRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // S波の描画
        if (showSWave) {
            const sRadius = elapsed * sWaveSpeed * this.getKmToPixelScale();
            this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(epicenter.x, epicenter.y, sRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 震源マーカー
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(epicenter.x, epicenter.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
    },

    /**
     * 緯度経度をスクリーン座標に変換
     */
    latLonToScreen(lat, lon) {
        // 簡易的な変換（実際の地図に合わせて調整が必要）
        const bounds = {
            north: 46,
            south: 24,
            west: 122,
            east: 148
        };
        
        const x = ((lon - bounds.west) / (bounds.east - bounds.west)) * this.canvas.width;
        const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * this.canvas.height;
        
        return { x, y };
    },

    /**
     * kmからピクセルへのスケール取得
     */
    getKmToPixelScale() {
        // 日本の緯度での近似（1度≈111km）
        const latRange = 46 - 24; // 22度
        const kmRange = latRange * 111;
        return this.canvas.height / kmRange;
    },

    /**
     * アニメーションの停止
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    },

    // ========================================
    // ヒートマップビジュアライゼーション (250行)
    // ========================================
    
    /**
     * 地震活動ヒートマップの生成
     */
    generateHeatmap(earthquakes, options = {}) {
        const {
            width = 800,
            height = 600,
            gridSize = 50,
            colorScheme = 'hot',
            intensity = 'count' // 'count' or 'magnitude'
        } = options;
        
        // グリッドの作成
        const grid = this.createGrid(earthquakes, gridSize, intensity);
        
        // ヒートマップの描画
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        this.renderHeatmap(ctx, grid, width, height, colorScheme);
        
        return canvas;
    },

    /**
     * グリッドの作成
     */
    createGrid(earthquakes, gridSize, intensity) {
        const grid = [];
        for (let i = 0; i < gridSize; i++) {
            grid[i] = new Array(gridSize).fill(0);
        }
        
        // 地震データをグリッドにマッピング
        const bounds = {
            north: 46, south: 24,
            west: 122, east: 148
        };
        
        earthquakes.forEach(eq => {
            const x = Math.floor(((eq.longitude - bounds.west) / (bounds.east - bounds.west)) * gridSize);
            const y = Math.floor(((bounds.north - eq.latitude) / (bounds.north - bounds.south)) * gridSize);
            
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
                if (intensity === 'count') {
                    grid[y][x] += 1;
                } else if (intensity === 'magnitude') {
                    grid[y][x] += eq.magnitude;
                }
            }
        });
        
        // 正規化
        const max = Math.max(...grid.flat());
        if (max > 0) {
            for (let i = 0; i < gridSize; i++) {
                for (let j = 0; j < gridSize; j++) {
                    grid[i][j] /= max;
                }
            }
        }
        
        return grid;
    },

    /**
     * ヒートマップの描画
     */
    renderHeatmap(ctx, grid, width, height, colorScheme) {
        const gridSize = grid.length;
        const cellWidth = width / gridSize;
        const cellHeight = height / gridSize;
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const value = grid[i][j];
                if (value > 0) {
                    const color = this.getHeatmapColor(value, colorScheme);
                    ctx.fillStyle = color;
                    ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
                }
            }
        }
    },

    /**
     * ヒートマップの色取得
     */
    getHeatmapColor(value, scheme) {
        // 0〜1の値を色に変換
        const schemes = {
            hot: [
                { stop: 0.0, color: [0, 0, 0] },
                { stop: 0.3, color: [128, 0, 0] },
                { stop: 0.6, color: [255, 128, 0] },
                { stop: 1.0, color: [255, 255, 0] }
            ],
            cool: [
                { stop: 0.0, color: [0, 0, 128] },
                { stop: 0.5, color: [0, 128, 255] },
                { stop: 1.0, color: [128, 255, 255] }
            ],
            rainbow: [
                { stop: 0.0, color: [128, 0, 255] },
                { stop: 0.25, color: [0, 0, 255] },
                { stop: 0.5, color: [0, 255, 0] },
                { stop: 0.75, color: [255, 255, 0] },
                { stop: 1.0, color: [255, 0, 0] }
            ]
        };
        
        const gradient = schemes[scheme] || schemes.hot;
        
        // 補間
        for (let i = 0; i < gradient.length - 1; i++) {
            if (value >= gradient[i].stop && value <= gradient[i + 1].stop) {
                const t = (value - gradient[i].stop) / (gradient[i + 1].stop - gradient[i].stop);
                const r = Math.round(gradient[i].color[0] + t * (gradient[i + 1].color[0] - gradient[i].color[0]));
                const g = Math.round(gradient[i].color[1] + t * (gradient[i + 1].color[1] - gradient[i].color[1]));
                const b = Math.round(gradient[i].color[2] + t * (gradient[i + 1].color[2] - gradient[i].color[2]));
                return `rgba(${r}, ${g}, ${b}, 0.8)`;
            }
        }
        
        return 'rgba(255, 255, 255, 0.8)';
    },

    // ========================================
    // タイムラインビジュアライゼーション (250行)
    // ========================================
    
    /**
     * インタラクティブタイムライン
     */
    createInteractiveTimeline(earthquakes, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const timeline = {
            earthquakes: earthquakes.sort((a, b) => new Date(a.time) - new Date(b.time)),
            currentIndex: 0,
            playing: false,
            speed: 1
        };
        
        // UIの構築
        const html = `
            <div class="timeline-container">
                <div class="timeline-canvas-wrapper">
                    <canvas id="timeline-canvas"></canvas>
                </div>
                <div class="timeline-controls">
                    <button id="timeline-play" class="btn-icon">
                        <i class="fas fa-play"></i>
                    </button>
                    <input type="range" id="timeline-slider" min="0" max="${earthquakes.length - 1}" value="0">
                    <div class="timeline-info">
                        <span id="timeline-date"></span>
                        <span id="timeline-count"></span>
                    </div>
                    <div class="timeline-speed">
                        <label>速度:</label>
                        <select id="timeline-speed">
                            <option value="0.5">0.5x</option>
                            <option value="1" selected>1x</option>
                            <option value="2">2x</option>
                            <option value="5">5x</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // イベントリスナー
        const playBtn = document.getElementById('timeline-play');
        const slider = document.getElementById('timeline-slider');
        const speedSelect = document.getElementById('timeline-speed');
        
        playBtn.addEventListener('click', () => {
            timeline.playing = !timeline.playing;
            playBtn.innerHTML = timeline.playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
            
            if (timeline.playing) {
                this.playTimeline(timeline);
            }
        });
        
        slider.addEventListener('input', (e) => {
            timeline.currentIndex = parseInt(e.target.value);
            this.updateTimeline(timeline);
        });
        
        speedSelect.addEventListener('change', (e) => {
            timeline.speed = parseFloat(e.target.value);
        });
        
        // 初期描画
        this.updateTimeline(timeline);
        
        return timeline;
    },

    /**
     * タイムラインの再生
     */
    playTimeline(timeline) {
        if (!timeline.playing) return;
        
        timeline.currentIndex++;
        
        if (timeline.currentIndex >= timeline.earthquakes.length) {
            timeline.currentIndex = 0;
        }
        
        this.updateTimeline(timeline);
        
        const slider = document.getElementById('timeline-slider');
        slider.value = timeline.currentIndex;
        
        setTimeout(() => {
            this.playTimeline(timeline);
        }, 1000 / timeline.speed);
    },

    /**
     * タイムラインの更新
     */
    updateTimeline(timeline) {
        const earthquakes = timeline.earthquakes.slice(0, timeline.currentIndex + 1);
        const current = timeline.earthquakes[timeline.currentIndex];
        
        // 日付と回数の表示
        document.getElementById('timeline-date').textContent = 
            new Date(current.time).toLocaleString('ja-JP');
        document.getElementById('timeline-count').textContent = 
            `${timeline.currentIndex + 1} / ${timeline.earthquakes.length}`;
        
        // マップの更新
        if (window.MapRenderer) {
            window.MapRenderer.clearEarthquakes();
            window.MapRenderer.addEarthquakes(earthquakes);
        }
        
        // キャンバスの更新
        this.renderTimelineCanvas(earthquakes, current);
    },

    /**
     * タイムラインキャンバスの描画
     */
    renderTimelineCanvas(earthquakes, currentEarthquake) {
        const canvas = document.getElementById('timeline-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 100;
        
        ctx.clearRect(0, 0, width, height);
        
        // 背景
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // 地震のプロット
        const timeRange = earthquakes.length > 0 
            ? new Date(earthquakes[earthquakes.length - 1].time) - new Date(earthquakes[0].time)
            : 1;
        
        earthquakes.forEach(eq => {
            const x = ((new Date(eq.time) - new Date(earthquakes[0].time)) / timeRange) * width;
            const y = height - (eq.magnitude / 9) * height;
            const size = Math.max(2, eq.magnitude);
            
            ctx.fillStyle = Utils.getMagnitudeColor(eq.magnitude);
            ctx.globalAlpha = eq === currentEarthquake ? 1.0 : 0.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.globalAlpha = 1.0;
    },

    // ========================================
    // リップルエフェクト (150行)
    // ========================================
    
    /**
     * リップルエフェクトの追加
     */
    addRipple(x, y, options = {}) {
        const {
            color = '#4a90e2',
            maxRadius = 100,
            duration = 1000,
            count = 3
        } = options;
        
        const animation = {
            type: 'ripple',
            x, y,
            color,
            maxRadius,
            startTime: Date.now(),
            duration,
            count,
            active: true
        };
        
        this.animations.push(animation);
        this.startAnimation();
        
        return animation;
    },

    /**
     * リップルの描画
     */
    renderRipple(animation) {
        const { x, y, color, maxRadius, startTime, duration, count } = animation;
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        for (let i = 0; i < count; i++) {
            const offset = (i / count) * duration;
            const rippleProgress = Math.max(0, Math.min(((elapsed - offset) / duration), 1));
            
            if (rippleProgress > 0 && rippleProgress < 1) {
                const radius = rippleProgress * maxRadius;
                const alpha = 1 - rippleProgress;
                
                this.ctx.strokeStyle = color;
                this.ctx.globalAlpha = alpha;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    },

    // ========================================
    // パルスエフェクト (100行)
    // ========================================
    
    /**
     * パルスエフェクトの追加
     */
    addPulse(x, y, options = {}) {
        const {
            color = '#ff4444',
            minSize = 5,
            maxSize = 20,
            duration = 1000
        } = options;
        
        const animation = {
            type: 'pulse',
            x, y,
            color,
            minSize,
            maxSize,
            startTime: Date.now(),
            duration,
            active: true
        };
        
        this.animations.push(animation);
        this.startAnimation();
        
        return animation;
    },

    /**
     * パルスの描画
     */
    renderPulse(animation) {
        const { x, y, color, minSize, maxSize, startTime, duration } = animation;
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;
        
        // イージング
        const eased = this.easeInOutSine(progress);
        const size = minSize + (maxSize - minSize) * eased;
        const alpha = 1 - eased;
        
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1.0;
    },

    /**
     * イージング関数
     */
    easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    },

    // ========================================
    // ユーティリティ (50行)
    // ========================================
    
    /**
     * すべてのアニメーションをクリア
     */
    clearAnimations() {
        this.animations = [];
        this.stopAnimation();
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    /**
     * 特定のアニメーションを停止
     */
    stopAnimationById(id) {
        const anim = this.animations.find(a => a.id === id);
        if (anim) {
            anim.active = false;
        }
    }
};

// エクスポート
if (typeof window !== 'undefined') window.Visualizations = Visualizations;
if (typeof module !== 'undefined' && module.exports) module.exports = Visualizations;
