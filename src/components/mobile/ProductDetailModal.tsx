import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, ZoomIn, ZoomOut, Heart } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import type { Product, ProductSize } from '../../types'
import { ProductBadges } from '../ProductBadges'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAdd: (product: Product) => void
  isFavorite?: (productId: string) => boolean
  onToggleFavorite?: (product: Product) => void
}

export function ProductDetailModal({ product, onClose, onAdd, isFavorite, onToggleFavorite }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const isLiked = product ? (isFavorite ? isFavorite(product.id) : false) : false
  const imageRef = useRef<HTMLDivElement>(null)

  // Reset selected size when product changes
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0])
    } else {
      setSelectedSize(null)
    }
    setQuantity(1)
  }, [product])

  // Pinch-to-zoom
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Get the current price based on selection
  const currentPrice = selectedSize ? selectedSize.price : product?.price || 0

  const handleAdd = () => {
    if (!product) return
    hapticFeedback('success')

    // If product has sizes and one is selected, create a modified product
    let productToAdd = product
    if (selectedSize && product.sizes && product.sizes.length > 0) {
      productToAdd = {
        ...product,
        id: `${product.id}-${selectedSize.ml}`,
        name: `${product.name} (${selectedSize.label})`,
        price: selectedSize.price,
      }
    }

    for (let i = 0; i < quantity; i++) {
      onAdd(productToAdd)
    }
    setQuantity(1)
    onClose()
  }

  const handleDoubleTap = () => {
    if (product && onToggleFavorite && !isLiked) {
      onToggleFavorite(product)
      hapticFeedback('medium')
    }
  }

  const handleHeartClick = () => {
    if (product && onToggleFavorite) {
      onToggleFavorite(product)
      hapticFeedback('medium')
    }
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
    hapticFeedback('light')
    if (isZoomed) {
      scale.set(1)
      x.set(0)
      y.set(0)
    } else {
      scale.set(2)
    }
  }

  if (!product) return null

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black md:hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => { hapticFeedback('light'); onClose() }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex gap-2">
              {onToggleFavorite && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleHeartClick}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm cursor-pointer"
                >
                  <Heart
                    size={20}
                    className={isLiked ? 'text-red-500 fill-red-500' : 'text-white'}
                  />
                </motion.button>
              )}
              <button
                onClick={toggleZoom}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white cursor-pointer"
              >
                {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </button>
            </div>
          </div>

          {/* Image with zoom */}
          <motion.div
            ref={imageRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            onDoubleClick={handleDoubleTap}
          >
            {product.image ? (
              <motion.img
                src={product.image}
                alt={product.name}
                style={{ scale, x, y }}
                drag={isZoomed}
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-mayssa-cream/10">
                <ShoppingBag size={80} className="text-white/20" />
              </div>
            )}

            {/* Like animation */}
            <AnimatePresence>
              {isLiked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.4 }}
                  >
                    <Heart size={100} className="text-red-500 fill-red-500 drop-shadow-2xl" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Product info panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Category & badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-mayssa-caramel/10 text-mayssa-caramel text-[10px] font-bold uppercase tracking-wider">
                {product.category}
              </span>
              {product.badges?.length ? (
                <ProductBadges badges={product.badges} variant="inline" />
              ) : null}
            </div>

            {/* Name & Price */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-xl font-display font-bold text-mayssa-brown">
                {product.name}
              </h2>
              <span className="text-2xl font-bold text-mayssa-caramel whitespace-nowrap">
                {currentPrice.toFixed(2).replace('.', ',')} €
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-mayssa-brown/70 leading-relaxed mb-4">
              {product.description || "Pâtisserie artisanale préparée avec amour chez Maison Mayssa. Ingrédients frais et de qualité."}
            </p>

            {/* Sizes if available */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-mayssa-brown/60 mb-2">Choisir une taille</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize?.ml === size.ml
                    return (
                      <motion.button
                        key={size.ml}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedSize(size)
                          hapticFeedback('light')
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-mayssa-brown text-mayssa-cream shadow-lg'
                            : 'bg-mayssa-cream text-mayssa-brown hover:bg-mayssa-brown/10'
                        }`}
                      >
                        {size.label} - {size.price.toFixed(2).replace('.', ',')}€
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity & Add button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-mayssa-cream rounded-xl px-3 py-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (quantity > 1) {
                      setQuantity(q => q - 1)
                      hapticFeedback('light')
                    }
                  }}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-mayssa-brown disabled:opacity-40 cursor-pointer"
                >
                  <Minus size={16} />
                </motion.button>
                <span className="w-8 text-center font-bold text-lg text-mayssa-brown">
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setQuantity(q => q + 1)
                    hapticFeedback('light')
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-mayssa-brown text-mayssa-cream cursor-pointer"
                >
                  <Plus size={16} />
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-mayssa-brown text-mayssa-cream font-bold shadow-xl cursor-pointer"
              >
                <ShoppingBag size={18} />
                <span>Ajouter • {(currentPrice * quantity).toFixed(2).replace('.', ',')} €</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
