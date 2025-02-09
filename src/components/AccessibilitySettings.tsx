import React, { useState, useRef, useEffect } from 'react'
import './AccessibilitySettings.css'
import { useAccessibility } from '../contexts/AccessibilityContext'

const AccessibilitySettings = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSettings } = useAccessibility()
  const menuRef = useRef<HTMLDivElement>(null)

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
    <div className="accessibility-container" ref={menuRef}>
      <button 
        className={`setting-button ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        ⚙️ Settings
      </button>

      {isOpen && (
        <div className="accessibility-popup">
          <div className="setting-option">
            <div className="setting-header">
              <label>
                <input
                  type="checkbox"
                  checked={settings.isColorBlind}
                  onChange={(e) => updateSettings({ isColorBlind: e.target.checked })}
                />
                Color Blind Mode
              </label>
              <div className="setting-preview">
                <div className="preview-tile colorblind">
                  <span>● ■ ▲</span>
                  <small>Uses distinct symbols</small>
                </div>
                <div className="preview-tile normal">
                  <span style={{ background: 'linear-gradient(45deg, #FF1177, #00FF9F, #4D4DFF)' }}>
                    Colors
                  </span>
                  <small>Normal mode</small>
                </div>
              </div>
            </div>
          </div>

          <div className="setting-option">
            <div className="setting-header">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showMatchHints}
                  onChange={(e) => updateSettings({ showMatchHints: e.target.checked })}
                />
                Show Match Hints
              </label>
              <div className="setting-preview">
                <div className="preview-hint">
                  <span className="hint-indicator">🟢</span>
                  <small>Shows possible matches</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccessibilitySettings 