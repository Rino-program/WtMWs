// =====================================
// BREAKOUT GAME - High Quality Version
// =====================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ========== GAME CONFIGURATION ==========
const CONFIG = {
    // Canvas size
    baseWidth: 480,
    baseHeight: 640,
    
    // Paddle
    paddleWidth: 100,
    paddleHeight: 15,
    paddleSpeed: 8,
    
    // Ball
    ballRadius: 8,
    ballBaseSpeed: 5,
    ballMaxSpeed: 12,
    
    // Blocks
    blockRows: 5,
    blockCols: 8,
    blockWidth: 50,
    blockHeight: 20,
    blockPadding: 5,
    blockOffsetTop: 60,
    blockOffsetLeft: 25,
    
    // Power-ups
    powerUpSpeed: 3,
    powerUpSize: 25,
    powerUpChance: 0.2,
    
    // Game
    initialLives: 3,
    comboTimeout: 2000,
    maxCombo: 10
};

// ========== GAME STATE ==========
let game = {
    score: 0,
    lives: CONFIG.initialLives,
    level: 1,
    combo: 1,
    comboTimer: null,
    highScore: parseInt(localStorage.getItem('breakoutHighScore')) || 0,
    isRunning: false,
    isPaused: false,
    soundEnabled: true
};

// ========== GAME OBJECTS ==========
let paddle = {
    x: 0,
    y: 0,
    width: CONFIG.paddleWidth,
    height: CONFIG.paddleHeight,
    speed: CONFIG.paddleSpeed,
    dx: 0,
    color: '#4facfe'
};

let balls = [];
let blocks = [];
let powerUps = [];
let particles = [];
let lasers = [];
let trails = [];

// Active power-up effects
let activePowerUps = {
    multiball: false,
    widePaddle: false,
    narrowPaddle: false,
    slowBall: false,
    laser: false,
    pierce: false,
    laserCooldown: 0
};

let powerUpTimers = {};

// ========== INPUT STATE ==========
let keys = {
    left: false,
    right: false
};

let mouseX = 0;
let touchActive = false;

// ========== LEVEL PATTERNS ==========
const levelPatterns = [
    // Level 1 - Simple
    () => generateStandardBlocks(5, 8),
    // Level 2 - Pyramid
    () => generatePyramidBlocks(),
    // Level 3 - Checkerboard
    () => generateCheckerboardBlocks(),
    // Level 4 - Diamond
    () => generateDiamondBlocks(),
    // Level 5 - Castle
    () => generateCastleBlocks(),
    // Level 6+ - Random with more rows
    () => generateStandardBlocks(Math.min(8, 5 + Math.floor(game.level / 2)), 8)
];

// ========== POWER-UP TYPES ==========
const POWER_UP_TYPES = {
    MULTIBALL: { name: 'Multi Ball', icon: '⚡', color: '#ffd700', duration: 0 },
    WIDE_PADDLE: { name: 'Wide Paddle', icon: '↔️', color: '#4ecdc4', duration: 10000 },
    NARROW_PADDLE: { name: 'Narrow Paddle', icon: '↕️', color: '#ff6b6b', duration: 8000 },
    SLOW_BALL: { name: 'Slow Ball', icon: '🐢', color: '#a8e6cf', duration: 8000 },
    LASER: { name: 'Laser', icon: '🔫', color: '#ff9f43', duration: 12000 },
    PIERCE: { name: 'Pierce', icon: '💎', color: '#a55eea', duration: 10000 }
};

// ========== INITIALIZATION ==========
function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    
    // Button listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
    
    // Display high score
    document.getElementById('highScoreDisplay').textContent = game.highScore;
    
    // Initial draw
    drawBackground();
}

