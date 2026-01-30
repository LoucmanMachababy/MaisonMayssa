import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  strength?: number
  onClick?: () => void
  href?: string
  target?: string
  rel?: string
  as?: 'button' | 'a'
}

export function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  onClick,
  href,
  target,
  rel,
  as = 'button',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY

    setPosition({
      x: distanceX * strength,
      y: distanceY * strength,
    })
  }

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 })
  }

  const Component = as === 'a' ? 'a' : 'button'
  const linkProps = as === 'a' ? { href, target, rel } : {}

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      <Component onClick={onClick} className={className} {...linkProps}>
        <motion.span
          className="block"
          animate={{ x: position.x * 0.3, y: position.y * 0.3 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
        >
          {children}
        </motion.span>
      </Component>
    </motion.div>
  )
}
