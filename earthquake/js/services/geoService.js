/**
 * APIサービス - 地理情報サービス
 * 避難所検索、住所検索などの地理情報機能
 */

class GeoService {
    constructor() {
        this.baseUrl = CONFIG.API.NOMINATIM.BASE_URL;
        this.endpoints = CONFIG.API.NOMINATIM.ENDPOINTS;
        this.cache = new Map();
        this.shelters = [];
    }

    /**
     * 住所から座標を取得（ジオコーディング）
     * @param {string} address - 住所
     * @returns {Promise<Object|null>} 座標情報
     */
    async geocode(address) {
        try {
            const cacheKey = `geocode_${address}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const url = `${this.baseUrl}${this.endpoints.SEARCH}?q=${encodeURIComponent(address)}&format=json&limit=1`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'EarthquakeInfoSystem/1.0'
                }
            });

            const data = await response.json();
            
            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    displayName: data[0].display_name,
                    address: data[0].address
                };
                
                this.setCache(cacheKey, result);
                return result;
            }

            return null;
        } catch (error) {
            console.error('ジオコーディングエラー:', error);
            return null;
        }
    }

    /**
     * 座標から住所を取得（逆ジオコーディング）
     * @param {number} lat - 緯度
     * @param {number} lon - 経度
     * @returns {Promise<Object|null>} 住所情報
     */
    async reverseGeocode(lat, lon) {
        try {
            const cacheKey = `reverse_${lat}_${lon}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;

            const url = `${this.baseUrl}${this.endpoints.REVERSE}?lat=${lat}&lon=${lon}&format=json`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'EarthquakeInfoSystem/1.0'
                }
            });

            const data = await response.json();
            
            if (data && data.address) {
                const result = {
                    displayName: data.display_name,
                    address: data.address,
                    city: data.address.city || data.address.town || data.address.village || '',
                    prefecture: data.address.state || '',
                    country: data.address.country || ''
                };
                
                this.setCache(cacheKey, result);
                return result;
            }

            return null;
        } catch (error) {
            console.error('逆ジオコーディングエラー:', error);
            return null;
        }
    }

    /**
     * 現在地を取得
     * @returns {Promise<Object>} 位置情報
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('位置情報がサポートされていません'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    const address = await this.reverseGeocode(latitude, longitude);
                    
                    resolve({
                        lat: latitude,
                        lon: longitude,
                        accuracy: position.coords.accuracy,
                        address: address
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    /**
     * 避難所を検索
     * @param {Object} location - 位置 { lat, lon }
     * @param {number} radius - 検索半径（メートル）
     * @returns {Promise<Array>} 避難所リスト
     */
    async searchShelters(location, radius = CONFIG.SHELTER.SEARCH_RADIUS) {
        try {
            // 実際のAPIがない場合のモックデータ
            // 本来はオープンデータAPIから取得
            const mockShelters = this.generateMockShelters(location, radius);
            
            // 距離でソート
            mockShelters.sort((a, b) => a.distance - b.distance);
            
            return mockShelters.slice(0, CONFIG.SHELTER.MAX_RESULTS);
        } catch (error) {
            console.error('避難所検索エラー:', error);
            return [];
        }
    }

    /**
     * モック避難所データを生成
     * @param {Object} center - 中心位置
     * @param {number} radius - 半径
     * @returns {Array} 避難所データ
     */
    generateMockShelters(center, radius) {
        const shelters = [];
        const types = Object.keys(CONFIG.SHELTER.TYPES);
        const count = 20;

        for (let i = 0; i < count; i++) {
            // ランダムな位置を生成（中心から半径内）
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * radius;
            const latOffset = (distance / 111000) * Math.cos(angle);
            const lonOffset = (distance / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);

            const shelterLat = center.lat + latOffset;
            const shelterLon = center.lon + lonOffset;
            const actualDistance = this.calculateDistance(center, { lat: shelterLat, lon: shelterLon });

            const type = types[Math.floor(Math.random() * types.length)];
            
            shelters.push({
                id: `shelter_${i}`,
                name: `${CONFIG.SHELTER.TYPES[type]} ${i + 1}`,
                type: type,
                typeLabel: CONFIG.SHELTER.TYPES[type],
                icon: CONFIG.SHELTER.ICONS[type],
                lat: shelterLat,
                lon: shelterLon,
                distance: Math.round(actualDistance),
                address: `避難所住所 ${i + 1}`,
                capacity: Math.floor(Math.random() * 500) + 100,
                facilities: this.generateFacilities(),
                phone: `03-XXXX-${String(i).padStart(4, '0')}`,
                accessible: Math.random() > 0.5
            });
        }

        return shelters;
    }

    /**
     * 避難所の設備情報を生成
     * @returns {Array} 設備リスト
     */
    generateFacilities() {
        const allFacilities = [
            '飲料水', '食料', '毛布', 'トイレ', '医療室', 
            '電源', 'Wi-Fi', '冷暖房', 'シャワー', '授乳室'
        ];
        
        const facilityCount = Math.floor(Math.random() * 5) + 3;
        const facilities = [];
        
        for (let i = 0; i < facilityCount; i++) {
            const index = Math.floor(Math.random() * allFacilities.length);
            const facility = allFacilities[index];
            if (!facilities.includes(facility)) {
                facilities.push(facility);
            }
        }
        
        return facilities;
    }

    /**
     * 避難ルートを計算
     * @param {Object} from - 出発地点
     * @param {Object} to - 目的地
     * @returns {Promise<Object>} ルート情報
     */
    async calculateRoute(from, to) {
        try {
            // 実際はルーティングAPIを使用
            // ここでは簡易的な直線距離とベクトルを返す
            const distance = this.calculateDistance(from, to);
            const bearing = this.calculateBearing(from, to);
            const estimatedTime = Math.ceil(distance / 80); // 徒歩約時速4km = 約80m/分

            return {
                distance: Math.round(distance),
                estimatedTime,
                bearing: Math.round(bearing),
                direction: this.getDirection(bearing),
                waypoints: this.generateWaypoints(from, to, 5),
                safetyNotes: [
                    '落下物に注意してください',
                    '建物の近くを避けてください',
                    '余震に備えて周囲を警戒してください'
                ]
            };
        } catch (error) {
            console.error('ルート計算エラー:', error);
            return null;
        }
    }

    /**
     * 2点間の距離を計算（メートル）
     */
    calculateDistance(point1, point2) {
        const R = 6371000; // 地球の半径（メートル）
        const φ1 = point1.lat * Math.PI / 180;
        const φ2 = point2.lat * Math.PI / 180;
        const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
        const Δλ = (point2.lon - point1.lon) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    /**
     * 方位角を計算
     */
    calculateBearing(from, to) {
        const φ1 = from.lat * Math.PI / 180;
        const φ2 = to.lat * Math.PI / 180;
        const Δλ = (to.lon - from.lon) * Math.PI / 180;

        const y = Math.sin(Δλ) * Math.cos(φ2);
        const x = Math.cos(φ1) * Math.sin(φ2) -
                  Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
        const θ = Math.atan2(y, x);

        return (θ * 180 / Math.PI + 360) % 360;
    }

    /**
     * 方位角から方向を取得
     */
    getDirection(bearing) {
        const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
        const index = Math.round(bearing / 45) % 8;
        return directions[index];
    }

    /**
     * ウェイポイントを生成
     */
    generateWaypoints(from, to, count) {
        const waypoints = [];
        
        for (let i = 1; i <= count; i++) {
            const ratio = i / (count + 1);
            waypoints.push({
                lat: from.lat + (to.lat - from.lat) * ratio,
                lon: from.lon + (to.lon - from.lon) * ratio,
                index: i
            });
        }
        
        return waypoints;
    }

    /**
     * 最寄りの避難所を取得
     * @param {Object} location - 現在位置
     * @returns {Promise<Object|null>} 最寄りの避難所
     */
    async getNearestShelter(location) {
        const shelters = await this.searchShelters(location);
        return shelters.length > 0 ? shelters[0] : null;
    }

    /**
     * 地域の危険度を評価
     * @param {Object} location - 位置
     * @returns {Object} 危険度情報
     */
    assessAreaRisk(location) {
        // 実際は詳細な地質データ、ハザードマップデータが必要
        const risks = {
            liquefaction: Math.random() > 0.7, // 液状化
            landslide: Math.random() > 0.8, // 土砂災害
            flooding: Math.random() > 0.85, // 浸水
            fire: Math.random() > 0.9 // 火災延焼
        };

        const riskCount = Object.values(risks).filter(Boolean).length;
        let riskLevel = '低';
        
        if (riskCount >= 3) riskLevel = '非常に高い';
        else if (riskCount >= 2) riskLevel = '高い';
        else if (riskCount >= 1) riskLevel = '中程度';

        return {
            overall: riskLevel,
            details: {
                liquefaction: { risk: risks.liquefaction, label: '液状化リスク' },
                landslide: { risk: risks.landslide, label: '土砂災害リスク' },
                flooding: { risk: risks.flooding, label: '浸水リスク' },
                fire: { risk: risks.fire, label: '火災リスク' }
            },
            recommendations: this.getRiskRecommendations(risks)
        };
    }

    /**
     * リスクに基づく推奨事項を取得
     */
    getRiskRecommendations(risks) {
        const recommendations = [];
        
        if (risks.liquefaction) {
            recommendations.push('液状化の可能性があります。木造建築から離れてください');
        }
        if (risks.landslide) {
            recommendations.push('土砂災害の危険があります。山や崖から離れてください');
        }
        if (risks.flooding) {
            recommendations.push('浸水の可能性があります。高い場所に避難してください');
        }
        if (risks.fire) {
            recommendations.push('火災延焼の危険があります。火の元に注意してください');
        }
        
        return recommendations;
    }

    /**
     * キャッシュ関連メソッド
     */
    getFromCache(key) {
        if (!CONFIG.CACHE.ENABLED) return null;
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > CONFIG.CACHE.TTL.SHELTER_DATA) {
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

const geoService = new GeoService();

if (typeof window !== 'undefined') {
    window.GeoService = GeoService;
    window.geoService = geoService;
}
