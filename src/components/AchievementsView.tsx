import React from 'react';
import { getAchievements, resetAchievements } from '../utils/achievementUtils';
import './AchievementsView.css';

const AchievementsView: React.FC = () => {
  const { achievements, totalTilesPlaced } = getAchievements();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
      resetAchievements();
      window.location.reload(); // Refresh to show updated state
    }
  };

  return (
    <div className="achievements-view">
      <h2>Achievements</h2>
      <div className="achievements-stats">
        <div className="stat">
          <span className="stat-label">Total Tiles Placed:</span>
          <span className="stat-value">{totalTilesPlaced}</span>
        </div>
        <button className="reset-achievements-button" onClick={handleReset}>
          Reset Achievements
        </button>
      </div>
      <div className="achievements-grid">
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`achievement-card ${achievement.achieved ? 'achieved' : ''}`}
          >
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-info">
              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>
              <div className="achievement-progress">
                <div 
                  className="progress-bar"
                  style={{ 
                    width: `${Math.min(100, ((Math.min(achievement.currentProgress, achievement.requirement)) / achievement.requirement) * 100)}%`
                  }}
                />
                <span className="progress-text">
                  {Math.min(achievement.currentProgress, achievement.requirement)} / {achievement.requirement}
                </span>
              </div>
              {achievement.achieved && achievement.timestamp && (
                <div className="achievement-date">
                  Achieved: {new Date(achievement.timestamp).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsView; 