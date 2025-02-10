import { Achievement } from '../types/achievements';

export const ACHIEVEMENTS: Omit<Achievement, 'currentProgress' | 'achieved' | 'timestamp'>[] = [
  // Tile placement achievements
  {
    id: 'tiles_beginner',
    name: 'Tile Novice',
    description: 'Place your first 10 tiles',
    icon: '🎯',
    type: 'tiles',
    requirement: 10,
  },
  {
    id: 'tiles_intermediate',
    name: 'Tile Enthusiast',
    description: 'Place 100 tiles',
    icon: '🎯',
    type: 'tiles',
    requirement: 100,
  },
  {
    id: 'tiles_expert',
    name: 'Tile Master',
    description: 'Place 500 tiles',
    icon: '🏆',
    type: 'tiles',
    requirement: 500,
  },
  
  // Score achievements
  {
    id: 'score_5000',
    name: 'Point Collector',
    description: 'Reach a score of 100 points',
    icon: '⭐',
    type: 'score',
    requirement: 5000,
  },
  {
    id: 'score_10000',
    name: 'Score Champion',
    description: 'Reach a score of 500 points',
    icon: '🌟',
    type: 'score',
    requirement: 10000,
  },

  {
    id: 'score_100000',
    name: 'Score Legend',
    description: 'Reach a score of 1,000 points',
    icon: '💫',
    type: 'score',
    requirement: 100000,
  },


  // Combo achievements
  {
    id: 'combo_3',
    name: 'Combo Starter',
    description: 'Get a 3x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 10,
  },
  {
    id: 'combo_5',
    name: 'Combo Pro',
    description: 'Get a 5x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 30,
  },
  {
    id: 'combo_10',
    name: 'Combo Master',
    description: 'Get a 10x combo',
    icon: '🌋',
    type: 'combo',
    requirement: 50,
  },

  // Special achievements
  {
    id: 'special_daily',
    name: 'Daily Player',
    description: 'Play the game for 2 consecutive days',
    icon: '📅',
    type: 'special',
    requirement: 2,
  },
]; 