function resizeCanvas() {
    const container = document.querySelector('.canvas-wrapper');
    const maxWidth = Math.min(window.innerWidth - 20, CONFIG.baseWidth);
    const scale = maxWidth / CONFIG.baseWidth;
    
    canvas.width = CONFIG.baseWidth;
    canvas.height = CONFIG.baseHeight;
    canvas.style.width = `${CONFIG.baseWidth * scale}px`;
    canvas.style.height = `${CONFIG.baseHeight * scale}px`;
    
    // Update paddle position
    paddle.y = canvas.height - 40;
    paddle.x = (canvas.width - paddle.width) / 2;
}

// ========== GAME CONTROL ==========
function startGame() {
    document.getElementById('startOverlay').classList.add('hidden');
    resetGame();
    game.isRunning = true;
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    document.getElementById('gameOverOverlay').classList.add('hidden');
    game.level = 1;
    game.score = 0;
    game.lives = CONFIG.initialLives;
    updateUI();
    resetGame();
    game.isRunning = true;
    requestAnimationFrame(gameLoop);
}

function nextLevel() {
    document.getElementById('levelClearOverlay').classList.add('hidden');
    game.level++;
    resetGame();
    game.isRunning = true;
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    // Reset paddle
    paddle.width = CONFIG.paddleWidth;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.y = canvas.height - 40;
    
    // Reset balls
    balls = [{
        x: canvas.width / 2,
        y: paddle.y - CONFIG.ballRadius - 5,
        dx: (Math.random() > 0.5 ? 1 : -1) * CONFIG.ballBaseSpeed * 0.7,
        dy: -CONFIG.ballBaseSpeed,
        radius: CONFIG.ballRadius,
        speed: CONFIG.ballBaseSpeed,
        pierce: false
    }];
    
    // Reset power-ups
    powerUps = [];
    lasers = [];
    particles = [];
    trails = [];
    
    // Clear active power-ups
    Object.keys(activePowerUps).forEach(key => {
        activePowerUps[key] = false;
    });
    Object.keys(powerUpTimers).forEach(key => {
        clearTimeout(powerUpTimers[key]);
        delete powerUpTimers[key];
    });
    document.getElementById('powerupIndicators').innerHTML = '';
    
    // Generate blocks for current level
    generateBlocks();
    
    // Reset combo
    game.combo = 1;
    if (game.comboTimer) clearTimeout(game.comboTimer);
    
    updateUI();
}

function togglePause() {
    if (!game.isRunning) return;
    
    game.isPaused = !game.isPaused;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !game.isPaused);
    
    if (!game.isPaused) {
        requestAnimationFrame(gameLoop);
    }
}

function resumeGame() {
    game.isPaused = false;
    document.getElementById('pauseOverlay').classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

function toggleSound() {
    game.soundEnabled = !game.soundEnabled;
    document.getElementById('soundBtn').textContent = game.soundEnabled ? '🔊' : '🔇';
}

// ========== BLOCK GENERATION ==========
function generateBlocks() {
    const patternIndex = Math.min(game.level - 1, levelPatterns.length - 1);
    blocks = levelPatterns[patternIndex]();
}

function generateStandardBlocks(rows, cols) {
    const newBlocks = [];
    const totalWidth = cols * (CONFIG.blockWidth + CONFIG.blockPadding) - CONFIG.blockPadding;
    const offsetLeft = (canvas.width - totalWidth) / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            newBlocks.push(createBlock(row, col, offsetLeft, rows));
        }
    }
    return newBlocks;
}

function generatePyramidBlocks() {
    const newBlocks = [];
    const maxCols = 8;
    const rows = 6;
    
    for (let row = 0; row < rows; row++) {
        const cols = maxCols - row;
        const totalWidth = cols * (CONFIG.blockWidth + CONFIG.blockPadding) - CONFIG.blockPadding;
        const offsetLeft = (canvas.width - totalWidth) / 2;
        
        for (let col = 0; col < cols; col++) {
            newBlocks.push(createBlock(row, col, offsetLeft, rows));
        }
    }
    return newBlocks;
}

