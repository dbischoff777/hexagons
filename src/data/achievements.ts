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
  {
    id: 'tiles_master',
    name: 'Tile Master',
    description: 'Place 1000 tiles',
    icon: '🏆',
    type: 'tiles',
    requirement: 1000,
  },

  // Score achievements
  {
    id: 'score_5000',

    name: 'Point Collector',
    description: 'Reach a score of 5,000 points',
    icon: '⭐',
    type: 'score',
    requirement: 5000,
  },
  {
    id: 'score_10000',
    name: 'Score Champion',
    description: 'Reach a score of 10,000 points',
    icon: '🌟',
    type: 'score',
    requirement: 10000,

  },

  {
    id: 'score_100000',
    name: 'Score Legend',
    description: 'Reach a score of 100,000 points',
    icon: '💫',
    type: 'score',
    requirement: 100000,

  },
  {
    id: 'score_1000000',
    name: 'Score Deity',
    description: 'Reach a score of 1,000,000 points',
    icon: '💫',
    type: 'score',
    requirement: 1000000,

  },


  // Combo achievements
  {
    id: 'combo_10',
    name: 'Combo Starter',
    description: 'Get a 10x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 10,
  },
  {
    id: 'combo_30',
    name: 'Combo Pro',
    description: 'Get a 30x combo',
    icon: '🔥',
    type: 'combo',
    requirement: 30,
  },
  {
    id: 'combo_50',
    name: 'Combo Master',
    description: 'Get a 50x combo',
    icon: '🌋',
    type: 'combo',
    requirement: 50,
  },
  {
    id: 'combo_100',
    name: 'Combo Legend',
    description: 'Get a 100x combo',
    icon: '🌋',
    type: 'combo',
    requirement: 100,
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
   {
    id: 'special_daily',
    name: 'Loyal Player',
    description: 'Play the game for 7 consecutive days',
    icon: '📅',
    type: 'special',
    requirement: 3,
  },
]; 