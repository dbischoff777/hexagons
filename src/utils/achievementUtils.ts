import { Achievement, AchievementState } from '../types/achievements';

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'tiles_placed_10',
    name: 'Tile Beginner',
    description: 'Place 10 tiles',
    icon: '🎯',
    requirement: 10,
    currentProgress: 0,
    achieved: false
  },
  {
    id: 'tiles_placed_50',
    name: 'Tile Enthusiast',
    description: 'Place 50 tiles',
    icon: '🌟',
    requirement: 50,
    currentProgress: 0,
    achieved: false
  },
  {
    id: 'tiles_placed_100',
    name: 'Tile Master',
    description: 'Place 100 tiles',
    icon: '👑',
    requirement: 100,
    currentProgress: 0,
    achieved: false
  }
];

const STORAGE_KEY = 'hexTiles_achievements';

export const getAchievements = (): AchievementState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      achievements: ACHIEVEMENTS,
      totalTilesPlaced: 0
    };
  }
  return JSON.parse(stored);
};

export const saveAchievements = (state: AchievementState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const updateTilesPlaced = (count: number): Achievement[] => {
  const state = getAchievements();
  const newState: AchievementState = {
    ...state,
    totalTilesPlaced: state.totalTilesPlaced + count,
    achievements: state.achievements.map(achievement => {
      if (achievement.id.startsWith('tiles_placed_')) {
        const newProgress = state.totalTilesPlaced + count;
        const wasAchieved = achievement.achieved;
        const isNowAchieved = newProgress >= achievement.requirement;
        
        return {
          ...achievement,
          currentProgress: newProgress,
          achieved: isNowAchieved,
          timestamp: isNowAchieved && !wasAchieved ? new Date().toISOString() : achievement.timestamp
        };
      }
      return achievement;
    })
  };
  
  saveAchievements(newState);
  
  // Return only newly achieved achievements
  return newState.achievements.filter(achievement => 
    achievement.achieved && 
    !state.achievements.find(a => a.id === achievement.id)?.achieved
  );
}; 