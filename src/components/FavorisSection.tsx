import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Plus, Trash2, ShoppingBag } from 'lucide-react'
import type { Product } from '../types'

interface FavorisSectionProps {
  favorites: Product[]
  onRemove: (productId: string) => void
  onAddToCart: (product: Product) => void
  onClear: () => void
}

export function FavorisSection({ favorites, onRemove, onAddToCart, onClear }: FavorisSectionProps) {
  if (favorites.length === 0) {
    return null
  }

  return (
    <motion.section
      id="favoris"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6 w-full"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-500">
            <Heart size={16} className="fill-red-500" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Mes Favoris</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-mayssa-brown">
            Vos Coups de Coeur
          </h2>
        </div>

        {/* Clear all button */}
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Trash2 size={16} />
          <span>Vider les favoris</span>
        </button>
      </div>

      {/* Favorites grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {favorites.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="relative rounded-2xl sm:rounded-3xl bg-white/80 p-3 sm:p-4 shadow-xl ring-1 ring-white/40 overflow-hidden"
            >
              {/* Remove from favorites button */}
              <motion.button
                type="button"
                onClick={() => onRemove(product.id)}
                whileTap={{ scale: 0.85 }}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 cursor-pointer"
                aria-label="Retirer des favoris"
              >
                <Heart size={16} className="text-red-500 fill-red-500" />
              </motion.button>

              {/* Product image */}
              <div className="relative aspect-square overflow-hidden rounded-xl sm:rounded-2xl bg-mayssa-cream/50 mb-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ShoppingBag size={32} className="text-mayssa-brown/20" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm sm:text-base text-mayssa-brown truncate">
                  {product.name}
                </h4>
                <p className="text-[10px] sm:text-xs text-mayssa-brown/50 truncate">
                  {product.category}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base sm:text-lg font-display font-bold text-mayssa-caramel">
                    {product.sizes ? 'À partir de ' : ''}
                    {product.price.toFixed(2).replace('.', ',')} €
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onAddToCart(product)}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-mayssa-brown text-mayssa-cream shadow-lg transition-all hover:scale-110 hover:bg-mayssa-caramel cursor-pointer"
                    aria-label="Ajouter au panier"
                  >
                    <Plus size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add all to cart button */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => favorites.forEach(p => onAddToCart(p))}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
        >
          <ShoppingBag size={20} />
          <span>Ajouter tous au panier ({favorites.length})</span>
        </motion.button>
      </div>
    </motion.section>
  )
}
