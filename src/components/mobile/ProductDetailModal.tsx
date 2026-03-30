import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import type { Product, ProductSize } from '../../types'
import { BOX_DECOUVERTE_TROMPE_PRODUCT_ID, isCustomizableTrompeBundleBoxId } from '../../constants'
import { ProductBadges } from '../ProductBadges'
import { StockBadge } from '../StockBadge'
import { useFocusTrap } from '../../hooks/useAccessibility'

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

  // Reset selected size and image when product changes
  useEffect(() => {
    if (product?.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0])
    } else {
      setSelectedSize(null)
    }
    setQuantity(1)
    setSelectedImageIndex(0)
  }, [product])

  // Pinch-to-zoom
  const scale = useMotionValue(1)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Get the current price based on selection
  const currentPrice = selectedSize ? selectedSize.price : product?.price || 0

  // Box cookies / brownies / mixte : onAdd ouvre la modal parfums (il faut passer le produit original)
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

    // If product has sizes and one is selected, create a modified product
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
          className="fixed inset-0 z-[60]"
        >
          {/* Backdrop */}
          <div
            onClick={() => { hapticFeedback('light'); onClose() }}
            className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Desktop: modal centré images gauche / description droite */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="hidden md:flex fixed inset-4 z-[61] m-auto max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Images gauche — galerie avec cadre sombre pour trompe l'œil */}
            <div className={`flex-1 min-w-0 flex flex-col items-center justify-center p-6 ${product.category === "Trompe l'œil" ? 'bg-mayssa-brown/10' : 'bg-mayssa-soft/30'}`}>
              {images.length > 0 ? (
                <>
                  <div
                    className="relative flex-1 flex items-center justify-center w-full min-h-[280px] select-none"
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                    onTouchEnd={(e) => {
                      if (images.length <= 1) return
                      const diff = touchStartX.current - e.changedTouches[0].clientX
                      if (Math.abs(diff) > 50) {
                        if (diff > 0) goToNextImage()
                        else goToPrevImage()
                      }
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        src={images[selectedImageIndex]}
                        alt={`${product.name} — vue ${selectedImageIndex + 1}`}
                        className={`relative z-0 max-h-full max-w-full object-contain rounded-xl pointer-events-none ${product.category === "Trompe l'œil" ? 'ring-2 ring-mayssa-brown/20' : ''}`}
                      />
                    </AnimatePresence>
                    {images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goToPrevImage}
                          className="absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-mayssa-brown text-white shadow-xl hover:bg-mayssa-brown/90 transition-colors cursor-pointer border-2 border-white"
                          aria-label="Image précédente"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          type="button"
                          onClick={goToNextImage}
                          className="absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-mayssa-brown text-white shadow-xl hover:bg-mayssa-brown/90 transition-colors cursor-pointer border-2 border-white"
                          aria-label="Image suivante"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-mayssa-brown text-white text-xs font-bold shadow-lg">
                          {selectedImageIndex + 1} / {images.length}
                        </span>
                      </>
                    )}
                  </div>
                  {images.length > 1 && (
                    <div className="flex gap-2 mt-4 flex-wrap justify-center">
                      {images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setSelectedImageIndex(i); hapticFeedback('light') }}
                          className={`overflow-hidden rounded-lg transition-all cursor-pointer border-2 ${
                            i === selectedImageIndex
                              ? 'border-mayssa-brown ring-2 ring-mayssa-gold/50 ring-offset-2'
                              : 'border-transparent opacity-60 hover:opacity-100 hover:border-mayssa-brown/30'
                          }`}
                        >
                          <img src={img} alt={`Vue ${i + 1}`} className="h-14 w-14 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-64 bg-mayssa-cream/10 rounded-xl">
                  <ShoppingBag size={64} className="text-mayssa-brown/20" />
                </div>
              )}
            </div>

            {/* Description droite */}
            <div className="w-[45%] min-w-[320px] flex flex-col p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-2xl font-display font-bold text-mayssa-brown">{product.name}</h2>
                <button
                  onClick={() => { hapticFeedback('light'); onClose() }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-mayssa-brown/5 text-mayssa-brown hover:bg-mayssa-brown hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-mayssa-brown/70 leading-relaxed mb-4">
                {product.description || "Pâtisserie artisanale préparée avec amour chez Maison Mayssa. Ingrédients frais et de qualité."}
              </p>
              {isStockManaged && (
                <div className="mb-4">
                  <StockBadge stock={stock ?? 0} isPreorderDay={isPreorderDay} dayNames={dayNames} compact={false} isPreorderProduct={!!isTrompeLoeil} />
                </div>
              )}
              {!isBoxWithFlavors && product.sizes && product.sizes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-mayssa-brown/60 mb-2">Choisir une taille</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size) => {
                      const isSelected = selectedSize?.ml === size.ml
                      return (
                        <button
                          key={size.ml}
                          onClick={() => { setSelectedSize(size); hapticFeedback('light') }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            isSelected ? 'bg-mayssa-brown text-mayssa-cream' : 'bg-mayssa-cream text-mayssa-brown hover:bg-mayssa-brown/10'
                          }`}
                        >
                          {size.label} - {size.price.toFixed(2).replace('.', ',')} €
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="mt-auto pt-4 flex items-center gap-4">
                <div className="flex items-center gap-2 bg-mayssa-cream rounded-xl px-3 py-2">
                  <button
                    onClick={() => quantity > 1 && setQuantity(q => q - 1)}
                    disabled={quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-mayssa-brown disabled:opacity-40 cursor-pointer"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-bold text-mayssa-brown">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-mayssa-brown text-mayssa-cream cursor-pointer"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="text-xl font-bold text-mayssa-caramel">
                  {(currentPrice * quantity).toFixed(2).replace('.', ',')} €
                </span>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  disabled={isUnavailable}
                  className={`flex-1 py-3 rounded-xl font-bold cursor-pointer ${isUnavailable ? 'bg-mayssa-brown/30 text-mayssa-brown/60 cursor-not-allowed' : 'bg-mayssa-brown text-mayssa-cream'}`}
                >
                  {isUnavailable ? 'Indisponible' : 'Ajouter au panier'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Mobile: plein écran */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={product.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[61] bg-black"
          >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <button
              onClick={() => { hapticFeedback('light'); onClose() }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="flex gap-2">
              <button
                onClick={toggleZoom}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white cursor-pointer"
              >
                {isZoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
              </button>
            </div>
          </div>

          {/* Image with zoom — galerie mobile (swipe pour défiler) */}
          <motion.div
            ref={imageRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
            onTouchEnd={(e) => {
              if (images.length <= 1) return
              const diff = touchStartX.current - e.changedTouches[0].clientX
              if (Math.abs(diff) > 50) {
                if (diff > 0) goToNextImage()
                else goToPrevImage()
              }
            }}
          >
            {images.length > 0 ? (
              <>
                    {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevImage}
                      className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-mayssa-brown text-white shadow-xl cursor-pointer border-2 border-white"
                      aria-label="Image précédente"
                    >
                      <ChevronLeft size={26} />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextImage}
                      className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-mayssa-brown text-white shadow-xl cursor-pointer border-2 border-white"
                      aria-label="Image suivante"
                    >
                      <ChevronRight size={26} />
                    </button>
                    <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-black/50 text-white text-xs font-bold">
                        {selectedImageIndex + 1} / {images.length}
                      </span>
                    </div>
                  </>
                )}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={images[selectedImageIndex]}
                    alt={`${product.name} — vue ${selectedImageIndex + 1}`}
                    style={{ scale, x, y }}
                    drag={isZoomed}
                    dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                    className="relative z-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-mayssa-cream/10">
                <ShoppingBag size={80} className="text-white/20" />
              </div>
            )}

          </motion.div>

          {/* Product info panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
          >
            {/* Category & badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 rounded-full bg-mayssa-caramel/10 text-mayssa-caramel text-[10px] font-bold uppercase tracking-wider">
                {product.category}
              </span>
              {product.badges?.length ? (
                <ProductBadges badges={product.badges} variant="inline" />
              ) : null}
            </div>

            {/* Name & Price */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-xl font-display font-bold text-mayssa-brown">
                {product.name}
              </h2>
              <span className="text-2xl font-bold text-mayssa-caramel whitespace-nowrap">
                {currentPrice.toFixed(2).replace('.', ',')} €
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-mayssa-brown/70 leading-relaxed mb-4">
              {product.description || "Pâtisserie artisanale préparée avec amour chez Maison Mayssa. Ingrédients frais et de qualité."}
            </p>

            {isStockManaged && (
              <div className="mb-4">
                <StockBadge stock={stock ?? 0} isPreorderDay={isPreorderDay} dayNames={dayNames} compact={false} isPreorderProduct={!!isTrompeLoeil} />
              </div>
            )}

            {/* Sizes if available (masqué pour les boxes parfums : taille + parfums dans la modal dédiée) */}
            {!isBoxWithFlavors && product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-mayssa-brown/60 mb-2">Choisir une taille</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize?.ml === size.ml
                    return (
                      <motion.button
                        key={size.ml}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedSize(size)
                          hapticFeedback('light')
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-mayssa-brown text-mayssa-cream shadow-lg'
                            : 'bg-mayssa-cream text-mayssa-brown hover:bg-mayssa-brown/10'
                        }`}
                      >
                        {size.label} - {size.price.toFixed(2).replace('.', ',')} €
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Pour les boxes parfums : un seul bouton qui ouvre la modal choix parfums */}
            {isBoxWithFlavors && (
              <div className="mb-4">
                <p className="text-sm text-mayssa-brown/70 mb-3">
                  Choisissez la taille puis vos parfums dans l’étape suivante.
                </p>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  disabled={isUnavailable}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-xl cursor-pointer ${isUnavailable ? 'bg-mayssa-brown/30 text-mayssa-brown/60 cursor-not-allowed' : 'bg-mayssa-brown text-mayssa-cream'}`}
                >
                  <ShoppingBag size={18} />
                  <span>Choisir mes parfums</span>
                </motion.button>
              </div>
            )}

            {/* Quantity & Add button (masqués pour les boxes parfums) */}
            {!isBoxWithFlavors && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-mayssa-cream rounded-xl px-3 py-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (quantity > 1) {
                      setQuantity(q => q - 1)
                      hapticFeedback('light')
                    }
                  }}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-mayssa-brown disabled:opacity-40 cursor-pointer"
                >
                  <Minus size={16} />
                </motion.button>
                <span className="w-8 text-center font-bold text-lg text-mayssa-brown">
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setQuantity(q => q + 1)
                    hapticFeedback('light')
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-mayssa-brown text-mayssa-cream cursor-pointer"
                >
                  <Plus size={16} />
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAdd}
                disabled={isUnavailable}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold shadow-xl cursor-pointer ${isUnavailable ? 'bg-mayssa-brown/30 text-mayssa-brown/60 cursor-not-allowed' : 'bg-mayssa-brown text-mayssa-cream'}`}
              >
                <ShoppingBag size={18} />
                <span>{isUnavailable ? 'Indisponible' : `Ajouter • ${(currentPrice * quantity).toFixed(2).replace('.', ',')} €`}</span>
              </motion.button>
            </div>
            )}
          </motion.div>
        </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
