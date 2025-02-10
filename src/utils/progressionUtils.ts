import { ExperienceAction, PlayerProgress, UnlockableReward, ThemeConfig } from '../types/progression';

const PROGRESSION_KEY = 'hexagon_progression';
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

export const UNLOCKABLE_REWARDS: UnlockableReward[] = [
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
    selectedTheme: 'default'
  };
};

export const addExperience = (action: ExperienceAction): PlayerProgress => {
  const progress = getPlayerProgress();
  progress.experience += action.value;

  while (progress.experience >= progress.experienceToNext) {
    progress.experience -= progress.experienceToNext;
    progress.level += 1;
    progress.experienceToNext = calculateExperienceForLevel(progress.level);

    // Check for new unlocks
    UNLOCKABLE_REWARDS.forEach(reward => {
      if (reward.levelRequired === progress.level) {
        progress.unlockedRewards.push(reward.id);
      }
    });
  }

  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
  return progress;
};

export const getUnlockedRewards = (): UnlockableReward[] => {
  const progress = getPlayerProgress();
  return UNLOCKABLE_REWARDS.map(reward => ({
    ...reward,
    unlocked: progress.unlockedRewards.includes(reward.id)
  }));
};

export const getTheme = (themeId: string): ThemeConfig => {
  const progress = getPlayerProgress();
  const isThemeUnlocked = progress.unlockedRewards.includes(themeId) || themeId === 'default';
  if (!isThemeUnlocked) {
    return THEMES[0]; // Return default theme if selected theme isn't unlocked
  }
  const selectedTheme = THEMES.find(theme => theme.id === themeId);
  return selectedTheme || THEMES[0];
};

export const setTheme = (themeId: string): void => {
  const progress = getPlayerProgress();
  progress.selectedTheme = themeId;
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
}; 