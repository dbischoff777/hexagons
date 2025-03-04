import { Edge, PlacedTile } from '../types'
import { AccessibilitySettings } from '../types/accessibility'
import { getPowerUpColor } from './themeUtils'

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
  isSimonMode?: boolean
  simonTileIndex?: number
  isSimonActive?: boolean
  isSimonSequence?: boolean
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
    icon: '⇄',
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
  },
  simon: {
    colors: [
      '#FF0000', // Red - Center
      '#00FF00', // Green - Right
      '#0000FF', // Blue - Bottom Right
      '#FFFF00', // Yellow - Bottom Left
      '#FF00FF', // Magenta - Left
      '#00FFFF', // Cyan - Top Left
      '#FF8000'  // Orange - Top Right
    ]
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
  isCursorTile = false,
  isSimonMode = false,
  simonTileIndex,
  isSimonActive = false,
  isSimonSequence = false
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

  if (isSimonMode) {
    drawSimonTile(ctx, x, y, size, points, simonTileIndex || 0, isSimonActive, isSimonSequence, theme);
  } else {
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
      drawEdges(ctx, x, y, size, tile.edges, settings, isSelected, tile);
      if (tile?.value > 0 || tile?.isJoker || tile?.powerUp || tile?.type === 'mirror') {
        drawSpecialTile(ctx, x, y, size, tile, isSelected, showInfoBox && isSelected, theme);
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
  
  // Enhanced multi-layer glow effect inspired by CodePen example
  const innerGlow = ctx.createRadialGradient(x, y, size * 0.2, x, y, size * 1.5)
  innerGlow.addColorStop(0, 'rgba(0, 255, 255, 0.6)')
  innerGlow.addColorStop(0.3, 'rgba(255, 0, 255, 0.3)')
  innerGlow.addColorStop(0.6, 'rgba(0, 255, 255, 0.2)')
  innerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = innerGlow
  ctx.fill()
  
  // Pulsing outer stroke
  const pulseIntensity = PULSE_ANIMATION(Date.now())
  ctx.strokeStyle = `rgba(0, 255, 255, ${0.8 + pulseIntensity * 0.2})`
  ctx.lineWidth = 3
  ctx.stroke()
  
  // Inner stroke with different color
  ctx.strokeStyle = `rgba(255, 0, 255, ${0.6 + pulseIntensity * 0.4})`
  ctx.lineWidth = 1.5
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
  // Enhanced shadow and lighting effects
  ctx.shadowColor = 'rgba(0, 255, 255, 0.4)'
  ctx.shadowBlur = 15
  ctx.shadowOffsetY = 3

  if (tile?.isPlaced) {
    if (isMatched) {
      // Enhanced matched tile gradient with more vibrant colors
      const matchGradient = ctx.createRadialGradient(
        x, y - size/3, size/6,  // Inner circle
        x, y, size * 1.3        // Outer circle
      )
      matchGradient.addColorStop(0, `${theme.colors.accent}FF`)
      matchGradient.addColorStop(0.4, `${theme.colors.accent}CC`)
      matchGradient.addColorStop(0.7, `${theme.colors.secondary}99`)
      matchGradient.addColorStop(1, `${theme.colors.secondary}44`)
      ctx.fillStyle = matchGradient
    } else {
      // Enhanced normal tile gradient with better lighting
      const normalGradient = ctx.createRadialGradient(
        x, y - size/3, size/8,  // Inner circle
        x, y + size/6, size     // Outer circle
      )
      normalGradient.addColorStop(0, `${theme.colors.secondary}FF`)
      normalGradient.addColorStop(0.5, `${theme.colors.background}EE`)
      normalGradient.addColorStop(0.8, `${theme.colors.background}99`)
      normalGradient.addColorStop(1, `${theme.colors.background}44`)
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
  x: number, 
  y: number, 
  size: number, 
  edges: Edge[], 
  settings: any,
  isSelected: boolean,
  tile: PlacedTile
) {
  edges.forEach((edge, i) => {
    const angle = (i * Math.PI) / 3;
    const nextAngle = ((i + 1) * Math.PI) / 3;
    
    const startX = x + size * Math.cos(angle);
    const startY = y + size * Math.sin(angle);
    const endX = x + size * Math.cos(nextAngle);
    const endY = y + size * Math.sin(nextAngle);
    
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    
    if (settings.isColorBlind) {
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = isSelected ? 6 : 4;
    } else {
      const color = tile.isJoker ? '#FFFFFF' : edge.color;
      
      if (tile.isJoker) {
        gradient.addColorStop(0, `${color}FF`);
        gradient.addColorStop(0.5, `${color}AA`);
        gradient.addColorStop(1, `${color}FF`);
      } else {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
      }
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4;
    }
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

// Update the drawSpecialTile function to handle each type separately
function drawSpecialTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  tile: PlacedTile,
  isSelected: boolean,
  showInfoBox: boolean,
  theme: HexagonRenderProps['theme']
) {
  const shimmerIntensity = Math.sin(Date.now() / 500) * 0.2 + 0.8;
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.globalAlpha = shimmerIntensity;
  
  if (tile.isJoker) {
    drawJokerTile(ctx, x, y, size, tile.value, isSelected, showInfoBox, theme);
  } else if (tile.type === 'mirror') {
    drawMirrorTile(ctx, x, y, size, tile.value, isSelected, showInfoBox, theme);
  } else if (tile.powerUp) {
    drawPowerUpTile(ctx, x, y, size, tile.powerUp.type, tile.value, isSelected, showInfoBox, theme);
  } else {
    drawTileValue(ctx, x, y, tile.value, isSelected);
  }
  
  ctx.restore();
}

function drawJokerTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: number,
  isSelected: boolean,
  showInfoBox: boolean,
  theme: HexagonRenderProps['theme']
) {
  const style = TILE_STYLES.joker;
  const time = Date.now();
  
  // Rainbow glow effect using theme colors
  const themeColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.accent
  ];
  const colorIndex = Math.floor((time / 500) % themeColors.length);
  ctx.shadowColor = themeColors[colorIndex];
  ctx.shadowBlur = 15 + Math.sin(time / 200) * 5;
  
  // Particle effect with theme colors
  for (let i = 0; i < 6; i++) {
    const angle = (time / 1000 + i * Math.PI / 3);
    const particleX = x + Math.cos(angle) * (size / 4);
    const particleY = y - 12 + Math.sin(angle) * (size / 4);
    const particleColor = themeColors[(colorIndex + i) % themeColors.length];
    ctx.fillStyle = `${particleColor}${Math.floor(Math.sin(time / 200 + i) * 20 + 40).toString(16)}`;
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw star with theme-based glow
  ctx.fillStyle = theme.colors.primary;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  drawNumberBelow(ctx, x, y, value, isSelected);

  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, theme.colors.accent);
  }
}

function drawMirrorTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  value: number,
  isSelected: boolean,
  showInfoBox: boolean,
  theme: HexagonRenderProps['theme']
) {
  const style = TILE_STYLES.mirror;
  const time = Date.now();
  
  // Energy field effect using theme colors
  const gradient = ctx.createRadialGradient(x, y - 12, 0, x, y - 12, size / 2);
  gradient.addColorStop(0, `${theme.colors.accent}33`);
  gradient.addColorStop(0.5, `${theme.colors.secondary}22`);
  gradient.addColorStop(1, `${theme.colors.primary}00`);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y - 12, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Rotating glow effect with theme colors
  const rotationAngle = time / 1000;
  ctx.save();
  ctx.translate(x, y - 12);
  ctx.rotate(rotationAngle);
  
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * size/3, Math.sin(angle) * size/3);
    ctx.strokeStyle = `${theme.colors.accent}${Math.floor(Math.sin(time / 200 + i) * 20 + 40).toString(16)}`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  // Draw the mirror icon with theme-based glow
  ctx.shadowColor = theme.colors.accent;
  ctx.shadowBlur = 15 + Math.sin(time / 200) * 5;
  ctx.fillStyle = theme.colors.primary;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  drawNumberBelow(ctx, x, y, value, isSelected);

  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, theme.colors.accent);
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
  showInfoBox: boolean,
  theme: HexagonRenderProps['theme']
) {
  const style = TILE_STYLES.powerUp[type];
  const time = Date.now();
  
  // Get power-up color based on type and theme
  const powerUpColor = getPowerUpColor(type);
  
  // Pulsing energy field with theme-aware colors
  const pulseSize = size/2 + Math.sin(time / 300) * size/8;
  const gradient = ctx.createRadialGradient(x, y - 12, 0, x, y - 12, pulseSize);
  gradient.addColorStop(0, `${powerUpColor}44`);
  gradient.addColorStop(0.5, `${theme.colors.secondary}22`);
  gradient.addColorStop(1, `${theme.colors.background}00`);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y - 12, pulseSize, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting particles with theme colors
  for (let i = 0; i < 8; i++) {
    const angle = time / 1000 + (i * Math.PI / 4);
    const orbitX = x + Math.cos(angle) * (size/3);
    const orbitY = (y - 12) + Math.sin(angle) * (size/3);
    ctx.fillStyle = `${powerUpColor}${Math.floor(Math.sin(time / 200 + i) * 20 + 40).toString(16)}`;
    ctx.beginPath();
    ctx.arc(orbitX, orbitY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw the power-up icon with theme-aware glow
  ctx.shadowColor = powerUpColor;
  ctx.shadowBlur = 15 + Math.sin(time / 200) * 5;
  ctx.fillStyle = theme.colors.primary;
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(style.icon, x, y - 12);

  drawNumberBelow(ctx, x, y, value, isSelected);

  if (showInfoBox) {
    drawInfoBox(ctx, x, y, size, style.text, powerUpColor);
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
      // Enhanced placement animation with scale and glow
      const progress = (Date.now() % 500) / 500
      const scale = 1 + Math.sin(progress * Math.PI) * 0.15
      const glow = Math.sin(progress * Math.PI) * 15
      
      ctx.shadowColor = theme.colors.accent
      ctx.shadowBlur = 10 + glow
      
      ctx.translate(x, y)
      ctx.scale(scale, scale)
      ctx.translate(-x, -y)
    } else if (animation.type === 'match') {
      // Enhanced match animation with pulsing glow
      const glowIntensity = GLOW_ANIMATION(Date.now())
      ctx.shadowColor = theme.colors.accent
      ctx.shadowBlur = glowIntensity
      
      // Add subtle rotation
      const rotateAmount = Math.sin(Date.now() / 400) * 0.05
      ctx.translate(x, y)
      ctx.rotate(rotateAmount)
      ctx.translate(-x, -y)
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

// Add Simon-specific rendering functions
function drawSimonTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  points: [number, number][],
  tileIndex: number,
  isActive: boolean,
  isSequence: boolean,
  theme: HexagonRenderProps['theme']
) {
  const color = TILE_STYLES.simon.colors[tileIndex];
  
  // Draw base hexagon
  ctx.beginPath();
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point[0], point[1]);
    else ctx.lineTo(point[0], point[1]);
  });
  ctx.closePath();

  // Create gradient for base fill
  const gradient = ctx.createRadialGradient(
    x, y - size/3, size/6,
    x, y, size * 1.3
  );
  gradient.addColorStop(0, `${color}FF`);
  gradient.addColorStop(0.4, `${color}CC`);
  gradient.addColorStop(0.7, `${color}99`);
  gradient.addColorStop(1, `${color}44`);
  
  ctx.fillStyle = gradient;
  ctx.fill();

  // Add glow effect when active
  if (isActive) {
    ctx.save();
    
    // Pulsing glow
    const time = Date.now();
    const pulseIntensity = Math.sin(time / 200) * 0.2 + 0.8;
    
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 + Math.sin(time / 200) * 10;
    ctx.lineWidth = 4;
    ctx.strokeStyle = `${color}FF`;
    ctx.stroke();
    
    // Inner glow
    const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, size);
    innerGlow.addColorStop(0, `${color}${Math.floor(pulseIntensity * 255).toString(16).padStart(2, '0')}`);
    innerGlow.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = innerGlow;
    ctx.fill();
    
    ctx.restore();
  }

}