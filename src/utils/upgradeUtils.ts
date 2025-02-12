import { TileUpgrade, GridUpgrade, UpgradeState } from '../types/upgrades';

const INITIAL_TILE_UPGRADES: TileUpgrade[] = [
  {
    id: 'scoreMultiplier',
    name: 'Score Multiplier',
    description: 'Increase base score from matches',
    cost: 1,
    maxLevel: 5,
    currentLevel: 0,
    effect: {
      type: 'scoreMultiplier',
      value: 1,
      increment: 0.2
    },
    icon: '💎'
  },
  {
    id: 'matchBonus',
    name: 'Match Bonus',
    description: 'Extra points for multiple matches',
    cost: 150,
    maxLevel: 3,
    currentLevel: 0,
    effect: {
      type: 'matchBonus',
      value: 0,
      increment: 5
    },
    icon: '✨'
  },
  {
    id: 'powerUpChance',
    name: 'Power-Up Frequency',
    description: 'Increase chance of power-up tiles',
    cost: 200,
    maxLevel: 4,
    currentLevel: 0,
    effect: {
      type: 'powerUpChance',
      value: 0.15,
      increment: 0.05
    },
    icon: '⚡'
  },
  {
    id: 'mirrorTileChance',
    name: 'Mirror Master',
    description: 'Increase chance of mirror tiles',
    cost: 250,
    maxLevel: 3,
    currentLevel: 0,
    effect: {
      type: 'mirrorTileChance',
      value: 0.1,
      increment: 0.05
    },
    icon: '🪞'
  },
  {
    id: 'comboBonus',
    name: 'Combo Expert',
    description: 'Increase combo multiplier',
    cost: 300,
    maxLevel: 5,
    currentLevel: 0,
    effect: {
      type: 'comboBonus',
      value: 1,
      increment: 0.1
    },
    icon: '🔥'
  }
];

const INITIAL_GRID_UPGRADES: GridUpgrade[] = [
  {
    id: 'gridSize',
    name: 'Grid Expansion',
    description: 'Increase the size of the playing grid',
    cost: 500,
    maxLevel: 3,
    currentLevel: 0,
    effect: {
      type: 'gridSize',
      value: 7,
      increment: 2
    },
    icon: '🔲'
  },
  {
    id: 'rotationTime',
    name: 'Rotation Mastery',
    description: 'Increase time between grid rotations',
    cost: 200,
    maxLevel: 5,
    currentLevel: 0,
    effect: {
      type: 'rotationTime',
      value: 30,
      increment: 5
    },
    icon: '🔄'
  },
  {
    id: 'timeBonus',
    name: 'Time Extension',
    description: 'Additional time for timed mode',
    cost: 250,
    maxLevel: 4,
    currentLevel: 0,
    effect: {
      type: 'timeBonus',
      value: 0,
      increment: 15
    },
    icon: '⏰'
  },
  {
    id: 'startingTiles',
    name: 'Head Start',
    description: 'Start with additional tiles placed',
    cost: 300,
    maxLevel: 3,
    currentLevel: 0,
    effect: {
      type: 'startingTiles',
      value: 1,
      increment: 1
    },
    icon: '🎯'
  }
];

const UPGRADE_STATE_KEY = 'hexagon-upgrade-state';

export const getInitialUpgradeState = (): UpgradeState => {
  const savedState = localStorage.getItem(UPGRADE_STATE_KEY);
  if (savedState) {
    return JSON.parse(savedState);
  }
  return {
    tileUpgrades: INITIAL_TILE_UPGRADES,
    gridUpgrades: INITIAL_GRID_UPGRADES,
    points: 0
  };
};

export const saveUpgradeState = (state: UpgradeState) => {
  localStorage.setItem(UPGRADE_STATE_KEY, JSON.stringify(state));
};

export const purchaseUpgrade = (
  state: UpgradeState,
  upgradeId: string,
  type: 'tile' | 'grid'
): UpgradeState => {
  const upgrades = type === 'tile' ? state.tileUpgrades : state.gridUpgrades;
  const upgrade = upgrades.find(u => u.id === upgradeId);

  if (!upgrade || upgrade.currentLevel >= upgrade.maxLevel || state.points < upgrade.cost) {
    return state;
  }

  const updatedUpgrades = upgrades.map(u => 
    u.id === upgradeId 
      ? { ...u, currentLevel: u.currentLevel + 1 }
      : u
  );

  const newState = {
    ...state,
    points: state.points - upgrade.cost,
    [type === 'tile' ? 'tileUpgrades' : 'gridUpgrades']: updatedUpgrades
  };

  saveUpgradeState(newState);
  return newState;
};

export const getUpgradeEffect = (
  state: UpgradeState,
  effectType: string
): number => {
  const allUpgrades = [...state.tileUpgrades, ...state.gridUpgrades];
  const upgrade = allUpgrades.find(u => u.effect.type === effectType);
  
  if (!upgrade) return 0;
  
  return upgrade.effect.value + (upgrade.currentLevel * upgrade.effect.increment);
}; 