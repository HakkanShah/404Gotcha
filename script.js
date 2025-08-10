/**
 * AI Snake Battle
 * Author: Gemini
 * Date: 2025-08-11
 *
 * A 2D Snake game where two AI-controlled snakes compete against each other.
 * Features: A* pathfinding, randomized behavior, power-ups, obstacles,
 * and adjustable settings.
 */

// --- UTILITY FUNCTIONS ---
const getById = (id) => document.getElementById(id);

// --- GAME ELEMENT CLASSES ---

class GameObject {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    draw(ctx, gridSize) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x * gridSize, this.y * gridSize, gridSize, gridSize);
    }
}

class Food extends GameObject {
    constructor(x, y) {
        super(x, y, '#ff5555'); // Red color for food
    }
}

class PowerUp extends GameObject {
    constructor(x, y, type) {
        const colors = { speedBoost: '#ffff00', slowDown: '#ff00ff' };
        super(x, y, colors[type] || '#ffffff');
        this.type = type;
        this.duration = 200; // Effect duration in game ticks
    }
}

class Obstacle extends GameObject {
    constructor(x, y) {
        super(x, y, '#888888'); // Gray for obstacles
    }
}


// --- SNAKE AND AI CLASSES ---

class Snake {
    constructor(id, x, y, color, ai) {
        this.id = id;
        this.color = color;
        this.ai = ai;
        this.ai.assignSnake(this);
        this.reset(x, y);
    }

    reset(x, y) {
        this.body = [{ x, y }];
        for (let i = 1; i < 5; i++) {
            this.body.push({ x: x - i, y });
        }
        this.direction = { x: 1, y: 0 }; // Start moving right
        this.isAlive = true;
        this.powerUp = null;
        this.powerUpTimer = 0;
    }

    getHead() {
        return this.body[0];
    }

    grow() {
        this.body.push({ ...this.body[this.body.length - 1] });
    }

    move() {
        const nextDir = this.ai.findNextMove();
        if (nextDir) {
            this.direction = nextDir;
        }

        const head = this.getHead();
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };

        this.body.unshift(newHead);
        this.body.pop();
    }

    applyPowerUp(powerUp) {
        this.powerUp = powerUp.type;
        this.powerUpTimer = powerUp.duration;
        console.log(`Snake ${this.id} got ${powerUp.type}`);
    }

    updatePowerUp() {
        if (this.powerUpTimer > 0) {
            this.powerUpTimer--;
            if (this.powerUpTimer === 0) {
                this.powerUp = null;
                 console.log(`Snake ${this.id} power-up expired.`);
            }
        }
    }

    draw(ctx, gridSize) {
        // Draw body
        for (let i = 1; i < this.body.length; i++) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.7; // Make tail slightly transparent
            ctx.fillRect(this.body[i].x * gridSize, this.body[i].y * gridSize, gridSize, gridSize);
        }
        ctx.globalAlpha = 1.0;

        // Draw head
        const head = this.getHead();
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize, gridSize);
        ctx.shadowBlur = 0;

        // Draw eyes
        ctx.fillStyle = '#000';
        const eyeSize = gridSize / 5;
        const eyeOffset1 = gridSize / 4;
        const eyeOffset2 = gridSize - eyeOffset1 - eyeSize;
        if(this.direction.x !== 0){ // Moving horizontally
            ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
            ctx.fillRect((head.x * gridSize) + eyeOffset2, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
        } else { // Moving vertically
            ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset1, eyeSize, eyeSize);
            ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
        }
    }
}

class AI {
    constructor(game) {
        this.game = game;
        this.snake = null; // Will be assigned later
    }
    
    assignSnake(snake) {
        this.snake = snake;
    }

