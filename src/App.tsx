import { useState, useEffect } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isTimedMode, setIsTimedMode] = useState(true)
  const soundManager = SoundManager.getInstance()

  useEffect(() => {
    soundManager.setMusicEnabled(isMusicEnabled)
  }, [isMusicEnabled])

  useEffect(() => {
    soundManager.setSoundEnabled(isSoundEnabled)
  }, [isSoundEnabled])

  const handleStartGame = (withTimer: boolean) => {
    soundManager.playSound('buttonClick')
    setIsTimedMode(withTimer)
    setGameStarted(true)
    soundManager.startBackgroundMusic()
  }

  if (!gameStarted) {
    return (
      <StartPage 
        onStartGame={handleStartGame}
        onMusicToggle={(enabled) => {
          setIsMusicEnabled(enabled)
          soundManager.playSound('buttonClick')
        }}
        onSoundToggle={(enabled) => {
          setIsSoundEnabled(enabled)
          if (enabled) soundManager.playSound('buttonClick')
        }}
      />
    )
  }

  return (
    <Game 
      musicEnabled={isMusicEnabled} 
      soundEnabled={isSoundEnabled}
      timedMode={isTimedMode}
      onGameOver={() => soundManager.playSound('gameOver')}
    />
  )
}

export default App
