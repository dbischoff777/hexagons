import { useState } from 'react'
import './StartPage.css'

interface StartPageProps {
  onStartGame: () => void
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

        <button className="start-button" onClick={onStartGame}>
          Start Game
        </button>
      </div>
    </div>
  )
}

export default StartPage 