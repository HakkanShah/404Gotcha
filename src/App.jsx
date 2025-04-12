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
  const gameSpeed = useRef(6)
  const grassInterval = useRef(null)
  const cloudInterval = useRef(null)

  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true)
      setDinoPosition(80)
      setTimeout(() => {
        setDinoPosition(0)
        setIsJumping(false)
      }, 500)
    }
  }, [isJumping, gameOver])

  const eat = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsEating(true)
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
      </div>
    </div>
  )
}

export default App 