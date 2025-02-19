import React, { useEffect, useRef } from 'react'
import './HexagonGrid.css'

interface HexagonGridProps {
  color?: string
  size?: number
  gap?: number
  hover?: boolean
}

const HexagonGrid: React.FC<HexagonGridProps> = ({
  color = '#00FF9F',
  size = 40,
  gap = 4,
  hover = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colsRef = useRef(0)
  const rowsRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hexWidth = size * 2
    const hexHeight = Math.sqrt(3) * size

    const updateSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      colsRef.current = Math.ceil(canvas.width / (hexWidth + gap)) + 1
      rowsRef.current = Math.ceil(canvas.height / (hexHeight + gap)) + 1
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)

    const getHexPoints = (x: number, y: number, size: number) => {
      const points = []
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        points.push({
          x: x + size * Math.cos(angle),
          y: y + size * Math.sin(angle)
        })
      }
      return points
    }

    const drawHexagon = (x: number, y: number, size: number, opacity: number) => {
      const points = getHexPoints(x, y, size)
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.closePath()
      ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`
      ctx.stroke()
    }

    let mouseX = 0
    let mouseY = 0
    let frame = 0

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseX = (e.clientX - rect.left) * (canvas.width / rect.width)
      mouseY = (e.clientY - rect.top) * (canvas.height / rect.height)
    }
    if (hover) {
      canvas.addEventListener('mousemove', handleMouseMove)
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      for (let row = 0; row < rowsRef.current; row++) {
        for (let col = 0; col < colsRef.current; col++) {
          const x = col * (hexWidth + gap) + (row % 2) * (hexWidth / 2)
          const y = row * (hexHeight + gap)

          const dx = x - mouseX
          const dy = y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          let opacity = 0.1 + Math.sin(frame * 0.02 + (x + y) * 0.01) * 0.05

          if (hover && distance < 200) {
            opacity += (1 - distance / 200) * 0.3
          }

          drawHexagon(x, y, size, opacity)
        }
      }

      requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', updateSize)
      if (hover) {
        canvas.removeEventListener('mousemove', handleMouseMove)
      }
    }
  }, [color, size, gap, hover])

  return (
    <canvas 
      ref={canvasRef}
      className="hexagon-grid"
    />
  )
}

export default HexagonGrid 