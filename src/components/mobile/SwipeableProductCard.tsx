import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Plus, Check, ShoppingBag, Heart } from 'lucide-react'
import type { Product } from '../../types'
import { hapticFeedback } from '../../lib/haptics'
import { ProductBadges } from '../ProductBadges'

interface SwipeableProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onTap?: (product: Product) => void
  isFavorite?: boolean
  onToggleFavorite?: (product: Product) => void
}

export function SwipeableProductCard({ product, onAdd, onTap, isFavorite = false, onToggleFavorite }: SwipeableProductCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)

  // Transform for the background reveal
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['#ef4444', '#ffffff', '#22c55e']
  )

  const rightIconOpacity = useTransform(x, [0, 50, 100], [0, 0.5, 1])
  const rightIconScale = useTransform(x, [0, 50, 100], [0.5, 0.8, 1])

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    // Swipe right to add
    if (info.offset.x > 80) {
      hapticFeedback('success')
      setIsAdded(true)
      onAdd(product)

      // Reset after animation
      setTimeout(() => setIsAdded(false), 1500)
    }
  }

  const handleTap = () => {
    // Only trigger tap if we weren't dragging
    if (!isDragging && onTap) {
      hapticFeedback('light')
      onTap(product)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Background action indicator */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end px-6"
        style={{ backgroundColor: background }}
      >
        <motion.div
          style={{ opacity: rightIconOpacity, scale: rightIconScale }}
          className="flex items-center gap-2 text-white"
        >
          <Plus size={24} />
          <span className="font-bold">Ajouter</span>
        </motion.div>
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        style={{ x }}
        className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-3 shadow-lg touch-pan-y cursor-pointer"
      >
        <div className="flex gap-3">
          {/* Product image */}
          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl bg-mayssa-cream/50">
            {product.badges?.length ? (
              <ProductBadges badges={product.badges} variant="compact" />
            ) : null}
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ShoppingBag size={24} className="text-mayssa-brown/20" />
              </div>
            )}

            {/* Added overlay */}
            {isAdded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/90"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Check size={32} className="text-white" />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-mayssa-brown truncate">{product.name}</h4>
            <p className="text-xs text-mayssa-brown/60 line-clamp-1">
              {product.description || 'Pâtisserie artisanale'}
            </p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-lg font-display font-bold text-mayssa-caramel">
                {product.price.toFixed(2).replace('.', ',')} €
              </span>

              <div className="flex items-center gap-2">
                {/* Favorite button */}
                {onToggleFavorite && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      hapticFeedback('medium')
                      onToggleFavorite(product)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-mayssa-brown/10 shadow-sm"
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart
                      size={16}
                      className={`transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-mayssa-brown/40'}`}
                    />
                  </motion.button>
                )}

                {/* Quick add button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    hapticFeedback('medium')
                    setIsAdded(true)
                    onAdd(product)
                    setTimeout(() => setIsAdded(false), 1500)
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-mayssa-brown text-mayssa-cream"
                >
                  {isAdded ? <Check size={16} /> : <Plus size={16} />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Swipe hint */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-1 right-3 text-[9px] text-mayssa-brown/40 flex items-center gap-1"
        >
          <span>Glisser pour ajouter</span>
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1, repeat: 3 }}
          >
            →
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  )
}
