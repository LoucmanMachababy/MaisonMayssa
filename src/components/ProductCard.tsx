import { motion } from 'framer-motion'
import { Plus, ShoppingCart, Star, CalendarClock, Info, Pin } from 'lucide-react'
import type { Product } from '../types'
import { use3DTilt } from '../hooks/use3DTilt'
import { useReviews } from '../hooks/useReviews'
import { isPreorderNotYetAvailable } from '../lib/utils'
import { ProductBadges } from './ProductBadges'
import { BlurImage } from './BlurImage'
import { StockBadge } from './StockBadge'
import { NotifyWhenAvailable } from './NotifyWhenAvailable'
import { cn } from '../lib/utils'
import { hapticFeedback } from '../lib/haptics'
import { formatDateLabel } from '../lib/delivery'

interface ProductCardProps {
    product: Product
    onAdd: (product: Product) => void
    onViewDetail?: (product: Product) => void
    stock?: number | null
    isPreorderDay?: boolean
    dayNames?: string
    preorderOpenDate?: string
    preorderOpenTime?: string
    priority?: boolean
    highlightAsNew?: boolean
    size?: 'default' | 'large'
}

export function ProductCard({ 
    product, 
    onAdd, 
    onViewDetail, 
    stock = null, 
    isPreorderDay = true, 
    dayNames = '', 
    preorderOpenDate, 
    preorderOpenTime, 
    priority = false, 
    highlightAsNew = false, 
    size = 'default' 
}: ProductCardProps) {
    const { ref, style, handlers } = use3DTilt(8)
    const { getAverageRatingForProduct, getReviewCountForProduct } = useReviews()
    const isPreorderSoon = isPreorderNotYetAvailable(product)
    const showBientotDispo = product.preorder && !product.image
    const isTrompeLoeil = product.category === "Trompe l'œil"
    const isStockManaged = stock !== null
    const isUnavailable = isStockManaged && (stock <= 0 || (isTrompeLoeil && !isPreorderDay))

    const openingBannerLabel = (() => {
        if (!isTrompeLoeil || !preorderOpenDate) return null
        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        let closed = false
        if (preorderOpenDate > todayStr) {
            closed = true
        } else if (preorderOpenDate === todayStr) {
            const [h, m] = (preorderOpenTime ?? '00:00').split(':').map(Number)
            closed = now.getHours() * 60 + now.getMinutes() < (h ?? 0) * 60 + (m ?? 0)
        }
        if (!closed) return null
        const dateLabel = formatDateLabel(preorderOpenDate)
        return preorderOpenTime && preorderOpenTime !== '00:00'
            ? `Ouverture ${dateLabel} à ${preorderOpenTime}`
            : `Ouverture ${dateLabel}`
    })()
    
    const productRating = isTrompeLoeil ? getAverageRatingForProduct(product.id) : null
    const productReviewCount = isTrompeLoeil ? getReviewCountForProduct(product.id) : 0

    return (
        <motion.article
            layout
            role="button"
            tabIndex={0}
            aria-label={isUnavailable ? `${product.name} — Indisponible` : `Ajouter ${product.name} au panier`}
            onClick={() => {
                if (isUnavailable && onViewDetail) {
                    hapticFeedback('light')
                    onViewDetail(product)
                } else if (!isPreorderSoon && !isUnavailable) {
                    hapticFeedback('medium')
                    onAdd(product)
                }
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true, margin: "-50px" }}
            className={cn(
                "group relative flex flex-col overflow-hidden transition-all duration-[600ms] ease-lux bg-white/70",
                size === 'large' ? "rounded-[2.5rem] p-4 sm:p-5" : "rounded-[2rem] p-3 sm:p-4",
                "hover:bg-white hover:shadow-[0_15px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2",
                isUnavailable && onViewDetail && "cursor-pointer",
                isUnavailable && !onViewDetail && "cursor-default opacity-80 grayscale-[0.2]",
                !isUnavailable && "cursor-pointer active:scale-[0.98]",
                highlightAsNew && "ring-1 ring-mayssa-gold/30 bg-white"
            )}
        >
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                {onViewDetail && (
                    <motion.button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            hapticFeedback('light')
                            onViewDetail(product)
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur shadow-sm text-mayssa-brown hover:text-mayssa-gold transition-colors border border-black/5"
                        aria-label={`Voir les détails de ${product.name}`}
                    >
                        <Info size={18} strokeWidth={2} />
                    </motion.button>
                )}
            </div>

            <div
                ref={ref}
                style={style}
                {...handlers}
                className="flex flex-col h-full relative z-10 gap-4 sm:gap-5"
            >
                <div className={cn(
                  "relative overflow-hidden rounded-[1.5rem] bg-mayssa-soft/50 transition-transform duration-700 ease-lux",
                  size === 'large' ? "aspect-[4/5]" : "aspect-square"
                )}>
                    {product.badges?.length ? (
                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                            <ProductBadges badges={product.badges} variant="card" />
                        </div>
                    ) : null}
                    
                    {product.pinned ? (
                        <div className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mayssa-gold text-white shadow-md">
                            <Pin size={14} className="-rotate-12" fill="currentColor" />
                        </div>
                    ) : null}

                    {product.image ? (
                        <BlurImage
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                            priority={priority}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-mayssa-brown/20">
                            {showBientotDispo ? (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-mayssa-gold animate-pulse">Bientôt</span>
                            ) : (
                                <ShoppingCart size={32} strokeWidth={1} />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col flex-1 px-1">
                    <div className="space-y-1.5 sm:space-y-2">
                        <h4 className={cn("font-display font-medium text-mayssa-brown group-hover:text-mayssa-gold transition-colors duration-500", size === 'large' ? "text-2xl" : "text-xl")}>
                            {product.name}
                        </h4>
                        
                        <p className="font-sans font-light text-mayssa-brown/60 line-clamp-2 text-xs sm:text-sm leading-relaxed">
                            {product.description || 'Une création Maison Mayssa.'}
                        </p>
                        
                        {productRating != null && productReviewCount > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                                <div className="flex gap-0.5 text-mayssa-gold">
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <Star key={v} size={10} className={cn(v <= Math.round(productRating) ? "fill-current" : "text-mayssa-brown/10")} />
                                    ))}
                                </div>
                                <span className="text-[9px] uppercase tracking-widest text-mayssa-brown/40">{productReviewCount} avis</span>
                            </div>
                        )}
                        
                        {isStockManaged && (
                            <div className="pt-2">
                                <StockBadge stock={stock} isPreorderDay={isPreorderDay} dayNames={dayNames} isPreorderProduct={isTrompeLoeil} />
                            </div>
                        )}
                        
                        {openingBannerLabel && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <CalendarClock size={12} className="text-mayssa-gold" />
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-mayssa-gold">{openingBannerLabel}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-5 flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-0.5">
                            {isPreorderSoon && product.preorder ? (
                                <>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-mayssa-gold">Précommande</span>
                                    <span className="text-[10px] text-mayssa-brown/50 font-medium">
                                        Retrait le {(() => {
                                            const now = new Date()
                                            const day = now.getDay()
                                            const daysUntil = day === 6 ? 4 : day === 3 ? 3 : 3
                                            const pickup = new Date(now)
                                            pickup.setDate(pickup.getDate() + daysUntil)
                                            return pickup.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                        })()}
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-baseline gap-2">
                                    <span className={cn("font-display text-mayssa-brown transition-colors duration-500", size === 'large' ? "text-2xl" : "text-xl")}>
                                        {product.price.toFixed(2).replace('.', ',')}
                                        <span className="text-sm ml-1 opacity-70">€</span>
                                    </span>
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <span className="text-xs text-mayssa-brown/30 line-through">
                                            {product.originalPrice.toFixed(2).replace('.', ',')}€
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {isUnavailable ? (
                            <div className="flex flex-col items-end gap-1.5">
                                <NotifyWhenAvailable product={product} className="text-right opacity-70 hover:opacity-100 transition-opacity" />
                            </div>
                        ) : (
                            <motion.button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAdd(product)
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-mayssa-brown text-white shadow-md hover:bg-mayssa-gold transition-colors duration-300 flex-shrink-0"
                            >
                                <Plus size={20} strokeWidth={2} />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.article>
    )
}
