import React, { useEffect, useState } from 'react';
import { Achievement } from '../types/achievements';
import './AchievementPopup.css';
import SoundManager from '../utils/soundManager';

interface AchievementPopupProps {
  achievement: Achievement;
  onComplete: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Play sound and show popup
    SoundManager.getInstance().playSound('powerUp');
    setIsVisible(true);
    console.log('Achievement popup shown:', achievement.name);
    
    // Start hiding after 2.7s (matches CSS animation timing)
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Call onComplete after animation finishes
      setTimeout(onComplete, 300);
    }, 2700);

    return () => clearTimeout(timer);
  }, [onComplete, achievement]);

  return (
    <div className={`achievement-popup ${isVisible ? 'visible' : ''}`}>
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