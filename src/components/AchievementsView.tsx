import React from 'react';
import { getAchievements } from '../utils/achievementUtils';
import './AchievementsView.css';

const AchievementsView: React.FC = () => {
  const { achievements, totalTilesPlaced } = getAchievements();

  return (
    <div className="achievements-view">
      <h2>Achievements</h2>
      <div className="achievements-stats">
        <div className="stat">
          <span className="stat-label">Total Tiles Placed:</span>
          <span className="stat-value">{totalTilesPlaced}</span>
        </div>
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
                    width: `${Math.min(100, (achievement.currentProgress / achievement.requirement) * 100)}%`
                  }}
                />
                <span className="progress-text">
                  {achievement.currentProgress} / {achievement.requirement}
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