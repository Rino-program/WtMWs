const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let W, H, balls = [];
let gravity = 0.5, bounce = 0.8, count = 20, simMode = 'gravity';
let dragStart = null, dragBall = null;

class Ball {
    constructor(x, y, r, vx = 0, vy = 0) {
        this.x = x; this.y = y;
        this.r = r || Math.random() * 20 + 10;
        this.vx = vx; this.vy = vy;
        this.mass = this.r * this.r;
        this.hue = Math.random() * 360;
        this.trail = [];
    }
    
    update() {
        // 軌跡の記録
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 20) this.trail.shift();
        
        switch (simMode) {
            case 'gravity':
                this.vy += gravity;
                break;
            case 'orbit':
                // 中央への引力
                const dx = W/2 - this.x, dy = H/2 - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 10) {
                    const f = gravity * 50 / dist;
                    this.vx += dx / dist * f;
                    this.vy += dy / dist * f;
                }
                break;
            case 'explosion':
                // 中央からの斥力
                const dx2 = this.x - W/2, dy2 = this.y - H/2;
                const dist2 = Math.hypot(dx2, dy2);
                if (dist2 < 300 && dist2 > 10) {
                    const f = gravity * 30 / dist2;
                    this.vx += dx2 / dist2 * f;
                    this.vy += dy2 / dist2 * f;
                }
                this.vy += gravity * 0.2;
                break;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 壁との衝突
        if (this.x - this.r < 0) { this.x = this.r; this.vx *= -bounce; }
        if (this.x + this.r > W) { this.x = W - this.r; this.vx *= -bounce; }
        if (this.y - this.r < 0) { this.y = this.r; this.vy *= -bounce; }
        if (this.y + this.r > H) { this.y = H - this.r; this.vy *= -bounce; }
        
        // 空気抵抗
        this.vx *= 0.999;
        this.vy *= 0.999;
    }
    
    draw() {
        // 軌跡
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            this.trail.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = `hsla(${this.hue}, 70%, 50%, 0.3)`;
            ctx.lineWidth = this.r * 0.5;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
        
        // ボール本体
        const gradient = ctx.createRadialGradient(
            this.x - this.r * 0.3, this.y - this.r * 0.3, 0,
            this.x, this.y, this.r
        );
        gradient.addColorStop(0, `hsl(${this.hue}, 80%, 70%)`);
        gradient.addColorStop(1, `hsl(${this.hue}, 80%, 40%)`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // ハイライト
        ctx.beginPath();
        ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
    }
    
    collideWith(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.hypot(dx, dy);
        const minDist = this.r + other.r;
        
        if (dist < minDist && dist > 0) {
            // 衝突応答
            const nx = dx / dist, ny = dy / dist;
            const overlap = minDist - dist;
            
            // 位置補正
            const totalMass = this.mass + other.mass;
            this.x -= nx * overlap * (other.mass / totalMass);
            this.y -= ny * overlap * (other.mass / totalMass);
            other.x += nx * overlap * (this.mass / totalMass);
            other.y += ny * overlap * (this.mass / totalMass);
            
            // 速度交換（弾性衝突）
            const dvx = this.vx - other.vx;
            const dvy = this.vy - other.vy;
            const dvn = dvx * nx + dvy * ny;
            
            if (dvn > 0) {
                const impulse = 2 * dvn / totalMass * bounce;
                this.vx -= impulse * other.mass * nx;
                this.vy -= impulse * other.mass * ny;
                other.vx += impulse * this.mass * nx;
                other.vy += impulse * this.mass * ny;
            }
        }
    }
}

const resize = () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
};

const init = () => {
    balls = [];
    for (let i = 0; i < count; i++) {
        balls.push(new Ball(
            Math.random() * (W - 100) + 50,
            Math.random() * (H - 100) + 50,
            Math.random() * 20 + 10,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        ));
    }
};

const animate = () => {
    ctx.fillStyle = 'rgba(13, 17, 23, 0.2)';
    ctx.fillRect(0, 0, W, H);
    
    // 衝突判定
    if (simMode === 'collision' || simMode === 'gravity') {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                balls[i].collideWith(balls[j]);
            }
        }
    }
    
    balls.forEach(b => {
        b.update();
        b.draw();
    });
    
    // ドラッグ中の線
    if (dragStart && dragBall) {
        ctx.beginPath();
        ctx.moveTo(dragBall.x, dragBall.y);
        ctx.lineTo(dragStart.x, dragStart.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    requestAnimationFrame(animate);
};

const explode = () => {
    balls.forEach(b => {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * 20 + 10;
        b.vx = Math.cos(angle) * force;
        b.vy = Math.sin(angle) * force;
    });
};

canvas.addEventListener('mousedown', e => {
    const x = e.clientX, y = e.clientY;
    dragBall = balls.find(b => Math.hypot(b.x - x, b.y - y) < b.r);
    if (dragBall) {
        dragStart = {x, y};
    } else {
        balls.push(new Ball(x, y, Math.random() * 20 + 10));
    }
});

canvas.addEventListener('mousemove', e => {
    if (dragStart) dragStart = {x: e.clientX, y: e.clientY};
});

canvas.addEventListener('mouseup', e => {
    if (dragStart && dragBall) {
        dragBall.vx = (dragBall.x - e.clientX) * 0.2;
        dragBall.vy = (dragBall.y - e.clientY) * 0.2;
    }
    dragStart = null;
    dragBall = null;
});

// タッチイベント対応
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = touch.clientX, y = touch.clientY;
    dragBall = balls.find(b => Math.hypot(b.x - x, b.y - y) < b.r);
    if (dragBall) {
        dragStart = {x, y};
    } else {
        balls.push(new Ball(x, y, Math.random() * 20 + 10));
    }
}, { passive: false });

canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (dragStart) {
        const touch = e.touches[0];
        dragStart = {x: touch.clientX, y: touch.clientY};
    }
}, { passive: false });

canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (dragStart && dragBall && e.changedTouches[0]) {
        const touch = e.changedTouches[0];
        dragBall.vx = (dragBall.x - touch.clientX) * 0.2;
        dragBall.vy = (dragBall.y - touch.clientY) * 0.2;
    }
    dragStart = null;
    dragBall = null;
}, { passive: false });

document.getElementById('simMode').addEventListener('change', e => simMode = e.target.value);
document.getElementById('count').addEventListener('input', e => {
    count = +e.target.value;
    document.getElementById('countVal').textContent = count;
});
document.getElementById('gravity').addEventListener('input', e => {
    gravity = +e.target.value;
    document.getElementById('gravVal').textContent = gravity;
});
document.getElementById('bounce').addEventListener('input', e => {
    bounce = +e.target.value;
    document.getElementById('bounceVal').textContent = bounce;
});
document.getElementById('reset').addEventListener('click', init);
document.getElementById('explode').addEventListener('click', explode);
document.getElementById('addBall').addEventListener('click', () => {
    balls.push(new Ball(W/2, H/2, Math.random() * 20 + 10, (Math.random()-0.5)*10, (Math.random()-0.5)*10));
});

addEventListener('resize', resize);
resize();
init();
animate();
