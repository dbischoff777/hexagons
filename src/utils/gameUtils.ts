import { Tile, PlacedTile } from '../types'
import { DIRECTIONS } from './hexUtils'

export const INITIAL_TIME = 180 // 3 minutes in seconds

export const hasMatchingEdges = (tile: Tile, placedTiles: Tile[]): boolean => {
  let hasMatch = false
  DIRECTIONS.forEach((dir, i) => {
    const neighbor = placedTiles.find(t => 
      t.q === tile.q + dir.q && 
      t.r === tile.r + dir.r
    )

    if (neighbor) {
      const oppositeEdge = (i + 3) % 6
      if (tile.edges[i].color === neighbor.edges[oppositeEdge].color) {
        hasMatch = true
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
      if (neighborTile && tile.edges[i].color === neighborTile.edges[(i + 3) % 6].color) {
        matches++
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