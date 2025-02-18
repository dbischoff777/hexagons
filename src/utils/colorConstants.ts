import { DEFAULT_SCHEME } from './colorSchemes';

export const BASE_COLORS = {
  powerUps: {
    freeze: DEFAULT_SCHEME.colors[3],    // Cyan '#00FFFF'
    multiplier: DEFAULT_SCHEME.colors[1], // Yellow '#FFE900'
    colorShift: DEFAULT_SCHEME.colors[0]  // Pink '#FF1177'
  }
} as const; 