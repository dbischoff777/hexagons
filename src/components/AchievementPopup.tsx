import React, { useEffect } from 'react';
import { Achievement } from '../types/achievements';
import './AchievementsView.css';
import SoundManager from '../utils/soundManager';

interface AchievementPopupProps {
  achievement: Achievement;
  onComplete: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onComplete }) => {
  useEffect(() => {
    // Play sound when achievement appears
    SoundManager.getInstance().playSound('powerUp');
    console.log('Achievement popup shown:', achievement.name);
    
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete, achievement]);

  return (
    <div className="achievement-popup">
      <div className="achievement-popup-header">
        <span className="achievement-popup-icon">{achievement.icon}</span>
        <h3 className="achievement-popup-title">Achievement Unlocked!</h3>
      </div>
      <p className="achievement-popup-desc">{achievement.name}</p>
      <p className="achievement-popup-subdesc">{achievement.description}</p>
    </div>
  );
};

export default AchievementPopup; 