/**
 * AI Snake Battle - Mobile Ready
 * Author: Gemini
 * Date: 2025-08-11
 *
 * Adds mobile responsiveness, touch controls, and game mode selection
 * to the AI Snake Battle.
 */

// --- UTILITY FUNCTIONS ---
const getById = (id) => document.getElementById(id);

// --- GAME ELEMENT CLASSES (Food, PowerUp, Obstacle) ---
// ... (These classes are unchanged from the previous version) ...
class GameObject {
    constructor(x, y, color) { this.x = x; this.y = y; this.color = color; }
    draw(ctx, gridSize) { ctx.fillStyle = this.color; ctx.fillRect(this.x * gridSize, this.y * gridSize, gridSize, gridSize); }
}
class Food extends GameObject { constructor(x, y) { super(x, y, '#ff5555'); } }
class PowerUp extends GameObject { constructor(x, y, type) { const colors = { speedBoost: '#ffff00', slowDown: '#ff00ff' }; super(x, y, colors[type] || '#ffffff'); this.type = type; this.duration = 200; } }
class Obstacle extends GameObject { constructor(x, y) { super(x, y, '#888888'); } }


// --- SNAKE AND AI CLASSES ---

class Snake {
    constructor(id, x, y, color, controllerType, game) {
        this.id = id;
        this.color = color;
        this.controllerType = controllerType;
        if (this.controllerType === 'ai') {
            this.ai = new AI(game);
            this.ai.assignSnake(this);
        } else {
            this.ai = null;
        }
        this.reset(x, y);
    }

    reset(x, y) {
        this.body = [{ x, y }];
        for (let i = 1; i < 5; i++) { this.body.push({ x: x - i, y }); }
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.isAlive = true;
        this.powerUp = null;
        this.powerUpTimer = 0;
    }

    // Player-specific method to change direction
    setDirection(newDir) {
        const isOpposite = (newDir.x === -this.direction.x && newDir.y === -this.direction.y);
        if (!isOpposite) {
            this.nextDirection = newDir;
        }
    }

    move() {
        if (this.controllerType === 'ai') {
            const nextDir = this.ai.findNextMove();
            if (nextDir) this.direction = nextDir;
        } else {
            // For player, update direction from the buffered next direction
            this.direction = this.nextDirection;
        }

        const head = this.getHead();
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y,
        };
        this.body.unshift(newHead);
        this.body.pop();
    }
    
    getHead() { return this.body[0]; }
    grow() { this.body.push({ ...this.body[this.body.length - 1] }); }
    applyPowerUp(powerUp) { this.powerUp = powerUp.type; this.powerUpTimer = powerUp.duration; }
    updatePowerUp() { if (this.powerUpTimer > 0) { this.powerUpTimer--; if (this.powerUpTimer === 0) this.powerUp = null; } }
    draw(ctx, gridSize) { /* ... (Drawing logic is unchanged) ... */
        for (let i = 1; i < this.body.length; i++) { ctx.fillStyle = this.color; ctx.globalAlpha = 0.7; ctx.fillRect(this.body[i].x * gridSize, this.body[i].y * gridSize, gridSize, gridSize); }
        ctx.globalAlpha = 1.0;
        const head = this.getHead();
        ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 10;
        ctx.fillRect(head.x * gridSize, head.y * gridSize, gridSize, gridSize);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        const eyeSize = gridSize / 5, eyeOffset1 = gridSize / 4, eyeOffset2 = gridSize - eyeOffset1 - eyeSize;
        if(this.direction.x !== 0){
             ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
             ctx.fillRect((head.x * gridSize) + eyeOffset2, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
        } else {
            ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset1, eyeSize, eyeSize);
            ctx.fillRect((head.x * gridSize) + eyeOffset1, (head.y * gridSize) + eyeOffset2, eyeSize, eyeSize);
        }
    }
}

