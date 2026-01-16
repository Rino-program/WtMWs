const units = {
    length: {
        name: '長さ',
        units: {
            mm: { name: 'ミリメートル', factor: 0.001 },
            cm: { name: 'センチメートル', factor: 0.01 },
            m: { name: 'メートル', factor: 1 },
            km: { name: 'キロメートル', factor: 1000 },
            inch: { name: 'インチ', factor: 0.0254 },
            ft: { name: 'フィート', factor: 0.3048 },
            yard: { name: 'ヤード', factor: 0.9144 },
            mile: { name: 'マイル', factor: 1609.344 }
        },
        quickValues: [1, 10, 100, 1000]
    },
    weight: {
        name: '重量',
        units: {
            mg: { name: 'ミリグラム', factor: 0.000001 },
            g: { name: 'グラム', factor: 0.001 },
            kg: { name: 'キログラム', factor: 1 },
            t: { name: 'トン', factor: 1000 },
            oz: { name: 'オンス', factor: 0.0283495 },
            lb: { name: 'ポンド', factor: 0.453592 }
        },
        quickValues: [1, 10, 100, 1000]
    },
    temperature: {
        name: '温度',
        units: {
            c: { name: '摂氏 (°C)', convert: (v, to) => {
                if (to === 'f') return v * 9/5 + 32;
                if (to === 'k') return v + 273.15;
                return v;
            }},
            f: { name: '華氏 (°F)', convert: (v, to) => {
                if (to === 'c') return (v - 32) * 5/9;
                if (to === 'k') return (v - 32) * 5/9 + 273.15;
                return v;
            }},
            k: { name: 'ケルビン (K)', convert: (v, to) => {
                if (to === 'c') return v - 273.15;
                if (to === 'f') return (v - 273.15) * 9/5 + 32;
                return v;
            }}
        },
        quickValues: [0, 20, 37, 100],
        special: true
    },
    data: {
        name: 'データ',
        units: {
            b: { name: 'バイト', factor: 1 },
            kb: { name: 'キロバイト', factor: 1024 },
            mb: { name: 'メガバイト', factor: 1048576 },
            gb: { name: 'ギガバイト', factor: 1073741824 },
            tb: { name: 'テラバイト', factor: 1099511627776 }
        },
        quickValues: [1, 100, 1024, 4096]
    },
    time: {
        name: '時間',
        units: {
            ms: { name: 'ミリ秒', factor: 0.001 },
            s: { name: '秒', factor: 1 },
            min: { name: '分', factor: 60 },
            h: { name: '時間', factor: 3600 },
            day: { name: '日', factor: 86400 },
            week: { name: '週', factor: 604800 },
            year: { name: '年', factor: 31536000 }
        },
        quickValues: [1, 60, 3600, 86400]
    },
    area: {
        name: '面積',
        units: {
            mm2: { name: '平方ミリメートル', factor: 0.000001 },
            cm2: { name: '平方センチメートル', factor: 0.0001 },
            m2: { name: '平方メートル', factor: 1 },
            km2: { name: '平方キロメートル', factor: 1000000 },
            ha: { name: 'ヘクタール', factor: 10000 },
            acre: { name: 'エーカー', factor: 4046.86 }
        },
        quickValues: [1, 100, 10000, 1000000]
    }
};

let currentCategory = 'length';

function initCategory(category) {
    currentCategory = category;
    const cat = units[category];
    const fromSelect = document.getElementById('from-unit');
    const toSelect = document.getElementById('to-unit');
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    Object.entries(cat.units).forEach(([key, unit]) => {
        fromSelect.innerHTML += `<option value="${key}">${unit.name}</option>`;
        toSelect.innerHTML += `<option value="${key}">${unit.name}</option>`;
    });
    
    // デフォルト選択
    const keys = Object.keys(cat.units);
    fromSelect.value = keys[0];
    toSelect.value = keys[Math.min(2, keys.length - 1)];
    
    // クイック値
    const quickContainer = document.getElementById('quick-values');
    quickContainer.innerHTML = cat.quickValues.map(v => 
        `<button class="quick-btn" onclick="setQuickValue(${v})">${v}</button>`
    ).join('');
    
    convert();
}

function convert() {
    const input = parseFloat(document.getElementById('input-value').value) || 0;
    const fromUnit = document.getElementById('from-unit').value;
    const toUnit = document.getElementById('to-unit').value;
    const cat = units[currentCategory];
    
    let result;
    
    if (cat.special && currentCategory === 'temperature') {
        result = cat.units[fromUnit].convert(input, toUnit);
    } else {
        const baseValue = input * cat.units[fromUnit].factor;
        result = baseValue / cat.units[toUnit].factor;
    }
    
    document.getElementById('output-value').value = formatNumber(result);
    document.getElementById('result-display').textContent = formatNumber(result);
    document.getElementById('result-unit').textContent = 
        `${cat.units[fromUnit].name} → ${cat.units[toUnit].name}`;
    
    document.getElementById('formula').textContent = 
        `${formatNumber(input)} ${fromUnit} = ${formatNumber(result)} ${toUnit}`;
}

function formatNumber(num) {
    if (Math.abs(num) < 0.000001 && num !== 0) {
        return num.toExponential(4);
    }
    if (Math.abs(num) >= 1000000) {
        return num.toExponential(4);
    }
    return parseFloat(num.toPrecision(8)).toString();
}

function swapUnits() {
    const fromSelect = document.getElementById('from-unit');
    const toSelect = document.getElementById('to-unit');
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    convert();
}

function setQuickValue(value) {
    document.getElementById('input-value').value = value;
    convert();
}

// イベントリスナー
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelector('.tab.active').classList.remove('active');
        tab.classList.add('active');
        initCategory(tab.dataset.category);
    });
});

document.getElementById('input-value').addEventListener('input', convert);
document.getElementById('from-unit').addEventListener('change', convert);
document.getElementById('to-unit').addEventListener('change', convert);

// 初期化
initCategory('length');
