import { motion } from 'framer-motion'
import { Plus, ShoppingCart } from 'lucide-react'
import type { Product } from '../types'

interface ProductCardProps {
    product: Product
    onAdd: (product: Product) => void
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative flex flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white/60 p-3 sm:p-4 shadow-xl ring-1 ring-white/40 transition-all hover:-translate-y-1 sm:hover:-translate-y-2 hover:bg-white/90 hover:shadow-2xl hover:shadow-mayssa-brown/10"
        >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl shadow-inner bg-mayssa-cream/50">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <ShoppingCart size={32} className="sm:w-10 sm:h-10 text-mayssa-brown/20" />
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="flex flex-col flex-1 gap-2 sm:gap-3">
                <div className="space-y-0.5 sm:space-y-1">
                    <h4 className="text-base sm:text-lg font-bold leading-tight text-mayssa-brown">
                        {product.name}
                    </h4>
                    <p className="text-xs sm:text-sm font-medium text-mayssa-brown/60">
                        Pâtisserie artisanale
                    </p>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-mayssa-caramel">Prix</span>
                        <span className="text-lg sm:text-xl font-display font-bold text-mayssa-brown">
                            {product.price.toFixed(2).replace('.', ',')} €
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-mayssa-brown text-mayssa-cream shadow-lg transition-all hover:scale-110 hover:bg-mayssa-caramel active:scale-95 flex-shrink-0"
                    >
                        <Plus size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>
        </motion.article>
    )
}
