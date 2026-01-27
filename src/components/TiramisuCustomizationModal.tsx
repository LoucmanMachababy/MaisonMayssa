import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useState } from 'react'
import type { Product, ProductSize } from '../types'
import { cn } from '../lib/utils'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface TiramisuCustomizationModalProps {
    product: Product | null
    onClose: () => void
    onSelect: (product: Product, size: ProductSize, base: string, allToppings: string[]) => void
}

const BASES = [
    'Biscuit cuillère nature',
    'Biscuit cuillère café',
    'Gâteau Spéculoos',
    'Gâteau Oreo',
]

const TOPPINGS = [
    'Oreo',
    'Spéculoos',
    'Kinder Bueno',
    'Nutella',
    'Fraise',
    'Mangue',
    'Passion',
    'Framboise',
    'Caramel',
    'Daim',
    'Cacao',
]

const EXTRA_TOPPING_PRICE = 0.5

export function TiramisuCustomizationModal({ product, onClose, onSelect }: TiramisuCustomizationModalProps) {
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
    const [selectedBase, setSelectedBase] = useState<string>('')
    const [selectedToppings, setSelectedToppings] = useState<string[]>([])

    useEscapeKey(onClose, !!(product && product.sizes))

    if (!product || !product.sizes) return null

    const canAddToCart = selectedSize && selectedBase && selectedToppings.length >= 2

    // Les 2 premiers sont inclus, les suivants sont payants
    const extraToppings = Math.max(0, selectedToppings.length - 2)
    const totalPrice = selectedSize 
        ? selectedSize.price + (extraToppings * EXTRA_TOPPING_PRICE)
        : 0

    const handleToppingToggle = (topping: string) => {
        setSelectedToppings((current) => {
            if (current.includes(topping)) {
                return current.filter((t) => t !== topping)
            }
            // On peut sélectionner autant de toppings qu'on veut
            return [...current, topping]
        })
    }

    const handleAddToCart = () => {
        if (!canAddToCart || !selectedSize) return

        onSelect(product, selectedSize, selectedBase, selectedToppings)
        onClose()
    }

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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 mx-auto max-w-md max-h-[90vh] overflow-y-auto"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95"
                            >
                                <X size={18} />
                            </button>

                            {/* Product image */}
                            {product.image && (
                                <div className="relative h-48 sm:h-56 overflow-hidden bg-mayssa-cream/50">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
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

                                {/* Size selection */}
                                <div className="space-y-2 sm:space-y-3">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 text-center">
                                        1. Choisissez votre format
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        {product.sizes?.map((size) => (
                                            <button
                                                key={size.ml}
                                                onClick={() => setSelectedSize(size)}
                                                className={cn(
                                                    "group relative flex flex-col items-center justify-center gap-1 sm:gap-2 rounded-2xl p-3 sm:p-4 transition-all cursor-pointer",
                                                    selectedSize?.ml === size.ml
                                                        ? "bg-mayssa-caramel text-white border-2 border-mayssa-caramel shadow-xl"
                                                        : "bg-mayssa-soft/60 hover:bg-mayssa-caramel hover:text-white border-2 border-transparent hover:border-mayssa-caramel",
                                                    "shadow-md hover:shadow-xl hover:scale-105 active:scale-95"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-lg sm:text-xl font-display font-bold transition-colors",
                                                    selectedSize?.ml === size.ml ? "text-white" : "text-mayssa-brown group-hover:text-white"
                                                )}>
                                                    {size.price.toFixed(2).replace('.', ',')} €
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] sm:text-xs font-bold transition-colors text-center",
                                                    selectedSize?.ml === size.ml ? "text-white/90" : "text-mayssa-brown/70 group-hover:text-white/90"
                                                )}>
                                                    {size.label}
                                                </span>
                                                {selectedSize?.ml === size.ml && (
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-mayssa-caramel shadow-lg">
                                                            <Check size={12} strokeWidth={3} />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Base selection */}
                                <div className="space-y-2 sm:space-y-3">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 text-center">
                                        2. 🥮 Choisissez votre base
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-2">
                                        {BASES.map((base) => (
                                            <button
                                                key={base}
                                                onClick={() => setSelectedBase(base)}
                                                className={cn(
                                                    "group relative flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 transition-all cursor-pointer text-left",
                                                    selectedBase === base
                                                        ? "bg-mayssa-caramel text-white border-2 border-mayssa-caramel shadow-lg"
                                                        : "bg-mayssa-soft/60 hover:bg-mayssa-caramel/10 border-2 border-transparent hover:border-mayssa-caramel/30",
                                                    "shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-[10px] sm:text-xs font-semibold transition-colors text-center",
                                                    selectedBase === base ? "text-white" : "text-mayssa-brown"
                                                )}>
                                                    {base}
                                                </span>
                                                {selectedBase === base && (
                                                    <Check size={14} className="text-white flex-shrink-0" strokeWidth={3} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toppings selection */}
                                <div className="space-y-2 sm:space-y-3">
                                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 text-center">
                                        3. 🍓 Toppings inclus (2 au choix)
                                    </p>
                                    <div className="grid grid-cols-3 gap-2 sm:gap-2">
                                        {TOPPINGS.map((topping) => {
                                            const isSelected = selectedToppings.includes(topping)
                                            const isIncluded = selectedToppings.indexOf(topping) < 2
                                            const isExtra = isSelected && !isIncluded
                                            return (
                                                <button
                                                    key={topping}
                                                    onClick={() => handleToppingToggle(topping)}
                                                    className={cn(
                                                        "group relative flex items-center justify-center gap-1 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 transition-all cursor-pointer",
                                                        isSelected
                                                            ? isExtra
                                                                ? "bg-mayssa-brown text-white border-2 border-mayssa-brown shadow-lg"
                                                                : "bg-mayssa-caramel text-white border-2 border-mayssa-caramel shadow-lg"
                                                            : "bg-mayssa-soft/60 hover:bg-mayssa-caramel/10 border-2 border-transparent hover:border-mayssa-caramel/30",
                                                        "shadow-sm hover:shadow-md"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "text-[9px] sm:text-[10px] font-semibold transition-colors text-center",
                                                        isSelected ? "text-white" : "text-mayssa-brown"
                                                    )}>
                                                        {topping}
                                                    </span>
                                                    {isSelected && (
                                                        <Check size={12} className="text-white flex-shrink-0" strokeWidth={3} />
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {selectedToppings.length > 0 && (
                                        <div className="space-y-1">
                                            <p className="text-[9px] sm:text-[10px] text-mayssa-brown/60 text-center">
                                                {Math.min(selectedToppings.length, 2)}/2 inclus
                                                {extraToppings > 0 && ` • ${extraToppings} supplémentaire${extraToppings > 1 ? 's' : ''} (+${(extraToppings * EXTRA_TOPPING_PRICE).toFixed(2).replace('.', ',')} €)`}
                                            </p>
                                            {selectedToppings.length >= 2 && (
                                                <p className="text-[9px] sm:text-[10px] text-mayssa-brown/50 text-center">
                                                    Vous pouvez ajouter des toppings supplémentaires en cliquant dessus
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Total price */}
                                {selectedSize && (
                                    <div className="rounded-xl bg-mayssa-soft/50 p-3 sm:p-4 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs sm:text-sm font-semibold text-mayssa-brown">
                                                Format
                                            </span>
                                            <span className="text-xs sm:text-sm font-bold text-mayssa-brown">
                                                {selectedSize.price.toFixed(2).replace('.', ',')} €
                                            </span>
                                        </div>
                                        {extraToppings > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs sm:text-sm font-semibold text-mayssa-brown">
                                                    Toppings supplémentaires ({extraToppings})
                                                </span>
                                                <span className="text-xs sm:text-sm font-bold text-mayssa-brown">
                                                    {(extraToppings * EXTRA_TOPPING_PRICE).toFixed(2).replace('.', ',')} €
                                                </span>
                                            </div>
                                        )}
                                        <div className="border-t border-mayssa-brown/20 pt-2 flex items-center justify-between">
                                            <span className="text-sm sm:text-base font-bold text-mayssa-brown">
                                                Total
                                            </span>
                                            <span className="text-lg sm:text-xl font-display font-bold text-mayssa-caramel">
                                                {totalPrice.toFixed(2).replace('.', ',')} €
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Add to cart button */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={!canAddToCart}
                                    className={cn(
                                        "w-full rounded-2xl py-3 sm:py-4 font-bold text-sm sm:text-base transition-all",
                                        canAddToCart
                                            ? "bg-mayssa-caramel text-white shadow-lg hover:bg-mayssa-brown hover:scale-105 active:scale-95"
                                            : "bg-mayssa-soft/50 text-mayssa-brown/40 cursor-not-allowed"
                                    )}
                                >
                                    {!selectedSize 
                                        ? "Sélectionnez un format"
                                        : !selectedBase
                                        ? "Sélectionnez une base"
                                        : selectedToppings.length < 2
                                        ? "Sélectionnez 2 toppings minimum"
                                        : "Ajouter au panier"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
