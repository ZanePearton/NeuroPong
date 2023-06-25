//Variables
const paddleWidth = 10;
const paddleHeight = 100;
const paddleSpeed = 5;
const ballSize = 10;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const maxBallSpeed = 10;
const initialBallSpeed = 4;
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
let trainingStep = 0;
const trainInterval = 100;
const saveModelInterval = 5000;
const bufferSize = 10000;
const batchSize = 64;
const discountFactor = 0.99;

/// SRART tensorflow training-------------------------------------

//Implement the training loop: ncludes a ReplayMemory class to store and sample experience
// This code implements the training loop for the Pong agent using the DQN
// algorithm. It includes a ReplayMemory class to store and sample experiences, 
// as well as functions for choosing and performing actions based on the current 
// state of the game.
// The trainAgent function runs the game using the current model, stores the 
// game states, actions, and rewards in memory, and updates the model using 
// the DQN algorithm based on the stored data.

//Create the neural network model:
function createModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [8] }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 2 }));
    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
    });
    return model;
}
//Preprocess game state data:
function preprocessState(state) {
    return [
        state.leftPaddleY / canvas.height,
        state.rightPaddleY / canvas.height,
        state.ballX / canvas.width,
        state.ballY / canvas.height,
        state.ballSpeedX / maxBallSpeed,
        state.ballSpeedY / maxBallSpeed,
        state.leftScore / 20,
        state.rightScore / 20
    ];
}
//Define the reward function:
function getReward(state, action, nextState) {
    if (nextState.leftScore > state.leftScore) {
        return 1;
    } else if (nextState.rightScore > state.rightScore) {
        return -1;
    } else {
        return 0;
    }
}

// Implement the training loop:
async function trainModel(model, memory, batchSize) {
    const batch = memory.sample(batchSize);
    const states = batch.map(entry => entry.state);
    const actions = batch.map(entry => entry.action);
    const rewards = batch.map(entry => entry.reward);
    const nextStates = batch.map(entry => entry.nextState);
    const stateTensor = tf.tensor(states, [batchSize, 8]);
    const nextStateTensor = tf.tensor(nextStates, [batchSize, 8]);
    const actionTensor = tf.tensor(actions, [batchSize, 1], 'int32');
    const rewardTensor = tf.tensor(rewards, [batchSize, 1]);
    const qValues = model.predict(stateTensor);
    const nextQValues = model.predict(nextStateTensor);
    const targetQValues = qValues.clone();
    for (let i = 0; i < batchSize; i++) {
        const action = actions[i];
        const maxNextQValue = nextQValues
            .slice([i, 0], [1, -1])
            .max()
            .dataSync()[0];

        const targetQValue = rewards[i] + 0.99 * maxNextQValue;

        targetQValues.bufferSync().set(targetQValue, i, action);
    }

    await model.fit(stateTensor, targetQValues, { batchSize, epochs: 1 });
    tf.dispose([stateTensor, nextStateTensor, actionTensor, rewardTensor, qValues, nextQValues, targetQValues]);
}


async function trainAgent() {
    const model = createModel();
    const memory = new ReplayMemory(10000);
    const batchSize = 64;

    let episode = 0;
    while (true) {
        episode++;
        resetGame();

        let state = {
            leftPaddleY: leftPaddleY,
            rightPaddleY: rightPaddleY,
            ballX: ballX,
            ballY: ballY,
            ballSpeedX: ballSpeedX,
            ballSpeedY: ballSpeedY,
            leftScore: leftScore,
            rightScore: rightScore,
        };

        let done = false;

        while (!done) {
            const action = chooseAction(model, preprocessState(state));
            const { nextState, reward, finished } = performAction(action);
            memory.add({
                state: preprocessState(state),
                action: action,
                reward: reward,
                nextState: preprocessState(nextState),
            });

            state = nextState;
            done = finished;

            if (memory.size() >= batchSize) {
                await trainModel(model, memory, batchSize);
            }
        }

        if (episode % 10 === 0) {
            console.log(`Episode ${episode} finished`);
        }
    }
}

function chooseAction(model, state) {
    if (Math.random() < 0.1) {
        return Math.floor(Math.random() * 2); // 10% chance to take a random action
    }
    const stateTensor = tf.tensor([state], [1, 8]);
    const qValues = model.predict(stateTensor);
    const action = qValues.argMax(-1).dataSync()[0];
    tf.dispose([stateTensor, qValues]);

    return action;
}

function performAction(action) {
    let reward = 0;
    let finished = false;
    movePaddles();
    if (action === 0) {
        leftPaddleY -= paddleSpeed;
    } else if (action === 1) {
        leftPaddleY += paddleSpeed;
    }

    const prevState = {
        leftPaddleY: leftPaddleY,
        rightPaddleY: rightPaddleY,
        ballX: ballX,
        ballY: ballY,
        ballSpeedX: ballSpeedX,
        ballSpeedY: ballSpeedY,
        leftScore: leftScore,
        rightScore: rightScore,
    };
    updateBall();
    const nextState = {
        leftPaddleY: leftPaddleY,
        rightPaddleY: rightPaddleY,
        ballX: ballX,
        ballY: ballY,
        ballSpeedX: ballSpeedX,
        ballSpeedY: ballSpeedY,
        leftScore: leftScore,
        rightScore: rightScore,
    };
    reward = getReward(prevState, action, nextState);

    if (leftScore >= 20 || rightScore >= 20) {
        finished = true;
    }
    return { nextState, reward, finished };
}

class ReplayMemory {
    constructor(maxSize) {
        this.buffer = [];
        this.maxSize = maxSize;
    }
    add(entry) {
        if (this.buffer.length >= this.maxSize) {
            this.buffer.shift();
        }this.buffer.push(entry);
    }
    sample(n) {
        const sampleIndices = tf.util.createShuffledIndices(this.buffer.length);
        const samples = [];
        for (let i = 0; i < n; i++) {
            samples.push(this.buffer[sampleIndices[i]]);
        }
        return samples;
    }
    size() {
        return this.buffer.length;
    }
}

function resetGame() {
    leftPaddleY = (canvas.height - paddleHeight) / 2;
    rightPaddleY = (canvas.height - paddleHeight) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -initialBallSpeed;
    ballSpeedY = 0;
    leftScore = 0;
    rightScore = 0;
    gameOver = false;
}

trainAgent();

/// END tensorflow training-------------------------------------



/// START PongGame ----------------------------------------------

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

function drawScore() {
    ctx.font = '48px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(leftScore, canvas.width / 4, 50);
    ctx.fillText(rightScore, (canvas.width / 4) * 3, 50);
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
    if (leftScore >= 20 || rightScore >= 20) {
        gameOver = true;
    }
}
function movePaddles() {
    const leftPaddleCenter = leftPaddleY + paddleHeight / 2;
    const rightPaddleCenter = rightPaddleY + paddleHeight / 2;
    if (leftPaddleCenter < ballY - 35) {
        leftPaddleY += paddleSpeed;
    } else if (leftPaddleCenter > ballY + 35) {
        leftPaddleY -= paddleSpeed;
    }

    if (rightPaddleCenter < ballY - 35) {
        rightPaddleY += paddleSpeed;
    } else if (rightPaddleCenter > ballY + 35) {
        rightPaddleY -= paddleSpeed;
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

gameLoop();


/// END PongGame ----------------------------------------------
