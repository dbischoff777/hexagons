import { SimonStats } from '../types/simon';

const SIMON_STATS_KEY = 'hexPuzzle_simonStats';

export const SIMON_COLORS = [
  '#FF0000', // Red - Center
  '#00FF00', // Green - Right
  '#0000FF', // Blue - Bottom Right
  '#FFFF00', // Yellow - Bottom Left
  '#FF00FF', // Magenta - Left
  '#00FFFF', // Cyan - Top Left
  '#FF8000'  // Orange - Top Right
];

/**
 * Generates a random sequence of tile indices for Simon Says
 * @param length The length of the sequence to generate
 * @returns An array of tile indices
 */
export const generateSimonSequence = (length: number): number[] => {
  const sequence: number[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(Math.floor(Math.random() * 7));
  }
  return sequence;
};

/**
 * Checks if the player's sequence matches the game sequence up to the current point
 * @param playerSequence The sequence input by the player
 * @param gameSequence The full game sequence to match against
 * @returns boolean indicating if the sequences match
 */
export const checkSequenceMatch = (playerSequence: number[], gameSequence: number[]): boolean => {
  if (playerSequence.length > gameSequence.length) return false;
  return playerSequence.every((num, index) => num === gameSequence[index]);
};

/**
 * Gets the current Simon game statistics
 * @returns The current statistics object
 */
export const getSimonStats = (): SimonStats => {
  const defaultStats: SimonStats = {
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
    averageScore: 0,
    longestSequence: 0,
    lastPlayed: new Date().toISOString()
  };

  try {
    const savedStats = localStorage.getItem(SIMON_STATS_KEY);
    return savedStats ? JSON.parse(savedStats) : defaultStats;
  } catch {
    return defaultStats;
  }
};

/**
 * Updates the Simon game statistics
 * @param update Partial stats object with values to update
 */
export const updateSimonStats = (update: Partial<SimonStats>): SimonStats => {
  const currentStats = getSimonStats();
  const newStats = {
    ...currentStats,
    ...update,
    lastPlayed: new Date().toISOString()
  };

  // Recalculate average if we're updating games played or total score
  if (update.gamesPlayed || update.totalScore) {
    newStats.averageScore = Math.round(newStats.totalScore / newStats.gamesPlayed);
  }

  localStorage.setItem(SIMON_STATS_KEY, JSON.stringify(newStats));
  return newStats;
};

/**
 * Calculates points for a successful sequence completion
 * @param sequenceLength The length of the completed sequence
 * @param difficulty The current game difficulty
 * @returns The points earned
 */
export const calculateSequencePoints = (sequenceLength: number, difficulty: 'easy' | 'medium' | 'hard'): number => {
  const basePoints = 100;
  const difficultyMultiplier = {
    easy: 1,
    medium: 2,
    hard: 3
  };
  return basePoints * sequenceLength * difficultyMultiplier[difficulty];
};

/**
 * Gets the color for a specific tile index
 * @param index The tile index (0-6)
 * @returns The color for that tile
 */
export const getSimonTileColor = (index: number): string => {
  return SIMON_COLORS[index] || '#FFFFFF';
};

/**
 * Gets the sound frequency for a specific tile index
 * @param index The tile index (0-6)
 * @returns The frequency in Hz for that tile
 */
export const getSimonTileFrequency = (index: number): number => {
  // Each tile gets a unique frequency for its sound
  const baseFrequency = 220; // A3 note
  const frequencies = [
    baseFrequency * 1,    // A3 - Center
    baseFrequency * 1.25, // C#4 - Right
    baseFrequency * 1.5,  // E4 - Bottom Right
    baseFrequency * 2,    // A4 - Bottom Left
    baseFrequency * 2.5,  // C#5 - Left
    baseFrequency * 3,    // E5 - Top Left
    baseFrequency * 4     // A5 - Top Right
  ];
  return frequencies[index] || baseFrequency;
};

/**
 * Checks if a new high score has been achieved
 * @param score The current score
 * @returns boolean indicating if this is a new high score
 */
export const isNewHighScore = (score: number): boolean => {
  const stats = getSimonStats();
  return score > stats.highScore;
};

/**
 * Resets all Simon game statistics
 */
export const resetSimonStats = () => {
  const defaultStats: SimonStats = {
    gamesPlayed: 0,
    highScore: 0,
    totalScore: 0,
    averageScore: 0,
    longestSequence: 0,
    lastPlayed: new Date().toISOString()
  };
  localStorage.setItem(SIMON_STATS_KEY, JSON.stringify(defaultStats));
  return defaultStats;
}; 