import React, { useState, useEffect } from 'react'
import './StartPage.css'
import AccessibilitySettings from './AccessibilitySettings'
import Game from './Game'
import { GameStatistics } from '../types'
import { getStatistics, loadGameState, clearSavedGame } from '../utils/gameStateUtils'
import StatisticsPage from './StatisticsPage'

interface StartPageProps {
  onStartGame: (withTimer: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
  onStartTutorial: () => void
}

const StartPage: React.FC<StartPageProps> = ({ onStartGame, onMusicToggle, onSoundToggle, onStartTutorial }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [showGameModes, setShowGameModes] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStatistics, setShowStatistics] = useState(false)
  const [hasSavedGame, setHasSavedGame] = useState(false)

  useEffect(() => {
    // Check for saved game on mount
    const savedGame = loadGameState()
    setHasSavedGame(!!savedGame)
  }, [])

  const handleNewGame = (timedMode: boolean) => {
    if (hasSavedGame) {
      if (window.confirm('Starting a new game will erase your saved progress. Continue?')) {
        clearSavedGame()
        onStartGame(timedMode)
      }
    } else {
      onStartGame(timedMode)
    }
  }

  const handleContinueGame = () => {
    const savedGame = loadGameState()
    if (savedGame) {
      onStartGame(false) // or check saved game mode
    }
  }

  if (showStatistics) {
    return <StatisticsPage onBack={() => setShowStatistics(false)} />
  }

  if (showTutorial) {
    return (
      <div className="start-page">
        <Game 
          musicEnabled={isMusicEnabled}
          soundEnabled={isSoundEnabled}
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
                className={`setting-button ${isMusicEnabled ? 'active' : ''}`}
                onClick={() => {
                  setIsMusicEnabled(!isMusicEnabled)
                  onMusicToggle(!isMusicEnabled)
                }}
              >
                {isMusicEnabled ? '🎵 ON' : '🔇 OFF'}
              </button>
            </div>
            
            <div className="setting-item">
              <label>Sound FX</label>
              <button 
                className={`setting-button ${isSoundEnabled ? 'active' : ''}`}
                onClick={() => {
                  setIsSoundEnabled(!isSoundEnabled)
                  onSoundToggle(!isSoundEnabled)
                }}
              >
                {isSoundEnabled ? '🔊 ON' : '🔈 OFF'}
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
    </div>
  )
}

export default StartPage 