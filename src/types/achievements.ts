export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  currentProgress: number;
  achieved: boolean;
  timestamp?: string;
}

export interface AchievementState {
  achievements: Achievement[];
  totalTilesPlaced: number;
} 