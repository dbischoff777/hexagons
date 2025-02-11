import { INITIAL_COMPANION } from '../types/companion';
import { PlayerProgress, UnlockableReward, ThemeConfig, Badge, ExperienceAction, CompanionUnlockReward } from '../types/progression';
import { SEASONAL_THEMES } from './seasonalThemes';

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
    name: 'Rainbow Tile',
    description: 'A special tile that matches with any color',
    levelRequired: 3,
    unlocked: false,
    preview: '🌈'
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
    id: 'companion_pixel',
    type: 'companion' as const,
    name: 'Pixel',
    description: 'A helpful AI companion that automatically activates abilities to assist you',
    levelRequired: 5,
    unlocked: false,
    companion: INITIAL_COMPANION
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
    badges: []
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