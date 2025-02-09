import { useEffect, useRef, useState } from 'react'
import { PlacedTile, PowerUpState, ComboState, GameState } from '../types'
import { createTileWithRandomEdges, hexToPixel, getAdjacentTiles, COLORS } from '../utils/hexUtils'
import { INITIAL_TIME, hasMatchingEdges, formatTime, updateTileValues, isGridFull } from '../utils/gameUtils'
import SoundManager from '../utils/soundManager'
import './Game.css'
import { useAccessibility } from '../contexts/AccessibilityContext'
import { drawAccessibilityOverlay, findPotentialMatches } from '../utils/accessibilityUtils'
import { TutorialState } from '../types/tutorial'
import { TUTORIAL_STEPS } from '../constants/tutorialSteps'
import { TutorialMessage } from './TutorialMessage'
import { saveGameState, loadGameState, updateStatistics, clearSavedGame, getStatistics } from '../utils/gameStateUtils'

interface GameProps {
  musicEnabled: boolean
  soundEnabled: boolean
  timedMode: boolean
  onGameOver: () => void
  tutorial?: boolean
  onSkipTutorial?: () => void
  onExit: () => void
  savedGameState?: GameState | null
}

interface PopupPosition {
  y: number
  expiresAt: number
  type: 'score' | 'combo' | 'quick' | 'clear'
}

const rotateTileEdges = (edges: { color: string }[]) => {
  return [...edges.slice(-1), ...edges.slice(0, -1)]
}

// Add this near the top of the file, outside the component
const SCORE_FEEDBACK = {
  // Regular matches
  LOW: [
    { emoji: '✨💫', text: 'Nice!' },
    { emoji: '🎯✨', text: 'Good!' },
    { emoji: '👍💫', text: 'Cool!' },
  ],
  MEDIUM: [
    { emoji: '🌟💫', text: 'Great!' },
    { emoji: '💫⭐', text: 'Awesome!' },
    { emoji: '⭐✨', text: 'Sweet!' },
  ],
  HIGH: [
    { emoji: '🔥⚡', text: 'Amazing!' },
    { emoji: '⚡💥', text: 'Fantastic!' },
    { emoji: '💥🔥', text: 'Incredible!' },
  ],
  EPIC: [
    { emoji: '🌈✨', text: 'EPIC!' },
    { emoji: '👑💫', text: 'LEGENDARY!' },
    { emoji: '💎✨', text: 'BRILLIANT!' },
  ],
  
  // Combos
  COMBO: [
    { emoji: '🎯💫', text: '2x COMBO!' },
    { emoji: '🔥💫', text: '3x COMBO!' },
    { emoji: '⚡💫', text: '4x COMBO!' },
    { emoji: '💫✨', text: '5x COMBO!' },
    { emoji: '🌟💫', text: '6x COMBO!' },
    { emoji: '💥⚡', text: '7x COMBO!' },
    { emoji: '👑✨', text: '8x COMBO!' },
    { emoji: '🌈💫', text: 'MEGA COMBO!' },
  ],
  
  // Grid clears
  CLEAR: [
    { emoji: '🎪✨', text: 'CLEAR!' },
    { emoji: '🎮💫', text: 'GOOD CLEAR!' },
    { emoji: '🎯⚡', text: 'GREAT CLEAR!' },
    { emoji: '🏆💫', text: 'AMAZING CLEAR!' },
    { emoji: '👑✨', text: 'EPIC CLEAR!' },
  ],
  
  // Quick placements
  QUICK: [
    { emoji: '⚡💨', text: 'QUICK!' },
    { emoji: '💨✨', text: 'SWIFT!' },
    { emoji: '🚀💫', text: 'SPEEDY!' },
  ]
}

const getRandomFeedback = (category: keyof typeof SCORE_FEEDBACK) => {
  const options = SCORE_FEEDBACK[category]
  return options[Math.floor(Math.random() * options.length)]
}

const getFeedbackForScore = (score: number) => {
  if (score >= 100) return getRandomFeedback('EPIC')
  if (score >= 75) return getRandomFeedback('HIGH')
  if (score >= 50) return getRandomFeedback('MEDIUM')
  return getRandomFeedback('LOW')
}

const getFeedbackForCombo = (comboCount: number) => {
  const index = Math.min(comboCount - 2, SCORE_FEEDBACK.COMBO.length - 1)
  return SCORE_FEEDBACK.COMBO[index]
}

const getFeedbackForClear = (clearScore: number) => {
  if (clearScore >= 100) return SCORE_FEEDBACK.CLEAR[4]
  if (clearScore >= 75) return SCORE_FEEDBACK.CLEAR[3]
  if (clearScore >= 50) return SCORE_FEEDBACK.CLEAR[2]
  if (clearScore >= 25) return SCORE_FEEDBACK.CLEAR[1]
  return SCORE_FEEDBACK.CLEAR[0]
}

