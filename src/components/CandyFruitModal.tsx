import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, ChevronDown } from 'lucide-react'
import type { Product } from '../types'
import {
  CANDY_FRUIT_BRAND,
  getAvailableCandyFruitFlavors,
  getCandyFruitFormat,
  getCandyFruitFormatLabel,
  type CandyFruitFlavor,
} from '../constants/candyFruit'
import { cn } from '../lib/utils'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface CandyFruitModalProps {
  product: Product | null
  excludedFlavorIds?: string[]
  onClose: () => void
  onSelect: (product: Product, flavor: CandyFruitFlavor, quantity: number) => void
}

export function CandyFruitModal({ product, excludedFlavorIds = [], onClose, onSelect }: CandyFruitModalProps) {
  const flavors = useMemo(
    () => (product ? getAvailableCandyFruitFlavors(product.id, excludedFlavorIds) : []),
    [product, excludedFlavorIds],
  )
  const format = product ? getCandyFruitFormat(product.id) : null
  const formatLabel = format ? getCandyFruitFormatLabel(format) : ''

  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (flavors.length > 0) setSelectedFlavorId(flavors[0].id)
  }, [product?.id, flavors])

  useEscapeKey(onClose, !!product)

  if (!product || flavors.length === 0) return null

  const selectedFlavor =
    flavors.find((f) => f.id === selectedFlavorId) ?? flavors[0]

  const handleAdd = () => {
    if (!selectedFlavor) return
    onSelect(product, selectedFlavor, quantity)
    onClose()
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
            className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[60]"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            role="dialog"
            aria-labelledby="candy-fruit-modal-title"
            className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[min(92dvh,720px)] flex flex-col"
          >
            <div className="relative flex flex-col max-h-[min(92dvh,720px)] overflow-hidden rounded-2xl bg-white shadow-2xl border border-mayssa-brown/8">
              {/* En-tête fixe */}
              <div className="shrink-0 border-b border-mayssa-brown/8 px-4 pt-4 pb-3 pr-12">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-mayssa-soft text-mayssa-brown/70 hover:bg-mayssa-brown/10 cursor-pointer"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mayssa-gold">
                  {CANDY_FRUIT_BRAND} · Candy Fruit · {formatLabel} · {product.price.toFixed(0)} €
                </p>
                <h2
                  id="candy-fruit-modal-title"
                  className="font-display text-xl text-mayssa-brown mt-0.5 leading-tight"
                >
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-xs text-mayssa-brown/60 mt-1 leading-snug">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Zone scrollable : goûts en premier */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                {/* Sélecteur de goûts — toujours en haut, bien visible */}
                <div className="px-4 pt-4 pb-3 bg-mayssa-gold/8 border-b border-mayssa-gold/20">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-mayssa-espresso mb-3">
                    <ChevronDown size={14} className="text-mayssa-gold animate-bounce" />
                    Choisissez votre goût
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
                    {flavors.map((flavor) => {
                      const isActive = flavor.id === selectedFlavor.id
                      return (
                        <button
                          key={flavor.id}
                          type="button"
                          onClick={() => setSelectedFlavorId(flavor.id)}
                          className={cn(
                            'snap-start shrink-0 w-[5.5rem] rounded-xl border-2 overflow-hidden transition-all cursor-pointer',
                            isActive
                              ? 'border-mayssa-gold ring-2 ring-mayssa-gold/30 scale-[1.02]'
                              : 'border-mayssa-brown/15 opacity-80 hover:opacity-100 hover:border-mayssa-gold/50',
                          )}
                        >
                          <div className="aspect-square overflow-hidden bg-mayssa-soft">
                            <img
                              src={flavor.image}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <p
                            className={cn(
                              'px-1 py-1.5 text-[9px] font-bold leading-tight text-center line-clamp-2 min-h-[2.25rem]',
                              isActive ? 'bg-mayssa-espresso text-mayssa-gold' : 'bg-white text-mayssa-brown',
                            )}
                          >
                            {flavor.shortLabel}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Aperçu du goût sélectionné */}
                <div className="relative mx-4 mt-4 aspect-[16/10] overflow-hidden rounded-xl bg-mayssa-espresso">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedFlavor.id}
                      src={selectedFlavor.image}
                      alt={selectedFlavor.label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-mayssa-espresso/70 to-transparent" />
                  <p className="absolute bottom-3 left-3 right-3 font-display text-lg text-white">
                    {selectedFlavor.label}
                  </p>
                </div>

                <p className="px-4 mt-3 text-xs text-mayssa-brown/60 leading-relaxed">
                  {product.description}
                </p>

                <div className="mx-4 mt-4 mb-4 flex items-center justify-between rounded-xl bg-mayssa-soft/80 px-4 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60">
                    Quantité
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-mayssa-brown/15 text-mayssa-brown hover:bg-mayssa-espresso hover:text-mayssa-gold transition-colors cursor-pointer"
                      aria-label="Réduire la quantité"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-mayssa-brown tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-mayssa-brown/15 text-mayssa-brown hover:bg-mayssa-espresso hover:text-mayssa-gold transition-colors cursor-pointer"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pied fixe */}
              <div className="shrink-0 border-t border-mayssa-brown/8 p-4 bg-white flex items-center gap-4">
                <div className="shrink-0">
                  <p className="text-[10px] text-mayssa-brown/50 uppercase tracking-wider">Total</p>
                  <p className="font-display text-xl text-mayssa-espresso">
                    {(product.price * quantity).toFixed(2).replace('.', ',')} €
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mayssa-espresso py-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white hover:bg-mayssa-brown transition-colors cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  Ajouter · {selectedFlavor.shortLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
