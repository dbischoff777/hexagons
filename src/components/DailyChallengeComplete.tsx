import React from 'react';
import './DailyChallengeComplete.css';

interface DailyChallengeCompleteProps {
  score: number;
  onExit: () => void;
}

const DailyChallengeComplete: React.FC<DailyChallengeCompleteProps> = ({ score, onExit }) => {
  return (
    <div className="daily-complete-overlay">
      <div className="daily-complete-container">
        <h2>🎉 Daily Challenge Complete! 🎉</h2>
        <div className="daily-complete-content">
          <p className="daily-complete-score">Final Score: {score}</p>
          <p className="daily-complete-message">Come back tomorrow for a new challenge!</p>
        </div>
        <button className="daily-complete-button" onClick={onExit}>
          Return to Menu
        </button>
      </div>
    </div>
  );
};

export default DailyChallengeComplete; 