import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ShoppingBag } from 'lucide-react'

interface CartAddedToastProps {
  productName: string | null
  cartCount: number
  onDismiss?: () => void
}

export function CartAddedToast({ productName, cartCount, onDismiss }: CartAddedToastProps) {
  return (
    <AnimatePresence>
      {productName && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[60] bg-white border border-mayssa-brown/10 shadow-[0_16px_48px_rgba(30,18,13,0.12)] p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check size={18} strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-mayssa-brown leading-snug">
                <span className="text-emerald-700">+1</span>{' '}
                <span className="font-display">{productName}</span>
              </p>
              <p className="text-xs text-mayssa-brown/50 mt-0.5">
                Ajouté au panier · {cartCount} article{cartCount > 1 ? 's' : ''}
              </p>
              <div className="flex gap-2 mt-3">
                {onDismiss && (
                  <button
                    type="button"
                    onClick={onDismiss}
                    className="flex-1 py-2 text-[10px] tracking-widest uppercase border border-mayssa-brown/15 text-mayssa-brown/70 hover:border-mayssa-gold transition-colors"
                  >
                    Continuer
                  </button>
                )}
                <Link
                  to="/panier"
                  className="flex-1 py-2 bg-mayssa-brown text-white text-[10px] tracking-widest uppercase hover:bg-mayssa-espresso transition-colors text-center inline-flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={12} />
                  Panier
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
