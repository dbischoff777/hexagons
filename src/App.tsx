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
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null)
  const soundManager = SoundManager.getInstance()

  // Load saved game state on component mount
  useEffect(() => {
    const savedGame = loadGameState()
    setSavedGameState(savedGame)
  }, [])

  const [musicEnabled, setMusicEnabled] = useState<boolean>(false) // Default to false
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false) // Default to false

  // Update audio settings when savedGameState changes
  useEffect(() => {
    if (savedGameState?.audioSettings) {
      setMusicEnabled(savedGameState.audioSettings.musicEnabled)
      setSoundEnabled(savedGameState.audioSettings.soundEnabled)
    }
  }, [savedGameState])

  useEffect(() => {
    soundManager.setMusicEnabled(musicEnabled)
  }, [musicEnabled])

  useEffect(() => {
    soundManager.setSoundEnabled(soundEnabled)
  }, [soundEnabled])

  const handleStartGame = (timed: boolean) => {
    const savedGame = loadGameState()
    setTimedMode(timed)
    setGameStarted(true)
    setTutorialMode(false)
    
    // Only use saved game if it matches timed mode, but preserve current audio settings
    if (savedGame && savedGame.timedMode === timed) {
      setSavedGameState({
        ...savedGame,
        audioSettings: {
          musicEnabled,
          soundEnabled
        }
      })
    } else {
      setSavedGameState(null)
    }
    
    if (soundEnabled) {
      soundManager.playSound('buttonClick')
    }
    if (musicEnabled) {
      soundManager.startBackgroundMusic()
    }
  }

  const handleExitGame = () => {
    setGameStarted(false)
    setTutorialMode(false)
    setSavedGameState(null)
    soundManager.playSound('buttonClick')
  }

  const handleMusicToggle = (enabled: boolean) => {
    setMusicEnabled(enabled)
    soundManager.playSound('buttonClick')
  }

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    if (enabled) soundManager.playSound('buttonClick')
  }

  if (!gameStarted) {
    return (
      <AccessibilityProvider>
        <StartPage 
          onStartGame={handleStartGame}
          onMusicToggle={handleMusicToggle}
          onSoundToggle={handleSoundToggle}
          musicEnabled={musicEnabled}
          soundEnabled={soundEnabled}
        />
      </AccessibilityProvider>
    )
  }

  return (
    <AccessibilityProvider>
      <Game 
        musicEnabled={musicEnabled} 
        soundEnabled={soundEnabled}
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
