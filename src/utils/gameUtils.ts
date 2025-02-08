import { Tile } from '../types'
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

export const canAcceptMoreConnections = (tile: Tile, allTiles: Tile[], cols: number): boolean => {
  for (let i = 0; i < 6; i++) {
    const newQ = tile.q + DIRECTIONS[i].q
    const newR = tile.r + DIRECTIONS[i].r
    
    const newS = -newQ - newR
    const isValidPosition = Math.max(Math.abs(newQ), Math.abs(newR), Math.abs(newS)) <= Math.floor(cols/2)
    const isEmpty = !allTiles.some(t => t.q === newQ && t.r === newR)
    
    if (isValidPosition && isEmpty) {
      return true
    }
  }
  return false
}

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
} 