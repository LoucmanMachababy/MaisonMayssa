import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useMemo, useState, useRef, useEffect } from 'react'
import { useProducts } from '../hooks/useProducts'
import { Minus, Plus, ArrowLeft, Check, ShoppingBag, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProductAddFlow } from '../hooks/useProductAddFlow'
import { ProductAddModals } from '../components/product/ProductAddModals'
import { ProductAllergensBlock } from '../components/product/ProductAllergensBlock'
import { CartAddedToast } from '../components/product/CartAddedToast'
import { useCartStore } from '../lib/store'
import { cn } from '../lib/utils'
import type { Product } from '../types'
import {
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  isCustomizableTrompeBundleBoxId,
} from '../constants'
import { getProductDetail, getProductRecommendations } from '../lib/productDetails'
import { trackProductView } from '../lib/siteAnalytics'

export default function PremiumProduct() {
  const { id } = useParams()
  const { catalogProducts } = useProducts()
  const product = catalogProducts.find((p) => p.id === id)
  const addFlow = useProductAddFlow()
  const addItem = useCartStore((s) => s.addItem)
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0))
  const [quantity, setQuantity] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [pulseKey, setPulseKey] = useState(0)
  const [lastAddedQty, setLastAddedQty] = useState(1)
  const [toastProductName, setToastProductName] = useState<string | null>(null)
  const [addedRecIds, setAddedRecIds] = useState<Set<string>>(() => new Set())
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recBtnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
      if (recBtnTimerRef.current) clearTimeout(recBtnTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (product) trackProductView(product.id, product.name)
  }, [product?.id, product?.name])

  const catalogIds = useMemo(() => new Set(catalogProducts.map((p) => p.id)), [catalogProducts])

  const detail = useMemo(
    () => (product ? getProductDetail(product.id, product.description) : null),
    [product],
  )

  const recommendations = useMemo(
    () => (product ? getProductRecommendations(product.id, catalogIds) : []),
    [product, catalogIds],
  )

  const recommendedProducts = useMemo(
    () => recommendations.map((rid) => catalogProducts.find((p) => p.id === rid)).filter(Boolean),
    [recommendations, catalogProducts],
  )

  if (!product || !detail) {
    return (
      <div className="min-h-screen bg-mayssa-soft flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-mayssa-brown mb-4">Produit introuvable</h1>
          <Link to="/carte" className="text-mayssa-gold hover:underline">Retour à la carte</Link>
        </div>
      </div>
    )
  }

  const showCartToast = (name: string, recId?: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (recBtnTimerRef.current) clearTimeout(recBtnTimerRef.current)
    setToastProductName(name)
    if (recId) {
      setAddedRecIds((prev) => new Set(prev).add(recId))
      recBtnTimerRef.current = setTimeout(() => {
        setAddedRecIds((prev) => {
          const next = new Set(prev)
          next.delete(recId)
          return next
        })
      }, 2800)
    }
    toastTimerRef.current = setTimeout(() => setToastProductName(null), 4500)
  }

  const showAddedSuccess = (qty: number, productName: string) => {
    setLastAddedQty(qty)
    setPulseKey((k) => k + 1)
    setAddedFeedback(true)
    setQuantity(1)
    showCartToast(productName)
    window.setTimeout(() => setAddedFeedback(false), 6000)
  }

  const handleAddToCart = () => {
    if (!product.available) return
    const needsModal =
      product.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID ||
      isCustomizableTrompeBundleBoxId(product.id) ||
      (product.sizes && product.sizes.length > 0)
    if (needsModal) {
      addFlow.tryAddProduct(product, quantity)
      return
    }
    addItem(product, quantity)
    showAddedSuccess(quantity, product.name)
  }

  const handleQuickAdd = (rec: Product) => {
    if (!rec.available) return
    const needsModal =
      rec.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID ||
      isCustomizableTrompeBundleBoxId(rec.id) ||
      (rec.sizes && rec.sizes.length > 0)
    if (needsModal) {
      addFlow.tryAddProduct(rec, 1)
      return
    }
    addItem(rec, 1)
    showCartToast(rec.name, rec.id)
  }

  const metaDescription = detail.paragraphs[0]

  return (
    <div className="min-h-screen bg-mayssa-soft pt-[88px] lg:pt-[104px] pb-32">
      <Helmet>
        <title>{product.name} — Maison Mayssa</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={`https://maison-mayssa.fr/produit/${product.id}`} />
      </Helmet>
      <ProductAddModals flow={addFlow} />
      <CartAddedToast
        productName={toastProductName}
        cartCount={cartCount}
        onDismiss={() => setToastProductName(null)}
      />

      <div className="max-w-7xl mx-auto px-6">
        <Link
          to="/carte"
          className="inline-flex items-center gap-2 text-mayssa-brown/60 hover:text-mayssa-brown transition-colors text-sm tracking-widest uppercase mb-12"
        >
          <ArrowLeft size={16} /> Retour à la carte
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-mayssa-marble w-full overflow-hidden group">
              <img
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-700 ${product.images && product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
              />
              {product.images && product.images.length > 1 && (
                <img
                  src={product.images[1]}
                  alt={`${product.name} vue 2`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {product.images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-mayssa-marble overflow-hidden">
                    <img src={img} alt={`${product.name} vue ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-8">
              <span className="text-mayssa-gold text-xs tracking-widest uppercase mb-4 block">{product.category}</span>
              <h1 className="font-display text-4xl md:text-5xl text-mayssa-brown mb-3">{product.name}</h1>
              <p className="text-mayssa-brown/50 font-light italic mb-4">{detail.tagline}</p>
              <p className="text-2xl text-mayssa-brown font-light">
                {product.price.toFixed(2).replace('.', ',')} €
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="ml-3 text-base text-mayssa-brown/35 line-through">
                    {product.originalPrice.toFixed(2).replace('.', ',')} €
                  </span>
                )}
              </p>
            </div>

            <div className="mb-10 space-y-5">
              {detail.paragraphs.map((para, i) => (
                <p key={i} className="text-mayssa-brown/75 leading-relaxed font-light text-base md:text-lg">
                  {para}
                </p>
              ))}

              {detail.composition.length > 0 && (
                <div className="pt-4 border-t border-mayssa-brown/8">
                  <h2 className="text-[10px] tracking-[0.3em] uppercase text-mayssa-brown/40 mb-4">Composition</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detail.composition.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-mayssa-brown/70">
                        <span className="w-1 h-1 bg-mayssa-gold shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.conservation && (
                <p className="text-xs text-mayssa-brown/45 leading-relaxed border-l-2 border-mayssa-gold/30 pl-4">
                  {detail.conservation}
                </p>
              )}

              <ProductAllergensBlock productId={product.id} category={product.category} />
            </div>

            {product.available ? (
              <div className="relative bg-white p-8 border border-mayssa-brown/5 mt-auto">
                <AnimatePresence>
                  {addedFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="mb-6 p-4 bg-emerald-50 border border-emerald-200/80"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-500 text-white flex items-center justify-center">
                          <Check size={16} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-900">Ajouté à votre précommande</p>
                          <p className="text-xs text-emerald-700/80">
                            {cartCount} article{cartCount > 1 ? 's' : ''} dans le panier
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={() => setAddedFeedback(false)}
                          className="flex-1 py-3 border border-mayssa-brown/15 text-mayssa-brown text-xs tracking-widest uppercase hover:border-mayssa-gold hover:text-mayssa-gold transition-colors"
                        >
                          Continuer mes achats
                        </button>
                        <Link
                          to="/panier"
                          className="flex-1 py-3 bg-mayssa-brown text-white text-xs tracking-widest uppercase hover:bg-mayssa-espresso transition-colors text-center inline-flex items-center justify-center gap-2"
                        >
                          <ShoppingBag size={14} />
                          Voir le panier
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-6 mb-6">
                  <div className="relative flex items-center border border-mayssa-brown/20">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center text-mayssa-brown/60 hover:text-mayssa-brown hover:bg-mayssa-soft transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-12 text-center text-mayssa-brown">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center text-mayssa-brown/60 hover:text-mayssa-brown hover:bg-mayssa-soft transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={pulseKey}
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={{ opacity: 0, y: -28, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute -top-2 right-2 pointer-events-none text-sm font-bold text-mayssa-gold"
                      >
                        +{lastAddedQty}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="text-xl text-mayssa-brown font-medium">
                    {(product.price * quantity).toFixed(2).replace('.', ',')} €
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors duration-300 overflow-hidden"
                >
                  Ajouter à la précommande
                </motion.button>

                <p className="text-center text-xs text-mayssa-brown/50 mt-4">
                  Retrait sur créneau. Quantités limitées.
                </p>
              </div>
            ) : (
              <div className="bg-mayssa-brown/5 p-8 border border-mayssa-brown/10 mt-auto text-center">
                <h3 className="font-display text-xl text-mayssa-brown mb-2">Bientôt disponible</h3>
                <p className="text-mayssa-brown/60 text-sm">
                  Cette création sera bientôt proposée à la précommande.
                </p>
              </div>
            )}
          </div>
        </div>

        {recommendedProducts.length > 0 && product.available && (
          <section className="mt-24 pt-16 border-t border-mayssa-brown/8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-3 block">
                  Complétez votre commande
                </span>
                <h2 className="font-display text-2xl md:text-3xl text-mayssa-brown">
                  Souvent commandé avec
                </h2>
              </div>
              <Link
                to="/carte"
                className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-mayssa-brown/50 hover:text-mayssa-gold transition-colors"
              >
                Toute la carte <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recommendedProducts.map((rec) => rec && (
                <div
                  key={rec.id}
                  className={cn(
                    'group bg-white border overflow-hidden transition-colors',
                    addedRecIds.has(rec.id)
                      ? 'border-emerald-300/80 shadow-[0_8px_32px_rgba(16,185,129,0.12)]'
                      : 'border-mayssa-brown/8 hover:border-mayssa-gold/35',
                  )}
                >
                  <Link to={`/produit/${rec.id}`} className="block">
                    <div className="relative aspect-square bg-mayssa-marble overflow-hidden">
                      <img
                        src={rec.image}
                        alt={rec.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <AnimatePresence>
                        {addedRecIds.has(rec.id) && (
                          <motion.span
                            initial={{ opacity: 1, y: 0, scale: 1 }}
                            animate={{ opacity: 0, y: -36, scale: 1.15 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.75, ease: 'easeOut' }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)] pointer-events-none"
                          >
                            +1
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                  <div className="p-5">
                    <Link to={`/produit/${rec.id}`}>
                      <h3 className="font-display text-lg text-mayssa-brown mb-1 group-hover:text-mayssa-gold transition-colors">
                        {rec.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-mayssa-brown/50 mb-2">
                      {rec.price.toFixed(2).replace('.', ',')} €
                    </p>
                    <div className="mb-4">
                      <ProductAllergensBlock productId={rec.id} category={rec.category} compact />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickAdd(rec)}
                        className={cn(
                          'flex-1 py-2.5 text-[10px] tracking-widest uppercase transition-colors inline-flex items-center justify-center gap-1.5',
                          addedRecIds.has(rec.id)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-mayssa-brown text-white hover:bg-mayssa-espresso',
                        )}
                      >
                        {addedRecIds.has(rec.id) ? (
                          <>
                            <Check size={14} strokeWidth={3} />
                            Ajouté
                          </>
                        ) : (
                          '+ Ajouter'
                        )}
                      </button>
                      <Link
                        to={`/produit/${rec.id}`}
                        className="px-4 py-2.5 border border-mayssa-brown/15 text-mayssa-brown/60 text-[10px] tracking-widest uppercase hover:border-mayssa-gold transition-colors inline-flex items-center"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
