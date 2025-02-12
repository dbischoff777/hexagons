import { PlayerProgress, UnlockableReward, ThemeConfig, Badge, ExperienceAction, CompanionUnlockReward } from '../types/progression';
import { SEASONAL_THEMES } from './seasonalThemes';
import { COMPANIONS, COMPANION_UNLOCKS, CompanionId } from '../types/companion';

export const PROGRESSION_KEY = 'hexagon_progression';
const BASE_XP_TO_LEVEL = 1000;
const XP_INCREASE_PER_LEVEL = 500;

export const EXPERIENCE_VALUES = {
  match: 50,
  combo: 100,
  clear: 200,
  challenge: 500,
  achievement: 300,
  mirror_match: 15
};

export const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      background: '#0A0A1E',
      primary: '#00FF9F',
      secondary: '#1A1A3E',
      accent: '#FF1177',
      text: '#FFFFFF'
    },
    particleColor: '#00FF9F'
  },
  {
    id: 'neon_sunset',
    name: 'Neon Sunset',
    colors: {
      background: '#1A0F1F',
      primary: '#FF6B6B',
      secondary: '#2D1B2E',
      accent: '#4ECDC4',
      text: '#FFFFFF'
    },
    particleColor: '#FF6B6B'
  },
  {
    id: 'cyber_punk',
    name: 'Cyber Punk',
    colors: {
      background: '#0D0221',
      primary: '#FF00FF',
      secondary: '#1E0442',
      accent: '#00FFFF',
      text: '#FFFFFF'
    },
    particleColor: '#FF00FF'
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      background: '#0A1F0A',
      primary: '#90EE90',
      secondary: '#1A2F1A',
      accent: '#FFB6C1',
      text: '#FFFFFF'
    },
    particleColor: '#90EE90'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      background: '#000D1A',
      primary: '#00BFFF',
      secondary: '#001F3F',
      accent: '#FF69B4',
      text: '#FFFFFF'
    },
    particleColor: '#00BFFF'
  },
  {
    id: 'volcanic',
    name: 'Volcanic',
    colors: {
      background: '#1A0F0F',
      primary: '#FF4500',
      secondary: '#2D1414',
      accent: '#FFD700',
      text: '#FFFFFF'
    },
    particleColor: '#FF4500'
  }
];

