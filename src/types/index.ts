export interface Edge {
  color: string
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
  isPlaced: boolean  // Add flag to track if tile is properly placed
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