export interface TileUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: {
    type: 'scoreMultiplier' | 'matchBonus' | 'powerUpChance' | 'mirrorTileChance' | 'comboBonus';
    value: number;
    increment: number; // How much the value increases per level
  };
  icon: string;
}

export interface GridUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  currentLevel: number;
  effect: {
    type: 'gridSize' | 'rotationTime' | 'timeBonus' | 'startingTiles';
    value: number;
    increment: number;
  };
  icon: string;
}

export interface UpgradeState {
  tileUpgrades: TileUpgrade[];
  gridUpgrades: GridUpgrade[];
  points: number;
} 