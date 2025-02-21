import React, { useEffect, useState } from 'react'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { getPlayerProgress, getTheme } from '../utils/progressionUtils'
import { DEFAULT_SCHEME } from '../utils/colorSchemes'
import './SpringModal.css'

interface SpringModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string | React.ReactElement
  variant?: 'default' | 'danger'
  children?: React.ReactNode
}

const SpringModal: React.FC<SpringModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  children,
  variant = 'default'
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const { settings } = useAccessibility()
  const isColorBlind = settings.isColorBlind
  const playerProgress = getPlayerProgress()
  const theme = getTheme(playerProgress.selectedTheme || 'default')

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsAnimating(true)
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setIsVisible(false), 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  return (
    <div 
      className={`spring-modal__overlay ${isAnimating ? 'active' : 'exit'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-secondary': isColorBlind ? DEFAULT_SCHEME.colors.secondary : theme.colors.secondary,
        '--theme-accent': isColorBlind ? DEFAULT_SCHEME.colors.accent : theme.colors.accent,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--theme-text': isColorBlind ? DEFAULT_SCHEME.colors.text : theme.colors.text,
      } as React.CSSProperties}
    >
      <div className={`spring-modal__content ${isAnimating ? 'active' : 'exit'} ${variant}`}>
        <div className="spring-modal__header">
          <h2 className="spring-modal__title">{title}</h2>
        </div>
        {message && (
          <p className="spring-modal__message">{message}</p>
        )}
        <div className="spring-modal__body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default SpringModal 