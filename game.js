const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 5,
    dx: 0,
    hp: 3,
    canShoot: true,
    shootCooldown: 500
};

const invader = {
    x: 50,
    y: 30,
    width: 40,
    height: 40,
    speed: 2,
    dx: 2,
    dy: 20
};

const bullet = {
    width: 5,
    height: 10,
    speed: 5
};

let playerBullets = [];
let enemyBullets = [];
let gameOver = false;
let gameWin = false;
let level = 1;
let state = 'home'; // 'home', 'playing', 'rules', 'controls', 'gameover'

const invaders = [];
const rows = 3;
const cols = 8;

function initInvaders() {
    invaders.length = 0;
    for (let row = 0; row < rows; row++) {
        invaders[row] = [];
        for (let col = 0; col < cols; col++) {
            invaders[row][col] = {
                x: col * (invader.width + 10) + 30,
                y: row * (invader.height + 10) + 30,
                width: invader.width,
                height: invader.height,
                dx: invader.dx,
                dy: invader.dy,
                alive: true
            };
        }
    }
}

const barriers = [
    { x: 100, y: canvas.height - 150, width: 60, height: 20, health: 4 },
    { x: 300, y: canvas.height - 150, width: 60, height: 20, health: 4 },
    { x: 500, y: canvas.height - 150, width: 60, height: 20, health: 4 },
    { x: 700, y: canvas.height - 150, width: 60, height: 20, health: 4 }
];

function drawPlayer() {
    ctx.fillStyle = "green";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawInvaders() {
    invaders.forEach(row => {
        row.forEach(inv => {
            if (inv.alive) {
                ctx.fillStyle = "red";
                ctx.fillRect(inv.x, inv.y, inv.width, inv.height);
            }
        });
    });
}

function drawBullets() {
    ctx.fillStyle = "white";
    playerBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    ctx.fillStyle = "yellow";
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function drawBarriers() {
    barriers.forEach(barrier => {
        if (barrier.health > 0) {
            ctx.fillStyle = `rgba(0, 255, 0, ${barrier.health / 4})`;
            ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
        }
    });
}

function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("HP: " + player.hp, 10, 20);
    ctx.fillText("Level: " + level, 10, 40);
}

function movePlayer() {
    player.x += player.dx;

    if (player.x < 0) {
        player.x = 0;
    }

    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
    }
}

function moveInvaders() {
    let changeDirection = false;
    invaders.forEach(row => {
        row.forEach(inv => {
            if (inv.alive) {
                inv.x += inv.dx;

                if (inv.x + inv.width > canvas.width || inv.x < 0) {
                    changeDirection = true;
                }
            }
        });
    });

    if (changeDirection) {
        invaders.forEach(row => {
            row.forEach(inv => {
                inv.dx *= -1;
                inv.y += inv.dy;
            });
        });
    }

    invaders.forEach(row => {
        row.forEach((inv) => {
            if (inv.alive) {
                if (Math.random() < 0.001) { // 確率を0.001に設定
                    enemyBullets.push({
                        x: inv.x + inv.width / 2 - bullet.width / 2,
                        y: inv.y + inv.height,
                        width: bullet.width,
                        height: bullet.height,
                        speed: bullet.speed
                    });
                }
            }
        });
    });
}

function moveBullets() {
    playerBullets.forEach(bullet => {
        bullet.y -= bullet.speed;
    });

    enemyBullets.forEach(bullet => {
        bullet.y += bullet.speed;
    });

    playerBullets = playerBullets.filter(bullet => bullet.y > 0);
    enemyBullets = enemyBullets.filter(bullet => bullet.y < canvas.height);
}

