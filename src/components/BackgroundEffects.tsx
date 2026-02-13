import { motion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useAdaptiveAnimations } from '../hooks/usePerformanceOptimizations'

/**
 * Effet de parallaxe pour l'arrière-plan
 */
export function ParallaxBackground() {
  const { scrollY } = useScroll()
  const { shouldAnimate } = useAdaptiveAnimations()
  
  const y1 = useTransform(scrollY, [0, 1000], [0, -200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -400])
  const y3 = useTransform(scrollY, [0, 1000], [0, -600])

  if (!shouldAnimate) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Layer 1 - Closest */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 opacity-30"
      >
        <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-mayssa-rose/20 rounded-full blur-3xl" />
        <div className="absolute top-[60%] right-[15%] w-80 h-80 bg-mayssa-caramel/20 rounded-full blur-3xl" />
      </motion.div>

      {/* Layer 2 - Middle */}
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 opacity-20"
      >
        <div className="absolute top-[40%] left-[30%] w-72 h-72 bg-mayssa-brown/10 rounded-full blur-2xl" />
        <div className="absolute bottom-[20%] right-[40%] w-64 h-64 bg-mayssa-soft/30 rounded-full blur-2xl" />
      </motion.div>

      {/* Layer 3 - Farthest */}
      <motion.div
        style={{ y: y3 }}
        className="absolute inset-0 opacity-10"
      >
        <div className="absolute top-[10%] right-[20%] w-48 h-48 bg-mayssa-caramel/15 rounded-full blur-xl" />
        <div className="absolute bottom-[40%] left-[20%] w-56 h-56 bg-mayssa-rose/15 rounded-full blur-xl" />
      </motion.div>
    </div>
  )
}

/**
 * Particules flottantes avec mouvement réaliste
 */
interface FloatingParticle {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  color: string
}

export function FloatingParticles({ density = 15 }: { density?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const { shouldAnimate } = useAdaptiveAnimations()
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!shouldAnimate || !containerRef.current) return

    // Initialize particles
    const newParticles: FloatingParticle[] = []
    for (let i = 0; i < density; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
        color: ['#f7b267', '#d4a574', '#e6c79c'][Math.floor(Math.random() * 3)]
      })
    }
    setParticles(newParticles)

    // Animation loop
    const animate = () => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y - particle.speed,
          x: particle.x + Math.sin(Date.now() * 0.001 + particle.id) * 0.5,
          // Reset particle when it goes off screen
          ...(particle.y < -10 ? {
            y: window.innerHeight + 10,
            x: Math.random() * window.innerWidth
          } : {})
        }))
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [shouldAnimate, density])

  if (!shouldAnimate) return null

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-0">
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
    </div>
  )
}

/**
 * Effet de vagues animées
 */
export function AnimatedWaves() {
  const { shouldAnimate } = useAdaptiveAnimations()

  if (!shouldAnimate) return null

  return (
    <div className="absolute bottom-0 left-0 w-full h-32 overflow-hidden">
      <svg
        className="absolute bottom-0 w-full h-full"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(247, 178, 103, 0.1)" />
            <stop offset="100%" stopColor="rgba(247, 178, 103, 0.3)" />
          </linearGradient>
        </defs>
        
        {/* Wave 1 */}
        <motion.path
          d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
          fill="url(#waveGradient)"
          initial={{ pathLength: 0 }}
          animate={{ 
            pathLength: 1,
            d: [
              "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z",
              "M0,80 C300,40 900,120 1200,80 L1200,120 L0,120 Z",
              "M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
            ]
          }}
          transition={{ 
            pathLength: { duration: 2 },
            d: { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        
        {/* Wave 2 */}
        <motion.path
          d="M0,80 C300,40 900,120 1200,80 L1200,120 L0,120 Z"
          fill="rgba(212, 165, 116, 0.2)"
          animate={{ 
            d: [
              "M0,80 C300,40 900,120 1200,80 L1200,120 L0,120 Z",
              "M0,100 C300,160 900,40 1200,100 L1200,120 L0,120 Z",
              "M0,80 C300,40 900,120 1200,80 L1200,120 L0,120 Z"
            ]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      </svg>
    </div>
  )
}

/**
 * Grille animée en arrière-plan
 */
export function AnimatedGrid() {
  const { shouldAnimate } = useAdaptiveAnimations()
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 500], [0.1, 0])

  if (!shouldAnimate) return null

  return (
    <motion.div 
      className="fixed inset-0 -z-10"
      style={{ opacity }}
    >
      <svg className="w-full h-full">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <motion.path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(139, 69, 19, 0.1)"
              strokeWidth="1"
              animate={{
                strokeDasharray: ["0 40", "20 20", "40 0", "20 20", "0 40"],
                transition: { duration: 4, repeat: Infinity, ease: "linear" }
              }}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </motion.div>
  )
}

/**
 * Effet de spotlight qui suit la souris
 */
export function MouseSpotlight() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { shouldAnimate } = useAdaptiveAnimations()

  useEffect(() => {
    if (!shouldAnimate) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [shouldAnimate])

  if (!shouldAnimate) return null

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(247, 178, 103, 0.1), transparent 40%)`
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
        transition: { duration: 3, repeat: Infinity }
      }}
    />
  )
}

/**
 * Constellation de points connectés
 */
interface ConstellationPoint {
  x: number
  y: number
  vx: number
  vy: number
}

export function Constellation({ pointCount = 50 }: { pointCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<ConstellationPoint[]>([])
  const animationRef = useRef<number | null>(null)
  const { shouldAnimate } = useAdaptiveAnimations()

  useEffect(() => {
    if (!shouldAnimate || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize points
    pointsRef.current = Array.from({ length: pointCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw points
      pointsRef.current.forEach(point => {
        // Update position
        point.x += point.vx
        point.y += point.vy

        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.vx *= -1
        if (point.y < 0 || point.y > canvas.height) point.vy *= -1

        // Draw point
        ctx.fillStyle = 'rgba(247, 178, 103, 0.6)'
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw connections
      pointsRef.current.forEach((point, i) => {
        pointsRef.current.slice(i + 1).forEach(otherPoint => {
          const distance = Math.sqrt(
            Math.pow(point.x - otherPoint.x, 2) + Math.pow(point.y - otherPoint.y, 2)
          )
          
          if (distance < 100) {
            ctx.strokeStyle = `rgba(247, 178, 103, ${0.3 * (1 - distance / 100)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(point.x, point.y)
            ctx.lineTo(otherPoint.x, otherPoint.y)
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [shouldAnimate, pointCount])

  if (!shouldAnimate) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  )
}

/**
 * Effet de breath/respiration pour les éléments
 */
interface BreathingProps {
  children: React.ReactNode
  intensity?: number
  duration?: number
  className?: string
}

export function Breathing({ 
  children, 
  intensity = 0.02, 
  duration = 4, 
  className = '' 
}: BreathingProps) {
  const { shouldAnimate } = useAdaptiveAnimations()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div 
      className={className}
      animate={{
        scale: [1, 1 + intensity, 1]
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "easeInOut" as const 
      }}
    >
      {children}
    </motion.div>
  )
}