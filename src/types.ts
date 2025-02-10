/* export interface Tile {
  edges: { 
    color: string
    pattern?: string 
  }[]
  q: number
  r: number
  value: number
  isJoker?: boolean
  powerUp?: PowerUp
}

export interface PlacedTile extends Tile {
  isPlaced: boolean
  matchPotential?: number[]
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

export interface GameState {
  placedTiles: PlacedTile[]
  nextTiles: PlacedTile[]
  score: number
  timeLeft: number
  moveHistory: {
    placedTiles: PlacedTile[]
    nextTiles: PlacedTile[]
    score: number
  }[] | null
  startTime: number
  timedMode: boolean
  boardRotation: number
  powerUps: PowerUpState
  combo: ComboState
  audioSettings: {
    musicEnabled: boolean
    soundEnabled: boolean
  }
}

export interface GameStatistics {
  gamesPlayed: number
  highScore: number
  totalScore: number
  totalMatches: number
  averageScore: number
  longestCombo: number
  totalPlayTime: number
  lastPlayed: string
} */