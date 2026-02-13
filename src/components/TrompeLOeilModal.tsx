import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Clock } from 'lucide-react'
import type { Product } from '../types'
import { BlurImage } from './BlurImage'

interface TrompeLOeilModalProps {
  product: Product | null
  stock: number | null
  onClose: () => void
  onConfirm: (product: Product, quantity: number) => void
}

export function TrompeLOeilModal({ product, stock, onClose, onConfirm }: TrompeLOeilModalProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const maxQty = stock !== null ? Math.min(stock, 20) : 20
  const totalPrice = product.price * quantity

  const handleConfirm = () => {
    onConfirm(product, quantity)
    setQuantity(1)
  }

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 bottom-4 top-auto sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[71] bg-white rounded-3xl shadow-2xl overflow-hidden max-w-md w-full"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-mayssa-brown cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Image */}
            {product.image && (
              <div className="relative h-48 sm:h-56 overflow-hidden bg-mayssa-cream/50">
                <BlurImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white to-transparent" />
              </div>
            )}

            <div className="p-5 space-y-4">
              {/* Info produit */}
              <div>
                <h3 className="text-lg font-display font-bold text-mayssa-brown">{product.name}</h3>
                <p className="text-xs text-mayssa-brown/60 mt-1 line-clamp-2">{product.description}</p>
              </div>

              {/* Prix unitaire */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-mayssa-brown/60">
                  {product.originalPrice ? 'Prix promo' : 'Prix unitaire'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-mayssa-caramel">{product.price.toFixed(2).replace('.', ',')} €</span>
                  {product.originalPrice && (
                    <span className="text-sm font-bold text-mayssa-brown/50 line-through">
                      {product.originalPrice.toFixed(2).replace('.', ',')} €
                    </span>
                  )}
                </div>
              </div>

              {/* Délai */}
              <div className="flex items-center gap-2 bg-mayssa-caramel/10 rounded-xl px-3 py-2">
                <Clock size={14} className="text-mayssa-caramel flex-shrink-0" />
                <span className="text-xs text-mayssa-brown font-medium">
                  Précommande — à récupérer sous {product.preorder?.daysToPickup ?? 3} jours
                </span>
              </div>

              {/* Stock */}
              {stock !== null && (
                <p className={`text-xs font-bold ${stock <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {stock} disponible{stock > 1 ? 's' : ''}
                </p>
              )}

              {/* Quantité */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-mayssa-brown">Quantité</span>
                <div className="flex items-center gap-3 bg-mayssa-cream rounded-xl px-3 py-2">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-mayssa-brown disabled:opacity-30 cursor-pointer"
                  >
                    <Minus size={16} />
                  </motion.button>
                  <span className="w-8 text-center font-bold text-lg text-mayssa-brown">{quantity}</span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-mayssa-brown text-mayssa-cream disabled:opacity-30 cursor-pointer"
                  >
                    <Plus size={16} />
                  </motion.button>
                </div>
              </div>

              {/* Bouton confirmer */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-mayssa-brown text-mayssa-cream font-bold shadow-xl cursor-pointer"
              >
                <ShoppingBag size={18} />
                <span>Précommander • {totalPrice.toFixed(2).replace('.', ',')} €</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