// --- AI CLASS ---
// ... (The entire AI class is unchanged from the previous version) ...
class AI { constructor(game) { this.game = game; this.snake = null; } assignSnake(snake) { this.snake = snake; } findNextMove() { const head = this.snake.getHead(); const opponent = this.game.snakes.find(s => s.id !== this.snake.id); const obstacles = this.getObstacleMap(opponent); const pathToFood = this.findPath(head, this.game.food, obstacles); if (pathToFood && this.isPathSafe(pathToFood, opponent)) { if (Math.random() > 0.1 || this.snake.body.length < 15) { return this.getDirectionFromPath(pathToFood); } } const pathToTail = this.findPath(head, this.snake.body[this.snake.body.length - 1], obstacles); if (pathToTail) { return this.getDirectionFromPath(pathToTail); } const safeMoves = this.getSafeMoves(head, obstacles); if (safeMoves.length > 0) { safeMoves.sort((a, b) => { const distA = this.heuristic({ x: head.x + a.x, y: head.y + a.y }, opponent.getHead()); const distB = this.heuristic({ x: head.x + b.x, y: head.y + b.y }, opponent.getHead()); return distB - distA; }); return safeMoves[0]; } return this.snake.direction; } isPathSafe(path, opponent) { const destination = path[1]; if (!destination) return false; const obstaclesAfterMove = this.getObstacleMap(opponent); for (let i = 0; i < this.snake.body.length - 1; i++) { obstaclesAfterMove[`${this.snake.body[i].x},${this.snake.body[i].y}`] = true; } const escapeMoves = this.getSafeMoves(destination, obstaclesAfterMove); const opponentHead = opponent.getHead(); const opponentMoves = [{ x: opponentHead.x + 1, y: opponentHead.y }, { x: opponentHead.x - 1, y: opponentHead.y }, { x: opponentHead.x, y: opponentHead.y + 1 }, { x: opponentHead.x, y: opponentHead.y - 1 }, ]; if (opponentMoves.some(move => move.x === destination.x && move.y === destination.y)) { if (opponent.body.length >= this.snake.body.length && path.length > 3) { return false; } } return escapeMoves.length > 0; } getSafeMoves(pos, obstacles) { const moves = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]; return moves.filter(move => { const nextPos = { x: pos.x + move.x, y: pos.y + move.y }; return !obstacles[`${nextPos.x},${nextPos.y}`]; }); } getDirectionFromPath(path) { if (!path || path.length < 2) return null; const head = path[0]; const nextStep = path[1]; return { x: nextStep.x - head.x, y: nextStep.y - head.y }; } findPath(start, end, obstacles) { const openSet = []; const closedSet = new Set(); const cameFrom = new Map(); const gScore = new Map(); const fScore = new Map(); const startKey = `${start.x},${start.y}`; gScore.set(startKey, 0); fScore.set(startKey, this.heuristic(start, end)); openSet.push({ pos: start, score: fScore.get(startKey) }); while (openSet.length > 0) { openSet.sort((a, b) => a.score - b.score); const current = openSet.shift().pos; const currentKey = `${current.x},${current.y}`; if (current.x === end.x && current.y === end.y) { return this.reconstructPath(cameFrom, current); } closedSet.add(currentKey); const neighbors = this.getNeighbors(current, obstacles); for (const neighbor of neighbors) { const neighborKey = `${neighbor.x},${neighbor.y}`; if (closedSet.has(neighborKey)) continue; const tentativeGScore = gScore.get(currentKey) + 1; if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) { cameFrom.set(neighborKey, current); gScore.set(neighborKey, tentativeGScore); fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, end)); if (!openSet.some(item => item.pos.x === neighbor.x && item.pos.y === neighbor.y)) { openSet.push({ pos: neighbor, score: fScore.get(neighborKey) }); } } } } return null; } reconstructPath(cameFrom, current) { const totalPath = [current]; let currentKey = `${current.x},${current.y}`; while (cameFrom.has(currentKey)) { current = cameFrom.get(currentKey); currentKey = `${current.x},${current.y}`; totalPath.unshift(current); } return totalPath; } getNeighbors(pos, obstacles) { const neighbors = []; const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }]; for (const dir of directions) { const neighborPos = { x: pos.x + dir.x, y: pos.y + dir.y }; if (!obstacles[`${neighborPos.x},${neighborPos.y}`]) { neighbors.push(neighborPos); } } return neighbors; } heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); } getObstacleMap(opponent) { const obstacles = {}; const { tileCount } = this.game; for (let i = -1; i <= tileCount; i++) { obstacles[`${i},${-1}`] = true; obstacles[`${i},${tileCount}`] = true; obstacles[`${-1},${i}`] = true; obstacles[`${tileCount},${i}`] = true; } for (let i = 0; i < this.snake.body.length - 1; i++) { const segment = this.snake.body[i]; obstacles[`${segment.x},${segment.y}`] = true; } for (const segment of opponent.body) { obstacles[`${segment.x},${segment.y}`] = true; } for (const obstacle of this.game.obstacles) { obstacles[`${obstacle.x},${obstacle.y}`] = true; } return obstacles; } }


// --- MAIN GAME CLASS ---

class Game {
    constructor() {
        this.canvas = getById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Make canvas sharp on high-DPI displays
        const scale = window.devicePixelRatio || 1;
        const size = Math.min(window.innerWidth * 0.9, 600);
        this.canvas.width = size * scale;
        this.canvas.height = size * scale;
        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
        this.ctx.scale(scale, scale);

        this.tileCount = 30;
        this.gridSize = size / this.tileCount;

        this.snakes = [];
        this.food = null;
        this.powerUps = [];
        this.obstacles = [];
        this.scores = { 1: 0, 2: 0 };
        this.gameState = 'menu';
        this.gameMode = 'ai-vs-ai'; // default

        this.obstacleMode = false;
        this.obstacleSpawnTimer = 0;
        
        this.speed = 15;
        this.lastUpdateTime = 0;
        this.animationFrameId = null;

        // Touch controls state
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.setupUI();
        this.showMenu();
    }
    
