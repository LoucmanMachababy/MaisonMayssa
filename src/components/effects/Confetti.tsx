import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
  shape: 'circle' | 'square' | 'triangle'
}

const COLORS = [
  '#C79060', // mayssa-caramel
  '#5C4033', // mayssa-brown
  '#F5E6D3', // mayssa-cream
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // teal
]

const SHAPES = ['circle', 'square', 'triangle'] as const

interface ConfettiProps {
  trigger: number // increment to trigger confetti
  originX?: number
  originY?: number
}

export function Confetti({ trigger, originX = 50, originY = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (trigger === 0) return

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i,
      x: originX + (Math.random() - 0.5) * 20,
      y: originY,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }))

    setPieces(newPieces)

    // Clean up after animation
    const timeout = setTimeout(() => {
      setPieces([])
    }, 3000)

    return () => clearTimeout(timeout)
  }, [trigger, originX, originY])

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
            }}
            initial={{
              opacity: 1,
              scale: 0,
              x: 0,
              y: 0,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0, 1, 0.5],
              x: (Math.random() - 0.5) * 400,
              y: [0, -100, 300],
              rotate: piece.rotation + Math.random() * 720,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2 + Math.random(),
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <ConfettiShape shape={piece.shape} color={piece.color} size={piece.size} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function ConfettiShape({ shape, color, size }: { shape: string; color: string; size: number }) {
  if (shape === 'circle') {
    return (
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    )
  }

  if (shape === 'square') {
    return (
      <div
        className="rounded-sm"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      />
    )
  }

  // Triangle
  return (
    <div
      style={{
        width: 0,
        height: 0,
        borderLeft: `${size / 2}px solid transparent`,
        borderRight: `${size / 2}px solid transparent`,
        borderBottom: `${size}px solid ${color}`,
      }}
    />
  )
}

// Hook to use confetti
export function useConfetti() {
  const [trigger, setTrigger] = useState(0)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })

  const fire = useCallback((x?: number, y?: number) => {
    if (x !== undefined && y !== undefined) {
      // Convert to percentage
      setOrigin({
        x: (x / window.innerWidth) * 100,
        y: (y / window.innerHeight) * 100,
      })
    }
    setTrigger((t) => t + 1)
  }, [])

  return { trigger, origin, fire }
}