export const UNLOCKABLE_REWARDS: (UnlockableReward | CompanionUnlockReward)[] = [
  {
    type: 'tile',
    id: 'rainbow_tile',
    name: 'Joker Tile',
    description: 'A special tile that matches with any color',
    levelRequired: 3,
    unlocked: false,
    preview: '★'
  },
  {
    type: 'theme',
    id: 'neon_sunset',
    name: 'Neon Sunset',
    description: 'A vibrant sunset-inspired theme',
    levelRequired: 2,
    unlocked: false
  },
  {
    type: 'theme',
    id: 'cyber_punk',
    name: 'Cyber Punk',
    description: 'High-tech cyberpunk aesthetics',
    levelRequired: 4,
    unlocked: false
  },
  {
    type: 'theme',
    id: 'forest',
    name: 'Forest',
    description: 'Calming forest colors',
    levelRequired: 6,
    unlocked: false
  },
  {
    type: 'theme',
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea vibes',
    levelRequired: 8,
    unlocked: false
  },
  {
    type: 'theme',
    id: 'volcanic',
    name: 'Volcanic',
    description: 'Hot and fiery theme',
    levelRequired: 10,
    unlocked: false
  },
  {
    type: 'powerup',
    id: 'time_freeze',
    name: 'Time Freeze',
    description: 'Freezes the timer for 10 seconds',
    levelRequired: 4,
    unlocked: false,
    preview: '⏸️'
  },
  {
    type: 'powerup',
    id: 'color_shift',
    name: 'Color Shift',
    description: 'Changes colors of adjacent tiles',
    levelRequired: 5,
    unlocked: false,
    preview: '🎨'
  },
  {
    type: 'powerup',
    id: 'multiplier',
    name: 'Score Multiplier',
    description: '2x score for 15 seconds',
    levelRequired: 6,
    unlocked: false,
    preview: '✨'
  },
  {
    type: 'special_tile',
    id: 'mirror_tile',
    name: 'Mirror Tile',
    description: 'Special tile that mirrors colors of adjacent tiles',
    levelRequired: 5,
    unlocked: false,
    preview: '↔️'
  },
  {
    id: 'default',
    type: 'companion',
    name: COMPANIONS.default.name,
    description: COMPANIONS.default.description,
    levelRequired: COMPANION_UNLOCKS.default.level,
    preview: COMPANIONS.default.avatar,
    companion: COMPANIONS.default,
    unlocked: false
  },
  {
    id: 'cyber_cat',
    type: 'companion',
    name: COMPANIONS.cyber_cat.name,
    description: COMPANIONS.cyber_cat.description,
    levelRequired: COMPANION_UNLOCKS.cyber_cat.level,
    preview: COMPANIONS.cyber_cat.avatar,
    companion: COMPANIONS.cyber_cat,
    unlocked: false
  },
  {
    id: 'ghost',
    type: 'companion',
    name: COMPANIONS.ghost.name,
    description: COMPANIONS.ghost.description,
    levelRequired: COMPANION_UNLOCKS.ghost.level,
    preview: COMPANIONS.ghost.avatar,
    companion: COMPANIONS.ghost,
    unlocked: false
  },
  {
    id: 'alien',
    type: 'companion',
    name: COMPANIONS.alien.name,
    description: COMPANIONS.alien.description,
    levelRequired: COMPANION_UNLOCKS.alien.level,
    preview: COMPANIONS.alien.avatar,
    companion: COMPANIONS.alien,
    unlocked: false
  },
  {
    id: 'dragon',
    type: 'companion',
    name: COMPANIONS.dragon.name,
    description: COMPANIONS.dragon.description,
    levelRequired: COMPANION_UNLOCKS.dragon.level,
    preview: COMPANIONS.dragon.avatar,
    companion: COMPANIONS.dragon,
    unlocked: false
  },
  {
    id: 'unicorn',
    type: 'companion',
    name: COMPANIONS.unicorn.name,
    description: COMPANIONS.unicorn.description,
    levelRequired: COMPANION_UNLOCKS.unicorn.level,
    preview: COMPANIONS.unicorn.avatar,
    companion: COMPANIONS.unicorn,
    unlocked: false
  },
  {
    id: 'wizard',
    type: 'companion',
    name: COMPANIONS.wizard.name,
    description: COMPANIONS.wizard.description,
    levelRequired: COMPANION_UNLOCKS.wizard.level,
    preview: COMPANIONS.wizard.avatar,
    companion: COMPANIONS.wizard,
    unlocked: false
  },
  {
    id: 'ninja',
    type: 'companion',
    name: COMPANIONS.ninja.name,
    description: COMPANIONS.ninja.description,
    levelRequired: COMPANION_UNLOCKS.ninja.level,
    preview: COMPANIONS.ninja.avatar,
    companion: COMPANIONS.ninja,
    unlocked: false
  },
  {
    id: 'phoenix',
    type: 'companion',
    name: COMPANIONS.phoenix.name,
    description: COMPANIONS.phoenix.description,
    levelRequired: COMPANION_UNLOCKS.phoenix.level,
    preview: COMPANIONS.phoenix.avatar,
    companion: COMPANIONS.phoenix,
    unlocked: false
  },
  {
    id: 'octopus',
    type: 'companion',
    name: COMPANIONS.octopus.name,
    description: COMPANIONS.octopus.description,
    levelRequired: COMPANION_UNLOCKS.octopus.level,
    preview: COMPANIONS.octopus.avatar,
    companion: COMPANIONS.octopus,
    unlocked: false
  },
  {
    id: 'crystal',
    type: 'companion',
    name: COMPANIONS.crystal.name,
    description: COMPANIONS.crystal.description,
    levelRequired: COMPANION_UNLOCKS.crystal.level,
    preview: COMPANIONS.crystal.avatar,
    companion: COMPANIONS.crystal,
    unlocked: false
  },
  {
    id: 'star',
    type: 'companion',
    name: COMPANIONS.star.name,
    description: COMPANIONS.star.description,
    levelRequired: COMPANION_UNLOCKS.star.level,
    preview: COMPANIONS.star.avatar,
    companion: COMPANIONS.star,
    unlocked: false
  }
];

