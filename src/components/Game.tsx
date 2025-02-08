import { useEffect, useRef, useState } from 'react'
import './Game.css'

interface Edge {
  color: string
}

interface Tile {
  q: number
  r: number
  edges: Edge[]
  value: number
}

const COLORS = ['#2196F3', '#4CAF50', '#FFC107', '#9C27B0', '#F44336', '#FF9800']

const getRandomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)]
const getRandomValue = () => Math.floor(Math.random() * 9) + 1

const createTileWithRandomEdges = (q: number, r: number): Tile => ({
  q,
  r,
  edges: Array(6).fill(null).map(() => ({ color: getRandomColor() })),
  value: getRandomValue()
})

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [placedTiles, setPlacedTiles] = useState<Tile[]>([createTileWithRandomEdges(0, 0)])
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [nextTiles, setNextTiles] = useState<Tile[]>([
    createTileWithRandomEdges(0, 0),
    createTileWithRandomEdges(0, 0),
    createTileWithRandomEdges(0, 0)
  ])
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    tile: Tile | null;
    tileIndex: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  }>({
    isDragging: false,
    tile: null,
    tileIndex: -1,
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1000
    canvas.height = 800

    const drawHexagonWithColoredEdges = (x: number, y: number, size: number, tile?: Tile) => {
      const points: [number, number][] = []
      
      // Calculate all points first
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3
        const xPos = x + size * Math.cos(angle)
        const yPos = y + size * Math.sin(angle)
        points.push([xPos, yPos])
      }

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
        ctx.fillStyle = '#000000'
        ctx.font = '20px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(tile.value.toString(), x, y)
      } else {
        // Draw empty hexagon for the grid
        ctx.beginPath()
        points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point[0], point[1])
          else ctx.lineTo(point[0], point[1])
        })
        ctx.closePath()
        ctx.strokeStyle = '#ddd'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    const hexToPixel = (q: number, r: number, centerX: number, centerY: number, size: number) => {
      const x = centerX + size * (3/2 * q)
      const y = centerY + size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
      return { x, y }
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
        drawHexagonWithColoredEdges(x, y, tileSize, tile)
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
      if (dragState.isDragging && dragState.tile) {
        const rect = canvas.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Convert pixel coordinates to hex coordinates
        const q = Math.round((mouseX - centerX) / (tileSize * 1.5))
        const r = Math.round((mouseY - centerY - q * tileSize * Math.sqrt(3)/2) / (tileSize * Math.sqrt(3)))
        const s = -q - r

        // Check if position is valid and not occupied
        const isValidPosition = Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= Math.floor(cols/2)
        const isOccupied = placedTiles.some(tile => tile.q === q && tile.r === r)

        if (isValidPosition && !isOccupied) {
          // Place the tile
          setPlacedTiles([...placedTiles, { ...dragState.tile, q, r }])
          
          // Generate new tiles array with a new tile replacing the used one
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
  }, [placedTiles, selectedTile, nextTiles, dragState])

  return (
    <div className="game-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default Game 