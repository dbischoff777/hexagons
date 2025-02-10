export interface ExperienceAction {
  type: 'match' | 'combo' | 'clear' | 'challenge' | 'achievement';
  value: number;
}

export interface UnlockableReward {
  type: 'tile' | 'theme' | 'powerup';
  id: string;
  name: string;
  description: string;
  preview?: string;
  unlocked: boolean;
  levelRequired: number;
}

export interface PlayerProgress {
  level: number;
  experience: number;
  experienceToNext: number;
  unlockedRewards: string[];
  selectedTheme?: string;
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