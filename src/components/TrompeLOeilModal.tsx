import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, CalendarClock } from 'lucide-react'
import type { Product } from '../types'
import { BlurImage } from './BlurImage'
import { useFocusTrap } from '../hooks/useAccessibility'
import { formatDateLabel } from '../lib/delivery'

interface TrompeLOeilModalProps {
  product: Product | null
  stock: number | null
  onClose: () => void
  onConfirm: (product: Product, quantity: number) => void
  /** Date d'ouverture des précommandes (YYYY-MM-DD). Si défini et pas encore passé → mode "pas encore disponible". */
  preorderOpenDate?: string
  /** Heure d'ouverture des précommandes (HH:mm). */
  preorderOpenTime?: string
}

export function TrompeLOeilModal({ product, stock, onClose, onConfirm, preorderOpenDate, preorderOpenTime }: TrompeLOeilModalProps) {
  const [quantity, setQuantity] = useState(1)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, !!product, onClose)

  // Vérifier si les précommandes sont déjà ouvertes
  const isPreorderOpen = useMemo(() => {
    if (!preorderOpenDate) return true
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (preorderOpenDate > todayStr) return false
    if (preorderOpenDate < todayStr) return true
    const [h, m] = (preorderOpenTime ?? '00:00').split(':').map(Number)
    return now.getHours() * 60 + now.getMinutes() >= (h ?? 0) * 60 + (m ?? 0)
  }, [preorderOpenDate, preorderOpenTime])

  const openingLabel = useMemo(() => {
    if (!preorderOpenDate || isPreorderOpen) return null
    const dateLabel = formatDateLabel(preorderOpenDate)
    return preorderOpenTime && preorderOpenTime !== '00:00'
      ? `${dateLabel} à ${preorderOpenTime}`
      : dateLabel
  }, [preorderOpenDate, preorderOpenTime, isPreorderOpen])

  if (!product) return null

  const maxQty = stock !== null ? (product?.bundleProductIds?.length ? stock : Math.min(stock, 20)) : 20
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
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Précommande ${product.name}`}
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
                <span className="text-sm text-mayssa-brown/60">Prix unitaire</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-mayssa-caramel">{product.price.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>

              {/* Banner : précommandes pas encore ouvertes */}
              {!isPreorderOpen && openingLabel && (
                <div className="flex items-start gap-3 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                  <CalendarClock size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Précommandes bientôt disponibles</p>
                    <p className="text-xs text-amber-700 mt-0.5">Ouverture le <strong>{openingLabel}</strong></p>
                  </div>
                </div>
              )}


              {/* Stock */}
              {stock !== null && isPreorderOpen && (
                <p className={`text-xs font-bold ${stock <= 5 ? 'text-orange-500' : 'text-emerald-600'}`}>
                  {stock} disponible{stock > 1 ? 's' : ''}
                </p>
              )}

              {/* Quantité (masquée si pas encore ouvert) */}
              {isPreorderOpen && (
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
              )}

              {/* Bouton confirmer ou bouton "Revenir" si pas encore ouvert */}
              {isPreorderOpen ? (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-mayssa-brown text-mayssa-cream font-bold shadow-xl cursor-pointer"
                >
                  <ShoppingBag size={18} />
                  <span>Précommander • {totalPrice.toFixed(2).replace('.', ',')} €</span>
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-mayssa-brown/10 text-mayssa-brown font-bold cursor-pointer"
                >
                  Fermer
                </motion.button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
