import React from 'react';
import './LevelProgress.css';
import { PlayerProgress } from '../types/progression';

interface LevelProgressProps {
  progress: PlayerProgress;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ progress }) => {
  const percentToNextLevel = (progress.experience / progress.experienceToNext) * 100;

  return (
    <div className="level-progress">
      <div className="level-info">
        <div className="level-number">Level {progress.level}</div>
        <div className="xp-info">
          {progress.experience} / {progress.experienceToNext} XP
        </div>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ 
            '--progress-width': `${percentToNextLevel}%` 
          } as React.CSSProperties}
        />
      </div>
    </div>
  );
};

export default LevelProgress; 