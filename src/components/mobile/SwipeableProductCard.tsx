import { useState } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Plus, Check, ShoppingBag, Heart, Calendar } from 'lucide-react'
import type { Product } from '../../types'
import { hapticFeedback } from '../../lib/haptics'
import { isPreorderNotYetAvailable } from '../../lib/utils'
import { ProductBadges } from '../ProductBadges'
import { BlurImage } from '../BlurImage'
import { ShareButton } from '../ShareButton'
import { StockBadge } from '../StockBadge'

interface SwipeableProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onTap?: (product: Product) => void
  isFavorite?: boolean
  onToggleFavorite?: (product: Product) => void
  stock?: number | null
  isPreorderDay?: boolean
  dayNames?: string
}

export function SwipeableProductCard({ product, onAdd, onTap, isFavorite = false, onToggleFavorite, stock = null, isPreorderDay = true, dayNames = '' }: SwipeableProductCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  const isPreorderSoon = isPreorderNotYetAvailable(product)
  const showBientotDispo = product.preorder && !product.image
  const isStockManaged = stock !== null
  const isUnavailable = isStockManaged && (!isPreorderDay || stock <= 0)

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
    if (isPreorderSoon || isUnavailable) return
    // Swipe right to add
    if (info.offset.x > 80) {
      hapticFeedback('success')
      setIsAdded(true)
      onAdd(product)
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
              <BlurImage
                src={product.image}
                alt={product.name}
                className="w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-mayssa-brown/40 text-[9px] font-bold uppercase">
                {showBientotDispo ? 'Bientôt' : null}
                <ShoppingBag size={20} className={showBientotDispo ? 'mt-0.5' : ''} />
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
            {isStockManaged && (
              <StockBadge stock={stock} isPreorderDay={isPreorderDay} dayNames={dayNames} compact />
            )}
            <div className="mt-1 flex items-center justify-between">
              {isPreorderSoon && product.preorder ? (
                <span className="text-[10px] text-mayssa-brown/70 leading-tight">
                  Préco. dès 14/02 • Récup. sous {product.preorder.daysToPickup} j
                </span>
              ) : (
                <span className="text-lg font-display font-bold text-mayssa-caramel">
                  {product.price.toFixed(2).replace('.', ',')} €
                </span>
              )}

              <div className="flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton
                    product={product}
                    variant="icon"
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-mayssa-brown/10 shadow-sm text-mayssa-brown/40 hover:text-mayssa-brown"
                  />
                </div>

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

                {(isPreorderSoon || isUnavailable) ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mayssa-brown/30 text-mayssa-brown/50" title={isPreorderSoon ? 'Disponible à partir du 14 février' : !isPreorderDay ? `Dispo ${dayNames}` : 'Rupture de stock'}>
                    <Calendar size={16} />
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Swipe hint (masqué pour précommandes et indisponibles) */}
        {!isPreorderSoon && !isUnavailable && (
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
        )}
      </motion.div>
    </div>
  )
}
