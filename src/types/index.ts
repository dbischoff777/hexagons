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

export type PowerUpType = 'freeze' | 'colorShift' | 'multiplier';

export interface PowerUp {
  type: PowerUpType;
  duration?: number;
  multiplier?: number;
  active: boolean;
}

export interface MirrorEffect {
  glowColor: string;
  pulseRate: number;
  reflectionAngle: number;
}

export interface PlacedTile extends Tile {
  isPlaced: boolean
  isJoker?: boolean  // Rainbow tile
  isMirror?: boolean // Mirror tile
  matchPotential?: number[]
  type: 'normal' | 'mirror' | 'rainbow'
  powerUp?: PowerUp
  temporaryColorMatch?: boolean
  hasBeenMatched?: boolean
  mirrorEffect?: MirrorEffect;  // Add this for mirror tiles
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
    rotationEnabled?: boolean
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

export interface KeyBindings {
  rotateClockwise: string;
  rotateCounterClockwise: string;
  selectTile1: string;
  selectTile2: string;
  selectTile3: string;
  placeTile: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
}

export interface GameSettings {
  keyBindings: KeyBindings;
  // ... other existing settings
} 