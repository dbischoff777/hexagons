import React, { useState, useRef, useEffect } from 'react'
import { useAccessibility } from '../contexts/AccessibilityContext'
import './AccessibilitySettings.css'

const AccessibilitySettings: React.FC = () => {
  const { settings, updateSettings } = useAccessibility()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const toggleColorBlindMode = (enabled: boolean) => {
    updateSettings({ 
      isColorBlind: enabled,
      showEdgeNumbers: enabled,
      showMatchHints: settings.showMatchHints
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="dropdown-menu" ref={menuRef}>
      <button 
        className="option-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        👁️ Options
      </button>

      {isOpen && (
        <div className="dropdown-content">
          <label className="dropdown-item">
            <input
              type="checkbox"
              checked={settings.isColorBlind}
              onChange={e => toggleColorBlindMode(e.target.checked)}
            />
            <span>Color Blind Mode</span>
          </label>

          <label className="dropdown-item">
            <input
              type="checkbox"
              checked={settings.showMatchHints}
              onChange={e => updateSettings({ ...settings, showMatchHints: e.target.checked })}
            />
            <span>Show Match Hints</span>
          </label>
        </div>
      )}
    </div>
  )
}

export default AccessibilitySettings 