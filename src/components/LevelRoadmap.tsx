import React from 'react';
import { 
  LEVEL_BLOCKS, 
  getCurrentLevelInfo, 
  BADGES, 
  LevelBlock, 
  getPlayerProgress 
} from '../utils/progressionUtils';
import { formatNumber } from '../utils/formatNumbers';
import './LevelRoadmap.css';

// Add this interface for the reward type
interface Reward {
  id: string;
  type: 'theme' | 'powerup' | 'badge';
}

interface LevelRoadmapProps {
  currentPoints: number;
  onStartGame: (withTimer: boolean, targetScore: number, isLevelMode: boolean) => void;
}

const LevelRoadmap: React.FC<LevelRoadmapProps> = ({ currentPoints, onStartGame }) => {
  const { 
    currentBlock, 
    currentLevel, 
    pointsInCurrentLevel, 
    pointsForNextLevel 
  } = getCurrentLevelInfo(currentPoints);

  const handleLevelClick = (isCompleted: boolean, targetScore: number, blockNumber: number, levelNumber: number) => {
    // For level 1-1, set a minimum target score
    const actualTargetScore = (blockNumber === 1 && levelNumber === 1) ? 10000 : targetScore;
    
    console.log('Starting level game from roadmap:', {
      isCompleted,
      targetScore: actualTargetScore,
      blockNumber,
      levelNumber,
      isLevelMode: true,
      source: 'LevelRoadmap click'
    });
    
    // Level 1-1 is always playable
    if (isCompleted || (blockNumber === 1 && levelNumber === 1)) {
      // Force isLevelMode to true
      const isLevelMode = true;
      onStartGame(false, actualTargetScore, isLevelMode);
    }
  };

  const renderBlock = (block: LevelBlock, currentPoints: number) => {
    const blockLevel = block.blockNumber * 10;  // Convert block number to level (1 -> 10, 2 -> 20, etc.)
    const badge = BADGES.find(b => b.levelBlock === blockLevel);
    const progress = getPlayerProgress();
    const isEarned = badge && progress.badges?.some(b => b.id === badge.id);
    const isNext = badge && !isEarned && progress.level >= (blockLevel - 10);

    return (
      <div key={block.blockNumber} className="level-block">
        <div className="block-header">
          <h3>Block {block.blockNumber}</h3>
          {badge && (
            <div className={`block-badge ${isEarned ? 'earned' : isNext ? 'next' : 'locked'}`}>
              <div className="badge-icon">{badge.icon}</div>
              <div className="badge-tooltip">
                <h4>{badge.name}</h4>
                <p>{badge.description}</p>
                {!isEarned && (
                  <div className="unlock-requirement">
                    Unlocks at Level {blockLevel}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="level-grid">
          {block.levels.map((levelInfo) => {
            const isCurrentLevel = block.blockNumber === currentBlock && levelInfo.level === currentLevel;
            const isCompleted = block.blockNumber === 1 && levelInfo.level === 1 ? true : 
              currentPoints >= levelInfo.pointsRequired;
            const progress = isCurrentLevel ? 
              (pointsInCurrentLevel / (pointsForNextLevel - (block.levels[currentLevel - 2]?.pointsRequired || 0))) * 100 : 
              0;

            return (
              <div 
                key={levelInfo.level}
                className={`level-cell ${isCurrentLevel ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => handleLevelClick(
                  isCompleted, 
                  levelInfo.pointsRequired, 
                  block.blockNumber, 
                  levelInfo.level
                )}
                style={{ cursor: isCompleted || (block.blockNumber === 1 && levelInfo.level === 1) ? 'pointer' : 'default' }}
              >
                <div className="level-number">{block.blockNumber}-{levelInfo.level}</div>
                <div className={`points-required ${window.innerWidth <= 600 ? 'shortened' : ''}`}>
                  {formatNumber(levelInfo.pointsRequired)} pts
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
                    {(levelInfo.rewards as Reward[]).map((reward, index) => (
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