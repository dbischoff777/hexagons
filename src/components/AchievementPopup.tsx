import React, { useEffect, useState } from 'react';
import './AchievementPopup.css';
import { Achievement } from '../types/achievements';

interface AchievementPopupProps {
  achievement: Achievement;
  onComplete: () => void;
}

const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievement, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`achievement-popup ${isVisible ? 'visible' : ''}`}>
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-content">
        <h3>Achievement Unlocked!</h3>
        <h4>{achievement.name}</h4>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
};

export default AchievementPopup; 