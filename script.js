const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreValue = document.getElementById('finalScoreValue');

// Device detection
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

// Bird
const bird = {
    x: 0,
    y: 0,
    width: 50,
    height: 50,
    velocity: 0,
    gravity: isMobile ? 400 : 0.6,   // smoother gravity for mobile
    jump: isMobile ? -250 : -10,     // slightly weaker jump for smoother arc
    rotation: 0
};

// Pipes
const pipes = [];
const pipeWidth = 80;
let pipeGap;
const pipeSpeed = isMobile ? 150 : 3; // slower on mobile for smoother motion
let frameCount = 0;

// Ground
const ground = {
    x: 0,
    y: 0,
    height: 80
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

// Draw pipe
function drawPipe(x, topHeight) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, 0, pipeWidth, topHeight);
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, topHeight, pipeWidth, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    const bottomY = topHeight + pipeGap;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x, bottomY, pipeWidth, canvas.height - bottomY - ground.height);
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.ellipse(x + pipeWidth / 2, bottomY, pipeWidth, 40, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Draw ground
function drawGround() {
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    ctx.fillStyle = '#2E7D32';
    ctx.fillRect(0, ground.y, canvas.width, 10);
}

// Draw background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.6, '#98D8C8');
    gradient.addColorStop(1, '#228B22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ----------- UPDATE LOGIC -----------

function updateBirdFrame() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.rotation = bird.velocity < 0 ? -0.3 : Math.min(bird.velocity / 10, Math.PI / 2);
    if (bird.y + bird.height >= ground.y) endGame();
    if (bird.y <= 0) { bird.y = 0; bird.velocity = 0; }
}

function updatePipesFrame() {
    if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - ground.height - 100) + 50;
        pipes.push({ x: canvas.width, topHeight, scored: false });
    }
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        if (bird.x + bird.width > pipes[i].x && bird.x < pipes[i].x + pipeWidth &&
            (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].topHeight + pipeGap)) endGame();
        if (!pipes[i].scored && bird.x > pipes[i].x + pipeWidth) {
            pipes[i].scored = true; score++; scoreDisplay.textContent = score;
        }
        if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
    }
}

// Time-based (for mobiles)
function updateBirdTime(deltaTime) {
    bird.velocity += bird.gravity * deltaTime;
    bird.y += bird.velocity * deltaTime;
    bird.rotation = bird.velocity < 0 ? -0.3 : Math.min(bird.velocity / 500, Math.PI / 2);
    if (bird.y + bird.height >= ground.y) endGame();
    if (bird.y <= 0) { bird.y = 0; bird.velocity = 0; }
}

function updatePipesTime(deltaTime) {
    // fewer pipes for mobile → less frequent spawn
    if (frameCount % 160 === 0) {  
        const topHeight = Math.random() * (canvas.height - pipeGap - ground.height - 100) + 50;
        pipes.push({ x: canvas.width, topHeight, scored: false });
    }
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed * deltaTime;
        if (bird.x + bird.width > pipes[i].x && bird.x < pipes[i].x + pipeWidth &&
            (bird.y < pipes[i].topHeight || bird.y + bird.height > pipes[i].topHeight + pipeGap)) endGame();
        if (!pipes[i].scored && bird.x > pipes[i].x + pipeWidth) {
            pipes[i].scored = true; score++; scoreDisplay.textContent = score;
        }
        if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
    }
}

// ----------- GAME LOOP -----------
let lastTime = 0;
function gameLoop(timestamp) {
    if (!gameRunning) return;

    let deltaTime = 0;
    if (isMobile) {
        if (!lastTime) lastTime = timestamp;
        deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;
    }

    drawBackground();
    drawGround();

    if (isMobile) {
        updateBirdTime(deltaTime);
        updatePipesTime(deltaTime);
    } else {
        updateBirdFrame();
        updatePipesFrame();
    }

    pipes.forEach(pipe => drawPipe(pipe.x, pipe.topHeight));
    drawBird();

    frameCount++;
    requestAnimationFrame(gameLoop);
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
    pipeGap = Math.min(canvas.height * 0.35, 270); // wider gaps for mobile
    gameOverScreen.classList.remove('show');
    lastTime = 0;
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    finalScoreValue.textContent = score;
    gameOverScreen.classList.add('show');
}

function restartGame() {
    startGame();
}

// Controls
function jump() {
    if (gameRunning) bird.velocity = bird.jump;
}
canvas.addEventListener('click', jump);
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

// Initial draw
drawBackground();
drawGround();
drawBird();
