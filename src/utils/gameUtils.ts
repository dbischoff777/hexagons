import { Tile } from '../types/index'

export const INITIAL_TIME = 180 // 3 minutes in seconds

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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