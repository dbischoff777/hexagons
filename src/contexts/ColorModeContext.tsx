import React, { createContext, useContext, useState } from 'react'
import { ColorModeState } from '../types/colors'
import { DEFAULT_SCHEME, COLORBLIND_SCHEME } from '../utils/colorSchemes'

const ColorModeContext = createContext<{
  colorMode: ColorModeState
  toggleColorMode: () => void
}>({
  colorMode: {
    isColorBlind: false,
    currentScheme: DEFAULT_SCHEME
  },
  toggleColorMode: () => {}
})

export const useColorMode = () => useContext(ColorModeContext)

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorMode, setColorMode] = useState<ColorModeState>({
    isColorBlind: false,
    currentScheme: DEFAULT_SCHEME
  })

  const toggleColorMode = () => {
    setColorMode(prev => ({
      isColorBlind: !prev.isColorBlind,
      currentScheme: !prev.isColorBlind ? COLORBLIND_SCHEME : DEFAULT_SCHEME
    }))
  }

  return (
    <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  )
} 