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

function movePaddles() {
  moveLeftPaddleAI();
  moveRightPaddleAI();
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

// Add a function to draw the score
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

// Update the updateBall function to increase ball speed
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
  
  if (leftScore >= 112 || rightScore >= 2) {
    gameOver = true;
    const winner = leftScore >= 20 ? 'Left Player' : 'Right Player';
    displayWinner(winner);
  }
}

// Update the gameLoop function to include drawing the score
function gameLoop() {
  if (gameOver) {
    return;
  }
  // Clear canvas
  drawRect(0, 0, canvas.width, canvas.height, 'black');

  // Move paddles
  movePaddles();

  // Update ball
  updateBall();

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
  // Move left paddle
  leftPaddleY = moveAI(leftPaddleY, ballY);

  // Move right paddle
  rightPaddleY = moveAI(rightPaddleY, ballY);
}

// Start the game loop
gameLoop();