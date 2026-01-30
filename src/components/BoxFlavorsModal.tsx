import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Plus, Minus } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Product, ProductSize } from '../types'
import { cn } from '../lib/utils'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { PRODUCTS } from '../constants'

interface BoxFlavorsModalProps {
  product: Product | null
  onClose: () => void
  onSelect: (product: Product, size: ProductSize, flavorDescription: string, totalPrice: number) => void
}

const COOKIE_FLAVORS = PRODUCTS.filter((p) => p.category === 'Cookies').map((p) => p.name)
const BROWNIE_FLAVORS = PRODUCTS.filter((p) => p.category === 'Brownies').map((p) => p.name)
const COOKIE_UNIT_PRICE = Math.min(...PRODUCTS.filter((p) => p.category === 'Cookies').map((p) => p.price))
const BROWNIE_UNIT_PRICE = Math.min(...PRODUCTS.filter((p) => p.category === 'Brownies').map((p) => p.price))

/** Compte les occurrences et retourne "Nom (×2), Autre (×1)" */
function formatWithCounts(items: string[]): string {
  const counts = items.reduce<Record<string, number>>((acc, name) => {
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})
  return Object.entries(counts)
    .map(([name, qty]) => (qty > 1 ? `${name} (×${qty})` : name))
    .join(', ')
}

