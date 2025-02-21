import React from 'react'
import { getStatistics } from '../utils/gameStateUtils'
import CustomCursor from './CustomCursor'
import './StatisticsPage.css'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { getPlayerProgress, getTheme } from '../utils/progressionUtils'
import { DEFAULT_SCHEME } from '../utils/colorSchemes'

interface StatisticsPageProps {
  onBack: () => void
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ onBack }) => {
  const stats = getStatistics()
  const { settings } = useAccessibility()
  const isColorBlind = settings.isColorBlind
  const playerProgress = getPlayerProgress()
  const theme = getTheme(playerProgress.selectedTheme || 'default')

  const averageScore = stats.gamesPlayed > 0 
    ? Math.round(stats.totalScore / stats.gamesPlayed) 
    : 0;

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only close if clicking the background, not the content
    if (e.target === e.currentTarget) {
      onBack()
    }
  }

  return (
    <div 
      className="statistics-page" 
      onClick={handleBackgroundClick}
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-secondary': isColorBlind ? DEFAULT_SCHEME.colors.secondary : theme.colors.secondary,
        '--theme-accent': isColorBlind ? DEFAULT_SCHEME.colors.accent : theme.colors.accent,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--theme-text': isColorBlind ? DEFAULT_SCHEME.colors.text : theme.colors.text,
      } as React.CSSProperties}
    >
      <CustomCursor 
        color={isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary}
        hide={false}
      />
      <div className="stats-content">
        <h1>Statistics</h1>
        
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <label>High Score</label>
              <span>{stats.highScore}</span>
            </div>
            <div className="stat-item">
              <label>Games Played</label>
              <span>{stats.gamesPlayed}</span>
            </div>
            <div className="stat-item">
              <label>Average Score</label>
              <span>{averageScore}</span>
            </div>
            <div className="stat-item">
              <label>Longest Combo</label>
              <span>{stats.longestCombo}</span>
            </div>
            <div className="stat-item">
              <label>Total Play Time</label>
              <span>{Math.round(stats.totalPlayTime / 60)} mins</span>
            </div>
            <div className="stat-item">
              <label>Last Played</label>
              <span>{new Date(stats.lastPlayed).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPage 