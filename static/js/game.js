class Game {
    constructor() {
        this.dino = document.getElementById('dino');
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health-text');
        this.healthFill = document.getElementById('health-fill');
        this.score = 0;
        this.health = 100;
        this.isJumping = false;
        this.isEating = false;
        this.grassInterval = null;
        this.gameSpeed = 5;
        this.grassSpawnTime = 2000;
        
        this.init();
    }

    init() {
        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('jump-btn').addEventListener('click', () => this.jump());
        document.getElementById('eat-btn').addEventListener('click', () => this.eat());
        
        // Start spawning grass
        this.startGrassSpawn();
        
        // Start score increment
        setInterval(() => this.incrementScore(), 100);
    }

    handleKeyPress(event) {
        if (event.code === 'Space') {
            this.jump();
        } else if (event.code === 'ArrowDown') {
            this.eat();
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.dino.classList.add('jump');
            
            setTimeout(() => {
                this.dino.classList.remove('jump');
                this.isJumping = false;
            }, 500);
        }
    }

    eat() {
        if (!this.isEating) {
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

    spawnGrass() {
        const grass = document.createElement('div');
        grass.classList.add('grass');
        document.querySelector('.game').appendChild(grass);
        
        let position = 800;
        
        const moveGrass = setInterval(() => {
            if (position < -30) {
                clearInterval(moveGrass);
                grass.remove();
            } else {
                position -= this.gameSpeed;
                grass.style.left = position + 'px';
                
                // Check collision
                this.checkCollision(grass);
            }
        }, 20);
    }

    checkCollision(grass) {
        const dinoRect = this.dino.getBoundingClientRect();
        const grassRect = grass.getBoundingClientRect();
        
        if (
            dinoRect.right > grassRect.left &&
            dinoRect.left < grassRect.right &&
            dinoRect.bottom > grassRect.top
        ) {
            this.health -= 10;
            this.updateHealth();
            grass.remove();
            
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
        this.score++;
        this.scoreElement.textContent = this.score;
    }

    startGrassSpawn() {
        this.grassInterval = setInterval(() => this.spawnGrass(), this.grassSpawnTime);
    }

    gameOver() {
        clearInterval(this.grassInterval);
        alert('Game Over! Score: ' + this.score);
        location.reload();
    }
}

// Start game when page loads
window.onload = () => {
    new Game();
}; 