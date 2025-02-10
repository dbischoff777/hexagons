import React, { useEffect, useState } from 'react';
import './BadgePopup.css';
import { Badge } from '../types/progression';

interface BadgePopupProps {
  badge: Badge;
  onComplete: () => void;
}

const BadgePopup: React.FC<BadgePopupProps> = ({ badge, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 3000);
  }, [onComplete]);

  return (
    <div className={`badge-popup ${isVisible ? 'visible' : ''}`}>
      <div className="badge-content">
        <div className="badge-icon">{badge.icon}</div>
        <div className="badge-info">
          <h3>{badge.name}</h3>
          <p>{badge.description}</p>
        </div>
      </div>
    </div>
  );
};

export default BadgePopup; 