import { useState, useEffect } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { GameState } from './types'
import { loadGameState } from './utils/gameStateUtils'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [tutorialMode, setTutorialMode] = useState(false)
  const [timedMode, setTimedMode] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null)
  const soundManager = SoundManager.getInstance()

  useEffect(() => {
    soundManager.setMusicEnabled(isMusicEnabled)
  }, [isMusicEnabled])

  useEffect(() => {
    soundManager.setSoundEnabled(isSoundEnabled)
  }, [isSoundEnabled])

  const handleStartGame = (timed: boolean) => {
    const savedGame = loadGameState()
    setTimedMode(timed)
    setGameStarted(true)
    setTutorialMode(false)
    setSavedGameState(savedGame && !timed ? savedGame : null)
    soundManager.playSound('buttonClick')
    soundManager.startBackgroundMusic()
  }

  const handleStartTutorial = () => {
    setGameStarted(true)
    setTutorialMode(true)
    soundManager.playSound('buttonClick')
  }

  const handleExitGame = () => {
    setGameStarted(false)
    setTutorialMode(false)
    setSavedGameState(null)
    soundManager.playSound('buttonClick')
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
        timedMode={timedMode}
        tutorial={tutorialMode}
        onGameOver={handleExitGame}
        onSkipTutorial={handleExitGame}
        onExit={handleExitGame}
        savedGameState={savedGameState}
      />
    </AccessibilityProvider>
  )
}

export default App
