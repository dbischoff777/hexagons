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