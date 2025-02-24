import React from 'react';
import './LevelProgress.css';
import { PlayerProgress } from '../types/progression';
import { Theme } from '../types/theme';

interface LevelProgressProps {
  level: number;
  experience: number;
  nextLevelXP: number;
  theme?: Theme;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ 
  level, 
  experience, 
  nextLevelXP,
  theme 
}) => {
  const progress = Math.min((experience / nextLevelXP) * 100, 100);

  const style = theme ? {
    '--theme-accent': theme.colors.accent,
    '--theme-secondary': theme.colors.secondary,
  } as React.CSSProperties : undefined;

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