import React from 'react'
import { useColorMode } from '../contexts/ColorModeContext'
import './ColorModeToggle.css'

const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <button 
      className="color-mode-toggle"
      onClick={toggleColorMode}
      aria-label="Toggle color blind mode"
    >
      {colorMode.isColorBlind ? '👁️ Color Blind Mode' : '👁️ Normal Mode'}
    </button>
  )
}

export default ColorModeToggle 