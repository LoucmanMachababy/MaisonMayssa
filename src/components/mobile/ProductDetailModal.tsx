import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import type { Product, ProductSize } from '../../types'
import { BOX_DECOUVERTE_TROMPE_PRODUCT_ID, isCustomizableTrompeBundleBoxId } from '../../constants'
import { ProductBadges } from '../ProductBadges'
import { StockBadge } from '../StockBadge'
import { useFocusTrap } from '../../hooks/useAccessibility'
import { Button } from '../ui/Button'
import { cn } from '../../lib/utils'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
  onAdd: (product: Product) => void
  stock?: number | null
  isPreorderDay?: boolean
  dayNames?: string
}

export function ProductDetailModal({ product, onClose, onAdd, stock = null, isPreorderDay = true, dayNames = '' }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [isZoomed, setIsZoomed] = useState(false)
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const imageRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, !!product, onClose)

  const isTrompeLoeil = product?.category === "Trompe l'œil"
  const isStockManaged = stock !== null
  const isUnavailable = isStockManaged && ((stock !== null && stock <= 0) || (isTrompeLoeil && !isPreorderDay))

  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0])
    } else {
      setSelectedSize(null)
    }
    setQuantity(1)
    setSelectedImageIndex(0)
  }, [product])

  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const currentPrice = selectedSize ? selectedSize.price : product?.price || 0

  const isBoxWithFlavors = product?.id === 'box-cookies' || product?.id === 'box-brownies' || product?.id === 'box-mixte'
  const isBoxTrompeAuChoix =
    product?.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID ||
    (!!product && isCustomizableTrompeBundleBoxId(product.id))

  const handleAdd = () => {
    if (!product) return
    if (isUnavailable) return
    hapticFeedback('success')

    if (isBoxWithFlavors || isBoxTrompeAuChoix) {
      onAdd(product)
      onClose()
      return
    }

    let productToAdd = product
    if (selectedSize && product.sizes && product.sizes.length > 0) {
      productToAdd = {
        ...product,
        id: `${product.id}-${selectedSize.ml}`,
        name: `${product.name} (${selectedSize.label})`,
        price: selectedSize.price,
      }
    }

    for (let i = 0; i < quantity; i++) {
      onAdd(productToAdd)
    }
    setQuantity(1)
    onClose()
  }

  const toggleZoom = () => {
    setIsZoomed(!isZoomed)
    hapticFeedback('light')
    if (isZoomed) {
      scale.set(1)
      x.set(0)
      y.set(0)
    } else {
      scale.set(2)
    }
  }

  if (!product) return null

  const images = (product as { images?: string[] }).images?.length
    ? (product as { images: string[] }).images!
    : product.image
      ? [product.image]
      : []

  const goToPrevImage = () => {
    if (images.length <= 1) return
    setSelectedImageIndex((i) => (i - 1 + images.length) % images.length)
    hapticFeedback('light')
  }
  const goToNextImage = () => {
    if (images.length <= 1) return
    setSelectedImageIndex((i) => (i + 1) % images.length)
    hapticFeedback('light')
  }

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key={product.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          {/* Backdrop */}
          <div
            onClick={() => { hapticFeedback('light'); onClose() }}
            className="absolute inset-0 bg-mayssa-brown/60 backdrop-blur-md cursor-pointer"
          />

          {/* Desktop Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="hidden md:flex fixed inset-x-8 top-[5vh] bottom-[5vh] max-w-6xl mx-auto bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image Section */}
            <div className="relative flex-1 bg-mayssa-soft overflow-hidden group">
              {images.length > 0 ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImageIndex}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      src={images[selectedImageIndex]}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </AnimatePresence>
                  
                  {images.length > 1 && (
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={goToPrevImage}
                        className="p-3 bg-white/80 backdrop-blur rounded-full text-mayssa-brown hover:bg-white transition-colors shadow-sm"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={goToNextImage}
                        className="p-3 bg-white/80 backdrop-blur rounded-full text-mayssa-brown hover:bg-white transition-colors shadow-sm"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImageIndex(i)}
                          className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            i === selectedImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag size={48} className="text-mayssa-brown/10" />
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="w-[45%] flex flex-col bg-white">
              <div className="flex justify-end p-6 pb-0">
                <button
                  onClick={onClose}
                  className="p-2 text-mayssa-brown/40 hover:text-mayssa-brown bg-mayssa-soft hover:bg-mayssa-brown/5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-mayssa-gold">
                        {product.category}
                      </span>
                      {product.badges?.length ? (
                        <ProductBadges badges={product.badges} variant="inline" />
                      ) : null}
                    </div>
                    
                    <h2 className="text-4xl font-display font-medium text-mayssa-brown leading-tight">
                      {product.name}
                    </h2>
                    
                    <p className="text-2xl font-light text-mayssa-caramel">
                      {currentPrice.toFixed(2).replace('.', ',')} €
                    </p>
                  </div>

                  <div className="w-12 h-[1px] bg-mayssa-gold/30" />

                  <p className="text-[15px] text-mayssa-brown/70 leading-relaxed font-light">
                    {product.description || "Une création artisanale Maison Mayssa."}
                  </p>

                  {isStockManaged && (
                    <div className="pt-2">
                      <StockBadge stock={stock ?? 0} isPreorderDay={isPreorderDay} dayNames={dayNames} compact={false} isPreorderProduct={!!isTrompeLoeil} />
                    </div>
                  )}

                  {!isBoxWithFlavors && product.sizes && product.sizes.length > 0 && (
                    <div className="space-y-3 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/40">Format</p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size.ml}
                            onClick={() => setSelectedSize(size)}
                            className={cn(
                              "px-5 py-2.5 rounded-xl text-sm transition-all border",
                              selectedSize?.ml === size.ml
                                ? "bg-mayssa-brown text-white border-mayssa-brown"
                                : "bg-transparent text-mayssa-brown border-mayssa-brown/10 hover:border-mayssa-brown/30"
                            )}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-8 border-t border-mayssa-brown/5 bg-mayssa-soft/50">
                {isBoxWithFlavors ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAdd}
                    disabled={isUnavailable}
                  >
                    Choisir mes parfums
                  </Button>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white rounded-full border border-mayssa-brown/10 shadow-sm p-1">
                      <button
                        onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                        className="w-10 h-10 flex items-center justify-center text-mayssa-brown/50 hover:text-mayssa-brown transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-mayssa-brown">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-mayssa-brown/50 hover:text-mayssa-brown transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <Button
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={handleAdd}
                      disabled={isUnavailable}
                    >
                      <ShoppingBag size={16} />
                      {isUnavailable ? 'Indisponible' : `Ajouter • ${(currentPrice * quantity).toFixed(2).replace('.', ',')} €`}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Mobile Modal */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[61] bg-white flex flex-col"
          >
            {/* Mobile Header / Actions */}
            <div className="absolute top-4 inset-x-4 z-20 flex justify-between">
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-mayssa-brown shadow-sm"
              >
                <X size={20} />
              </button>
              {images.length > 0 && (
                <button
                  onClick={toggleZoom}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md text-mayssa-brown shadow-sm"
                >
                  {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
                </button>
              )}
            </div>

            {/* Mobile Image Gallery */}
            <div className="relative h-[45vh] bg-mayssa-soft overflow-hidden" ref={imageRef}>
              {images.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={images[selectedImageIndex]}
                    style={{ scale, x, y }}
                    drag={isZoomed}
                    dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                    className="w-full h-full object-cover"
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                    onTouchEnd={(e) => {
                      if (images.length <= 1 || isZoomed) return
                      const diff = touchStartX.current - e.changedTouches[0].clientX
                      if (diff > 50) goToNextImage()
                      else if (diff < -50) goToPrevImage()
                    }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={48} className="text-mayssa-brown/10" />
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
                  {images.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        i === selectedImageIndex ? "bg-white w-4" : "bg-white/50 shadow-sm"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Info */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-mayssa-gold">
                  {product.category}
                </span>
                {product.badges?.length ? (
                  <ProductBadges badges={product.badges} variant="inline" />
                ) : null}
              </div>
              <h2 className="text-3xl font-display font-medium text-mayssa-brown leading-tight mb-2">
                {product.name}
              </h2>
              <p className="text-xl font-light text-mayssa-caramel mb-6">
                {currentPrice.toFixed(2).replace('.', ',')} €
              </p>
              <p className="text-sm text-mayssa-brown/70 leading-relaxed font-light mb-6">
                {product.description || "Une création artisanale Maison Mayssa."}
              </p>

              {isStockManaged && (
                <div className="mb-6">
                  <StockBadge stock={stock ?? 0} isPreorderDay={isPreorderDay} dayNames={dayNames} compact={false} isPreorderProduct={!!isTrompeLoeil} />
                </div>
              )}

              {!isBoxWithFlavors && product.sizes && product.sizes.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/40">Format</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size.ml}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "flex-1 min-w-[100px] px-4 py-3 rounded-xl text-sm transition-all border text-center",
                          selectedSize?.ml === size.ml
                            ? "bg-mayssa-brown text-white border-mayssa-brown"
                            : "bg-transparent text-mayssa-brown border-mayssa-brown/10"
                        )}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Actions Footer */}
            <div className="p-6 border-t border-black/5 bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
              {isBoxWithFlavors ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleAdd}
                  disabled={isUnavailable}
                >
                  Choisir mes parfums
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-mayssa-soft rounded-full p-1 border border-black/5">
                    <button
                      onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                      className="w-10 h-10 flex items-center justify-center text-mayssa-brown"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-mayssa-brown">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-10 h-10 flex items-center justify-center text-mayssa-brown"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 px-0"
                    onClick={handleAdd}
                    disabled={isUnavailable}
                  >
                    <ShoppingBag size={16} />
                    {isUnavailable ? 'Indisponible' : `Ajouter • ${(currentPrice * quantity).toFixed(2).replace('.', ',')} €`}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