    /**
     * The main decision-making function for the AI.
     * It prioritizes survival, then food, then exploring.
     */
    findNextMove() {
        const head = this.snake.getHead();
        const opponent = this.game.snakes.find(s => s.id !== this.snake.id);
        const obstacles = this.getObstacleMap(opponent);
        
        // --- GOAL 1: Find a safe path to the food ---
        const pathToFood = this.findPath(head, this.game.food, obstacles);
        
        if (pathToFood && this.isPathSafe(pathToFood, opponent)) {
            // Add a bit of randomness: 10% chance to not go for food if length > 15
            if (Math.random() > 0.1 || this.snake.body.length < 15) {
                return this.getDirectionFromPath(pathToFood);
            }
        }
        
        // --- GOAL 2: Survival - find the longest path or move towards tail ---
        const pathToTail = this.findPath(head, this.snake.body[this.snake.body.length-1], obstacles);
        if (pathToTail) {
            return this.getDirectionFromPath(pathToTail);
        }

        // --- GOAL 3: Last resort - find ANY safe adjacent square ---
        const safeMoves = this.getSafeMoves(head, obstacles);
        if (safeMoves.length > 0) {
            // Choose the move that is furthest from the opponent's head
            safeMoves.sort((a,b) => {
                const distA = this.heuristic({x: head.x + a.x, y: head.y + a.y}, opponent.getHead());
                const distB = this.heuristic({x: head.x + b.x, y: head.y + b.y}, opponent.getHead());
                return distB - distA;
            });
            return safeMoves[0];
        }

        // No safe moves found, snake is trapped. Return current direction.
        return this.snake.direction; 
    }
    
    isPathSafe(path, opponent) {
        // Simple safety check: ensure the path doesn't lead into a dead end
        // by checking if the destination has at least one escape route.
        const destination = path[1];
        if (!destination) return false;
        
        const obstaclesAfterMove = this.getObstacleMap(opponent);
        // Temporarily add our own body (except tail) to obstacles
        for(let i = 0; i < this.snake.body.length -1; i++){
             obstaclesAfterMove[`${this.snake.body[i].x},${this.snake.body[i].y}`] = true;
        }
        
        const escapeMoves = this.getSafeMoves(destination, obstaclesAfterMove);

        // More advanced check: consider opponent's next move
        const opponentHead = opponent.getHead();
        const opponentMoves = [
            {x: opponentHead.x + 1, y: opponentHead.y},
            {x: opponentHead.x - 1, y: opponentHead.y},
            {x: opponentHead.x, y: opponentHead.y + 1},
            {x: opponentHead.x, y: opponentHead.y - 1},
        ];

        // If our destination is one of the opponent's next possible moves, the path is risky
        if (opponentMoves.some(move => move.x === destination.x && move.y === destination.y)) {
            // It's only risky if opponent is longer or path is long
            if (opponent.body.length >= this.snake.body.length && path.length > 3) {
                 return false;
            }
        }

        return escapeMoves.length > 0;
    }

    getSafeMoves(pos, obstacles) {
        const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        return moves.filter(move => {
            const nextPos = { x: pos.x + move.x, y: pos.y + move.y };
            return !obstacles[`${nextPos.x},${nextPos.y}`];
        });
    }

    getDirectionFromPath(path) {
        if (!path || path.length < 2) return null;
        const head = path[0];
        const nextStep = path[1];
        return { x: nextStep.x - head.x, y: nextStep.y - head.y };
    }

