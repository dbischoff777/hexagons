export type AchievementType = 'tiles' | 'score' | 'time' | 'combo' | 'special' | 'grid_clear';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AchievementType;
  requirement: number;
  currentProgress: number;
  achieved: boolean;
  timestamp?: string;
  dateAwarded?: string;
  progress?: number;
  target?: number;
}

export interface AchievementState {
  achievements: Achievement[];
  totalTilesPlaced: number;
  highestCombo: number;
  fastestGameTime?: number;
  highestScore: number;
  totalGridClears: number;
} 