export const calculateExperienceForLevel = (level: number): number => {
  return BASE_XP_TO_LEVEL + (level - 1) * XP_INCREASE_PER_LEVEL;
};

export const getPlayerProgress = (): PlayerProgress => {
  const stored = localStorage.getItem(PROGRESSION_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    level: 1,
    experience: 0,
    experienceToNext: calculateExperienceForLevel(1),
    unlockedRewards: [],
    selectedTheme: 'default',
    points: 0,
    badges: [],
    selectedCompanion: 'default',
    unlockedLevels: { '1-1': true }
  };
};

export const addExperience = ({ value }: ExperienceAction): { progress: PlayerProgress; newBadges: Badge[] } => {
  const progress = getPlayerProgress();
  const newBadges: Badge[] = [];
  progress.experience += value;

  while (progress.experience >= progress.experienceToNext) {
    progress.experience -= progress.experienceToNext;
    progress.level += 1;
    progress.experienceToNext = calculateExperienceForLevel(progress.level);

    // Check for unlocks
    UNLOCKABLE_REWARDS.forEach(reward => {
      if (reward.levelRequired === progress.level) {
        progress.unlockedRewards.push(reward.id);
      }
    });
  }

  // Check for badges based on roadmap level/points
  const { currentBlock, currentLevel } = getCurrentLevelInfo(progress.points);
  const currentRoadmapLevel = ((currentBlock - 1) * 10) + currentLevel;
  
  // Check if we've reached a multiple of 10 in roadmap levels
  if (currentRoadmapLevel % 10 === 0) {
    const badge = BADGES.find(b => b.levelBlock === currentRoadmapLevel);
    if (badge && !progress.badges?.some(b => b.id === badge.id)) {
      const newBadge = {
        ...badge,
        dateAwarded: new Date().toISOString()
      };
      
      progress.badges = [...(progress.badges || []), newBadge];
      newBadges.push(newBadge);
    }
  }

  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
  return { progress, newBadges };
};

export const getUnlockedRewards = (): (UnlockableReward | CompanionUnlockReward)[] => {
  const progress = getPlayerProgress();
  return UNLOCKABLE_REWARDS.map(reward => ({
    ...reward,
    unlocked: progress.unlockedRewards.includes(reward.id)
  }));
};

export const getTheme = (themeId: string) => {
  // First check seasonal themes
  const seasonalTheme = SEASONAL_THEMES.find(theme => theme.id === themeId);
  if (seasonalTheme) {
    return {
      id: seasonalTheme.id,
      name: seasonalTheme.name,
      colors: {
        ...seasonalTheme.colors,
        text: '#FFFFFF' // Add text color for compatibility
      },
      particleColor: seasonalTheme.colors.accent,
      type: 'seasonal' as const  // Add type to distinguish seasonal themes
    };
  }

  // If not a seasonal theme, check regular themes
  const theme = THEMES.find(t => t.id === themeId);
  if (theme) {
    return {
      ...theme,
      type: 'regular' as const  // Add type to distinguish regular themes
    };
  }

  // Return default theme
  return {
    ...THEMES[0],
    type: 'regular' as const
  };
};

