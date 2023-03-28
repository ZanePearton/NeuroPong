const paddleWidth = 10;
const paddleHeight = 100;
const paddleSpeed = 5;
const ballSize = 10;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedIncrease = 2;
let leftScore = 0;
let rightScore = 0;
let gameOver = false;
let leftPaddleY = (canvas.height - paddleHeight) / 2;
let rightPaddleY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 14;
let ballSpeedY = 14;

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true);
    ctx.fill();
}

function moveLeftPaddleAI() {
    const paddleCenter = leftPaddleY + paddleHeight / 2;

    if (paddleCenter < ballY - 35) {
        leftPaddleY += paddleSpeed;
    } else if (paddleCenter > ballY + 35) {
        leftPaddleY -= paddleSpeed;
    }
}

function moveRightPaddleAI() {

    const paddleCenter = rightPaddleY + paddleHeight / 2;
    if (paddleCenter < ballY - 35) {
        rightPaddleY += paddleSpeed;
    } else if (paddleCenter > ballY + 35) {
        rightPaddleY -= paddleSpeed;
    }
}

function drawScore() {
    ctx.font = '48px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(leftScore, canvas.width / 4, 50);
    ctx.fillText(rightScore, (canvas.width / 4) * 3, 50);
}

function displayWinner(winner) {
    ctx.font = '48px monospace';
    const h3 = document.createElement('h3');
    h3.textContent = `${winner} WINS`;
    h3.style.position = 'absolute';
    h3.style.left = '50%';
    h3.style.top = '50%';
    h3.style.transform = 'translate(-50%, -50%)';
    h3.style.color = 'pink';
    h3.style.font = '48px monospace';
    h3.style.textAlign = 'center';
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.appendChild(h3);
}
function updateBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
    }
    if (ballX < 0) {
        rightScore++;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
    } else if (ballX > canvas.width) {
        leftScore++;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX;
    }
    if (ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
        ballSpeedX = -(Math.abs(ballSpeedX) + speedIncrease);
        ballSpeedY += ballSpeedY < 0 ? -speedIncrease : speedIncrease;
    }
    if (ballX > canvas.width - paddleWidth * 2 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX) + speedIncrease;
        ballSpeedY += ballSpeedY < 0 ? -speedIncrease : speedIncrease;
    }
    if (leftScore >= 3 || rightScore >= 3) {
        gameOver = true;
        const winner = leftScore >= 3 ? 'LEFT ' : 'RIGHT ';
        displayWinner(winner);
    }

}

function gameLoop() {
    if (gameOver) {
        return;
    }
    drawRect(0, 0, canvas.width, canvas.height, 'black');
    movePaddles();
    updateBall();
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, 'white');
    drawRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, 'white');
    drawBall(ballX, ballY, ballSize, 'white');
    drawScore();
    requestAnimationFrame(gameLoop);
}

function moveAI(paddleY, ballY) {
    const paddleCenter = paddleY + paddleHeight / 2;

    if (paddleCenter < ballY - 35) {
        paddleY += paddleSpeed;
    } else if (paddleCenter > ballY + 35) {
        paddleY -= paddleSpeed;
    }

    return paddleY;
}

function movePaddles() {
    leftPaddleY = moveAI(leftPaddleY, ballY);
    rightPaddleY = moveAI(rightPaddleY, ballY);
}

gameLoop();