    /**
     * A* Pathfinding Algorithm
     * Finds the shortest path from a start to an end node.
     * @param {object} start - {x, y}
     * @param {object} end - {x, y}
     * @param {object} obstacles - A map of "x,y" strings for blocked cells.
     * @returns {Array|null} - An array of {x, y} coordinates representing the path, or null.
     */
    findPath(start, end, obstacles) {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();

        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${start.x},${start.y}`;
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start, end));
        openSet.push({ pos: start, score: fScore.get(startKey) });

        while (openSet.length > 0) {
            openSet.sort((a, b) => a.score - b.score);
            const current = openSet.shift().pos;
            const currentKey = `${current.x},${current.y}`;

            if (current.x === end.x && current.y === end.y) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            const neighbors = this.getNeighbors(current, obstacles);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (closedSet.has(neighborKey)) continue;

                const tentativeGScore = gScore.get(currentKey) + 1;

                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end));
                    if (!openSet.some(item => item.pos.x === neighbor.x && item.pos.y === neighbor.y)) {
                        openSet.push({ pos: neighbor, score: fScore.get(neighborKey) });
                    }
                }
            }
        }
        return null; // No path found
    }
    
    reconstructPath(cameFrom, current) {
        const totalPath = [current];
        let currentKey = `${current.x},${current.y}`;
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            currentKey = `${current.x},${current.y}`;
            totalPath.unshift(current);
        }
        return totalPath;
    }
    
    getNeighbors(pos, obstacles) {
        const neighbors = [];
        const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
        for (const dir of directions) {
            const neighborPos = { x: pos.x + dir.x, y: pos.y + dir.y };
            if (!obstacles[`${neighborPos.x},${neighborPos.y}`]) {
                neighbors.push(neighborPos);
            }
        }
        return neighbors;
    }

    heuristic(a, b) {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getObstacleMap(opponent) {
        const obstacles = {};
        const { tileCount } = this.game;

        // Walls
        for (let i = -1; i <= tileCount; i++) {
            obstacles[`${i},${-1}`] = true;
            obstacles[`${i},${tileCount}`] = true;
            obstacles[`${-1},${i}`] = true;
            obstacles[`${tileCount},${i}`] = true;
        }
        
        // Own body (excluding the tail, as it will move)
        for (let i = 0; i < this.snake.body.length - 1; i++) {
            const segment = this.snake.body[i];
            obstacles[`${segment.x},${segment.y}`] = true;
        }
        
        // Opponent's body (including their head, which is dangerous)
        for (const segment of opponent.body) {
            obstacles[`${segment.x},${segment.y}`] = true;
        }

        // Game obstacles
        for (const obstacle of this.game.obstacles) {
            obstacles[`${obstacle.x},${obstacle.y}`] = true;
        }

        return obstacles;
    }
}


// --- MAIN GAME CLASS ---

class Game {
    constructor() {
        this.canvas = getById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileCount = 30;
        this.gridSize = this.canvas.width / this.tileCount;

        this.snakes = [];
        this.food = null;
        this.powerUps = [];
        this.obstacles = [];
        this.scores = { 1: 0, 2: 0 };
        this.gameState = 'running';
        
        this.obstacleMode = false;
        this.obstacleSpawnTimer = 0;
        
        this.speed = 15; // Updates per second
        this.lastUpdateTime = 0;
        this.animationFrameId = null;
        
        this.setupUI();
        this.init();
    }
    
    setupUI() {
        this.score1El = getById('score1');
        this.length1El = getById('length1');
        this.score2El = getById('score2');
        this.length2El = getById('length2');
        this.winnerDisplay = getById('winner-display');
        
        const speedSlider = getById('speed-slider');
        speedSlider.addEventListener('input', (e) => this.speed = parseInt(e.target.value));
        
        const obstacleToggle = getById('obstacle-toggle');
        obstacleToggle.addEventListener('change', (e) => {
            this.obstacleMode = e.target.checked;
            if (!this.obstacleMode) {
                this.obstacles = []; // Clear obstacles if disabled
            }
        });
    }

    init() {
        this.winnerDisplay.textContent = "";
        this.gameState = 'running';
        
        if (this.snakes.length === 0) {
            // First time setup
            const ai1 = new AI(this);
            const ai2 = new AI(this);
            this.snakes.push(new Snake(1, 5, 5, '#4caf50', ai1));
            this.snakes.push(new Snake(2, this.tileCount - 6, this.tileCount - 6, '#2196F3', ai2));
        } else {
            // Reset existing snakes
            this.snakes[0].reset(5, 5);
            this.snakes[1].reset(this.tileCount - 6, this.tileCount - 6);
        }
        
        this.obstacles = [];
        this.powerUps = [];
        this.spawnFood();
        
        if (!this.animationFrameId) {
            this.gameLoop(0);
        }
    }

    gameLoop(currentTime) {
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));

        const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
        const frameDuration = 1000 / this.speed;

        if (timeSinceLastUpdate > frameDuration) {
            this.lastUpdateTime = currentTime;
            if (this.gameState === 'running') {
                this.update();
            }
            this.draw();
        }
    }

    update() {
        // Move snakes
        this.snakes.forEach(snake => {
             // Speed power-up logic: move twice if active
            const moves = (snake.powerUp === 'speedBoost') ? 2 : 1;
            // Slow-down logic: skip move every other frame
            if (snake.powerUp === 'slowDown' && this.lastUpdateTime % 2 < 1) return;

            for(let i=0; i<moves; i++){
                if(snake.isAlive) snake.move();
            }
        });

        this.checkCollisions();
        this.checkFood();
        this.checkPowerUps();
        
        this.snakes.forEach(snake => snake.updatePowerUp());

        // Occasionally spawn power-ups
        if (Math.random() < 0.005 && this.powerUps.length < 2) {
            this.spawnPowerUp();
        }
        
        // Handle obstacle mode
        if (this.obstacleMode) {
            this.obstacleSpawnTimer++;
            if(this.obstacleSpawnTimer > 50){ // Spawn an obstacle every ~50 ticks
                this.spawnObstacle();
                this.obstacleSpawnTimer = 0;
            }
        }

        this.updateUI();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines (optional)
        this.ctx.strokeStyle = '#222';
        for (let i = 0; i < this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        this.food.draw(this.ctx, this.gridSize);
        this.powerUps.forEach(p => p.draw(this.ctx, this.gridSize));
        this.obstacles.forEach(o => o.draw(this.ctx, this.gridSize));
        this.snakes.forEach(s => s.draw(this.ctx, this.gridSize));
    }

    updateUI() {
        this.score1El.textContent = this.scores[1];
        this.length1El.textContent = this.snakes[0].body.length;
        this.score2El.textContent = this.scores[2];
        this.length2El.textContent = this.snakes[1].body.length;
    }

    getUnoccupiedCoord() {
        let x, y, occupied;
        const allObstacles = [
            ...this.snakes[0].body,
            ...this.snakes[1].body,
            ...this.obstacles,
            ...this.powerUps,
            this.food,
        ].filter(Boolean);

        do {
            x = Math.floor(Math.random() * this.tileCount);
            y = Math.floor(Math.random() * this.tileCount);
            occupied = allObstacles.some(obj => obj.x === x && obj.y === y);
        } while (occupied);
        
        return { x, y };
    }

    spawnFood() {
        const { x, y } = this.getUnoccupiedCoord();
        this.food = new Food(x, y);
    }
    
    spawnPowerUp() {
        const { x, y } = this.getUnoccupiedCoord();
        const type = Math.random() < 0.5 ? 'speedBoost' : 'slowDown';
        this.powerUps.push(new PowerUp(x, y, type));
    }

    spawnObstacle() {
         if (this.obstacles.length >= (this.tileCount * this.tileCount) / 10) return; // Cap obstacles
        const { x, y } = this.getUnoccupiedCoord();
        this.obstacles.push(new Obstacle(x, y));
    }

    checkFood() {
        this.snakes.forEach(snake => {
            const head = snake.getHead();
            if (head.x === this.food.x && head.y === this.food.y) {
                snake.grow();
                this.spawnFood();
            }
        });
    }

    checkPowerUps() {
        this.snakes.forEach(snake => {
            const head = snake.getHead();
            const powerUpIndex = this.powerUps.findIndex(p => p.x === head.x && p.y === head.y);
            if (powerUpIndex !== -1) {
                const powerUp = this.powerUps.splice(powerUpIndex, 1)[0];
                snake.applyPowerUp(powerUp);
            }
        });
    }

    checkCollisions() {
        const [snake1, snake2] = this.snakes;
        const head1 = snake1.getHead();
        const head2 = snake2.getHead();
        
        // --- HEAD-ON COLLISION ---
        if (head1.x === head2.x && head1.y === head2.y) {
            if (snake1.body.length > snake2.body.length) {
                this.endGame(snake1, snake2, 'head-on collision');
            } else if (snake2.body.length > snake1.body.length) {
                this.endGame(snake2, snake1, 'head-on collision');
            } else {
                this.endGame(null, null, "It's a tie!"); // Draw
            }
            return;
        }

        // --- OTHER COLLISIONS ---
        const checkSingleSnakeCollision = (snake, otherSnake) => {
            const head = snake.getHead();
            // Wall collision
            if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
                return { dead: true, reason: `hit a wall` };
            }
            // Self collision
            for (let i = 1; i < snake.body.length; i++) {
                if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
                    return { dead: true, reason: `crashed into itself` };
                }
            }
            // Other snake collision
            for (const segment of otherSnake.body) {
 
