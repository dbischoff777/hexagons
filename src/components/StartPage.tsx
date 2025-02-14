import React, { useState, useEffect } from 'react'
import './StartPage.css'
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
import bulldogConfig from '../config/bulldogConfig.json'
import CustomizeBuddyMenu from './CustomizeBuddyMenu'
import SettingsModal from './SettingsModal'
import PageTransition from './PageTransition'

interface StartPageProps {
  onStartGame: (withTimer: boolean, isDailyChallenge?: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
  musicEnabled: boolean
  soundEnabled: boolean
  rotationEnabled: boolean
  onRotationToggle: (enabled: boolean) => void
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

const BUTTON_HOVER_PHRASES = {
  play: [
    "*excited bouncing* Let's play! Let's play! 🎮",
    "*tail wagging frantically* Yes! Game time! ✨",
  ],
  continue: [
    "*perks up* Oh! We can continue our last game! 🎯",
    "*happy dance* Back to where we left off! 🎲",
  ],
  tutorial: [
    "*tilts head curiously* I can teach you how to play! 📚",
    "*attentive pose* I'm a great teacher, I promise! 🎓",
  ],
  statistics: [
    "*proud stance* Look at all your achievements! 📊",
    "*scholarly nod* The numbers look great! 📈",
  ],
  achievements: [
    "*shows off medals* We've earned so many together! 🏆",
    "*proud strut* Look at our collection! ⭐",
  ],
  unlockables: [
    "*playful spin* Ooh, what should we unlock next? 🎁",
    "*excited panting* So many treasures to discover! 💎",
  ],
  customize: [
    "*preens proudly* Want to help style my look? 🎨",
    "*excited tail wag* Ooh, makeover time! ✨",
    "*playful spin* Let's try something new! 🎀"
  ],
  timed: [
    "*alert stance* Ready to race against time! ⏱️",
    "*focused gaze* We can beat the clock together! ⚡",
  ],
  zen: [
    "*relaxed pose* Take your time, no pressure! 🌸",
    "*peaceful smile* Zen mode is so relaxing... 🍃",
  ],
  roadmap: [
    "*adventurous pose* What level shall we conquer? 🗺️",
    "*excited jumping* Let's climb to the top! 🏔️",
  ],
  daily: [
    "*morning stretch* A fresh challenge awaits! 🌅",
    "*eager bounce* I love daily puzzles! 🎯",
  ],
  settings: [
    "*curious tilt* Want to adjust something? ⚙️",
    "*helpful pose* I can help with settings! 🔧",
  ],
};

const StartPage: React.FC<StartPageProps> = ({
  onStartGame,
  onMusicToggle,
  onSoundToggle,
  musicEnabled,
  soundEnabled,
  rotationEnabled,
  onRotationToggle
}) => {
  const [showGameModes, setShowGameModes] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingGameMode, setPendingGameMode] = useState<boolean | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)
  const [showUnlockables, setShowUnlockables] = useState(false)
  const [showLevelRoadmap, setShowLevelRoadmap] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const playerProgress = getPlayerProgress()
  const [puppyPhrase, setPuppyPhrase] = useState(() => 
    PUPPY_PHRASES[Math.floor(Math.random() * PUPPY_PHRASES.length)]
  )
  const [customBulldogConfig, setCustomBulldogConfig] = useState(bulldogConfig)
  const [bulldogPosition, setBulldogPosition] = useState<{ y: number | null }>({ y: null })
  const [isTutorialExiting, setIsTutorialExiting] = useState(false)

  useEffect(() => {
    const savedGame = loadGameState()
    setHasSavedGame(!!savedGame)
  }, [])