function generateCheckerboardBlocks() {
    const newBlocks = [];
    const rows = 6;
    const cols = 8;
    const totalWidth = cols * (CONFIG.blockWidth + CONFIG.blockPadding) - CONFIG.blockPadding;
    const offsetLeft = (canvas.width - totalWidth) / 2;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((row + col) % 2 === 0) {
                newBlocks.push(createBlock(row, col, offsetLeft, rows));
            }
        }
    }
    return newBlocks;
}

function generateDiamondBlocks() {
    const newBlocks = [];
    const pattern = [
        [0,0,0,1,1,0,0,0],
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0],
        [0,0,0,1,1,0,0,0]
    ];
    
    const totalWidth = 8 * (CONFIG.blockWidth + CONFIG.blockPadding) - CONFIG.blockPadding;
    const offsetLeft = (canvas.width - totalWidth) / 2;
    
    pattern.forEach((rowData, row) => {
        rowData.forEach((hasBlock, col) => {
            if (hasBlock) {
                newBlocks.push(createBlock(row, col, offsetLeft, pattern.length));
            }
        });
    });
    return newBlocks;
}

function generateCastleBlocks() {
    const newBlocks = [];
    const pattern = [
        [1,0,1,0,0,1,0,1],
        [1,1,1,0,0,1,1,1],
        [1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1],
        [0,1,1,1,1,1,1,0],
        [0,0,1,1,1,1,0,0]
    ];
    
    const totalWidth = 8 * (CONFIG.blockWidth + CONFIG.blockPadding) - CONFIG.blockPadding;
    const offsetLeft = (canvas.width - totalWidth) / 2;
    
    pattern.forEach((rowData, row) => {
        rowData.forEach((hasBlock, col) => {
            if (hasBlock) {
                newBlocks.push(createBlock(row, col, offsetLeft, pattern.length));
            }
        });
    });
    return newBlocks;
}

function createBlock(row, col, offsetLeft, totalRows) {
    const colors = [
        { fill: '#ff6b6b', stroke: '#ee5a5a', points: 100 },
        { fill: '#ffd93d', stroke: '#eec82c', points: 80 },
        { fill: '#6bcb77', stroke: '#5aba66', points: 60 },
        { fill: '#4d96ff', stroke: '#3c85ee', points: 40 },
        { fill: '#a55eea', stroke: '#944ddb', points: 50 }
    ];
    
    const colorIndex = row % colors.length;
    const health = Math.min(3, 1 + Math.floor(game.level / 3)); // More health in later levels
    
    return {
        x: offsetLeft + col * (CONFIG.blockWidth + CONFIG.blockPadding),
        y: CONFIG.blockOffsetTop + row * (CONFIG.blockHeight + CONFIG.blockPadding),
        width: CONFIG.blockWidth,
        height: CONFIG.blockHeight,
        color: colors[colorIndex].fill,
        strokeColor: colors[colorIndex].stroke,
        points: colors[colorIndex].points * (1 + (totalRows - row - 1) * 0.2),
        health: (row === 0) ? health : 1, // Top row blocks have more health
        maxHealth: (row === 0) ? health : 1,
        hasPowerUp: Math.random() < CONFIG.powerUpChance
    };
}

// ========== INPUT HANDLERS ==========
function handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' && activePowerUps.laser) fireLaser();
    if (e.key === 'Escape') togglePause();
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
}

function handleTouchStart(e) {
    e.preventDefault();
    touchActive = true;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (touch.clientX - rect.left) * scaleX;
    
    if (activePowerUps.laser) fireLaser();
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (touch.clientX - rect.left) * scaleX;
}

function handleTouchEnd() {
    touchActive = false;
}

// ========== GAME LOOP ==========
function gameLoop() {
    if (!game.isRunning || game.isPaused) return;
    
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    updatePaddle();
    updateBalls();
    updatePowerUps();
    updateLasers();
    updateParticles();
    updateTrails();
    
    // Check win condition
    if (blocks.length === 0) {
        levelComplete();
    }
}

