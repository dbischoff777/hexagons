import { useState } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isTimedMode, setIsTimedMode] = useState(true)

  if (!gameStarted) {
    return (
      <StartPage 
        onStartGame={(withTimer) => {
          setIsTimedMode(withTimer)
          setGameStarted(true)
        }}
        onMusicToggle={setIsMusicEnabled}
        onSoundToggle={setIsSoundEnabled}
      />
    )
  }

  return (
    <Game 
      musicEnabled={isMusicEnabled} 
      soundEnabled={isSoundEnabled}
      timedMode={isTimedMode}
    />
  )
}

export default App
