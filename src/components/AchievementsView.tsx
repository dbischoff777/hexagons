import React from 'react';
import { Achievement } from '../types/achievements';
import { getAchievements, resetAchievements } from '../utils/achievementUtils';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { getPlayerProgress, getTheme } from '../utils/progressionUtils';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import './AchievementsView.css';

interface AchievementsViewProps {
  onClose: () => void;
}

const AchievementsView: React.FC<AchievementsViewProps> = ({ onClose }) => {
  const achievementState = getAchievements();
  const { achievements } = achievementState;
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const playerProgress = getPlayerProgress();
  const theme = getTheme(playerProgress.selectedTheme || 'default');

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
      resetAchievements();
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="achievements-view"
      onClick={handleOverlayClick}
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-secondary': isColorBlind ? DEFAULT_SCHEME.colors.secondary : theme.colors.secondary,
        '--theme-accent': isColorBlind ? DEFAULT_SCHEME.colors.accent : theme.colors.accent,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--theme-text': isColorBlind ? DEFAULT_SCHEME.colors.text : theme.colors.text,
        '--scrollbar-thumb': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--scrollbar-track': `${theme.colors.background}66`,
        '--scrollbar-hover': isColorBlind ? `${DEFAULT_SCHEME.colors.primary}CC` : `${theme.colors.primary}CC`
      } as React.CSSProperties}
    >
      <h2>Achievements</h2>
      
      <div className="achievements-stats">
        <div className="stat">
          <span className="stat-label">Total Achievements</span>
          <span className="stat-value">{achievements.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Completed</span>
          <span className="stat-value">
            {achievements.filter((a: Achievement) => a.achieved).length}
          </span>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((achievement: Achievement) => (
          <div 
            key={achievement.id} 
            className={`achievement-card ${achievement.achieved ? 'achieved' : 'locked'}`}
          >
            <div className="achievement-icon">
              {achievement.icon}
            </div>
            <div className="achievement-info">
              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>
              {achievement.currentProgress !== undefined && achievement.requirement !== undefined && (
                <div className="achievement-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${(achievement.currentProgress / achievement.requirement) * 100}%` }}
                  />
                  <div className="progress-text">
                    {achievement.currentProgress} / {achievement.requirement}
                  </div>
                </div>
              )}
              {achievement.achieved && achievement.dateAwarded && (
                <div className="achievement-date">
                  Achieved on {new Date(achievement.dateAwarded).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="reset-achievements-button" onClick={handleReset}>
        Reset Achievements
      </button>
    </div>
  );
};

export default AchievementsView; 