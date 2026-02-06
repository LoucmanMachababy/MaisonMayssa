import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ArrowDown } from 'lucide-react'
import type { CartItem } from '../types'

interface FloatingCartBarProps {
  items: CartItem[]
  total: number
}

export function FloatingCartBar({ items, total }: FloatingCartBarProps) {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [isCartVisible, setIsCartVisible] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const prevCountRef = useRef(itemCount)

  // Detect when cart section is visible
  useEffect(() => {
    const cartSection = document.getElementById('commande')
    if (!cartSection) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsCartVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(cartSection)
    return () => observer.disconnect()
  }, [])

  // Flash when a new item is added
  useEffect(() => {
    if (itemCount > prevCountRef.current) {
      setJustAdded(true)
      const timer = setTimeout(() => setJustAdded(false), 1500)
      return () => clearTimeout(timer)
    }
    prevCountRef.current = itemCount
  }, [itemCount])

  const scrollToCart = () => {
    document.getElementById('commande')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const show = items.length > 0 && !isCartVisible

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-40 hidden md:block"
        >
          <motion.button
            onClick={scrollToCart}
            animate={justAdded ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 rounded-2xl bg-mayssa-brown/95 backdrop-blur-md text-mayssa-cream px-5 py-3 shadow-2xl shadow-mayssa-brown/30 hover:bg-mayssa-brown hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-white/10"
          >
            <div className="relative">
              <ShoppingBag size={20} />
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-caramel text-[10px] font-bold text-white shadow-lg"
              >
                {itemCount}
              </motion.span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">
                  {itemCount} article{itemCount > 1 ? 's' : ''}
                </p>
                <p className="text-base font-bold leading-tight">
                  {total.toFixed(2).replace('.', ',')} €
                </p>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span>Voir la commande</span>
                <motion.div
                  animate={{ y: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowDown size={16} />
                </motion.div>
              </div>
            </div>

            {/* Pulse when just added */}
            <AnimatePresence>
              {justAdded && (
                <motion.div
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 rounded-2xl border-2 border-mayssa-caramel pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
