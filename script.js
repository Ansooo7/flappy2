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
    // support high-DPI devices for crisper rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let gameStarted = false;
let gameRunning = false;
let score = 0;
let hitPlayed = false;

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
// wing flap state for nicer animation
bird.wingFlap = 0;

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
    // soft shadow below the bird
    ctx.save();
    ctx.translate(0, bird.height / 2 + 6);
    ctx.scale(1, 0.35);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.arc(0, 0, bird.width / 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // body
    ctx.beginPath();
    ctx.arc(0, 0, bird.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6B4A';
    ctx.fill();

    // cheek/face highlight
    ctx.beginPath();
    ctx.arc(-6, 2, bird.width / 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fill();

    // eye
    ctx.beginPath();
    ctx.arc(8, -6, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -6, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();

    // beak
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(24, -4);
    ctx.lineTo(24, 6);
    ctx.closePath();
    ctx.fillStyle = '#FFB347';
    ctx.fill();

    // wing (flapping)
    const wingAngle = Math.sin(bird.wingFlap) * 0.9; // flap speed
    ctx.save();
    ctx.translate(-6, 2);
    ctx.rotate(wingAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-24, -8, -32, 6);
    ctx.quadraticCurveTo(-18, 14, 0, 2);
    ctx.fillStyle = '#E65A3B';
    ctx.fill();
    ctx.restore();
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
    // sunset sky gradient (warm tones)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#FF7E5F');   // warm coral
    gradient.addColorStop(0.55, '#FFB86B'); // golden orange
    gradient.addColorStop(1, '#1F3414');   // deep jungle silhouette near horizon
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // glowing sun (lower on horizon)
    const sunX = canvas.width * 0.78 - (frameCount * 0.12 % 120);
    const sunY = canvas.height * 0.42;
    const sunRadius = Math.max(48, Math.min(90, canvas.width * 0.06));
    const rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.2);
    rg.addColorStop(0, 'rgba(255,235,140,0.95)');
    rg.addColorStop(0.35, 'rgba(255,165,60,0.65)');
    rg.addColorStop(1, 'rgba(255,120,50,0.0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // distant tree layer (dark silhouettes for sunset)
    for (let i = 0; i < 7; i++) {
        const speed = 0.18 + i * 0.06;
        const treeX = ((i * 260) - (frameCount * speed)) % (canvas.width + 340) - 170;
        const treeBase = canvas.height - ground.height - 30 - i * 4;
        // trunk (thin dark silhouette)
        ctx.fillStyle = '#07180b';
        ctx.fillRect(treeX + 26, treeBase - 78, 12, 78);
        // foliage (simple triangular silhouette)
        ctx.beginPath();
        ctx.fillStyle = '#07180b';
        ctx.moveTo(treeX + 6, treeBase - 78);
        ctx.lineTo(treeX + 56, treeBase - 78);
        ctx.lineTo(treeX + 32, treeBase - 140);
        ctx.closePath();
        ctx.fill();
    }

    // soft pink/purple clouds (reflecting sunset)
    for (let i = 0; i < 5; i++) {
        const cx = (i * 260 + (frameCount * 0.28 * (i + 1))) % (canvas.width + 240) - 120;
        const cy = 60 + i * 28 - (i % 2) * 10;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,220,210,0.92)' : 'rgba(255,190,200,0.88)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, 68, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 44, cy + 8, 54, 20, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ----------- UPDATE LOGIC -----------

function updateBirdFrame() {
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    bird.wingFlap += 0.5;
    bird.rotation = bird.velocity < 0 ? -0.45 : Math.min(bird.velocity / 12, Math.PI / 2);
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
    bird.velocity += bird.gravity * deltaTime * 60; // bring to similar scale as frame-based logic
    bird.y += bird.velocity * deltaTime;
    bird.wingFlap += 8 * deltaTime;
    bird.rotation = bird.velocity < 0 ? -0.45 : Math.min(bird.velocity / 500, Math.PI / 2);
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
    bird.wingFlap = 0;
    hitPlayed = false;

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
    // play hit sound once
    if (!hitPlayed) { playHitSound(); hitPlayed = true; }
}

function restartGame() {
    startGame();
}

// Controls
function jump() {
    if (gameRunning) bird.velocity = bird.jump;
    // resume audio context on user gesture and play jump sound
    try { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    playJumpSound();
}
canvas.addEventListener('click', jump);
// on-screen tap area for mobile
const tapZone = document.getElementById('tapZone');
if (tapZone) {
    tapZone.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
}
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

// -------------------- Audio (WebAudio synthesized sounds) --------------------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function playJumpSound() {
    try {
        ensureAudio();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(550, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.12);
        g.gain.setValueAtTime(0, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + 0.3);
    } catch (e) { /* ignore audio errors */ }
}

function playHitSound() {
    try {
        ensureAudio();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(120, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
        g.gain.setValueAtTime(0.18, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + 0.7);
    } catch (e) { /* ignore audio errors */ }
}

// Ensure the audio context is created only after a user gesture on start screen for autoplay policies
document.addEventListener('keydown', () => { try { ensureAudio(); } catch (e) {} }, { once: true });
canvas.addEventListener('touchstart', () => { try { ensureAudio(); } catch (e) {} }, { once: true });
