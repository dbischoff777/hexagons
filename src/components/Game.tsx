import { useEffect, useRef, useState } from 'react'
import { PlacedTile } from '../types'
import { createTileWithRandomEdges, hexToPixel } from '../utils/hexUtils'
import { INITIAL_TIME, hasMatchingEdges, formatTime, updateTileValues, isGridFull } from '../utils/gameUtils'
import './Game.css'

const rotateTileEdges = (edges: { color: string }[]) => {
  return [...edges.slice(-1), ...edges.slice(0, -1)]
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([{
    ...createTileWithRandomEdges(0, 0),
    isPlaced: true
  }])
  const [score, setScore] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME)
  const [isGameOver, setIsGameOver] = useState<boolean>(false)
  const [nextTiles, setNextTiles] = useState<PlacedTile[]>([
    { ...createTileWithRandomEdges(0, 0), isPlaced: false },
    { ...createTileWithRandomEdges(0, 0), isPlaced: false },
    { ...createTileWithRandomEdges(0, 0), isPlaced: false }
  ])
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null)

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isGameOver) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    } else if (timeLeft === 0) {
      setIsGameOver(true)
    }
  }, [timeLeft, isGameOver])

  // Main game effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1000
    canvas.height = 800

    const drawHexagonWithColoredEdges = (x: number, y: number, size: number, tile?: PlacedTile, isMatched: boolean = false, isSelected: boolean = false) => {
      const points: [number, number][] = []
      
      // Calculate all points first
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const xPos = x + size * Math.cos(angle)
        const yPos = y + size * Math.sin(angle)
        points.push([xPos, yPos])
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
        ctx.fillStyle = 'rgba(65, 105, 225, 0.3)' // Royal blue with transparency
        ctx.fill()
        
        // Pulsing border
        ctx.strokeStyle = '#4169E1' // Royal blue
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Selection indicator
        ctx.fillStyle = '#4169E1'
        ctx.font = 'bold 24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('▼', x, y - size - 10) // Arrow pointing to selected tile
      }

      // Add shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
      ctx.shadowBlur = 5
      ctx.shadowOffsetY = 2

      // Enhanced background colors
      if (tile?.isPlaced) {
        if (isMatched) {
          ctx.fillStyle = 'rgba(255, 223, 186, 0.95)' // Warm glow for matches
          ctx.shadowColor = 'rgba(255, 166, 0, 0.4)'
          ctx.shadowBlur = 15
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
        }
      } else if (tile) {
        ctx.fillStyle = isSelected ? 'rgba(220, 230, 255, 0.95)' : 'rgba(245, 245, 245, 0.95)'
      } else {
        ctx.fillStyle = 'rgba(230, 230, 230, 0.3)' // More transparent grid
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

      // Draw edges with gradient
      if (tile?.edges) {
        for (let i = 0; i < 6; i++) {
          const start = points[i]
          const end = points[(i + 1) % 6]
          
          const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1])
          gradient.addColorStop(0, tile.edges[i].color)
          gradient.addColorStop(1, tile.edges[i].color)
          
          ctx.beginPath()
          ctx.moveTo(start[0], start[1])
          ctx.lineTo(end[0], end[1])
          ctx.strokeStyle = gradient
          ctx.lineWidth = isSelected ? 4 : 3
          ctx.lineCap = 'round'
          ctx.stroke()
        }

        // Draw number with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 2
        ctx.fillStyle = isSelected ? '#1a1a1a' : '#2d2d2d'
        ctx.font = `bold ${isSelected ? 24 : 22}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tile.value.toString(), x, y)
      }
    }

    const centerX = canvas.width / 2 - 100
    const centerY = canvas.height / 2
    const tileSize = 40
    const rows = 7
    const cols = 7
    const nextPiecesX = centerX + 400
    const nextPiecesY = 200

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (!isGameOver) {
        // Draw regular game elements only if game is not over
        
        // Draw empty grid
        for (let q = -rows; q <= rows; q++) {
          for (let r = Math.max(-cols, -q-cols); r <= Math.min(cols, -q+cols); r++) {
            const s = -q - r
            if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)) {
              const { x, y } = hexToPixel(q, r, centerX, centerY, tileSize)
              drawHexagonWithColoredEdges(x, y, tileSize)
            }
          }
        }

        // Draw placed tiles
        placedTiles.forEach(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r, centerX, centerY, tileSize)
          const isMatched = hasMatchingEdges(tile, placedTiles)
          drawHexagonWithColoredEdges(x, y, tileSize, tile, isMatched)
        })

        // Draw next pieces area
        nextTiles.forEach((tile, index) => {
          drawHexagonWithColoredEdges(
            nextPiecesX, 
            nextPiecesY + index * 100, 
            tileSize, 
            tile, 
            false,
            index === selectedTileIndex
          )
        })

        // Add rotation hint text
        if (selectedTileIndex !== null) {
          ctx.fillStyle = '#00FF9F'  // Neon green
          ctx.shadowColor = '#00FF9F'
          ctx.shadowBlur = 8
          ctx.font = '16px Arial'
          ctx.fillText('Right click to rotate', nextPiecesX, nextPiecesY - 69)
          ctx.shadowBlur = 0
        }

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
          setTimeLeft(INITIAL_TIME)
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
        const q = Math.round((mouseX - centerX) / (tileSize * 1.5))
        const r = Math.round((mouseY - centerY - q * tileSize * Math.sqrt(3)/2) / (tileSize * Math.sqrt(3)))
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
          
          // Only check for matches if grid is full
          if (isGridFull(newPlacedTiles, cols)) {
            const matchingTiles = newPlacedTiles.filter(tile => hasMatchingEdges(tile, newPlacedTiles))
            
            if (matchingTiles.length >= 3) {
              // Calculate score based on the number of matching borders
              const tileSum = matchingTiles.reduce((sum, tile) => sum + tile.value, 0)
              const multiplier = matchingTiles.length
              const additionalScore = tileSum * multiplier * 2
              
              setScore(prevScore => prevScore + additionalScore)
              
              // Remove all highlighted tiles after delay
              setTimeout(() => {
                setPlacedTiles(newPlacedTiles.filter(tile => !hasMatchingEdges(tile, newPlacedTiles)))
              }, 500)
            }
          } else {
            // Just update the board with new tile
            setPlacedTiles(newPlacedTiles)
          }
          
          // Generate new tile for the used slot
          const newTiles = [...nextTiles]
          newTiles[selectedTileIndex] = { ...createTileWithRandomEdges(0, 0), isPlaced: false }
          setNextTiles(newTiles)
          setSelectedTileIndex(null)
        }
      }
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault() // Prevent default context menu
      
      if (selectedTileIndex !== null) {
        const newTiles = [...nextTiles]
        newTiles[selectedTileIndex] = {
          ...newTiles[selectedTileIndex],
          edges: rotateTileEdges(newTiles[selectedTileIndex].edges)
        }
        setNextTiles(newTiles)
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
  }, [placedTiles, nextTiles, selectedTileIndex, score, timeLeft, isGameOver, mousePosition])

  return (
    <div className="game-container">
      <div className="game-hud">
        <div className="score">Score: {score}</div>
        <div className={`timer ${
          timeLeft > INITIAL_TIME * 0.5 ? 'safe' : 
          timeLeft > INITIAL_TIME * 0.25 ? 'warning' : 
          'danger'
        }`}>
          Time: {formatTime(timeLeft)}
        </div>
      </div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default Game 