function updatePaddle() {
    // Keyboard movement
    if (keys.left) paddle.x -= paddle.speed;
    if (keys.right) paddle.x += paddle.speed;
    
    // Mouse/Touch movement
    const targetX = mouseX - paddle.width / 2;
    paddle.x += (targetX - paddle.x) * 0.15;
    
    // Boundaries
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
    
    // Laser cooldown
    if (activePowerUps.laserCooldown > 0) {
        activePowerUps.laserCooldown--;
    }
}

function updateBalls() {
    const speedMultiplier = activePowerUps.slowBall ? 0.6 : 1;
    
    balls.forEach((ball, ballIndex) => {
        // Add trail
        trails.push({
            x: ball.x,
            y: ball.y,
            radius: ball.radius,
            alpha: 0.5,
            color: ball.pierce ? '#a55eea' : '#4facfe'
        });
        
        // Move ball
        ball.x += ball.dx * speedMultiplier;
        ball.y += ball.dy * speedMultiplier;
        
        // Wall collision
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
            ball.dx = -ball.dx;
            ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
            playSound('wall');
        }
        
        // Top collision
        if (ball.y - ball.radius <= 0) {
            ball.dy = -ball.dy;
            ball.y = ball.radius;
            playSound('wall');
        }
        
        // Paddle collision
        if (ball.dy > 0 && 
            ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width) {
            
            // Calculate bounce angle based on where ball hit paddle
            const hitPoint = (ball.x - paddle.x) / paddle.width;
            const angle = (hitPoint - 0.5) * Math.PI * 0.7; // -63 to +63 degrees
            
            const speed = Math.min(ball.speed * 1.02, CONFIG.ballMaxSpeed);
            ball.speed = speed;
            ball.dx = Math.sin(angle) * speed;
            ball.dy = -Math.cos(angle) * speed;
            
            ball.y = paddle.y - ball.radius;
            playSound('paddle');
            
            // Create paddle hit particles
            createParticles(ball.x, ball.y, '#4facfe', 5);
        }
        
        // Block collision
        blocks.forEach((block, blockIndex) => {
            if (checkBlockCollision(ball, block)) {
                // Handle collision
                if (!ball.pierce) {
                    // Normal ball bounces
                    resolveBlockCollision(ball, block);
                }
                
                block.health--;
                
                if (block.health <= 0) {
                    // Block destroyed
                    addScore(block.points);
                    createParticles(
                        block.x + block.width / 2,
                        block.y + block.height / 2,
                        block.color,
                        15
                    );
                    
                    // Drop power-up
                    if (block.hasPowerUp) {
                        spawnPowerUp(block.x + block.width / 2, block.y + block.height / 2);
                    }
                    
                    blocks.splice(blockIndex, 1);
                    playSound('break');
                } else {
                    playSound('hit');
                }
            }
        });
        
        // Bottom - lose ball
        if (ball.y - ball.radius > canvas.height) {
            balls.splice(ballIndex, 1);
            
            if (balls.length === 0) {
                loseLife();
            }
        }
    });
}

function checkBlockCollision(ball, block) {
    return ball.x + ball.radius > block.x &&
           ball.x - ball.radius < block.x + block.width &&
           ball.y + ball.radius > block.y &&
           ball.y - ball.radius < block.y + block.height;
}

function resolveBlockCollision(ball, block) {
    const overlapLeft = (ball.x + ball.radius) - block.x;
    const overlapRight = (block.x + block.width) - (ball.x - ball.radius);
    const overlapTop = (ball.y + ball.radius) - block.y;
    const overlapBottom = (block.y + block.height) - (ball.y - ball.radius);
    
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    
    if (minOverlapX < minOverlapY) {
        ball.dx = -ball.dx;
        ball.x += (overlapLeft < overlapRight) ? -overlapLeft : overlapRight;
    } else {
        ball.dy = -ball.dy;
        ball.y += (overlapTop < overlapBottom) ? -overlapTop : overlapBottom;
    }
}

function updatePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += CONFIG.powerUpSpeed;
        powerUp.rotation += 0.05;
        
        // Check paddle collision
        if (powerUp.y + CONFIG.powerUpSize >= paddle.y &&
            powerUp.y <= paddle.y + paddle.height &&
            powerUp.x + CONFIG.powerUpSize >= paddle.x &&
            powerUp.x <= paddle.x + paddle.width) {
            
            activatePowerUp(powerUp.type);
            powerUps.splice(index, 1);
            playSound('powerup');
        }
        
        // Remove if off screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

function updateLasers() {
    lasers.forEach((laser, index) => {
        laser.y -= 10;
        
        // Check block collision
        blocks.forEach((block, blockIndex) => {
            if (laser.x >= block.x &&
                laser.x <= block.x + block.width &&
                laser.y >= block.y &&
                laser.y <= block.y + block.height) {
                
                block.health--;
                
                if (block.health <= 0) {
                    addScore(block.points);
                    createParticles(
                        block.x + block.width / 2,
                        block.y + block.height / 2,
                        block.color,
                        10
                    );
                    
                    if (block.hasPowerUp) {
                        spawnPowerUp(block.x + block.width / 2, block.y + block.height / 2);
                    }
                    
                    blocks.splice(blockIndex, 1);
                }
                
                lasers.splice(index, 1);
                playSound('hit');
            }
        });
        
        // Remove if off screen
        if (laser.y < 0) {
            lasers.splice(index, 1);
        }
    });
}

function updateParticles() {
    particles.forEach((particle, index) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.dy += 0.2; // gravity
        particle.alpha -= 0.02;
        particle.size *= 0.98;
        
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }
    });
}

function updateTrails() {
    trails.forEach((trail, index) => {
        trail.alpha -= 0.08;
        trail.radius *= 0.95;
        
        if (trail.alpha <= 0) {
            trails.splice(index, 1);
        }
    });
}

// ========== POWER-UP FUNCTIONS ==========
function spawnPowerUp(x, y) {
    const types = Object.keys(POWER_UP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x - CONFIG.powerUpSize / 2,
        y: y,
        type: type,
        rotation: 0
    });
}

function activatePowerUp(type) {
    const powerUpInfo = POWER_UP_TYPES[type];
    
    switch (type) {
        case 'MULTIBALL':
            // Add 2 more balls
            const baseBall = balls[0];
            if (baseBall) {
                for (let i = 0; i < 2; i++) {
                    const angle = (Math.random() - 0.5) * Math.PI;
                    balls.push({
                        x: baseBall.x,
                        y: baseBall.y,
                        dx: Math.sin(angle) * baseBall.speed,
                        dy: -Math.abs(Math.cos(angle) * baseBall.speed),
                        radius: baseBall.radius,
                        speed: baseBall.speed,
                        pierce: baseBall.pierce
                    });
                }
            }
            break;
            
        case 'WIDE_PADDLE':
            if (activePowerUps.narrowPaddle) {
                deactivatePowerUp('NARROW_PADDLE');
            }
            activePowerUps.widePaddle = true;
            paddle.width = CONFIG.paddleWidth * 1.5;
            paddle.x = Math.min(paddle.x, canvas.width - paddle.width);
            setTimedPowerUp('WIDE_PADDLE', powerUpInfo.duration);
            break;
            
        case 'NARROW_PADDLE':
            if (activePowerUps.widePaddle) {
                deactivatePowerUp('WIDE_PADDLE');
            }
            activePowerUps.narrowPaddle = true;
            paddle.width = CONFIG.paddleWidth * 0.6;
            setTimedPowerUp('NARROW_PADDLE', powerUpInfo.duration);
            break;
            
        case 'SLOW_BALL':
            activePowerUps.slowBall = true;
            setTimedPowerUp('SLOW_BALL', powerUpInfo.duration);
            break;
            
        case 'LASER':
            activePowerUps.laser = true;
            setTimedPowerUp('LASER', powerUpInfo.duration);
            break;
            
        case 'PIERCE':
            activePowerUps.pierce = true;
            balls.forEach(ball => ball.pierce = true);
            setTimedPowerUp('PIERCE', powerUpInfo.duration);
            break;
    }
    
    showPowerUpIndicator(type, powerUpInfo.duration);
}

