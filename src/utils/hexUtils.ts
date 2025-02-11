import { Tile, PlacedTile } from "../types/index"
import { getPlayerProgress } from './progressionUtils';

export const COLORS = [
  '#FF1177',  // Neon pink
  //'#00FF9F',  // Neon green
  '#00FFFF',  // Neon cyan
  '#FFE900',  // Neon yellow
  //'#FF00FF',  // Neon magenta
  '#4D4DFF'   // Neon blue
]

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

export const getAdjacentTiles = (tile: Tile, allTiles: PlacedTile[]): PlacedTile[] => {
  return allTiles.filter(t => 
    (Math.abs(t.q - tile.q) <= 1 && Math.abs(t.r - tile.r) <= 1) && // Adjacent coordinates
    !(t.q === tile.q && t.r === tile.r) // Not the same tile
  )
}

export const createTileWithRandomEdges = (q: number, r: number): PlacedTile => {
  const progress = getPlayerProgress();
  const hasRainbowTile = progress.unlockedRewards.includes('rainbow_tile');
  const hasMirrorTile = progress.unlockedRewards.includes('mirror_tile');
  const unlockedPowerups = progress.unlockedRewards.filter(id => 
    ['time_freeze', 'color_shift', 'multiplier'].includes(id)
  );
  
  // Small chance for power-up (10% if any are unlocked)
  if (unlockedPowerups.length > 0 && Math.random() < 0.1) {
    const powerUpId = unlockedPowerups[Math.floor(Math.random() * unlockedPowerups.length)];
    
    return {
      q, r,
      edges: Array(6).fill(null).map(() => ({
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      })),
      isPlaced: false,
      value: 0,
      type: 'normal',
      powerUp: {
        type: powerUpId === 'time_freeze' ? 'freeze' :
              powerUpId === 'color_shift' ? 'colorShift' : 'multiplier',
        duration: powerUpId === 'time_freeze' ? 10 :
                 powerUpId === 'multiplier' ? 15 : undefined,
        multiplier: powerUpId === 'multiplier' ? 2 : undefined,
        active: false
      }
    };
  }
  
  // Small chance for special tiles (10% each if unlocked)
  if (hasRainbowTile && Math.random() < 0.1) {
    return {
      q, r,
      edges: Array(6).fill({ color: 'rainbow' }),
      isPlaced: false,
      value: 0,
      type: 'rainbow',
      isJoker: true
    };
  }
  
  if (hasMirrorTile && Math.random() < 0.1) {
    return {
      q, r,
      edges: Array(6).fill({ color: '#CCCCCC' }),
      isPlaced: false,
      value: 0,
      type: 'mirror'
    };
  }

  return {
    q, r,
    edges: Array(6).fill(null).map(() => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })),
    isPlaced: false,
    value: 0,
    type: 'normal'
  };
}

export const hexToPixel = (q: number, r: number, centerX: number, centerY: number, size: number) => {
  const x = centerX + size * (3/2 * q)
  const y = centerY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  return { x, y }
}

export const DIRECTIONS = [
  { q: 1, r: 0 },   // right
  { q: 0, r: 1 },   // bottom right
  { q: -1, r: 1 },  // bottom left
  { q: -1, r: 0 },  // left
  { q: 0, r: -1 },  // top left
  { q: 1, r: -1 }   // top right
]

export const updateMirrorTileEdges = (mirrorTile: PlacedTile, placedTiles: PlacedTile[]): { tile: PlacedTile; points: number } => {
  const adjacentTiles = getAdjacentTiles(mirrorTile, placedTiles);
  let points = 0;
  
  // Create new edges array
  const newEdges = mirrorTile.edges.map((edge, index) => {
    const oppositeIndex = (index + 3) % 6;
    const adjacentTile = adjacentTiles[index];
    const oppositeAdjacentTile = adjacentTiles[oppositeIndex];

    // If there's a tile on either side, mirror its color
    if (adjacentTile?.edges[(index + 3) % 6]?.color) {
      points += 5; // Award points for each match
      return { color: adjacentTile.edges[(index + 3) % 6].color };
    } else if (oppositeAdjacentTile?.edges[index]?.color) {
      points += 5; // Award points for each match
      return { color: oppositeAdjacentTile.edges[index].color };
    }
    
    return edge; // Keep existing edge if no adjacent tiles
  });

  return {
    tile: { ...mirrorTile, edges: newEdges },
    points
  };
}; 