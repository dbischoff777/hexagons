export interface Tile {
  edges: { color: string }[]
  q: number
  r: number
  value: number
  isJoker?: boolean
  powerUp?: PowerUp
}

export interface PlacedTile extends Tile {
  isPlaced: boolean
}

export interface ScorePopup {
  score: number
  x: number
  y: number
  id: number
  emoji: string
  text: string
}

export interface PowerUp {
  type: 'freeze' | 'colorShift' | 'multiplier'
  duration?: number  // For time-based power-ups (in seconds)
  multiplier?: number  // For score multipliers
  active: boolean
}

export interface PowerUpState {
  freeze: { active: boolean, remainingTime: number }
  colorShift: { active: boolean }
  multiplier: { active: boolean, value: number, remainingTime: number }
}

export interface ComboState {
  count: number
  timer: number
  multiplier: number
  lastPlacementTime: number
} 