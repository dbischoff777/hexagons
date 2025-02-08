export const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']

export const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
export const getRandomValue = () => Math.floor(Math.random() * 9) + 1

export const createTileWithRandomEdges = (q: number, r: number) => ({
  q,
  r,
  edges: Array(6).fill(null).map(() => ({ color: getRandomColor() })),
  value: getRandomValue()
})

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