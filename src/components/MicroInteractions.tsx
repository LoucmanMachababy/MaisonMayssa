import { motion, useAnimation, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useAdaptiveAnimations } from '../hooks/usePerformanceOptimizations'

/**
 * Animation de révélation au scroll
 */
interface ScrollRevealProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  distance?: number
  className?: string
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 30,
  className = ''
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const { getAnimationProps } = useAdaptiveAnimations()

  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance }
  }

  const animationProps = getAnimationProps({
    initial: { opacity: 0, ...directions[direction] },
    animate: isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] },
    transition: { duration, delay, ease: "easeOut" }
  })

  return (
    <motion.div ref={ref} className={className} {...animationProps}>
      {children}
    </motion.div>
  )
}

/**
 * Effet de parallaxe subtil
 */
interface ParallaxProps {
  children: React.ReactNode
  offset?: number
  className?: string
}

export function Parallax({ children, offset = 50, className = '' }: ParallaxProps) {
  const { shouldAnimate } = useAdaptiveAnimations()
  
  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{
        y: offset,
        transition: { duration: 0.8, ease: "easeOut" }
      }}
      viewport={{ once: false, amount: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Effet de hover magnétique
 */
interface MagneticHoverProps {
  children: React.ReactNode
  className?: string
}

export function MagneticHover({ children, className = '' }: MagneticHoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const { shouldAnimate } = useAdaptiveAnimations()

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return

    const element = ref.current
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) * 0.1
      const deltaY = (e.clientY - centerY) * 0.1
      
      setMousePosition({ x: deltaX, y: deltaY })
    }

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => {
      setIsHovered(false)
      setMousePosition({ x: 0, y: 0 })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [shouldAnimate])

  return (
    <motion.div
      ref={ref}
      className={className}
      animate={{
        x: isHovered ? mousePosition.x : 0,
        y: isHovered ? mousePosition.y : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Effet de morphing au hover
 */
interface MorphHoverProps {
  children: React.ReactNode
  scale?: number
  rotate?: number
  skew?: number
  className?: string
}

export function MorphHover({ 
  children, 
  scale = 1.05, 
  rotate = 0, 
  skew = 0, 
  className = '' 
}: MorphHoverProps) {
  const { getAnimationProps } = useAdaptiveAnimations()

  const hoverProps = getAnimationProps({
    whileHover: { 
      scale, 
      rotate, 
      skewX: skew,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    whileTap: { 
      scale: scale * 0.95,
      transition: { duration: 0.1 }
    }
  })

  return (
    <motion.div className={className} {...hoverProps}>
      {children}
    </motion.div>
  )
}

/**
 * Effet de typing/typewriter
 */
interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  cursor?: boolean
}

export function Typewriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = '', 
  cursor = true 
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const startTimer = setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          setCurrentIndex(prev => prev + 1)
        } else {
          clearInterval(typingInterval)
        }
      }, speed)

      return () => clearInterval(typingInterval)
    }, delay)

    return () => clearTimeout(startTimer)
  }, [text, speed, delay, currentIndex])

  useEffect(() => {
    if (cursor) {
      const cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev)
      }, 500)

      return () => clearInterval(cursorInterval)
    }
  }, [cursor])

  return (
    <span className={className}>
      {displayedText}
      {cursor && <span className={showCursor ? 'opacity-100' : 'opacity-0'}>|</span>}
    </span>
  )
}

/**
 * Particules flottantes en arrière-plan
 */
export function FloatingParticles({ count = 6 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => i)
  const { shouldAnimate } = useAdaptiveAnimations()

  if (!shouldAnimate) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-2 h-2 bg-mayssa-caramel/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            delay: particle * 2,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Effet de glitch subtil
 */
interface GlitchProps {
  children: React.ReactNode
  intensity?: 'low' | 'medium' | 'high'
  trigger?: boolean
  className?: string
}

export function Glitch({ children, intensity = 'low', trigger = false, className = '' }: GlitchProps) {
  const { shouldAnimate } = useAdaptiveAnimations()

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>
  }

  const intensityMap = {
    low: { x: [-1, 1, -1, 0], duration: 0.2 },
    medium: { x: [-2, 2, -2, 0], duration: 0.3 },
    high: { x: [-4, 4, -4, 0], duration: 0.4 }
  }

  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: intensityMap[intensity].x,
        transition: {
          duration: intensityMap[intensity].duration,
          repeat: 2,
          ease: "easeInOut"
        }
      } : {}}
    >
      {children}
    </motion.div>
  )
}

/**
 * Effet de compteur animé
 */
interface CounterProps {
  from: number
  to: number
  duration?: number
  delay?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({ 
  from, 
  to, 
  duration = 2, 
  delay = 0, 
  className = '', 
  suffix = '', 
  prefix = '' 
}: CounterProps) {
  const [count, setCount] = useState(from)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const startTimer = setTimeout(() => {
      const startTime = Date.now()
      const startValue = from
      const endValue = to
      const totalDuration = duration * 1000

      const updateCount = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)
        
        // Ease out function
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        
        const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress)
        setCount(currentValue)

        if (progress < 1) {
          requestAnimationFrame(updateCount)
        }
      }

      requestAnimationFrame(updateCount)
    }, delay * 1000)

    return () => clearTimeout(startTimer)
  }, [from, to, duration, delay, isInView])

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}

/**
 * Effet de pulsation subtile
 */
interface PulseProps {
  children: React.ReactNode
  intensity?: number
  speed?: number
  className?: string
}

export function Pulse({ children, intensity = 0.05, speed = 2, className = '' }: PulseProps) {
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
        duration: speed, 
        repeat: Infinity, 
        ease: "easeInOut" as const 
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Effet de shimmer/brillance
 */
interface ShimmerProps {
  children: React.ReactNode
  className?: string
}

export function Shimmer({ children, className = '' }: ShimmerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      />
    </div>
  )
}

/**
 * Hook pour créer des animations en chaîne
 */
export function useStaggerAnimation(stagger: number = 0.1) {
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      controls.start((i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * stagger, duration: 0.6, ease: "easeOut" }
      }))
    }
  }, [isInView, controls, stagger])

  return { ref, controls }
}