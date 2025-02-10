import React from 'react';
import { LEVEL_BLOCKS, getCurrentLevelInfo, BADGES, LevelBlock } from '../utils/progressionUtils';
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

  const renderBlock = (block: LevelBlock, currentPoints: number) => {
    const blockBadge = BADGES.find(b => b.levelBlock === block.blockNumber);
    const isBlockComplete = currentPoints >= block.levels[block.levels.length - 1].pointsRequired;

    return (
      <div key={block.blockNumber} className="level-block">
        <div className="block-header">
          <h3>Block {block.blockNumber}</h3>
          {blockBadge && (
            <div className={`block-badge ${isBlockComplete ? 'earned' : ''}`}>
              <div className="badge-icon">{blockBadge.icon}</div>
              <div className="badge-tooltip">
                <h4>{blockBadge.name}</h4>
                <p>{blockBadge.description}</p>
              </div>
            </div>
          )}
        </div>
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
    );
  };

  return (
    <div className="level-roadmap">
      {LEVEL_BLOCKS.map((block) => renderBlock(block, currentPoints))}
    </div>
  );
};

export default LevelRoadmap; 