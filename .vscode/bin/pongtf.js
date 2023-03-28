// Import TensorFlow.js library
// import * as tf from '@tensorflow/tfjs';

const tf = window.tf;
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
let ballSpeedX = 4;
let ballSpeedY = 4;

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

async function movePaddles() {
    leftPaddleY = await moveAI(leftPaddleY, ballY, true);
    rightPaddleY = await moveAI(rightPaddleY, ballY, false);
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
    const h3 = document.createElement('h3');
    h3.textContent = `${winner} wins!`;
    h3.style.position = 'absolute';
    h3.style.left = '50%';
    h3.style.top = '50%';
    h3.style.transform = 'translate(-50%, -50%)';
    h3.style.color = 'white';
    h3.style.fontFamily = 'Arial, sans-serif';
    h3.style.textAlign = 'center';
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.appendChild(h3);
}

function createDQNModel(inputSize, outputSize) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputSize] }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: outputSize, activation: 'linear' }));
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    console.log(model)
    return model;
}

const inputSize = 6; // [leftPaddleY, rightPaddleY, ballX, ballY, ballSpeedX, ballSpeedY]
const outputSize = 3; // [-paddleSpeed, 0, paddleSpeed]
const dqnModel = createDQNModel(inputSize, outputSize);

async function moveAI(paddleY, ballY, isLeftPaddle) {
    const input = tf.tensor2d([[isLeftPaddle ? 1 : 0, paddleY, ballY, ballX, ballSpeedX, ballSpeedY]]);
    const prediction = dqnModel.predict(input);
    const actionIndex = (await prediction.argMax(-1).data())[0];
    prediction.dispose();
    input.dispose();

    if (actionIndex === 0) {
        paddleY -= paddleSpeed;
    } else if (actionIndex === 2) {
        paddleY += paddleSpeed;
    }
    return paddleY;
}



function updateBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    if (ballX < 0) {
        // Right player scores
        rightScore++;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX; // Reverse ball speed on x-axis
    } else if (ballX > canvas.width) {
        // Left player scores
        leftScore++;
        ballX = canvas.width / 2;
        ballY = canvas.height / 2;
        ballSpeedX = -ballSpeedX; // Reverse ball speed on x-axis
    }

    if (ballX < paddleWidth && ballY > leftPaddleY && ballY < leftPaddleY + paddleHeight) {
        ballSpeedX = -(Math.abs(ballSpeedX) + speedIncrease); // Reverse ball speed on x-axis and increase it
        ballSpeedY += ballSpeedY < 0 ? -speedIncrease : speedIncrease; // Increase ball speed on y-axis
    }

    if (ballX > canvas.width - paddleWidth * 2 && ballY > rightPaddleY && ballY < rightPaddleY + paddleHeight) {
        ballSpeedX = Math.abs(ballSpeedX) + speedIncrease; // Reverse ball speed on x-axis and increase it
        ballSpeedY += ballSpeedY < 0 ? -speedIncrease : speedIncrease; // Increase ball speed on y-axis
    }

    if (leftScore >= 1 || rightScore >= 1) {
        gameOver = true;
        const winner = leftScore >= 20 ? 'Left Player' : 'Right Player';
        displayWinner(winner);
    }
}

async function gameLoop() {
    if (gameOver) {
        return;
    }

    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, 'black');

    // Move paddles
    await movePaddles();
    console.log(movePaddles)

    // Update ball
    updateBall();
    console.log(updateBall);

    // Draw paddles
    drawRect(0, leftPaddleY, paddleWidth, paddleHeight, 'white');
    drawRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight, 'white');

    // Draw ball
    drawBall(ballX, ballY, ballSize, 'white');

    // Draw score
    drawScore();

    // Call game loop again
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
