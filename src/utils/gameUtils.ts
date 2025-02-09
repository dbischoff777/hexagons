import { Tile, PlacedTile } from '../types'
import { DIRECTIONS } from './hexUtils'
import { getEdgeValue } from './accessibilityUtils'

export const INITIAL_TIME = 180 // 3 minutes in seconds

export const hasMatchingEdges = (
  tile: PlacedTile, 
  placedTiles: PlacedTile[], 
  isColorBlind: boolean = false
): boolean => {
  let hasMatch = false
  DIRECTIONS.forEach((dir, i) => {
    const neighbor = placedTiles.find(t => 
      t.q === tile.q + dir.q && 
      t.r === tile.r + dir.r
    )

    if (neighbor) {
      const oppositeEdge = (i + 3) % 6
      if (isColorBlind) {
        // In colorblind mode, match by numbers only
        const tileValue = getEdgeValue(tile.edges[i].color, true)
        const neighborValue = getEdgeValue(neighbor.edges[oppositeEdge].color, true)
        if (tileValue === neighborValue) {
          hasMatch = true
        }
      } else {
        // Regular color matching
        if (tile.isJoker || neighbor.isJoker || 
            tile.edges[i].color === neighbor.edges[oppositeEdge].color) {
          hasMatch = true
        }
      }
    }
  })
  return hasMatch
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