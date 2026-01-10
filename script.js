const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');

const world = {
    width: canvas.width,
    height: canvas.height,
    gravity: 0.05,
    starRate: 120,
    meteorRate: 150
};

const player = {
    x: world.width / 2 - 20,
    y: world.height - 70,
    width: 40,
    height: 40,
    speed: 4.2,
    color: '#6ee7ff'
};

let stars = [];
let meteors = [];
let keys = {};
let score = 0;
let lives = 3;
let level = 1;
let frame = 0;
let running = false;
let paused = false;

const spawnStar = () => {
    const size = 14 + Math.random() * 10;
    stars.push({
        x: Math.random() * (world.width - size),
        y: -size,
        size,
        speed: 1.6 + Math.random() * 1.4 + level * 0.2
    });
};

const spawnMeteor = () => {
    const size = 22 + Math.random() * 16;
    meteors.push({
        x: Math.random() * (world.width - size),
        y: -size,
        size,
        speed: 2 + Math.random() * 1.5 + level * 0.25
    });
};

const resetGame = () => {
    stars = [];
    meteors = [];
    score = 0;
    lives = 3;
    level = 1;
    frame = 0;
    player.x = world.width / 2 - player.width / 2;
    player.y = world.height - 70;
    updateHud();
};

const updateHud = () => {
    scoreEl.textContent = score;
    livesEl.textContent = lives;
    levelEl.textContent = level;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const checkCollision = (a, b) => {
    return (
        a.x < b.x + b.size &&
        a.x + a.width > b.x &&
        a.y < b.y + b.size &&
        a.y + a.height > b.y
    );
};

const updatePlayer = () => {
    const directionX = (keys['ArrowRight'] || keys['d'] ? 1 : 0) - (keys['ArrowLeft'] || keys['a'] ? 1 : 0);
    const directionY = (keys['ArrowDown'] || keys['s'] ? 1 : 0) - (keys['ArrowUp'] || keys['w'] ? 1 : 0);

    player.x += directionX * player.speed;
    player.y += directionY * player.speed;

    player.x = clamp(player.x, 0, world.width - player.width);
    player.y = clamp(player.y, 0, world.height - player.height);
};

const updateEntities = () => {
    stars.forEach((star) => {
        star.y += star.speed;
    });

    meteors.forEach((meteor) => {
        meteor.y += meteor.speed;
    });

    stars = stars.filter((star) => star.y < world.height + star.size);
    meteors = meteors.filter((meteor) => meteor.y < world.height + meteor.size);
};

const resolveCollisions = () => {
    stars = stars.filter((star) => {
        if (checkCollision(player, star)) {
            score += 10;
            if (score % 100 === 0) {
                level += 1;
            }
            updateHud();
            return false;
        }
        return true;
    });

    meteors = meteors.filter((meteor) => {
        if (checkCollision(player, meteor)) {
            lives -= 1;
            updateHud();
            if (lives <= 0) {
                endGame();
            }
            return false;
        }
        return true;
    });
};

const drawBackground = () => {
    ctx.clearRect(0, 0, world.width, world.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let i = 0; i < 40; i += 1) {
        ctx.beginPath();
        const x = (i * 89 + frame * 0.5) % world.width;
        const y = (i * 37 + frame * 0.3) % world.height;
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
};

const drawPlayer = () => {
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.shadowColor = 'rgba(110, 231, 255, 0.8)';
    ctx.shadowBlur = 12;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.restore();
};

const drawStars = () => {
    ctx.fillStyle = '#facc15';
    stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x + star.size / 2, star.y + star.size / 2, star.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });
};

const drawMeteors = () => {
    ctx.fillStyle = '#f87171';
    meteors.forEach((meteor) => {
        ctx.beginPath();
        ctx.arc(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2, meteor.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });
};

const gameLoop = () => {
    if (!running) {
        return;
    }

    if (!paused) {
        frame += 1;
        if (frame % Math.max(30, world.starRate - level * 6) === 0) {
            spawnStar();
        }
        if (frame % Math.max(45, world.meteorRate - level * 5) === 0) {
            spawnMeteor();
        }

        updatePlayer();
        updateEntities();
        resolveCollisions();
    }

    drawBackground();
    drawStars();
    drawMeteors();
    drawPlayer();

    if (paused) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.fillRect(0, 0, world.width, world.height);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '28px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pausa', world.width / 2, world.height / 2);
    }

    requestAnimationFrame(gameLoop);
};

const startGame = () => {
    resetGame();
    running = true;
    paused = false;
    overlay.classList.add('hidden');
    startBtn.textContent = 'Reiniciar partida';
    startBtn.disabled = false;
    requestAnimationFrame(gameLoop);
};

const endGame = () => {
    running = false;
    overlay.classList.remove('hidden');
    overlay.innerHTML = `
        <h2>¡Juego terminado!</h2>
        <p>Tu puntuación final fue <strong>${score}</strong>.</p>
        <p>Presiona iniciar para intentarlo de nuevo.</p>
    `;
};

startBtn.addEventListener('click', () => {
    if (!running) {
        startGame();
    } else {
        startGame();
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        if (running) {
            paused = !paused;
        }
        return;
    }
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

window.addEventListener('blur', () => {
    keys = {};
});
