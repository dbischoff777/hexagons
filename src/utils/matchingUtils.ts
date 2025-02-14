import { PlacedTile } from '../types'
import { DIRECTIONS, getAdjacentTiles } from './hexUtils'

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
  if (score >= 30) return { text: "EPIC!", emoji: "🌟✨" };
  if (score >= 20) return { text: "Amazing!", emoji: "🎯💫" };
  if (score >= 15) return { text: "Great!", emoji: "⭐️" };
  if (score >= 10) return { text: "Nice!", emoji: "✨" };
  return { text: "Match!", emoji: "✨" };
}

/**
 * Gets feedback text and emoji based on combo count
 */
export const getFeedbackForCombo = (comboCount: number) => {
  if (comboCount >= 10) return { text: "UNSTOPPABLE!", emoji: "🔥⚡️" };
  if (comboCount >= 7) return { text: "DOMINATING!", emoji: "🌟💥" };
  if (comboCount >= 5) return { text: "RAMPAGE!", emoji: "🎯🔥" };
  if (comboCount >= 3) return { text: "COMBO!", emoji: "⭐️" };
  return { text: "Quick Match!", emoji: "✨" };
}