import { getPlayerProgress } from './progressionUtils';

export interface CustomizationOption {
  id: string;
  name: string;
  levelRequired: number;
  unlocked: boolean;
}

// Update the level requirements and add helper functions
export const LEVEL_REQUIREMENTS = {
  colors: {
    basic: 1,
    cyberpunk: 2,
    neon: 3,
    sunset: 4,
    galaxy: 5,
    ocean: 6,
    forest: 7,
    candy: 8,
    royal: 9
  },
  accessories: {
    basic: 5,
    cyberpunk: 5,
    neon: 6,
    rainbow: 7,
    galaxy: 8
  },
  animations: 10
} as const;

export const getUnlockedCustomizations = (): CustomizationOption[] => {
  const playerLevel = getPlayerProgress().level;
  
  return [
    {
      id: 'basic_colors',
      name: 'Basic Colors',
      levelRequired: LEVEL_REQUIREMENTS.colors.basic,
      unlocked: playerLevel >= LEVEL_REQUIREMENTS.colors.basic
    },
    {
      id: 'special_colors',
      name: 'Special Colors',
      levelRequired: LEVEL_REQUIREMENTS.colors.cyberpunk,
      unlocked: playerLevel >= LEVEL_REQUIREMENTS.colors.cyberpunk
    },
    {
      id: 'basic_accessories',
      name: 'Basic Accessories',
      levelRequired: LEVEL_REQUIREMENTS.accessories.basic,
      unlocked: playerLevel >= LEVEL_REQUIREMENTS.accessories.basic
    },
    {
      id: 'special_accessories',
      name: 'Special Accessory Styles',
      levelRequired: LEVEL_REQUIREMENTS.accessories.neon,
      unlocked: playerLevel >= LEVEL_REQUIREMENTS.accessories.neon
    },
    {
      id: 'animations',
      name: 'Animation Controls',
      levelRequired: LEVEL_REQUIREMENTS.animations,
      unlocked: playerLevel >= LEVEL_REQUIREMENTS.animations
    }
  ];
};

export const isPresetUnlocked = (presetName: string, playerLevel: number): boolean => {
  const requirement = LEVEL_REQUIREMENTS.colors[presetName as keyof typeof LEVEL_REQUIREMENTS.colors] || 1;
  return playerLevel >= requirement;
};

export const getPresetRequiredLevel = (presetName: string): number => {
  return LEVEL_REQUIREMENTS.colors[presetName as keyof typeof LEVEL_REQUIREMENTS.colors] || 1;
};

export const isAccessoryStyleUnlocked = (styleName: string, playerLevel: number): boolean => {
  const requirement = LEVEL_REQUIREMENTS.accessories[styleName as keyof typeof LEVEL_REQUIREMENTS.accessories] || 5;
  return playerLevel >= requirement;
};

export const getAccessoryRequiredLevel = (styleName: string): number => {
  return LEVEL_REQUIREMENTS.accessories[styleName as keyof typeof LEVEL_REQUIREMENTS.accessories] || 5;
}; 