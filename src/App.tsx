import { useState } from 'react'
import './App.css'
import Game from './components/Game'
import StartPage from './components/StartPage'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [isMusicEnabled, setIsMusicEnabled] = useState(true)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)

  if (!gameStarted) {
    return (
      <StartPage 
        onStartGame={() => setGameStarted(true)}
        onMusicToggle={setIsMusicEnabled}
        onSoundToggle={setIsSoundEnabled}
      />
    )
  }

  return <Game musicEnabled={isMusicEnabled} soundEnabled={isSoundEnabled} />
}

export default App
