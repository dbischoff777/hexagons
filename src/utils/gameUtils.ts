import { Tile, PlacedTile } from '../types/index'
import { DIRECTIONS, getAdjacentTiles } from './hexUtils'
import { getEdgeValue } from './accessibilityUtils'

export const INITIAL_TIME = 180 // 3 minutes in seconds

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

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

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

export const isGridFull = (tiles: Tile[], cols: number): boolean => {
  // Calculate total possible positions in the hexagonal grid
  const radius = Math.floor(cols/2)
  let totalPositions = 0
  for (let q = -radius; q <= radius; q++) {
    const rStart = Math.max(-radius, -q-radius)
    const rEnd = Math.min(radius, -q+radius)
    totalPositions += rEnd - rStart + 1
  }
  
  return tiles.length >= totalPositions
} 