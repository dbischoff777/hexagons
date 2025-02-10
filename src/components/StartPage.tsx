import React, { useState, useEffect } from 'react'
import './StartPage.css'
import AccessibilitySettings from './AccessibilitySettings'
import Game from './Game'
import { loadGameState, clearSavedGame } from '../utils/gameStateUtils'
import StatisticsPage from './StatisticsPage'
import ConfirmModal from './ConfirmModal'
import AchievementsView from './AchievementsView'


interface StartPageProps {
  onStartGame: (withTimer: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
  musicEnabled: boolean
  soundEnabled: boolean
}

const StartPage: React.FC<StartPageProps> = ({ onStartGame, onMusicToggle, onSoundToggle, musicEnabled, soundEnabled }) => {
  const [showGameModes, setShowGameModes] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingGameMode, setPendingGameMode] = useState<boolean | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)

  useEffect(() => {
    // Check for saved game on mount
    const savedGame = loadGameState()
    setHasSavedGame(!!savedGame)
  }, [])

  const handleNewGame = (timedMode: boolean) => {
    if (hasSavedGame) {
      setShowConfirmModal(true)
      setPendingGameMode(timedMode)
    } else {
      onStartGame(timedMode)
    }
  }

  const handleContinueGame = () => {
    const savedGame = loadGameState()
    if (savedGame) {
      onStartGame(savedGame.timedMode)
    }
  }

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
            </div>
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
          <div className="modal-content">
            <AchievementsView />
          </div>
        </div>
      )}
    </div>
  )
}

export default StartPage 