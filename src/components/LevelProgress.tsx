import React from 'react';
import './LevelProgress.css';
import { PlayerProgress } from '../types/progression';

interface LevelProgressProps {
  progress: PlayerProgress;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ progress }) => {
  const progressPercent = (progress.experience / progress.experienceToNext) * 100;

  return (
    <div className="level-progress">
      <div className="level-info">
        <span className="level-number">Level {progress.level}</span>
        <span className="xp-info">
          {progress.experience} / {progress.experienceToNext} XP
        </span>
      </div>
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default LevelProgress; 