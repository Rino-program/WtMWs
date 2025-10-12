/**
 * 地震情報サイト - メイン設定ファイル
 * 全システムの設定とAPI接続情報を管理
 */

const CONFIG = {
    // API設定
    API: {
        // 気象庁関連API (P2P地震情報など)
        P2P_EARTHQUAKE: {
            BASE_URL: 'https://api.p2pquake.net/v2',
            ENDPOINTS: {
                HISTORY: '/history',
                JMA_QUAKE: '/jma/quake',
                JMA_TSUNAMI: '/jma/tsunami',
                AREA_PEER: '/areapeers'
            },
            POLLING_INTERVAL: 10000, // 10秒ごとに更新
            LIMIT: 100
        },
        
        // USGS地震データ
        USGS: {
            BASE_URL: 'https://earthquake.usgs.gov/fdsnws/event/1',
            ENDPOINTS: {
                QUERY: '/query',
                COUNT: '/count'
            },
            POLLING_INTERVAL: 30000
        },
        
        // 防災科研 (NIED) - 強震観測網
        NIED: {
            BASE_URL: 'https://www.kmoni.bosai.go.jp',
            REALTIME_DATA: '/webservice/hypo/eew',
            SEISMIC_INTENSITY: '/data/map_img/RealTimeImg/jma_s'
        },
        
        // OpenStreetMap Nominatim (避難所検索用)
        NOMINATIM: {
            BASE_URL: 'https://nominatim.openstreetmap.org',
            ENDPOINTS: {
                SEARCH: '/search',
                REVERSE: '/reverse'
            }
        }
    },

    // マップ設定
    MAP: {
        DEFAULT_CENTER: [36.5, 138.0], // 日本の中心
        DEFAULT_ZOOM: 6,
        MIN_ZOOM: 4,
        MAX_ZOOM: 18,
        
        TILE_LAYERS: {
            DEFAULT: {
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; OpenStreetMap contributors',
                name: '標準地図'
            },
            SATELLITE: {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: 'Esri',
                name: '衛星画像'
            },
            TERRAIN: {
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: 'OpenTopoMap',
                name: '地形図'
            },
            DARK: {
                url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attribution: 'CartoDB',
                name: 'ダークモード'
            }
        },

        // 震度による色分け
        INTENSITY_COLORS: {
            '0': '#f2f2f2',
            '1': '#f0f0ff',
            '2': '#6496ff',
            '3': '#32c8ff',
            '4': '#ffe600',
            '5-': '#ffb700',
            '5+': '#ff6400',
            '6-': '#ff0000',
            '6+': '#c80000',
            '7': '#b40068'
        },

        // マーカーサイズ (マグニチュード別)
        MARKER_SIZES: {
            getSize: (magnitude) => {
                if (magnitude < 3) return 8;
                if (magnitude < 4) return 12;
                if (magnitude < 5) return 16;
                if (magnitude < 6) return 20;
                if (magnitude < 7) return 24;
                return 28;
            }
        }
    },

    // 震度設定
    INTENSITY: {
        LEVELS: ['0', '1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'],
        LABELS: {
            '0': '震度0',
            '1': '震度1',
            '2': '震度2',
            '3': '震度3',
            '4': '震度4',
            '5-': '震度5弱',
            '5+': '震度5強',
            '6-': '震度6弱',
            '6+': '震度6強',
            '7': '震度7'
        },
        DESCRIPTIONS: {
            '0': '人は揺れを感じない',
            '1': '屋内にいる人の一部がわずかな揺れを感じる',
            '2': '屋内にいる人の多くが揺れを感じる',
            '3': '屋内にいるほとんどの人が揺れを感じる',
            '4': 'かなりの恐怖感があり、一部の人は身の安全を図ろうとする',
            '5-': '多くの人が身の安全を図ろうとする。一部の人は行動に支障を感じる',
            '5+': '非常な恐怖を感じる。多くの人が行動に支障を感じる',
            '6-': '立っていることが困難になる',
            '6+': '立っていることができず、はわないと動くことができない',
            '7': '揺れにほんろうされ、自分の意志で行動できない'
        }
    },

    // 津波設定
    TSUNAMI: {
        LEVELS: {
            WARNING: {
                code: 'Warning',
                label: '津波警報',
                color: '#ff0000',
                priority: 1
            },
            WATCH: {
                code: 'Watch',
                label: '津波注意報',
                color: '#ffff00',
                priority: 2
            },
            FORECAST: {
                code: 'Forecast',
                label: '津波予報',
                color: '#00ff00',
                priority: 3
            }
        },
        HEIGHT_COLORS: {
            getColor: (height) => {
                if (height >= 10) return '#800000';
                if (height >= 5) return '#ff0000';
                if (height >= 3) return '#ff6600';
                if (height >= 1) return '#ffff00';
                return '#00ff00';
            }
        }
    },

    // 通知設定
    NOTIFICATION: {
        ENABLED: true,
        SOUND_ENABLED: true,
        VIBRATION_ENABLED: true,
        
        SOUNDS: {
            EEW: 'assets/sounds/eew-alert.mp3',
            EARTHQUAKE: 'assets/sounds/earthquake-alert.mp3',
            TSUNAMI: 'assets/sounds/tsunami-alert.mp3',
            UPDATE: 'assets/sounds/notification.mp3'
        },
        
        THRESHOLDS: {
            MIN_MAGNITUDE: 3.0, // 通知する最小マグニチュード
            MIN_INTENSITY: '3', // 通知する最小震度
            EEW_AUTO_NOTIFY: true // 緊急地震速報の自動通知
        }
    },

    // データ更新設定
    UPDATE: {
        REALTIME_INTENSITY: 2000, // リアルタイム震度: 2秒
        EEW: 1000, // 緊急地震速報: 1秒
        EARTHQUAKE_LIST: 10000, // 地震リスト: 10秒
        TSUNAMI: 5000, // 津波情報: 5秒
        STATISTICS: 60000 // 統計情報: 1分
    },

    // キャッシュ設定
    CACHE: {
        ENABLED: true,
        PREFIX: 'earthquake_cache_',
        TTL: {
            EARTHQUAKE_DATA: 300000, // 5分
            TSUNAMI_DATA: 300000,
            STATISTICS: 3600000, // 1時間
            SHELTER_DATA: 86400000, // 24時間
            MAP_TILES: 604800000 // 7日
        }
    },

    // ローカルストレージ設定
    STORAGE: {
        KEYS: {
            USER_SETTINGS: 'user_settings',
            FAVORITE_LOCATIONS: 'favorite_locations',
            NOTIFICATION_HISTORY: 'notification_history',
            OFFLINE_DATA: 'offline_data',
            DISASTER_KIT: 'disaster_kit_checklist'
        }
    },

    // UI設定
    UI: {
        THEME: {
            DEFAULT: 'light',
            OPTIONS: ['light', 'dark', 'auto']
        },
        
        LANGUAGE: {
            DEFAULT: 'ja',
            SUPPORTED: ['ja', 'en', 'zh', 'ko', 'es', 'pt']
        },
        
        ANIMATION: {
            ENABLED: true,
            DURATION: 300,
            EASING: 'ease-in-out'
        },
        
        CHART: {
            COLORS: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'],
            ANIMATION_DURATION: 750
        },
        
        MODAL: {
            BACKDROP_OPACITY: 0.5,
            CLOSE_ON_BACKDROP: true
        }
    },

    // 避難所設定
    SHELTER: {
        SEARCH_RADIUS: 5000, // メートル
        MAX_RESULTS: 50,
        TYPES: {
            EVACUATION: '指定避難所',
            EMERGENCY: '指定緊急避難所',
            WELFARE: '福祉避難所',
            TEMPORARY: '一時避難場所'
        },
        ICONS: {
            EVACUATION: '🏢',
            EMERGENCY: '🏥',
            WELFARE: '♿',
            TEMPORARY: '🏕️'
        }
    },

    // 防災用品チェックリスト
    DISASTER_KIT: {
        CATEGORIES: {
            ESSENTIAL: '必需品',
            FOOD: '食料・水',
            MEDICAL: '医療品',
            HYGIENE: '衛生用品',
            INFORMATION: '情報・通信',
            OTHER: 'その他'
        }
    },

    // 分析設定
    ANALYSIS: {
        AFTERSHOCK: {
            TIME_WINDOW: 2592000000, // 30日
            DISTANCE_THRESHOLD: 100 // km
        },
        
        STATISTICS: {
            PERIODS: {
                DAY: 86400000,
                WEEK: 604800000,
                MONTH: 2592000000,
                YEAR: 31536000000
            }
        },
        
        HEATMAP: {
            RADIUS: 20,
            BLUR: 25,
            MAX_ZOOM: 13,
            GRADIENT: {
                0.0: '#ffffcc',
                0.2: '#ffeda0',
                0.4: '#fed976',
                0.6: '#feb24c',
                0.8: '#fd8d3c',
                1.0: '#fc4e2a'
            }
        }
    },

    // シミュレーション設定
    SIMULATION: {
        SCENARIOS: {
            MAGNITUDE_RANGE: [5.0, 9.0],
            DEPTH_RANGE: [0, 700], // km
            EPICENTER_PRESETS: [
                { name: '東京湾北部', lat: 35.65, lon: 139.75 },
                { name: '南海トラフ', lat: 33.0, lon: 137.0 },
                { name: '首都直下', lat: 35.7, lon: 139.8 },
                { name: '東海地震', lat: 34.5, lon: 138.0 }
            ]
        },
        
        WAVE_PROPAGATION: {
            P_WAVE_SPEED: 7.0, // km/s
            S_WAVE_SPEED: 4.0, // km/s
            ANIMATION_SPEED: 2.0 // 実時間の2倍速
        }
    },

    // オフライン設定
    OFFLINE: {
        ENABLED: true,
        SERVICE_WORKER: '/sw.js',
        CACHE_NAME: 'earthquake-app-v1',
        PRECACHE_URLS: [
            '/',
            '/index.html',
            '/css/styles.css',
            '/js/main.js'
        ]
    },

    // デバッグ設定
    DEBUG: {
        ENABLED: false, // 本番環境ではfalse
        LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
        SHOW_API_CALLS: false,
        MOCK_DATA: false
    },

    // エラーハンドリング
    ERROR: {
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        TIMEOUT: 10000, // API リクエストタイムアウト
        
        MESSAGES: {
            NETWORK_ERROR: 'ネットワークエラーが発生しました',
            API_ERROR: 'データの取得に失敗しました',
            GEOLOCATION_ERROR: '位置情報の取得に失敗しました',
            STORAGE_ERROR: 'データの保存に失敗しました'
        }
    },

    // パフォーマンス設定
    PERFORMANCE: {
        MAX_MARKERS: 1000, // マップ上の最大マーカー数
        MAX_HISTORY: 500, // 履歴の最大保存数
        DEBOUNCE_DELAY: 300, // 検索などのデバウンス時間
        THROTTLE_DELAY: 100 // スクロールなどのスロットル時間
    }
};

// 設定の凍結（変更不可に）
Object.freeze(CONFIG);

// グローバルスコープへのエクスポート
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// モジュールエクスポート（ES6モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
