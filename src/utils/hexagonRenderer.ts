import { PlacedTile } from '../types'
import { AccessibilitySettings } from '../types/accessibility'
import { drawAccessibilityOverlay } from './accessibilityUtils'

interface HexagonRenderProps {
  ctx: CanvasRenderingContext2D
  x: number
  y: number
  size: number
  tile?: PlacedTile
  isMatched?: boolean
  isSelected?: boolean
  settings: AccessibilitySettings
  theme: {
    colors: {
      accent: string
      secondary: string
      background: string
      primary: string
    }
  }
  selectedTileIndex: number | null
  animatingTiles: { q: number, r: number, type: 'place' | 'match' | 'hint' }[]
  showInfoBox?: boolean
  isCursorTile?: boolean
}

// Add these type-specific constants at the top
const TILE_STYLES = {
  joker: {
    glow: '#FFFFFF',
    icon: '★',
    text: 'Matches Any Tile'
  },
  mirror: {
    glow: '#00FFFF',
    icon: '↔',
    text: 'Mirrors Adjacent Tiles'
  },
  powerUp: {
    freeze: {
      glow: '#00FFFF',
      icon: '❄️',
      text: 'Freezes Timer (5s)'
    },
    colorShift: {
      glow: '#FF00FF',
      icon: '🎨',
      text: 'Changes Adjacent Colors'
    },
    multiplier: {
      glow: '#FFD700',
      icon: '✨',
      text: 'Double Points (15s)'
    }
  }
} as const;

// Add these animation keyframes at the top of the file
const PULSE_ANIMATION = (time: number) => Math.sin(time / 200) * 0.2 + 0.4
const GLOW_ANIMATION = (time: number) => Math.sin(time / 800) * 10 + 15

// Add caching for common calculations
const pointsCache = new Map<string, [number, number][]>();
const getPoints = (x: number, y: number, size: number): [number, number][] => {
  const key = `${x},${y},${size}`;
  if (!pointsCache.has(key)) {
    const points: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      points.push([
        x + size * Math.cos(angle),
        y + size * Math.sin(angle)
      ]);
    }
    pointsCache.set(key, points);
  }
  return pointsCache.get(key)!;
};

export const drawHexagonWithColoredEdges = ({
  ctx,
  x,
  y,
  size,
  tile,
  isMatched = false,
  isSelected = false,
  settings,
  theme,
  selectedTileIndex,
  animatingTiles,
  showInfoBox = false,
  isCursorTile = false
}: HexagonRenderProps) => {
  // Check if parent element has grid-full class
  const canvas = ctx.canvas;
  const isGridFullAnimation = canvas.parentElement?.classList.contains('grid-full');

  ctx.save();
  const points = getPoints(x, y, size);

  // Modify drawing based on animation state
  if (isGridFullAnimation) {
    ctx.globalAlpha = 0.8; // Make tiles slightly transparent during animation
    ctx.filter = 'brightness(1.2)'; // Increase brightness during animation
  }

  // Draw valid placement highlight
  if (selectedTileIndex !== null && !isGridFullAnimation) {
    drawPlacementHighlight(ctx, points);
  }

  // Draw selection highlight
  if (isSelected && !isGridFullAnimation) {
    drawSelectionHighlight(ctx, points, x, y, size);
  }

  // Apply base styles and draw
  if (tile?.edges) {
    applyBaseStyles(ctx, tile, isMatched, theme, x, y, size);
    drawHexagonShape(ctx, points);
    drawEdges(ctx, tile, points, isSelected, settings, isMatched);
    if (tile?.value > 0 || tile?.isJoker || tile?.powerUp || tile?.type === 'mirror') {
      drawSpecialTile(ctx, x, y, size, tile, isSelected, showInfoBox && isSelected);
    }
  }

  // Handle animations
  if (tile && !isGridFullAnimation) {
    handleAnimations(ctx, tile, animatingTiles, x, y, theme);
  }

  // Add match glow
  if (isMatched) {
    drawMatchGlow(ctx, points, theme);
  }

  ctx.restore();
};

