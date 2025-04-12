import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

function App() {
  const [dinoPosition, setDinoPosition] = useState(0)
  const [isJumping, setIsJumping] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [isEating, setIsEating] = useState(false)
  const [grassPosition, setGrassPosition] = useState(600)
  const [clouds, setClouds] = useState([])
  const [stars, setStars] = useState([])
  const [isMobile, setIsMobile] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const gameSpeed = useRef(6)
  const grassInterval = useRef(null)
  const cloudInterval = useRef(null)
  
  // Sound effects
  const jumpSound = useRef(new Audio('/sounds/jump.mp3'))
  const eatSound = useRef(new Audio('/sounds/eat.mp3'))
  const gameOverSound = useRef(new Audio('/sounds/gameover.mp3'))
  const backgroundMusic = useRef(new Audio('/sounds/background.mp3'))

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Initialize background music
  useEffect(() => {
    backgroundMusic.current.loop = true
    backgroundMusic.current.volume = 0.3
    
    // Start background music on first user interaction
    const startMusic = () => {
      if (!isMuted) {
        backgroundMusic.current.play().catch(err => console.log('Audio play failed:', err))
      }
      document.removeEventListener('click', startMusic)
      document.removeEventListener('keydown', startMusic)
    }
    
    document.addEventListener('click', startMusic)
    document.addEventListener('keydown', startMusic)
    
    return () => {
      document.removeEventListener('click', startMusic)
      document.removeEventListener('keydown', startMusic)
    }
  }, [isMuted])

  const playSound = (sound) => {
    if (!isMuted) {
      sound.current.currentTime = 0
      sound.current.play().catch(err => console.log('Audio play failed:', err))
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (!isMuted) {
      backgroundMusic.current.pause()
    } else {
      backgroundMusic.current.play().catch(err => console.log('Audio play failed:', err))
    }
  }

  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true)
      setDinoPosition(80)
      playSound(jumpSound)
      setTimeout(() => {
        setDinoPosition(0)
        setIsJumping(false)
      }, 500)
    }
  }, [isJumping, gameOver])

  const eat = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsEating(true)
      playSound(eatSound)
      setTimeout(() => {
        setIsEating(false)
      }, 300)
    }
  }, [isJumping, gameOver])

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        if (gameOver) {
          resetGame()
        } else {
          jump()
        }
      }
      if (event.code === 'KeyE') {
        eat()
      }
      if (event.code === 'KeyM') {
        toggleMute()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [jump, eat, gameOver])

  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setHealth(100)
    setGrassPosition(600)
    setClouds([])
    setStars([])
    gameSpeed.current = 6
    if (!isMuted) {
      backgroundMusic.current.play().catch(err => console.log('Audio play failed:', err))
    }
  }

  useEffect(() => {
    if (!gameOver) {
      const gameLoop = setInterval(() => {
        setGrassPosition((prev) => {
          if (prev <= -60) {
            return 600
          }
          return prev - gameSpeed.current
        })

        // Eating detection
        if (grassPosition > 0 && grassPosition < 100 && !isJumping) {
          setHealth(prev => Math.min(100, prev + 10))
          setScore(prev => prev + 50)
          setGrassPosition(600)
        }

        // Health decrease
        setHealth(prev => Math.max(0, prev - 0.1))

        // Game over if health is 0
        if (health <= 0) {
          setGameOver(true)
          playSound(gameOverSound)
          backgroundMusic.current.pause()
        }

        // Increase score
        setScore(prev => prev + 1)

        // Increase game speed
        if (score > 0 && score % 100 === 0) {
          gameSpeed.current += 0.5
        }
      }, 20)

      // Cloud generation
      cloudInterval.current = setInterval(() => {
        setClouds(prev => {
          const newCloud = {
            id: Date.now(),
            position: 600,
            speed: Math.random() * 2 + 2
          }
          return [...prev, newCloud]
        })
      }, 3000)

      // Star generation
      setInterval(() => {
        setStars(prev => {
          const newStar = {
            id: Date.now(),
            position: Math.random() * 600,
            top: Math.random() * 150
          }
          return [...prev, newStar]
        })
      }, 2000)

      return () => {
        clearInterval(gameLoop)
        clearInterval(cloudInterval.current)
      }
    }
  }, [gameOver, grassPosition, isJumping, health, score])

  useEffect(() => {
    if (!gameOver) {
      const cloudLoop = setInterval(() => {
        setClouds(prev => 
          prev.map(cloud => ({
            ...cloud,
            position: cloud.position - cloud.speed
          })).filter(cloud => cloud.position > -100)
        )
      }, 20)

      return () => clearInterval(cloudLoop)
    }
  }, [gameOver])

  return (
    <div className="game-container">
      <div className="hud">
        <div className="score">Score: {score}</div>
        <div className="health-bar">
          <div 
            className="health-fill"
            style={{ width: `${health}%` }}
          />
          <span>Health: {Math.round(health)}%</span>
        </div>
        <button 
          className="mute-btn"
          onClick={toggleMute}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
      <div className="game">
        {stars.map(star => (
          <div 
            key={star.id}
            className="star"
            style={{ 
              left: `${star.position}px`,
              top: `${star.top}px`
            }}
          />
        ))}
        {clouds.map(cloud => (
          <div 
            key={cloud.id}
            className="cloud"
            style={{ left: `${cloud.position}px` }}
          />
        ))}
        <div 
          className={`dino ${isJumping ? 'jump' : ''} ${isEating ? 'eat' : ''}`}
          style={{ bottom: `${dinoPosition}px` }}
        />
        <div 
          className="grass"
          style={{ left: `${grassPosition}px` }}
        />
        <div className="ground" />
      </div>
      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <p>Press Space to restart</p>
        </div>
      )}
      <div className="instructions">
        <p>Space - Jump</p>
        <p>E - Eat Grass</p>
        <p>M - Toggle Sound</p>
      </div>
      
      {/* Mobile Controls */}
      {isMobile && (
        <div className="mobile-controls">
          <button 
            className="control-btn jump-btn"
            onClick={jump}
            disabled={isJumping || gameOver}
          >
            Jump
          </button>
          <button 
            className="control-btn eat-btn"
            onClick={eat}
            disabled={isJumping || gameOver}
          >
            Eat
          </button>
          <button 
            className="control-btn mute-btn"
            onClick={toggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      )}
    </div>
  )
}

export default App 