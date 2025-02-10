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

  const adjacentTiles = getAdjacentTiles(tile, allTiles);
  return adjacentTiles.some(adjTile => {
    // Adjacent rainbow tiles always match
    if (adjTile.isJoker) return true;
    
    // Find the edge indices that connect these tiles
    const edgeIndex = DIRECTIONS.findIndex(dir => 
      dir.q === adjTile.q - tile.q && dir.r === adjTile.r - tile.r
    );
    if (edgeIndex === -1) return false;
    
    const oppositeEdge = (edgeIndex + 3) % 6;

    if (isColorBlind) {
      const tileValue = getEdgeValue(tile.edges[edgeIndex].color, true);
      const neighborValue = getEdgeValue(adjTile.edges[oppositeEdge].color, true);
      return tileValue === neighborValue;
    }
    
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
    let matches = 0
    DIRECTIONS.forEach((dir, i) => {
      const neighborTile = tiles.find(t => 
        t.q === tile.q + dir.q && t.r === tile.r + dir.r
      )
      if (neighborTile && (
        tile.isJoker || 
        neighborTile.isJoker || 
        tile.edges[i].color === neighborTile.edges[(i + 3) % 6].color
      )) {
        matches++
        // Bonus points for joker matches
        if (tile.isJoker || neighborTile.isJoker) {
          matches++
        }
      }
    })
    
    return {
      ...tile,
      value: matches > 0 ? matches : 0
    }
  })
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