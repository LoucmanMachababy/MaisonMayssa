import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const pullDistance = useMotionValue(0)

  const THRESHOLD = 80
  const MAX_PULL = 120

  const opacity = useTransform(pullDistance, [0, THRESHOLD], [0, 1])
  const scale = useTransform(pullDistance, [0, THRESHOLD], [0.5, 1])
  const rotate = useTransform(pullDistance, [0, THRESHOLD, MAX_PULL], [0, 180, 360])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY
    }
  }, [isRefreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return
    if (containerRef.current && containerRef.current.scrollTop > 0) return

    const currentY = e.touches[0].clientY
    const diff = currentY - startY.current

    if (diff > 0) {
      const dampedDiff = Math.min(diff * 0.5, MAX_PULL)
      pullDistance.set(dampedDiff)

      if (dampedDiff >= THRESHOLD) {
        hapticFeedback('light')
      }
    }
  }, [isRefreshing, pullDistance])

  const handleTouchEnd = useCallback(async () => {
    if (isRefreshing) return

    const currentPull = pullDistance.get()

    if (currentPull >= THRESHOLD) {
      setIsRefreshing(true)
      hapticFeedback('medium')

      // Keep the indicator visible during refresh
      await animate(pullDistance, THRESHOLD, { duration: 0.2 })

      try {
        await onRefresh()
      } finally {
        hapticFeedback('success')
        setIsRefreshing(false)
        await animate(pullDistance, 0, { duration: 0.3 })
      }
    } else {
      await animate(pullDistance, 0, { duration: 0.3 })
    }

    startY.current = 0
  }, [isRefreshing, onRefresh, pullDistance])

  return (
    <div className="relative md:hidden">
      {/* Pull indicator */}
      <motion.div
        style={{
          height: pullDistance,
          opacity
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-mayssa-caramel/10 to-transparent z-10"
      >
        <motion.div
          style={{ scale, rotate }}
          className={`flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={20} className="text-mayssa-caramel" />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        style={{ y: pullDistance }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  )
}