function deactivatePowerUp(type) {
    switch (type) {
        case 'WIDE_PADDLE':
        case 'NARROW_PADDLE':
            activePowerUps.widePaddle = false;
            activePowerUps.narrowPaddle = false;
            paddle.width = CONFIG.paddleWidth;
            paddle.x = Math.min(paddle.x, canvas.width - paddle.width);
            break;
            
        case 'SLOW_BALL':
            activePowerUps.slowBall = false;
            break;
            
        case 'LASER':
            activePowerUps.laser = false;
            break;
            
        case 'PIERCE':
            activePowerUps.pierce = false;
            balls.forEach(ball => ball.pierce = false);
            break;
    }
    
    removePowerUpIndicator(type);
}

function setTimedPowerUp(type, duration) {
    if (powerUpTimers[type]) {
        clearTimeout(powerUpTimers[type]);
    }
    
    powerUpTimers[type] = setTimeout(() => {
        deactivatePowerUp(type);
        delete powerUpTimers[type];
    }, duration);
}

function fireLaser() {
    if (activePowerUps.laserCooldown > 0) return;
    
    lasers.push({
        x: paddle.x + 10,
        y: paddle.y
    });
    lasers.push({
        x: paddle.x + paddle.width - 10,
        y: paddle.y
    });
    
    activePowerUps.laserCooldown = 15;
    playSound('laser');
}

