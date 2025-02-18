import { PlacedTile } from '../types'
import { DIRECTIONS, getAdjacentDirection, getAdjacentTiles, updateMirrorTileEdges } from './hexUtils'
import { getUpgradeEffect } from '../utils/upgradeUtils'
import { PowerUpState, ComboState } from '../types'
import { UpgradeState } from '../types/upgrades';

// Move feedback constants here
export const SCORE_FEEDBACK = {
  // Regular matches
  LOW: [
    { emoji: '✨💫', text: 'Nice!' },
    { emoji: '💎✨', text: 'Good!' },
    { emoji: '👍💫', text: 'Cool!' },
  ],
  MEDIUM: [
    { emoji: '🌟💫', text: 'Great!' },
    { emoji: '💫⭐', text: 'Awesome!' },
    { emoji: '⭐✨', text: 'Sweet!' },
  ],
  HIGH: [
    { emoji: '🔥⚡', text: 'Amazing!' },
    { emoji: '⚡💥', text: 'Fantastic!' },
    { emoji: '💥🔥', text: 'Incredible!' },
  ],
  EPIC: [
    { emoji: '🌈✨', text: 'EPIC!' },
    { emoji: '👑💫', text: 'LEGENDARY!' },
    { emoji: '💎✨', text: 'BRILLIANT!' },
  ],
  
  // Combos
  COMBO: [
    { emoji: '👍💫', text: '2x COMBO!' },
    { emoji: '🔥💫', text: '3x COMBO!' },
    { emoji: '⚡💫', text: '4x COMBO!' },
    { emoji: '💫✨', text: '5x COMBO!' },
    { emoji: '🌟💫', text: '6x COMBO!' },
    { emoji: '💥⚡', text: '7x COMBO!' },
    { emoji: '👑✨', text: '8x COMBO!' },
    { emoji: '🌈💫', text: 'MEGA COMBO!' },
  ],
  
  // Grid clears
  CLEAR: [
    { emoji: '🎪✨', text: 'CLEAR!' },         // Default clear
    { emoji: '🎮💫', text: 'GOOD CLEAR!' },    // 25+ points
    { emoji: '🎯⚡', text: 'GREAT CLEAR!' },   // 50+ points
    { emoji: '🏆💫', text: 'AMAZING CLEAR!' }, // 75+ points
    { emoji: '👑✨', text: 'EPIC CLEAR!' },    // 100+ points
  ] as const,
  
  // Quick placements
  QUICK: [
    { emoji: '⚡💨', text: 'QUICK!' },
    { emoji: '💨✨', text: 'SWIFT!' },
    { emoji: '🚀💫', text: 'SPEEDY!' },
  ]
} as const;

/**
 * Gets a random feedback item from the specified category
 */
