import { motion } from 'framer-motion'
import { Plus, ShoppingCart, Heart, Calendar } from 'lucide-react'
import type { Product } from '../types'
import { use3DTilt } from '../hooks/use3DTilt'
import { isPreorderNotYetAvailable } from '../lib/utils'
import { ProductBadges } from './ProductBadges'
import { ShareButton } from './ShareButton'
import { BlurImage } from './BlurImage'
import { StockBadge } from './StockBadge'

interface ProductCardProps {
    product: Product
    onAdd: (product: Product) => void
    isFavorite?: boolean
    onToggleFavorite?: (product: Product) => void
    stock?: number | null
    isPreorderDay?: boolean
    dayNames?: string
}

export function ProductCard({ product, onAdd, isFavorite = false, onToggleFavorite, stock = null, isPreorderDay = true, dayNames = '' }: ProductCardProps) {
    const { ref, style, handlers } = use3DTilt(10)
    const isPreorderSoon = isPreorderNotYetAvailable(product)
    const showBientotDispo = product.preorder && !product.image
    const isStockManaged = stock !== null
    const isUnavailable = isStockManaged && (!isPreorderDay || stock <= 0)

    return (
        <motion.article
            layout
            role="button"
            tabIndex={0}
            onClick={() => !isPreorderSoon && !isUnavailable && onAdd(product)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!isPreorderSoon && !isUnavailable) onAdd(product)
                }
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`group relative flex flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white/60 p-3 sm:p-4 shadow-xl ring-1 ring-white/40 ${(isPreorderSoon || isUnavailable) ? 'cursor-default' : 'cursor-pointer hover:bg-white/90 hover:shadow-2xl hover:shadow-mayssa-brown/10 active:scale-[0.98]'} focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-caramel focus-visible:ring-offset-2`}
        >
            {/* Action buttons */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {onToggleFavorite && (
                    <motion.button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(product)
                        }}
                        whileTap={{ scale: 0.85 }}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition-all hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                        <Heart
                            size={18}
                            className={`transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-mayssa-brown/40 hover:text-red-400'}`}
                        />
                    </motion.button>
                )}
                <div onClick={(e) => e.stopPropagation()}>
                    <ShareButton
                        product={product}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md text-mayssa-brown/40 hover:text-mayssa-brown transition-all hover:scale-110"
                    />
                </div>
            </div>

            <div
                ref={ref}
                style={style}
                {...handlers}
                className="flex flex-col gap-3 sm:gap-4 h-full"
            >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl shadow-inner bg-mayssa-cream/50">
                {product.badges?.length ? (
                  <ProductBadges badges={product.badges} variant="card" />
                ) : null}
                {product.image ? (
                    <BlurImage
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-mayssa-brown/50">
                        {showBientotDispo ? (
                            <>
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Bientôt disponible</span>
                                <ShoppingCart size={28} className="sm:w-8 sm:h-8 opacity-50" />
                            </>
                        ) : (
                            <ShoppingCart size={32} className="sm:w-10 sm:h-10" />
                        )}
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>

            <div className="flex flex-col flex-1 gap-2 sm:gap-3">
                <div className="space-y-1 sm:space-y-1.5">
                    <h4 className="text-sm sm:text-base md:text-lg font-bold leading-tight text-mayssa-brown">
                        {product.name}
                    </h4>
                    <p className="text-[11px] sm:text-xs font-medium text-mayssa-brown/60 line-clamp-2 leading-relaxed">
                        {product.description || 'Pâtisserie artisanale'}
                    </p>
                    {isStockManaged && (
                        <StockBadge stock={stock} isPreorderDay={isPreorderDay} dayNames={dayNames} />
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex flex-col">
                        {isPreorderSoon && product.preorder ? (
                            <>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-mayssa-caramel flex items-center gap-1">
                                    <Calendar size={12} /> Précommande
                                </span>
                                <span className="text-[10px] sm:text-xs text-mayssa-brown/70">
                                    Dès le 14/02 • À récupérer sous {product.preorder.daysToPickup} j après préco.
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-mayssa-caramel">
                                    {product.sizes ? 'À partir de' : 'Prix'}
                                </span>
                                <span className="text-lg sm:text-xl font-display font-bold text-mayssa-brown">
                                    {product.price.toFixed(2).replace('.', ',')} €
                                </span>
                            </>
                        )}
                    </div>

                    {(isPreorderSoon || isUnavailable) ? (
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-mayssa-brown/30 text-mayssa-brown/60 flex-shrink-0 cursor-not-allowed" title={isPreorderSoon ? 'Disponible à partir du 14 février 2026' : !isPreorderDay ? `Dispo ${dayNames}` : 'Rupture de stock'}>
                            <Calendar size={20} className="sm:w-6 sm:h-6" />
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onAdd(product)
                            }}
                            className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-mayssa-brown text-mayssa-cream shadow-lg transition-all hover:scale-110 hover:bg-mayssa-caramel active:scale-95 flex-shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-cream focus-visible:ring-offset-2"
                        >
                            <Plus size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    )}
                </div>
            </div>
            </div>
        </motion.article>
    )
}
