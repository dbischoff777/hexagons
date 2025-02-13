import React, { useState, useEffect } from 'react'
import './StartPage.css'
import AccessibilitySettings from './AccessibilitySettings'
import Game from './Game'
import { loadGameState, clearSavedGame } from '../utils/gameStateUtils'
import StatisticsPage from './StatisticsPage'
import ConfirmModal from './ConfirmModal'
import AchievementsView from './AchievementsView'
import UnlockablesMenu from './UnlockablesMenu'
import { setTheme, getPlayerProgress, setCompanion } from '../utils/progressionUtils'
import LevelRoadmap from './LevelRoadmap'
import soundManager from '../utils/soundManager'
import FrenchBulldog from './FrenchBulldog'
import BulldogCustomizer from './BulldogCustomizer'
import bulldogConfig from '../config/bulldogConfig.json'


interface StartPageProps {
  onStartGame: (withTimer: boolean, isDailyChallenge?: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
  musicEnabled: boolean
  soundEnabled: boolean
}

const PUPPY_PHRASES = [
  "Woof! Want to play a game? *tail wags* 🎮",
  "*excited bouncing* Match the tiles with me! ✨",
  "*happy panting* You're doing great! 🌟",
  "*playful bark* Ready for a challenge? 🎯",
  "*tilts head* Let's solve some puzzles! 🎲",
  "*perks ears* I smell high scores coming! 🌈",
  "*wiggles excitedly* Time for hexagon fun! 🔷",
  "*happy zoomies* Let's beat your record! ⭐",
  "*curious sniff* What level shall we try? 🎪",
  "*puppy eyes* Can we play together? 💫"
];

const StartPage: React.FC<StartPageProps> = ({ onStartGame, onMusicToggle, onSoundToggle, musicEnabled, soundEnabled }) => {
  const [showGameModes, setShowGameModes] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingGameMode, setPendingGameMode] = useState<boolean | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showUnlockables, setShowUnlockables] = useState(false)
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false)
  const playerProgress = getPlayerProgress()
  const [puppyPhrase, setPuppyPhrase] = useState(() => 
    PUPPY_PHRASES[Math.floor(Math.random() * PUPPY_PHRASES.length)]
  );
  const [customBulldogConfig, setCustomBulldogConfig] = useState(bulldogConfig);
  const [bulldogPosition, setBulldogPosition] = useState<{ y: number | null }>({ y: null });

  useEffect(() => {
    // Check for saved game on mount
    const savedGame = loadGameState()
    setHasSavedGame(!!savedGame)
  }, [])

  // Add effect to set initial position when menu loads
  useEffect(() => {
    const initializeBulldogPosition = () => {
      const menuContainer = document.querySelector('.game-menu-container');
      if (menuContainer) {
        const rect = menuContainer.getBoundingClientRect();
        const centerY = (rect.height - 160) / 2; // 160 is bulldog height
        setBulldogPosition({ y: centerY });
      }
    };

    // Set initial position
    initializeBulldogPosition();

    // Also handle window resize
    window.addEventListener('resize', initializeBulldogPosition);
    return () => window.removeEventListener('resize', initializeBulldogPosition);
  }, []);

  // Update the mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const menuContainer = document.querySelector('.game-menu-container');
      if (!menuContainer) return;

      const rect = menuContainer.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const targetY = Math.max(0, Math.min(rect.height - 160, relativeY));
      
      setBulldogPosition({ y: targetY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNewGame = (timedMode: boolean) => {
    if (hasSavedGame) {
      setShowConfirmModal(true)
      setPendingGameMode(timedMode)
    } else {
      onStartGame(timedMode, undefined)
    }
  }

  const handleContinueGame = () => {
    const savedGame = loadGameState()
    if (savedGame) {
      onStartGame(savedGame.timedMode, undefined)
    }
  }

  const handlePuppyClick = () => {
    const newPhrase = PUPPY_PHRASES[Math.floor(Math.random() * PUPPY_PHRASES.length)];
    setPuppyPhrase(newPhrase);
    
    // Add click animation
    const puppy = document.querySelector('.french-puppy');
    puppy?.classList.add('clicked');
    setTimeout(() => puppy?.classList.remove('clicked'), 500);
    
    if (soundEnabled) {
      soundManager.getInstance().playSound('puppy');
    }
  };

  if (showStatistics) {
    return <StatisticsPage onBack={() => setShowStatistics(false)} />
  }

  if (showTutorial) {
    return (
      <div className="start-page">
        <Game 
          musicEnabled={musicEnabled}
          soundEnabled={soundEnabled}
          timedMode={false}
          onGameOver={() => setShowTutorial(false)}
          tutorial={true}
          onExit={() => setShowTutorial(false)}
          onSkipTutorial={() => setShowTutorial(false)}
          onStartGame={(withTimer) => onStartGame(withTimer, undefined)}
          isLevelMode={false}
          onLevelComplete={() => {}}
          showLevelComplete={false}
        />
      </div>
    )
  }

  return (
    <div className="start-page">
      <div className="start-container">
        <h1 className="game-title">HEXMATCH</h1>
        <p className="welcome-text">Match the edges, clear the grid, beat the clock!</p>

        <div className="settings-bar">
          <div className="settings-group">
            <div className="setting-item">
              <label>Music</label>
              <button 
                className={`setting-button ${musicEnabled ? 'active' : ''}`}
                onClick={() => onMusicToggle(!musicEnabled)}
              >
                {musicEnabled ? '🎵 ON' : '🔇 OFF'}
              </button>
            </div>
            
            <div className="setting-item">
              <label>Sound FX</label>
              <button 
                className={`setting-button ${soundEnabled ? 'active' : ''}`}
                onClick={() => onSoundToggle(!soundEnabled)}
              >
                {soundEnabled ? '🔊 ON' : '🔈 OFF'}
              </button>
            </div>

            <div className="setting-item">
              <label>Accessibility</label>
              <AccessibilitySettings />
            </div>
          </div>
        </div>

        <div className="game-menu-container">
          <div className="game-start">
            {!showGameModes ? (
              <>
                {hasSavedGame && (
                  <button 
                    className="continue-button"
                    onClick={handleContinueGame}
                  >
                    Continue Game
                  </button>
                )}
                <button 
                  className="play-button" 
                  onClick={() => setShowGameModes(true)}
                >
                  PLAY
                </button>
                <button 
                  className="tutorial-button"
                  onClick={() => setShowTutorial(true)}
                >
                  Play Tutorial
                </button>
                <button 
                  className="stats-button"
                  onClick={() => setShowStatistics(true)}
                >
                  Statistics
                </button>
                <button 
                  className="achievements-button"
                  onClick={() => setShowAchievements(true)}
                >
                  Achievements
                </button>
                <button 
                  className="unlockables-button"
                  onClick={() => setShowUnlockables(true)}
                >
                  Unlockables
                </button>
              </>
            ) : (
              <div className="mode-selection">
                <button 
                  className="mode-button timed" 
                  onClick={() => handleNewGame(true)}
                >
                  <span className="mode-title">TIMED MODE</span>
                  <span className="mode-desc">Race against the clock</span>
                </button>
                
                <button 
                  className="mode-button zen" 
                  onClick={() => handleNewGame(false)}
                >
                  <span className="mode-title">ZEN MODE</span>
                  <span className="mode-desc">Play at your own pace</span>
                </button>

                <button 
                  className="mode-button roadmap" 
                  onClick={() => setShowLevelRoadmap(true)}
                >
                  <span className="mode-title">LEVEL ROADMAP</span>
                  <span className="mode-desc">Progress through levels</span>
                </button>

                <button 
                  className="mode-button daily" 
                  onClick={() => handleNewGame(false)}
                >
                  <span className="mode-title">DAILY CHALLENGE</span>
                  <span className="mode-desc">New puzzles every day!</span>
                </button>

                <button 
                  className="back-button"
                  onClick={() => setShowGameModes(false)}
                >
                  Back
                </button>
              </div>
            )}
          </div>
          
          {bulldogPosition.y !== null && (
            <FrenchBulldog
              onClick={handlePuppyClick}
              phrase={puppyPhrase}
              isClicked={false}
              customConfig={customBulldogConfig}
              onConfigChange={setCustomBulldogConfig}
              position={{ y: bulldogPosition.y }}
            />
          )}
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmModal
          message="Starting a new game will erase your saved progress. Continue?"
          onConfirm={() => {
            clearSavedGame()
            if (pendingGameMode !== null) {
              onStartGame(pendingGameMode)
            }
            setShowConfirmModal(false)
          }}
          onCancel={() => {
            setShowConfirmModal(false)
            setPendingGameMode(null)
          }}
        />
      )}

      {showAchievements && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowAchievements(false);
          }
        }}>
          <div className="modal-content achievements-modal">
            <AchievementsView />
          </div>
        </div>
      )}

      {showUnlockables && (
        <UnlockablesMenu
          onSelectTheme={(themeId) => {
            setTheme(themeId);
            setShowUnlockables(false);
          }}
          onSelectCompanion={(companionId: "default" | "cyber_cat" | "ghost" | "alien" | "dragon" | "unicorn" | "wizard" | "ninja" | "phoenix" | "octopus" | "crystal" | "star") => {
            setCompanion(companionId);
            setShowUnlockables(false);
          }}
          onClose={() => setShowUnlockables(false)}
        />
      )}

      {showLevelRoadmap && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLevelRoadmap(false);
          }
        }}>
          <div className="modal-content roadmap-modal">
            <div className="modal-header">
              <h2>Level Roadmap</h2>
            </div>
            <LevelRoadmap 
              currentPoints={playerProgress.points || 0} 
              onStartGame={(withTimer) => {
                clearSavedGame();
                setShowLevelRoadmap(false);
                onStartGame(withTimer);
              }}
            />
          </div>
        </div>
      )}

      <div className="customizer-container">
        <BulldogCustomizer 
          onConfigChange={setCustomBulldogConfig}
          currentConfig={customBulldogConfig}
        />
      </div>
    </div>
  )
}

export default StartPage 