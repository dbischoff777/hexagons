import { useState, useEffect } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { GameState } from './types'
import { loadGameState } from './utils/gameStateUtils'
import PageTransition from './components/PageTransition'
import { getCurrentLevelInfo, getPlayerProgress } from './utils/progressionUtils'

interface CurrentGame {
  isLevelMode: boolean;
  targetScore?: number;
  currentBlock?: number;
  currentLevel?: number;
}

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
  const [isDailyChallenge, setIsDailyChallenge] = useState(false)
  const [currentGame, setCurrentGame] = useState<CurrentGame | null>(null)
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false)

  // Load saved game state on component mount
  useEffect(() => {
    const savedGame = loadGameState()
    setSavedGameState(savedGame)
  }, [])

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

  const handleStartGame = (withTimer: boolean, targetScore?: number, isLevelMode: boolean = false) => {
    // Debug logging
    console.log('Starting game in App:', {
      withTimer,
      targetScore,
      isLevelMode,
      source: 'handleStartGame'
    });

    // Get current level info based on player progress
    const progress = getPlayerProgress();
    const { currentBlock, currentLevel } = getCurrentLevelInfo(progress.points);
    
    // Create new game state with explicit values
    const newGameState: CurrentGame = {
      isLevelMode: true,
      targetScore: targetScore ?? 10000,
      currentBlock: currentBlock,
      currentLevel: currentLevel
    };
    
    console.log('Setting new game state:', newGameState);
    
    // Set states in the correct order
    setCurrentGame(newGameState);
    setGameStarted(true);
    setTimedMode(withTimer);
    setIsDailyChallenge(false);
    setSavedGameState(null);
  };

  const handleStartPageGame = (withTimer: boolean, isDailyChallenge?: boolean) => {
    setGameStarted(true);
    setTimedMode(withTimer);
    setIsDailyChallenge(!!isDailyChallenge);
    
    // Reset game state for non-level games
    setCurrentGame({
      isLevelMode: false,
      targetScore: undefined,
      currentBlock: undefined,
      currentLevel: undefined
    });
  };

  const handleExitGame = () => {
    setIsExiting(true);
    setNextGameState({ started: false, timed: false });
    // Reset game-related states
    setCurrentGame(null);
    setIsDailyChallenge(false);
    setSavedGameState(null);
  };

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
      setGameStarted(nextGameState.started);
      setTimedMode(nextGameState.timed);
      setTutorialMode(false);
      
      if (nextGameState.started) {
        const savedGame = loadGameState();
        // Only use saved game if it matches timed mode
        if (savedGame && savedGame.timedMode === nextGameState.timed) {
          setSavedGameState({
            ...savedGame,
            audioSettings: {
              musicEnabled,
              soundEnabled
            }
          });
        } else {
          setSavedGameState(null);
        }
        
        if (soundEnabled) {
          soundManager.playSound('buttonClick');
        }
        if (musicEnabled) {
          soundManager.startBackgroundMusic();
        }
      } else {
        // Reset all game-related states when returning to start page
        setCurrentGame(null);
        setIsDailyChallenge(false);
        setSavedGameState(null);
      }
      
      setIsExiting(false);
      setNextGameState(null);
    }
  };

  return (
    <AccessibilityProvider>
      <PageTransition 
        isExiting={isExiting}
        onExitComplete={handleTransitionComplete}
      >
        {gameStarted ? (
          <Game 
            musicEnabled={musicEnabled} 
            soundEnabled={soundEnabled}
            timedMode={timedMode}
            tutorial={tutorialMode}
            onGameOver={handleExitGame}
            onSkipTutorial={handleExitGame}
            onExit={handleExitGame}
            onStartGame={handleStartGame}
            savedGameState={savedGameState}
            isDailyChallenge={isDailyChallenge}
            isLevelMode={true}
            targetScore={currentGame?.targetScore}
            currentBlock={currentGame?.currentBlock}
            currentLevel={currentGame?.currentLevel}
          />
        ) : (
          <StartPage 
            onStartGame={handleStartPageGame}
            onMusicToggle={handleMusicToggle}
            onSoundToggle={handleSoundToggle}
            musicEnabled={musicEnabled}
            soundEnabled={soundEnabled}
          />
        )}
      </PageTransition>
    </AccessibilityProvider>
  )
}

export default App
