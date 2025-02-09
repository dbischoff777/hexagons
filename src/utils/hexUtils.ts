import { Tile, PowerUp } from "../types"

export const COLORS = [
  '#FF1177',  // Neon pink
  //'#00FF9F',  // Neon green
  '#00FFFF',  // Neon cyan
  '#FFE900',  // Neon yellow
  //'#FF00FF',  // Neon magenta
  '#4D4DFF'   // Neon blue
]

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

export const getAdjacentTiles = (tile: Tile, allTiles: Tile[]): Tile[] => {
  return allTiles.filter(t => 
    (Math.abs(t.q - tile.q) <= 1 && Math.abs(t.r - tile.r) <= 1) && // Adjacent coordinates
    !(t.q === tile.q && t.r === tile.r) // Not the same tile
  )
}

export const createTileWithRandomEdges = (q: number, r: number): Tile => {
  // Small chance to create a power-up tile (15%)
  const powerUpChance = Math.random()
  let powerUp: PowerUp | undefined

  if (powerUpChance < 0.15) {
    const powerUpTypes: PowerUp['type'][] = ['freeze', 'colorShift', 'multiplier']
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
    
    powerUp = {
      type: randomType,
      duration: randomType === 'freeze' ? 5 : 
               randomType === 'multiplier' ? 15 : undefined,
      multiplier: randomType === 'multiplier' ? 2 : undefined,
      active: false
    }
  }

  // Small chance to create a joker tile (10%)
  const isJoker = !powerUp && Math.random() < 0.1

  return isJoker ? {
    edges: Array(6).fill({ color: 'rainbow' }),
    q, r, value: 0, isJoker: true
  } : {
    edges: Array(6).fill(0).map(() => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })),
    q, r, value: 0, powerUp
  }
}

export const hexToPixel = (q: number, r: number, centerX: number, centerY: number, size: number) => {
  const x = centerX + size * (3/2 * q)
  const y = centerY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
  return { x, y }
}

export const DIRECTIONS = [
  { q: 1, r: 0 },   // right
  { q: 0, r: 1 },   // bottom right
  { q: -1, r: 1 },  // bottom left
  { q: -1, r: 0 },  // left
  { q: 0, r: -1 },  // top left
  { q: 1, r: -1 }   // top right
] 