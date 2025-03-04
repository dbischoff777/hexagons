import { PowerUpType } from '../types';

export const getPowerUpColor = (
  type: PowerUpType, 
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