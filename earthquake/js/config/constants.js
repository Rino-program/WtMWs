/**
 * 地震情報サイト - 定数定義
 * アプリケーション全体で使用される定数
 */

const CONSTANTS = {
    // アプリケーション情報
    APP: {
        NAME: '地震情報総合システム',
        VERSION: '1.0.0',
        DESCRIPTION: 'リアルタイム地震情報と防災支援システム',
        AUTHOR: 'Earthquake Info System',
        COPYRIGHT: '© 2025 Earthquake Information System'
    },

    // 地震の種類
    EARTHQUAKE_TYPES: {
        SHALLOW: '浅発地震',
        INTERMEDIATE: '中発地震',
        DEEP: '深発地震',
        INLAND: '内陸地震',
        INTERPLATE: 'プレート境界地震',
        VOLCANIC: '火山性地震',
        INDUCED: '誘発地震'
    },

    // 震源の深さ分類
    DEPTH_CLASSIFICATION: {
        SHALLOW: { min: 0, max: 60, label: '浅発' },
        INTERMEDIATE: { min: 60, max: 300, label: '中発' },
        DEEP: { min: 300, max: 700, label: '深発' },
        VERY_DEEP: { min: 700, max: 1000, label: '極深発' }
    },

    // マグニチュードスケール
    MAGNITUDE_SCALE: {
        MICRO: { min: 0, max: 2.9, label: '微小地震', color: '#90EE90' },
        MINOR: { min: 3.0, max: 3.9, label: '小地震', color: '#FFFF00' },
        LIGHT: { min: 4.0, max: 4.9, label: '中地震', color: '#FFA500' },
        MODERATE: { min: 5.0, max: 5.9, label: '強い地震', color: '#FF6347' },
        STRONG: { min: 6.0, max: 6.9, label: '激しい地震', color: '#FF0000' },
        MAJOR: { min: 7.0, max: 7.9, label: '大地震', color: '#8B0000' },
        GREAT: { min: 8.0, max: 10.0, label: '巨大地震', color: '#4B0082' }
    },

    // 震度階級の詳細
    SEISMIC_INTENSITY_DETAILS: {
        '0': {
            name: '震度0',
            description: '人は揺れを感じない',
            outdoors: '揺れを感じない',
            indoors: '揺れを感じない',
            furniture: '変化なし',
            houses: '変化なし',
            action: '特になし'
        },
        '1': {
            name: '震度1',
            description: '屋内にいる人の一部がわずかな揺れを感じる',
            outdoors: 'ほとんど感じない',
            indoors: '静かにしている人が感じる',
            furniture: '変化なし',
            houses: '変化なし',
            action: '特になし'
        },
        '2': {
            name: '震度2',
            description: '屋内にいる人の多くが揺れを感じる',
            outdoors: '一部の人が感じる',
            indoors: '大半の人が感じる',
            furniture: '電灯などがわずかに揺れる',
            houses: '変化なし',
            action: '特になし'
        },
        '3': {
            name: '震度3',
            description: '屋内にいるほとんどの人が揺れを感じる',
            outdoors: '多くの人が感じる',
            indoors: 'ほとんどの人が感じる',
            furniture: '棚にある食器類が音を立てることがある',
            houses: '電線が少し揺れる',
            action: '特になし'
        },
        '4': {
            name: '震度4',
            description: 'かなりの恐怖感があり、一部の人は身の安全を図ろうとする',
            outdoors: 'ほとんどの人が感じる',
            indoors: 'ほぼ全員が感じる',
            furniture: '吊り下げ物が大きく揺れる',
            houses: '電線が大きく揺れる',
            action: '頭を保護し、落下物に注意'
        },
        '5-': {
            name: '震度5弱',
            description: '多くの人が身の安全を図ろうとする',
            outdoors: '歩行が困難',
            indoors: '多くの人が身の安全を図る',
            furniture: '食器や本が落ちることがある',
            houses: '窓ガラスが割れて落ちることがある',
            action: 'テーブルの下などに身を隠す'
        },
        '5+': {
            name: '震度5強',
            description: '非常な恐怖を感じる。多くの人が行動に支障を感じる',
            outdoors: '歩くことが困難',
            indoors: '立っていることが困難',
            furniture: '家具が移動したり倒れることがある',
            houses: '壁のタイルや窓ガラスが破損することがある',
            action: 'すぐに身の安全を確保する'
        },
        '6-': {
            name: '震度6弱',
            description: '立っていることが困難になる',
            outdoors: '立っていることができない',
            indoors: '立っていることが非常に困難',
            furniture: '固定していない重い家具が倒れる',
            houses: '壁のタイルや窓ガラスが破損・落下',
            action: '這って移動。揺れが収まるまで待つ'
        },
        '6+': {
            name: '震度6強',
            description: '立っていることができず、はわないと動くことができない',
            outdoors: '立っていることができず這わないと動けない',
            indoors: '這わないと動くことができない',
            furniture: '固定していない家具のほとんどが移動・転倒',
            houses: '壁のタイルや窓ガラスが破損・落下、建物が傾く',
            action: '這って安全な場所へ。揺れが収まるまで動かない'
        },
        '7': {
            name: '震度7',
            description: '揺れにほんろうされ、自分の意志で行動できない',
            outdoors: '自分の意志で行動できない',
            indoors: '自分の意志で行動できない',
            furniture: 'ほとんどの家具が移動・転倒',
            houses: '耐震性の低い木造建物が倒壊する',
            action: '揺れが収まるまで身を守ることに専念'
        }
    },

    // 津波の高さ分類
    TSUNAMI_HEIGHT_CLASSIFICATION: {
        MINOR: { min: 0, max: 0.5, label: '微弱', danger: '注意' },
        MODERATE: { min: 0.5, max: 1.0, label: '小規模', danger: '注意報' },
        SIGNIFICANT: { min: 1.0, max: 3.0, label: '中規模', danger: '警報' },
        MAJOR: { min: 3.0, max: 10.0, label: '大規模', danger: '大津波警報' },
        CATASTROPHIC: { min: 10.0, max: 50.0, label: '壊滅的', danger: '大津波警報' }
    },

    // プレート情報
    TECTONIC_PLATES: {
        PACIFIC: {
            name: '太平洋プレート',
            description: '日本海溝から沈み込む',
            movement: '西向き、年間約8cm'
        },
        PHILIPPINE: {
            name: 'フィリピン海プレート',
            description: '相模トラフ、南海トラフから沈み込む',
            movement: '北西向き、年間約4cm'
        },
        EURASIAN: {
            name: 'ユーラシアプレート',
            description: '日本列島の西半分を載せる',
            movement: 'ほぼ静止'
        },
        NORTH_AMERICAN: {
            name: '北米プレート',
            description: '日本列島の東半分を載せる',
            movement: 'ほぼ静止'
        }
    },

    // 主要な活断層
    MAJOR_FAULTS: {
        NANKAI_TROUGH: {
            name: '南海トラフ',
            type: 'プレート境界',
            length: 700,
            maxMagnitude: 9.1,
            probability30years: 70
        },
        MEDIAN_TECTONIC_LINE: {
            name: '中央構造線',
            type: '活断層',
            length: 1000,
            maxMagnitude: 8.0,
            probability30years: 15
        },
        TOKYO_INLAND: {
            name: '首都直下型',
            type: '活断層群',
            length: 50,
            maxMagnitude: 7.3,
            probability30years: 70
        }
    },

    // 緊急地震速報の警報レベル
    EEW_LEVELS: {
        FORECAST: {
            code: 'forecast',
            label: '予報',
            color: '#ffff00',
            priority: 3
        },
        WARNING: {
            code: 'warning',
            label: '警報',
            color: '#ff0000',
            priority: 1
        },
        UPDATE: {
            code: 'update',
            label: '更新',
            color: '#ff6600',
            priority: 2
        }
    },

    // 地震波の種類
    SEISMIC_WAVES: {
        P_WAVE: {
            name: 'P波（縦波）',
            description: '最初に到達する波',
            speed: 7.0,
            characteristics: '小刻みな揺れ'
        },
        S_WAVE: {
            name: 'S波（横波）',
            description: '主要な揺れを引き起こす',
            speed: 4.0,
            characteristics: '大きな横揺れ'
        },
        SURFACE_WAVE: {
            name: '表面波',
            description: '地表付近を伝わる波',
            speed: 3.5,
            characteristics: '長周期の揺れ'
        }
    },

    // 地域コード（主要地域）
    REGION_CODES: {
        '011': '北海道',
        '020': '青森県',
        '030': '岩手県',
        '040': '宮城県',
        '050': '秋田県',
        '060': '山形県',
        '070': '福島県',
        '080': '茨城県',
        '090': '栃木県',
        '100': '群馬県',
        '110': '埼玉県',
        '120': '千葉県',
        '130': '東京都',
        '140': '神奈川県',
        '150': '新潟県',
        '160': '富山県',
        '170': '石川県',
        '180': '福井県',
        '190': '山梨県',
        '200': '長野県',
        '210': '岐阜県',
        '220': '静岡県',
        '230': '愛知県',
        '240': '三重県',
        '250': '滋賀県',
        '260': '京都府',
        '270': '大阪府',
        '280': '兵庫県',
        '290': '奈良県',
        '300': '和歌山県',
        '310': '鳥取県',
        '320': '島根県',
        '330': '岡山県',
        '340': '広島県',
        '350': '山口県',
        '360': '徳島県',
        '370': '香川県',
        '380': '愛媛県',
        '390': '高知県',
        '400': '福岡県',
        '410': '佐賀県',
        '420': '長崎県',
        '430': '熊本県',
        '440': '大分県',
        '450': '宮崎県',
        '460': '鹿児島県',
        '470': '沖縄県'
    },

    // 避難行動
    EVACUATION_ACTIONS: {
        IMMEDIATE: {
            priority: 1,
            actions: [
                '頭を保護する',
                '机の下に隠れる',
                'ドアを開けて避難路を確保',
                '火の始末',
                '窓から離れる'
            ]
        },
        AFTER_SHAKING: {
            priority: 2,
            actions: [
                '火の元を確認',
                '家族の安否確認',
                '避難準備',
                '情報収集',
                '近隣の助け合い'
            ]
        },
        EVACUATION: {
            priority: 3,
            actions: [
                '避難所への移動',
                '避難経路の安全確認',
                '持ち出し品の確認',
                'ブレーカーを落とす',
                'ガスの元栓を閉める'
            ]
        }
    },

    // 防災用品リスト
    EMERGENCY_SUPPLIES: {
        ESSENTIAL: [
            '飲料水（1人1日3リットル×3日分）',
            '非常食（3日分）',
            '懐中電灯',
            'ラジオ',
            '予備電池',
            'モバイルバッテリー',
            '現金',
            '保険証のコピー',
            '救急セット'
        ],
        RECOMMENDED: [
            'ヘルメット',
            '軍手',
            'マスク',
            'タオル',
            'ティッシュ',
            'ウェットティッシュ',
            'ビニール袋',
            '携帯トイレ',
            '毛布',
            '着替え',
            '歯ブラシ',
            '洗面用具'
        ],
        SPECIAL_NEEDS: [
            '常備薬',
            '粉ミルク',
            'おむつ',
            '生理用品',
            '眼鏡・コンタクト',
            'お薬手帳',
            'ペット用品'
        ]
    },

    // 地震の前兆現象
    PRECURSORY_PHENOMENA: {
        SCIENTIFIC: [
            '地殻変動',
            '地下水位の変化',
            '地電流の異常',
            'ラドン濃度の変化',
            '電離層の異常'
        ],
        OBSERVATION: [
            '地鳴り',
            '発光現象',
            '動物の異常行動',
            '井戸水の変化',
            '地震雲（科学的根拠なし）'
        ]
    },

    // 時間区分
    TIME_PERIODS: {
        REALTIME: { value: 0, label: 'リアルタイム' },
        HOUR_1: { value: 3600000, label: '1時間以内' },
        HOUR_24: { value: 86400000, label: '24時間以内' },
        WEEK_1: { value: 604800000, label: '1週間以内' },
        MONTH_1: { value: 2592000000, label: '1ヶ月以内' },
        YEAR_1: { value: 31536000000, label: '1年以内' }
    },

    // イベントタイプ
    EVENT_TYPES: {
        EARTHQUAKE: 'earthquake',
        TSUNAMI: 'tsunami',
        EEW: 'eew',
        AFTERSHOCK: 'aftershock',
        VOLCANO: 'volcano',
        ALERT: 'alert'
    },

    // ステータス
    STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        WARNING: 'warning',
        ERROR: 'error',
        LOADING: 'loading',
        SUCCESS: 'success'
    },

    // HTTPステータスコード
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        INTERNAL_SERVER_ERROR: 500,
        SERVICE_UNAVAILABLE: 503
    },

    // ローカルストレージキー
    STORAGE_KEYS: {
        SETTINGS: 'earthquake_settings',
        FAVORITES: 'earthquake_favorites',
        HISTORY: 'earthquake_history',
        CACHE: 'earthquake_cache'
    },

    // 正規表現パターン
    REGEX: {
        LATITUDE: /^-?([0-8]?[0-9]|90)(\.[0-9]{1,10})?$/,
        LONGITUDE: /^-?(1[0-7][0-9]|[0-9]{1,2})(\.[0-9]{1,10})?$/,
        MAGNITUDE: /^[0-9](\.[0-9]{1,2})?$/,
        DEPTH: /^[0-9]{1,4}(\.[0-9]{1,2})?$/
    },

    // 日時フォーマット
    DATE_FORMATS: {
        FULL: 'YYYY年MM月DD日 HH:mm:ss',
        DATE: 'YYYY年MM月DD日',
        TIME: 'HH:mm:ss',
        SHORT: 'MM/DD HH:mm',
        ISO: 'YYYY-MM-DDTHH:mm:ssZ'
    },

    // アニメーション設定
    ANIMATION: {
        DURATION: {
            FAST: 150,
            NORMAL: 300,
            SLOW: 600
        },
        EASING: {
            LINEAR: 'linear',
            EASE: 'ease',
            EASE_IN: 'ease-in',
            EASE_OUT: 'ease-out',
            EASE_IN_OUT: 'ease-in-out'
        }
    }
};

// 定数の凍結
Object.freeze(CONSTANTS);

// グローバルエクスポート
if (typeof window !== 'undefined') {
    window.CONSTANTS = CONSTANTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONSTANTS;
}