function collisionDetection() {
    playerBullets.forEach((bullet, bulletIndex) => {
        invaders.forEach(row => {
            row.forEach(inv => {
                if (inv.alive && bullet.x < inv.x + inv.width && bullet.x + bullet.width > inv.x && bullet.y < inv.y + inv.height && bullet.y + bullet.height > inv.y) {
                    inv.alive = false;
                    playerBullets.splice(bulletIndex, 1);
                }
            });
        });

        barriers.forEach(barrier => {
            if (barrier.health > 0 && bullet.x < barrier.x + barrier.width && bullet.x + bullet.width > barrier.x && bullet.y < barrier.y + barrier.height && bullet.y + bullet.height > barrier.y) {
                barrier.health -= 1;
                playerBullets.splice(bulletIndex, 1);
            }
        });
    });

    enemyBullets.forEach((bullet, bulletIndex) => {
        if (bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
            player.hp -= 1;
            enemyBullets.splice(bulletIndex, 1);
            if (player.hp <= 0) {
                gameOver = true;
                state = 'gameover';
                updateScreen();
            }
        }

        barriers.forEach(barrier => {
            if (barrier.health > 0 && bullet.x < barrier.x + barrier.width && bullet.x + bullet.width > barrier.x && bullet.y < barrier.y + barrier.height && bullet.y + bullet.height > barrier.y) {
                barrier.health -= 1;
                enemyBullets.splice(bulletIndex, 1);
            }
        });
    });

    invaders.forEach(row => {
        row.forEach(inv => {
            if (inv.alive && inv.y + inv.height > canvas.height - 150) {
                gameOver = true;
                state = 'gameover';
                updateScreen();
            }
        });
    });

    if (invaders.flat().every(inv => !inv.alive)) {
        gameWin = true;
        state = 'levelcomplete';
        setTimeout(() => {
            level++;
            initInvaders();
            playerBullets = [];
            enemyBullets = [];
            player.hp = 3;
            gameWin = false;
            state = 'playing';
            updateScreen();
            update();
        }, 2000);
    }
}

function update() {
    if (state !== 'playing') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPlayer();
    drawInvaders();
    drawBullets();
    drawBarriers();
    drawHUD();

    movePlayer();
    moveInvaders();
    moveBullets();

    collisionDetection();

    requestAnimationFrame(update);
}

function keyDown(e) {
    if (state === 'home' && e.key === "Enter") {
        startGame();
    } else if (state === 'playing') {
        if (e.key === "ArrowRight" || e.key === "Right") {
            player.dx = player.speed;
        } else if (e.key === "ArrowLeft" || e.key === "Left") {
            player.dx = -player.speed;
        } else if (e.key === " " || e.key === "Spacebar") {
            if (player.canShoot) {
                playerBullets.push({
                    x: player.x + player.width / 2 - bullet.width / 2,
                    y: player.y,
                    width: bullet.width,
                    height: bullet.height,
                    speed: bullet.speed
                });
                player.canShoot = false;
                setTimeout(() => {
                    player.canShoot = true;
                }, player.shootCooldown);
            }
        }
    }
}

function keyUp(e) {
    if (e.key === "ArrowRight" || e.key === "Right" || e.key === "ArrowLeft" || e.key === "Left") {
        player.dx = 0;
    }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

function startGame() {
    state = 'playing';
    gameOver = false;
    gameWin = false;
    player.hp = 3;
    playerBullets = [];
    enemyBullets = [];
    level = 1;
    initInvaders();
    updateScreen();
    update();
}

document.getElementById("rulesButton").addEventListener("click", () => {
    state = 'rules';
    updateScreen();
});

document.getElementById("controlsButton").addEventListener("click", () => {
    state = 'controls';
    updateScreen();
});

document.getElementById("backButton1").addEventListener("click", () => {
    state = 'home';
    updateScreen();
});

document.getElementById("backButton2").addEventListener("click", () => {
    state = 'home';
    updateScreen();
});

document.getElementById("retryButton").addEventListener("click", () => {
    state = 'playing';
    gameOver = false;
    player.hp = 3;
    initInvaders();
    playerBullets = [];
    enemyBullets = [];
    updateScreen();
    update();
});

document.getElementById("homeButton").addEventListener("click", () => {
    state = 'home';
    player.hp = 3;
    gameOver = false;
    playerBullets = [];
    enemyBullets = [];
    initInvaders();
    updateScreen();
});

function updateScreen() {
    document.getElementById("startScreen").style.display = state === 'home' ? 'flex' : 'none';
    document.getElementById("rulesScreen").style.display = state === 'rules' ? 'flex' : 'none';
    document.getElementById("controlsScreen").style.display = state === 'controls' ? 'flex' : 'none';
    document.getElementById("gameCanvas").style.display = state === 'playing' ? 'block' : 'none';
    document.getElementById("gameOverScreen").style.display = state === 'gameover' ? 'flex' : 'none';
}