export function BoxFlavorsModal({ product, onClose, onSelect }: BoxFlavorsModalProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [selectedCookies, setSelectedCookies] = useState<string[]>([])
  const [selectedBrownies, setSelectedBrownies] = useState<string[]>([])

  useEscapeKey(onClose, !!product)

  const isBoxCookies = product?.id === 'box-cookies'
  const isBoxBrownies = product?.id === 'box-brownies'
  const isBoxMixte = product?.id === 'box-mixte'

  const { supplement, supplementDetail } = useMemo(() => {
    if (!selectedSize) return { supplement: 0, supplementDetail: '' }
    const ml = selectedSize.ml
    let extraCookies = 0
    let extraBrownies = 0
    if (isBoxCookies) {
      extraCookies = Math.max(0, selectedCookies.length - ml)
    } else if (isBoxBrownies) {
      extraBrownies = Math.max(0, selectedBrownies.length - ml)
    } else if (isBoxMixte) {
      const cookiesIncluded = ml === 6 ? 3 : 6
      const browniesIncluded = ml === 6 ? 3 : 6
      extraCookies = Math.max(0, selectedCookies.length - cookiesIncluded)
      extraBrownies = Math.max(0, selectedBrownies.length - browniesIncluded)
    }
    const supp = extraCookies * COOKIE_UNIT_PRICE + extraBrownies * BROWNIE_UNIT_PRICE
    const parts: string[] = []
    if (extraCookies > 0) parts.push(`${extraCookies} cookie(s) supp. (+${(extraCookies * COOKIE_UNIT_PRICE).toFixed(2).replace('.', ',')} €)`)
    if (extraBrownies > 0) parts.push(`${extraBrownies} brownie(s) supp. (+${(extraBrownies * BROWNIE_UNIT_PRICE).toFixed(2).replace('.', ',')} €)`)
    return { supplement: supp, supplementDetail: parts.join(' • ') }
  }, [selectedSize, isBoxCookies, isBoxBrownies, isBoxMixte, selectedCookies.length, selectedBrownies.length])

  const totalPrice = selectedSize ? selectedSize.price + supplement : 0

  const addCookie = (name: string) => setSelectedCookies((prev) => [...prev, name])
  const removeCookie = (name: string) => {
    setSelectedCookies((prev) => {
      const i = prev.indexOf(name)
      if (i === -1) return prev
      return [...prev.slice(0, i), ...prev.slice(i + 1)]
    })
  }

  const addBrownie = (name: string) => setSelectedBrownies((prev) => [...prev, name])
  const removeBrownie = (name: string) => {
    setSelectedBrownies((prev) => {
      const i = prev.indexOf(name)
      if (i === -1) return prev
      return [...prev.slice(0, i), ...prev.slice(i + 1)]
    })
  }

  if (!product || !product.sizes) return null

  const hasEnoughFlavors = () => {
    if (isBoxCookies) return selectedCookies.length >= 1
    if (isBoxBrownies) return selectedBrownies.length >= 1
    if (isBoxMixte) return selectedCookies.length >= 1 && selectedBrownies.length >= 1
    return false
  }

  const buildFlavorDescription = (): string => {
    if (isBoxCookies) return `Parfums : ${formatWithCounts(selectedCookies)}`
    if (isBoxBrownies) return `Parfums : ${formatWithCounts(selectedBrownies)}`
    return `Cookies : ${formatWithCounts(selectedCookies)} — Brownies : ${formatWithCounts(selectedBrownies)}`
  }

  const canAddToCart = selectedSize && hasEnoughFlavors()

  const handleAddToCart = () => {
    if (!canAddToCart || !selectedSize) return
    const flavorDescription = buildFlavorDescription()
    onSelect(product, selectedSize, flavorDescription, totalPrice)
    onClose()
  }

  const cookieCount = selectedCookies.length
  const brownieCount = selectedBrownies.length

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
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

              <div className="p-5 sm:p-6 space-y-5">
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

                {/* 1. Choix du format */}
                <div className="space-y-2">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 text-center">
                    1. Choisissez votre format
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={size.ml}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer border-2',
                          selectedSize?.ml === size.ml
                            ? 'bg-mayssa-caramel text-white border-mayssa-caramel shadow-xl'
                            : 'bg-mayssa-soft/60 hover:bg-mayssa-caramel/10 border-transparent hover:border-mayssa-caramel/30'
                        )}
                      >
                        <span className="text-lg sm:text-xl font-display font-bold">
                          {size.price.toFixed(2).replace('.', ',')} €
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-center">
                          {size.label}
                        </span>
                        {selectedSize?.ml === size.ml && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Choix des parfums */}
                {selectedSize && (
                  <div className="space-y-4">
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 text-center">
                      2. Choisissez vos parfums (sélection multiple)
                    </p>

                    {(isBoxCookies || isBoxMixte) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-mayssa-brown">
                          Cookies {isBoxMixte && selectedSize.ml === 6 && '(3 inclus)'}
                          {isBoxMixte && selectedSize.ml === 12 && '(6 inclus)'}
                          {isBoxCookies && selectedSize && ` (${selectedSize.ml} inclus)`}
                          {cookieCount > 0 && ` · ${cookieCount} choisi(s)`}
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {COOKIE_FLAVORS.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => addCookie(name)}
                              className="flex items-center justify-between gap-2 rounded-xl p-2.5 text-left text-[11px] sm:text-xs font-medium transition-all cursor-pointer border-2 bg-mayssa-soft/60 border-transparent hover:bg-mayssa-caramel/20 hover:border-mayssa-caramel/30"
                            >
                              <span>{name}</span>
                              <Plus size={14} className="shrink-0 text-mayssa-caramel" />
                            </button>
                          ))}
                        </div>
                        {cookieCount > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(
                              selectedCookies.reduce((acc, n) => acc.set(n, (acc.get(n) ?? 0) + 1), new Map<string, number>())
                            ).map(([name, qty]) => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 rounded-full bg-mayssa-caramel/20 px-2 py-1 text-[10px] font-semibold text-mayssa-brown"
                              >
                                {name} ×{qty}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeCookie(name)
                                  }}
                                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mayssa-brown/20 hover:bg-mayssa-brown/40 cursor-pointer"
                                  aria-label={`Retirer un ${name}`}
                                >
                                  <Minus size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {(isBoxBrownies || isBoxMixte) && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-mayssa-brown">
                          Brownies {isBoxMixte && selectedSize.ml === 6 && '(3 inclus)'}
                          {isBoxMixte && selectedSize.ml === 12 && '(6 inclus)'}
                          {isBoxBrownies && selectedSize && ` (${selectedSize.ml} inclus)`}
                          {brownieCount > 0 && ` · ${brownieCount} choisi(s)`}
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {BROWNIE_FLAVORS.map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => addBrownie(name)}
                              className="flex items-center justify-between gap-2 rounded-xl p-2.5 text-left text-[11px] sm:text-xs font-medium transition-all cursor-pointer border-2 bg-mayssa-soft/60 border-transparent hover:bg-mayssa-caramel/20 hover:border-mayssa-caramel/30"
                            >
                              <span>{name}</span>
                              <Plus size={14} className="shrink-0 text-mayssa-caramel" />
                            </button>
                          ))}
                        </div>
                        {brownieCount > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(
                              selectedBrownies.reduce((acc, n) => acc.set(n, (acc.get(n) ?? 0) + 1), new Map<string, number>())
                            ).map(([name, qty]) => (
                              <span
                                key={name}
                                className="inline-flex items-center gap-1 rounded-full bg-mayssa-caramel/20 px-2 py-1 text-[10px] font-semibold text-mayssa-brown"
                              >
                                {name} ×{qty}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeBrownie(name)
                                  }}
                                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mayssa-brown/20 hover:bg-mayssa-brown/40 cursor-pointer"
                                  aria-label={`Retirer un ${name}`}
                                >
                                  <Minus size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl bg-mayssa-soft/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-mayssa-brown">Box</span>
                    <span className="text-sm font-bold text-mayssa-brown">
                      {selectedSize ? selectedSize.price.toFixed(2).replace('.', ',') : '0,00'} €
                    </span>
                  </div>
                  {supplement > 0 && (
                    <>
                      <div className="flex items-center justify-between text-xs text-mayssa-caramel">
                        <span>Supplément ({supplementDetail})</span>
                        <span>+{supplement.toFixed(2).replace('.', ',')} €</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between border-t border-mayssa-brown/10 pt-2">
                    <span className="text-sm font-bold text-mayssa-brown">Total</span>
                    <span className="text-lg font-display font-bold text-mayssa-caramel">
                      {totalPrice.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart}
                  className={cn(
                    'w-full rounded-2xl py-3 sm:py-4 font-bold text-sm sm:text-base transition-all cursor-pointer',
                    canAddToCart
                      ? 'bg-mayssa-caramel text-white shadow-lg hover:bg-mayssa-brown hover:scale-[1.02] active:scale-95'
                      : 'bg-mayssa-soft/50 text-mayssa-brown/40 cursor-not-allowed'
                  )}
                >
                  {!selectedSize
                    ? 'Choisissez un format'
                    : !hasEnoughFlavors()
                      ? isBoxMixte
                        ? 'Choisissez au moins un parfum cookies et un parfum brownies'
                        : 'Choisissez au moins un parfum'
                      : 'Ajouter au panier'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
