import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Minus } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Product } from '../types'
import { DISCOVERY_BOX_TROMPE_SLOT_COUNT } from '../constants'
import { isTrompeSelectableForDiscovery } from '../lib/discoveryBox'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { cn } from '../lib/utils'
import { hapticFeedback } from '../lib/haptics'

interface BoxDecouverteTrompeModalProps {
  product: Product | null
  /** Trompe-l'œil proposés (déjà filtrés exclusions admin). */
  eligibleTrompes: Product[]
  getStock: (productId: string) => number | null
  onClose: () => void
  onConfirm: (selectionIds: string[]) => void
}

export function BoxDecouverteTrompeModal({
  product,
  eligibleTrompes,
  getStock,
  onClose,
  onConfirm,
}: BoxDecouverteTrompeModalProps) {
  const [picked, setPicked] = useState<string[]>([])

  useEscapeKey(onClose, !!product)

  const nameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const p of eligibleTrompes) m.set(p.id, p.name)
    return m
  }, [eligibleTrompes])

  const canPickMore = picked.length < DISCOVERY_BOX_TROMPE_SLOT_COUNT

  const addFlavor = (id: string) => {
    if (!canPickMore) return
    if (picked.includes(id)) return
    if (!isTrompeSelectableForDiscovery(id, getStock)) return
    hapticFeedback('light')
    setPicked((prev) => [...prev, id])
  }

  const removeAt = (index: number) => {
    hapticFeedback('light')
    setPicked((prev) => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = () => {
    if (picked.length !== DISCOVERY_BOX_TROMPE_SLOT_COUNT) return
    if (new Set(picked).size !== DISCOVERY_BOX_TROMPE_SLOT_COUNT) return
    hapticFeedback('success')
    onConfirm(picked)
    setPicked([])
  }

  const descriptionPreview = useMemo(() => {
    if (picked.length === 0) return ''
    return picked.map((id) => nameById.get(id) ?? id).join(' • ')
  }, [picked, nameById])

  if (!product) return null

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
            className="fixed inset-x-4 top-4 bottom-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 z-[60] mx-auto max-w-lg max-h-[calc(100vh-2rem)] sm:max-h-[90vh] flex flex-col"
          >
            <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown cursor-pointer"
              >
                <X size={18} />
              </button>

              {product.image && (
                <div className="relative h-36 sm:h-40 overflow-hidden bg-mayssa-cream/50">
                  <img src={product.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-caramel">
                    {product.category}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-xs text-mayssa-brown/65">{product.description}</p>
                  <p className="text-sm font-display font-semibold text-mayssa-brown pt-1">
                    {product.price.toFixed(2).replace('.', ',')} €
                    {product.originalPrice != null && (
                      <span className="text-xs text-mayssa-brown/40 line-through ml-2">
                        {product.originalPrice.toFixed(2).replace('.', ',')} €
                      </span>
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-mayssa-soft/40 border border-mayssa-brown/10 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/55 text-center">
                    Votre sélection ({picked.length}/{DISCOVERY_BOX_TROMPE_SLOT_COUNT})
                  </p>
                  {picked.length === 0 ? (
                    <p className="text-[11px] text-mayssa-brown/45 text-center mt-2">
                      5 saveurs différentes obligatoires : chaque parfum ne peut être choisi qu&apos;une seule fois.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-1.5 max-h-28 overflow-y-auto">
                      {picked.map((id, i) => (
                        <li
                          key={`${id}-${i}`}
                          className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-2.5 py-1.5 text-[11px] text-mayssa-brown"
                        >
                          <span className="truncate font-medium">{nameById.get(id) ?? id}</span>
                          <button
                            type="button"
                            onClick={() => removeAt(i)}
                            className="shrink-0 p-1 rounded-lg text-mayssa-brown/40 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                            aria-label="Retirer"
                          >
                            <Minus size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/55 mb-2 text-center">
                    Saveurs disponibles
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {eligibleTrompes.map((p) => {
                      const already = picked.includes(p.id)
                      const selectable = isTrompeSelectableForDiscovery(p.id, getStock) && !already
                      const s = getStock(p.id)
                      const stockLabel =
                        already
                          ? 'Déjà dans la box'
                          : s === null
                            ? ''
                            : s <= 0
                              ? 'Rupture'
                              : `Stock : ${s}`
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!selectable || !canPickMore}
                          onClick={() => addFlavor(p.id)}
                          className={cn(
                            'rounded-2xl border-2 px-3 py-2.5 text-left transition-all cursor-pointer',
                            !selectable || !canPickMore
                              ? 'border-mayssa-brown/10 bg-mayssa-brown/[0.04] opacity-55 cursor-not-allowed'
                              : 'border-mayssa-caramel/25 bg-white hover:border-mayssa-caramel hover:shadow-md active:scale-[0.98]',
                          )}
                        >
                          <span className="text-xs font-bold text-mayssa-brown block truncate">{p.name}</span>
                          {stockLabel ? (
                            <span
                              className={cn(
                                'text-[9px] font-semibold mt-0.5 block',
                                already
                                  ? 'text-mayssa-caramel'
                                  : s !== null && s <= 0
                                    ? 'text-red-500'
                                    : 'text-mayssa-brown/45',
                              )}
                            >
                              {stockLabel}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {eligibleTrompes.length === 0 && (
                    <p className="text-center text-xs text-red-500 py-4">
                      Aucune saveur disponible pour cette box (vérifiez les exclusions admin).
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-mayssa-brown/10 p-4 bg-white">
                <button
                  type="button"
                  disabled={picked.length !== DISCOVERY_BOX_TROMPE_SLOT_COUNT}
                  onClick={handleConfirm}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition-all cursor-pointer',
                    picked.length === DISCOVERY_BOX_TROMPE_SLOT_COUNT
                      ? 'bg-mayssa-caramel text-white shadow-lg hover:bg-mayssa-brown'
                      : 'bg-mayssa-brown/10 text-mayssa-brown/35 cursor-not-allowed',
                  )}
                >
                  <Check size={18} />
                  Ajouter au panier
                </button>
                {descriptionPreview && picked.length === DISCOVERY_BOX_TROMPE_SLOT_COUNT && (
                  <p className="text-[9px] text-mayssa-brown/45 text-center mt-2 line-clamp-3">{descriptionPreview}</p>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
