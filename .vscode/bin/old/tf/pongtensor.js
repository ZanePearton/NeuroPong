// initial model definition
var model = tf.sequential();
model.add(tf.layers.dense({units: 256, inputShape: [8]})); //input is a 1x8
model.add(tf.layers.dense({units: 512, inputShape: [256], activation:"sigmoid"}));
model.add(tf.layers.dense({units: 256, inputShape: [512], activation:"sigmoid"}));
model.add(tf.layers.dense({units: 3, inputShape: [256]})); //returns a 1x3
var learningRate = 0.001;
var optimizer = tf.train.adam(learningRate);
model.compile({loss: 'meanSquaredError', optimizer: optimizer});

//animation of the pong game code
var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60)
    };

// variables for pong game.
var canvas = document.createElement("canvas");
var width = 1400;
var height = 600;
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext('2d');
var player = new Player();
var computer = new Computer();
var ball = new Ball(200, 300);
var ai = new AI();
var keysDown = {};
let leftScore = 0;
let rightScore = 0;

//from pong code:
var renderGame = function () {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    player.renderGame();
    computer.renderGame();
    ball.renderGame();   
    drawScore() 
};

// Add a function to draw the score
function drawScore() {
    ctx.font = '48px monospace';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(leftScore, canvas.width / 4, 50);
    ctx.fillText(rightScore, (canvas.width / 4) * 3, 50);
}

//from pong code:
var update = function () {
    player.update();
      // Draw score
    if(computer.ai_plays){
        move = ai.predict_move();
        computer.ai_update(move);
    }else
        computer.update(ball);
    ball.update(player.paddle, computer.paddle);
    ai.save_data(player.paddle, computer.paddle, ball)
};

//from pong code:
var step = function () {
    update();
    
    renderGame();
    animate(step);
};

//from pong code:
function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.x_speed = 0;
    this.y_speed = 0;
}


//from pong code:
Paddle.prototype.renderGame = function () {
    ctx.fillStyle = "#59a6ff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
};

//from pong code:
Paddle.prototype.move = function (x, y) {
    this.x += x;
    this.y += y;
    this.x_speed = x;
    this.y_speed = y;
    if (this.x < 0) {
        this.x = 0;
        this.x_speed = 0;
    } else if (this.x + this.width > 400) {
        this.x = 400 - this.width;
        this.x_speed = 0;
    }
};

//from pong code:
function Computer() {
    this.paddle = new Paddle(175, 10, 50, 10);
    this.ai_plays = false;
}

//from pong code:
Computer.prototype.renderGame = function () {
    this.paddle.renderGame();
};

//from pong code:
Computer.prototype.update = function (ball) {
    var x_pos = ball.x;
    var diff = -((this.paddle.x + (this.paddle.width / 2)) - x_pos);
    if (diff < 0 && diff < -4) {
        diff = -5;
    } else if (diff > 0 && diff > 4) {
        diff = 5;
    }
    this.paddle.move(diff, 0);
    if (this.paddle.x < 0) {
        this.paddle.x = 0;
    } else if (this.paddle.x + this.paddle.width > 400) {
        this.paddle.x = 400 - this.paddle.width;
    }
};

// Custom code. Depending on what
// move passed here, we move the computer 4x.
// Network output is either -1, 0, or 1 (left, stay, right)
Computer.prototype.ai_update = function (move = 0) {
    this.paddle.move(4 * move, 0);
};

//from pong code:
function Player() {
    this.paddle = new Paddle(175, 580, 50, 10);
}

//from pong code:
Player.prototype.renderGame = function () {
    this.paddle.renderGame();
};

//from pong code:
Player.prototype.update = function () {
    for (var key in keysDown) {
        var value = Number(key);
        if (value == 37) {
            this.paddle.move(-14, 0);
        } else if (value == 39) {
            this.paddle.move(4, 0);
        } else {
            this.paddle.move(0, 0);
        }
    }
};

//from pong code:
function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.x_speed = 0;
    this.y_speed = 3;
}

//from pong code:
Ball.prototype.renderGame = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 2 * Math.PI, false);
    ctx.fillStyle = "#ddff59";
    ctx.fill();
};

