class Game {
    constructor() {
        this.dino = document.getElementById('dino');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.healthElement = document.getElementById('health-text');
        this.healthFill = document.getElementById('health-fill');
        this.score = 0;
        this.highScore = 0;
        this.health = 100;
        this.isJumping = false;
        this.isEating = false;
        this.cactusInterval = null;
        this.gameSpeed = 5;
        this.cactusSpawnTime = 2000;
        this.isGameOver = false;
        this.init();
    }
    init() {
      
        this.highScore = localStorage.getItem('highScore') || 0;
        this.highScoreElement.textContent = this.highScore;
       
    
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('jump-btn').addEventListener('click', () => this.jump());
        document.getElementById('eat-btn').addEventListener('click', () => this.eat());
        
      
        this.startCactusSpawn();
      
      
        setInterval(() => this.incrementScore(), 100);
    }

    handleKeyPress(event) {
        if (this.isGameOver) return;
        
        if (event.code === 'Space') {
            this.jump();
        } else if (event.code === 'ArrowDown') {
            this.eat();
        }
    }

    jump() {
        if (!this.isJumping && !this.isGameOver) {
            this.isJumping = true;
            this.dino.classList.add('jump');
            
            setTimeout(() => {
                this.dino.classList.remove('jump');
                this.isJumping = false;
            }, 500);
        }
    }
    eat() {
        if (!this.isEating && !this.isGameOver) {
            this.isEating = true;
            this.dino.classList.add('eat');
            this.health = Math.min(100, this.health + 10);
            this.updateHealth();
            
            setTimeout(() => {
                this.dino.classList.remove('eat');
                this.isEating = false;
            }, 300);
        }
    }
    spawnCactus() {
        const cactus = document.createElement('div');
        cactus.classList.add('cactus');
        document.querySelector('.game').appendChild(cactus);
        
        let position = 800;
        
        const moveCactus = setInterval(() => {
            if (this.isGameOver) {
                clearInterval(moveCactus);
                return;
            }
            
            if (position < -30) {
                clearInterval(moveCactus);
                cactus.remove();
            } else {
                position -= this.gameSpeed;
                cactus.style.left = position + 'px';
                
              
                this.checkCollision(cactus);
            }
        }, 20);
    }

    checkCollision(cactus) {
        const dinoRect = this.dino.getBoundingClientRect();
        const cactusRect = cactus.getBoundingClientRect();
        
        if (
            dinoRect.right > cactusRect.left &&
            dinoRect.left < cactusRect.right &&
            dinoRect.bottom > cactusRect.top
        ) {
            this.health -= 10;
            this.updateHealth();
            cactus.remove();
            
            if (this.health <= 0) {
                this.gameOver();
            }
        }
    }

    updateHealth() {
        this.healthElement.textContent = this.health + '%';
        this.healthFill.style.width = this.health + '%';
    }

    incrementScore() {
        if (this.isGameOver) return;
        
        this.score++;
        this.scoreElement.textContent = this.score;
        
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('highScore', this.highScore);
        }
    }
    startCactusSpawn() {
        this.cactusInterval = setInterval(() => this.spawnCactus(), this.cactusSpawnTime);
    }

    gameOver() {
        this.isGameOver = true;
        clearInterval(this.cactusInterval);
        
        
        const gameOver = document.createElement('div');
        gameOver.style.position = 'absolute';
        gameOver.style.top = '50%';
        gameOver.style.left = '50%';
        gameOver.style.transform = 'translate(-50%, -50%)';
        gameOver.style.fontFamily = "'Press Start 2P', monospace";
        gameOver.style.color = '#535353';
        gameOver.style.textAlign = 'center';
        gameOver.innerHTML = 'GAME OVER<br>Press SPACE to restart';
        
        document.querySelector('.game').appendChild(gameOver);
        
       
        const restartHandler = (event) => {
            if (event.code === 'Space') {
                document.removeEventListener('keydown', restartHandler);
                location.reload();
            }
        };
       
        document.addEventListener('keydown', restartHandler);
    }
}

window.onload = () => {
    new Game();
}; 