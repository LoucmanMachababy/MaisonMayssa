import { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import { Plus, Check, ShoppingBag, Calendar, ChevronRight, Star, CalendarClock, Info } from 'lucide-react'
import type { Product } from '../../types'
import { useReviews } from '../../hooks/useReviews'
import { hapticFeedback } from '../../lib/haptics'
import { isPreorderNotYetAvailable } from '../../lib/utils'
import { ProductBadges } from '../ProductBadges'
import { BlurImage } from '../BlurImage'
import { StockBadge } from '../StockBadge'
import { formatDateLabel } from '../../lib/delivery'

interface SwipeableProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onTap?: (product: Product) => void
  onViewDetail?: (product: Product) => void
  stock?: number | null
  isPreorderDay?: boolean
  dayNames?: string
  preorderOpenDate?: string
  preorderOpenTime?: string
  /** LCP: charger l'image en priorité (premières cartes above-the-fold) */
  priority?: boolean
  /** Cadre coloré "Nouveau" pour mettre en avant un produit */
  highlightAsNew?: boolean
}

export function SwipeableProductCard({ product, onAdd, onTap, onViewDetail, stock = null, isPreorderDay = true, dayNames = '', preorderOpenDate, preorderOpenTime, priority = false, highlightAsNew = false }: SwipeableProductCardProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const addedTimeoutRef = useRef<number | null>(null)
  
  const x = useMotionValue(0)
  const springX = useSpring(x, { damping: 30, stiffness: 300 })
  
  const { getAverageRatingForProduct, getReviewCountForProduct } = useReviews()
  const isPreorderSoon = isPreorderNotYetAvailable(product)
  const showBientotDispo = product.preorder && !product.image
  const isTrompeLoeil = product.category === "Trompe l'œil"
  const isStockManaged = stock !== null
  const isUnavailable = isStockManaged && (stock <= 0 || (isTrompeLoeil && !isPreorderDay))
  const productRating = isTrompeLoeil ? getAverageRatingForProduct(product.id) : null
  const productReviewCount = isTrompeLoeil ? getReviewCountForProduct(product.id) : 0

  const openingBannerLabel = (() => {
    if (!isTrompeLoeil || !preorderOpenDate) return null
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    let closed = false
    if (preorderOpenDate > todayStr) {
      closed = true
    } else if (preorderOpenDate === todayStr) {
      const [h, m] = (preorderOpenTime ?? '00:00').split(':').map(Number)
      closed = now.getHours() * 60 + now.getMinutes() < (h ?? 0) * 60 + (m ?? 0)
    }
    if (!closed) return null
    const dateLabel = formatDateLabel(preorderOpenDate)
    return preorderOpenTime && preorderOpenTime !== '00:00'
      ? `Ouverture ${dateLabel} à ${preorderOpenTime}`
      : `Ouverture ${dateLabel}`
  })()

  // Enhanced transforms with better thresholds
  const background = useTransform(
    x,
    [-120, -60, 0, 60, 120],
    ['#f87171', '#f3f4f6', '#ffffff', '#f3f4f6', '#10b981']
  )

  const rightIconOpacity = useTransform(x, [30, 60, 120], [0, 0.7, 1])
  const rightIconScale = useTransform(x, [30, 60, 120], [0.7, 0.9, 1.1])
  const rightTextOpacity = useTransform(x, [60, 120], [0, 1])

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current)
      }
    }
  }, [])

  const handleDragStart = () => {
    setIsDragging(true)
    hapticFeedback('light')
  }

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = info.offset.x
    const newDirection = currentX > 30 ? 'right' : currentX < -30 ? 'left' : null
    
    if (newDirection !== swipeDirection) {
      setSwipeDirection(newDirection)
      if (newDirection && !isPreorderSoon && !isUnavailable) {
        hapticFeedback('light')
      }
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    setSwipeDirection(null)
    
    if (isPreorderSoon || isUnavailable) return

    const threshold = 100
    const velocity = info.velocity.x
    const offset = info.offset.x

    // Swipe right to add to cart (with velocity consideration)
    if (offset > threshold || (offset > 50 && velocity > 500)) {
      hapticFeedback('success')
      setIsAdded(true)
      onAdd(product)
      
      // Clear any existing timeout
      if (addedTimeoutRef.current) {
        clearTimeout(addedTimeoutRef.current)
      }
      
      addedTimeoutRef.current = window.setTimeout(() => setIsAdded(false), 2000)
    }
  }

  const handleTap = () => {
    // Only trigger tap if we weren't dragging significantly
    if (isDragging) return
    // Ne pas ajouter au panier si rupture de stock
    if (isUnavailable) return
    if (onTap) {
      hapticFeedback('light')
      onTap(product)
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-lg ${highlightAsNew ? 'ring-2 ring-amber-400/90 ring-offset-2 ring-offset-amber-50/80 shadow-amber-200/20' : ''}`}>
      {/* Enhanced background action indicators */}
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: background }}
      >
        {/* Right swipe indicator (Add to cart) */}
        <div className="absolute inset-0 flex items-center justify-end px-6">
          <motion.div
            style={{ opacity: rightIconOpacity, scale: rightIconScale }}
            className="flex items-center gap-3 text-white"
            animate={swipeDirection === 'right' ? { x: [-5, 0] } : {}}
            transition={{ duration: 0.2 }}
          >
            <div className="flex flex-col items-center">
              <Plus size={28} strokeWidth={2.5} />
              <motion.span 
                className="text-xs font-bold mt-1"
                style={{ opacity: rightTextOpacity }}
              >
                Ajouter
              </motion.span>
            </div>
            <ChevronRight size={20} className="opacity-60" />
          </motion.div>
        </div>

      </motion.div>

      {/* Enhanced swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: isPreorderSoon || isUnavailable ? 0 : 150 }}
        dragElastic={{ left: 0.1, right: 0.1 }}
        dragMomentum={false}
        whileDrag={{ 
          scale: 0.98,
          rotateZ: isDragging ? (swipeDirection === 'right' ? 1 : swipeDirection === 'left' ? -1 : 0) : 0
        }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        style={{ x: springX }}
        className={`relative backdrop-blur-md rounded-2xl p-4 shadow-xl border touch-pan-y cursor-pointer ${highlightAsNew ? 'bg-amber-50/95 border-amber-200/50' : 'bg-white/90 border-white/20'}`}
        animate={isAdded ? { 
          scale: [1, 1.02, 1],
          boxShadow: [
            "0 10px 25px -3px rgba(0, 0, 0, 0.1)",
            "0 20px 40px -3px rgba(16, 185, 129, 0.3)",
            "0 10px 25px -3px rgba(0, 0, 0, 0.1)"
          ]
        } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="flex gap-3">
          {/* Product image */}
          <div className={`relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden rounded-xl ${isTrompeLoeil ? 'border-2 border-mayssa-brown/20 bg-mayssa-brown/5 ring-1 ring-mayssa-brown/10' : 'bg-mayssa-cream/50'}`}>
            {product.badges?.length ? (
              <ProductBadges badges={product.badges} variant="compact" />
            ) : null}
            {product.image ? (
              <BlurImage
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
                priority={priority}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-mayssa-brown/40 text-[9px] font-bold uppercase">
                {showBientotDispo ? 'Bientôt' : null}
                <ShoppingBag size={20} className={showBientotDispo ? 'mt-0.5' : ''} />
              </div>
            )}

            {/* Enhanced added overlay */}
            {isAdded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                  className="bg-white/20 p-2 rounded-full mb-1"
                >
                  <Check size={24} className="text-white" strokeWidth={3} />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-white text-xs font-bold"
                >
                  Ajouté !
                </motion.span>
              </motion.div>
            )}
          </div>

          {/* Product info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-mayssa-brown truncate">{product.name}</h4>
            <p className="text-xs text-mayssa-brown/60 line-clamp-1">
              {product.description || 'Pâtisserie artisanale'}
            </p>
            {productRating != null && productReviewCount > 0 && (
              <div className="flex items-center gap-1 mt-0.5 text-mayssa-caramel">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <Star key={v} size={10} className={v <= Math.round(productRating) ? 'fill-current' : 'text-mayssa-brown/20'} />
                  ))}
                </div>
                <span className="text-[9px] font-semibold text-mayssa-brown/70">{productRating} ({productReviewCount})</span>
              </div>
            )}
            {isStockManaged && (
              <StockBadge stock={stock} isPreorderDay={isPreorderDay} dayNames={dayNames} compact isPreorderProduct={isTrompeLoeil} />
            )}
            {openingBannerLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <CalendarClock size={11} className="text-amber-500 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-amber-700 leading-tight">{openingBannerLabel}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between">
              {isPreorderSoon && product.preorder ? (
                <span className="text-[10px] text-mayssa-brown/70 leading-tight">
                  Récup. {(() => {
                    const now = new Date()
                    const day = now.getDay()
                    const daysUntil = day === 6 ? 4 : day === 3 ? 3 : 3
                    const pickup = new Date(now)
                    pickup.setDate(pickup.getDate() + daysUntil)
                    return pickup.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
                  })()}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-mayssa-brown/40 line-through">
                      {product.originalPrice.toFixed(2).replace('.', ',')} €
                    </span>
                  )}
                  <span className="text-lg font-display font-bold text-mayssa-caramel">
                    {product.price.toFixed(2).replace('.', ',')} €
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {onViewDetail && !isUnavailable && (
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      hapticFeedback('light')
                      onViewDetail(product)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-mayssa-brown/10 shadow-sm text-mayssa-brown/40 hover:text-mayssa-brown"
                    aria-label={`Voir les détails de ${product.name}`}
                  >
                    <Info size={16} />
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

        {/* Enhanced swipe hints */}
        {!isPreorderSoon && !isUnavailable && !isAdded && (
          <>
            {/* Right swipe hint */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 3, duration: 0.8 }}
              className="absolute bottom-2 right-3 text-[9px] text-mayssa-brown/50 flex items-center gap-1"
            >
              <span className="font-medium">Glisser →</span>
              <motion.div
                animate={{ x: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: 2, ease: "easeInOut" }}
                className="flex items-center"
              >
                <Plus size={12} />
              </motion.div>
            </motion.div>

          </>
        )}
      </motion.div>
    </div>
  )
}
