import { LEVEL_BLOCKS, getPlayerProgress, PROGRESSION_KEY } from './progressionUtils';

export interface LevelCompletion {
  show: boolean;
  level: string;
  score: number;
  targetScore: number;
  nextLevel: string;
  bonusPoints: number;
  isNextLevelUnlock?: boolean;
  message?: string;
}

export const getNextLevelInfo = (currentBlock: number, currentLevel: number, blocks: typeof LEVEL_BLOCKS) => {
  // Find current block
  const block = blocks.find(b => b.blockNumber === currentBlock);
  if (!block) return null;

  // If there are more levels in current block
  if (currentLevel < block.levels.length) {
    return {
      block: currentBlock,
      level: currentLevel + 1,
      pointsRequired: block.levels[currentLevel].pointsRequired
    };
  }

  // If we need to move to next block
  const nextBlock = blocks.find(b => b.blockNumber === currentBlock + 1);
  if (nextBlock && nextBlock.levels.length > 0) {
    return {
      block: nextBlock.blockNumber,
      level: 1,
      pointsRequired: nextBlock.levels[0].pointsRequired
    };
  }

  return null;
};

export const unlockNextLevel = (score: number, currentBlock: number, currentLevel: number) => {
  const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);
  if (!nextLevel) return null;

  // Check if score meets requirement for next level
  if (score >= nextLevel.pointsRequired) {
    const progress = getPlayerProgress();
    progress.points = Math.max(progress.points || 0, score);
    progress.unlockedLevels = progress.unlockedLevels || {};
    
    // Unlock the next level
    const nextLevelKey = `${nextLevel.block}-${nextLevel.level}`;
    progress.unlockedLevels[nextLevelKey] = true;
    
    // Save progress
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));

    return {
      show: true,
      level: `${currentBlock}-${currentLevel}`,
      score,
      targetScore: nextLevel.pointsRequired,
      nextLevel: nextLevelKey,
      bonusPoints: Math.floor((score - nextLevel.pointsRequired) / 100),
      isNextLevelUnlock: true
    };
  }

  return null;
};

// Add this function to check if a level should be unlocked
export const checkLevelUnlock = (score: number, currentBlock: number, currentLevel: number) => {
  // Get the next level's requirements
  const nextLevel = getNextLevelInfo(currentBlock, currentLevel, LEVEL_BLOCKS);
  if (!nextLevel) return null;

  // Get current progress
  const progress = getPlayerProgress();
  const nextLevelKey = `${nextLevel.block}-${nextLevel.level}`;

  // Check if level is already unlocked
  if (progress.unlockedLevels?.[nextLevelKey]) return null;

  // Check if score meets requirement for next level
  if (score >= nextLevel.pointsRequired) {
    // Update progress
    progress.points = Math.max(progress.points || 0, score);
    progress.unlockedLevels = progress.unlockedLevels || {};
    progress.unlockedLevels[nextLevelKey] = true;
    
    // Save progress
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));

    // Return unlock information
    return {
      show: true,
      level: `${currentBlock}-${currentLevel}`,
      score,
      targetScore: nextLevel.pointsRequired,
      nextLevel: nextLevelKey,
      bonusPoints: Math.floor((score - nextLevel.pointsRequired) / 100),
      isNextLevelUnlock: true,
      message: `Level ${nextLevelKey} Unlocked!`
    };
  }

  return null;
};

// Add this function to get the target score for the next level
export const getNextLevelTargetScore = (currentBlock: number, currentLevel: number): number => {
  // Base score requirement for first level
  const baseScore = 1000;
  
  // Calculate target score based on block and level
  // Each block increases difficulty exponentially
  const blockMultiplier = Math.pow(1.5, currentBlock - 1);
  
  // Each level within a block increases linearly
  const levelMultiplier = 1 + (currentLevel - 1) * 0.5;
  
  // Calculate final target score
  const targetScore = Math.round(baseScore * blockMultiplier * levelMultiplier);
  
  return targetScore;
}; 