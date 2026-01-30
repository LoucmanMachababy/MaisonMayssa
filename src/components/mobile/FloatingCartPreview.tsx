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
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const handleClick = () => {
    hapticFeedback('medium')
    onExpand()
  }

  return (
    <AnimatePresence>
      {items.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
        >
          <motion.button
            onClick={handleClick}
            className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-mayssa-brown text-mayssa-cream shadow-2xl shadow-mayssa-brown/30 cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag size={24} />
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-caramel text-[10px] font-bold"
                >
                  {itemCount}
                </motion.span>
              </div>

              <div className="text-left">
                <p className="text-xs opacity-80">
                  {itemCount} article{itemCount > 1 ? 's' : ''}
                </p>
                <p className="text-lg font-bold">
                  {total.toFixed(2).replace('.', ',')} €
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Voir le panier</span>
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronUp size={20} />
              </motion.div>
            </div>
          </motion.button>

          {/* Last added item preview */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-xs text-mayssa-brown">
                <span className="font-semibold truncate max-w-[150px]">
                  {items[items.length - 1]?.product.name}
                </span>
                <span className="text-mayssa-caramel">ajouté ✓</span>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
