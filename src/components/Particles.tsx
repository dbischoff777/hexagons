import React, { useEffect, useRef } from 'react'
import './Particles.css'

interface ParticlesProps {
  intensity?: number  // 0-1 scale for particle density
  color?: string     // Primary color of particles
}

const Particles: React.FC<ParticlesProps> = ({ 
  intensity = 0.5,
  color = '#00FF9F' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle class
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      canvasWidth: number
      canvasHeight: number

      constructor(canvasWidth: number, canvasHeight: number) {
        this.canvasWidth = canvasWidth
        this.canvasHeight = canvasHeight
        this.x = Math.random() * this.canvasWidth
        this.y = Math.random() * this.canvasHeight
        this.size = Math.random() * 3 + 1
        this.speedX = Math.random() * 2 - 1
        this.speedY = Math.random() * 2 - 1
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around screen
        if (this.x > this.canvasWidth) this.x = 0
        if (this.x < 0) this.x = this.canvasWidth
        if (this.y > this.canvasHeight) this.y = 0
        if (this.y < 0) this.y = this.canvasHeight
      }

      draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `${color}${Math.floor(this.opacity * 255).toString(16).padStart(2, '0')}`
        ctx.fill()
      }
    }

    // Create particles
    const particleCount = Math.floor(100 * intensity)
    const particles = Array.from(
      { length: particleCount }, 
      () => new Particle(canvas.width, canvas.height)
    )

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw(ctx, color)
      })

      requestAnimationFrame(animate)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return
      resizeCanvas()
      // Update particles with new canvas dimensions
      particles.forEach(particle => {
        particle.canvasWidth = canvas.width
        particle.canvasHeight = canvas.height
      })
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('resize', handleResize)
    }
  }, [intensity, color])

  return (
    <canvas 
      ref={canvasRef} 
      className="particles-canvas"
    />
  )
}

export default Particles 