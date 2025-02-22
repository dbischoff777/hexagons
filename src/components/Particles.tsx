import React, { useEffect, useRef } from 'react'
import './Particles.css'

interface ParticlesProps {
  intensity?: number  // 0-1 scale for particle density
  color?: string     // Primary color of particles
  width?: number    // Add width prop
  height?: number   // Add height prop
}

const MAX_PARTICLES = 210;  // Maximum number of particles regardless of intensity
const BASE_PARTICLES = 80; // Base number of particles at 0.5 intensity
const DEPTH = 2;

const Particles: React.FC<ParticlesProps> = ({ 
  intensity = 0.5,
  color = '#00FF9F',
  width = 800,      // Default width
  height = 800      // Default height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = width
    canvas.height = height

    // Calculate radius constants here where we have access to width
    const MIN_RADIUS = width * 0.1  // 10% of width for inner radius
    const MAX_RADIUS = width * 0.4  // 40% of width for outer radius

    // Helper function to adjust color brightness
    const adjustColor = (hex: string, factor: number): string => {
      // Remove the # if present
      hex = hex.replace('#', '');
      
      // Convert to RGB
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      // Adjust each component
      const adjustedR = Math.min(255, Math.max(0, Math.round(r * factor)));
      const adjustedG = Math.min(255, Math.max(0, Math.round(g * factor)));
      const adjustedB = Math.min(255, Math.max(0, Math.round(b * factor)));
      
      // Convert back to hex
      return '#' + 
        adjustedR.toString(16).padStart(2, '0') +
        adjustedG.toString(16).padStart(2, '0') +
        adjustedB.toString(16).padStart(2, '0');
    };

    // Create darker and brighter variants of the base color
    const darkColor = adjustColor(color, 0.6);   // 60% brightness
    const brightColor = adjustColor(color, 1.4); // 140% brightness

    const getGradientStop = (ratio: number): string => {
      ratio = Math.min(Math.max(ratio, 0), 1);

      const c0 = darkColor.match(/.{1,2}/g)!.map(
        oct => parseInt(oct, 16) * (1 - ratio)
      );
      const c1 = brightColor.match(/.{1,2}/g)!.map(
        oct => parseInt(oct, 16) * ratio
      );
      const ci = [0, 1, 2].map(i => Math.min(Math.round(c0[i] + c1[i]), 255));
      const color = ci
        .reduce((a, v) => (a << 8) + v, 0)
        .toString(16)
        .padStart(6, "0");

      return `#${color}`;
    };

    const calculateColor = (x: number): string => {
      const maxDiff = MAX_RADIUS * 2;
      const distance = x + MAX_RADIUS;
      const ratio = distance / maxDiff;
      return getGradientStop(ratio);
    };

    // Particle class with enhanced properties
    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      angle: number
      rotationSpeed: number
      orbitRadius: number
      centerX: number
      centerY: number
      pulseSpeed: number
      pulseAmount: number
      initialSize: number
      cycleOffset: number
      cycleSpeed: number
      color: string

      constructor() {
        // Set center to middle of canvas
        this.centerX = width / 2
        this.centerY = height / 2
        
        // Create two layers of particles
        const isOuterLayer = Math.random() > 0.8
        
        // Calculate radius based on layer
        const minR = isOuterLayer ? MIN_RADIUS / 2 : MIN_RADIUS
        const maxR = isOuterLayer ? MAX_RADIUS * 2 : MAX_RADIUS
        this.orbitRadius = Math.random() * (maxR - minR) + minR
        
        // Random angle for circular motion
        this.angle = Math.random() * Math.PI * 2
        
        // Calculate position with depth
        const x = Math.cos(this.angle) * this.orbitRadius
        const y = Math.sin(this.angle) * this.orbitRadius
        const z = Math.random() * DEPTH * (isOuterLayer ? 10 : 1)
        
        // Apply perspective to size based on z
        const perspective = 1 + (z / (DEPTH * 10))
        
        // Set initial position
        this.x = this.centerX + x * perspective
        this.y = this.centerY + y * perspective
        
        // Calculate color based on x position
        this.color = calculateColor(x)
        
        // Size based on layer and perspective
        const baseSize = isOuterLayer ? 1 : 2
        this.initialSize = baseSize * perspective
        this.size = this.initialSize
        
        // Adjust opacity based on layer
        this.opacity = isOuterLayer ? 
          Math.random() * 0.3 + 0.1 : 
          Math.random() * 0.5 + 0.3
        
        // Slower movement for outer particles
        this.cycleOffset = Math.random() * Math.PI * 2
        this.cycleSpeed = (Math.random() * 0.0005 + 0.0002) * 
                          (Math.random() < 0.5 ? 1 : -1) * 
                          (isOuterLayer ? 0.5 : 1)
        
        // Rotation speed based on radius
        this.rotationSpeed = (Math.random() * 0.001 + 0.0005) * 
                            (Math.random() < 0.5 ? 1 : -1) * 
                            (isOuterLayer ? 0.3 : 1)
        
        // Pulsing effect properties
        this.pulseSpeed = Math.random() * 0.05 + 0.02
        this.pulseAmount = Math.random() * 0.5 + 0.5
        
        // Small random movement (reduced for outer particles)
        const movementFactor = 1 - (Math.sqrt(x * x + y * y) / (Math.min(width, height) * 0.8)) * 0.7
        this.speedX = (Math.random() - 0.5) * 0.3 * movementFactor
        this.speedY = (Math.random() - 0.5) * 0.3 * movementFactor
      }

      update() {
        // Update cycle position
        this.cycleOffset += this.cycleSpeed
        
        // Calculate base orbital position
        const orbitX = Math.cos(this.angle) * this.orbitRadius
        const orbitY = Math.sin(this.angle) * this.orbitRadius
        
        // Add cyclic movement
        const cycleX = Math.cos(this.cycleOffset) * (this.orbitRadius * 0.1)
        const cycleY = Math.sin(this.cycleOffset) * (this.orbitRadius * 0.1)
        
        // Combine movements
        this.x = this.centerX + orbitX + cycleX
        this.y = this.centerY + orbitY + cycleY
        
        // Update rotation
        this.angle += this.rotationSpeed
        
        // Pulsing size effect with minimum size
        const minSize = 0.5
        const pulsePhase = (Date.now() * this.pulseSpeed + this.cycleOffset) % (Math.PI * 2)
        this.size = Math.max(
          minSize,
          this.initialSize + Math.sin(pulsePhase) * this.pulseAmount
        )

        // Update opacity with smooth variation
        const opacityPhase = (Date.now() * 0.001 + this.cycleOffset) % (Math.PI * 2)
        const baseFactor = Math.sin(opacityPhase) * 0.2 + 0.8
        const distanceFactor = 1 - (Math.sqrt(orbitX * orbitX + orbitY * orbitY) / (Math.min(width, height) * 0.8))
        this.opacity = baseFactor * (0.3 + distanceFactor * 0.7)
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        
        const minRadius = 0.4;
        const gradient = ctx.createRadialGradient(
          this.x, this.y, minRadius,
          this.x, this.y, Math.max(this.size, minRadius)
        );
        
        // Convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Calculate optimal particle count based on screen size and intensity
    const calculateParticleCount = () => {
      // Base calculation using intensity
      const baseCount = Math.floor(BASE_PARTICLES * intensity)
      
      // Scale based on canvas size (fewer particles for smaller areas)
      const areaFactor = (width * height) / (800 * 800)
      const scaledCount = Math.floor(baseCount * areaFactor)
      
      // Ensure we don't exceed maximum particles
      return Math.min(scaledCount, MAX_PARTICLES)
    }

    // Create particles with limited count
    const particleCount = calculateParticleCount()
    const particles = Array.from(
      { length: particleCount }, 
      () => new Particle()
    )

    // Optimize animation loop
    let animationFrameId: number
    const animate = () => {
      if (!ctx || !canvas) return
      
      // Create motion blur effect with faster fade
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)' // Increased alpha for faster fade
      ctx.fillRect(0, 0, width, height)
      
      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw(ctx)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    // Clear canvas before starting animation
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
    animate()

    // Proper cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [intensity, color, width, height])

  return (
    <canvas 
      ref={canvasRef} 
      className="particles-canvas"
      style={{
        position: 'absolute',
        width: `${width}px`,
        height: `${height}px`,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    />
  )
}

export default Particles 