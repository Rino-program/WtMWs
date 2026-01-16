const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const info = document.getElementById('info');

let W, H, centerX = -0.5, centerY = 0, zoom = 200, maxIter = 80, hueOffset = 0;
let colorScheme = 'rainbow', fractalType = 'mandelbrot';
let juliaC = {x: -0.7, y: 0.27015};
let isDragging = false, dragStart = {x:0,y:0}, dragStartCenter = {x:0,y:0};
let animating = false, animId;

const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; render(); };

const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q-p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q-p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1+s) : l + s - l*s;
        const p = 2*l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [r*255|0, g*255|0, b*255|0];
};

const getColor = (iter) => {
    if (iter >= maxIter) return [0, 0, 0];
    const t = iter / maxIter;
    const h = (t * 360 + hueOffset) % 360;
    switch (colorScheme) {
        case 'fire': return [Math.min(255, t*3*255)|0, Math.max(0, (t-0.33)*3*255)|0, Math.max(0, (t-0.66)*3*255)|0];
        case 'ocean': return [(t*50)|0, (100+t*155)|0, (150+t*105)|0];
        case 'purple': return [(128+Math.sin(t*Math.PI)*127)|0, (t*100)|0, (200+t*55)|0];
        case 'neon': return [(Math.sin(t*Math.PI*2)*127+128)|0, (Math.sin(t*Math.PI*2+2)*127+128)|0, 255];
        default: return hslToRgb(h/360, 0.8, 0.5);
    }
};

const calcFractal = (cx, cy) => {
    let x = 0, y = 0, iter = 0;
    if (fractalType === 'julia') { x = cx; y = cy; cx = juliaC.x; cy = juliaC.y; }
    
    while (x*x + y*y <= 4 && iter < maxIter) {
        let xTemp;
        switch (fractalType) {
            case 'burningship':
                xTemp = x*x - y*y + cx;
                y = Math.abs(2*x*y) + cy;
                x = xTemp; break;
            case 'tricorn':
                xTemp = x*x - y*y + cx;
                y = -2*x*y + cy;
                x = xTemp; break;
            default:
                xTemp = x*x - y*y + cx;
                y = 2*x*y + cy;
                x = xTemp;
        }
        iter++;
    }
    if (iter < maxIter) {
        const log_zn = Math.log(x*x + y*y) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        iter = iter + 1 - nu;
    }
    return iter;
};

const render = () => {
    loading.classList.add('active');
    setTimeout(() => {
        const imageData = ctx.createImageData(W, H);
        const data = imageData.data;
        const step = 2; // 軽量化: 2x2ピクセル単位
        
        for (let py = 0; py < H; py += step) {
            for (let px = 0; px < W; px += step) {
                const x = (px - W/2) / zoom + centerX;
                const y = (py - H/2) / zoom + centerY;
                const iter = calcFractal(x, y);
                const [r, g, b] = getColor(iter);
                
                for (let dy = 0; dy < step && py+dy < H; dy++) {
                    for (let dx = 0; dx < step && px+dx < W; dx++) {
                        const idx = ((py+dy) * W + (px+dx)) * 4;
                        data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255;
                    }
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
        loading.classList.remove('active');
        info.textContent = `(${centerX.toFixed(8)}, ${centerY.toFixed(8)}) | zoom: ${zoom.toFixed(0)}x`;
    }, 10);
};

const screenToComplex = (px, py) => ({x: (px - W/2) / zoom + centerX, y: (py - H/2) / zoom + centerY});

addEventListener('resize', resize);

canvas.addEventListener('click', e => {
    if (isDragging) return;
    const pos = screenToComplex(e.clientX, e.clientY);
    centerX = pos.x; centerY = pos.y; zoom *= 2;
    render();
});

canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    const pos = screenToComplex(e.clientX, e.clientY);
    centerX = pos.x; centerY = pos.y; zoom = Math.max(50, zoom/2);
    render();
});

canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { isDragging = true; dragStart = {x: e.clientX, y: e.clientY}; dragStartCenter = {x: centerX, y: centerY}; }
});

canvas.addEventListener('mousemove', e => {
    if (isDragging) {
        centerX = dragStartCenter.x - (e.clientX - dragStart.x) / zoom;
        centerY = dragStartCenter.y - (e.clientY - dragStart.y) / zoom;
        render();
    }
});

canvas.addEventListener('mouseup', () => { isDragging = false; });

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const pos = screenToComplex(e.clientX, e.clientY);
    if (e.deltaY < 0) { zoom *= 1.3; centerX += (pos.x - centerX) * 0.2; centerY += (pos.y - centerY) * 0.2; }
    else { zoom = Math.max(50, zoom / 1.3); }
    render();
}, {passive: false});

document.getElementById('fractalType').addEventListener('change', e => { fractalType = e.target.value; render(); });
document.getElementById('colorScheme').addEventListener('change', e => { colorScheme = e.target.value; render(); });
document.getElementById('iterations').addEventListener('input', e => { maxIter = +e.target.value; document.getElementById('iterVal').textContent = maxIter; render(); });
document.getElementById('hueOffset').addEventListener('input', e => { hueOffset = +e.target.value; document.getElementById('hueOffsetVal').textContent = hueOffset; render(); });
document.getElementById('reset').addEventListener('click', () => { centerX = -0.5; centerY = 0; zoom = 200; render(); });
document.getElementById('save').addEventListener('click', () => { const a = document.createElement('a'); a.download = 'fractal.png'; a.href = canvas.toDataURL(); a.click(); });
document.getElementById('animate').addEventListener('click', function() {
    animating = !animating;
    this.textContent = animating ? '停止' : 'アニメ';
    if (animating) {
        const animateJulia = () => {
            if (!animating) return;
            juliaC.x = Math.cos(Date.now() * 0.001) * 0.7885;
            juliaC.y = Math.sin(Date.now() * 0.001) * 0.7885;
            hueOffset = (hueOffset + 1) % 360;
            document.getElementById('hueOffset').value = hueOffset;
            document.getElementById('hueOffsetVal').textContent = hueOffset;
            if (fractalType === 'julia') render();
            animId = requestAnimationFrame(animateJulia);
        };
        document.getElementById('fractalType').value = 'julia';
        fractalType = 'julia';
        animateJulia();
    } else { cancelAnimationFrame(animId); }
});

resize();
