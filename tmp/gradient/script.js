const PRESETS = [
    ['#ff6b6b', '#ffd93d'],
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#d299c2', '#fef9d7'],
    ['#89f7fe', '#66a6ff'],
    ['#cd9cf2', '#f6f3ff'],
    ['#fddb92', '#d1fdff'],
    ['#c471f5', '#fa71cd'],
    ['#48c6ef', '#6f86d6'],
    ['#feada6', '#f5efef'],
    ['#e0c3fc', '#8ec5fc'],
    ['#f5af19', '#f12711'],
    ['#00c6fb', '#005bea'],
    ['#b721ff', '#21d4fd'],
    ['#08aeea', '#2af598'],
    ['#fee140', '#fa709a']
];

let gradientType = 'linear';
let angle = 135;
let radialShape = 'circle';
let radialPos = 'center';
let colorStops = [
    { color: '#ff6b6b', position: 0 },
    { color: '#ffd93d', position: 100 }
];

function init() {
    renderColorStops();
    renderPresets();
    updateGradient();
    setupEventListeners();
}

function setupEventListeners() {
    // Type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gradientType = btn.dataset.type;
            document.getElementById('angleSection').style.display = 
                gradientType === 'radial' ? 'none' : 'block';
            document.getElementById('radialOptions').style.display = 
                gradientType === 'radial' ? 'grid' : 'none';
            updateGradient();
        });
    });

    // Radial options
    document.querySelectorAll('.radial-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.shape) {
                document.querySelectorAll('.radial-opt[data-shape]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                radialShape = btn.dataset.shape;
            } else if (btn.dataset.pos) {
                document.querySelectorAll('.radial-opt[data-pos]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                radialPos = btn.dataset.pos;
            }
            updateGradient();
        });
    });

    // Angle controls
    const angleRange = document.getElementById('angleRange');
    const angleDial = document.getElementById('angleDial');

    angleRange.addEventListener('input', (e) => {
        angle = parseInt(e.target.value);
        updateGradient();
    });

    angleDial.addEventListener('click', (e) => {
        const rect = angleDial.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        angle = Math.round((Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360);
        angleRange.value = angle;
        updateGradient();
    });
}

function renderColorStops() {
    const container = document.getElementById('colorStops');
    container.innerHTML = colorStops.map((stop, i) => `
        <div class="color-stop">
            <input type="color" value="${stop.color}" onchange="updateStopColor(${i}, this.value)">
            <input type="number" value="${stop.position}" min="0" max="100" onchange="updateStopPosition(${i}, this.value)">
            <span>%</span>
            ${colorStops.length > 2 ? `<button class="remove-btn" onclick="removeColorStop(${i})">×</button>` : ''}
        </div>
    `).join('');
}

function renderPresets() {
    const container = document.getElementById('presetGrid');
    container.innerHTML = PRESETS.map((colors, i) => `
        <div class="preset" style="background:linear-gradient(135deg,${colors.join(',')})" onclick="applyPreset(${i})"></div>
    `).join('');
}

function updateStopColor(index, color) {
    colorStops[index].color = color;
    updateGradient();
}

function updateStopPosition(index, position) {
    colorStops[index].position = parseInt(position);
    colorStops.sort((a, b) => a.position - b.position);
    renderColorStops();
    updateGradient();
}

function addColorStop() {
    if (colorStops.length >= 10) {
        showToast('最大10色までです');
        return;
    }
    const lastPos = colorStops[colorStops.length - 1].position;
    const newPos = Math.min(100, lastPos + 20);
    colorStops.push({ color: getRandomColor(), position: newPos });
    colorStops.sort((a, b) => a.position - b.position);
    renderColorStops();
    updateGradient();
}

function removeColorStop(index) {
    if (colorStops.length <= 2) return;
    colorStops.splice(index, 1);
    renderColorStops();
    updateGradient();
}

function getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function applyPreset(index) {
    const preset = PRESETS[index];
    colorStops = preset.map((color, i) => ({
        color,
        position: Math.round(i * 100 / (preset.length - 1))
    }));
    renderColorStops();
    updateGradient();
}

function generateGradientCSS() {
    const stops = colorStops.map(s => `${s.color} ${s.position}%`).join(', ');
    
    switch (gradientType) {
        case 'linear':
            return `linear-gradient(${angle}deg, ${stops})`;
        case 'radial':
            return `radial-gradient(${radialShape} at ${radialPos}, ${stops})`;
        case 'conic':
            return `conic-gradient(from ${angle}deg, ${stops})`;
    }
}

function updateGradient() {
    const gradient = generateGradientCSS();
    
    // Update preview
    document.getElementById('preview').style.background = gradient;
    
    // Update angle display
    document.getElementById('angleValue').textContent = angle + '°';
    document.getElementById('angleDial').style.cssText = `
        width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.1);position:relative;cursor:pointer;
    `;
    document.getElementById('angleDial').innerHTML = `
        <div style="position:absolute;top:50%;left:50%;width:3px;height:35px;background:linear-gradient(to bottom,#ff6b6b,#ffd93d);transform-origin:bottom center;transform:rotate(${angle}deg) translateX(-50%);border-radius:3px"></div>
    `;
    
    // Update code output
    document.getElementById('codeOutput').textContent = `background: ${gradient};`;
    
    // Update variants
    const variants = [
        generateGradientCSS(),
        `linear-gradient(${(angle + 45) % 360}deg, ${colorStops.map(s => s.color).join(', ')})`,
        `radial-gradient(circle, ${colorStops.map(s => s.color).join(', ')})`
    ];
    variants.forEach((v, i) => {
        const el = document.getElementById('var' + i);
        el.style.background = v;
        el.classList.toggle('active', i === 0);
    });
}

function setVariant(index) {
    document.querySelectorAll('.variant').forEach((v, i) => {
        v.classList.toggle('active', i === index);
    });
    
    const variant = document.getElementById('var' + index);
    document.getElementById('preview').style.background = variant.style.background;
    document.getElementById('codeOutput').textContent = `background: ${variant.style.background};`;
}

function copyCode() {
    const code = document.getElementById('codeOutput').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showToast('コピーしました！');
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

init();
