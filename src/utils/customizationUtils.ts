import { getPlayerProgress } from './progressionUtils';

export interface CustomizationOption {
  id: string;
  name: string;
  levelRequired: number;
  unlocked: boolean;
}

export const getUnlockedCustomizations = (): CustomizationOption[] => {
  const playerLevel = getPlayerProgress().level;
  
  return [
    {
      id: 'basic_colors',
      name: 'Basic Colors',
      levelRequired: 1,
      unlocked: true
    },
    {
      id: 'special_colors',
      name: 'Special Colors',
      levelRequired: 5,
      unlocked: playerLevel >= 5
    },
    {
      id: 'accessories',
      name: 'Accessories',
      levelRequired: 10,
      unlocked: playerLevel >= 10
    },
    {
      id: 'animations',
      name: 'Special Animations',
      levelRequired: 15,
      unlocked: playerLevel >= 15
    }
  ];
}; 