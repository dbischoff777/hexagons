import { useState } from 'react'
import './StartPage.css'

interface StartPageProps {
  onStartGame: (withTimer: boolean) => void
  onMusicToggle: (enabled: boolean) => void
  onSoundToggle: (enabled: boolean) => void
}

const StartPage = ({ onStartGame, onMusicToggle, onSoundToggle }: StartPageProps) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

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
        <h1 className="game-title">HexMatch</h1>
        <p className="welcome-text">Match the edges, clear the grid, beat the clock!</p>
        
        <div className="controls">
          <button 
            className={`control-button ${isMusicEnabled ? 'enabled' : ''}`}
            onClick={handleMusicToggle}
          >
            {isMusicEnabled ? '🎵 Music On' : '🔇 Music Off'}
          </button>
          
          <button 
            className={`control-button ${isSoundEnabled ? 'enabled' : ''}`}
            onClick={handleSoundToggle}
          >
            {isSoundEnabled ? '🔊 Sound On' : '🔈 Sound Off'}
          </button>
        </div>

        <div className="game-modes">
          <button 
            className="start-button timed-mode" 
            onClick={() => onStartGame(true)}
          >
            Timed Mode
            <span className="mode-desc">Race against the clock!</span>
          </button>
          
          <button 
            className="start-button zen-mode" 
            onClick={() => onStartGame(false)}
          >
            Zen Mode
            <span className="mode-desc">Play at your own pace</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartPage 