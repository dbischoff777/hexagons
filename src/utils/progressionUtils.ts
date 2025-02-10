import { ExperienceAction, PlayerProgress, UnlockableReward, ThemeConfig } from '../types/progression';

const PROGRESSION_KEY = 'hexagon_progression';
const BASE_XP_TO_LEVEL = 1000;
const XP_INCREASE_PER_LEVEL = 500;

export const EXPERIENCE_VALUES = {
  match: 50,
  combo: 100,
  clear: 200,
  challenge: 500,
  achievement: 300
};

export const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    colors: {
      background: '#1a1a2e',
      primary: '#00FF9F',
      secondary: '#00FFFF',
      accent: '#FF1177',
      text: '#FFFFFF'
    },
    particleColor: '#00FF9F'
  },
  {
    id: 'neon_sunset',
    name: 'Neon Sunset',
    colors: {
      background: '#2D1B2E',
      primary: '#FF6B6B',
      secondary: '#FFE66D',
      accent: '#4ECDC4',
      text: '#FFFFFF'
    },
    particleColor: '#FF6B6B'
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