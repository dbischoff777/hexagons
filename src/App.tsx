import { useState, useEffect } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'

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

  const handleMusicToggle = (enabled: boolean) => {
    setIsMusicEnabled(enabled)
    soundManager.playSound('buttonClick')
  }

  const handleSoundToggle = (enabled: boolean) => {
    setIsSoundEnabled(enabled)
    if (enabled) soundManager.playSound('buttonClick')
  }

  if (!gameStarted) {
    return (
      <AccessibilityProvider>
        <StartPage 
          onStartGame={handleStartGame}
          onMusicToggle={handleMusicToggle}
          onSoundToggle={handleSoundToggle}
        />
      </AccessibilityProvider>
    )
  }

  return (
    <AccessibilityProvider>
      <Game 
        musicEnabled={isMusicEnabled} 
        soundEnabled={isSoundEnabled}
        timedMode={isTimedMode}
        onGameOver={() => soundManager.playSound('gameOver')}
      />
    </AccessibilityProvider>
  )
}

export default App
