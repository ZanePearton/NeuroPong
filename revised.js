// Import TensorFlow.js library
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

const inputSize = 6; // Number of inputs to the model
const outputSize = 2; // Number of possible actions (move paddle up or down)
const dqnModel = createDQNModel(inputSize, outputSize);

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    console.log("drawRect");
}

function drawBall(x, y, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true);
    ctx.fill();
    console.log("drawBall");
}

async function movePaddles() {
    leftPaddleY = await moveAI(leftPaddleY, ballY, true);
    rightPaddleY = await moveAI(rightPaddleY, ballY, false);
    console.log("movePaddles");
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
    console.log("drawScore");
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
    console.log("displayWinner");
}

function createDQNModel(inputSize, outputSize) {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 128, activation: 'relu', inputShape: [inputSize] }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: outputSize, activation: 'linear' }));
    model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' });
    // console.log(model)
    console.log("createDQNModel");
    return model;
}

class ReplayMemory {
    constructor(capacity) {
      this.capacity = capacity;
      this.buffer = [];
    }
  
    append(state, action, reward, nextState, done) {
      if (this.buffer.length === this.capacity) {
        this.buffer.shift();
      }
      this.buffer.push([state, action, reward, nextState, done]);
    }
  
    sample(batchSize) {
      const indices = tf.util.choice(this.buffer.length, batchSize, false);
      const states = [];
      const actions = [];
      const rewards = [];
      const nextStates = [];
      const dones = [];
      for (let i = 0; i < batchSize; i++) {
        const [state, action, reward, nextState, done] = this.buffer[indices[i]];
        states.push(state);
        actions.push(action);
        rewards.push(reward);
        nextStates.push(nextState);
        dones.push(done);
      }
      return { states: tf.tensor(states), actions: tf.tensor(actions), rewards: tf.tensor(rewards), nextStates: tf.tensor(nextStates), dones: tf.tensor(dones) };
    }
  
    length() {
      return this.buffer.length;
    }
  }
  

// Train the model
async function trainModel() {
    const batchSize = 32;
    const iterations = 10;
    const totalSteps = 10;
    const buffer = new ReplayMemory(totalSteps);

    let episodeReward = 0;
    let lastBallY = ballY;

    for (let i = 0; i < iterations; i++) {
  
        let state = [leftPaddleY, rightPaddleY, ballX, ballY, ballSpeedX, ballSpeedY];
        let action = await chooseAction(state, i);
        let nextState, reward, done;
        for (let j = 0; j < 5; j++) {
            // Move paddles and update ball position
            await movePaddles();
            updateBall();
        }
        // Determine the reward for the current action
        if (leftScore >= 1 || rightScore >= 1) {
            // Game over
            done = true;
            reward = leftScore >= 20 ? 1 : -1;
            leftScore = 0;
            rightScore = 0;
            gameOver = false;
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = 4;
            ballSpeedY = 4;
            leftPaddleY = (canvas.height - paddleHeight) / 2;
            rightPaddleY = (canvas.height - paddleHeight) / 2;
            break;
        } else {
            done = false;
            reward = ballY - lastBallY;
            lastBallY = ballY;
        }

        nextState = [leftPaddleY, rightPaddleY, ballX, ballY, ballSpeedX, ballSpeedY];

        // Add transition to buffer
        buffer.append(state, action, reward, nextState, done);

        // Train the model every batchSize steps
        if (buffer.length() >= batchSize) {
            const batch = buffer.sample(batchSize);
            await trainOnBatch(batch);
            batch.states.dispose();
            batch.actions.dispose();
            batch.rewards.dispose();
            batch.nextStates.dispose();
            batch.dones.dispose();
        }

        // Update the episode reward
        episodeReward += reward;
    }

    console.log(`Total Reward: ${episodeReward}`);
}

async function chooseAction(state, step) {
    const epsilon = Math.max(0.01, 1 - step / 1000);
    if (Math.random() < epsilon) {
        // Choose a random action
        return Math.floor(Math.random() * outputSize);
    } else {
        // Choose the best action
        const input = tf.tensor2d([[...state]]);
        const prediction = dqnModel.predict(input);
        const actionIndex = (await prediction.argMax(-1).data())[0];
        prediction.dispose();
        input.dispose();
        return actionIndex;
    }
}

function updateBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Check if ball hits top or bottom wall
    if (ballY - ballSize < 0 || ballY + ballSize > canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    // Check if ball hits left wall
    if (ballX - ballSize < 0) {
        rightScore++;
        resetBall();
    }

    // Check if ball hits right wall
    if (ballX + ballSize > canvas.width) {
        leftScore++;
        resetBall();
    }

    // Check if ball hits left or right paddle
    if (ballX - ballSize < paddleWidth) {
        if (ballY + ballSize > leftPaddleY && ballY - ballSize < leftPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX * speedIncrease;
            ballSpeedY = ballSpeedY * speedIncrease;
        }
    }

    if (ballX + ballSize > canvas.width - paddleWidth) {
        if (ballY + ballSize > rightPaddleY && ballY - ballSize < rightPaddleY + paddleHeight) {
            ballSpeedX = -ballSpeedX * speedIncrease;
            ballSpeedY = ballSpeedY * speedIncrease;
        }
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 4;
}

async function moveAI(paddleY, ballY, isLeft) {
    if (isLeft) {
        moveLeftPaddleAI();
    } else {
        moveRightPaddleAI();
    }
    return paddleY;
}

async function trainOnBatch(batch) {
    const { states, actions, rewards, nextStates, dones } = batch;
    const targetQs = await getTargetQs(nextStates, rewards, dones);
    const input = tf.tensor2d(states.data);
    const output = dqnModel.predict(input);
    const actionMasks = tf.oneHot(tf.tensor1d(actions.data, 'int32'), output.shape[1]).toFloat();
    const filteredOutput = tf.mul(output, actionMasks);
    const loss = tf.losses.meanSquaredError(targetQs, filteredOutput);
    const optimizer = tf.train.adam(0.001);
    optimizer.minimize(() => loss);
    input.dispose();
    output.dispose();
    actionMasks.dispose();
    filteredOutput.dispose();
    targetQs.dispose();
    loss.dispose();
    console.log(input);
    
}

async function getTargetQs(nextStates, rewards, dones) {
    const input = tf.tensor2d(nextStates.data);
    const output = dqnModel.predict(input);
    const maxOutput = tf.max(output, -1, true);
    const targetQs = tf.mul(rewards, tf.sub(1, dones)).add(tf.mul(0.99, maxOutput));
    input.dispose();
    output.dispose();
    maxOutput.dispose();
    return targetQs;
}
