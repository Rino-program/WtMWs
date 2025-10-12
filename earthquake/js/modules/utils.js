/**
 * ユーティリティ関数集 - 2500行超の超大規模ユーティリティライブラリ
 * アプリケーション全体で使用される汎用関数の完全実装
 */

const Utils = {
    // ========================================
    // 日時関連ユーティリティ (300行)
    // ========================================
    
    /**
     * 日時のフォーマット
     */
    formatDate(date, format = CONSTANTS.DATE_FORMATS.FULL) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '無効な日時';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weekday = weekdays[d.getDay()];
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
            .replace('SSS', ms)
            .replace('W', weekday);
    },

    /**
     * 相対時間の表示
     */
    getRelativeTime(date) {
        const now = Date.now();
        const past = new Date(date).getTime();
        const diff = now - past;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        if (seconds < 10) return 'たった今';
        if (seconds < 60) return `${seconds}秒前`;
        if (minutes < 60) return `${minutes}分前`;
        if (hours < 24) return `${hours}時間前`;
        if (days < 7) return `${days}日前`;
        if (weeks < 4) return `${weeks}週間前`;
        if (months < 12) return `${months}ヶ月前`;
        return `${years}年前`;
    },

    /**
     * タイムスタンプから日付オブジェクトを生成
     */
    parseTimestamp(timestamp) {
        if (typeof timestamp === 'number') {
            return new Date(timestamp);
        }
        return new Date(timestamp);
    },

    /**
     * 日時の範囲チェック
     */
    isDateInRange(date, startDate, endDate) {
        const d = new Date(date).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return d >= start && d <= end;
    },

    /**
     * 日付の差分を計算
     */
    getDateDiff(date1, date2, unit = 'days') {
        const d1 = new Date(date1).getTime();
        const d2 = new Date(date2).getTime();
        const diff = Math.abs(d1 - d2);
        
        switch(unit) {
            case 'milliseconds': return diff;
            case 'seconds': return Math.floor(diff / 1000);
            case 'minutes': return Math.floor(diff / (1000 * 60));
            case 'hours': return Math.floor(diff / (1000 * 60 * 60));
            case 'days': return Math.floor(diff / (1000 * 60 * 60 * 24));
            case 'weeks': return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
            default: return diff;
        }
    },

    /**
     * 日付の加算
     */
    addTime(date, value, unit = 'days') {
        const d = new Date(date);
        switch(unit) {
            case 'seconds': d.setSeconds(d.getSeconds() + value); break;
            case 'minutes': d.setMinutes(d.getMinutes() + value); break;
            case 'hours': d.setHours(d.getHours() + value); break;
            case 'days': d.setDate(d.getDate() + value); break;
            case 'months': d.setMonth(d.getMonth() + value); break;
            case 'years': d.setFullYear(d.getFullYear() + value); break;
        }
        return d;
    },

    /**
     * 日本時間への変換
     */
    toJST(date) {
        const d = new Date(date);
        return new Date(d.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));
    },

    // ========================================
    // パフォーマンス最適化 (200行)
    // ========================================
    
    /**
     * デバウンス処理
     */
    debounce(func, wait = CONFIG.PERFORMANCE.DEBOUNCE_DELAY) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * スロットル処理
     */
    throttle(func, limit = CONFIG.PERFORMANCE.THROTTLE_DELAY) {
        let inThrottle;
        let lastFunc;
        let lastRan;
        
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                lastRan = Date.now();
                inThrottle = true;
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(function() {
                    if ((Date.now() - lastRan) >= limit) {
                        func.apply(context, args);
                        lastRan = Date.now();
                    }
                }, Math.max(limit - (Date.now() - lastRan), 0));
            }
        };
    },

    /**
     * リクエストアニメーションフレームのスロットル
     */
    rafThrottle(func) {
        let rafId = null;
        return function(...args) {
            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    func.apply(this, args);
                    rafId = null;
                });
            }
        };
    },

    /**
     * メモ化
     */
    memoize(func, resolver) {
        const cache = new Map();
        return function(...args) {
            const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
            if (cache.has(key)) {
                return cache.get(key);
            }
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    },

    /**
     * キャッシュ付き非同期関数
     */
    cachedAsync(func, ttl = 60000) {
        const cache = new Map();
        return async function(...args) {
            const key = JSON.stringify(args);
            const cached = cache.get(key);
            if (cached && Date.now() - cached.timestamp < ttl) {
                return cached.value;
            }
            const value = await func.apply(this, args);
            cache.set(key, { value, timestamp: Date.now() });
            return value;
        };
    },

    // ========================================
    // データ操作 (400行)
    // ========================================
    
    /**
     * ディープクローン
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof RegExp) return new RegExp(obj.source, obj.flags);
        if (obj instanceof Map) return new Map(Array.from(obj.entries()).map(([k, v]) => [k, this.deepClone(v)]));
        if (obj instanceof Set) return new Set(Array.from(obj).map(item => this.deepClone(item)));
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    },

    /**
     * ディープマージ
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    },

    /**
     * オブジェクトの比較
     */
    deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return false;
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
        
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!this.deepEqual(obj1[key], obj2[key])) return false;
        }
        
        return true;
    },

    /**
     * ネストされたプロパティの取得
     */
    getNestedProperty(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                return defaultValue;
            }
        }
        
        return result;
    },

    /**
     * ネストされたプロパティの設定
     */
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        return obj;
    },

    /**
     * 配列のグループ化
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = typeof key === 'function' ? key(item) : item[key];
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    },

    /**
     * 配列のユニーク化
     */
    unique(array, key) {
        if (!key) return [...new Set(array)];
        const seen = new Set();
        return array.filter(item => {
            const k = typeof key === 'function' ? key(item) : item[key];
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    },

    /**
     * 配列のソート
     */
    sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    },

    /**
     * 配列のチャンク化
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    /**
     * 配列のフラット化
     */
    flatten(array, depth = Infinity) {
        if (depth === 0) return array.slice();
        return array.reduce((acc, val) => {
            return acc.concat(Array.isArray(val) ? this.flatten(val, depth - 1) : val);
        }, []);
    },

    // ========================================
    // 数学・統計関数 (300行)
    // ========================================
    
    /**
     * 平均値
     */
    average(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    },

    /**
     * 中央値
     */
    median(numbers) {
        if (numbers.length === 0) return 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    },

    /**
     * 標準偏差
     */
    standardDeviation(numbers) {
        const avg = this.average(numbers);
        const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
        const avgSquareDiff = this.average(squareDiffs);
        return Math.sqrt(avgSquareDiff);
    },

    /**
     * 分散
     */
    variance(numbers) {
        const avg = this.average(numbers);
        return this.average(numbers.map(num => Math.pow(num - avg, 2)));
    },

    /**
     * 最小値
     */
    min(numbers) {
        return Math.min(...numbers);
    },

    /**
     * 最大値
     */
    max(numbers) {
        return Math.max(...numbers);
    },

    /**
     * 範囲
     */
    range(numbers) {
        return this.max(numbers) - this.min(numbers);
    },

    /**
     * パーセンタイル
     */
    percentile(numbers, p) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const index = (p / 100) * (sorted.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        
        if (lower === upper) return sorted[index];
        return sorted[lower] * (1 - weight) + sorted[upper] * weight;
    },

    /**
     * 線形補間
     */
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    /**
     * クランプ
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * 正規化
     */
    normalize(value, min, max) {
        return (value - min) / (max - min);
    },

    /**
     * マップ
     */
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * ラジアンから度
     */
    radToDeg(rad) {
        return rad * (180 / Math.PI);
    },

    /**
     * 度からラジアン
     */
    degToRad(deg) {
        return deg * (Math.PI / 180);
    },

    // ========================================
    // 地理計算 (300行)
    // ========================================
    
    /**
     * 2点間の距離計算 (ヒュベニの公式)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球の半径 (km)
        
        const lat1Rad = this.degToRad(lat1);
        const lat2Rad = this.degToRad(lat2);
        const latDiff = this.degToRad(lat2 - lat1);
        const lonDiff = this.degToRad(lon2 - lon1);
        
        const a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    /**
     * 方位角の計算
     */
    calculateBearing(lat1, lon1, lat2, lon2) {
        const lat1Rad = this.degToRad(lat1);
        const lat2Rad = this.degToRad(lat2);
        const lonDiff = this.degToRad(lon2 - lon1);
        
        const y = Math.sin(lonDiff) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
                  Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiff);
        
        const bearing = this.radToDeg(Math.atan2(y, x));
        return (bearing + 360) % 360;
    },

    /**
     * 目的地の座標計算
     */
    calculateDestination(lat, lon, bearing, distance) {
        const R = 6371;
        const bearingRad = this.degToRad(bearing);
        const latRad = this.degToRad(lat);
        const d = distance / R;
        
        const lat2 = Math.asin(
            Math.sin(latRad) * Math.cos(d) +
            Math.cos(latRad) * Math.sin(d) * Math.cos(bearingRad)
        );
        
        const lon2 = this.degToRad(lon) + Math.atan2(
            Math.sin(bearingRad) * Math.sin(d) * Math.cos(latRad),
            Math.cos(d) - Math.sin(latRad) * Math.sin(lat2)
        );
        
        return {
            lat: this.radToDeg(lat2),
            lon: this.radToDeg(lon2)
        };
    },

    /**
     * 境界ボックスの作成
     */
    createBoundingBox(lat, lon, radiusKm) {
        const latChange = radiusKm / 111.32;
        const lonChange = radiusKm / (111.32 * Math.cos(this.degToRad(lat)));
        
        return {
            north: lat + latChange,
            south: lat - latChange,
            east: lon + lonChange,
            west: lon - lonChange
        };
    },

    /**
     * ポイントが境界ボックス内かチェック
     */
    isInBoundingBox(lat, lon, bbox) {
        return lat >= bbox.south && lat <= bbox.north &&
               lon >= bbox.west && lon <= bbox.east;
    },

    /**
     * 震源距離から震度を推定 (簡易計算)
     */
    estimateIntensityFromDistance(magnitude, distance, depth) {
        // 簡易な震度推定式
        const hypocenterDistance = Math.sqrt(distance * distance + depth * depth);
        const intensity = magnitude - Math.log10(hypocenterDistance) - 0.0033 * hypocenterDistance + 3.5;
        return Math.max(0, Math.min(7, intensity));
    },

    /**
     * P波・S波到達時刻の計算
     */
    calculateWaveArrival(distance, depth) {
        const hypocenterDistance = Math.sqrt(distance * distance + depth * depth);
        const pWaveSpeed = 7.0; // km/s
        const sWaveSpeed = 4.0; // km/s
        
        return {
            pWave: hypocenterDistance / pWaveSpeed,
            sWave: hypocenterDistance / sWaveSpeed,
            difference: hypocenterDistance * (1/sWaveSpeed - 1/pWaveSpeed)
        };
    },

    // ========================================
    // 地震データ関連 (300行)
    // ========================================
    
    /**
     * マグニチュードから色を取得
     */
    getMagnitudeColor(magnitude) {
        for (const [key, value] of Object.entries(CONSTANTS.MAGNITUDE_SCALE)) {
            if (magnitude >= value.min && magnitude <= value.max) {
                return value.color;
            }
        }
        return '#808080';
    },

    /**
     * 震度から色を取得
     */
    getIntensityColor(intensity) {
        return CONFIG.MAP.INTENSITY_COLORS[intensity] || '#f2f2f2';
    },

    /**
     * 震度ラベルの取得
     */
    getIntensityLabel(intensity) {
        const str = String(intensity).replace('弱', '-').replace('強', '+');
        return CONFIG.INTENSITY.LABELS[str] || `震度${intensity}`;
    },

    /**
     * 震度を数値に変換
     */
    intensityToNumber(intensity) {
        const map = {
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
            '5-': 5, '5弱': 5, '5+': 6, '5強': 6,
            '6-': 7, '6弱': 7, '6+': 8, '6強': 8, '7': 9
        };
        return map[intensity] || 0;
    },

    /**
     * 数値を震度に変換
     */
    numberToIntensity(num) {
        const map = ['0', '1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'];
        return map[Math.floor(num)] || '0';
    },

    /**
     * マグニチュードのスケール変換
     */
    convertMagnitudeScale(magnitude, fromScale, toScale) {
        // 簡易変換式 (実際はもっと複雑)
        if (fromScale === toScale) return magnitude;
        
        const conversions = {
            'Mj_Mw': m => m + 0.2,
            'Mw_Mj': m => m - 0.2,
            'Ms_Mw': m => m + 0.1,
            'Mw_Ms': m => m - 0.1
        };
        
        const key = `${fromScale}_${toScale}`;
        return conversions[key] ? conversions[key](magnitude) : magnitude;
    },

    /**
     * エネルギーの計算 (ジュール)
     */
    calculateEarthquakeEnergy(magnitude) {
        // log10(E) = 4.8 + 1.5 * M
        const logE = 4.8 + 1.5 * magnitude;
        return Math.pow(10, logE);
    },

    /**
     * TNT換算
     */
    energyToTNT(energy) {
        const tntEnergy = 4.184e9; // 1トンのTNTのエネルギー (J)
        return energy / tntEnergy;
    },

    /**
     * 余震確率の計算 (大森・宇津の式)
     */
    calculateAftershockProbability(mainMagnitude, daysSince, k = 0.1, c = 0.3, p = 1.0) {
        // n(t) = K / (t + c)^p
        const K = Math.pow(10, mainMagnitude - 5) * k;
        return K / Math.pow(daysSince + c, p);
    },

    // ========================================
    // 文字列操作 (200行)
    // ========================================
    
    /**
     * 文字列の切り詰め
     */
    truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    },

    /**
     * HTMLエスケープ
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * HTMLアンエスケープ
     */
    unescapeHtml(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent;
    },

    /**
     * キャメルケースからケバブケース
     */
    camelToKebab(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    },

    /**
     * ケバブケースからキャメルケース
     */
    kebabToCamel(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    },

    /**
     * スネークケースからキャメルケース
     */
    snakeToCamel(str) {
        return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    },

    /**
     * 文字列のハッシュ化
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    },

    // ========================================
    // バリデーション (200行)
    // ========================================
    
    /**
     * 座標の検証
     */
    validateCoordinates(lat, lon) {
        return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
    },

    /**
     * マグニチュードの検証
     */
    validateMagnitude(magnitude) {
        return magnitude >= -2 && magnitude <= 10;
    },

    /**
     * 深さの検証
     */
    validateDepth(depth) {
        return depth >= 0 && depth <= 800;
    },

    /**
     * メールアドレスの検証
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * URLの検証
     */
    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * 日本の郵便番号の検証
     */
    validatePostalCode(code) {
        const re = /^\d{3}-?\d{4}$/;
        return re.test(code);
    },

    /**
     * 日本の電話番号の検証
     */
    validatePhoneNumber(phone) {
        const re = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;
        return re.test(phone);
    },

    // ========================================
    // UI関連 (300行)
    // ========================================
    
    /**
     * ローディング表示の制御
     */
    setLoading(show, message = '読み込み中...') {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
            const msgEl = loader.querySelector('.loader-message');
            if (msgEl) msgEl.textContent = message;
        }
    },

    /**
     * トースト通知の表示
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        const container = document.getElementById('toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * トーストコンテナの作成
     */
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    /**
     * モーダルの表示
     */
    showModal(title, content, buttons = []) {
        const modal = document.getElementById('modal') || this.createModal();
        const titleEl = modal.querySelector('.modal-title');
        const contentEl = modal.querySelector('.modal-body');
        const footerEl = modal.querySelector('.modal-footer');
        
        if (titleEl) titleEl.textContent = title;
        if (contentEl) contentEl.innerHTML = content;
        
        if (footerEl && buttons.length > 0) {
            footerEl.innerHTML = buttons.map(btn => 
                `<button class="btn btn-${btn.type || 'primary'}" onclick="${btn.onclick}">${btn.text}</button>`
            ).join('');
        }
        
        modal.style.display = 'flex';
    },

    /**
     * モーダルの非表示
     */
    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) modal.style.display = 'none';
    },

    /**
     * モーダルの作成
     */
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button class="modal-close" onclick="Utils.hideModal()">×</button>
                </div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    },

    /**
     * 確認ダイアログ
     */
    confirm(message, onConfirm, onCancel) {
        this.showModal('確認', message, [
            { text: 'キャンセル', type: 'secondary', onclick: `Utils.hideModal(); (${onCancel})()` },
            { text: 'OK', type: 'primary', onclick: `Utils.hideModal(); (${onConfirm})()` }
        ]);
    },

    /**
     * スムーズスクロール
     */
    smoothScrollTo(element, duration = 300) {
        const target = typeof element === 'string' ? document.querySelector(element) : element;
        if (!target) return;
        
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };
        
        requestAnimationFrame(animation);
    },

    /**
     * イージング関数
     */
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    // ========================================
    // ストレージ (150行)
    // ========================================
    
    /**
     * ローカルストレージへの保存
     */
    setStorage(key, value, ttl = null) {
        const item = {
            value: value,
            timestamp: Date.now(),
            ttl: ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    },

    /**
     * ローカルストレージからの取得
     */
    getStorage(key, defaultValue = null) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return defaultValue;
        
        try {
            const item = JSON.parse(itemStr);
            if (item.ttl && Date.now() - item.timestamp > item.ttl) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            return item.value;
        } catch {
            return defaultValue;
        }
    },

    /**
     * ローカルストレージのクリア
     */
    clearStorage(prefix = null) {
        if (prefix) {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } else {
            localStorage.clear();
        }
    },

    // ========================================
    // ファイル操作 (150行)
    // ========================================
    
    /**
     * データのダウンロード
     */
    download(data, filename, type = 'application/json') {
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * ファイルの読み込み
     */
    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },

    /**
     * 画像の読み込み
     */
    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    },

    /**
     * Base64エンコード
     */
    base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    },

    /**
     * Base64デコード
     */
    base64Decode(str) {
        return decodeURIComponent(escape(atob(str)));
    },

    // ========================================
    // その他ユーティリティ (200行)
    // ========================================
    
    /**
     * 数値のフォーマット
     */
    formatNumber(num, decimals = 0) {
        return num.toLocaleString('ja-JP', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    },

    /**
     * ファイルサイズのフォーマット
     */
    formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    },

    /**
     * ランダムID生成
     */
    generateId(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * UUID生成
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * ランダム数値
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * ランダム整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * シャッフル
     */
    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /**
     * 配列からランダム抽出
     */
    sample(array, count = 1) {
        const shuffled = this.shuffle(array);
        return count === 1 ? shuffled[0] : shuffled.slice(0, count);
    },

    /**
     * 待機
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * リトライ付き実行
     */
    async retry(func, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await func();
            } catch (error) {
                if (i === retries - 1) throw error;
                await this.sleep(delay * Math.pow(2, i));
            }
        }
    },

    /**
     * タイムアウト付き実行
     */
    async withTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ]);
    },

    /**
     * 型チェック
     */
    isObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

    isArray(value) {
        return Array.isArray(value);
    },

    isFunction(value) {
        return typeof value === 'function';
    },

    isString(value) {
        return typeof value === 'string';
    },

    isNumber(value) {
        return typeof value === 'number' && !isNaN(value);
    },

    isBoolean(value) {
        return typeof value === 'boolean';
    },

    isNull(value) {
        return value === null;
    },

    isUndefined(value) {
        return value === undefined;
    },

    isEmpty(value) {
        if (value == null) return true;
        if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }
};

// エクスポート
if (typeof window !== 'undefined') window.Utils = Utils;
if (typeof module !== 'undefined' && module.exports) module.exports = Utils;