export const setTheme = (themeId: string): void => {
  const progress = getPlayerProgress();
  progress.selectedTheme = themeId;
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
};

export interface LevelBlock {
  blockNumber: number;
  levels: {
    level: number;
    pointsRequired: number;
    rewards?: {
      id: string;
    }[];
  }[];
}

// Define the level progression blocks based on points
export const LEVEL_BLOCKS: LevelBlock[] = [
  {
    blockNumber: 1,
    levels: [
      { level: 1, pointsRequired: 0 },
      { level: 2, pointsRequired: 10000 },
      { level: 3, pointsRequired: 25000 },
      { level: 4, pointsRequired: 45000 },
      { level: 5, pointsRequired: 70000 },
      { level: 6, pointsRequired: 100000 },
      { level: 7, pointsRequired: 135000 },
      { level: 8, pointsRequired: 175000 },
      { level: 9, pointsRequired: 220000 },
      { level: 10, pointsRequired: 270000 }
    ]
  },
  {
    blockNumber: 2,
    levels: [
      { level: 1, pointsRequired: 325000 },
      { level: 2, pointsRequired: 385000 },
      { level: 3, pointsRequired: 450000 },
      { level: 4, pointsRequired: 520000 },
      { level: 5, pointsRequired: 595000 },
      { level: 6, pointsRequired: 675000 },
      { level: 7, pointsRequired: 760000 },
      { level: 8, pointsRequired: 850000 },
      { level: 9, pointsRequired: 945000 },
      { level: 10, pointsRequired: 1045000 }
    ]
  },
  {
    blockNumber: 3,
    levels: [
      { level: 1, pointsRequired: 1150000 },
      { level: 2, pointsRequired: 1260000 },
      { level: 3, pointsRequired: 1375000 },
      { level: 4, pointsRequired: 1495000 },
      { level: 5, pointsRequired: 1620000 },
      { level: 6, pointsRequired: 1750000 },
      { level: 7, pointsRequired: 1885000 },
      { level: 8, pointsRequired: 2025000 },
      { level: 9, pointsRequired: 2170000 },
      { level: 10, pointsRequired: 2320000 }
    ]
  }
];

// Helper function to get current level info based on points
export const getCurrentLevelInfo = (points: number) => {
  let currentBlock = 1;
  let currentLevel = 1;
  let pointsForNextLevel = 1000;
  let pointsInCurrentLevel = 0;
  let totalLevelsCompleted = 0;

  for (const block of LEVEL_BLOCKS) {
    for (const levelInfo of block.levels) {
      if (points >= levelInfo.pointsRequired) {
        currentBlock = block.blockNumber;
        currentLevel = levelInfo.level;
        totalLevelsCompleted++;
      } else {
        pointsForNextLevel = levelInfo.pointsRequired;
        pointsInCurrentLevel = points - (block.levels[currentLevel - 2]?.pointsRequired || 0);
        return {
          currentBlock,
          currentLevel,
          pointsForNextLevel,
          pointsInCurrentLevel,
          totalLevelsCompleted,
          levelInfo
        };
      }
    }
  }

  // Max level reached
  return {
    currentBlock: LEVEL_BLOCKS.length,
    currentLevel: 10,
    pointsForNextLevel: Infinity,
    pointsInCurrentLevel: points,
    totalLevelsCompleted,
    levelInfo: LEVEL_BLOCKS[LEVEL_BLOCKS.length - 1].levels[9]
  };
};

// Update badge definitions
export const BADGES: Badge[] = [
  {
    id: 'novice',
    name: 'Novice Explorer',
    description: 'Completed your first 10 levels',
    icon: '🌟',
    levelBlock: 10
  },
  {
    id: 'apprentice',
    name: 'Apprentice Matcher',
    description: 'Reached level 20',
    icon: '🎯',
    levelBlock: 20
  },
  {
    id: 'master',
    name: 'Hex Master',
    description: 'Mastered all 30 levels',
    icon: '👑',
    levelBlock: 30
  }
];

