import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { hapticFeedback } from '../../lib/haptics'
import type { ProductCategory } from '../../types'

interface StickyCategoryTabsProps {
  categories: readonly (ProductCategory | 'Tous')[]
  activeCategory: ProductCategory | 'Tous'
  onCategoryChange: (category: ProductCategory | 'Tous') => void
}

export function StickyCategoryTabs({
  categories,
  activeCategory,
  onCategoryChange
}: StickyCategoryTabsProps) {
  const [isSticky, setIsSticky] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-1px 0px 0px 0px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const handleSelect = (category: ProductCategory | 'Tous') => {
    hapticFeedback('light')
    onCategoryChange(category)
  }

  return (
    <>
      {/* Sentinel for detecting scroll position */}
      <div ref={sentinelRef} className="h-0 md:hidden" />

      {/* Sticky container */}
      <motion.div
        ref={containerRef}
        initial={false}
        animate={{
          backgroundColor: isSticky ? 'rgba(255, 253, 250, 0.95)' : 'transparent',
          boxShadow: isSticky ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
        }}
        className={`md:hidden sticky top-0 z-30 -mx-4 px-4 py-3 transition-all duration-200 ${isSticky ? 'backdrop-blur-lg' : ''}`}
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(category)}
              className={`relative whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                activeCategory === category
                  ? 'text-mayssa-cream'
                  : 'bg-white/80 text-mayssa-brown'
              }`}
            >
              {/* Active background */}
              {activeCategory === category && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-mayssa-brown rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{category}</span>
            </motion.button>
          ))}
        </div>

        {/* Progress indicator when sticky */}
        {isSticky && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-mayssa-caramel via-mayssa-rose to-mayssa-caramel origin-left"
          />
        )}
      </motion.div>
    </>
  )
}
