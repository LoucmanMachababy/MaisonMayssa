import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'

interface RippleItem {
  id: number
  x: number
  y: number
  size: number
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  rippleColor?: string
}

export function RippleButton({
  children,
  className,
  rippleColor = 'rgba(255, 255, 255, 0.4)',
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleItem[]>([])

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple: RippleItem = {
      id: Date.now(),
      x,
      y,
      size,
    }

    setRipples((prev) => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)

    onClick?.(e)
  }, [onClick])

  return (
    <button
      {...props}
      onClick={handleClick}
      className={cn('relative overflow-hidden', className)}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: rippleColor,
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </button>
  )
}

// Hook for adding ripple effect to any element
export function useRipple(color: string = 'rgba(255, 255, 255, 0.4)') {
  const [ripples, setRipples] = useState<RippleItem[]>([])

  const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2

    let x: number, y: number

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left - size / 2
      y = e.touches[0].clientY - rect.top - size / 2
    } else {
      x = e.clientX - rect.left - size / 2
      y = e.clientY - rect.top - size / 2
    }

    const newRipple: RippleItem = {
      id: Date.now(),
      x,
      y,
      size,
    }

    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
    }, 600)
  }, [])

  const RippleContainer = useCallback(() => (
    <AnimatePresence>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            borderRadius: '50%',
            backgroundColor: color,
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  ), [ripples, color])

  return { createRipple, RippleContainer }
}
