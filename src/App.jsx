import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

function App() {
  const [dinoPosition, setDinoPosition] = useState(100)
  const [isJumping, setIsJumping] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [isDucking, setIsDucking] = useState(false)
  const [cactusPosition, setCactusPosition] = useState(600)
  const [clouds, setClouds] = useState([])
  const gameSpeed = useRef(6)
  const scoreInterval = useRef(null)
  const cloudInterval = useRef(null)

  const jump = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsJumping(true)
      setDinoPosition(20)
      setTimeout(() => {
        setDinoPosition(100)
        setIsJumping(false)
      }, 500)
    }
  }, [isJumping, gameOver])

  const duck = useCallback(() => {
    if (!isJumping && !gameOver) {
      setIsDucking(true)
    }
  }, [isJumping, gameOver])

  const unduck = useCallback(() => {
    setIsDucking(false)
  }, [])

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space') {
        if (gameOver) {
          resetGame()
        } else {
          jump()
        }
      }
      if (event.code === 'ArrowDown') {
        duck()
      }
    }

    const handleKeyUp = (event) => {
      if (event.code === 'ArrowDown') {
        unduck()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [jump, duck, unduck, gameOver])

  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setCactusPosition(600)
    setClouds([])
    gameSpeed.current = 6
  }

  useEffect(() => {
    if (!gameOver) {
      const gameLoop = setInterval(() => {
        setCactusPosition((prev) => {
          if (prev <= -60) {
            return 600
          }
          return prev - gameSpeed.current
        })

        // Collision detection
        if (cactusPosition > 0 && cactusPosition < 100 && dinoPosition > 50) {
          setGameOver(true)
        }

        // Increase score
        setScore((prev) => prev + 1)

        // Increase game speed
        if (score > 0 && score % 100 === 0) {
          gameSpeed.current += 0.5
        }
      }, 20)

      // Cloud generation
      cloudInterval.current = setInterval(() => {
        setClouds((prev) => {
          const newCloud = {
            id: Date.now(),
            position: 600,
            speed: Math.random() * 2 + 2
          }
          return [...prev, newCloud]
        })
      }, 3000)

      return () => {
        clearInterval(gameLoop)
        clearInterval(cloudInterval.current)
      }
    }
  }, [gameOver, cactusPosition, dinoPosition, score])

  useEffect(() => {
    if (!gameOver) {
      const cloudLoop = setInterval(() => {
        setClouds((prev) => 
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
      <div className="score">Score: {score}</div>
      <div className="game">
        {clouds.map(cloud => (
          <div 
            key={cloud.id}
            className="cloud"
            style={{ left: `${cloud.position}px` }}
          />
        ))}
        <div 
          className={`dino ${isJumping ? 'jump' : ''} ${isDucking ? 'duck' : ''}`}
          style={{ bottom: `${dinoPosition}px` }}
        />
        <div 
          className="cactus"
          style={{ left: `${cactusPosition}px` }}
        />
        <div className="ground" />
      </div>
      {gameOver && (
        <div className="game-over">
          Game Over! Press Space to restart
        </div>
      )}
    </div>
  )
}

export default App 