import { useState, useEffect, useRef } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { GameState } from './types'
import { loadGameState } from './utils/gameStateUtils'
import PageTransition from './components/PageTransition'
import { getCurrentLevelInfo, getPlayerProgress, getNextLevelInfo, LEVEL_BLOCKS } from './utils/progressionUtils'

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
  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false)
  const levelCompleteRef = useRef(false)

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

  const handleStartGame = (withTimer: boolean, targetScore?: number) => {
    // Get current level info based on player progress
    const progress = getPlayerProgress();
    const { currentBlock, currentLevel } = getCurrentLevelInfo(progress.points);
    
    // Get next level's target score if not provided
    const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);
    const effectiveTargetScore = targetScore ?? nextLevel?.pointsRequired ?? 10000;
    
    // Set current game state
    setCurrentGame({
      isLevelMode: true,
      targetScore: effectiveTargetScore,
      currentBlock,
      currentLevel
    });
    
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
    setSavedGameState(null);
  };

  const handleLevelComplete = (isComplete: boolean) => {
    console.log('handleLevelComplete called with:', isComplete);
    levelCompleteRef.current = isComplete;
    setShowLevelComplete(isComplete);
  };

  const handleExitGame = (forcedExit = false) => {
    console.log('handleExitGame called', {
      currentGame,
      showLevelComplete: levelCompleteRef.current,
      isExiting,
      nextGameState,
      forcedExit
    });

    // Allow exit if forced, level complete, or not in level mode
    if (forcedExit || levelCompleteRef.current || !currentGame?.isLevelMode) {
      console.log('Exiting game - forced or level complete');
      setIsExiting(true);
      setNextGameState({ started: false, timed: false });
      setCurrentGame(null);
      setIsDailyChallenge(false);
      setSavedGameState(null);
      levelCompleteRef.current = false;
      return;
    }
    
    // Block normal exits during level mode
    if (currentGame?.isLevelMode) {
      console.log('Blocking exit - active level mode');
      return;
    }
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
      setShowLevelComplete(false);
      
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
            onLevelComplete={handleLevelComplete}
            showLevelComplete={showLevelComplete}
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