// ========== UI FUNCTIONS ==========
function showPowerUpIndicator(type, duration) {
    const container = document.getElementById('powerupIndicators');
    const powerUpInfo = POWER_UP_TYPES[type];
    
    // Remove existing indicator for this type
    const existing = document.getElementById(`powerup-${type}`);
    if (existing) existing.remove();
    
    if (duration === 0) return; // No indicator for instant power-ups
    
    const indicator = document.createElement('div');
    indicator.className = 'powerup-indicator';
    indicator.id = `powerup-${type}`;
    indicator.innerHTML = `
        ${powerUpInfo.icon} ${powerUpInfo.name}
        <span class="timer">${Math.ceil(duration / 1000)}s</span>
    `;
    indicator.style.borderColor = powerUpInfo.color;
    container.appendChild(indicator);
    
    // Update timer
    let remaining = duration;
    const timerInterval = setInterval(() => {
        remaining -= 1000;
        const timer = indicator.querySelector('.timer');
        if (timer) {
            timer.textContent = `${Math.ceil(remaining / 1000)}s`;
        }
        if (remaining <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);
}

function removePowerUpIndicator(type) {
    const indicator = document.getElementById(`powerup-${type}`);
    if (indicator) {
        indicator.style.animation = 'fadeIn 0.3s ease reverse';
        setTimeout(() => indicator.remove(), 300);
    }
}

function addScore(points) {
    const comboMultiplier = Math.min(game.combo, CONFIG.maxCombo);
    const finalPoints = Math.floor(points * comboMultiplier);
    game.score += finalPoints;
    
    // Increase combo
    game.combo++;
    
    // Reset combo timer
    if (game.comboTimer) clearTimeout(game.comboTimer);
    game.comboTimer = setTimeout(() => {
        game.combo = 1;
        updateUI();
    }, CONFIG.comboTimeout);
    
    updateUI();
    
    // Score pop animation
    const scoreEl = document.getElementById('score');
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
}

function updateUI() {
    document.getElementById('score').textContent = game.score.toLocaleString();
    document.getElementById('level').textContent = game.level;
    document.getElementById('combo').textContent = `x${Math.min(game.combo, CONFIG.maxCombo)}`;
    
    const livesContainer = document.getElementById('lives');
    livesContainer.innerHTML = '';
    for (let i = 0; i < CONFIG.initialLives; i++) {
        const life = document.createElement('span');
        life.className = 'life' + (i >= game.lives ? ' lost' : '');
        life.textContent = '❤';
        livesContainer.appendChild(life);
    }
}

function loseLife() {
    game.lives--;
    game.combo = 1;
    updateUI();
    
    // Shake effect
    const wrapper = document.querySelector('.canvas-wrapper');
    wrapper.classList.add('shake');
    setTimeout(() => wrapper.classList.remove('shake'), 500);
    
    if (game.lives <= 0) {
        gameOver();
    } else {
        // Reset ball
        balls = [{
            x: canvas.width / 2,
            y: paddle.y - CONFIG.ballRadius - 5,
            dx: (Math.random() > 0.5 ? 1 : -1) * CONFIG.ballBaseSpeed * 0.7,
            dy: -CONFIG.ballBaseSpeed,
            radius: CONFIG.ballRadius,
            speed: CONFIG.ballBaseSpeed,
            pierce: activePowerUps.pierce
        }];
    }
}

function levelComplete() {
    game.isRunning = false;
    
    // Level bonus
    const bonus = game.level * 1000;
    game.score += bonus;
    updateUI();
    
    document.getElementById('levelBonus').textContent = `+${bonus.toLocaleString()}`;
    document.getElementById('levelClearOverlay').classList.remove('hidden');
    
    // Update high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('breakoutHighScore', game.highScore);
        document.getElementById('highScoreDisplay').textContent = game.highScore;
    }
}

function gameOver() {
    game.isRunning = false;
    
    document.getElementById('finalScore').textContent = game.score.toLocaleString();
    document.getElementById('finalLevel').textContent = game.level;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
    
    // Update high score
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('breakoutHighScore', game.highScore);
        document.getElementById('highScoreDisplay').textContent = game.highScore;
    }
}

// ========== PARTICLE FUNCTIONS ==========
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        
        particles.push({
            x: x,
            y: y,
            dx: Math.cos(angle) * speed,
            dy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 4,
            color: color,
            alpha: 1
        });
    }
}

