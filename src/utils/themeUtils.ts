import { PowerUpType } from '../types';
import { ColorScheme } from '../types/colors';
import { SeasonalTheme } from '../types/progression';

export const getPowerUpColor = (
  type: PowerUpType, 
  colorScheme?: ColorScheme,
  theme?: SeasonalTheme
): string => {
  // Fixed colors for power-ups regardless of theme/scheme
  switch (type) {
    case 'freeze':
      return '#00FFFF';  // Cyan/Ice Blue
    case 'multiplier':
      return '#FFD700';  // Gold/Yellow
    case 'colorShift':
      return '#FF00FF';  // Magenta
  }
}; 