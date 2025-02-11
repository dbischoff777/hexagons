import { Companion } from "./companion";

export interface ExperienceAction {
  type: 'match' | 'combo' | 'clear' | 'challenge' | 'achievement';
  value: number;
}

export type UnlockableRewardType = 'theme' | 'powerup' | 'tile' | 'special_tile' | 'companion';

export interface UnlockableReward {
  type: UnlockableRewardType;
  id: string;
  name: string;
  description: string;
  preview?: string;
  unlocked: boolean;
  levelRequired: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  levelBlock: number; // The level block this badge is awarded for (e.g., 1 for levels 1-5, 2 for 6-10, etc.)
  dateAwarded?: string;
}

export interface PlayerProgress {
  level: number;
  experience: number;
  experienceToNext: number;
  unlockedRewards: string[];
  selectedTheme?: string;
  points: number;
  badges: Badge[];
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  particleColor: string;
  previewImage?: string;
}

export interface SeasonalTheme {
  id: string;
  name: string;
  description: string;
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
  };
  icon: string;
}

export interface CompanionUnlockReward extends UnlockableReward {
  type: 'companion';
  companion: Companion;
  levelRequired: number;
} 