import { useState, useEffect, useRef } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'
import SoundManager from './utils/soundManager'
import { AccessibilityProvider } from './contexts/AccessibilityContext'
import { GameState } from './types'
import { clearSavedGame, loadGameState, saveGameState } from './utils/gameStateUtils'
import PageTransition from './components/PageTransition'
import { getCurrentLevelInfo, getPlayerProgress, getNextLevelInfo, LEVEL_BLOCKS } from './utils/progressionUtils'
import PreventContextMenu from './components/PreventContextMenu'
import { KeyBindings } from './types/index'
import { loadKeyBindings, saveKeyBindings } from './utils/keyBindingsUtils'
import SettingsModal from './components/SettingsModal'
import HexPuzzleMode from './components/HexPuzzleMode'
import { createDebugLogger } from './utils/debugUtils'

interface CurrentGame {
  isLevelMode: boolean;
  targetScore?: number;
  currentBlock?: number;
  currentLevel?: number;
}

const DEBUG = createDebugLogger('App')

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
  const [rotationEnabled, setRotationEnabled] = useState(() => {
    const savedState = loadGameState();
    return savedState?.audioSettings?.rotationEnabled ?? true;
  });
  const [keyBindings, setKeyBindings] = useState<KeyBindings>(loadKeyBindings());
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isPuzzleMode, setIsPuzzleMode] = useState(false);

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

  // Handler for Game component
  const handleGameStart = (withTimer: boolean, targetScore?: number) => {
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

  // Handler for StartPage component
  const handleStartGame = (
    withTimer: boolean, 
    targetScore?: number,
    isLevelMode?: boolean
  ) => {
    DEBUG.log('Starting game with', {
      withTimer,
      targetScore: targetScore || 'default',
      isLevelMode,
      currentGame // Log current game state
    });
    
    // Clear previous game state first
    setCurrentGame(null);
    setSavedGameState(null);
    levelCompleteRef.current = false;

    if (isLevelMode) {
      const progress = getPlayerProgress();
      const { currentBlock, currentLevel } = getCurrentLevelInfo(progress.points);
      
      DEBUG.log('Setting up level mode', {
        currentBlock,
        currentLevel,
        targetScore: targetScore || 'default',
        isLevelMode
      });

      setCurrentGame({
        isLevelMode: true,
        targetScore: Number(targetScore) || 100000,
        currentBlock,
        currentLevel
      });
    }
    
    setTimedMode(withTimer);
    setGameStarted(true);
  };

  const handleLevelComplete = (isComplete: boolean) => {
    DEBUG.log('handleLevelComplete called', { isComplete });
    levelCompleteRef.current = isComplete;
    setShowLevelComplete(isComplete);
  };

  const handleExitGame = (forcedExit = false) => {
    DEBUG.log('handleExitGame called', {
      currentGame,
      showLevelComplete,
      isExiting,
      nextGameState,
      forcedExit
    });
    
    if (forcedExit || showLevelComplete) {
      DEBUG.log('Exiting game', { 
        reason: forcedExit ? 'forced' : 'level complete',
        gameState: {
          gameStarted,
          showLevelComplete,
          isExiting,
          nextGameState
        }
      });
      
      setGameStarted(false);
      setShowLevelComplete(false);
      setIsExiting(false);
      setNextGameState(null);
      clearSavedGame();
      
      DEBUG.log('Game state after exit', {
        gameStarted: false,
        showLevelComplete: false,
        isExiting: false,
        nextGameState: null
      });
    } else {
      DEBUG.log('Setting exit confirmation', { isExiting: true });
      setIsExiting(true);
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

  const handleRotationToggle = (enabled: boolean) => {
    setRotationEnabled(enabled);
    const savedState = loadGameState();
    if (savedState) {
      saveGameState({
        ...savedState,
        audioSettings: {
          ...savedState.audioSettings,
          rotationEnabled: enabled
        }
      });
    }
  };

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
              soundEnabled,
              rotationEnabled
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

  const handleKeyBindingChange = (binding: Partial<KeyBindings>) => {
    const newBindings = { ...keyBindings, ...binding };
    setKeyBindings(newBindings);
    saveKeyBindings(newBindings);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    if (soundEnabled) {
      soundManager.playSound('buttonClick');
    }
  };

  return (
    <PreventContextMenu>
      <AccessibilityProvider>
        <PageTransition 
          isExiting={isExiting}
          onExitComplete={handleTransitionComplete}
        >
          <div className="app">
            {gameStarted ? (
              isPuzzleMode ? (
                <HexPuzzleMode
                  onComplete={() => {
                    soundManager.playSound('achievement');
                    setGameStarted(false);
                    setIsPuzzleMode(false);
                  }}
                  onExit={() => {
                    setGameStarted(false);
                    setIsPuzzleMode(false);
                  }}
                />
              ) : (
                <Game 
                  musicEnabled={musicEnabled} 
                  soundEnabled={soundEnabled}
                  timedMode={timedMode}
                  onGameOver={handleExitGame}
                  tutorial={tutorialMode}
                  onSkipTutorial={handleExitGame}
                  onExit={handleExitGame}
                  onStartGame={handleGameStart}
                  savedGameState={savedGameState}
                  isDailyChallenge={isDailyChallenge}
                  isLevelMode={currentGame?.isLevelMode ?? false}
                  targetScore={currentGame?.targetScore}
                  currentBlock={currentGame?.currentBlock}
                  currentLevel={currentGame?.currentLevel}
                  onLevelComplete={handleLevelComplete}
                  showLevelComplete={showLevelComplete}
                  rotationEnabled={rotationEnabled}
                />
              )
            ) : (
              <StartPage 
                onStartGame={(withTimer, isDailyChallenge, isPuzzleMode) => {
                  // Convert to new signature, preserve targetScore
                  handleStartGame(
                    withTimer, 
                    currentGame?.targetScore, // Pass through existing target score
                    withTimer && !isDailyChallenge && !isPuzzleMode
                  );
                }}
                onMusicToggle={handleMusicToggle}
                onSoundToggle={handleSoundToggle}
                musicEnabled={musicEnabled}
                soundEnabled={soundEnabled}
                rotationEnabled={rotationEnabled}
                onRotationToggle={handleRotationToggle}
                onOpenSettings={handleOpenSettings}
              />
            )}
            <SettingsModal
              isOpen={isSettingsOpen}
              onClose={() => setSettingsOpen(false)}
              musicEnabled={musicEnabled}
              soundEnabled={soundEnabled}
              rotationEnabled={rotationEnabled}
              onMusicToggle={handleMusicToggle}
              onSoundToggle={handleSoundToggle}
              onRotationToggle={handleRotationToggle}
              keyBindings={keyBindings}
              onKeyBindingChange={handleKeyBindingChange}
            />
          </div>
        </PageTransition>
      </AccessibilityProvider>
    </PreventContextMenu>
  )
}

export default App
