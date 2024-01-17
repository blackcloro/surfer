let gameInitialized = false;
let controlHandlers = null;

function initGame() {
  let canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
  }

  // Resize canvas to fill browser window dynamically
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block'; // Remove scroll bars
  };
  window.addEventListener('resize', resizeCanvas, false);
  resizeCanvas(); // Initialize canvas size
  // Get the drawing context
  const ctx = canvas.getContext('2d');

  // Setting up lanes
  const laneWidth = canvas.width / 3;
  const cubeWidth = laneWidth;
  const cubeHeight = 20;

  // Cube properties - starting in the middle lane
  const cube = {
    x: laneWidth,
    y: 0 + cubeHeight + 90,
    width: cubeWidth,
    height: cubeHeight,
    speed: 5,
    lane: 1, // 0: left, 1: middle, 2: right
    moveLeft: false,
    moveRight: false
  };

  return { canvas, ctx, cube, laneWidth };
}

function updateCube(cube, canvas, laneWidth) {
  if (cube.moveLeft && cube.lane > 0) {
    cube.lane--;
    cube.x = cube.lane * laneWidth;
    cube.moveLeft = false;
  }

  if (cube.moveRight && cube.lane < 2) {
    cube.lane++;
    cube.x = cube.lane * laneWidth;
    cube.moveRight = false;
  }
}

function drawCube(ctx, cube) {
  ctx.fillStyle = 'blue';
  ctx.fillRect(cube.x, cube.y, cube.width, cube.height);
}
function initObstacles(canvas, laneWidth) {
  return {
    obstacles: [],
    obstacleInterval: 50,
    frameCount: 0,
    speed: 3,
    maxSpeed: 90,
    speedIncrement: 0.01,
    score: 0
  };
}
function updateObstacles(obstacleData, canvas, laneWidth) {
  let { obstacles, obstacleInterval, frameCount, speed, maxSpeed, speedIncrement, score } = obstacleData;

  // Check if it's time to add a new obstacle
  if (frameCount === obstacleInterval) {
    obstacles.push(createObstacle(laneWidth, speed));
    frameCount = 0; // Reset frame count
  } else {
    frameCount++; // Increment frame count
  }

  // Update and filter obstacles
  obstacles = updateObstaclePositions(obstacles, speed, canvas.height, () => score++);

  // Increment speed
  if (speed < maxSpeed) {
    speed += speedIncrement;
  }

  return { obstacles, obstacleInterval, frameCount, speed, maxSpeed, speedIncrement, score };
}

function createObstacle(laneWidth, speed) {
  const lane = Math.floor(Math.random() * 3); // Choose a lane (0, 1, or 2)
  return {
    x: lane * laneWidth,
    y: -20, // Start just above the canvas
    width: laneWidth,
    height: 20,
    speed: speed,
    done: false
  };
}

function updateObstaclePositions(obstacles, speed, canvasHeight, scoreIncrementCallback) {
  return obstacles.filter(obstacle => {
    obstacle.y += speed;
    if (obstacle.y > 0 + 120 && !obstacle.done) {
      scoreIncrementCallback();
      obstacle.done = true;
    }
    if (obstacle.y > canvasHeight) {
      return false; // Remove the obstacle
    }
    return true; // Keep the obstacle
  });
}

function drawObstacles(ctx, obstacles) {
  obstacles.forEach(obstacle => {
    ctx.fillStyle = 'red';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  });
}

function checkCollisions(cube, obstacles) {
  return obstacles.some(obstacle => {
    // AABB collision detection
    const collideX = cube.x < obstacle.x + obstacle.width && cube.x + cube.width > obstacle.x;
    const collideY = cube.y < obstacle.y + obstacle.height && cube.y + cube.height > obstacle.y;
    return collideX && collideY;
  });
}

function gameLoop() {
  if (!gameInitialized) {
    const { canvas, ctx, cube, laneWidth } = initGame();
    let obstacleData = initObstacles(canvas, laneWidth);
    let gameOver = false;
    let animationFrameId;

    function loop() {
      if (gameOver) {
        // Handle touch to restart game when game over
        document.addEventListener('touchstart', restartGame, { once: true });
        cancelAnimationFrame(animationFrameId);
        ctx.font = "30px Verdana";
        ctx.fillText(`Score: ${obstacleData.score}`, canvas.width / 2, canvas.height / 2);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      obstacleData = updateObstacles(obstacleData, canvas, laneWidth);
      drawObstacles(ctx, obstacleData.obstacles);

      if (checkCollisions(cube, obstacleData.obstacles)) {
        gameOver = true;
        ctx.font = "40px Arial";
        ctx.fillText(`score: ${obstacleData.score}`, canvas.width / 2, canvas.height / 2);
      } else {
        updateCube(cube, canvas, laneWidth);
        drawCube(ctx, cube);
        animationFrameId = requestAnimationFrame(loop);
      }
    }

    if (!controlHandlers) {
      controlHandlers = setupControls(cube);
    }

    loop();
    gameInitialized = true;
  }
}

function restartGame() {
  gameInitialized = false;
  controlHandlers.remove();
  controlHandlers = null;
  gameLoop();
}
function removeEventListeners() {
  // Remove keydown and keyup event listeners
  document.removeEventListener('keydown', keyDownHandler);
  document.removeEventListener('keyup', keyUpHandler);
}
function keyDownHandler(cube) {
  return function (event) {
    if (event.key === 'ArrowLeft') {
      cube.moveLeft = true;
    }
    if (event.key === 'ArrowRight') {
      cube.moveRight = true;
    }
    // Add restart functionality if needed
    if (event.key === ' ') {
      restartGame();
    }
  };
}

function keyUpHandler(cube) {
  return function (event) {
    if (event.key === 'ArrowLeft') {
      cube.moveLeft = false;
    }
    if (event.key === 'ArrowRight') {
      cube.moveRight = false;
    }
  };
}

function setupControls(cube) {
  const keyDown = keyDownHandler(cube);
  const keyUp = keyUpHandler(cube);

  // Add keyboard event listeners
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);

  // Touch event handlers
  const handleTouch = (event) => {
    const touchX = event.touches[0].clientX;
    const canvasCenter = window.innerWidth / 2;

    if (touchX < canvasCenter) {
      cube.moveLeft = true;
    } else {
      cube.moveRight = true;
    }
  };

  const endTouch = () => {
    cube.moveLeft = false;
    cube.moveRight = false;
  };

  // Add touch event listeners
  document.addEventListener('touchstart', handleTouch);
  document.addEventListener('touchend', endTouch);

  // Provide a way to remove these specific listeners later
  return {
    remove: function () {
      document.removeEventListener('keydown', keyDown);
      document.removeEventListener('keyup', keyUp);
      document.removeEventListener('touchstart', handleTouch);
      document.removeEventListener('touchend', endTouch);
    }
  };
}

// Start the game
gameLoop();

