import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ArrowDown } from 'lucide-react'
import type { CartItem } from '../types'
import { hapticFeedback } from '../lib/haptics'

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
    hapticFeedback('light')
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
            className="group flex items-center gap-4 rounded-2xl bg-mayssa-brown/90 backdrop-blur-xl text-mayssa-gold px-5 py-3 shadow-2xl shadow-[0_10px_40px_rgba(212,175,55,0.15)] hover:bg-mayssa-brown hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-mayssa-gold/30"
          >
            <div className="relative">
              <ShoppingBag size={20} className="drop-shadow-md" />
              <motion.span
                key={itemCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-gold text-[10px] font-bold text-mayssa-brown shadow-lg border border-mayssa-brown/20"
              >
                {itemCount}
              </motion.span>
            </div>

            <div className="flex flex-col items-start px-2">
              <span className="text-[10px] uppercase tracking-widest text-mayssa-gold/70 font-semibold mb-0.5">
                {itemCount} article{itemCount > 1 ? 's' : ''}
              </span>
              <span className="text-base font-display font-medium leading-none drop-shadow-sm">
                {total.toFixed(2).replace('.', ',')} €
              </span>
            </div>

            <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-mayssa-gold/30 to-transparent mx-1" />

            <div className="flex items-center gap-2 text-sm uppercase tracking-wider font-bold text-mayssa-gold/90 group-hover:text-mayssa-gold transition-colors pl-1">
              <span>Voir panier</span>
              <motion.div
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowDown size={14} className="stroke-[2.5px]" />
              </motion.div>
            </div>

            {/* Pulse when just added */}
            <AnimatePresence>
              {justAdded && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.15 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-2xl box-border border-[1.5px] border-mayssa-gold pointer-events-none"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
