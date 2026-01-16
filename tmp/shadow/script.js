// Shadow data storage
let shadows = [];

// DOM elements
const shadowList = document.getElementById('shadowList');
const previewBox = document.getElementById('previewBox');
const cssOutput = document.getElementById('cssOutput');
const addShadowBtn = document.getElementById('addShadow');
const copyBtn = document.getElementById('copyBtn');
const template = document.getElementById('shadowTemplate');

// Default shadow values
const defaultShadow = {
    offsetX: 5,
    offsetY: 5,
    blur: 10,
    spread: 0,
    color: '#667eea',
    opacity: 50,
    inset: false
};

// Presets
const presets = {
    soft: [
        { offsetX: 0, offsetY: 10, blur: 30, spread: -5, color: '#000000', opacity: 30, inset: false }
    ],
    hard: [
        { offsetX: 8, offsetY: 8, blur: 0, spread: 0, color: '#000000', opacity: 50, inset: false }
    ],
    glow: [
        { offsetX: 0, offsetY: 0, blur: 20, spread: 5, color: '#667eea', opacity: 60, inset: false },
        { offsetX: 0, offsetY: 0, blur: 40, spread: 10, color: '#764ba2', opacity: 40, inset: false }
    ],
    inset: [
        { offsetX: 5, offsetY: 5, blur: 15, spread: 0, color: '#000000', opacity: 40, inset: true },
        { offsetX: -5, offsetY: -5, blur: 15, spread: 0, color: '#ffffff', opacity: 10, inset: true }
    ],
    layered: [
        { offsetX: 0, offsetY: 2, blur: 4, spread: 0, color: '#000000', opacity: 20, inset: false },
        { offsetX: 0, offsetY: 4, blur: 8, spread: 0, color: '#000000', opacity: 15, inset: false },
        { offsetX: 0, offsetY: 8, blur: 16, spread: 0, color: '#000000', opacity: 10, inset: false }
    ],
    neon: [
        { offsetX: 0, offsetY: 0, blur: 10, spread: 2, color: '#667eea', opacity: 80, inset: false },
        { offsetX: 0, offsetY: 0, blur: 20, spread: 4, color: '#764ba2', opacity: 60, inset: false },
        { offsetX: 0, offsetY: 0, blur: 40, spread: 8, color: '#667eea', opacity: 40, inset: false }
    ]
};

// Initialize
function init() {
    addShadow();
    bindEvents();
}

// Bind global events
function bindEvents() {
    addShadowBtn.addEventListener('click', () => addShadow());
    copyBtn.addEventListener('click', copyCSS);
    
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
    });
}

// Add new shadow
function addShadow(values = null) {
    const shadowData = values ? { ...values } : { ...defaultShadow };
    const index = shadows.length;
    shadows.push(shadowData);
    
    renderShadowItem(index, shadowData);
    updatePreview();
}

// Render shadow item
function renderShadowItem(index, data) {
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.shadow-item');
    
    item.dataset.index = index;
    item.querySelector('.shadow-number').textContent = index + 1;
    
    // Set values
    item.querySelector('[data-prop="offsetX"]').value = data.offsetX;
    item.querySelector('[data-prop="offsetY"]').value = data.offsetY;
    item.querySelector('[data-prop="blur"]').value = data.blur;
    item.querySelector('[data-prop="spread"]').value = data.spread;
    item.querySelector('[data-prop="color"]').value = data.color;
    item.querySelector('[data-prop="opacity"]').value = data.opacity;
    item.querySelector('[data-prop="inset"]').checked = data.inset;
    
    // Set display values
    item.querySelector('[data-for="offsetX"]').textContent = `${data.offsetX}px`;
    item.querySelector('[data-for="offsetY"]').textContent = `${data.offsetY}px`;
    item.querySelector('[data-for="blur"]').textContent = `${data.blur}px`;
    item.querySelector('[data-for="spread"]').textContent = `${data.spread}px`;
    item.querySelector('[data-for="opacity"]').textContent = `${data.opacity}%`;
    
    // Bind events
    bindShadowEvents(item, index);
    
    shadowList.appendChild(item);
}

// Bind events for shadow item
function bindShadowEvents(item, index) {
    // Sliders
    item.querySelectorAll('.slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
            const prop = e.target.dataset.prop;
            const value = parseInt(e.target.value);
            shadows[index][prop] = value;
            
            const display = item.querySelector(`[data-for="${prop}"]`);
            if (display) {
                display.textContent = prop === 'opacity' ? `${value}%` : `${value}px`;
            }
            
            updatePreview();
        });
    });
    
    // Color picker
    item.querySelector('.color-picker').addEventListener('input', (e) => {
        shadows[index].color = e.target.value;
        updatePreview();
    });
    
    // Inset checkbox
    item.querySelector('.inset-check').addEventListener('change', (e) => {
        shadows[index].inset = e.target.checked;
        updatePreview();
    });
    
    // Remove button
    item.querySelector('.btn-remove').addEventListener('click', () => {
        removeShadow(index);
    });
}

// Remove shadow
function removeShadow(index) {
    if (shadows.length <= 1) {
        showToast('最低1つのシャドウが必要です');
        return;
    }
    
    shadows.splice(index, 1);
    renderAllShadows();
    updatePreview();
}

// Render all shadows
function renderAllShadows() {
    shadowList.innerHTML = '';
    shadows.forEach((shadow, index) => {
        renderShadowItem(index, shadow);
    });
}

// Convert hex to rgba
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Generate CSS string
function generateCSS() {
    const shadowStrings = shadows.map(s => {
        const inset = s.inset ? 'inset ' : '';
        const color = hexToRgba(s.color, s.opacity);
        return `${inset}${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.spread}px ${color}`;
    });
    
    return shadowStrings.join(',\n    ');
}

// Update preview
function updatePreview() {
    const css = generateCSS();
    previewBox.style.boxShadow = css.replace(/\n\s*/g, ' ');
    cssOutput.textContent = `box-shadow: ${css};`;
}

// Copy CSS to clipboard
async function copyCSS() {
    const css = `box-shadow: ${generateCSS()};`;
    
    try {
        await navigator.clipboard.writeText(css);
        showToast('CSSをコピーしました！');
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = css;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('CSSをコピーしました！');
    }
}

// Apply preset
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    
    shadows = preset.map(s => ({ ...s }));
    renderAllShadows();
    updatePreview();
    showToast(`${presetName}プリセットを適用しました`);
}

// Show toast notification
function showToast(message) {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Start the app
init();
