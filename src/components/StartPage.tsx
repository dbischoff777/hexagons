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
            <button 
              className="play-button" 
              onClick={() => setShowGameModes(true)}
            >
              PLAY
            </button>
          ) : (
            <div className="mode-selection">
              <button 
                className="mode-button timed" 
                onClick={() => onStartGame(true)}
              >
                <span className="mode-title">TIMED MODE</span>
                <span className="mode-desc">Race against the clock</span>
              </button>
              
              <button 
                className="mode-button zen" 
                onClick={() => onStartGame(false)}
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