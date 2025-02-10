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
    id: 'score_100',
    name: 'Point Collector',
    description: 'Reach a score of 100 points',
    icon: '⭐',
    type: 'score',
    requirement: 100,
  },
  {
    id: 'score_500',
    name: 'Score Champion',
    description: 'Reach a score of 500 points',
    icon: '🌟',
    type: 'score',
    requirement: 500,
  },
  {
    id: 'score_1000',
    name: 'Score Legend',
    description: 'Reach a score of 1,000 points',
    icon: '💫',
    type: 'score',
    requirement: 1000,
  },

  // Combo achievements
  {
    id: 'combo_3',
    name: 'Combo Starter',
    description: 'Get a 3x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 3,
  },
  {
    id: 'combo_5',
    name: 'Combo Pro',
    description: 'Get a 5x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 5,
  },
  {
    id: 'combo_10',
    name: 'Combo Master',
    description: 'Get a 10x combo',
    icon: '🌋',
    type: 'combo',
    requirement: 10,
  },

  // Time achievements
  {
    id: 'time_60',
    name: 'Speed Runner',
    description: 'Complete a game in under 60 seconds',
    icon: '⚡',
    type: 'time',
    requirement: 60,
  },
  {
    id: 'time_30',
    name: 'Lightning Fast',
    description: 'Complete a game in under 30 seconds',
    icon: '⚡',
    type: 'time',
    requirement: 30,
  },

  // Special achievements
  {
    id: 'special_perfect',
    name: 'Perfect Game',
    description: 'Complete a game without any mistakes',
    icon: '👑',
    type: 'special',
    requirement: 1,
  },
  {
    id: 'special_daily',
    name: 'Daily Player',
    description: 'Play the game for 7 consecutive days',
    icon: '📅',
    type: 'special',
    requirement: 7,
  },
]; 