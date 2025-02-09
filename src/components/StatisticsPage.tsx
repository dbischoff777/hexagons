import React from 'react'
import { GameStatistics } from '../types'
import { getStatistics } from '../utils/gameStateUtils'
import './StatisticsPage.css'

interface StatisticsPageProps {
  onBack: () => void
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ onBack }) => {
  const stats = getStatistics()

  return (
    <div className="statistics-page">
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
            <span>{stats.averageScore}</span>
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

      <button className="back-button" onClick={onBack}>
        Back to Menu
      </button>
    </div>
  )
}

export default StatisticsPage 