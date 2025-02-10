import { useState, useEffect } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { GameState } from './types'
import { loadGameState } from './utils/gameStateUtils'
import PageTransition from './components/PageTransition'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [tutorialMode, setTutorialMode] = useState(false)
  const [timedMode, setTimedMode] = useState(false)
  const [savedGameState, setSavedGameState] = useState<GameState | null>(null)
  const soundManager = SoundManager.getInstance()
  const [isExiting, setIsExiting] = useState(false)
  const [nextGameState, setNextGameState] = useState<{
    started: boolean
    timed: boolean
  } | null>(null)

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
    setIsExiting(true)
    setNextGameState({ started: true, timed })
  }

  const handleExitGame = () => {
    setIsExiting(true)
    setNextGameState({ started: false, timed: false })
  }

  const handleMusicToggle = (enabled: boolean) => {
    setMusicEnabled(enabled)
    soundManager.playSound('buttonClick')
  }

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled)
    if (enabled) soundManager.playSound('buttonClick')
  }

  const handleTransitionComplete = () => {
    if (nextGameState) {
      setGameStarted(nextGameState.started)
      setTimedMode(nextGameState.timed)
      setTutorialMode(false)
      
      if (nextGameState.started) {
        const savedGame = loadGameState()
        // Only use saved game if it matches timed mode
        if (savedGame && savedGame.timedMode === nextGameState.timed) {
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
      
      setIsExiting(false)
      setNextGameState(null)
    }
  }

  if (!gameStarted) {
    return (
      <AccessibilityProvider>
        <PageTransition 
          isExiting={isExiting}
          onExitComplete={handleTransitionComplete}
        >
          <StartPage 
            onStartGame={handleStartGame}
            onMusicToggle={handleMusicToggle}
            onSoundToggle={handleSoundToggle}
            musicEnabled={musicEnabled}
            soundEnabled={soundEnabled}
          />
        </PageTransition>
      </AccessibilityProvider>
    )
  }

  return (
    <AccessibilityProvider>
      <PageTransition 
        isExiting={isExiting}
        onExitComplete={handleTransitionComplete}
      >
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
      </PageTransition>
    </AccessibilityProvider>
  )
}

export default App