const Game = ({ musicEnabled, soundEnabled, timedMode, onGameOver, tutorial = false, onSkipTutorial, onExit, savedGameState }: GameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cols = 7
  
  // Initialize all state from saved game if it exists
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>(
    savedGameState?.placedTiles ?? [{
      ...createTileWithRandomEdges(0, 0),
      isPlaced: true
    }]
  )
  const [score, setScore] = useState<number>(savedGameState?.score ?? 0)
  const [timeLeft, setTimeLeft] = useState<number>(
    savedGameState?.timeLeft ?? (timedMode ? INITIAL_TIME : Infinity)
  )
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [nextTiles, setNextTiles] = useState<PlacedTile[]>(
    savedGameState?.nextTiles ?? [
      { ...createTileWithRandomEdges(0, 0), isPlaced: false },
      { ...createTileWithRandomEdges(0, 0), isPlaced: false },
      { ...createTileWithRandomEdges(0, 0), isPlaced: false }
    ]
  )
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)
  const [scorePopups, setScorePopups] = useState<{ score: number, x: number, y: number, id: number, emoji: string, text: string }[]>([])
  const [boardRotation, setBoardRotation] = useState<number>(savedGameState?.boardRotation ?? 0)
  const [showWarning, setShowWarning] = useState(false)
  const [showRotationText, setShowRotationText] = useState(false)
  const soundManager = SoundManager.getInstance()
  const [powerUps, setPowerUps] = useState<PowerUpState>(
    savedGameState?.powerUps ?? {
      freeze: { active: false, remainingTime: 0 },
      colorShift: { active: false },
      multiplier: { active: false, value: 1, remainingTime: 0 }
    }
  )
  const [combo, setCombo] = useState<ComboState>(
    savedGameState?.combo ?? {
      count: 0,
      timer: 0,
      multiplier: 1,
      lastPlacementTime: 0
    }
  )
  const [isQuickPlacement, setIsQuickPlacement] = useState(false)
  const [activePopupPositions, setActivePopupPositions] = useState<PopupPosition[]>([])
  const { settings } = useAccessibility()
  const [tutorialState, setTutorialState] = useState<TutorialState>({
    active: tutorial,
    currentStep: 0,
    rotationCount: 0,
    hasPlaced: false
  })
  const [previousState, setPreviousState] = useState<{
    placedTiles: PlacedTile[]
    nextTiles: PlacedTile[]
    score: number
  } | null>(null)

  // Modify the findAvailableYPosition function
  const findAvailableYPosition = (baseY: number, type: 'score' | 'combo' | 'quick' | 'clear'): number => {
    const POPUP_HEIGHTS = {
      score: 100,  // Regular score popups
      combo: 90,   // Combo popups
      quick: 80,   // Quick placement popups
      clear: 120   // Clear bonus popups
    }
    
    const now = Date.now()
    
    // Clean expired positions
    const currentPositions = activePopupPositions.filter(pos => pos.expiresAt > now)
    
    // Define game area boundaries
    const minY = 100  // Minimum distance from top of game area
    const maxY = canvasRef.current?.height ?? 800 - 100  // Maximum distance from bottom
    
    // Find first available Y position that doesn't overlap
    let testY = Math.min(Math.max(baseY, minY), maxY)  // Clamp initial position
    let attempts = 0
    const MAX_ATTEMPTS = 10  // Prevent infinite loops
    
    while (currentPositions.some(pos => {
      const minSpacing = Math.max(POPUP_HEIGHTS[type], POPUP_HEIGHTS[pos.type])
      return Math.abs(pos.y - testY) < minSpacing
    })) {
      testY -= 40  // Move up by smaller increments
      
      // If we hit the top, start from bottom and work up
      if (testY < minY) {
        testY = maxY
      }
      
      attempts++
      if (attempts > MAX_ATTEMPTS) {
        // If we can't find a spot, use the original position
        testY = baseY
        break
      }
    }
    
    // Update active positions
    setActivePopupPositions([
      ...currentPositions,
      { y: testY, expiresAt: now + 1000, type }
    ])
    
    return testY
  }

  // Update rotation timer effect
  useEffect(() => {
    if (!isGameOver) {
      const warningTimer = setInterval(() => {
        setShowWarning(true)
        setShowRotationText(true)
        setTimeout(() => {
          setShowWarning(false)
          setShowRotationText(false)
          
          // Start a smooth rotation animation
          let startTime: number | null = null
          const duration = 2000 // 2 seconds duration
          const startRotation = boardRotation
          const targetRotation = startRotation + 180
          
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // Smooth easing function
            const easeProgress = progress < 0.5
              ? 2 * progress * progress // Ease in
              : -1 + (4 - 2 * progress) * progress // Ease out
            
            const currentRotation = startRotation + (targetRotation - startRotation) * easeProgress
            
            setBoardRotation(currentRotation % 360)
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }, 1500)
      }, 15000)
      
      return () => clearInterval(warningTimer)
    }
  }, [isGameOver, boardRotation])

  // Main game effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1000
    canvas.height = 800

    const drawHexagonWithColoredEdges = (
      x: number, 
      y: number, 
      size: number, 
      tile?: PlacedTile, 
      isMatched: boolean = false, 
      isSelected: boolean = false
    ) => {
      const points: [number, number][] = []
      
      // Calculate all points first
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const xPos = x + size * Math.cos(angle)
        const yPos = y + size * Math.sin(angle)
        points.push([xPos, yPos])
      }

      // Draw valid placement highlight
      if (selectedTileIndex !== null) {
        ctx.beginPath()
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1])
          else ctx.lineTo(point[0], point[1])
        })
        ctx.closePath()
        
        // Create pulsing glow effect
        const pulseIntensity = Math.sin(Date.now() / 200) * 0.2 + 0.4 // Values between 0.2 and 0.6
        ctx.fillStyle = `rgba(0, 255, 159, ${pulseIntensity * 0.2})`
        ctx.fill()
        
        // Add neon outline
        ctx.strokeStyle = '#00FF9F'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])  // Dashed line
        ctx.stroke()
        ctx.setLineDash([])  // Reset dash
      }

      // Draw selection highlight first (if selected)
      if (isSelected) {
        // Outer glow effect
        ctx.beginPath()
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1])
          else ctx.lineTo(point[0], point[1])
        })
        ctx.closePath()
        
        // Create gradient for glow effect
        const gradient = ctx.createRadialGradient(x, y, size * 0.5, x, y, size * 1.2)
        gradient.addColorStop(0, 'rgba(0, 255, 159, 0.3)')  // Neon green core
        gradient.addColorStop(1, 'rgba(0, 255, 159, 0)')    // Fade out
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Pulsing border with double stroke for intensity
        ctx.strokeStyle = '#00FF9F'
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(0, 255, 159, 0.5)'
        ctx.stroke()
        
        // Selection indicator with glow
        ctx.fillStyle = '#00FF9F'
        ctx.shadowColor = '#00FF9F'
        ctx.shadowBlur = 15
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('▼', x, y - size - 10)
        ctx.shadowBlur = 0
      }

      // Add shadow for depth
      ctx.shadowColor = 'rgba(0, 255, 159, 0.3)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetY = 2

      // Enhanced background colors
      if (tile?.isPlaced) {
        if (isMatched) {
          // Create gradient based on tile value (1-12 range)
          const maxValue = 12
          const valueRatio = Math.min(tile.value / maxValue, 1)
          
          // Create color based on value ranges
          let glowColor
          let fillColor
          if (valueRatio <= 0.25) {         // 1-3: Green
            glowColor = '#00FF9F'
            fillColor = 'rgba(0, 255, 159, 0.2)'
          } else if (valueRatio <= 0.5) {   // 4-6: Blue
            glowColor = '#00FFFF'
            fillColor = 'rgba(0, 255, 255, 0.2)'
          } else if (valueRatio <= 0.75) {  // 7-9: Purple
            glowColor = '#B14FFF'
            fillColor = 'rgba(177, 79, 255, 0.2)'
          } else {                          // 10-12: Pink
            glowColor = '#FF1177'
            fillColor = 'rgba(255, 17, 119, 0.2)'
          }
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
          gradient.addColorStop(0, fillColor)
          gradient.addColorStop(1, 'rgba(26, 26, 46, 0.95)')
          ctx.fillStyle = gradient
          
          ctx.shadowColor = glowColor
          ctx.shadowBlur = 20
        } else {
          ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
          ctx.shadowColor = 'rgba(0, 255, 159, 0.4)'
          ctx.shadowBlur = 10
        }
      } else if (tile) {
        ctx.fillStyle = isSelected 
          ? 'rgba(26, 26, 46, 0.95)'
          : 'rgba(26, 26, 46, 0.8)'
      } else {
        ctx.fillStyle = 'rgba(26, 26, 46, 0.3)'
      }
      
      // Draw hexagon with rounded corners
      ctx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point[0], point[1])
        else ctx.lineTo(point[0], point[1])
      })
      ctx.closePath()
      ctx.fill()

      // Reset shadow for edges
      ctx.shadowColor = 'none'
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0

      // Draw edges
      if (tile?.edges) {
        for (let i = 0; i < 6; i++) {
          const start = points[i]
          const end = points[(i + 1) % 6]
          
          if (settings.isColorBlind) {
            // In colorblind mode, use only black/white for edges
            ctx.strokeStyle = isMatched ? '#FFFFFF' : '#888888'
            ctx.lineWidth = isSelected ? 6 : 4  // Increased from 4:2
          } else {
            const color = tile.edges[i].color
            
            // Regular color mode with wider edges
            if (tile.isJoker) {
              // For joker tiles, use a solid color instead of gradient
              ctx.strokeStyle = '#FFFFFF'
              ctx.shadowColor = '#FFFFFF'
              ctx.shadowBlur = 10
            } else {
              const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1])
              gradient.addColorStop(0, color)
              gradient.addColorStop(1, color)
              ctx.strokeStyle = gradient
            }
            ctx.lineWidth = isSelected ? 7 : 5  // Increased from 5:3
          }
          
          ctx.beginPath()
          ctx.moveTo(start[0], start[1])
          ctx.lineTo(end[0], end[1])
          ctx.stroke()
        }

        // Special joker indicator and number for joker tiles
        if (tile.isJoker) {
          // Draw star above the number
          ctx.fillStyle = '#FFFFFF'
          ctx.shadowColor = '#FFFFFF'
          ctx.shadowBlur = 15
          ctx.font = 'bold 20px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('★', x, y - 12)  // Move star up

          // Draw number below the star
          ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
          ctx.shadowBlur = 2
          ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d'
          ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(tile.value.toString(), x, y + 12)  // Move number down

          // Show joker info when selected
          if (isSelected) {
            // Draw info box above tile
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
            ctx.lineWidth = 1
            const text = 'Matches any color'
            const padding = 10
            const boxWidth = ctx.measureText(text).width + padding * 2
            const boxHeight = 30
            const boxX = x - boxWidth / 2
            const boxY = y - size * 2

            // Draw box with rounded corners
            ctx.beginPath()
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
            ctx.fill()
            ctx.stroke()

            // Draw description text
            ctx.fillStyle = '#fff'
            ctx.font = '14px Arial'
            ctx.fillText(text, x, boxY + boxHeight/2)
          }
        } else {
          // Regular tile number
          if (tile.value > 0) {
            // Draw number with better visibility
            ctx.fillStyle = '#00FFFF'  // Bright cyan
            ctx.shadowColor = '#00FFFF'
            ctx.shadowBlur = 8
            ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(tile.value.toString(), x, y)
            ctx.shadowBlur = 0
          }
        }
      }

      // Inside drawHexagonWithColoredEdges function, after drawing the tile number
      if (tile?.powerUp) {
        const powerUpIcons = {
          freeze: '❄️',
          colorShift: '🎨',
          multiplier: '✨'
        }

        // Draw power-up icon above the number
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(powerUpIcons[tile.powerUp.type], x, y - 15)

        // Show power-up info when selected
        if (isSelected) {
          const descriptions = {
            freeze: 'Pauses the timer for 5s',
            colorShift: 'Changes adjacent tile colors',
            multiplier: 'Doubles points for 15s'
          }

          // Draw info box above tile
          ctx.fillStyle = 'rgba(0, 255, 159, 0.1)'
          ctx.strokeStyle = 'rgba(0, 255, 159, 0.3)'
          ctx.lineWidth = 1
          const text = descriptions[tile.powerUp.type]
          const padding = 10
          const boxWidth = ctx.measureText(text).width + padding * 2
          const boxHeight = 30
          const boxX = x - boxWidth / 2
          const boxY = y - size * 2

          // Draw box with rounded corners
          ctx.beginPath()
          ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 5)
          ctx.fill()
          ctx.stroke()

          // Draw description text
          ctx.fillStyle = '#fff'
          ctx.font = '14px Arial'
          ctx.fillText(descriptions[tile.powerUp.type], x, boxY + boxHeight/2)
        }
      }

      // Draw accessibility overlay
      if (tile && (settings.isColorBlind || settings.showEdgeNumbers)) {
        drawAccessibilityOverlay(ctx, tile, x, y, size, settings)
      }
    }

    const centerX = canvas.width / 2 - 100
    const centerY = canvas.height / 2
    const tileSize = 40
    const rows = 7
    const nextPiecesX = centerX + 400
    const nextPiecesY = 200

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isGameOver) {
        // Use transform matrix for better performance
        ctx.setTransform(1, 0, 0, 1, centerX, centerY)
        ctx.rotate((boardRotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)

        // Draw grid with valid placement highlights
        for (let q = -rows; q <= rows; q++) {
          for (let r = Math.max(-cols, -q-cols); r <= Math.min(cols, -q+cols); r++) {
            const s = -q - r
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)) {
              const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize)
              drawHexagonWithColoredEdges(x, y, tileSize, undefined, false)
            }
          }
        }

        // Draw all placed tiles in one batch
        placedTiles.forEach(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY, tileSize)
          const isMatched = hasMatchingEdges(tile, placedTiles, settings.isColorBlind)
          drawHexagonWithColoredEdges(x, y, tileSize, tile, isMatched)
        })

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        // Draw cursor tile
        if (selectedTileIndex !== null && mousePosition) {
          // Draw semi-transparent selected tile at cursor
          ctx.globalAlpha = 0.6
          drawHexagonWithColoredEdges(
            mousePosition.x,
            mousePosition.y,
            tileSize,
            nextTiles[selectedTileIndex],
            false,
            true
          )
          ctx.globalAlpha = 1.0
        }
      } else {
        // Draw only game over screen
        // Dark overlay with slight red tint
        ctx.fillStyle = 'rgba(25, 0, 0, 0.9)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Game Over container
        const containerWidth = 400
        const containerHeight = 500
        const containerX = (canvas.width - containerWidth) / 2
        const containerY = (canvas.height - containerHeight) / 2

        // Draw container with gradient background
        const gradient = ctx.createLinearGradient(containerX, containerY, containerX, containerY + containerHeight)
        gradient.addColorStop(0, '#2C0A1E')
        gradient.addColorStop(1, '#1A0712')
        ctx.fillStyle = gradient
        ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15)
        ctx.fill()

        // Container border with glow
        ctx.strokeStyle = '#FF4D6D'
        ctx.lineWidth = 3
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = 15
        ctx.roundRect(containerX, containerY, containerWidth, containerHeight, 15)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Game Over text
        ctx.font = 'bold 48px Arial'
        ctx.fillStyle = '#FF8FA3'
        ctx.textAlign = 'center'
        ctx.fillText('GAME OVER', canvas.width / 2, containerY + 80)

        // Final Score text
        ctx.font = 'bold 32px Arial'
        ctx.fillStyle = '#FF4D6D'
        ctx.fillText('Final Score', canvas.width / 2, containerY + 180)
        
        // Score with glow
        ctx.font = 'bold 56px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = 10
        ctx.fillText(score.toString(), canvas.width / 2, containerY + 260)
        ctx.shadowBlur = 0

        // Draw button container last
        const buttonContainerHeight = 100
        const buttonContainerY = containerY + containerHeight - buttonContainerHeight

        // Button container background
        ctx.fillStyle = 'rgba(44, 10, 30, 0.95)'
        ctx.beginPath()
        ctx.roundRect(containerX, buttonContainerY, containerWidth, buttonContainerHeight, [0, 0, 15, 15])
        ctx.fill()

        // Play Again button
        const buttonWidth = 200
        const buttonHeight = 50
        const buttonX = canvas.width / 2 - buttonWidth / 2
        const buttonY = buttonContainerY + (buttonContainerHeight - buttonHeight) / 2

        // Draw button with hover effect
        ctx.fillStyle = '#FF4D6D'
        ctx.shadowColor = '#FF4D6D'
        ctx.shadowBlur = mousePosition && 
          mousePosition.x >= buttonX && mousePosition.x <= buttonX + buttonWidth &&
          mousePosition.y >= buttonY && mousePosition.y <= buttonY + buttonHeight ? 15 : 5
        ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10)
        ctx.fill()

        // Button text
        ctx.shadowBlur = 0
        ctx.font = 'bold 24px Arial'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText('Play Again', canvas.width / 2, buttonY + buttonHeight/2 + 8)
      }
    }

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      if (isGameOver) {
        const containerHeight = 500
        const buttonContainerHeight = 100
        const buttonWidth = 200
        const buttonHeight = 50
        const buttonX = canvas.width / 2 - buttonWidth / 2
        const buttonY = (canvas.height - containerHeight) / 2 + containerHeight - buttonContainerHeight + (buttonContainerHeight - buttonHeight) / 2

        if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
          // Reset game state
          setPlacedTiles([{
            ...createTileWithRandomEdges(0, 0),
            isPlaced: true
          }])
          setScore(0)
          setTimeLeft(timedMode ? INITIAL_TIME : Infinity)
          setIsGameOver(false)
          setNextTiles([
            { ...createTileWithRandomEdges(0, 0), isPlaced: false },
            { ...createTileWithRandomEdges(0, 0), isPlaced: false },
            { ...createTileWithRandomEdges(0, 0), isPlaced: false }
          ])
          setSelectedTileIndex(null)
          return
        }
        return
      }

      // Check if click is in next pieces area
      nextTiles.forEach((tile, index) => {
        const pieceX = nextPiecesX
        const pieceY = nextPiecesY + index * 100
        const distance = Math.sqrt((mouseX - pieceX) ** 2 + (mouseY - pieceY) ** 2)
        
        if (distance < tileSize && !tile.isPlaced) {
          setSelectedTileIndex(index)
          return
        }
      })

      // If a tile is selected and click is on the grid
      if (selectedTileIndex !== null) {
        // Adjust click coordinates based on rotation
        const adjustedX = mouseX - centerX
        const adjustedY = mouseY - centerY
        
        // Apply inverse rotation to get true grid coordinates
        const angle = (-boardRotation * Math.PI) / 180
        const rotatedX = adjustedX * Math.cos(angle) - adjustedY * Math.sin(angle)
        const rotatedY = adjustedX * Math.sin(angle) + adjustedY * Math.cos(angle)
        
        // Calculate grid position using rotated coordinates
        const q = Math.round((rotatedX + centerX - centerX) / (tileSize * 1.5))
        const r = Math.round((rotatedY + centerY - centerY - q * tileSize * Math.sqrt(3)/2) / (tileSize * Math.sqrt(3)))
        const s = -q - r

        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r)

        if (isValidPosition && !isOccupied) {
          const selectedTile = nextTiles[selectedTileIndex]
          
          // Place the new tile
          const newTile: PlacedTile = { 
            ...selectedTile, 
            q, 
            r,
            value: 0,
            isPlaced: true 
          }
          
          // Update all tiles' values after placement
          const newPlacedTiles = updateTileValues([...placedTiles, newTile])
          
          // Get the updated tile with its correct value
          const updatedPlacedTile = newPlacedTiles.find(tile => tile.q === q && tile.r === r)!
          
          // Show score popup for immediate matches with the placed tile
          const placedTileScore = calculateScore(updatedPlacedTile.value * 2)
          if (placedTileScore > 0) {
            const feedback = getFeedbackForScore(placedTileScore)
            const popupY = findAvailableYPosition(canvas.height / 2 - 100, 'score')
            setScorePopups(prev => [...prev, {
              score: placedTileScore,
              x: canvas.width / 2,
              y: popupY,
              id: Date.now(),
              emoji: feedback.emoji,
              text: feedback.text
            }])
          }
          setScore(prevScore => prevScore + placedTileScore)

          // Check for matches for grid-full bonus
          const matchingTiles = newPlacedTiles.filter(tile => hasMatchingEdges(tile, newPlacedTiles, settings.isColorBlind))
          
          // Additional bonus for clearing tiles when grid is full
          if (matchingTiles.length >= 3 && isGridFull(newPlacedTiles, cols)) {
            const totalMatchScore = matchingTiles.reduce((sum, tile) => sum + tile.value, 0)
            const multiplier = matchingTiles.length
            const clearBonus = calculateScore(totalMatchScore * multiplier * 2)
            
            const clearInfo = getFeedbackForClear(clearBonus)

            setTimeout(() => {
              const popupY = findAvailableYPosition(canvas.height / 2 - 50, 'clear')
              setScorePopups(prev => [...prev, {
                score: clearBonus,
                x: canvas.width / 2,
                y: popupY,
                id: Date.now() + 1,
                emoji: clearInfo.emoji,
                text: clearInfo.text
              }])
              setScore(prevScore => prevScore + clearBonus)
            }, 300)

            // Remove matching tiles
            setTimeout(() => {
              setPlacedTiles(newPlacedTiles.filter(tile => !hasMatchingEdges(tile, newPlacedTiles, settings.isColorBlind)))
            }, 500)
          }
          
          // Update board with new tile
          setPlacedTiles(newPlacedTiles)
          
          // Add this line to activate power-up if present
          if (selectedTile.powerUp) {
            activatePowerUp(selectedTile)
          }
          
          // Generate new tile for the used slot
          const newTiles = [...nextTiles]
          newTiles[selectedTileIndex] = { ...createTileWithRandomEdges(0, 0), isPlaced: false }
          setNextTiles(newTiles)
          setSelectedTileIndex(null)

          // Update combo only if there's a match
          if (placedTileScore > 0) {
            const now = Date.now()
            const timeSinceLastPlacement = now - combo.lastPlacementTime
            const quickPlacement = timeSinceLastPlacement < 2000
            setIsQuickPlacement(quickPlacement)

            setCombo(prev => ({
              count: quickPlacement ? prev.count + 1 : 1,
              timer: 3,
              multiplier: 1 + (quickPlacement ? prev.count + 1 : 1) * 0.5, // Each combo level adds 50% more
              lastPlacementTime: now
            }))

            // Add combo popup if streak exists
            if (combo.count > 1) {
              const comboBonus = Math.round(placedTileScore * combo.multiplier) - placedTileScore // Calculate actual bonus
              if (comboBonus > 0) {
                const comboInfo = getFeedbackForCombo(combo.count + 1)
                
                // Add quick placement bonus feedback
                if (isQuickPlacement) {
                  const quickY = findAvailableYPosition(canvas.height / 2, 'quick')
                  const quickInfo = getRandomFeedback('QUICK')
                  setScorePopups(prev => [...prev, {
                    score: 0,
                    x: canvas.width / 2,
                    y: quickY,
                    id: Date.now() + 3,
                    emoji: quickInfo.emoji,
                    text: quickInfo.text
                  }])
                }
                
                const comboY = findAvailableYPosition(canvas.height / 2 + 50, 'combo')
                setScorePopups(prev => [...prev, {
                  score: comboBonus,
                  x: canvas.width / 2,
                  y: comboY,
                  id: Date.now() + 2,
                  emoji: comboInfo.emoji,
                  text: comboInfo.text
                }])
                setScore(prevScore => prevScore + comboBonus)
              }
            }
          } else {
            // Reset combo if no match
            setCombo({
              count: 0,
              timer: 0,
              multiplier: 1,
              lastPlacementTime: 0
            })
            setIsQuickPlacement(false)
          }

          // When selecting a tile, calculate potential matches
          if (settings.showMatchHints || settings.isColorBlind) {
            const hints = findPotentialMatches(selectedTile, placedTiles, settings.isColorBlind)
            // Update tile matchPotential based on hints
            setPlacedTiles(prev => prev.map(tile => ({
              ...tile,
              matchPotential: hints
                .filter(hint => {
                  const tileKey = `${tile.q},${tile.r}`
                  const hintKey = `${hint.targetEdge.q},${hint.targetEdge.r}`
                  return tileKey === hintKey
                })
                .map(hint => hint.strength)
            })))
          }

          // After successful tile placement, save the state
          if (isValidPosition && !isOccupied) {
            setPreviousState({
              placedTiles,
              nextTiles,
              score
            })
          }
        }
      }

      if (tutorialState.active) {
        const currentStep = TUTORIAL_STEPS[tutorialState.currentStep]
        
        if (currentStep.requiresAction === 'select' && selectedTileIndex !== null) {
          progressTutorial()
        } else if (currentStep.requiresAction === 'place') {
          setTutorialState(prev => ({ ...prev, hasPlaced: true }))
          progressTutorial()
        }
      }
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
      if (selectedTileIndex !== null) {
        soundManager.playSound('tileRotate')
        const newTiles = [...nextTiles]
        newTiles[selectedTileIndex] = {
          ...newTiles[selectedTileIndex],
          edges: rotateTileEdges(newTiles[selectedTileIndex].edges)
        }
        setNextTiles(newTiles)
      }

      if (tutorialState.active) {
        const currentStep = TUTORIAL_STEPS[tutorialState.currentStep]
        if (currentStep.requiresAction === 'rotate') {
          setTutorialState(prev => {
            const newRotationCount = prev.rotationCount + 1
            if (newRotationCount >= 3) { // Require 3 rotations before progressing
              progressTutorial()
              return { ...prev, rotationCount: 0 }
            }
            return { ...prev, rotationCount: newRotationCount }
          })
        }
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }

    // Add the context menu event listener with the click handler
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('contextmenu', handleContextMenu)

    draw()

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [placedTiles, nextTiles, selectedTileIndex, score, timeLeft, isGameOver, mousePosition, settings])

  // Add power-up activation handler
  const activatePowerUp = (tile: PlacedTile) => {
    if (!tile.powerUp) return

    const { type } = tile.powerUp
    soundManager.playSound('powerUp')

    switch (type) {
      case 'freeze':
        setPowerUps(prev => ({
          ...prev,
          freeze: { active: true, remainingTime: tile.powerUp!.duration! }
        }))
        break

      case 'colorShift':
        const adjacentTiles = getAdjacentTiles(tile, placedTiles)
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)]
        const updatedTiles = placedTiles.map(t => {
          if (adjacentTiles.includes(t)) {
            return {
              ...t,
              edges: t.edges.map(() => ({ color: randomColor }))
            }
          }
          return t
        })
        setPlacedTiles(updatedTiles)
        break

      case 'multiplier':
        setPowerUps(prev => ({
          ...prev,
          multiplier: { 
            active: true, 
            value: tile.powerUp!.multiplier!, 
            remainingTime: tile.powerUp!.duration! 
          }
        }))
        break
    }
  }

  // Add power-up timer effect
  useEffect(() => {
    if (!isGameOver) {
      const timer = setInterval(() => {
        setPowerUps((prev: PowerUpState) => ({
          freeze: {
            active: prev.freeze.remainingTime > 0,
            remainingTime: Math.max(0, prev.freeze.remainingTime - 1)
          },
          colorShift: prev.colorShift,
          multiplier: {
            active: prev.multiplier.remainingTime > 0,
            value: prev.multiplier.remainingTime > 0 ? prev.multiplier.value : 1,
            remainingTime: Math.max(0, prev.multiplier.remainingTime - 1)
          }
        }))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isGameOver])

  // Keep only this modified timer effect
  useEffect(() => {
    if (timedMode && timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => {
        if (!powerUps.freeze.active) {
          setTimeLeft(prev => prev - 1)
        }
      }, 1000)
      return () => clearInterval(timer)
    } else if (timedMode && timeLeft === 0) {
      setIsGameOver(true)
      onGameOver()
    }
  }, [timeLeft, isGameOver, timedMode, powerUps.freeze.active, onGameOver])

  // Add combo timer effect
  useEffect(() => {
    if (combo.timer > 0) {
      const timer = setInterval(() => {
        setCombo(prev => ({
          ...prev,
          timer: Math.max(0, prev.timer - 1)
        }))
      }, 1000)
      return () => clearInterval(timer)
    } else if (combo.count > 0) {
      // Reset combo when timer runs out
      setCombo({
        count: 0,
        timer: 0,
        multiplier: 1,
        lastPlacementTime: 0
      })
    }
  }, [combo.timer])

  // Update score calculation to include combo multiplier
  const calculateScore = (baseScore: number) => {
    const powerUpMultiplier = powerUps.multiplier.active ? powerUps.multiplier.value : 1
    return Math.round(baseScore * powerUpMultiplier * combo.multiplier)
  }

  // Update popup cleanup effect to also clean positions
  useEffect(() => {
    const POPUP_DURATION = 1000

    if (scorePopups.length > 0) {
      const timer = setTimeout(() => {
        const now = Date.now()
        setScorePopups(prev => prev.filter(popup => 
          now - popup.id < POPUP_DURATION
        ))
        setActivePopupPositions(prev => 
          prev.filter(pos => pos.expiresAt > now)
        )
      }, POPUP_DURATION)

      return () => clearTimeout(timer)
    }
  }, [scorePopups])

  // Inside your Game component, modify the effect for potential matches
  useEffect(() => {
    if (selectedTileIndex !== null && (settings.showMatchHints || settings.isColorBlind)) {
      const selectedTile = nextTiles[selectedTileIndex]
      const hints = findPotentialMatches(selectedTile, placedTiles, settings.isColorBlind)
      
      // Create a map of potential matches for each tile
      const matchMap = new Map<string, number[]>()
      const tileKeys = new Set(placedTiles.map(tile => `${tile.q},${tile.r}`))
      
      // Initialize all positions with zeros
      tileKeys.forEach(key => {
        matchMap.set(key, Array(6).fill(0))
      })

      // Update only the positions that have matches
      hints.forEach(hint => {
        const key = `${hint.targetEdge.q},${hint.targetEdge.r}`
        const strengths = matchMap.get(key)
        if (strengths) {
          strengths[hint.targetEdge.position] = Math.max(
            strengths[hint.targetEdge.position],
            hint.strength
          )
        }
      })

      // Update placed tiles with match potentials in a single operation
      setPlacedTiles(prev => 
        prev.map(tile => {
          const key = `${tile.q},${tile.r}`
          return {
            ...tile,
            matchPotential: matchMap.get(key) || Array(6).fill(0)
          }
        })
      )
    } else {
      setPlacedTiles(prev => 
        prev.map(tile => ({
          ...tile,
          matchPotential: undefined
        }))
      )
    }
  }, [selectedTileIndex, nextTiles, settings.showMatchHints, settings.isColorBlind])

  // Add tutorial progress function
  const progressTutorial = () => {
    if (tutorialState.currentStep < TUTORIAL_STEPS.length - 1) {
      setTutorialState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        rotationCount: 0,
        hasPlaced: false
      }))
    } else {
      setTutorialState(prev => ({
        ...prev,
        active: false
      }))
    }
  }

  // Add effect to handle tutorial prop changes
  useEffect(() => {
    setTutorialState(prev => ({ ...prev, active: tutorial }))
  }, [tutorial])

  // Modify the game over effect to track game duration internally
  useEffect(() => {
    if (isGameOver) {
      const gameEndTime = Date.now()
      const gameStartTime = tutorialState.active ? gameEndTime : loadGameState()?.startTime ?? gameEndTime
      const playTime = (gameEndTime - gameStartTime) / 1000
      
      updateStatistics({
        gamesPlayed: 1,
        totalScore: score,
        highScore: Math.max(score, getStatistics().highScore),
        totalPlayTime: playTime,
        longestCombo: Math.max(combo.count, getStatistics().longestCombo),
        lastPlayed: new Date().toISOString()
      })
      clearSavedGame()
    }
  }, [isGameOver])

  // Modify the auto-save effect
  useEffect(() => {
    if (!isGameOver && !tutorialState.active) {
      const gameState: GameState = {
        placedTiles,
        nextTiles,
        score,
        timeLeft,
        moveHistory: previousState ? [previousState] : [],
        startTime: loadGameState()?.startTime ?? Date.now(),
        timedMode,
        boardRotation,
        powerUps,
        combo
      }
      saveGameState(gameState)
    }
  }, [placedTiles, nextTiles, score, timeLeft, previousState, isGameOver, tutorialState.active, boardRotation, powerUps, combo])

  // Add this function to handle undoing moves
  const handleUndo = () => {
    if (previousState) {
      setPlacedTiles(previousState.placedTiles)
      setNextTiles(previousState.nextTiles)
      setScore(previousState.score)
      setPreviousState(null)
      soundManager.playSound('undo')
    }
  }

  return (
    <div className="game-container">
      <div className="game-controls">
        {tutorialState.active ? (
          <button 
            className="skip-tutorial-button"
            onClick={onSkipTutorial}
          >
            Skip Tutorial
          </button>
        ) : (
          <button 
            className="exit-button"
            onClick={onExit}
          >
            Exit Game
          </button>
        )}
      </div>
      <div className="game-hud">
        <div className="score">
          {'Score: ' + score}
        </div>
        {timedMode && (
          <div className={`timer ${
            timeLeft > INITIAL_TIME * 0.5 ? 'safe' : 
            timeLeft > INITIAL_TIME * 0.25 ? 'warning' : 
            'danger'
          }`}>
            Time: {formatTime(timeLeft)}
          </div>
        )}
        <div className="power-up-indicator">
          {powerUps.freeze.active && (
            <div className="power-up-timer active">
              ❄️ {powerUps.freeze.remainingTime}s
            </div>
          )}
          {powerUps.multiplier.active && (
            <div className="power-up-timer active">
              ✨ {powerUps.multiplier.remainingTime}s
            </div>
          )}
        </div>
      </div>
      <div className="board-container">
        <canvas 
          ref={canvasRef} 
          className={`
            game-board 
            ${isGridFull(placedTiles, cols) ? 'grid-full' : ''}
            ${showWarning ? 'rotation-warning' : ''}
          `}
        />
        {showRotationText && (
          <div className="rotation-text">
            Rotation Incoming!
          </div>
        )}
      </div>
      <div className="next-tiles-container">
        <div className="next-tiles">
          {nextTiles.map((tile, index) => (
            <div 
              key={index} 
              className={`next-tile ${selectedTileIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedTileIndex(selectedTileIndex === index ? null : index)}
            >
              <canvas
                ref={el => {
                  if (el) {
                    const ctx = el.getContext('2d')
                    if (ctx) {
                      el.width = 100
                      el.height = 100
                      
                      // Draw tile background
                      ctx.fillStyle = 'rgba(26, 26, 46, 0.9)'
                      ctx.beginPath()
                      ctx.arc(50, 50, 40, 0, Math.PI * 2)
                      ctx.fill()

                      // Draw tile edges
                      tile.edges.forEach((edge, i) => {
                        const angle = (i * Math.PI) / 3
                        const startX = 50 + 35 * Math.cos(angle)
                        const startY = 50 + 35 * Math.sin(angle)
                        const endX = 50 + 35 * Math.cos(angle + Math.PI / 3)
                        const endY = 50 + 35 * Math.sin(angle + Math.PI / 3)

                        ctx.beginPath()
                        ctx.moveTo(startX, startY)
                        ctx.lineTo(endX, endY)
                        ctx.strokeStyle = edge.color
                        ctx.lineWidth = selectedTileIndex === index ? 5 : 3
                        ctx.stroke()
                      })

                      // Draw selection indicator
                      if (selectedTileIndex === index) {
                        ctx.strokeStyle = '#00FF9F'
                        ctx.lineWidth = 3
                        ctx.setLineDash([5, 5])
                        ctx.beginPath()
                        ctx.arc(50, 50, 45, 0, Math.PI * 2)
                        ctx.stroke()
                        ctx.setLineDash([])
                      }

                      // Draw tile value if it exists
                      if (tile.value > 0) {
                        ctx.fillStyle = '#00FFFF'
                        ctx.font = 'bold 24px Arial'
                        ctx.textAlign = 'center'
                        ctx.textBaseline = 'middle'
                        ctx.fillText(tile.value.toString(), 50, 50)
                      }

                      // Draw power-up indicator if present
                      if (tile.powerUp) {
                        const powerUpIcons = {
                          freeze: '❄️',
                          colorShift: '🎨',
                          multiplier: '✨'
                        }
                        ctx.font = '16px Arial'
                        ctx.fillText(powerUpIcons[tile.powerUp.type], 50, 20)
                      }
                    }
                  }
                }}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  transform: selectedTileIndex === index ? 'scale(1.1)' : 'scale(1)'
                }}
              />
            </div>
          ))}
        </div>
        <button 
          className="undo-button"
          onClick={handleUndo}
          disabled={!previousState}
        >
          Undo Last Move
        </button>
      </div>
      {scorePopups.map(popup => (
        <div
          key={popup.id}
          className="score-popup"
          data-type={popup.score >= 10 ? 'high' : popup.emoji.includes('🎪') ? 'clear' : 'normal'}
          style={{
            left: `${popup.x}px`,
            top: `${popup.y}px`
          }}
        >
          <span className="emoji">{popup.emoji}</span>
          <div className="popup-content">
            <div className="popup-text">{popup.text}</div>
            <div className="popup-score">+{popup.score}</div>
          </div>
        </div>
      ))}
      {tutorialState.active && (
        <TutorialMessage 
          step={TUTORIAL_STEPS[tutorialState.currentStep]}
          canProgress={!TUTORIAL_STEPS[tutorialState.currentStep].requiresAction || 
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'select' && selectedTileIndex !== null) ||
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'rotate' && tutorialState.rotationCount >= 3) ||
            (TUTORIAL_STEPS[tutorialState.currentStep].requiresAction === 'place' && tutorialState.hasPlaced)
          }
          onNext={progressTutorial}
        />
      )}
    </div>
  )
}

export default Game 