//from pong code:
Ball.prototype.update = function (paddle1, paddle2, new_turn) {
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.x - 5;
    var top_y = this.y - 5;
    var bottom_x = this.x + 5;
    var bottom_y = this.y + 5;

    if (this.x - 5 < 0) {
        this.x = 5;
        this.x_speed = -this.x_speed;
    } else if (this.x + 5 > 400) {
        this.x = 395;
        this.x_speed = -this.x_speed;
    }

    if (this.y < 0 || this.y > 600) {
        this.x_speed = 0;
        this.y_speed = 3;
        this.x = 200;
        this.y = 300;
        ai.new_turn();
    }

    if (top_y > 300) {
        if (top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
            this.y_speed = -3;
            this.x_speed += (paddle1.x_speed / 2);
            this.y += this.y_speed;
        }
    } else {
        if (top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y && top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x) {
            this.y_speed = 3;
            this.x_speed += (paddle2.x_speed / 2);
            this.y += this.y_speed;
        }
    }
};

// Custom code:
// stores data for ai.
function AI(){
    this.previous_data = null;
    this.training_data = [[], [], []];
    this.last_data_object = null;
    this.turn = 0;
    this.grab_data = true;
    this.flip_table = true;
}


// Custom code:
// This code is responsible for saving data per frame
AI.prototype.save_data = function(player, computer, ball){
    if(!this.grab_data)
        return;

    // If this is the very first frame (no prior data):
    if(this.previous_data == null){
        data = this.flip_table ? [width - computer.x, width - player.x, width - ball.x, height - ball.y] : [player.x, computer.x, ball.x, ball.y];
        this.previous_data = data;
        return;
    }

    // table is rotated to learn from player, but apply to computer position:
    if(this.flip_table){
        data_xs = [width - computer.x, width - player.x, width - ball.x, height - ball.y];
        index = ((width - player.x) > this.previous_data[1])?0:(((width - player.x) == this.previous_data[1])?1:2);
    }else{
        data_xs = [player.x, computer.x, ball.x, ball.y];
        index = (player.x < this.previous_data[0])?0:((player.x == this.previous_data[0])?1:2);
    }

    this.last_data_object = [...this.previous_data, ...data_xs];
    this.training_data[index].push(this.last_data_object);
    this.previous_data = data_xs;
}


// Custom code:
// deciding whether to play as ai
AI.prototype.new_turn = function(){
    this.previous_data = null;
    this.turn++;
    console.log('new turn: ' + this.turn);

    //hm games til train?
    if(this.turn > 1){
        this.train();
        computer.ai_plays = true;
        this.reset();
    }
}


// Custom code:
// empty training data to start clean
AI.prototype.reset = function(){
    this.previous_data = null;
    this.training_data = [[], [], []];
    this.turn = 0;
}



// Define a method called "train" for the AI class
// Print "balancing" to the console
// Calculate the minimum length of the three training data arrays
// Check if the minimum length is zero (i.e., no training data)
// a. If true, print "nothing to train" to the console and return
// Initialize empty arrays for data_xs and data_ys
// Loop through the training data arrays (i = 0 to 2)
// a. Append the first "len" elements of the i-th training data array to data_xs
// b. Append an array of length "len" containing one-hot encoded class labels to data_ys
// Print "training" to the console
// Convert data_xs and data_ys to TensorFlow tensors (xs and ys)
// Define an asynchronous function to train the model with the following steps:
// a. Print "training2" to the console
// b. Fit the model using xs and


// Custom code:
// trains a model
AI.prototype.train = function(){
    console.log('balancing');

    //shuffle attempt
    // Calculate the minimum length of the three training data arrays
    // Check if the minimum length is zero (i.e., no elements added to any of the arrays)
    // a. If true (minimum length is zero), print "nothing to train" to the console
    // b. Return, which stops the execution of the function and does nothing further
    len = Math.min(this.training_data[0].length, this.training_data[1].length, this.training_data[2].length);
    if(!len){
        console.log('nothing to train');
        return;
    }
    data_xs = [];
    data_ys = [];
    for(i = 0; i < 3; i++){
        data_xs.push(...this.training_data[i].slice(0, len));
        data_ys.push(...Array(len).fill([i==0?1:0, i==1?1:0, i==2?1:0]));
    }

    console.log('training');
    var xs = tf.tensor(data_xs);
    var ys = tf.tensor(data_ys);

    (async function() {
        console.log('training2');
        let result = await model.fit(xs, ys);
        console.log(result);
    }());
    console.log('trained');

}

// Custom code:
AI.prototype.predict_move = function(){
    console.log('predicting');
    if(this.last_data_object != null){
        //use this.last_data_object for input data
        //do prediction here
        //return -1/0/1
        prediction = model.predict(tf.tensor([this.last_data_object]));
        return tf.argMax(prediction, 1).dataSync()-1;
    }

}

// Original pong code:
document.body.appendChild(canvas);
animate(step);

window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});