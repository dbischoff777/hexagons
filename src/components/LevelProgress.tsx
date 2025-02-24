import React, { useState, useEffect } from 'react';
import './LevelProgress.css';
import { getTheme, getPlayerProgress } from '../utils/progressionUtils';

interface LevelProgressProps {
  level: number;
  experience: number;
  nextLevelXP: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ 
  level, 
  experience, 
  nextLevelXP
}) => {
  const progress = Math.min((experience / nextLevelXP) * 100, 100);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const playerProgress = getPlayerProgress();
    return getTheme(playerProgress.selectedTheme || 'default');
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const playerProgress = getPlayerProgress();
      setCurrentTheme(getTheme(playerProgress.selectedTheme || 'default'));
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);
  
  const style = {
    '--theme-accent': currentTheme.colors.accent,
    '--theme-secondary': currentTheme.colors.secondary,
  } as React.CSSProperties;

  return (
    <div className="hex-level-progress" style={style}>
      <div className="hex-level-info">
        <div className="hex-level-number">
          Level {level}
        </div>
        <div className="hex-xp-info">
          {experience}/{nextLevelXP} XP
        </div>
      </div>
      <div className="hex-progress-container">
        <div 
          className="hex-progress-fill" 
          style={{ '--progress-width': `${progress}%` } as React.CSSProperties}
        />
        <div className="pulse-overlay" />
      </div>
    </div>
  );
};

export default LevelProgress; 