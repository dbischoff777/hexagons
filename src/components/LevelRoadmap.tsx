import React from 'react';
import { 
  LEVEL_BLOCKS, 
  getCurrentLevelInfo, 
  BADGES, 
  LevelBlock, 
  getPlayerProgress,
  getTheme 
} from '../utils/progressionUtils';
import { formatNumber } from '../utils/formatNumbers';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { DEFAULT_SCHEME } from '../utils/colorSchemes';
import CustomCursor from './CustomCursor';
import './LevelRoadmap.css';
import { createDebugLogger } from '../utils/debugUtils';

const DEBUG = createDebugLogger('LevelRoadmap');

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
  const { settings } = useAccessibility();
  const isColorBlind = settings.isColorBlind;
  const playerProgress = getPlayerProgress();
  const theme = getTheme(playerProgress.selectedTheme || 'default');

  const { 
    currentBlock, 
    currentLevel, 
    pointsInCurrentLevel, 
    pointsForNextLevel 
  } = getCurrentLevelInfo(currentPoints);

  const handleLevelClick = (blockNumber: number, levelNumber: number) => {
    const block = LEVEL_BLOCKS[blockNumber - 1];
    const currentLevel = block.levels[levelNumber - 1];
    // Get next level's score (either next level in block or first level of next block)
    const nextLevel = block.levels[levelNumber] || 
      (LEVEL_BLOCKS[blockNumber]?.levels[0]);
    const targetScore = nextLevel?.pointsRequired ?? 100000;
    
    DEBUG.log('Starting level game from roadmap:', {
      blockNumber,
      levelNumber,
      isLevelMode: true,
      targetScore,
      currentLevel,
      nextLevel: nextLevel || 'none'
    });
    
    onStartGame(true, targetScore, true);
  };

  const renderBlock = (block: LevelBlock, currentPoints: number) => {
    const blockLevel = block.blockNumber * 10;  // Convert block number to level (1 -> 10, 2 -> 20, etc.)
    const badge = BADGES.find(b => b.levelBlock === blockLevel);
    const progress = getPlayerProgress();
    const isEarned = badge && progress.badges?.some(b => b.id === badge.id);
    const isNext = badge && !isEarned && progress.level >= (blockLevel - 10);

    return (
      <div 
        key={block.blockNumber} 
        className="level-block"
        style={{
          // Add hover effect with theme color
          '--hover-glow': isColorBlind ? 
            DEFAULT_SCHEME.colors.primary : 
            theme.colors.primary
        } as React.CSSProperties}
      >
        <div className="block-header">
          <h3>{`Block ${block.blockNumber}`}</h3>
          {badge && (
            <div 
              className={`block-badge ${isEarned ? 'earned' : isNext ? 'next' : 'locked'}`}
              style={{
                // Add badge glow with theme color
                '--badge-glow': isColorBlind ? 
                  DEFAULT_SCHEME.colors.accent : 
                  theme.colors.accent
              } as React.CSSProperties}
            >
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
                  block.blockNumber, 
                  levelInfo.level
                )}
                style={{ 
                  cursor: isCompleted || (block.blockNumber === 1 && levelInfo.level === 1) ? 'pointer' : 'default',
                  // Add progress bar color with theme accent
                  '--progress-color': isColorBlind ? 
                    DEFAULT_SCHEME.colors.accent : 
                    theme.colors.accent
                } as React.CSSProperties}
              >
                <div className="level-number">{`${block.blockNumber}-${levelInfo.level}`}</div>
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
    <div 
      className="level-roadmap"
      style={{
        '--theme-primary': isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary,
        '--theme-secondary': isColorBlind ? DEFAULT_SCHEME.colors.secondary : theme.colors.secondary,
        '--theme-accent': isColorBlind ? DEFAULT_SCHEME.colors.accent : theme.colors.accent,
        '--theme-background': isColorBlind ? DEFAULT_SCHEME.colors.background : theme.colors.background,
        '--theme-text': isColorBlind ? DEFAULT_SCHEME.colors.text : theme.colors.text,
        '--title-color': '#00FFFF',
        '--block-title-color': '#00FFFF',
        '--connecting-line-color': '#FF1493',
        '--cell-border-glow': 'rgba(0, 255, 255, 0.3)',
      } as React.CSSProperties}
    >
      <CustomCursor 
        color={isColorBlind ? DEFAULT_SCHEME.colors.primary : theme.colors.primary}
        hide={false}
      />
      <h1 className="level-roadmap-title">Level Roadmap</h1>
      {LEVEL_BLOCKS.map((block) => renderBlock(block, currentPoints))}
    </div>
  );
};

export default LevelRoadmap; 