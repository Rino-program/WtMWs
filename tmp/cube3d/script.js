const container = document.getElementById('cubeContainer');
const scene = document.getElementById('scene');
const starsEl = document.getElementById('stars');

let settings = { count: 6, size: 60, speed: 20, hue: 160, animating: true, layout: 'orbit' };

// 星空（軽量化）
const starFrag = document.createDocumentFragment();
for (let i = 0; i < 50; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;width:${Math.random()*2+1}px;height:${Math.random()*2+1}px;--duration:${Math.random()*3+2}s;animation-delay:${Math.random()*3}s;`;
    starFrag.appendChild(star);
}
starsEl.appendChild(starFrag);

const emojis = ['✨','💫','⭐','🌟','💎','🔮'];

function createCube(size, x, y, z, hue) {
    const cube = document.createElement('div');
    cube.className = 'cube';
    cube.style.transform = `translate3d(${x}px,${y}px,${z}px)`;
    
    const transforms = [
        `rotateY(0deg) translateZ(${size/2}px)`,
        `rotateY(180deg) translateZ(${size/2}px)`,
        `rotateY(90deg) translateZ(${size/2}px)`,
        `rotateY(-90deg) translateZ(${size/2}px)`,
        `rotateX(90deg) translateZ(${size/2}px)`,
        `rotateX(-90deg) translateZ(${size/2}px)`
    ];
    
    transforms.forEach((t, i) => {
        const el = document.createElement('div');
        el.className = 'face';
        const h = (hue + i * 30) % 360;
        el.style.cssText = `width:${size}px;height:${size}px;transform:${t};background:linear-gradient(135deg,hsla(${h},70%,50%,0.35),hsla(${h+60},70%,50%,0.15));border-color:hsla(${h},80%,60%,0.5);box-shadow:inset 0 0 20px hsla(${h},70%,50%,0.2);`;
        el.textContent = emojis[i];
        cube.appendChild(el);
    });
    return cube;
}

function getPositions(count, layout) {
    const positions = [];
    const baseRadius = 140;
    
    switch(layout) {
        case 'helix':
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const angle = t * Math.PI * 4;
                positions.push({
                    x: Math.cos(angle) * baseRadius,
                    y: (t - 0.5) * 300,
                    z: Math.sin(angle) * baseRadius
                });
            }
            break;
        case 'grid':
            const cols = Math.ceil(Math.sqrt(count));
            const spacing = 120;
            for (let i = 0; i < count; i++) {
                positions.push({
                    x: (i % cols - cols/2 + 0.5) * spacing,
                    y: 0,
                    z: (Math.floor(i / cols) - cols/2 + 0.5) * spacing
                });
            }
            break;
        case 'sphere':
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(-1 + (2 * i) / count);
                const theta = Math.sqrt(count * Math.PI) * phi;
                positions.push({
                    x: baseRadius * Math.cos(theta) * Math.sin(phi),
                    y: baseRadius * Math.sin(theta) * Math.sin(phi),
                    z: baseRadius * Math.cos(phi)
                });
            }
            break;
        case 'tower':
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const layer = Math.floor(i / 4);
                positions.push({
                    x: Math.cos(angle + layer * 0.5) * (80 + layer * 20),
                    y: layer * 80 - count * 10,
                    z: Math.sin(angle + layer * 0.5) * (80 + layer * 20)
                });
            }
            break;
        default: // orbit
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                positions.push({
                    x: Math.cos(angle) * baseRadius,
                    y: Math.sin(i * 1.5) * 40,
                    z: Math.sin(angle) * baseRadius
                });
            }
    }
    return positions;
}

function generateCubes() {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    
    // グローオーブ（1つだけ）
    const orb = document.createElement('div');
    orb.className = 'glow-orb';
    orb.style.cssText = `width:150px;height:150px;background:hsla(${settings.hue},80%,50%,0.5);transform:translate3d(-75px,-75px,0);`;
    frag.appendChild(orb);
    
    const positions = getPositions(settings.count, settings.layout);
    positions.forEach((pos, i) => {
        const hue = (settings.hue + i * (360 / settings.count)) % 360;
        frag.appendChild(createCube(settings.size, pos.x, pos.y, pos.z, hue));
    });
    
    container.appendChild(frag);
    updateAnimation();
}

function updateAnimation() {
    container.style.animationDuration = settings.speed + 's';
    container.style.animationPlayState = settings.animating ? 'running' : 'paused';
}

// マウス追従（スロットリング）
let mouseX = 0, mouseY = 0, tRotX = 0, tRotY = 0;
document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / innerWidth - 0.5) * 2;
    mouseY = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

function animateScene() {
    tRotX += (mouseY * 15 - tRotX) * 0.03;
    tRotY += (mouseX * 15 - tRotY) * 0.03;
    scene.style.transform = `rotateX(${-tRotX}deg) rotateY(${tRotY}deg)`;
    requestAnimationFrame(animateScene);
}
animateScene();

// イベント
document.getElementById('layoutMode').addEventListener('change', e => { settings.layout = e.target.value; generateCubes(); });
document.getElementById('cubeCount').addEventListener('input', e => { settings.count = +e.target.value; document.getElementById('countVal').textContent = settings.count; generateCubes(); });
document.getElementById('cubeSize').addEventListener('input', e => { settings.size = +e.target.value; document.getElementById('sizeVal').textContent = settings.size; generateCubes(); });
document.getElementById('speed').addEventListener('input', e => { settings.speed = +e.target.value; document.getElementById('speedVal').textContent = settings.speed; updateAnimation(); });
document.getElementById('hue').addEventListener('input', e => { settings.hue = +e.target.value; document.getElementById('hueVal').textContent = settings.hue; generateCubes(); });
document.getElementById('toggleAnim').addEventListener('click', e => { settings.animating = !settings.animating; e.target.textContent = settings.animating ? '停止' : '再生'; updateAnimation(); });
document.getElementById('randomize').addEventListener('click', () => {
    settings.hue = Math.random() * 360 | 0;
    settings.count = (Math.random() * 8 | 0) + 4;
    settings.layout = ['orbit','helix','grid','sphere','tower'][Math.random() * 5 | 0];
    document.getElementById('hue').value = settings.hue;
    document.getElementById('cubeCount').value = settings.count;
    document.getElementById('layoutMode').value = settings.layout;
    document.getElementById('hueVal').textContent = settings.hue;
    document.getElementById('countVal').textContent = settings.count;
    generateCubes();
});

generateCubes();