export const getRandomFeedback = (category: keyof typeof SCORE_FEEDBACK) => {
  const options = SCORE_FEEDBACK[category];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Checks if a tile has matching edges with any adjacent tiles
 */
export const hasMatchingEdges = (
  tile: PlacedTile, 
  allTiles: PlacedTile[], 
  isColorBlind: boolean
): boolean => {
  // Rainbow tiles always match
  if (tile.isJoker) return true;

  // For mirror tiles, check if they have at least 2 matching edges
  if (tile.type === 'mirror') {
    let matchingEdges = 0;
    DIRECTIONS.forEach((dir, i) => {
      const adjTile = allTiles.find(t => 
        t.q === tile.q + dir.q && t.r === tile.r + dir.r
      );
      if (adjTile && tile.edges[i].color === adjTile.edges[(i + 3) % 6].color) {
        matchingEdges++;
      }
    });
    return matchingEdges >= 2;
  }

  const adjacentTiles = getAdjacentTiles(tile, allTiles);
  return adjacentTiles.some(adjTile => {
    if (adjTile.isJoker) return true;
    
    // For adjacent mirror tiles, also check for 2+ matches
    if (adjTile.type === 'mirror') {
      let matchingEdges = 0;
      DIRECTIONS.forEach((dir, i) => {
        const otherTile = allTiles.find(t => 
          t.q === adjTile.q + dir.q && t.r === adjTile.r + dir.r
        );
        if (otherTile && adjTile.edges[i].color === otherTile.edges[(i + 3) % 6].color) {
          matchingEdges++;
        }
      });
      return matchingEdges >= 2;
    }
    
    // Regular edge matching
    const edgeIndex = DIRECTIONS.findIndex(dir => 
      dir.q === adjTile.q - tile.q && dir.r === adjTile.r - tile.r
    );
    if (edgeIndex === -1) return false;
    
    const oppositeEdge = (edgeIndex + 3) % 6;
    return tile.edges[edgeIndex].color === adjTile.edges[oppositeEdge].color;
  });
}

/**
 * Updates the value of each tile based on its matching edges
 */
export const updateTileValues = (tiles: PlacedTile[]): PlacedTile[] => {
  // Find the newly placed tile (the last one in the array)
  const newTile = tiles[tiles.length - 1];
  
  // Get adjacent tiles that have matching edges with the new tile
  const adjacentMatchingTiles = tiles.filter(t => {
    if (t === newTile) return false; // Skip the new tile itself
    
    // First verify tiles are actually adjacent using DIRECTIONS
    const direction = DIRECTIONS.findIndex(dir => 
      dir.q === t.q - newTile.q && dir.r === t.r - newTile.r
    );
    if (direction === -1) return false; // Not adjacent
    
    // For joker tiles, count all adjacent tiles
    if (newTile.isJoker) {
      // Count all adjacent tiles when placing a joker
      return true;
    }
    // For tiles adjacent to a joker
    if (t.isJoker) {
      return true;
    }
    
    // Handle mirror tiles
    if (newTile.type === 'mirror' || t.type === 'mirror') {
      let matchCount = 0;
      if (newTile.type === 'mirror') {
        DIRECTIONS.forEach((_, i) => {
          const oppTile = tiles.find(ot => 
            ot.q === newTile.q + DIRECTIONS[i].q && 
            ot.r === newTile.r + DIRECTIONS[i].r
          );
          if (oppTile && newTile.edges[i].color === oppTile.edges[(i + 3) % 6].color) {
            matchCount++;
          }
        });
      }
      
      if (t.type === 'mirror') {
        DIRECTIONS.forEach((_, i) => {
          const oppTile = tiles.find(ot => 
            ot.q === t.q + DIRECTIONS[i].q && 
            ot.r === t.r + DIRECTIONS[i].r
          );
          if (oppTile && t.edges[i].color === oppTile.edges[(i + 3) % 6].color) {
            matchCount++;
          }
        });
      }
      
      // Mirror tiles need at least 2 matches
      return matchCount >= 2;
    }
    
    // Check if edges match for regular tiles
    const oppositeDirection = (direction + 3) % 6;
    return newTile.edges[direction].color === t.edges[oppositeDirection].color;
  });
  
  return tiles.map(tile => {
    let matches = 0;
    let matchingEdges = 0;

    // For joker tiles, count all adjacent tiles
    if (tile.isJoker) {
      DIRECTIONS.forEach((dir) => {
        const neighborTile = tiles.find(t => 
          t.q === tile.q + dir.q && t.r === tile.r + dir.r
        );
        if (neighborTile) {
          matches++;
        }
      });
    } else {
      // Regular matching logic for non-joker tiles
      DIRECTIONS.forEach((dir, i) => {
        const neighborTile = tiles.find(t => 
          t.q === tile.q + dir.q && t.r === tile.r + dir.r
        );

        if (neighborTile) {
          const oppositeEdge = (i + 3) % 6;
          const isMatching = tile.edges[i].color === neighborTile.edges[oppositeEdge].color;

          if (tile.type === 'mirror' && isMatching) {
            matchingEdges++;
          }

          if (isMatching || neighborTile.isJoker) {
            matches++;
          }
        }
      });
    }

    // For mirror tiles, only award points if there are 2+ matching edges
    if (tile.type === 'mirror' && matchingEdges >= 2) {
      matches = matchingEdges * 2;
    }
    
    const hasMatches = matches > 0;
    const isNewlyPlacedTile = tile.q === newTile.q && tile.r === newTile.r;
    const isMatchingAdjacent = adjacentMatchingTiles.some(t => t.q === tile.q && t.r === tile.r);
    
    return {
      ...tile,
      value: hasMatches ? (
        isNewlyPlacedTile ? matches : // New tile gets number of matches
        isMatchingAdjacent ? tile.value + 1 : // Adjacent tiles increment by 1
        tile.value // Keep other tiles' values
      ) : 0,
      hasBeenMatched: hasMatches
    };
  });
};

/**
 * Gets feedback text and emoji based on score value
 */
export const getFeedbackForScore = (score: number) => {
  if (score >= 30) return getRandomFeedback('EPIC');
  if (score >= 20) return getRandomFeedback('HIGH');
  if (score >= 15) return getRandomFeedback('MEDIUM');
  if (score >= 10) return getRandomFeedback('LOW');
  return getRandomFeedback('LOW');
}

/**
 * Gets feedback text and emoji based on combo count
 */
export const getFeedbackForCombo = (comboCount: number) => {
  // COMBO array is 0-based, but represents 2x-9x combos
  const comboIndex = Math.min(Math.max(0, comboCount - 2), 7);
  return SCORE_FEEDBACK.COMBO[comboIndex];
}

/**
 * Gets feedback text and emoji based on clear score
 */
export const getFeedbackForClear = (clearScore: number) => {
  if (clearScore >= 100) return SCORE_FEEDBACK.CLEAR[4];
  if (clearScore >= 75 && SCORE_FEEDBACK.CLEAR[3]) return SCORE_FEEDBACK.CLEAR[3];
  if (clearScore >= 50) return SCORE_FEEDBACK.CLEAR[2];
  if (clearScore >= 25) return SCORE_FEEDBACK.CLEAR[1];
  return SCORE_FEEDBACK.CLEAR[0];
}

export const calculateScore = (
  baseScore: number,
  upgradeState: UpgradeState,
  powerUps: PowerUpState,
  combo: ComboState
) => {
  const scoreMultiplier = getUpgradeEffect(upgradeState, 'scoreMultiplier');
  const matchBonus = getUpgradeEffect(upgradeState, 'matchBonus');
  const comboBonus = getUpgradeEffect(upgradeState, 'comboBonus');
  
  const powerUpMultiplier = powerUps.multiplier.active ? powerUps.multiplier.value : 1;
  const finalMultiplier = scoreMultiplier * powerUpMultiplier * (combo.multiplier + comboBonus);
  
  return Math.round((baseScore + matchBonus) * finalMultiplier);
};

export const handleTileMatches = (
  newTile: PlacedTile,
  allTiles: PlacedTile[],
  settings: { isColorBlind: boolean },
  upgradeState: UpgradeState,
  powerUps: PowerUpState,
  combo: ComboState
): {
  matchCount: number;
  updatedTiles: PlacedTile[];
  score: number;
} => {
  // Get adjacent tiles
  const adjacentTiles = getAdjacentTiles(newTile, allTiles);
  let matchCount = 0;

  // Check each edge for matches
  newTile.edges.forEach((edge: { color: string }, index: number) => {
    const adjacentTile = adjacentTiles.find((t: PlacedTile) => 
      getAdjacentDirection(newTile.q, newTile.r, t.q, t.r) === index
    );
    
    if (adjacentTile) {
      const adjacentEdgeIndex = (getAdjacentDirection(adjacentTile.q, adjacentTile.r, newTile.q, newTile.r) + 3) % 6;
      if (edge.color === adjacentTile.edges[adjacentEdgeIndex].color || 
          newTile.isJoker || adjacentTile.isJoker) {
        matchCount++;
      }
    }
  });

  // Handle mirror tile special case
  if (newTile.type === 'mirror') {
    const { points } = updateMirrorTileEdges(newTile, allTiles);
    matchCount = Math.floor(points / 5); // Convert points back to match count
  }

  // Update all tiles with new values
  const updatedTiles = updateTileValues([...allTiles, newTile]);

  // Calculate score
  const baseScore = matchCount * 5;
  const finalScore = calculateScore(baseScore, upgradeState, powerUps, combo);

  return {
    matchCount,
    updatedTiles,
    score: finalScore
  };
};

// Add this new interface at the top
interface MatchResult {
  matchCount: number;
  updatedTiles: PlacedTile[];
  matchScore: number;
  comboState: ComboState;
}

// Add this new function to centralize keyboard placement matching logic
export const processPlacementMatches = (
  newTile: PlacedTile,
  allTiles: PlacedTile[],
  settings: { isColorBlind: boolean },
  upgradeState: UpgradeState,
  powerUps: PowerUpState,
  combo: ComboState,
  quickPlacement: boolean
): MatchResult => {
  // Create initial tiles with updated values
  const updatedTiles = updateTileValues([...allTiles, newTile]);

  // Mark matched tiles
  const tilesWithMatches = updatedTiles.map((tile: PlacedTile): PlacedTile => ({
    ...tile,
    hasBeenMatched: hasMatchingEdges(tile, updatedTiles, settings.isColorBlind),
    powerUp: tile.powerUp
  }));

  // Get the updated tile with its correct value
  const updatedPlacedTile = tilesWithMatches.find(tile => 
    tile.q === newTile.q && tile.r === newTile.r
  )!;

  // Count matching edges
  const adjacentTiles = getAdjacentTiles(updatedPlacedTile, tilesWithMatches);
  let matchCount = 0;

  // Check each edge for matches
  updatedPlacedTile.edges.forEach((edge: { color: string }, index: number) => {
    const adjacentTile = adjacentTiles.find((t: PlacedTile) => 
      getAdjacentDirection(updatedPlacedTile.q, updatedPlacedTile.r, t.q, t.r) === index
    );
    
    if (adjacentTile) {
      const adjacentEdgeIndex = (getAdjacentDirection(adjacentTile.q, adjacentTile.r, updatedPlacedTile.q, updatedPlacedTile.r) + 3) % 6;
      if (edge.color === adjacentTile.edges[adjacentEdgeIndex].color) {
        matchCount++;
      }
    }
  });

  // Calculate score and combo
  const basePoints = matchCount * 5;
  const matchScore = calculateScore(basePoints, upgradeState, powerUps, combo);

  // Update combo state
  const newComboState: ComboState = {
    count: quickPlacement ? combo.count + 1 : 1,
    timer: 3,
    multiplier: quickPlacement ? combo.multiplier * 1.5 : 1,
    lastPlacementTime: Date.now()
  };

  return {
    matchCount,
    updatedTiles: tilesWithMatches,
    matchScore,
    comboState: newComboState
  };
};

// Add this helper function to check for grid clear matches
export const processGridClearMatches = (
  tiles: PlacedTile[],
  settings: { isColorBlind: boolean }
): PlacedTile[] => {
  return tiles.filter((tile: PlacedTile) => 
    hasMatchingEdges(tile, tiles, settings.isColorBlind)
  );
};

// Add this new function to handle grid clear effects
export const handleGridClearEffects = (
  tiles: PlacedTile[],
  settings: { isColorBlind: boolean },
  combo: ComboState
): {
  matchingTiles: PlacedTile[];
  gridBonus: number;
  newComboState: ComboState;
} => {
  const matchingTiles = processGridClearMatches(tiles, settings);
  const gridBonus = 1000; // Base grid clear bonus

  const newComboState = {
    ...combo,
    count: combo.count + 1,
    multiplier: combo.multiplier * 1.5,
    lastPlacementTime: Date.now()
  };

  return {
    matchingTiles,
    gridBonus,
    newComboState
  };
};

// Add this function to handle sound effects for matches
export const shouldPlayMatchSound = (
  matchCount: number,
  isGridClear: boolean = false
): boolean => {
  return matchCount > 0 || isGridClear;
};