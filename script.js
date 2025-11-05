const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreValue = document.getElementById('finalScoreValue');

// Detect mobile
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Set canvas to full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameStarted = false;
let gameRunning = false;
let score = 0;

// Bird properties (scaled for full screen)
const bird = {
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: 0.6,
    jump: -10,
    rotation: 0
};

// Pipe properties (scaled for full screen)
const pipes = [];
const pipeWidth = 80;
const pipeGap = Math.min(canvas.height * 0.3, 250);
const pipeSpeed = 3;
let frameCount = 0;

// Ground (scaled for full screen)
const ground = {
    x: 0,
    y: canvas.height - 80,
    height: 80,
    speed: 3
};

// Draw bird
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    ctx.rotate(bird.rotation);
    ctx.beginPath();
    ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4444';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, 5, bird.width / 3, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, -2);
    ctx.lineTo(25, 2);
    ctx.closePath();
    ctx.fillStyle = '#FFA500';
    ctx.fill();
    ctx.restore();
}

// Draw tree pipe
function drawPipe(x, topHeight) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, 0, pipeWidth, topHeight);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 0; i < topHeight; i += 15) {
        ctx.beginPath();
        ctx.moveTo(x + 10, i);
        ctx.lineTo(x + pipeWidth - 10, i + 10);
        ctx.stroke();
    }
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, topHeight, pipeWidth, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, topHeight - 10, pipeWidth * 0.8, 35, 0, 0, Math.PI * 2);
    ctx.fill();

    const bottomY = topHeight + pipeGap;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, bottomY, pipeWidth, canvas.height - bottomY - ground.height);
    for (let i = bottomY; i < canvas.height - ground.height; i += 15) {
        ctx.beginPath();
        ctx.moveTo(x + 10, i);
        ctx.lineTo(x + pipeWidth - 10, i + 10);
        ctx.stroke();
    }
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, bottomY, pipeWidth, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2E7D32';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, bottomY + 10, pipeWidth * 0.8, 35, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Draw ground
function drawGround() {
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0, ground.y, canvas.width, 10);
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(i, ground.y + 10);
        ctx.lineTo(i + 10, ground.y + 20);
        ctx.stroke();
    }
}

// Draw background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#98D8C8');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(100 + (frameCount * 0.2) % (canvas.width + 200), 80, 30, 0, Math.PI * 2);
    ctx.arc(130 + (frameCount * 0.2) % (canvas.width + 200), 80, 40, 0, Math.PI * 2);
    ctx.arc(160 + (frameCount * 0.2) % (canvas.width + 200), 80, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(250 + (frameCount * 0.15) % (canvas.width + 200), 150, 35, 0, Math.PI * 2);
    ctx.arc(285 + (frameCount * 0.15) % (canvas.width + 200), 150, 45, 0, Math.PI * 2);
    ctx.arc(320 + (frameCount * 0.15) % (canvas.width + 200), 150, 35, 0, Math.PI * 2);
    ctx.fill();
}

// 🕒 Added deltaTime for mobile
let lastTime = 0;
function gameLoop(timestamp) {
    if (!gameRunning) return;

    let deltaTime = 1; // default (for PC)
    if (isMobile) {
        if (!lastTime) lastTime = timestamp;
        deltaTime = (timestamp - lastTime) / (1000 / 60); // normalize to ~60fps
        lastTime = timestamp;
    }

    drawBackground();
    drawGround();

    updateBird(deltaTime);
    updatePipes(deltaTime);

    pipes.forEach(pipe => drawPipe(pipe.x, pipe.topHeight));
    drawBird();

    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Update bird (uses deltaTime only for mobile)
function updateBird(deltaTime = 1) {
    bird.velocity += bird.gravity * deltaTime;
    bird.y += bird.velocity * deltaTime;

    if (bird.velocity < 0) bird.rotation = -0.3;
    else bird.rotation = Math.min(bird.velocity / 10, Math.PI / 2);

    if (bird.y + bird.height >= ground.y) endGame();
    if (bird.y <= 0) { bird.y = 0; bird.velocity = 0; }
}

// Update pipes (uses deltaTime only for mobile)
function updatePipes(deltaTime = 1) {
    if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - ground.height - 100) + 50;
        pipes.push({ x: canvas.width, topHeight, scored: false });
    }

    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed * deltaTime;

        if (bird.x + bird.width > pipes[i].x && bird.x < pipes[i].x + pipeWidth) {
            if (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].topHeight + pipeGap) endGame();
        }

        if (!pipes[i].scored && bird.x > pipes[i].x + pipeWidth) {
            pipes[i].scored = true;
            score++;
            scoreDisplay.textContent = score;
        }

        if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
    }
}

// Start game
function startGame() {
    resizeCanvas();
    startScreen.classList.add('hidden');
    gameStarted = true;
    gameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    bird.x = canvas.width * 0.2;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    frameCount = 0;
    ground.y = canvas.height - 80;
    gameOverScreen.classList.remove('show');
    lastTime = 0; // reset mobile timer
    requestAnimationFrame(gameLoop);
}

// End / Restart / Controls (unchanged)
function endGame() {
    gameRunning = false;
    finalScoreValue.textContent = score;
    gameOverScreen.classList.add('show');
}
function restartGame() { startGame(); }
function jump() { if (gameRunning) bird.velocity = bird.jump; }
canvas.addEventListener('click', jump);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); jump(); }
});

// Initial draw
drawBackground();
drawGround();
drawBird();
