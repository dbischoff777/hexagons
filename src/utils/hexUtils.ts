import { Tile } from "../types"

export const COLORS = [
  '#FF1177',  // Neon pink
  //'#00FF9F',  // Neon green
  '#00FFFF',  // Neon cyan
  '#FFE900',  // Neon yellow
  //'#FF00FF',  // Neon magenta
  '#4D4DFF'   // Neon blue
]

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]

export const createTileWithRandomEdges = (q: number, r: number): Tile => {
  // Small chance to create a joker tile (10%)
  const isJoker = Math.random() < 0.1

  if (isJoker) {
    return {
      edges: Array(6).fill({ color: 'rainbow' }), // Special color for joker
      q,
      r,
      value: 0,
      isJoker: true
    }
  }

  return {
    edges: Array(6).fill(0).map(() => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    })),
    q,
    r,
    value: 0
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