  useEffect(() => {
    const initializeBulldogPosition = () => {
      const menuContainer = document.querySelector('.game-menu-container')
      if (menuContainer) {
        const rect = menuContainer.getBoundingClientRect()
        const centerY = (rect.height - 160) / 2
        setBulldogPosition({ y: centerY })
      }
    }

    initializeBulldogPosition()
    window.addEventListener('resize', initializeBulldogPosition)
    return () => window.removeEventListener('resize', initializeBulldogPosition)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const menuContainer = document.querySelector('.game-menu-container')
      if (!menuContainer) return

      const rect = menuContainer.getBoundingClientRect()
      const relativeY = e.clientY - rect.top
      const targetY = Math.max(0, Math.min(rect.height - 160, relativeY))
      
      setBulldogPosition({ y: targetY })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
    const newPhrase = PUPPY_PHRASES[Math.floor(Math.random() * PUPPY_PHRASES.length)]
    setPuppyPhrase(newPhrase)
    
    const puppy = document.querySelector('.french-puppy')
    puppy?.classList.add('clicked')
    setTimeout(() => puppy?.classList.remove('clicked'), 500)
    
    if (soundEnabled) {
      soundManager.getInstance().playSound('puppy')
    }
  }

  const handleButtonHover = (buttonType: keyof typeof BUTTON_HOVER_PHRASES) => {
    const phrases = BUTTON_HOVER_PHRASES[buttonType]
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    setPuppyPhrase(randomPhrase)
  }

  const handleCloseTutorial = () => {
    setIsTutorialExiting(true)
    setTimeout(() => {
      setShowTutorial(false)
      setIsTutorialExiting(false)
    }, 300) // Match this with your transition duration
  }

  if (showStatistics) {
    return <StatisticsPage onBack={() => setShowStatistics(false)} />
  }

  if (showTutorial) {
    return (
      <PageTransition isExiting={isTutorialExiting}>
        <Game 
          musicEnabled={musicEnabled}
          soundEnabled={soundEnabled}
          timedMode={false}
          onGameOver={handleCloseTutorial}
          tutorial={true}
          onExit={handleCloseTutorial}
          onSkipTutorial={handleCloseTutorial}
          onStartGame={(withTimer) => onStartGame(withTimer, undefined)}
          isLevelMode={false}
          onLevelComplete={() => {}}
          showLevelComplete={false}
          rotationEnabled={rotationEnabled}
        />
      </PageTransition>
    )
  }

  return (
    <div className="start-page">
      <div className="start-container">
        <h1 className="game-title">HEXMATCH</h1>
        <p className="welcome-text">Match the edges, clear the grid, beat the clock!</p>

        <div className="game-menu-container">
          <div className="game-start">
            {!showGameModes ? (
              <>
                {hasSavedGame && (
                  <button 
                    className="continue-button"
                    onClick={handleContinueGame}
                    onMouseEnter={() => handleButtonHover('continue')}
                  >
                    ▶️ Continue Game
                  </button>
                )}
                <button 
                  className="play-button" 
                  onClick={() => setShowGameModes(true)}
                  onMouseEnter={() => handleButtonHover('play')}
                >
                  🎮 PLAY
                </button>
                <button 
                  className="tutorial-button"
                  onClick={() => setShowTutorial(true)}
                  onMouseEnter={() => handleButtonHover('tutorial')}
                >
                  📖 Play Tutorial
                </button>
                <button 
                  className="stats-button"
                  onClick={() => setShowStatistics(true)}
                  onMouseEnter={() => handleButtonHover('statistics')}
                >
                  📊 Statistics
                </button>
                <button 
                  className="achievements-button"
                  onClick={() => setShowAchievements(true)}
                  onMouseEnter={() => handleButtonHover('achievements')}
                >
                  🏆 Achievements
                </button>
                <div className="button-group">
                  <button 
                    className="unlockables-button"
                    onClick={() => setShowUnlockables(true)}
                    onMouseEnter={() => handleButtonHover('unlockables')}
                  >
                    🎁 Unlocks
                  </button>
                  <button 
                    className="customize-button"
                    onClick={() => setShowCustomize(true)}
                    onMouseEnter={() => handleButtonHover('customize')}
                  >
                    🎨 Customize
                  </button>
                </div>
                <button 
                  className="settings-button-fixed"
                  onClick={() => setShowSettings(true)}
                  onMouseEnter={() => handleButtonHover('settings')}
                >
                  ⚙️ Settings
                </button>
              </>
            ) : (
              <div className="mode-selection">
                <button 
                  className="mode-button timed" 
                  onClick={() => handleNewGame(true)}
                  onMouseEnter={() => handleButtonHover('timed')}
                >
                  <span className="mode-title">⏱️ TIMED MODE</span>
                  <span className="mode-desc">Race against the clock</span>
                </button>
                
                <button 
                  className="mode-button zen" 
                  onClick={() => handleNewGame(false)}
                  onMouseEnter={() => handleButtonHover('zen')}
                >
                  <span className="mode-title">🍃 ZEN MODE</span>
                  <span className="mode-desc">Play at your own pace</span>
                </button>

                <button 
                  className="mode-button roadmap" 
                  onClick={() => setShowLevelRoadmap(true)}
                  onMouseEnter={() => handleButtonHover('roadmap')}
                >
                  <span className="mode-title">🗺️ LEVEL ROADMAP</span>
                  <span className="mode-desc">Progress through levels</span>
                </button>

                <button 
                  className="mode-button daily" 
                  onClick={() => handleNewGame(false)}
                  onMouseEnter={() => handleButtonHover('daily')}
                >
                  <span className="mode-title">📅 DAILY CHALLENGE</span>
                  <span className="mode-desc">New puzzles every day!</span>
                </button>

                <button 
                  className="back-button"
                  onClick={() => setShowGameModes(false)}
                  onMouseEnter={() => setPuppyPhrase(PUPPY_PHRASES[Math.floor(Math.random() * PUPPY_PHRASES.length)])}
                >
                  ↩️ Back
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
              alwaysShowSpeech={true}
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
            setShowAchievements(false)
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
            setTheme(themeId)
            setShowUnlockables(false)
          }}
          onSelectCompanion={(companionId) => {
            setCompanion(companionId)
            setShowUnlockables(false)
          }}
          onClose={() => setShowUnlockables(false)}
        />
      )}

      {showCustomize && (
        <CustomizeBuddyMenu
          onClose={() => setShowCustomize(false)}
          onCustomizeChange={setCustomBulldogConfig}
          currentBulldogConfig={customBulldogConfig}
        />
      )}

      {showLevelRoadmap && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowLevelRoadmap(false)
          }
        }}>
          <div className="modal-content roadmap-modal">
            <div className="modal-header">
              <h2>Level Roadmap</h2>
            </div>
            <LevelRoadmap 
              currentPoints={playerProgress.points || 0} 
              onStartGame={(withTimer) => {
                clearSavedGame()
                setShowLevelRoadmap(false)
                onStartGame(withTimer)
              }}
            />
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        musicEnabled={musicEnabled}
        soundEnabled={soundEnabled}
        rotationEnabled={rotationEnabled}
        onMusicToggle={onMusicToggle}
        onSoundToggle={onSoundToggle}
        onRotationToggle={onRotationToggle}
      />
    </div>
  )
}

export default StartPage