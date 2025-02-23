import React from 'react'
import './ConfirmModal.css'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { getPlayerProgress, getTheme } from '../utils/progressionUtils'
import { DEFAULT_SCHEME } from '../utils/colorSchemes'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const playerProgress = getPlayerProgress();
  const theme = getTheme(playerProgress.selectedTheme || 'default');

  return (
    <div 
      className="modal-overlay"
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--scrollbar-thumb': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--scrollbar-track': `${isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background}40`,
        '--scrollbar-hover': `${isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary}CC`,
      } as React.CSSProperties}
    >
      <div className="modal-content">
        <p>{message}</p>
        <div className="modal-buttons">
          <button 
            className="modal-button cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="modal-button confirm"
            onClick={onConfirm}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal 