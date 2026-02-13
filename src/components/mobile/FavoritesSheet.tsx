import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X, Heart, ShoppingBag, Plus, Trash2 } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import type { Product } from '../../types'

interface FavoritesSheetProps {
  isOpen: boolean
  onClose: () => void
  favorites: Product[]
  onRemove: (productId: string) => void
  onAddToCart: (product: Product) => void
  onClear: () => void
}

export function FavoritesSheet({
  isOpen,
  onClose,
  favorites,
  onRemove,
  onAddToCart,
  onClear,
}: FavoritesSheetProps) {
  const dragControls = useDragControls()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (info.velocity.y > 500 || info.offset.y > 200) {
      hapticFeedback('light')
      onClose()
    }
  }

  const handleAddToCart = (product: Product) => {
    hapticFeedback('success')
    onAddToCart(product)
  }

  const handleRemove = (productId: string) => {
    hapticFeedback('medium')
    onRemove(productId)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 h-[85vh] rounded-t-3xl bg-mayssa-cream shadow-2xl md:hidden flex flex-col"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 rounded-full bg-mayssa-brown/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-mayssa-brown/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Heart size={20} className="text-red-500 fill-red-500" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-mayssa-caramel text-[9px] font-bold text-white">
                      {favorites.length}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-lg text-mayssa-brown">Mes Favoris</h2>
              </div>
              <div className="flex items-center gap-2">
                {favorites.length > 0 && (
                  <button
                    onClick={() => {
                      hapticFeedback('warning')
                      onClear()
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    Vider
                  </button>
                )}
                <button
                  onClick={() => { hapticFeedback('light'); onClose() }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-mayssa-brown/5 text-mayssa-brown/60 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-4"
                  >
                    <Heart size={40} className="text-red-200" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-mayssa-brown mb-2">
                    Aucun favori
                  </h3>
                  <p className="text-sm text-mayssa-brown/60 max-w-[200px]">
                    Double-tape sur un produit pour l'ajouter à tes favoris
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {favorites.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative rounded-2xl bg-white shadow-md overflow-hidden"
                    >
                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm cursor-pointer"
                      >
                        <Heart size={14} className="text-red-500 fill-red-500" />
                      </button>

                      {/* Product image */}
                      <div className="aspect-square bg-mayssa-cream/50">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <ShoppingBag size={32} className="text-mayssa-brown/20" />
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-3">
                        <h4 className="font-bold text-sm text-mayssa-brown truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-mayssa-brown/50 truncate mb-2">
                          {product.category}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-mayssa-caramel">
                              {product.price.toFixed(2).replace('.', ',')} €
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm font-bold text-mayssa-brown/50 line-through">
                                {product.originalPrice.toFixed(2).replace('.', ',')} €
                              </span>
                            )}
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddToCart(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-mayssa-brown text-mayssa-cream cursor-pointer"
                          >
                            <Plus size={16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Add all to cart */}
            {favorites.length > 0 && (
              <div className="flex-shrink-0 border-t border-mayssa-brown/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/50 backdrop-blur-sm">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    hapticFeedback('success')
                    favorites.forEach(p => onAddToCart(p))
                    onClose()
                  }}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-xl cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  <span>Ajouter tous au panier ({favorites.length})</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