// Helper functions (private)
function drawPlacementHighlight(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.beginPath()
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point[0], point[1])
    else ctx.lineTo(point[0], point[1])
  })
  ctx.closePath()
  
  const pulseIntensity = PULSE_ANIMATION(Date.now())
  ctx.fillStyle = `rgba(0, 255, 159, ${pulseIntensity * 0.5})`
  ctx.fill()
  
  ctx.strokeStyle = '#00FF9F'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawSelectionHighlight(
  ctx: CanvasRenderingContext2D, 
  points: [number, number][], 
  x: number, 
  y: number, 
  size: number
) {
  ctx.beginPath()
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point[0], point[1])
    else ctx.lineTo(point[0], point[1])
  })
  ctx.closePath()
  
  const glowGradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 1.5)
  glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)')
  glowGradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.2)')
  glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)')
  ctx.fillStyle = glowGradient
  ctx.fill()
  
  ctx.strokeStyle = '#00FFFF'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#FF00FF'
  ctx.stroke()
}

function applyBaseStyles(
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile | undefined,
  isMatched: boolean,
  theme: HexagonRenderProps['theme'],
  x: number,
  y: number,
  size: number
) {
  ctx.shadowColor = 'rgba(0, 255, 255, 0.3)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 2

  if (tile?.isPlaced) {
    if (isMatched) {
      const matchGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      matchGradient.addColorStop(0, theme.colors.accent)
      matchGradient.addColorStop(1, theme.colors.secondary)
      ctx.fillStyle = matchGradient
    } else {
      const normalGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      normalGradient.addColorStop(0, theme.colors.secondary)
      normalGradient.addColorStop(1, theme.colors.background)
      ctx.fillStyle = normalGradient
    }
  }
}

function drawHexagonShape(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  ctx.beginPath()
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point[0], point[1])
    else ctx.lineTo(point[0], point[1])
  })
  ctx.closePath()
  ctx.fill()
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile,
  points: [number, number][],
  isSelected: boolean,
  settings: AccessibilitySettings,
  isMatched: boolean
) {
  for (let i = 0; i < 6; i++) {
    const start = points[i]
    const end = points[(i + 1) % 6]
    
    if (settings.isColorBlind) {
      ctx.strokeStyle = isMatched ? '#FFFFFF' : '#888888'
      ctx.lineWidth = isSelected ? 6 : 4
    } else {
      const color = tile.edges[i].color
      
      if (tile.isJoker) {
        ctx.strokeStyle = '#FFFFFF'
        ctx.shadowColor = '#FFFFFF'
        ctx.shadowBlur = 10
      } else {
        const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1])
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, color)
        ctx.strokeStyle = gradient
      }
      ctx.lineWidth = isSelected ? 7 : 5
    }
    
    ctx.beginPath()
    ctx.moveTo(start[0], start[1])
    ctx.lineTo(end[0], end[1])
    ctx.stroke()
  }
}

// Update the drawSpecialTile function to handle each type separately
function drawSpecialTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tile: PlacedTile,
  isSelected: boolean,
  showInfoBox: boolean
) {
  if (tile.isJoker) {
    drawJokerTile(ctx, x, y, size, tile.value, isSelected, showInfoBox);
  } else if (tile.type === 'mirror') {
    drawMirrorTile(ctx, x, y, size, tile.value, isSelected, showInfoBox);
  } else if (tile.powerUp) {
    drawPowerUpTile(ctx, x, y, size, tile.powerUp.type, tile.value, isSelected, showInfoBox);
  } else {
    drawTileValue(ctx, x, y, tile.value, isSelected);
  }
}

function drawJokerTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: number,
  isSelected: boolean,
  showInfoBox: boolean
) {
  const style = TILE_STYLES.joker;
  
  // Draw star icon
  ctx.fillStyle = style.glow;
  ctx.shadowColor = style.glow;
  ctx.shadowBlur = 15;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  // Draw value
  drawNumberBelow(ctx, x, y, value, isSelected);

  // Draw info box if selected
  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, style.glow);
  }
}

function drawMirrorTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: number,
  isSelected: boolean,
  showInfoBox: boolean
) {
  const style = TILE_STYLES.mirror;
  
  // Draw mirror icon
  ctx.fillStyle = '#FFFFFF'; // Simple white color
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  // Draw value
  drawNumberBelow(ctx, x, y, value, isSelected);

  // Draw info box if selected
  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, style.glow);
  }
}

function drawPowerUpTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  type: keyof typeof TILE_STYLES.powerUp,
  value: number,
  isSelected: boolean,
  showInfoBox: boolean
) {
  const style = TILE_STYLES.powerUp[type];
  
  // Draw power-up icon
  ctx.fillStyle = style.glow;
  ctx.shadowColor = style.glow;
  ctx.shadowBlur = 15;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  // Draw value
  drawNumberBelow(ctx, x, y, value, isSelected);

  // Draw info box if selected
  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, style.glow);
  }
}

// Helper function for drawing the number below icons
function drawNumberBelow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  isSelected: boolean
) {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 2;
  ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d';
  ctx.font = `bold ${isSelected ? 24 : 22}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value.toString(), x, y + 12);
}

function handleAnimations(
  ctx: CanvasRenderingContext2D,
  tile: PlacedTile | undefined,
  animatingTiles: HexagonRenderProps['animatingTiles'],
  x: number,
  y: number,
  theme: HexagonRenderProps['theme']
) {
  const animation = animatingTiles.find(
    animTile => tile && animTile.q === tile.q && animTile.r === tile.r
  )
  
  if (animation) {
    ctx.save()
    
    if (animation.type === 'place') {
      const progress = (Date.now() % 500) / 500
      const scale = 1 + Math.sin(progress * Math.PI) * 0.1
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.translate(-x, -y)
    } else if (animation.type === 'match') {
      const glowIntensity = GLOW_ANIMATION(Date.now())
      ctx.shadowColor = theme.colors.accent
      ctx.shadowBlur = glowIntensity
    }
    
    ctx.restore()
  }
}

function drawMatchGlow(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  theme: HexagonRenderProps['theme']
) {
  ctx.shadowColor = theme.colors.accent
  ctx.shadowBlur = 20
  ctx.beginPath()
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point[0], point[1])
    else ctx.lineTo(point[0], point[1])
  })
  ctx.closePath()
  ctx.stroke()
}

// Utility functions for drawing common elements
function drawInfoBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  text: string,
  glowColor: string
) {
  const padding = 10
  const boxWidth = ctx.measureText(text).width + padding * 2
  const boxHeight = 30
  const boxX = x - boxWidth / 2
  const boxY = y - size * 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.strokeStyle = glowColor
  ctx.lineWidth = 2
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 10
  
  ctx.beginPath()
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#FFFFFF'
  ctx.shadowBlur = 2
  ctx.font = '14px Arial'
  ctx.fillText(text, x, boxY + boxHeight/2)

  // Draw arrow pointer
  ctx.beginPath()
  ctx.moveTo(x - 8, boxY + boxHeight)
  ctx.lineTo(x + 8, boxY + boxHeight)
  ctx.lineTo(x, boxY + boxHeight + 8)
  ctx.closePath()
  ctx.fillStyle = glowColor
  ctx.fill()
}

function drawTileValue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  isSelected: boolean
) {
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 4
  ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  ctx.strokeText(value.toString(), x, y)
  
  ctx.fillStyle = '#FFFFFF'
  ctx.shadowColor = '#00FFFF'
  ctx.shadowBlur = 8
  ctx.fillText(value.toString(), x, y)
  
  ctx.shadowBlur = 0
}