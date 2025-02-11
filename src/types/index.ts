import { Companion } from "./companion"

export interface Edge {
  color: string
  pattern?: string
}

export interface Tile {
  q: number
  r: number
  edges: Edge[]
  value: number
}

export interface DragState {
  isDragging: boolean
  tile: Tile | null
  tileIndex: number
  x: number
  y: number
  offsetX: number
  offsetY: number
}

export interface PlacedTile extends Tile {
  isPlaced: boolean
  isJoker?: boolean  // Rainbow tile
  isMirror?: boolean // Mirror tile
  matchPotential?: number[]
  type: 'normal' | 'mirror' | 'rainbow'
  powerUp?: {
    type: 'freeze' | 'colorShift' | 'multiplier'
    duration?: number
    multiplier?: number
    active: boolean
  }
  temporaryColorMatch?: boolean
  hasBeenMatched?: boolean
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
  companion: Companion
}

export interface GameStatistics {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  totalPlayTime: number;
  longestCombo: number;
  lastPlayed: string;  // Make this required since we always provide a default
  fastestGameTime: number;
} 