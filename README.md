# Pong Game with TensorFlow Neural Network AI WIP

This project implements a simple Pong game with AI players, controlled by a Neural Network model developed with TensorFlow.js. 

## Game Setup 

Two paddles and a ball are setup on the canvas. The game starts by serving the ball from the center of the canvas. Each paddle's task is to bounce the ball back and forth. The ball speed increases every time it hits a paddle.

## AI 

The game uses a simple artificial intelligence (AI) for both paddles. The AI's task is to position the paddles in the optimal position to hit the incoming ball. The AI is controlled by a simple function that tracks the current position of the ball and moves the paddle towards it.

## Neural Network 

The AI behavior is guided by a Neural Network model, developed using TensorFlow.js. The model is a sequential one, consisting of four layers. Input to the network is the position of the paddles and the ball. The output is the optimal position of each paddle. The model uses the Adam optimizer and Mean Squared Error for the loss function. 

## Getting Started 

To play the game, simply open the `index.html` file in your web browser. If you wish to tweak the AI or game settings, edit the relevant parameters in the game's JavaScript file. 

## Game Controls

The game runs automatically with both left and right paddles controlled by the AI.

## Game Mechanics

Each round ends when one of the paddles misses the ball. The opposing side gets a point. The first side to reach three points wins the game, after which the game ends.

## Code Overview 

The game's code is divided into several main functions:

1. **drawRect()**: Draws the paddles on the canvas.
2. **drawBall()**: Draws the ball on the canvas.
3. **moveLeftPaddleAI() / moveRightPaddleAI()**: These functions control the movement of the AI paddles.
4. **drawScore()**: This function handles the scoring system.
5. **renderWinner()**: Renders the winner of the game when it's over.
6. **updateBall()**: This function controls the ball's movement and handles collisions.
7. **gameLoop()**: This function is the main game loop that controls the game's flow.
8. **moveAI()**: Moves the AI-controlled paddles.
9. **movePaddles()**: Invokes the moveAI function to move both paddles.

To start the game, the `gameLoop()` function is called.

## Contributing 

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License 

MIT
