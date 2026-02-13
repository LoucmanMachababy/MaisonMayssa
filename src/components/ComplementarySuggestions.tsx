import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import type { Product } from '../types'
import { hapticFeedback } from '../lib/haptics'

interface ComplementarySuggestionsProps {
  products: Product[]
  onAdd: (product: Product) => void
  onDismiss: () => void
}

export function ComplementarySuggestions({ products, onAdd, onDismiss }: ComplementarySuggestionsProps) {
  return (
    <AnimatePresence>
      {products.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 md:bottom-6 right-4 z-50 w-72 rounded-2xl bg-white shadow-2xl border border-mayssa-brown/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
              Tu pourrais aimer
            </p>
            <button
              type="button"
              onClick={() => {
                hapticFeedback('light')
                onDismiss()
              }}
              className="p-1 rounded-full hover:bg-mayssa-soft transition-colors cursor-pointer"
              aria-label="Fermer les suggestions"
            >
              <X size={14} className="text-mayssa-brown/40" />
            </button>
          </div>
          <div className="px-3 pb-3 space-y-2">
            {products.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => {
                  hapticFeedback('medium')
                  onAdd(product)
                }}
                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-mayssa-soft/50 transition-all group cursor-pointer"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-semibold text-mayssa-brown truncate">{product.name}</p>
                  <div className="flex items-center gap-1">
                    <p className="text-[10px] text-mayssa-caramel font-bold">{product.price.toFixed(2).replace('.', ',')} €</p>
                    {product.originalPrice && (
                      <p className="text-[9px] text-mayssa-brown/50 font-bold line-through">
                        {product.originalPrice.toFixed(2).replace('.', ',')} €
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 p-1.5 rounded-full bg-mayssa-caramel/10 group-hover:bg-mayssa-caramel/20 transition-colors">
                  <Plus size={14} className="text-mayssa-caramel" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
