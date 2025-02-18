import { PlacedTile, PowerUpType } from '../types';
import { createTileWithRandomEdges } from './hexUtils';
import { getUpgradeEffect } from './upgradeUtils';
import { UpgradeState } from '../types/upgrades';

// Types for power-ups
interface PowerUpConfig {
  type: PowerUpType;
  duration?: number;
  multiplier?: number;
}

// Function to create a power-up tile
const createPowerUpTile = (basePosition: { q: number, r: number }): PlacedTile => {
  const powerUpTypes: PowerUpType[] = ['freeze', 'colorShift', 'multiplier'];
  const randomPowerUp = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
  
  const powerUpConfig: PowerUpConfig = {
    type: randomPowerUp,
    duration: randomPowerUp === 'freeze' ? 5 : 15,
    multiplier: randomPowerUp === 'multiplier' ? 2 : undefined
  };

  return {
    ...createTileWithRandomEdges(basePosition.q, basePosition.r),
    isPlaced: false,
    type: 'normal' as const,
    powerUp: {
      ...powerUpConfig,
      active: false
    }
  };
};

// Function to create a mirror tile
const createMirrorTile = (basePosition: { q: number, r: number }): PlacedTile => {
  return {
    ...createTileWithRandomEdges(basePosition.q, basePosition.r),
    isPlaced: false,
    type: 'mirror' as const,
  };
};

// Main factory function to create new tiles
export const createNewTile = (
  upgradeState: UpgradeState,
  basePosition: { q: number, r: number } = { q: 0, r: 0 }
): PlacedTile => {
  const powerUpChance = getUpgradeEffect(upgradeState, 'powerUpChance');
  const mirrorChance = getUpgradeEffect(upgradeState, 'mirrorTileChance');
  
  // First check for mirror tile
  if (Math.random() < mirrorChance) {
    return createMirrorTile(basePosition);
  }
  
  // If not a mirror tile, then check for power-up
  // Adjust power-up chance to not compete with mirror tiles
  const adjustedPowerUpChance = powerUpChance * (1 - mirrorChance);
  if (Math.random() < adjustedPowerUpChance) {
    return createPowerUpTile(basePosition);
  }
  
  // If neither mirror nor power-up, create normal tile
  return {
    ...createTileWithRandomEdges(basePosition.q, basePosition.r),
    isPlaced: false,
    type: 'normal' as const
  };
};

// Function to create initial tile
export const createInitialTile = (): PlacedTile => {
  return {
    ...createTileWithRandomEdges(0, 0),
    isPlaced: true,
    type: 'normal' as const
  };
};

// Function to create multiple tiles
export const createTiles = (
  count: number,
  upgradeState: UpgradeState
): PlacedTile[] => {
  return Array(count).fill(null).map(() => createNewTile(upgradeState));
}; 