import React, { createContext, useContext, useState } from 'react'

export interface AccessibilitySettings {
  isColorBlind: boolean;
  showMatchHints: boolean;
  showLabels: boolean;
  showEdgeNumbers: boolean;
  usePatterns: boolean;
}

const defaultSettings: AccessibilitySettings = {
  isColorBlind: false,
  showEdgeNumbers: false,
  showMatchHints: false,
  usePatterns: true,
  showLabels: true
}

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings
  updateSettings: (settings: Partial<AccessibilitySettings>) => void
}>({
  settings: defaultSettings,
  updateSettings: () => {}
})

export const useAccessibility = () => useContext(AccessibilityContext)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  )
} 