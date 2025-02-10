import React from 'react';
import { LEVEL_BLOCKS, getCurrentLevelInfo } from '../utils/progressionUtils';
import './LevelRoadmap.css';

interface LevelRoadmapProps {
  currentPoints: number;
  onStartGame: (withTimer: boolean) => void;
}

const LevelRoadmap: React.FC<LevelRoadmapProps> = ({ currentPoints, onStartGame }) => {
  const { 
    currentBlock, 
    currentLevel, 
    pointsInCurrentLevel, 
    pointsForNextLevel 
  } = getCurrentLevelInfo(currentPoints);

  const handleLevelClick = (isCompleted: boolean) => {
    console.log('Level clicked, completed:', isCompleted);
    if (isCompleted) {
      onStartGame(true); // Start timed mode
    }
  };

  return (
    <div className="level-roadmap">
      {LEVEL_BLOCKS.map((block) => (
        <div key={block.blockNumber} className="level-block">
          <div className="block-header">Block {block.blockNumber}</div>
          <div className="level-grid">
            {block.levels.map((levelInfo) => {
              const isCurrentLevel = block.blockNumber === currentBlock && levelInfo.level === currentLevel;
              const isCompleted = block.blockNumber === 1 && levelInfo.level === 1 ? true : 
                currentPoints >= levelInfo.pointsRequired;
              console.log('Level info:', {
                level: `${block.blockNumber}-${levelInfo.level}`,
                required: levelInfo.pointsRequired,
                current: currentPoints,
                isCompleted
              });
              const progress = isCurrentLevel ? 
                (pointsInCurrentLevel / (pointsForNextLevel - (block.levels[currentLevel - 2]?.pointsRequired || 0))) * 100 : 
                0;

              return (
                <div 
                  key={levelInfo.level}
                  className={`level-cell ${isCurrentLevel ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleLevelClick(isCompleted)}
                  style={{ cursor: isCompleted ? 'pointer' : 'default' }}
                >
                  <div className="level-number">{block.blockNumber}-{levelInfo.level}</div>
                  <div className="points-required">
                    {levelInfo.pointsRequired.toLocaleString()} pts
                  </div>
                  {isCurrentLevel && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                  {levelInfo.rewards && (
                    <div className="rewards">
                      {levelInfo.rewards.map((reward, index) => (
                        <div 
                          key={index} 
                          className="reward-icon" 
                          title={`${reward.type}: ${reward.id}`}
                        >
                          {reward.type === 'theme' ? '🎨' : 
                           reward.type === 'powerup' ? '⚡' : '🏆'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LevelRoadmap; 