import { PlacedTile } from '../types'
import { DIRECTIONS, getAdjacentTiles } from './hexUtils'

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
  return tiles.map(tile => {
    let matches = 0;
    let matchingEdges = 0;

    DIRECTIONS.forEach((dir, i) => {
      const neighborTile = tiles.find(t => 
        t.q === tile.q + dir.q && t.r === tile.r + dir.r
      );

      if (neighborTile) {
        const oppositeEdge = (i + 3) % 6;
        const isMatching = tile.edges[i].color === neighborTile.edges[oppositeEdge].color;

        // For mirror tiles, count matching edges
        if (tile.type === 'mirror' && isMatching) {
          matchingEdges++;
        }

        // Add points for regular matches or special tiles
        if (isMatching || tile.isJoker || neighborTile.isJoker) {
          matches++;
          // Bonus points for special tiles
          if (tile.isJoker || neighborTile.isJoker) {
            matches++;
          }
        }
      }
    });

    // For mirror tiles, only award points if there are 2+ matching edges
    if (tile.type === 'mirror' && matchingEdges >= 2) {
      matches = matchingEdges * 2; // Double points for mirror matches
    }
    
    return {
      ...tile,
      value: matches > 0 ? matches : 0
    };
  });
}

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
  if (clearScore >= 75) return SCORE_FEEDBACK.CLEAR[3];
  if (clearScore >= 50) return SCORE_FEEDBACK.CLEAR[2];
  if (clearScore >= 25) return SCORE_FEEDBACK.CLEAR[1];
  return SCORE_FEEDBACK.CLEAR[0];
}