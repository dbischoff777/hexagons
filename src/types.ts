export interface Tile {
  edges: { color: string }[]
  q: number
  r: number
  value: number
  isJoker?: boolean
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