// ========== DRAWING FUNCTIONS ==========
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawTrails();
    drawBlocks();
    drawPowerUps();
    drawLasers();
    drawBalls();
    drawPaddle();
    drawParticles();
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function drawPaddle() {
    // Paddle glow
    const glowGradient = ctx.createRadialGradient(
        paddle.x + paddle.width / 2, paddle.y + paddle.height / 2, 0,
        paddle.x + paddle.width / 2, paddle.y + paddle.height / 2, paddle.width / 2
    );
    glowGradient.addColorStop(0, 'rgba(79, 172, 254, 0.3)');
    glowGradient.addColorStop(1, 'rgba(79, 172, 254, 0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(paddle.x - 20, paddle.y - 10, paddle.width + 40, paddle.height + 20);
    
    // Paddle body
    const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    
    if (activePowerUps.laser) {
        paddleGradient.addColorStop(0, '#ff9f43');
        paddleGradient.addColorStop(1, '#ee8a32');
    } else if (activePowerUps.widePaddle) {
        paddleGradient.addColorStop(0, '#4ecdc4');
        paddleGradient.addColorStop(1, '#3dbdb4');
    } else if (activePowerUps.narrowPaddle) {
        paddleGradient.addColorStop(0, '#ff6b6b');
        paddleGradient.addColorStop(1, '#ee5a5a');
    } else {
        paddleGradient.addColorStop(0, '#4facfe');
        paddleGradient.addColorStop(1, '#00f2fe');
    }
    
    ctx.fillStyle = paddleGradient;
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 8);
    ctx.fill();
    
    // Laser indicators
    if (activePowerUps.laser) {
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(paddle.x + 10, paddle.y + paddle.height / 2, 4, 0, Math.PI * 2);
        ctx.arc(paddle.x + paddle.width - 10, paddle.y + paddle.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawBalls() {
    balls.forEach(ball => {
        // Ball glow
        const glowGradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius * 3);
        const glowColor = ball.pierce ? 'rgba(165, 94, 234, 0.3)' : 'rgba(79, 172, 254, 0.3)';
        glowGradient.addColorStop(0, glowColor);
        glowGradient.addColorStop(1, 'rgba(79, 172, 254, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball body
        const ballGradient = ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
        );
        
        if (ball.pierce) {
            ballGradient.addColorStop(0, '#d4a5ff');
            ballGradient.addColorStop(1, '#a55eea');
        } else {
            ballGradient.addColorStop(0, '#fff');
            ballGradient.addColorStop(1, '#4facfe');
        }
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawTrails() {
    trails.forEach(trail => {
        ctx.fillStyle = `rgba(79, 172, 254, ${trail.alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBlocks() {
    blocks.forEach(block => {
        // Block shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(block.x + 2, block.y + 2, block.width, block.height, 4);
        ctx.fill();
        
        // Block body
        const blockGradient = ctx.createLinearGradient(block.x, block.y, block.x, block.y + block.height);
        blockGradient.addColorStop(0, block.color);
        blockGradient.addColorStop(1, block.strokeColor);
        
        ctx.fillStyle = blockGradient;
        ctx.beginPath();
        ctx.roundRect(block.x, block.y, block.width, block.height, 4);
        ctx.fill();
        
        // Block highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(block.x + 2, block.y + 2, block.width - 4, block.height / 3, 2);
        ctx.fill();
        
        // Health indicator for multi-hit blocks
        if (block.maxHealth > 1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(block.health.toString(), block.x + block.width / 2, block.y + block.height / 2);
        }
    });
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        const info = POWER_UP_TYPES[powerUp.type];
        
        ctx.save();
        ctx.translate(powerUp.x + CONFIG.powerUpSize / 2, powerUp.y + CONFIG.powerUpSize / 2);
        ctx.rotate(powerUp.rotation);
        
        // Glow
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, CONFIG.powerUpSize);
        glowGradient.addColorStop(0, info.color + '80');
        glowGradient.addColorStop(1, info.color + '00');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.powerUpSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = info.color;
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.powerUpSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Icon
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icon, 0, 0);
        
        ctx.restore();
    });
}

function drawLasers() {
    lasers.forEach(laser => {
        const gradient = ctx.createLinearGradient(laser.x, laser.y, laser.x, laser.y - 20);
        gradient.addColorStop(0, '#ff9f43');
        gradient.addColorStop(1, '#ffeb3b');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(laser.x - 2, laser.y - 20, 4, 20);
        
        // Glow
        ctx.shadowColor = '#ff9f43';
        ctx.shadowBlur = 10;
        ctx.fillRect(laser.x - 2, laser.y - 20, 4, 20);
        ctx.shadowBlur = 0;
    });
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// ========== SOUND FUNCTIONS ==========
function playSound(type) {
    if (!game.soundEnabled) return;
    
    // Web Audio API for sound effects
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch (type) {
            case 'paddle':
                oscillator.frequency.value = 440;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                break;
            case 'wall':
                oscillator.frequency.value = 330;
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                break;
            case 'break':
                oscillator.frequency.value = 660;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                break;
            case 'hit':
                oscillator.frequency.value = 550;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                break;
            case 'powerup':
                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
                break;
            case 'laser':
                oscillator.frequency.value = 1100;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        // Audio not supported
    }
}

// ========== POLYFILL ==========
// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        }
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}

// ========== START ==========
init();
