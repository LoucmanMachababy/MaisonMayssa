// import removed to resolve lint
import { motion } from 'framer-motion'
import { Plus, ShoppingCart, Calendar, Star, CalendarClock, Info, Pin } from 'lucide-react'
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
    /** Ouvre la modal détail (utilisé pour les produits en rupture) */
    onViewDetail?: (product: Product) => void
    stock?: number | null
    isPreorderDay?: boolean
    dayNames?: string
    /** Date d'ouverture des précommandes (YYYY-MM-DD). Affiché sur les trompe-l'œil si pas encore ouvert. */
    preorderOpenDate?: string
    /** Heure d'ouverture des précommandes (HH:mm). */
    preorderOpenTime?: string
    /** LCP: charger l'image en priorité (premières cartes above-the-fold) */
    priority?: boolean
    /** Cadre coloré "Nouveau" pour mettre en avant un produit */
    highlightAsNew?: boolean
    /** Taille plus grande pour la grille style Le Meurice */
    size?: 'default' | 'large'
}

export function ProductCard({ product, onAdd, onViewDetail, stock = null, isPreorderDay = true, dayNames = '', preorderOpenDate, preorderOpenTime, priority = false, highlightAsNew = false, size = 'default' }: ProductCardProps) {
    const { ref, style, handlers } = use3DTilt(8)
    const { getAverageRatingForProduct, getReviewCountForProduct } = useReviews()
    const isPreorderSoon = isPreorderNotYetAvailable(product)
    const showBientotDispo = product.preorder && !product.image
    const isTrompeLoeil = product.category === "Trompe l'œil"
    const isStockManaged = stock !== null
    const isUnavailable = isStockManaged && (stock <= 0 || (isTrompeLoeil && !isPreorderDay))

    // Label "Ouverture le X à Yh" — basé uniquement sur preorderOpenDate/Time (indépendant de isPreorderDay)
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, margin: "-50px" }}
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-[2.5rem] transition-all duration-700 will-change-transform bg-white/40 backdrop-blur-3xl border border-white/80 shadow-premium-shadow",
                size === 'large' ? "gap-6 p-6 sm:p-7" : "gap-5 p-5",
                isUnavailable && onViewDetail && "cursor-pointer",
                isUnavailable && !onViewDetail && "cursor-default opacity-80 grayscale-[0.3]",
                !isUnavailable && "cursor-pointer hover:-translate-y-3 hover:shadow-2xl hover:bg-white/60 active:scale-[0.98] premium-border",
                highlightAsNew &&
                    "ring-2 ring-mayssa-gold/55 bg-gradient-to-br from-mayssa-gold/[0.08] via-white/40 to-amber-50/30 shadow-[0_0_28px_-8px_rgba(201,162,39,0.45)]"
            )}
        >
            <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-[0.02] transition-opacity duration-1000 pointer-events-none" />

            {/* Action buttons */}
            <div className="absolute top-6 right-6 z-20 flex flex-col gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700 ease-out">
                {onViewDetail && (
                    <motion.button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            hapticFeedback('light')
                            onViewDetail(product)
                        }}
                        whileHover={{ scale: 1.15, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md shadow-premium-shadow text-mayssa-brown/60 hover:text-mayssa-gold transition-all duration-500 border border-white/40"
                        aria-label={`Voir les détails de ${product.name}`}
                    >
                        <Info size={20} />
                    </motion.button>
                )}
            </div>

            <div
                ref={ref}
                style={style}
                {...handlers}
                className={cn("flex flex-col h-full relative z-10", size === 'large' ? "gap-6" : "gap-5")}
            >
                <div className={cn(
                  "relative overflow-hidden shadow-inner group-hover:shadow-lg transition-all duration-1000",
                  size === 'large' ? "aspect-[3/4] rounded-[2rem]" : "aspect-[3/4] rounded-[1.8rem]",
                  isTrompeLoeil
                    ? "border-2 border-mayssa-brown/20 bg-mayssa-brown/5 ring-1 ring-mayssa-brown/10"
                    : "border border-white/60 bg-mayssa-soft/30"
                )}>
                    {product.badges?.length ? (
                        <ProductBadges badges={product.badges} variant="card" />
                    ) : null}
                    {product.pinned ? (
                        <div
                            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mayssa-gold/95 text-white shadow-lg border border-white/60"
                            title="À la une"
                        >
                            <Pin size={14} className="-rotate-12" fill="currentColor" aria-hidden />
                        </div>
                    ) : null}
                    {product.image ? (
                        <BlurImage
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                            priority={priority}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-mayssa-gold/30">
                            {showBientotDispo ? (
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-mayssa-gold animate-pulse">Dévoilement imminent</span>
                            ) : (
                                <ShoppingCart size={40} strokeWidth={1} />
                            )}
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </div>

                <div className={cn("flex flex-col flex-1 px-1", size === 'large' ? "gap-5" : "gap-4")}>
                    <div className={cn("space-y-3", size === 'large' && "space-y-4")}>
                        <div className="flex items-center justify-between gap-3">
                            <h4 className={cn("font-display font-medium leading-tight text-mayssa-brown group-hover:text-mayssa-gold transition-colors duration-700", size === 'large' ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")}>
                                {product.name}
                            </h4>
                            <div className="hidden sm:block h-[1px] flex-1 gold-gradient opacity-10" />
                        </div>
                        
                        <p className={cn("font-sans font-light text-mayssa-brown/60 line-clamp-2 leading-relaxed tracking-wide", size === 'large' ? "text-sm sm:text-base" : "text-xs sm:text-sm")}>
                            {product.description || 'Une signature Maison Mayssa, pensée pour l\'émotion.'}
                        </p>
                        
                        {productRating != null && productReviewCount > 0 && (
                            <div className="flex items-center gap-2 pt-1 group/rating">
                                <div className="flex gap-1 text-mayssa-gold">
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <Star key={v} size={12} className={cn("transition-all duration-500", v <= Math.round(productRating) ? "fill-current group-hover/rating:scale-110" : "text-mayssa-brown/5")} />
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/40">{productReviewCount} avis</span>
                            </div>
                        )}
                        
                        {isStockManaged && (
                            <div className="pt-1">
                                <StockBadge stock={stock} isPreorderDay={isPreorderDay} dayNames={dayNames} isPreorderProduct={isTrompeLoeil} />
                            </div>
                        )}
                        
                        {openingBannerLabel && (
                            <div className="flex items-center gap-2 mt-3 bg-mayssa-gold/5 w-fit px-4 py-2 rounded-xl border border-mayssa-gold/20 backdrop-blur-sm">
                                <CalendarClock size={14} className="text-mayssa-gold flex-shrink-0" />
                                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-mayssa-gold leading-tight">{openingBannerLabel}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-6 flex items-end justify-between gap-4 border-t border-mayssa-brown/5 group-hover:border-mayssa-gold/10 transition-colors duration-700">
                        <div className="flex flex-col gap-1.5">
                            {isPreorderSoon && product.preorder ? (
                                <>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mayssa-gold flex items-center gap-2">
                                        <Calendar size={14} strokeWidth={2.5} /> Précommande
                                    </span>
                                    <span className="text-[11px] text-mayssa-brown/50 font-bold uppercase tracking-widest">
                                        Collecte le {(() => {
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
                                <>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-mayssa-brown/30">
                                        {product.sizes ? 'De Collection' : 'Prix Signature'}
                                    </span>
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn("font-display font-medium text-mayssa-brown group-hover:text-mayssa-gold transition-colors duration-700", size === 'large' ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl")}>
                                            {product.price.toFixed(2).replace('.', ',')}
                                            <span className="text-lg ml-1 font-sans opacity-60">€</span>
                                        </span>
                                        {product.originalPrice && product.originalPrice > product.price && (
                                            <span className="text-sm text-mayssa-brown/30 line-through decoration-mayssa-gold/40">
                                                {product.originalPrice.toFixed(2).replace('.', ',')}€
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {isUnavailable ? (
                            <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-0">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mayssa-brown/5 text-mayssa-brown/20 border border-mayssa-brown/5">
                                    <Calendar size={24} strokeWidth={1.5} />
                                </div>
                                <NotifyWhenAvailable product={product} className="text-right transition-all duration-500 opacity-60 hover:opacity-100" />
                            </div>
                        ) : (
                            <motion.button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onAdd(product)
                                }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mayssa-brown text-white shadow-premium-shadow hover:bg-mayssa-gold transition-all duration-700 flex-shrink-0 group/btn relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover/btn:translate-y-[100%] transition-transform duration-1000" />
                                <Plus size={26} strokeWidth={2.5} className="relative z-10 group-hover/btn:rotate-90 transition-transform duration-700" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </motion.article>

    )
}
