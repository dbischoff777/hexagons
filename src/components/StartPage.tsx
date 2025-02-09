import React, { useState } from 'react'
import './StartPage.css'
import AccessibilitySettings from './AccessibilitySettings'

interface StartPageProps {
  onStartGame: (withTimer: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
}

const StartPage: React.FC<StartPageProps> = ({ onStartGame, onMusicToggle, onSoundToggle }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [showGameModes, setShowGameModes] = useState(false)

  const handleMusicToggle = () => {
    setIsMusicEnabled(!isMusicEnabled)
    onMusicToggle(!isMusicEnabled)
  }

  const handleSoundToggle = () => {
    setIsSoundEnabled(!isSoundEnabled)
    onSoundToggle(!isSoundEnabled)
  }

  return (
    <div className="start-page">
      <div className="start-container">
        <h1 className="game-title">HEXMATCH</h1>
        <p className="welcome-text">Match the edges, clear the grid, beat the clock!</p>

        <div className="button-group">
          <button 
            className={`option-button ${isMusicEnabled ? 'enabled' : ''}`}
            onClick={handleMusicToggle}
          >
            {isMusicEnabled ? '🎵 Music On' : '🔇 Music Off'}
          </button>
          
          <button 
            className={`option-button ${isSoundEnabled ? 'enabled' : ''}`}
            onClick={handleSoundToggle}
          >
            {isSoundEnabled ? '🔊 Sound On' : '🔈 Sound Off'}
          </button>

          <AccessibilitySettings />
        </div>

        {!showGameModes ? (
          <button 
            className="start-button" 
            onClick={() => setShowGameModes(true)}
          >
            Play Game
          </button>
        ) : (
          <div className="game-modes">
            <button 
              className="mode-button timed" 
              onClick={() => onStartGame(true)}
            >
              Timed Mode
              <span className="mode-desc">Race against the clock!</span>
            </button>
            
            <button 
              className="mode-button zen" 
              onClick={() => onStartGame(false)}
            >
              Zen Mode
              <span className="mode-desc">Play at your own pace</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StartPage 