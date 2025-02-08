import { useEffect, useRef, useState } from 'react'
import { DragState, PlacedTile } from '../types'
import { createTileWithRandomEdges, hexToPixel } from '../utils/hexUtils'
import { INITIAL_TIME, hasMatchingEdges, canAcceptMoreConnections, formatTime } from '../utils/gameUtils'
import './Game.css'

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
    { ...createTileWithRandomEdges(0, 0), isPlaced: true },
    { ...createTileWithRandomEdges(0, 0), isPlaced: true },
    { ...createTileWithRandomEdges(0, 0), isPlaced: true }
  ])
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    tile: null,
    tileIndex: -1,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0
  })

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

    const drawHexagonWithColoredEdges = (x: number, y: number, size: number, tile?: PlacedTile, isMatched: boolean = false) => {
      const points: [number, number][] = []
      
      // Calculate all points first
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const xPos = x + size * Math.cos(angle)
        const yPos = y + size * Math.sin(angle)
        points.push([xPos, yPos])
      }

      // Draw background
      ctx.beginPath()
      points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point[0], point[1])
        else ctx.lineTo(point[0], point[1])
      })
      ctx.closePath()

      if (tile?.isPlaced) {
        if (isMatched) {
          ctx.fillStyle = 'rgba(255, 255, 200, 0.9)' // Light yellow for matched tiles
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)' // White for placed tiles
        }
      } else if (tile) {
        ctx.fillStyle = 'rgba(240, 240, 240, 0.9)' // Light gray for draggable tiles
      } else {
        ctx.fillStyle = 'rgba(230, 230, 230, 0.5)' // Very light gray for empty grid
      }
      ctx.fill()

      // Draw each edge with its color
      if (tile?.edges) {
        for (let i = 0; i < 6; i++) {
          const start = points[i]
          const end = points[(i + 1) % 6]
          
          ctx.beginPath()
          ctx.moveTo(start[0], start[1])
          ctx.lineTo(end[0], end[1])
          ctx.strokeStyle = tile.edges[i].color
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Draw the number
        ctx.fillStyle = isMatched ? '#000000' : '#444444'
        ctx.font = 'bold 20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tile.value.toString(), x, y)
      } else {
        // Draw empty hexagon border
        ctx.strokeStyle = '#ddd'
        ctx.lineWidth = 1
        ctx.stroke()
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

      // Draw score and timer
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`Score: ${score}`, canvas.width / 2 - 100, 40)
      
      // Format time as MM:SS
      const timeString = formatTime(timeLeft)
      ctx.fillText(`Time: ${timeString}`, canvas.width / 2 + 100, 40)

      // Show game over message
      if (isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 48px Arial'
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2)
        ctx.font = 'bold 24px Arial'
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 50)
      }

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
        drawHexagonWithColoredEdges(nextPiecesX, nextPiecesY + index * 100, tileSize, tile)
      })

      // Draw dragging tile
      if (dragState.isDragging && dragState.tile) {
        drawHexagonWithColoredEdges(dragState.x, dragState.y, tileSize, dragState.tile)
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Check if click is in next pieces area
      nextTiles.forEach((tile, index) => {
        const pieceX = nextPiecesX
        const pieceY = nextPiecesY + index * 100
        const distance = Math.sqrt((mouseX - pieceX) ** 2 + (mouseY - pieceY) ** 2)
        
        if (distance < tileSize) {
          setDragState({
            isDragging: true,
            tile: tile,
            tileIndex: index,
            x: mouseX,
            y: mouseY,
            offsetX: mouseX - pieceX,
            offsetY: mouseY - pieceY
          })
        }
      })
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (dragState.isDragging) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top
        
        setDragState(prev => ({
          ...prev,
          x: mouseX - prev.offsetX,
          y: mouseY - prev.offsetY
        }))
        draw()
      }
    }

    const handleMouseUp = (event: MouseEvent) => {
      if (isGameOver) return

      if (dragState.isDragging && dragState.tile) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        const q = Math.round((mouseX - centerX) / (tileSize * 1.5))
        const r = Math.round((mouseY - centerY - q * tileSize * Math.sqrt(3)/2) / (tileSize * Math.sqrt(3)))
        const s = -q - r

        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r)

        if (isValidPosition && !isOccupied) {
          const newTile: PlacedTile = { 
            ...dragState.tile, 
            q, 
            r,
            isPlaced: true 
          }
          const newPlacedTiles = [...placedTiles, newTile]
          
          // Find all connected matching tiles recursively
          const findConnectedMatches = (tile: PlacedTile, matches: Set<PlacedTile>) => {
            if (!matches.has(tile) && hasMatchingEdges(tile, newPlacedTiles)) {
              matches.add(tile)
              // Check neighbors
              newPlacedTiles.forEach(neighbor => {
                if (!matches.has(neighbor) && 
                    Math.abs(neighbor.q - tile.q) <= 1 && 
                    Math.abs(neighbor.r - tile.r) <= 1 &&
                    hasMatchingEdges(neighbor, newPlacedTiles)) {
                  findConnectedMatches(neighbor, matches)
                }
              })
            }
            return matches
          }

          const matchingTilesSet = findConnectedMatches(newTile, new Set<PlacedTile>())
          const matchingTiles = Array.from(matchingTilesSet)
          
          // Check if all matching tiles are in dead ends
          const deadEndTiles = matchingTiles.filter(tile => 
            !canAcceptMoreConnections(tile, newPlacedTiles, cols)
          )

          if (deadEndTiles.length === matchingTiles.length && matchingTiles.length >= 3) {
            const tileSum = matchingTiles.reduce((sum, tile) => sum + tile.value, 0)
            const multiplier = matchingTiles.length
            const additionalScore = tileSum * multiplier
            
            setScore(prevScore => prevScore + additionalScore)
            
            setTimeout(() => {
              setPlacedTiles(newPlacedTiles.filter(tile => !matchingTiles.includes(tile)))
            }, 500)
          } else {
            const matchScore = matchingTiles.reduce((sum, tile) => sum + tile.value, 0)
            setScore(prevScore => prevScore + matchScore)
            setPlacedTiles(newPlacedTiles)
          }
          
          const newTiles = [...nextTiles]
          newTiles[dragState.tileIndex] = createTileWithRandomEdges(0, 0)
          setNextTiles(newTiles)
        }
      }
      
      setDragState({
        isDragging: false,
        tile: null,
        tileIndex: -1,
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0
      })
      draw()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    draw()

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [placedTiles, nextTiles, dragState, score, timeLeft, isGameOver])

  return (
    <div className="game-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default Game 