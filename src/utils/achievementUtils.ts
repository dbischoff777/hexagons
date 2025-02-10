import { Achievement, AchievementState } from '../types/achievements';
import { ACHIEVEMENTS } from '../data/achievements';

const ACHIEVEMENT_STATE_KEY = 'hexmatch_achievements';

const getInitialAchievementState = (): AchievementState => {
  const achievements = ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    currentProgress: 0,
    achieved: false,
  }));

  return {
    achievements,
    totalTilesPlaced: 0,
    highestCombo: 0,
    highestScore: 0,
    totalGridClears: 0,
  };

};

export const getAchievements = (): AchievementState => {
  const savedState = localStorage.getItem(ACHIEVEMENT_STATE_KEY);
  if (savedState) {
    return JSON.parse(savedState);
  }
  const initialState = getInitialAchievementState();
  localStorage.setItem(ACHIEVEMENT_STATE_KEY, JSON.stringify(initialState));
  return initialState;
};

export const updateAchievements = (
  updates: Partial<Omit<AchievementState, 'achievements'>>
): void => {
  const currentState = getAchievements();
  const newState = {
    ...currentState,
    ...updates,
  };

  // Update achievement progress based on the new state
  newState.achievements = currentState.achievements.map(achievement => {
    const progress = getAchievementProgress(achievement, newState);
    const achieved = progress >= achievement.requirement;
    
    // Keep achievement unlocked if it was previously achieved
    return {
      ...achievement,
      currentProgress: progress,
      achieved: achieved || achievement.achieved,
      timestamp: achieved && !achievement.achieved ? new Date().toISOString() : achievement.timestamp,
    };
  });

  localStorage.setItem(ACHIEVEMENT_STATE_KEY, JSON.stringify(newState));
};

const getAchievementProgress = (
  achievement: Achievement,
  state: AchievementState
): number => {
  switch (achievement.type) {
    case 'tiles':
      return state.totalTilesPlaced;
    case 'score':
      return state.highestScore;
    case 'combo':
      return state.highestCombo;
    case 'grid_clear':
      return state.totalGridClears;
    case 'special':
      if (!achievement.timestamp) return 0;
      
      // Check if the achievement was completed today
      const achievementDate = new Date(achievement.timestamp);
      const today = new Date();
      
      return (
        achievementDate.getDate() === today.getDate() &&
        achievementDate.getMonth() === today.getMonth() &&
        achievementDate.getFullYear() === today.getFullYear()
      ) ? achievement.requirement : 0;
    default:
      return 0;
  }
};

export const updateTilesPlaced = (count: number): Achievement[] => {
  const currentState = getAchievements();
  const prevAchievements = [...currentState.achievements];
  
  // Update the state with new total
  const newState = {
    ...currentState,
    totalTilesPlaced: currentState.totalTilesPlaced + count
  };
  
  // Update achievements and get the updated state
  updateAchievements(newState);
  const updatedState = getAchievements();
  
  // Find newly achieved tile achievements
  return updatedState.achievements.filter(achievement => 
    achievement.type === 'tiles' &&
    achievement.achieved && 
    !prevAchievements.find(a => a.id === achievement.id)?.achieved
  );
};

export const updateScore = (score: number): Achievement[] => {
  const currentState = getAchievements();
  const prevAchievements = [...currentState.achievements];
  
  // Update the state with highest score
  const newState = {
    ...currentState,
    highestScore: Math.max(currentState.highestScore, score)
  };
  
  // Update achievements and get the updated state
  updateAchievements(newState);
  const updatedState = getAchievements();
  
  // Find newly achieved score achievements
  return updatedState.achievements.filter(achievement => 
    achievement.type === 'score' &&
    achievement.achieved && 
    !prevAchievements.find(a => a.id === achievement.id)?.achieved
  );
};

export const updateCombo = (combo: number): Achievement[] => {
  const currentState = getAchievements();
  const prevAchievements = [...currentState.achievements];
  
  // Update the state with highest combo
  const newState = {
    ...currentState,
    highestCombo: Math.max(currentState.highestCombo, combo)
  };
  
  // Update achievements and get the updated state
  updateAchievements(newState);
  const updatedState = getAchievements();
  
  // Find newly achieved achievements
  return updatedState.achievements.filter(achievement => 
    achievement.achieved && 
    !prevAchievements.find(a => a.id === achievement.id)?.achieved
  );
};

export const updateGridClears = (count: number): Achievement[] => {
  const currentState = getAchievements();
  const prevAchievements = [...currentState.achievements];
  
  // Update the state with new total
  const newState = {
    ...currentState,
    totalGridClears: (currentState.totalGridClears || 0) + count
  };
  
  // Update achievements and get the updated state
  updateAchievements(newState);
  const updatedState = getAchievements();
  
  // Find newly achieved grid clear achievements
  return updatedState.achievements.filter(achievement => 
    achievement.type === 'grid_clear' &&
    achievement.achieved && 
    !prevAchievements.find(a => a.id === achievement.id)?.achieved
  );
};

export const resetAchievements = (): void => {
  const initialState = getInitialAchievementState();
  localStorage.setItem(ACHIEVEMENT_STATE_KEY, JSON.stringify(initialState));
}; 