import React, { useEffect, useState } from 'react';
import { UnlockableReward } from '../types/progression';
import './LevelUpNotification.css';

interface LevelUpNotificationProps {
  level: number;
  unlockedRewards: UnlockableReward[];
  onComplete: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ level, unlockedRewards, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for animation to complete before removal
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`level-up-notification ${!isVisible ? 'hiding' : ''}`}>
      <h2>Level Up! 🎉</h2>
      <div className="level-number">Level {level}</div>
      {unlockedRewards.length > 0 && (
        <div className="unlocked-items">
          <h3>New Unlocks!</h3>
          {unlockedRewards.map(reward => (
            <div key={reward.id} className="unlocked-item">
              <span className="item-icon">
                {reward.type === 'tile' ? '🎲' : '🎨'}
              </span>
              <div className="item-info">
                <div className="item-name">{reward.name}</div>
                <div className="item-desc">{reward.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LevelUpNotification; 