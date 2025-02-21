import { Tile, PlacedTile, Edge } from "../types/index"
import { getPowerUpColor } from './themeUtils'
import { DEFAULT_SCHEME } from './colorSchemes'
import { SeasonalTheme } from '../types/progression'

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

export const createTileWithRandomEdges = (
  q: number, 
  r: number, 
  colorScheme = DEFAULT_SCHEME,
  theme?: SeasonalTheme
): PlacedTile => {
  // Power-up spawn chances (in percentage)
  const POWER_UP_CHANCES = {
    freeze: 5,     // 5% chance
    colorShift: 5, // 5% chance
    multiplier: 5  // 5% chance
  };

  // Roll for power-up
  const powerUpRoll = Math.random() * 100;
  let powerUp: PlacedTile['powerUp'] = undefined;

  if (powerUpRoll < POWER_UP_CHANCES.freeze) {
    powerUp = {
      type: 'freeze' as const,
      duration: 5,
      active: false
    };
  } else if (powerUpRoll < POWER_UP_CHANCES.freeze + POWER_UP_CHANCES.colorShift) {
    powerUp = {
      type: 'colorShift' as const,
      active: false
    };
  } else if (powerUpRoll < POWER_UP_CHANCES.freeze + POWER_UP_CHANCES.colorShift + POWER_UP_CHANCES.multiplier) {
    powerUp = {
      type: 'multiplier' as const,
      multiplier: 2,
      duration: 15,
      active: false
    };
  }

  // Determine if this should be a mirror tile (5% chance)
  const isMirror = Math.random() < 0.05;

  // Determine if this should be a joker tile (5% chance)
  const isJoker = !isMirror && Math.random() < 0.05; // Don't make both mirror and joker

  // Create the edges based on whether it's a power-up tile
  let edges: Edge[];
  if (powerUp) {
    const color = getPowerUpColor(powerUp.type, colorScheme);
    edges = Array(6).fill(null).map(() => ({ color }));
  } else {
    edges = Array(6).fill(null).map(() => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  return {
    q,
    r,
    edges,
    isPlaced: false,
    value: 0,
    type: isMirror ? 'mirror' : 'normal',
    isJoker,
    powerUp
  };
}

export const hexToPixel = (q: number, r: number, centerX: number, centerY: number, size: number) => {
  const spacing = 1.1;
  const hexWidth = size * spacing * 1.5;
  const hexHeight = size * spacing * Math.sqrt(3);
  
  // Convert grid coordinates to pixel coordinates
  const x = centerX + (q * hexWidth);
  const y = centerY + (r * hexHeight + q * hexHeight/2);
  
  return { x, y };
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

// Add this new function to get adjacent positions
export const getAdjacentPositions = (q: number, r: number): { q: number, r: number }[] => {
  return [
    { q: q + 1, r: r },     // right
    { q: q - 1, r: r },     // left
    { q: q, r: r + 1 },     // bottom right
    { q: q, r: r - 1 },     // top left
    { q: q + 1, r: r - 1 }, // top right
    { q: q - 1, r: r + 1 }  // bottom left
  ];
};

// Add this function to get the direction index between two hexes
export const getAdjacentDirection = (fromQ: number, fromR: number, toQ: number, toR: number): number => {
  // Calculate the difference vector
  const dq = toQ - fromQ;
  const dr = toR - fromR;
  
  // Check each direction
  for (let i = 0; i < DIRECTIONS.length; i++) {
    if (DIRECTIONS[i].q === dq && DIRECTIONS[i].r === dr) {
      return i;
    }
  }
  
  // Return -1 if not adjacent
  return -1;
}; 