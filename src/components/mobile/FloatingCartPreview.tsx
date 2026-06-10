import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, ChevronUp } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import type { CartItem } from '../../types'

interface FloatingCartPreviewProps {
  items: CartItem[]
  total: number
  onExpand: () => void
}

export function FloatingCartPreview({ items, total, onExpand }: FloatingCartPreviewProps) {
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    if (items.length === 0) return
    const latest = items[items.length - 1]
    setLastAdded(latest.product.name)
    const t = setTimeout(() => setLastAdded(null), 3000)
    return () => clearTimeout(t)
  }, [items.length, items])

  const handleClick = () => {
    hapticFeedback('light')
    onExpand()
  }

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 md:hidden"
        >
          <motion.button
            type="button"
            onClick={handleClick}
            className="cart-float-bar w-full cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 text-left">
              <div className="relative">
                <ShoppingBag size={22} className="text-mayssa-gold" strokeWidth={1.5} />
                <span className="cart-float-bar-badge">
                  {itemCount}
                </span>
              </div>
              <div>
                <p className="cart-float-bar-eyebrow">
                  {itemCount} article{itemCount > 1 ? 's' : ''}
                </p>
                <p className="cart-float-bar-total">
                  {total.toFixed(2).replace('.', ',')} €
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-mayssa-gold">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Panier</span>
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronUp size={18} />
              </motion.div>
            </div>
          </motion.button>

          <AnimatePresence>
            {lastAdded && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 text-center text-[10px] text-mayssa-brown/55 truncate px-2"
              >
                Ajouté : {lastAdded}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
