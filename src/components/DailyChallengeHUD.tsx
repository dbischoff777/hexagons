import React from 'react';
import { DailyObjective } from '../types/dailyChallenge';
import './DailyChallengeHUD.css';

interface DailyChallengeHUDProps {
  objectives: DailyObjective[];
}

const DailyChallengeHUD: React.FC<DailyChallengeHUDProps> = ({ objectives }) => {
  return (
    <div className="daily-challenge-hud">
      <h3>Daily Challenge</h3>
      <div className="objectives-container">
        {objectives.map((objective, index) => (
          <div 
            key={index} 
            className={`objective ${objective.current >= objective.target ? 'completed' : ''}`}
          >
            <div className="objective-icon">
              {objective.type === 'score' && '🎯'}
              {objective.type === 'matches' && '🔥'}
              {objective.type === 'combos' && '⚡'}
              {objective.type === 'time' && '⏱️'}
            </div>
            <div className="objective-progress">
              <div className="objective-text">
                {objective.type === 'score' && 'Score'}
                {objective.type === 'matches' && 'Matches'}
                {objective.type === 'combos' && 'Combos'}
                {objective.type === 'time' && 'Time'}
              </div>
              <div className="objective-numbers">
                {objective.current} / {objective.target}
              </div>
            </div>
            <div 
              className="progress-bar"
              style={{ 
                width: `${Math.min(100, (objective.current / objective.target) * 100)}%`
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChallengeHUD; 