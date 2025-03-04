import { DEFAULT_SCHEME } from './colorSchemes';

export const BASE_COLORS = {
  powerUps: {
    freeze: DEFAULT_SCHEME.colors.secondary,    // Cyan '#00CCFF'
    multiplier: DEFAULT_SCHEME.colors.primary,  // Green '#00FF9F'
    colorShift: DEFAULT_SCHEME.colors.accent    // Pink '#FF1177'
  }
} as const; 