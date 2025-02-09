import { PlacedTile } from '../types'
import { AccessibilitySettings, EdgeIndicator, MatchHint } from '../types/accessibility'

// Convert colors to numerical values for matching
const COLOR_VALUES = {
  '#FF1177': 3, // Pink
  '#FFE900': 6, // Yellow
  '#00FF9F': 3, // Green
  '#00FFFF': 4, // Cyan
  '#4D4DFF': 4, // Blue
  '#B14FFF': 6  // Purple
}

// Update the symbol mapping
const EDGE_SYMBOLS = {
  '#FF1177': '●', // Circle
  '#FFE900': '■', // Square
  '#00FF9F': '▲', // Triangle
  '#00FFFF': '◆', // Diamond
  '#4D4DFF': '★', // Star
  '#B14FFF': '✦'  // Sparkle
}

// Update helper to match the same values
export const getColorForValue = (value: number): string => {
  switch (value) {
    case 3: return '#FF1177' // Pink
    case 6: return '#FFE900' // Yellow
    case 3: return '#00FF9F' // Green
    case 4: return '#00FFFF' // Cyan
    case 4: return '#4D4DFF' // Blue
    case 6: return '#B14FFF' // Purple
    default: return '#FFFFFF'
  }
}

export const getEdgeValue = (color: string, isColorBlind: boolean): string | number => {
  if (!isColorBlind) {
    return COLOR_VALUES[color as keyof typeof COLOR_VALUES] || 0
  }
  
  return EDGE_SYMBOLS[color as keyof typeof EDGE_SYMBOLS] || '○'
}

export const createEdgeIndicators = (tile: PlacedTile, isColorBlind: boolean): EdgeIndicator[] => {
  return tile.edges.map((edge, index) => ({
    position: index,
    value: getEdgeValue(edge.color, isColorBlind),
    color: edge.color,
    pattern: edge.pattern,
    q: tile.q,
    r: tile.r
  }))
}

export const findPotentialMatches = (
  selectedTile: PlacedTile,
  placedTiles: PlacedTile[],
  isColorBlind: boolean
): MatchHint[] => {
  const hints: MatchHint[] = []
  const selectedEdges = createEdgeIndicators(selectedTile, isColorBlind)

  placedTiles.forEach(placedTile => {
    const placedEdges = createEdgeIndicators(placedTile, isColorBlind)
    
    selectedEdges.forEach(sourceEdge => {
      placedEdges.forEach((targetEdge) => {
        if (sourceEdge.value === targetEdge.value) {
          hints.push({
            sourceEdge,
            targetEdge,
            strength: calculateMatchStrength(sourceEdge, targetEdge)
          })
        }
      })
    })
  })

  return hints
}

const calculateMatchStrength = (edge1: EdgeIndicator, edge2: EdgeIndicator): number => {
  // Base strength for matching values
  let strength = 1

  // Add strength for adjacent positions
  if (Math.abs(edge1.position - edge2.position) === 1) {
    strength += 1
  }

  return Math.min(strength, 3)
}

export const drawAccessibilityOverlay = (
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile,
  x: number,
  y: number,
  size: number,
  settings: AccessibilitySettings
) => {
  if (settings.showEdgeNumbers || settings.isColorBlind) {
    drawEdgeNumbers(ctx, tile, x, y, size)
  }

  if (settings.showMatchHints) {
    drawMatchIndicators(ctx, tile, x, y, size)
  }
}

const drawEdgeNumbers = (
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile,
  x: number,
  y: number,
  size: number
) => {
  tile.edges.forEach((edge, index) => {
    const angle = (index * Math.PI) / 3
    const textX = x + (size * 0.8) * Math.cos(angle)
    const textY = y + (size * 0.8) * Math.sin(angle)

    ctx.save()
    ctx.translate(textX, textY)
    
    // More subtle background for normal mode
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.beginPath()
    ctx.arc(0, 0, 15, 0, Math.PI * 2)
    ctx.fill()

    // Light grey text for normal mode
    ctx.fillStyle = '#CCCCCC'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(getEdgeValue(edge.color, true).toString(), 0, 0)
    
    ctx.restore()
  })
}

const drawMatchIndicators = (
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile,
  x: number,
  y: number,
  size: number
) => {
  if (!tile.matchPotential) return

  tile.edges.forEach((_edge, index) => {
    const angle = (index * Math.PI) / 3
    const indicatorX = x + (size * 1.1) * Math.cos(angle)
    const indicatorY = y + (size * 1.1) * Math.sin(angle)
    const strength = tile.matchPotential![index]

    if (strength > 0) {
      // Draw glow
      ctx.beginPath()
      ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 255, 159, ${0.2 * strength})`
      ctx.shadowColor = '#00FF9F'
      ctx.shadowBlur = 10
      ctx.fill()

      // Draw indicator
      ctx.beginPath()
      ctx.arc(indicatorX, indicatorY, 5, 0, Math.PI * 2)
      ctx.fillStyle = strength === 3 ? '#00FF9F' : 
                     strength === 2 ? '#FFD700' : 
                     '#FF8B8B'
      ctx.fill()
      ctx.shadowBlur = 0
    }
  })
} 