// Add helper function to get current companion
export const getCurrentCompanion = () => {
  const progress = getPlayerProgress();
  return COMPANIONS[progress.selectedCompanion as CompanionId] || COMPANIONS.default;
};

// Add function to select companion
export const selectCompanion = (companionId: CompanionId) => {
  const progress = getPlayerProgress();
  progress.selectedCompanion = companionId;
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
};

export function setCompanion(companionId: CompanionId) {
  const progress = getPlayerProgress();
  progress.selectedCompanion = companionId;
  
  // Save the updated progress
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
  
  // Dispatch an event with the companionId
  window.dispatchEvent(new CustomEvent('companionChanged', { 
    detail: { companionId } 
  }));
}

// Add this function near the other level-related functions
export const checkLevelUnlock = (score: number, currentBlock: number, currentLevel: number) => {
  // Get the next level in the hierarchy
  const block = LEVEL_BLOCKS.find(b => b.blockNumber === currentBlock);
  if (!block) return null;

  // Get the next level in the current block
  const nextLevelInBlock = block.levels[currentLevel];
  if (!nextLevelInBlock) {
    // If no next level in current block, check first level of next block
    const nextBlock = LEVEL_BLOCKS.find(b => b.blockNumber === currentBlock + 1);
    if (!nextBlock || !nextBlock.levels[0]) return null;

    // Check if score meets requirement for first level of next block
    if (score >= nextBlock.levels[0].pointsRequired) {
      const progress = getPlayerProgress();
      const nextLevelKey = `${nextBlock.blockNumber}-1`;

      // Check if already unlocked
      if (progress.unlockedLevels?.[nextLevelKey]) return null;

      // Update progress
      progress.points = Math.max(progress.points || 0, score);
      progress.unlockedLevels = progress.unlockedLevels || {};
      progress.unlockedLevels[nextLevelKey] = true;
      
      // Save progress
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));

      return {
        show: true,
        level: `${currentBlock}-${currentLevel}`,
        score,
        targetScore: nextBlock.levels[0].pointsRequired,
        nextLevel: nextLevelKey,
        bonusPoints: Math.floor((score - nextBlock.levels[0].pointsRequired) / 100),
        isNextLevelUnlock: true,
        message: `Block ${currentBlock} Complete! Level ${nextLevelKey} Unlocked!`
      };
    }
  } else {
    // Check if score meets requirement for next level in current block
    if (score >= nextLevelInBlock.pointsRequired) {
      const progress = getPlayerProgress();
      const nextLevelKey = `${currentBlock}-${currentLevel + 1}`;

      // Check if already unlocked
      if (progress.unlockedLevels?.[nextLevelKey]) return null;

      // Update progress
      progress.points = Math.max(progress.points || 0, score);
      progress.unlockedLevels = progress.unlockedLevels || {};
      progress.unlockedLevels[nextLevelKey] = true;
      
      // Save progress
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));

      return {
        show: true,
        level: `${currentBlock}-${currentLevel}`,
        score,
        targetScore: nextLevelInBlock.pointsRequired,
        nextLevel: nextLevelKey,
        bonusPoints: Math.floor((score - nextLevelInBlock.pointsRequired) / 100),
        isNextLevelUnlock: true,
        message: `Level ${currentBlock}-${currentLevel} Complete!`
      };
    }
  }

  return null;
};

// Update getNextLevelInfo to handle level 1-1 case
export const getNextLevelInfo = (currentBlock: number, currentLevel: number, blocks: typeof LEVEL_BLOCKS) => {
  // Special case for level 1-1
  if (currentBlock === 1 && currentLevel === 1) {
    return {
      block: 1,
      level: 2,
      pointsRequired: blocks[0].levels[1].pointsRequired
    };
  }

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