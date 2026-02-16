import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import type { Product, ProductSize } from '../types'
import { cn } from '../lib/utils'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { useFocusTrap } from '../hooks/useAccessibility'

interface SizeSelectorModalProps {
    product: Product | null
    onClose: () => void
    onSelect: (product: Product, size: ProductSize) => void
}

export function SizeSelectorModal({ product, onClose, onSelect }: SizeSelectorModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)
    const isOpen = !!(product && product.sizes)
    useEscapeKey(onClose, isOpen)
    useFocusTrap(modalRef, isOpen, onClose)

    if (!product || !product.sizes) return null

    return (
        <AnimatePresence>
            {product && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Choisir la taille – ${product.name}`}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fermer"
                                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/75 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95 cursor-pointer"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>

                            {/* Product image */}
                            {product.image && (
                                <div className="relative h-48 sm:h-56 overflow-hidden bg-mayssa-cream/50">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        width={200}
                                        height={200}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5 sm:p-6 space-y-4 sm:space-y-5">
                                <div className="text-center space-y-1">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
                                        {product.category}
                                    </p>
                                    <h3 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                                        {product.name}
                                    </h3>
                                    {product.description && (
                                        <p className="text-xs sm:text-sm text-mayssa-brown/80">
                                            {product.description}
                                        </p>
                                    )}
                                </div>

                                {/* Size selection */}
                                <div className="space-y-2 sm:space-y-3">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/75 text-center">
                                        Choisissez votre format
                                    </p>
                                    <div className={cn(
                                        "grid gap-2 sm:gap-3",
                                        product.sizes?.length === 2 ? "grid-cols-2" : "grid-cols-3"
                                    )}>
                                        {product.sizes?.map((size) => (
                                            <button
                                                type="button"
                                                key={size.ml}
                                                onClick={() => onSelect(product, size)}
                                                aria-label={`Choisir ${product.name} - ${size.ml} ml à ${size.price.toFixed(2)} €`}
                                                className={cn(
                                                    "group relative flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer",
                                                    "bg-mayssa-soft/60 hover:bg-mayssa-caramel hover:text-white",
                                                    "border-2 border-transparent hover:border-mayssa-caramel",
                                                    "shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
                                                )}
                                            >
                                                <span className="text-lg sm:text-xl font-display font-bold text-mayssa-brown group-hover:text-white transition-colors">
                                                    {size.price.toFixed(2).replace('.', ',')} €
                                                </span>
                                                <span className="text-[10px] sm:text-xs font-bold text-mayssa-brown/80 group-hover:text-white/90 transition-colors text-center">
                                                    {size.label}
                                                </span>
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-mayssa-caramel shadow-lg">
                                                        <Check size={12} strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Note about coulis for Mini Gourmandises */}
                                {product.category === 'Mini Gourmandises' && (
                                    <div className="rounded-xl bg-mayssa-soft/50 p-3 space-y-1.5">
                                        <p className="text-[10px] sm:text-xs font-bold text-mayssa-brown/80 text-center">
                                            🍯 Coulis inclus au choix
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-mayssa-brown/75 text-center">
                                            Petite : jusqu'à 2 parfums • Grande : jusqu'à 4 parfums
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-mayssa-brown/50 text-center">
                                            Nutella, Crème Bueno, Spéculoos, Pistache (+0,50€/parfum suppl.)
                                        </p>
                                    </div>
                                )}

                                {/* Note about customization for Tiramisus */}
                                {product.category === 'Tiramisus' && (
                                    <div className="rounded-xl bg-mayssa-soft/50 p-3 sm:p-4 space-y-3">
                                        <p className="text-[10px] sm:text-xs font-bold text-mayssa-brown/80 text-center">
                                            🥮 Choix de la base
                                        </p>
                                        <p className="text-[9px] sm:text-[10px] text-mayssa-brown/75 text-center leading-relaxed">
                                            Biscuit cuillère nature • Biscuit cuillère café<br />
                                            Gâteau Spéculoos • Gâteau Oreo
                                        </p>
                                        <div className="border-t border-mayssa-brown/10 pt-2 space-y-1.5">
                                            <p className="text-[10px] sm:text-xs font-bold text-mayssa-brown/80 text-center">
                                                🍓 Toppings inclus
                                            </p>
                                            <p className="text-[9px] sm:text-[10px] text-mayssa-brown/75 text-center">
                                                2 toppings au choix
                                            </p>
                                            <p className="text-[9px] sm:text-[10px] text-mayssa-brown/50 text-center leading-relaxed">
                                                Oreo, Spéculoos, Kinder Bueno, Nutella, Fraise, Mangue, Passion, Framboise, Caramel, Daim, Cacao
                                            </p>
                                            <p className="text-[9px] sm:text-[10px] text-mayssa-brown/50 text-center font-semibold">
                                                ➕ Topping supplémentaire : 0,50 €
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-center text-[10px] sm:text-xs text-mayssa-brown/50">
                                    Cliquez sur un format pour l'ajouter au panier
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