    setupUI() {
        // Mode Selection
        this.modeSelectionEl = getById('mode-selection');
        this.gameAreaEl = getById('game-area');
        getById('ai-vs-ai-btn').onclick = () => this.startGame('ai-vs-ai');
        getById('player-vs-ai-btn').onclick = () => this.startGame('player-vs-ai');
        getById('back-to-menu-btn').onclick = () => this.showMenu();
        
        // Game UI
        this.score1El = getById('score1');
        this.length1El = getById('length1');
        this.snake1TitleEl = getById('snake1-title');
        this.score2El = getById('score2');
        this.length2El = getById('length2');
        this.winnerDisplay = getById('winner-display');
        
        getById('speed-slider').addEventListener('input', (e) => this.speed = parseInt(e.target.value));
        getById('obstacle-toggle').addEventListener('change', (e) => {
            this.obstacleMode = e.target.checked;
            if (!this.obstacleMode) this.obstacles = [];
        });

        // Touch and Keyboard Controls
        const touchOverlay = getById('touch-controls-overlay');
        touchOverlay.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        touchOverlay.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    showMenu() {
        this.gameState = 'menu';
        this.modeSelectionEl.classList.remove('hidden');
        this.gameAreaEl.classList.add('hidden');
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    startGame(mode) {
        this.gameMode = mode;
        this.modeSelectionEl.classList.add('hidden');
        this.gameAreaEl.classList.remove('hidden');
        this.scores = { 1: 0, 2: 0 }; // Reset scores on new mode start
        this.init();
    }
    
    init() {
        this.winnerDisplay.textContent = "";
        this.gameState = 'running';
        
        this.snakes = [];
        const controller1 = this.gameMode === 'player-vs-ai' ? 'player' : 'ai';
        this.snakes.push(new Snake(1, 5, 5, '#4caf50', controller1, this));
        this.snakes.push(new Snake(2, this.tileCount - 6, this.tileCount - 6, '#2196F3', 'ai', this));

        this.snake1TitleEl.textContent = controller1 === 'player' ? "You (Green)" : "Green Snake";
        
        this.obstacles = [];
        this.powerUps = [];
        this.spawnFood();
        
        if (!this.animationFrameId) {
            this.lastUpdateTime = 0;
            this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    // --- Control Handlers ---
    handleTouchStart(e) {
        e.preventDefault();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchMove(e) {
        if (this.snakes[0].controllerType !== 'player') return;
        e.preventDefault();
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const dx = touchEndX - this.touchStartX;
        const dy = touchEndY - this.touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
            if (Math.abs(dx) > 10) { // Threshold
                this.snakes[0].setDirection(dx > 0 ? {x: 1, y: 0} : {x: -1, y: 0});
                this.touchStartX = touchEndX; // Reset start position
            }
        } else { // Vertical swipe
            if (Math.abs(dy) > 10) { // Threshold
                 this.snakes[0].setDirection(dy > 0 ? {x: 0, y: 1} : {x: 0, y: -1});
                 this.touchStartY = touchEndY; // Reset start position
            }
        }
    }
    
    handleKeyDown(e) {
        if (this.snakes[0].controllerType !== 'player') return;
        let dir;
        switch (e.key) {
            case 'ArrowUp': case 'w': dir = {x: 0, y: -1}; break;
            case 'ArrowDown': case 's': dir = {x: 0, y: 1}; break;
            case 'ArrowLeft': case 'a': dir = {x: -1, y: 0}; break;
            case 'ArrowRight': case 'd': dir = {x: 1, y: 0}; break;
            default: return;
        }
        this.snakes[0].setDirection(dir);
    }
    
    // --- Game Loop and Logic ---
    // ... (gameLoop, update, draw, spawn*, check* methods are mostly unchanged) ...
    // ... I'll include them for completeness. The endGame method has minor text changes.
    
    gameLoop(currentTime) {
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        if (this.gameState === 'menu') return;

        if (this.lastUpdateTime === 0) this.lastUpdateTime = currentTime;
        const timeSinceLastUpdate = currentTime - this.lastUpdateTime;
        const frameDuration = 1000 / this.speed;

        if (timeSinceLastUpdate > frameDuration) {
            this.lastUpdateTime = currentTime;
            if (this.gameState === 'running') this.update();
            this.draw();
        }
    }

    update() {
        this.snakes.forEach(snake => {
            if (!snake.isAlive) return;
            const moves = (snake.powerUp === 'speedBoost') ? 2 : 1;
            if (snake.powerUp === 'slowDown' && this.lastUpdateTime % 2 < 1) return;
            for(let i=0; i<moves; i++){ if(snake.isAlive) snake.move(); }
        });
        this.checkCollisions();
        this.checkFood();
        this.checkPowerUps();
        this.snakes.forEach(snake => snake.updatePowerUp());
        if (Math.random() < 0.005 && this.powerUps.length < 2) this.spawnPowerUp();
        if (this.obstacleMode) { this.obstacleSpawnTimer++; if(this.obstacleSpawnTimer > 50){ this.spawnObstacle(); this.obstacleSpawnTimer = 0; } }
        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
        const allObstacles = [...this.snakes[0].body, ...this.snakes[1].body, ...this.obstacles, ...this.powerUps, this.food].filter(Boolean);
        do {
            x = Math.floor(Math.random() * this.tileCount); y = Math.floor(Math.random() * this.tileCount);
            occupied = allObstacles.some(obj => obj.x === x && obj.y === y);
        } while (occupied);
        return { x, y };
    }
    spawnFood() { const { x, y } = this.getUnoccupiedCoord(); this.food = new Food(x, y); }
    spawnPowerUp() { const { x, y } = this.getUnoccupiedCoord(); const type = Math.random() < 0.5 ? 'speedBoost' : 'slowDown'; this.powerUps.push(new PowerUp(x, y, type)); }
    spawnObstacle() { if (this.obstacles.length >= (this.tileCount * this.tileCount) / 10) return; const { x, y } = this.getUnoccupiedCoord(); this.obstacles.push(new Obstacle(x, y)); }
    checkFood() { this.snakes.forEach(snake => { if (!snake.isAlive) return; const head = snake.getHead(); if (head.x === this.food.x && head.y === this.food.y) { snake.grow(); this.spawnFood(); } }); }
    checkPowerUps() { this.snakes.forEach(snake => { if (!snake.isAlive) return; const head = snake.getHead(); const powerUpIndex = this.powerUps.findIndex(p => p.x === head.x && p.y === head.y); if (powerUpIndex !== -1) { const powerUp = this.powerUps.splice(powerUpIndex, 1)[0]; snake.applyPowerUp(powerUp); } }); }
    checkCollisions() { /* ... (Collision logic is unchanged) ... */
         const [snake1, snake2] = this.snakes;
        if (!snake1.isAlive || !snake2.isAlive) return;

        const head1 = snake1.getHead(); const head2 = snake2.getHead();
        if (head1.x === head2.x && head1.y === head2.y) {
            if (snake1.body.length > snake2.body.length) this.endGame(snake1, snake2, 'head-on collision');
            else if (snake2.body.length > snake1.body.length) this.endGame(snake2, snake1, 'head-on collision');
            else this.endGame(null, null, "It's a tie!");
            return;
        }
        const checkSingleSnakeCollision = (snake, otherSnake) => {
            const head = snake.getHead();
            if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) return { dead: true, reason: `hit a wall` };
            for (let i = 1; i < snake.body.length; i++) { if (head.x === snake.body[i].x && head.y === snake.body[i].y) return { dead: true, reason: `crashed into itself` }; }
            for (const segment of otherSnake.body) { if (head.x === segment.x && head.y === segment.y) return { dead: true, reason: `crashed into the other snake` }; }
            for (const obstacle of this.obstacles) { if (head.x === obstacle.x && head.y === obstacle.y) return { dead: true, reason: `hit an obstacle` }; }
            return { dead: false };
        };
        const collision1 = checkSingleSnakeCollision(snake1, snake2);
        const collision2 = checkSingleSnakeCollision(snake2, snake1);
        if (collision1.dead && collision2.dead) this.endGame(null, null, "Both snakes crashed!");
        else if (collision1.dead) this.endGame(snake2, snake1, collision1.reason);
        else if (collision2.dead) this.endGame(snake1, snake2, collision2.reason);
    }
    
    endGame(winner, loser, reason) {
        this.gameState = 'gameOver';
        if (winner) {
            this.scores[winner.id]++;
            this.winnerDisplay.style.color = winner.color;
            const winnerName = winner.controllerType === 'player' ? 'You' : (winner.id === 1 ? 'Green' : 'Blue');
            this.winnerDisplay.textContent = `${winnerName} win! (${reason})`;
        } else {
            this.winnerDisplay.style.color = '#ffeb3b';
            this.winnerDisplay.textContent = reason;
        }
        this.snakes.forEach(s => s.isAlive = false);
        setTimeout(() => this.init(), 3000);
    }
}

// --- START THE GAME ---
window.addEventListener('load', () => {
    new Game();
});
