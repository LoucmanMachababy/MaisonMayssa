import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '../types'
import { cn } from '../lib/utils'
import { useEscapeKey } from '../hooks/useEscapeKey'

const MAX_PIECES = 4

interface Flavor {
  label: string
  productId: string
  emoji: string
}

const FLAVORS: Flavor[] = [
  { label: 'Mangue', productId: 'trompe-loeil-mangue', emoji: '🥭' },
  { label: 'Citron', productId: 'trompe-loeil-citron', emoji: '🍋' },
  { label: 'Fraise', productId: 'trompe-loeil-fraise', emoji: '🍓' },
  { label: 'Myrtille', productId: 'trompe-loeil-myrtille', emoji: '🫐' },
  { label: 'Framboise', productId: 'trompe-loeil-framboise', emoji: '🫐' },
  { label: 'Passion', productId: 'trompe-loeil-passion', emoji: '🌟' },
]

interface BoxFruiteeModalProps {
  product: Product | null
  getStock: (id: string) => number | null
  onClose: () => void
  onSelect: (product: Product, flavorDescription: string) => void
}

export function BoxFruiteeModal({ product, getStock, onClose, onSelect }: BoxFruiteeModalProps) {
  const [selected, setSelected] = useState<string[]>([])

  useEscapeKey(onClose, !!product)

  if (!product) return null

  const addFlavor = (label: string) => {
    if (selected.length < MAX_PIECES) {
      setSelected((prev) => [...prev, label])
    }
  }

  const removeFlavor = (label: string) => {
    setSelected((prev) => {
      const i = prev.indexOf(label)
      if (i === -1) return prev
      return [...prev.slice(0, i), ...prev.slice(i + 1)]
    })
  }

  const isOutOfStock = (flavor: Flavor): boolean => {
    const stock = getStock(flavor.productId)
    return stock !== null && stock <= 0
  }

  const canAddMore = selected.length < MAX_PIECES

  const buildDescription = (): string => {
    const counts = selected.reduce<Record<string, number>>((acc, n) => {
      acc[n] = (acc[n] ?? 0) + 1
      return acc
    }, {})
    return Object.entries(counts)
      .map(([name, qty]) => (qty > 1 ? `${name} (×${qty})` : name))
      .join(', ')
  }

  const handleAddToCart = () => {
    if (selected.length !== MAX_PIECES || !product) return
    onSelect(product, `Parfums : ${buildDescription()}`)
    onClose()
  }

  const remaining = MAX_PIECES - selected.length

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-4 bottom-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 z-[60] mx-auto max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col"
          >
            <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95 cursor-pointer"
              >
                <X size={18} />
              </button>

              {product.image && (
                <div className="relative h-40 sm:h-48 overflow-hidden bg-mayssa-cream/50">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
                <div className="text-center space-y-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
                    {product.category}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs sm:text-sm text-mayssa-brown/70">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Sélecteur de parfums */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                      Choisissez 4 parfums
                    </p>
                    <span
                      className={cn(
                        'text-xs font-bold tabular-nums transition-colors',
                        selected.length === MAX_PIECES
                          ? 'text-green-600'
                          : 'text-mayssa-caramel',
                      )}
                    >
                      {selected.length}/{MAX_PIECES}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {FLAVORS.map((flavor) => {
                      const oos = isOutOfStock(flavor)
                      const count = selected.filter((s) => s === flavor.label).length
                      const disabled = oos || (!canAddMore && count === 0)

                      return (
                        <button
                          key={flavor.label}
                          type="button"
                          onClick={() => !disabled && addFlavor(flavor.label)}
                          disabled={disabled}
                          className={cn(
                            'relative flex items-center justify-between gap-2 rounded-xl p-3 text-left text-sm font-semibold transition-all border-2',
                            oos
                              ? 'bg-gray-100 border-transparent text-gray-400 cursor-not-allowed'
                              : disabled
                                ? 'bg-mayssa-soft/30 border-transparent text-mayssa-brown/30 cursor-not-allowed'
                                : count > 0
                                  ? 'bg-mayssa-caramel/15 border-mayssa-caramel text-mayssa-brown cursor-pointer hover:bg-mayssa-caramel/20'
                                  : 'bg-mayssa-soft/60 border-transparent text-mayssa-brown cursor-pointer hover:bg-mayssa-caramel/10 hover:border-mayssa-caramel/30',
                          )}
                        >
                          <span className="flex items-center gap-1.5 flex-1">
                            <span>{flavor.emoji}</span>
                            <span>{flavor.label}</span>
                          </span>
                          {oos ? (
                            <span className="text-[9px] font-bold uppercase text-red-400 bg-red-50 px-1.5 py-0.5 rounded-full shrink-0">
                              Rupture
                            </span>
                          ) : count > 0 ? (
                            <span className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-mayssa-caramel">
                                ×{count}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFlavor(flavor.label)
                                }}
                                className="flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-brown/20 hover:bg-mayssa-brown/40 cursor-pointer"
                                aria-label={`Retirer un ${flavor.label}`}
                              >
                                <Minus size={10} />
                              </button>
                            </span>
                          ) : (
                            <span className="text-mayssa-caramel opacity-60 text-lg leading-none shrink-0">
                              +
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Récap prix */}
                <div className="rounded-xl bg-mayssa-soft/50 p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-mayssa-brown">Total</p>
                    <p className="text-[10px] text-mayssa-brown/50">4 trompe-l&apos;œil fruités</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg sm:text-xl font-display font-bold text-mayssa-caramel">
                      {product.price.toFixed(2).replace('.', ',')} €
                    </p>
                    {product.originalPrice && (
                      <p className="text-xs text-mayssa-brown/40 line-through">
                        {product.originalPrice.toFixed(2).replace('.', ',')} €
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bouton fixe en bas */}
              <div className="flex-shrink-0 p-4 pt-2 pb-6 sm:pb-4 border-t border-mayssa-brown/5 bg-white rounded-b-3xl">
                <button
                  onClick={handleAddToCart}
                  disabled={selected.length !== MAX_PIECES}
                  className={cn(
                    'w-full rounded-2xl py-3 sm:py-4 font-bold text-sm sm:text-base transition-all',
                    selected.length === MAX_PIECES
                      ? 'bg-mayssa-caramel text-white shadow-lg hover:bg-mayssa-brown hover:scale-[1.02] active:scale-95 cursor-pointer'
                      : 'bg-mayssa-soft/50 text-mayssa-brown/40 cursor-not-allowed',
                  )}
                >
                  {selected.length === MAX_PIECES
                    ? 'Ajouter au panier'
                    : `Choisissez encore ${remaining} parfum${remaining > 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
