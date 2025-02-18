import { PowerUpType } from '../types';
import { BASE_COLORS } from './colorConstants';
import { ColorScheme } from '../types/colors';
import { SeasonalTheme } from '../types/progression';

export const getPowerUpColor = (
  type: PowerUpType, 
  colorScheme?: ColorScheme,
  theme?: SeasonalTheme
): string => {
  // If using a seasonal theme, map power-up colors to theme colors
  if (theme) {
    switch (type) {
      case 'freeze':
        return theme.colors.primary;
      case 'multiplier':
        return theme.colors.accent;
      case 'colorShift':
        return theme.colors.secondary;
    }
  }

  // If using a color scheme (e.g., colorblind mode)
  if (colorScheme) {
    switch (type) {
      case 'freeze':
        return colorScheme.colors[3]; // Sky Blue for colorblind
      case 'multiplier':
        return colorScheme.colors[1]; // Gold for colorblind
      case 'colorShift':
        return colorScheme.colors[0]; // Light Red for colorblind
    }
  }

  // Default to base colors
  return BASE_COLORS.powerUps[type];
}; 