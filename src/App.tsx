import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useFavorites } from './hooks/useFavorites'
import { Navbar } from './components/Navbar'
import { BirthdayBanner } from './components/BirthdayBanner'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { Cart } from './components/Cart'
import { Footer } from './components/Footer'
import { ToastContainer, type Toast } from './components/Toast'
import { PromoBanner } from './components/PromoBanner'
import { Confetti, useConfetti } from './components/effects'
import { OfflineIndicator } from './components/OfflineIndicator'
import { CookieBanner } from './components/CookieBanner'
import { InstagramInstructionModal } from './components/InstagramInstructionModal'
import { SnapInstructionModal } from './components/SnapInstructionModal'
import { FloatingCartBar } from './components/FloatingCartBar'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })))
import { ResourcePreloader, defaultPreloadConfig } from './components/ResourcePreloader'
import { AccessibilityProvider, AccessibilityControls } from './components/AccessibilityProvider'
import { SkipLinks } from './components/SkipLinks'
import { FidelityWelcomeModal, FidelityWelcomeBanner } from './components/FidelityWelcomeModal'
import { FidelityToast, FidelityCheckoutReminder } from './components/FidelityToast'
import { useStock } from './hooks/useStock'
import { useAuth } from './hooks/useAuth'
const AuthModals = lazy(() => import('./components/auth/AuthModals').then(m => ({ default: m.AuthModals })))
const AccountPage = lazy(() => import('./components/auth/AccountPage').then(m => ({ default: m.AccountPage })))
import { listenDeliverySlots, reserveDeliverySlot, listenSettings } from './lib/firebase'
import { getMinDate } from './lib/delivery'
// Firebase importé dynamiquement pour le reste
// addUserPoints, createOrder, etc. sont importés via import() dans les handlers

const VisualBackground = lazy(() => import('./components/effects/VisualBackground').then(m => ({ default: m.VisualBackground })))

const Testimonials = lazy(() => import('./components/Testimonials').then(m => ({ default: m.Testimonials })))
const LegalPagesSections = lazy(() => import('./components/LegalPages').then(m => ({ default: m.default })))
import {
  BottomNav,
  FloatingCartPreview,
  SwipeableProductCard,
  FlyToCart,
  useFlyToCart,
  CartSheet,
  FavoritesSheet,
  ProductDetailModal,
  StickyCategoryTabs,
  VoiceSearch,
  useVoiceSearch,
} from './components/mobile'
const OnboardingTour = lazy(() => import('./components/mobile/OnboardingTour').then(m => ({ default: m.OnboardingTour })))
import { hapticFeedback } from './lib/haptics'

const SizeSelectorModal = lazy(() => import('./components/SizeSelectorModal').then(m => ({ default: m.SizeSelectorModal })))
const TiramisuCustomizationModal = lazy(() => import('./components/TiramisuCustomizationModal').then(m => ({ default: m.TiramisuCustomizationModal })))
const BoxCustomizationModal = lazy(() => import('./components/BoxCustomizationModal').then(m => ({ default: m.BoxCustomizationModal })))
const BoxFlavorsModal = lazy(() => import('./components/BoxFlavorsModal').then(m => ({ default: m.BoxFlavorsModal })))
const FavorisSection = lazy(() => import('./components/FavorisSection').then(m => ({ default: m.FavorisSection })))
const ComplementarySuggestions = lazy(() => import('./components/ComplementarySuggestions').then(m => ({ default: m.ComplementarySuggestions })))
const OccasionsSection = lazy(() => import('./components/OccasionsSection').then(m => ({ default: m.OccasionsSection })))
const PollSection = lazy(() => import('./components/PollSection').then(m => ({ default: m.PollSection })))
const CommunityMapSection = lazy(() => import('./components/CommunityMapSection').then(m => ({ default: m.CommunityMapSection })))
import { TrompeLOeilModal } from './components/TrompeLOeilModal'
import { OrderConfirmation } from './components/OrderConfirmation'
import { OrderRecapModal } from './components/OrderRecapModal'
import { AggregateRatingSchema } from './components/AggregateRatingSchema'
import { OrderStatusPage } from './components/OrderStatusPage'
import { DeliveryZoneMap } from './components/DeliveryZoneMap'
import { REWARD_COSTS, REWARD_LABELS } from './lib/rewards'
import { useProducts } from './hooks/useProducts'
import type {
  Product,
  ProductSize,
  CartItem,
  ProductCategory,
  CustomerInfo,
} from './types'
import {
  ANNECY_GARE,
  FREE_DELIVERY_THRESHOLD,
  calculateDistance,
  computeDeliveryFee,
} from './lib/delivery'
import { buildOrderMessage } from './lib/orderMessage'
import { isPreorderNotYetAvailable, isBeforeOrderCutoff } from './lib/utils'
import {
  Sparkles,
  Search,
  X,
  LayoutGrid,
  Cookie,
  Package,
  CakeSlice,
  CupSoda as Cup,
  Cake,
  Eye,
  Heart
} from 'lucide-react'
import { PAYPAL_ME_USER, REFERRAL_DISCOUNT_EUR } from './constants'

function AppRouter() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin')
  const [orderStatusId, setOrderStatusId] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash
      setIsAdmin(hash === '#admin')
      const match = hash.match(/^#\/commande\/([a-zA-Z0-9_-]+)$/)
      setOrderStatusId(match ? match[1] : null)
    }
    handler()
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (isAdmin) return <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-mayssa-brown">Chargement admin...</div>}><AdminPanel /></Suspense>
  if (orderStatusId) {
    return (
      <div className="min-h-screen bg-mayssa-soft">
        <OrderStatusPage
          orderId={orderStatusId}
          onBack={() => { window.location.hash = '' }}
        />
      </div>
    )
  }
  return <App />
}

function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  )
}

function AppContent() {
  // Stock management (Firebase real-time)
  const { stock: stockMap, getStock, isPreorderDay, dayNames } = useStock()

  // Client authentication
  const { user, isAuthenticated, profile } = useAuth()

  // Products with Firebase overrides
  const { availableProducts } = useProducts()

  // Refs pour accéder aux données courantes dans les timers (évite les closures stale)
  const stockMapRef = useRef(stockMap)
  const isAuthenticatedRef = useRef(isAuthenticated)
  const [deliverySlots, setDeliverySlots] = useState<Record<string, Record<string, number>>>({})
  const [deliverySchedule, setDeliverySchedule] = useState<{
    minDate: string
    maxDate?: string
    availableWeekdays?: number[]
    retraitTimeSlots?: string[]
    livraisonTimeSlots?: string[]
  }>(() => ({ minDate: getMinDate() }))
  useEffect(() => { stockMapRef.current = stockMap }, [stockMap])
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated }, [isAuthenticated])
  useEffect(() => {
    return listenDeliverySlots(setDeliverySlots)
  }, [])
  useEffect(() => {
    return listenSettings((s) => {
      const today = getMinDate()
      setDeliverySchedule({
        minDate: (s.firstAvailableDate && s.firstAvailableDate.trim()) ? s.firstAvailableDate.trim() : today,
        maxDate: (s.lastAvailableDate && s.lastAvailableDate.trim()) ? s.lastAvailableDate.trim() : undefined,
        availableWeekdays: s.availableWeekdays && s.availableWeekdays.length > 0 ? s.availableWeekdays : undefined,
        retraitTimeSlots: s.retraitTimeSlots && s.retraitTimeSlots.length > 0 ? s.retraitTimeSlots : undefined,
        livraisonTimeSlots: s.livraisonTimeSlots && s.livraisonTimeSlots.length > 0 ? s.livraisonTimeSlots : undefined,
      })
    })
  }, [])
  // Confetti effect
  const { trigger: confettiTrigger, origin: confettiOrigin, fire: fireConfetti } = useConfetti()

  // Fly-to-cart animation
  const { trigger: flyTrigger, currentProduct: flyProduct, fly: flyToCart } = useFlyToCart()

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [isFavoritesSheetOpen, setIsFavoritesSheetOpen] = useState(false)
  const [showRecapModal, setShowRecapModal] = useState(false)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [donationAmount, setDonationAmount] = useState(0)
  const [referralCodeInput, setReferralCodeInput] = useState('')

  // Favorites (localStorage)
  const {
    favorites,
    isFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
    count: favoritesCount,
  } = useFavorites(availableProducts)

  // Voice search
  const { isVoiceActive, toggleVoice, handleVoiceResult } = useVoiceSearch((query) => {
    setSearchQuery(query)
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Préremplir le code parrain depuis ?ref=
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref?.trim()) setReferralCodeInput(ref.trim().toUpperCase())
  }, [])

  // Ouvrir le produit depuis un lien partagé : ?produit= ou #produit=
  const sharedProductHandled = useRef(false)
  useEffect(() => {
    if (sharedProductHandled.current) return
    const fromSearch = new URLSearchParams(window.location.search).get('produit')
    const fromHash = new URLSearchParams(window.location.hash.slice(1)).get('produit')
    const productId = fromSearch || fromHash
    if (!productId) return
    const product = availableProducts.find(p => p.id === productId)
    if (!product) return
    sharedProductHandled.current = true
    setTimeout(() => {
      if (window.innerWidth >= 768) {
        setSelectedProductForDetail(product)
      } else {
        handleAddToCart(product)
      }
      // Nettoyer l'URL sans recharger la page
      const cleanUrl = window.location.origin + window.location.pathname
      window.history.replaceState({}, '', cleanUrl)
    }, 300)
  }, [availableProducts])

  // Load cart from localStorage on mount
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('maison-mayssa-cart')
      return savedCart ? JSON.parse(savedCart) : []
    } catch {
      return []
    }
  })

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('maison-mayssa-cart', JSON.stringify(cart))
  }, [cart])

  // À la connexion (invité → compte), vider le panier pour ne pas garder celui d'un autre compte
  const wasGuestRef = useRef(!isAuthenticated)
  useEffect(() => {
    if (isAuthenticated && wasGuestRef.current) {
      wasGuestRef.current = false
      setCart([])
    }
    if (!isAuthenticated) wasGuestRef.current = true
  }, [isAuthenticated])

  // Ref panier pour le timer de réservation
  const cartRef = useRef(cart)
  useEffect(() => { cartRef.current = cart }, [cart])

  // --- RÉSERVATION TROMPE L'ŒIL : nettoyage des réservations expirées ---
  // Utilitaire : extraire l'ID produit original (sans le suffixe -timestamp)
  const getOriginalProductId = (cartProductId: string) =>
    cartProductId.replace(/-\d{13,}$/, '')

  // Nettoyage au montage (réservations d'une session précédente)
  const mountCleanupDone = useRef(false)
  useEffect(() => {
    if (mountCleanupDone.current) return
    mountCleanupDone.current = true

    const now = Date.now()
    const savedCart: CartItem[] = cartRef.current
    const expired = savedCart.filter(
      (item) =>
        item.reservationExpiresAt &&
        !item.reservationConfirmed &&
        now >= item.reservationExpiresAt,
    )
    if (expired.length === 0) return

    // Relâcher le stock pour chaque item expiré (uniquement si connecté, sinon pas d'écriture Firebase)
    if (isAuthenticated) {
      ;(async () => {
        try {
          const { getStock: fetchAll, updateStock } = await import('./lib/firebase')
          const currentStock = await fetchAll()
          for (const item of expired) {
            const origId = getOriginalProductId(item.product.id)
            const qty = currentStock[origId] ?? 0
            await updateStock(origId, qty + item.quantity)
          }
        } catch {
          /* ignore */
        }
      })()
    }

    setCart((current) =>
      current.filter(
        (item) =>
          !item.reservationExpiresAt ||
          item.reservationConfirmed ||
          now < item.reservationExpiresAt,
      ),
    )
  }, [])

  // Timer : toutes les secondes, vérifier si des réservations ont expiré
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const current = cartRef.current
      const expired = current.filter(
        (item) =>
          item.reservationExpiresAt &&
          !item.reservationConfirmed &&
          now >= item.reservationExpiresAt,
      )
      if (expired.length === 0) return

      // Relâcher le stock (uniquement si connecté)
      if (isAuthenticatedRef.current) {
        import('./lib/firebase').then(({ updateStock }) => {
          for (const item of expired) {
            const origId = getOriginalProductId(item.product.id)
            const qty = stockMapRef.current[origId] ?? 0
            updateStock(origId, qty + item.quantity)
          }
        })
      }

      // Retirer du panier
      setCart((prev) =>
        prev.filter(
          (item) =>
            !item.reservationExpiresAt ||
            item.reservationConfirmed ||
            now < item.reservationExpiresAt,
        ),
      )

      showToast(
        'Temps écoulé ! Les trompe l\'œil réservés ont été retirés de ton panier.',
        'error',
        5000,
      )
    }, 1000)

    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show recovery toast if cart was restored from localStorage
  const cartRecoveredRef = useRef(false)
  useEffect(() => {
    if (!cartRecoveredRef.current && cart.length > 0) {
      cartRecoveredRef.current = true
      const count = cart.reduce((sum, item) => sum + item.quantity, 0)
      const timer = setTimeout(() => {
        showToast(`Ton panier de ${count} article${count > 1 ? 's' : ''} t'attend toujours !`, 'info', 4000)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Une seule confirmation (toast + fly) par ajout au panier (évite le double en Strict Mode)
  useEffect(() => {
    const pending = pendingAddToastRef.current
    if (!pending) return
    pendingAddToastRef.current = null
    showToast(pending.message, 'success', undefined, true, pending.product)
    // Show complementary product suggestions
    const lastItem = cart[cart.length - 1]
    if (lastItem) showComplementary(lastItem.product)
  }, [cart])

  const [note, setNote] = useState('')
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'Tous'>('Tous')
  const [searchQuery, setSearchQuery] = useState('')
  const [customer, setCustomer] = useState<CustomerInfo>(() => {
    try {
      const saved = localStorage.getItem('maison-mayssa-customer')
      if (saved) {
        const p = JSON.parse(saved)
        return {
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          addressCoordinates: null,
          wantsDelivery: !!p.wantsDelivery,
          date: '',
          time: '',
          deliveryInstructions: p.deliveryInstructions || '',
        }
      }
    } catch {}
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      addressCoordinates: null,
      wantsDelivery: false,
      date: '',
      time: '',
      deliveryInstructions: '',
    }
  })

  // Save customer info to localStorage (persistent fields only)
  useEffect(() => {
    localStorage.setItem('maison-mayssa-customer', JSON.stringify({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
      wantsDelivery: customer.wantsDelivery,
      deliveryInstructions: customer.deliveryInstructions || '',
    }))
  }, [customer.firstName, customer.lastName, customer.phone, customer.email, customer.address, customer.wantsDelivery, customer.deliveryInstructions])

  // Auto-remplir les infos client depuis le profil Firebase quand l'utilisateur est connecté
  const profileSyncedRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !profile || profileSyncedRef.current) return
    profileSyncedRef.current = true
    setCustomer(prev => ({
      ...prev,
      firstName: prev.firstName || profile.firstName || '',
      lastName: prev.lastName || profile.lastName || '',
      phone: prev.phone || profile.phone || '',
      address: prev.address || profile.address || '',
      addressCoordinates: prev.addressCoordinates || profile.addressCoordinates || null,
    }))
  }, [isAuthenticated, profile])

  // Réinitialiser le flag de sync quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) profileSyncedRef.current = false
  }, [isAuthenticated])

  const [selectedProductForSize, setSelectedProductForSize] = useState<Product | null>(null)
  const [selectedProductForTiramisu, setSelectedProductForTiramisu] = useState<Product | null>(null)
  const [selectedProductForBox, setSelectedProductForBox] = useState<Product | null>(null)
  const [selectedProductForBoxFlavors, setSelectedProductForBoxFlavors] = useState<Product | null>(null)
  const [selectedProductForTrompeLoeil, setSelectedProductForTrompeLoeil] = useState<Product | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Auth & Account states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [isAccountPageOpen, setIsAccountPageOpen] = useState(false)

  // Reward selection state
  const [selectedReward, setSelectedReward] = useState<{ type: keyof typeof REWARD_COSTS; id: string } | null>(null)

  // Fidelity toast trigger
  const [fidelityToastTrigger, setFidelityToastTrigger] = useState({ trigger: false, productName: '' })

  const showComplementary = (addedProduct: Product) => {
    clearTimeout(suggestTimerRef.current)
    const cartIds = new Set(cart.map(i => i.product.id))
    const suggestions = availableProducts
      .filter(p => p.category !== addedProduct.category && !cartIds.has(p.id) && p.id !== addedProduct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
    if (suggestions.length === 0) return
    setSuggestedProducts(suggestions)
    suggestTimerRef.current = setTimeout(() => setSuggestedProducts([]), 6000)
  }

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setIsAccountPageOpen(true)
    } else {
      setAuthMode('login')
      setIsAuthModalOpen(true)
    }
  }

  const handleFidelityLogin = () => {
    setAuthMode('login')
    setIsAuthModalOpen(true)
  }

  const handleFidelityRegister = () => {
    setAuthMode('register')
    setIsAuthModalOpen(true)
  }

  const showToast = (message: string, type: Toast['type'] = 'success', duration?: number, withConfetti?: boolean, product?: Product) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { id, message, type, duration }])
    if (withConfetti) {
      fireConfetti()
      hapticFeedback('success')
    }
    if (product && isMobile) {
      flyToCart(product.name, product.image)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const lastActivity = useRef(Date.now())
  const reminderShown = useRef(false)
  const pendingAddToastRef = useRef<{ message: string; product?: Product } | null>(null)
  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now() }
    window.addEventListener('mousemove', bump)
    window.addEventListener('keydown', bump)
    window.addEventListener('scroll', bump)
    window.addEventListener('click', bump)
    const id = setInterval(() => {
      if (reminderShown.current || cart.length === 0) return
      if (Date.now() - lastActivity.current < 2 * 60 * 1000) return
      reminderShown.current = true
      showToast('Tu as encore des articles dans ton panier. Scrollez vers « Voir la commande » pour finaliser.', 'info', 6000)
    }, 60 * 1000)
    return () => {
      window.removeEventListener('mousemove', bump)
      window.removeEventListener('keydown', bump)
      window.removeEventListener('scroll', bump)
      window.removeEventListener('click', bump)
      clearInterval(id)
    }
  }, [cart.length])

  const baseTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  )
  const total = baseTotal

  const categories = useMemo(() => {
    const cats = Array.from(new Set(availableProducts.map((p) => p.category)))
    return ['Tous', ...cats] as const
  }, [availableProducts])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Tous': return <LayoutGrid size={20} />
      case "Trompe l'oeil": return <Eye size={20} />
      case 'Mini Gourmandises': return <Sparkles size={20} />
      case 'Brownies': return <Cake size={20} />
      case 'Cookies': return <Cookie size={20} />
      case 'Layer Cups': return <Cup size={20} />
      case 'Boxes': return <Package size={20} />
      case 'Tiramisus': return <CakeSlice size={20} />
      default: return <LayoutGrid size={20} />
    }
  }

  const filteredProducts = useMemo(() => {
    let filtered = availableProducts

    // Filter by category
    if (activeCategory !== 'Tous') {
      filtered = filtered.filter((p) => p.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeCategory, searchQuery, availableProducts])

  const orderedProducts = useMemo(() => {
    const idx = filteredProducts.findIndex((p) => p.id === 'trompe-loeil-fraise')
    if (idx <= 0) return filteredProducts
    const arr = [...filteredProducts]
    const [fraise] = arr.splice(idx, 1)
    return [fraise, ...arr]
  }, [filteredProducts])

  const handleAddToCart = (product: Product) => {
    if (isPreorderNotYetAvailable(product)) return

    // Trompe l'oeil → modal dédiée (choix quantité + précommande)
    if (product.category === "Trompe l'oeil") {
      if (!isPreorderDay) {
        showToast(`Précommande dispo ${dayNames} uniquement`, 'error')
        return
      }
      const qty = getStock(product.id)
      if (qty !== null && qty <= 0) {
        showToast(`${product.name} est en rupture de stock`, 'error')
        return
      }
      setSelectedProductForTrompeLoeil(product)
      return
    }

    // If product is a Tiramisu, open customization modal
    if (product.category === 'Tiramisus') {
      setSelectedProductForTiramisu(product)
      return
    }

    // If product is a Mini Gourmandise (box), open box customization modal
    if (product.category === 'Mini Gourmandises' || product.id === 'mini-box-mixte') {
      setSelectedProductForBox(product)
      return
    }

    // Box cookies / brownies / mixte : choix du format + parfums
    if (product.id === 'box-cookies' || product.id === 'box-brownies' || product.id === 'box-mixte') {
      setSelectedProductForBoxFlavors(product)
      return
    }

    // If product has sizes (like Layer Cups), open size selector modal
    if (product.sizes && product.sizes.length > 0) {
      setSelectedProductForSize(product)
      return
    }

    import('./lib/analytics').then(({ AnalyticsEvents }) => {
      AnalyticsEvents.add_to_cart(product.id, product.name, product.price, 1)
    }).catch(() => {})
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        pendingAddToastRef.current = { message: `${product.name} ajouté au panier (quantité: ${newQty})`, product }
        
        // Déclencher le FidelityToast si pas connecté
        if (!isAuthenticated) {
          setFidelityToastTrigger({ trigger: true, productName: product.name })
          setTimeout(() => setFidelityToastTrigger({ trigger: false, productName: '' }), 100)
        }
        
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item,
        )
      }
      pendingAddToastRef.current = { message: `${product.name} ajouté au panier`, product }
      
      // Déclencher le FidelityToast si pas connecté
      if (!isAuthenticated) {
        setFidelityToastTrigger({ trigger: true, productName: product.name })
        setTimeout(() => setFidelityToastTrigger({ trigger: false, productName: '' }), 100)
      }
      
      return [...current, { product, quantity: 1 }]
    })
  }

  const handleSizeSelect = (product: Product, size: ProductSize) => {
    // Create a cart item with the specific size
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}`,
      name: `${product.name} (${size.label})`,
      price: size.price,
    }

    setCart((current) => {
      const existing = current.find((item) => item.product.id === cartProduct.id)
      if (existing) {
        const newQty = existing.quantity + 1
        pendingAddToastRef.current = { message: `${cartProduct.name} ajouté au panier (quantité: ${newQty})` }
        return current.map((item) =>
          item.product.id === cartProduct.id ? { ...item, quantity: newQty } : item,
        )
      }
      pendingAddToastRef.current = { message: `${cartProduct.name} ajouté au panier` }
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForSize(null)
  }

  const handleTiramisuCustomization = (
    product: Product,
    size: ProductSize,
    base: string,
    allToppings: string[]
  ) => {
    // Les 2 premiers sont inclus, les suivants sont payants
    const extraToppings = Math.max(0, allToppings.length - 2)
    const extraPrice = extraToppings * 0.5
    const totalPrice = size.price + extraPrice

    // Create a detailed name with all customizations
    const toppingsText = allToppings.join(', ')
    const extraText = extraToppings > 0 ? ` (${extraToppings} supp. +${extraPrice.toFixed(2).replace('.', ',')}€)` : ''
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}-${Date.now()}`,
      name: `${size.label}`,
      description: `Base: ${base} • Toppings: ${toppingsText}${extraText}`,
      price: totalPrice,
    }

    setCart((current) => {
      pendingAddToastRef.current = { message: `${cartProduct.name} ajouté au panier` }
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForTiramisu(null)
  }

  const handleBoxCustomization = (
    product: Product,
    size: ProductSize,
    coulis: string[]
  ) => {
    // Determine if it's petite or grande
    const isMixte = product.id === 'mini-box-mixte'
    const isPetite = product.sizes && product.sizes[0]?.ml === size.ml
    const coulisInclus = isMixte ? 4 : (isPetite ? 2 : 4)
    const extraCoulis = Math.max(0, coulis.length - coulisInclus)
    const extraPrice = extraCoulis * 0.5
    const totalPrice = size.price + extraPrice

    // Create a detailed name with all customizations
    const coulisText = coulis.join(', ')
    const extraText = extraCoulis > 0 ? ` (+${extraCoulis} supp.)` : ''
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}-${Date.now()}`,
      name: `${product.name} - ${size.label}`,
      description: `Coulis: ${coulisText}${extraText}`,
      price: totalPrice,
    }

    setCart((current) => {
      pendingAddToastRef.current = { message: `${cartProduct.name} ajouté au panier` }
      return [...current, { product: cartProduct, quantity: 1 }]
    })

    setSelectedProductForBox(null)
  }

  const handleBoxFlavorsSelect = (product: Product, size: ProductSize, flavorDescription: string, totalPrice: number) => {
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}-${Date.now()}`,
      name: `${product.name} – ${size.label}`,
      description: flavorDescription,
      price: totalPrice,
    }
    setCart((current) => {
      pendingAddToastRef.current = { message: `${cartProduct.name} ajouté au panier` }
      return [...current, { product: cartProduct, quantity: 1 }]
    })
    setSelectedProductForBoxFlavors(null)
  }

  const RESERVATION_DURATION_MS = 10 * 60 * 1000 // 10 minutes

  const handleTrompeLOeilConfirm = async (product: Product, quantity: number) => {
    // 1. Décrémenter le stock dans Firebase uniquement si connecté (règles : auth != null)
    if (isAuthenticated) {
      const currentQty = getStock(product.id)
      if (currentQty !== null) {
        const { updateStock } = await import('./lib/firebase')
        await updateStock(product.id, Math.max(0, currentQty - quantity))
      }
    }

    // 2. Ajouter au panier avec un timer de réservation (10 min)
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${Date.now()}`,
    }
    setCart((current) => {
      pendingAddToastRef.current = {
        message: `${product.name} ×${quantity} réservé pour 10 min !`,
        product,
      }
      return [
        ...current,
        {
          product: cartProduct,
          quantity,
          reservationExpiresAt: Date.now() + RESERVATION_DURATION_MS,
          reservationConfirmed: false,
        },
      ]
    })

    // PAS de création de commande Firebase ici — elle sera créée à l'envoi
    setSelectedProductForTrompeLoeil(null)
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    const item = cart.find((i) => i.product.id === id)
    const isTrompeReservation =
      item?.reservationExpiresAt && !item.reservationConfirmed

    if (quantity <= 0) {
      // Relâcher le stock réservé si trompe l'oeil en cours de réservation (uniquement si connecté)
      if (isTrompeReservation && item && isAuthenticated) {
        const origId = getOriginalProductId(item.product.id)
        const currentQty = getStock(origId)
        if (currentQty !== null) {
          const { updateStock } = await import('./lib/firebase')
          await updateStock(origId, currentQty + item.quantity)
        }
      }
      setCart((current) => current.filter((i) => i.product.id !== id))
      return
    }

    // Ajustement de quantité pour un trompe l'oeil réservé (uniquement si connecté, sinon pas d'écriture Firebase)
    if (isTrompeReservation && item && isAuthenticated) {
      const delta = quantity - item.quantity
      if (delta !== 0) {
        const origId = getOriginalProductId(item.product.id)
        const currentQty = getStock(origId)
        const { updateStock } = await import('./lib/firebase')
        if (delta > 0) {
          if (currentQty !== null && currentQty < delta) {
            showToast(`Stock insuffisant (${currentQty} restant${currentQty > 1 ? 's' : ''})`, 'error')
            return
          }
          if (currentQty !== null) {
            await updateStock(origId, currentQty - delta)
          }
        } else {
          if (currentQty !== null) {
            await updateStock(origId, currentQty + Math.abs(delta))
          }
        }
      }
    }

    setCart((current) =>
      current.map((i) =>
        i.product.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i,
      ),
    )
  }

  const [instagramParts, setInstagramParts] = useState<string[]>([])
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false)
  const [snapMessage, setSnapMessage] = useState('')
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string
    orderNumber?: number
    total: number
    deliveryFee?: number
    customer: { firstName: string; lastName: string; phone: string }
    items: { name: string; quantity: number; price: number; productId?: string }[]
    deliveryMode?: 'livraison' | 'retrait'
    requestedDate?: string
    requestedTime?: string
    whatsappMessage: string
  } | null>(null)

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim()
    if (!code) return
    try {
      const { validatePromoCode } = await import('./lib/firebase')
      const result = await validatePromoCode(code, total)
      if (result.valid) {
        setAppliedPromo({ code: code.toUpperCase(), discount: result.discount })
        showToast(`Code appliqué : -${result.discount.toFixed(2)} €`, 'success')
      } else {
        showToast(result.error ?? 'Code invalide', 'error')
      }
    } catch {
      showToast('Erreur lors de la vérification du code', 'error')
    }
  }

  const handleClearPromo = () => {
    setAppliedPromo(null)
    setPromoCodeInput('')
  }

  const saveOrderToFirebase = async (source: 'whatsapp' | 'instagram' | 'snap'): Promise<{ orderId: string; orderNumber: number } | null> => {
    if (cart.length === 0) return null
    const discount = appliedPromo?.discount ?? 0
    let referralDiscount = 0
    let referrerUid: string | null = null
    const canUseReferral = user && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && referralCodeInput?.trim()
    if (canUseReferral) {
      const { getReferrerByCode } = await import('./lib/firebase')
      const uid = await getReferrerByCode(referralCodeInput!.trim())
      if (uid && uid !== user!.uid) {
        referrerUid = uid
        referralDiscount = REFERRAL_DISCOUNT_EUR
      }
    }
    const totalAfterDiscount = Math.max(0, total - discount - referralDiscount)
    const deliveryFee = computeDeliveryFee(customer, totalAfterDiscount) ?? 0
    const donation = donationAmount ?? 0
    const orderTotal = totalAfterDiscount + deliveryFee + donation
    try {
      const { createOrder, incrementPromoCodeUsage, applyReferralAfterOrder } = await import('./lib/firebase')
      const distanceKm = customer.wantsDelivery && customer.addressCoordinates
        ? calculateDistance(customer.addressCoordinates, ANNECY_GARE)
        : undefined

      const result = await createOrder({
        items: cart.map((item) => ({
          productId: getOriginalProductId(item.product.id),
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
        customer: {
          firstName: customer.firstName || 'Client',
          lastName: customer.lastName || '',
          phone: customer.phone || '',
          ...(customer.email?.trim() && { email: customer.email.trim() }),
          ...(customer.wantsDelivery && customer.address.trim() && { address: customer.address.trim() }),
          ...(customer.wantsDelivery && customer.addressCoordinates && { addressCoordinates: customer.addressCoordinates }),
          ...(customer.wantsDelivery && customer.deliveryInstructions?.trim() && { deliveryInstructions: customer.deliveryInstructions.trim() }),
        },
        total: orderTotal,
        status: 'en_attente',
        source,
        deliveryMode: customer.wantsDelivery ? 'livraison' : 'retrait',
        requestedDate: customer.date || undefined,
        requestedTime: customer.time || undefined,
        ...(deliveryFee > 0 && { deliveryFee }),
        ...(distanceKm != null && { distanceKm }),
        ...(note.trim() && note.trim() !== 'Pour le … (date, créneau, adresse)' && { clientNote: note.trim() }),
        ...(appliedPromo && { promoCode: appliedPromo.code, discountAmount: appliedPromo.discount }),
        ...(donation > 0 && { donationAmount: donation }),
        ...(user?.uid && { userId: user.uid }),
        ...(referralDiscount > 0 && referrerUid && {
          referralCode: referralCodeInput!.trim(),
          referralDiscountAmount: referralDiscount,
          referrerUserId: referrerUid,
        }),
        createdAt: Date.now(),
      })
      if (referralDiscount > 0 && referrerUid && user?.uid) {
        applyReferralAfterOrder(user.uid, referralCodeInput!.trim(), referrerUid).catch(console.error)
      }
      if (appliedPromo?.code) {
        incrementPromoCodeUsage(appliedPromo.code).catch(console.error)
      }
      if (user?.uid) {
        const { updateUserOrderStats } = await import('./lib/firebase')
        updateUserOrderStats(user.uid, {
          hasTrompeLoeil: cart.some((item) => item.product.category === "Trompe l'oeil"),
          hasDonation: donation > 0,
          hasPromo: !!appliedPromo,
        }).catch(console.error)
      }
      if (customer.wantsDelivery && customer.date && customer.time) {
        reserveDeliverySlot(customer.date, customer.time).catch(console.error)
      }
      return result
    } catch (err) {
      console.error('[Firebase] Erreur sauvegarde commande:', err)
      return null
    }
  }

  const handleSend = async () => {
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'oeil")
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff()) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 23h. Les précommandes trompe-l\'œil restent disponibles.', 'error', 5000)
      return
    }

    let referralDiscountAmount = 0
    const canUseReferral = user && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && referralCodeInput?.trim()
    if (canUseReferral) {
      const { getReferrerByCode } = await import('./lib/firebase')
      const referrerUid = await getReferrerByCode(referralCodeInput!.trim())
      if (referrerUid && referrerUid !== user!.uid) referralDiscountAmount = REFERRAL_DISCOUNT_EUR
    }

    const message = buildOrderMessage({
      cart,
      customer,
      total,
      note,
      selectedReward,
      isAuthenticated,
      discountAmount: appliedPromo?.discount ?? 0,
      referralDiscountAmount,
      donationAmount: donationAmount ?? 0,
      dietaryPreferences: profile?.dietaryPreferences,
    })
    if (!message) return

    // --- Enregistrer la commande dans Firebase d'abord (pour obtenir l'ID) ---
    const orderResult = await saveOrderToFirebase('whatsapp')
    if (!orderResult) {
      showToast('Erreur lors de l\'enregistrement de la commande.', 'error')
      return
    }
    const { orderId, orderNumber } = orderResult

    // --- Analytics ---
    try {
      const { AnalyticsEvents } = await import('./lib/analytics')
      AnalyticsEvents.send_to_whatsapp(orderId, total + (computeDeliveryFee(customer, total) ?? 0))
    } catch { /* ignore */ }

    // --- Afficher l'écran de confirmation (WhatsApp + PayPal + lien statut) ---
    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
    const deliveryFeeVal = computeDeliveryFee(customer, totalAfterDiscount) ?? 0
    const donationVal = donationAmount ?? 0
    setOrderConfirmation({
      orderId,
      orderNumber,
      total: totalAfterDiscount + deliveryFeeVal + donationVal,
      deliveryFee: deliveryFeeVal > 0 ? deliveryFeeVal : undefined,
      customer: {
        firstName: customer.firstName || 'Client',
        lastName: customer.lastName || '',
        phone: customer.phone || '',
      },
      items: cart.map((i) => ({
        name: i.product.name,
        quantity: i.quantity,
        price: i.product.price,
        productId: getOriginalProductId(i.product.id),
      })),
      deliveryMode: customer.wantsDelivery ? 'livraison' : 'retrait',
      requestedDate: customer.date || undefined,
      requestedTime: customer.time || undefined,
      whatsappMessage: message,
    })

    // --- Confirmer les réservations trompe l'oeil (le stock reste décrémenté) ---
    const trompeLOeilItems = cart.filter(
      (item) =>
        item.product.category === "Trompe l'oeil" &&
        item.reservationExpiresAt &&
        !item.reservationConfirmed,
    )
    if (trompeLOeilItems.length > 0) {
      setCart((current) =>
        current.map((item) =>
          item.reservationExpiresAt && !item.reservationConfirmed && item.product.category === "Trompe l'oeil"
            ? { ...item, reservationConfirmed: true }
            : item,
        ),
      )
    }

    // --- Réclamation de la récompense sélectionnée ---
    if (selectedReward && isAuthenticated && user) {
      try {
        const { claimReward } = await import('./lib/firebase')
        const rewardId = await claimReward(user.uid, selectedReward.type, REWARD_COSTS[selectedReward.type])
        if (rewardId) {
          setSelectedReward(null) // Reset la sélection après réclamation
          showToast(`Récompense ${REWARD_LABELS[selectedReward.type]} réclamée !`, 'success', 3000)
        }
      } catch (error) {
        console.error('Error claiming reward:', error)
        showToast('Erreur lors de la réclamation de la récompense', 'error')
      }
    }

    // --- Attribution des points de fidélité (si connecté) ---
    if (isAuthenticated && user && cart.length > 0) {
      try {
        const totalAfterDiscount = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
        const orderTotal = totalAfterDiscount + (computeDeliveryFee(customer, totalAfterDiscount) || 0) + (donationAmount ?? 0)
        const basePoints = Math.round(orderTotal) // 1 € = 1 point
        
        // Générer un ID de commande simple pour traçabilité
        const orderId = `order_${Date.now()}`

        const { addUserPoints } = await import('./lib/firebase')
        await addUserPoints(user.uid, {
          reason: 'order_points',
          points: basePoints,
          at: Date.now(),
          amount: orderTotal,
          orderId: orderId,
        })

        showToast(`+${basePoints} points gagnés avec cette commande !`, 'success', 4000)
      } catch (error) {
        console.error('Error adding loyalty points:', error)
        // Ne pas faire échouer l'envoi pour cette erreur
      }
    }

    // Vider le panier après envoi (évite qu'un autre compte voie l'ancienne commande)
    setCart([])
  }

  const handleSendInstagram = async () => {
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'oeil")
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff()) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 23h.', 'error', 5000)
      return
    }

    let referralDiscountAmount = 0
    const canUseReferralInst = user && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && referralCodeInput?.trim()
    if (canUseReferralInst) {
      const { getReferrerByCode } = await import('./lib/firebase')
      const referrerUid = await getReferrerByCode(referralCodeInput!.trim())
      if (referrerUid && referrerUid !== user!.uid) referralDiscountAmount = REFERRAL_DISCOUNT_EUR
    }
    const message = buildOrderMessage({
      cart,
      customer,
      total,
      note,
      selectedReward,
      isAuthenticated,
      discountAmount: appliedPromo?.discount ?? 0,
      referralDiscountAmount,
      donationAmount: donationAmount ?? 0,
      dietaryPreferences: profile?.dietaryPreferences,
    })
    if (!message) return

    await saveOrderToFirebase('instagram')

    // Instagram DM a une limite de ~1000 caractères par message
    const INSTAGRAM_LIMIT = 1000
    const parts: string[] = []
    if (message.length <= INSTAGRAM_LIMIT) {
      parts.push(message)
    } else {
      const lines = message.split('\n')
      let current = ''
      for (const line of lines) {
        if (current.length + line.length + 1 > INSTAGRAM_LIMIT && current.length > 0) {
          parts.push(current.trimEnd())
          current = ''
        }
        current += line + '\n'
      }
      if (current.trim()) parts.push(current.trimEnd())
    }

    // Copier la première partie dans le presse-papier
    try {
      await navigator.clipboard.writeText(parts[0])
    } catch { /* fallback: l'utilisateur copiera manuellement */ }

    setInstagramParts(parts)
    setIsInstagramModalOpen(true)
  }

  const handleSendSnap = async () => {
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'oeil")
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff()) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 23h.', 'error', 5000)
      return
    }

    let referralDiscountAmountSnap = 0
    const canUseReferralSnap = user && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && referralCodeInput?.trim()
    if (canUseReferralSnap) {
      const { getReferrerByCode } = await import('./lib/firebase')
      const referrerUid = await getReferrerByCode(referralCodeInput!.trim())
      if (referrerUid && referrerUid !== user!.uid) referralDiscountAmountSnap = REFERRAL_DISCOUNT_EUR
    }
    const message = buildOrderMessage({
      cart,
      customer,
      total,
      note,
      selectedReward,
      isAuthenticated,
      discountAmount: appliedPromo?.discount ?? 0,
      referralDiscountAmount: referralDiscountAmountSnap,
      donationAmount: donationAmount ?? 0,
      dietaryPreferences: profile?.dietaryPreferences,
    })
    if (!message) return

    await saveOrderToFirebase('snap')
    setSnapMessage(message)
    setIsSnapModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-mayssa-soft selection:bg-mayssa-caramel/30 font-sans overflow-x-hidden">
      {/* Skip links for accessibility */}
      <SkipLinks />
      
      {/* Resource preloader for critical assets */}
      <ResourcePreloader {...defaultPreloadConfig} />
      
      {/* Accessibility controls */}
      <AccessibilityControls />
      
      {/* Offline indicator for PWA */}
      <OfflineIndicator />
      <CookieBanner />

      {/* Visual Effects (fond chargé en lazy pour accélérer le premier affichage) */}
      <Suspense fallback={null}>
        <VisualBackground />
      </Suspense>
      <Confetti trigger={confettiTrigger} originX={confettiOrigin.x} originY={confettiOrigin.y} />

      <Navbar favoritesCount={favoritesCount} onAccountClick={handleAccountClick} />
      <BirthdayBanner />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mayssa-rose/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-mayssa-caramel/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 md:py-24 sm:px-6 lg:px-8 overflow-x-hidden">
        <PromoBanner />
        <Header />

        <main id="main-content" className="mt-8 sm:mt-12 flex flex-col gap-12 sm:gap-20 md:gap-28 items-center" aria-label="Contenu principal">
          {/* SEO : trompe l'œil Annecy (référencement Google) */}
          <section id="trompe-loeil-annecy" className="w-full text-center px-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-2">
              Trompe l&apos;œil à Annecy
            </h2>
            <p className="text-sm sm:text-base text-mayssa-brown/80 max-w-2xl mx-auto">
              Découvrez nos trompes l&apos;œil pâtissiers à Annecy : créations artisanales Maison Mayssa (mangue, citron, pistache, passion, framboise, cacahuète). Précommande, livraison et retrait sur Annecy.
            </p>
          </section>

          {/* Menu Section */}
          <motion.section
            id="la-carte"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-10 w-full"
          >
            <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-mayssa-caramel">
                  <Sparkles size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-widest">Carte Maison</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-mayssa-brown text-glow">
                  Nos Douceurs
                </h2>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" size={18} />
                  <input
                    id="search-products"
                    type="search"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-10 py-2.5 rounded-xl bg-white/60 border border-mayssa-brown/10 text-sm text-mayssa-brown placeholder-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:bg-white transition-all"
                    aria-label="Rechercher un produit"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light')
                        setSearchQuery('')
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40 hover:text-mayssa-brown transition-colors cursor-pointer"
                      aria-label="Effacer la recherche"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                {/* Voice Search - Mobile only */}
                <div className="md:hidden">
                  <VoiceSearch
                    isActive={isVoiceActive}
                    onToggle={toggleVoice}
                    onResult={handleVoiceResult}
                  />
                </div>
              </div>

            </div>

            {/* Category Filter - Grid layout for visibility */}
            <div className="block">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        hapticFeedback('light')
                        setActiveCategory(cat as any)
                      }}
                      aria-label={isActive ? `Catégorie ${cat} sélectionnée` : `Filtrer par ${cat}`}
                      className={`group relative flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer ${isActive
                        ? 'bg-mayssa-brown text-white shadow-xl shadow-mayssa-brown/20 -translate-y-1'
                        : 'bg-white/60 text-mayssa-brown hover:bg-white hover:shadow-lg hover:-translate-y-1 border border-mayssa-brown/5'
                        }`}
                    >
                      <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-colors duration-300 ${isActive ? 'bg-white/20' : 'bg-mayssa-soft group-hover:bg-mayssa-rose/30'
                        }`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-center">
                        {cat}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeCategoryDot"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-mayssa-caramel shadow-[0_0_10px_#f7b267]"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sticky Category Tabs - Mobile */}
            <StickyCategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <p className="text-mayssa-brown/60 text-sm sm:text-base">
                  Aucun produit trouvé{searchQuery && ` pour "${searchQuery}"`}.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('light')
                      setSearchQuery('')
                    }}
                    className="mt-4 text-mayssa-caramel hover:text-mayssa-brown text-sm font-semibold underline cursor-pointer"
                  >
                    Réinitialiser la recherche
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Grid */}
                <div className="hidden md:grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {orderedProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={handleAddToCart}
                        isFavorite={isFavorite(product.id)}
                        onToggleFavorite={toggleFavorite}
                        stock={getStock(product.id)}
                        isPreorderDay={isPreorderDay}
                        dayNames={dayNames}
                        priority={index < 4}
                        highlightAsNew={product.id === 'trompe-loeil-fraise'}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Mobile Swipeable List — tap = ajout direct (pas de page détail / pavé) */}
                <div className="md:hidden space-y-3">
                  {orderedProducts.map((product, index) => (
                    <SwipeableProductCard
                      key={product.id}
                      product={product}
                      onAdd={handleAddToCart}
                      onTap={handleAddToCart}
                      isFavorite={isFavorite(product.id)}
                      onToggleFavorite={toggleFavorite}
                      stock={getStock(product.id)}
                      isPreorderDay={isPreorderDay}
                      dayNames={dayNames}
                      priority={index < 4}
                      highlightAsNew={product.id === 'trompe-loeil-fraise'}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.section>

          {/* Favoris Section (lazy — below fold) */}
          <Suspense fallback={null}>
            <FavorisSection
              favorites={favorites}
              onRemove={removeFavorite}
              onAddToCart={handleAddToCart}
              onClear={clearFavorites}
            />
          </Suspense>

          {/* Cart Section - Centered at the bottom for Desktop */}
          <motion.section
            id="commande"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4"
          >
            {/* Fidelity Checkout Reminder */}
            {!isAuthenticated && cart.length > 0 && (
              <FidelityCheckoutReminder 
                totalAmount={total}
                onSignUpClick={handleFidelityRegister}
              />
            )}

            <Cart
              items={cart}
              total={total}
              note={note}
              customer={customer}
              onUpdateQuantity={handleUpdateQuantity}
              onNoteChange={setNote}
              onCustomerChange={setCustomer}
              onSend={() => setShowRecapModal(true)}
              onSendInstagram={handleSendInstagram}
              onSendSnap={handleSendSnap}
              onAccountClick={handleAccountClick}
              selectedReward={selectedReward}
              onSelectReward={setSelectedReward}
              deliverySlots={deliverySlots}
              minDate={deliverySchedule.minDate}
              maxDate={deliverySchedule.maxDate}
              availableWeekdays={deliverySchedule.availableWeekdays}
              retraitTimeSlots={deliverySchedule.retraitTimeSlots}
              livraisonTimeSlots={deliverySchedule.livraisonTimeSlots}
              promoCodeInput={promoCodeInput}
              setPromoCodeInput={setPromoCodeInput}
              appliedPromo={appliedPromo}
              onApplyPromo={handleApplyPromo}
              onClearPromo={handleClearPromo}
              donationAmount={donationAmount ?? 0}
              setDonationAmount={setDonationAmount}
              referralCodeInput={referralCodeInput}
              setReferralCodeInput={setReferralCodeInput}
              mysteryFraiseDiscount={0}
            />
          </motion.section>
        </main>

        {/* Notre histoire */}
        <motion.section
          id="notre-histoire"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 sm:mt-16 md:mt-24 section-shell bg-white/80 border border-mayssa-brown/5 premium-shadow scroll-mt-24"
        >
          <div className="grid gap-6 sm:gap-8 md:grid-cols-[1.4fr_minmax(0,1fr)] items-start">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/60">
                Notre histoire
              </p>
              <h2 className="text-2xl sm:text-3xl font-display text-mayssa-brown">
                Une cuisine de cœur, née à la maison
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Maison Mayssa est née d&apos;une grande passion pour la cuisine, les desserts
                généreux et les tables chaleureuses que l&apos;on partage en famille ou entre amis.
                Derrière chaque création se cache une personne discrète mais profondément
                passionnée, qui préfère rester en retrait et laisser ses douceurs parler pour elle.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Au fil des années, les proches, voisins et amis ont commencé à commander de plus en
                plus de brownies, cookies et autres gourmandises. C&apos;est ainsi qu&apos;est née
                l&apos;envie de proposer un vrai service de précommande, tout en gardant l&apos;esprit
                maison : des recettes faites avec soin, des ingrédients choisis, et une attention
                particulière portée aux détails.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Pendant le mois de Ramadan, Maison Mayssa prépare également des assortiments
                spécialement pensés pour accompagner les tables du ftour et de la soirée :
                mini-gourmandises, box partagées, douceurs réconfortantes à savourer après une
                journée de jeûne. Toujours dans le même esprit&nbsp;: fait maison, généreux, et
                pensé pour faire plaisir.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl bg-mayssa-soft/70 p-4 sm:p-5 border border-mayssa-brown/10">
              <h3 className="font-display text-base sm:text-lg text-mayssa-brown">
                Les valeurs de Maison Mayssa
              </h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-mayssa-brown/80">
                <li>• Des recettes maison, testées et approuvées au fil du temps</li>
                <li>• Une carte courte mais travaillée, pour garantir la qualité</li>
                <li>• Des portions généreuses, comme à la maison</li>
                <li>• Un service de précommande simple, par WhatsApp uniquement</li>
              </ul>
            </div>
          </div>

          {/* Le projet : future boutique + soutien */}
          <div id="soutien" className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-mayssa-brown/10">
            <div className="rounded-2xl overflow-hidden border border-mayssa-brown/10 shadow-lg mb-6 sm:mb-8">
              <picture>
                <source srcSet="/boutique-fictif.webp" type="image/webp" />
                <img
                  src="/boutique-fictif.png"
                  alt="Maison Mayssa – Sucrée & Salée, future boutique à Annecy"
                  className="w-full h-auto object-cover"
                  width={800}
                  height={534}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 rounded-2xl bg-gradient-to-br from-mayssa-caramel/10 to-mayssa-brown/5 p-5 sm:p-6 border border-mayssa-caramel/20">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mayssa-caramel/20 text-mayssa-caramel">
                <Heart size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-caramel/80 mb-1">
                  Le projet
                </p>
                <h3 className="text-lg sm:text-xl font-display font-bold text-mayssa-brown mb-2">
                  Une boutique trompe l&apos;œil à Annecy
                </h3>
                <p className="text-xs sm:text-sm text-mayssa-brown/80 leading-relaxed">
                  L&apos;objectif est d&apos;ouvrir ma boutique de pâtisserie trompe l&apos;œil à Annecy.
                  Chaque don compte et m&apos;aide à concrétiser ce rêve. Merci de tout cœur pour votre soutien.
                </p>
              </div>
              <a
                href={`https://www.paypal.me/${PAYPAL_ME_USER}`}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => hapticFeedback('medium')}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0070ba] hover:bg-[#005ea6] text-white px-5 py-3.5 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Heart size={18} className="text-white/90" />
                Faire un don (PayPal)
              </a>
            </div>
          </div>
        </motion.section>

        {/* Zone géographique & infos pratiques */}
        <motion.section
          id="livraison"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="mt-12 sm:mt-16 section-shell bg-mayssa-soft/80 border border-mayssa-brown/5"
        >
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            <div className="space-y-2 sm:space-y-3">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/60">
                Zone géographique
              </p>
              <h2 className="text-xl sm:text-2xl font-display text-mayssa-brown">
                Où livre Maison Mayssa&nbsp;?
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Les commandes sont préparées à Annecy. La livraison est proposée sur Annecy et
                proches alentours, avec un forfait de 5&nbsp;€ pour les commandes inférieures à
                {FREE_DELIVERY_THRESHOLD}&nbsp;€. À partir de {FREE_DELIVERY_THRESHOLD}&nbsp;€ d&apos;achat, la livraison est offerte sur la zone
                habituelle.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Pour les secteurs un peu plus éloignés autour d&apos;Annecy (autres communes du
                bassin annécien), la livraison peut être étudiée au cas par cas directement par
                message, en fonction du jour et du montant de la commande.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl bg-white/80 p-4 sm:p-5 border border-mayssa-brown/10">
              <h3 className="font-display text-base sm:text-lg text-mayssa-brown">Infos pratiques</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-mayssa-brown/80">
                <li>• Service de 18h30 à 2h du matin</li>
                <li>• Livraison Annecy & alentours</li>
                <li>• Livraison offerte dès {FREE_DELIVERY_THRESHOLD}&nbsp;€ d&apos;achat</li>
                <li>• Précommande uniquement — paiement par PayPal (optionnel) ou sur place</li>
                <li>• Règlement à la livraison, au retrait ou par PayPal</li>
              </ul>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-mayssa-brown/60">
                Pour toute question sur la zone de livraison ou un besoin particulier (grosse
                commande, événement, Ramadan, etc.), le plus simple est d&apos;envoyer un message
                directement via WhatsApp (commande et contact par WhatsApp uniquement).
              </p>
            </div>
          </div>
          <div className="mt-6">
            <DeliveryZoneMap />
          </div>
        </motion.section>

        <Suspense fallback={null}>
          <Testimonials />
          <PollSection />
          <CommunityMapSection />
          <OccasionsSection />
          <LegalPagesSections />
        </Suspense>
        <AggregateRatingSchema />
        <Footer />
      </div>


      {/* Floating cart bar - Desktop only, appears when cart section is not visible */}
      <FloatingCartBar items={cart} total={total} />

      {/* Modals (lazy-loaded, mounted only when needed) */}
      {selectedProductForSize && (
        <Suspense fallback={null}>
          <SizeSelectorModal
            product={selectedProductForSize}
            onClose={() => setSelectedProductForSize(null)}
            onSelect={handleSizeSelect}
          />
        </Suspense>
      )}
      {selectedProductForTiramisu && (
        <Suspense fallback={null}>
          <TiramisuCustomizationModal
            product={selectedProductForTiramisu}
            onClose={() => setSelectedProductForTiramisu(null)}
            onSelect={handleTiramisuCustomization}
          />
        </Suspense>
      )}
      {selectedProductForBox && (
        <Suspense fallback={null}>
          <BoxCustomizationModal
            product={selectedProductForBox}
            onClose={() => setSelectedProductForBox(null)}
            onSelect={handleBoxCustomization}
          />
        </Suspense>
      )}
      {selectedProductForBoxFlavors && (
        <Suspense fallback={null}>
          <BoxFlavorsModal
            product={selectedProductForBoxFlavors}
            products={availableProducts}
            onClose={() => setSelectedProductForBoxFlavors(null)}
            onSelect={handleBoxFlavorsSelect}
          />
        </Suspense>
      )}

      {/* Modal Trompe l'oeil (précommande) */}
      <TrompeLOeilModal
        product={selectedProductForTrompeLoeil}
        stock={selectedProductForTrompeLoeil ? getStock(selectedProductForTrompeLoeil.id) : null}
        onClose={() => setSelectedProductForTrompeLoeil(null)}
        onConfirm={handleTrompeLOeilConfirm}
      />

      {/* Mobile Components */}
      <BottomNav
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        favoritesCount={favoritesCount}
        onCartClick={() => setIsCartSheetOpen(true)}
        onFavoritesClick={() => setIsFavoritesSheetOpen(true)}
      />
      <FloatingCartPreview
        items={cart}
        total={total}
        onExpand={() => setIsCartSheetOpen(true)}
      />
      <CartSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        items={cart}
        total={total}
        note={note}
        customer={customer}
        onUpdateQuantity={handleUpdateQuantity}
        onNoteChange={setNote}
        onCustomerChange={setCustomer}
        onSend={() => setShowRecapModal(true)}
        onSendInstagram={handleSendInstagram}
        onSendSnap={handleSendSnap}
        onAccountClick={handleAccountClick}
        selectedReward={selectedReward}
        onSelectReward={setSelectedReward}
        deliverySlots={deliverySlots}
        minDate={deliverySchedule.minDate}
        maxDate={deliverySchedule.maxDate}
        availableWeekdays={deliverySchedule.availableWeekdays}
        retraitTimeSlots={deliverySchedule.retraitTimeSlots}
        livraisonTimeSlots={deliverySchedule.livraisonTimeSlots}
        promoCodeInput={promoCodeInput}
        setPromoCodeInput={setPromoCodeInput}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyPromo}
        onClearPromo={handleClearPromo}
        donationAmount={donationAmount ?? 0}
        setDonationAmount={setDonationAmount}
        referralCodeInput={referralCodeInput}
        setReferralCodeInput={setReferralCodeInput}
        mysteryFraiseDiscount={0}
      />
      <OrderRecapModal
        isOpen={showRecapModal}
        onClose={() => setShowRecapModal(false)}
        onConfirm={async () => {
          await handleSend()
          setShowRecapModal(false)
          setIsCartSheetOpen(false)
        }}
        customer={customer}
        items={cart}
        total={total}
        deliveryFee={(() => {
          const totalAfterDiscount = total - (appliedPromo?.discount ?? 0)
          return computeDeliveryFee(customer, totalAfterDiscount) ?? 0
        })()}
        discountAmount={appliedPromo?.discount ?? 0}
        donationAmount={donationAmount ?? 0}
      />
      <FavoritesSheet
        isOpen={isFavoritesSheetOpen}
        onClose={() => setIsFavoritesSheetOpen(false)}
        favorites={favorites}
        onRemove={removeFavorite}
        onAddToCart={handleAddToCart}
        onClear={clearFavorites}
      />
      <FlyToCart
        trigger={flyTrigger}
        productImage={flyProduct.image}
        productName={flyProduct.name}
        startPosition={flyProduct.position}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Complementary product suggestions (lazy) */}
      <Suspense fallback={null}>
        <ComplementarySuggestions
          products={suggestedProducts}
          onAdd={(p) => { setSuggestedProducts([]); handleAddToCart(p) }}
          onDismiss={() => setSuggestedProducts([])}
        />
      </Suspense>

      {/* Product Detail Modal - Mobile */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAdd={handleAddToCart}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        stock={selectedProductForDetail ? getStock(selectedProductForDetail.id) : null}
        isPreorderDay={isPreorderDay}
        dayNames={dayNames}
      />

      {/* Instagram instruction modal - après envoi commande via Instagram */}
      <InstagramInstructionModal
        isOpen={isInstagramModalOpen}
        onClose={() => setIsInstagramModalOpen(false)}
        messageParts={instagramParts}
      />

      {/* Snap instruction modal — le client doit copier le message puis le coller sur Snapchat */}
      <SnapInstructionModal
        isOpen={isSnapModalOpen}
        onClose={() => setIsSnapModalOpen(false)}
        message={snapMessage}
      />

      {/* Écran confirmation commande (numéro, récap, PayPal, lien statut) */}
      {orderConfirmation && (
        <OrderConfirmation
          data={orderConfirmation}
          whatsappMessage={orderConfirmation.whatsappMessage}
          onClose={() => setOrderConfirmation(null)}
        />
      )}

      {/* PWA install prompt */}
      <PWAInstallPrompt />

      {/* Onboarding Tour - Mobile (lazy, s'affiche 1.5s après le mount) */}
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>

      {/* Auth Modals (lazy — Firebase chargé uniquement à l'ouverture) */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModals
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            mode={authMode}
            onModeChange={setAuthMode}
          />
        </Suspense>
      )}

      {/* Account Page Modal */}
      <AnimatePresence>
        {isAccountPageOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountPageOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-4 sm:inset-8 z-[51] bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="h-full overflow-y-auto">
                <div className="p-4 sm:p-8">
                  <Suspense fallback={<div className="text-center py-12 text-mayssa-brown/60">Chargement...</div>}>
                    <AccountPage onClose={() => setIsAccountPageOpen(false)} />
                  </Suspense>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fidelity Welcome Modal - Desktop */}
      <div className="hidden md:block">
        <FidelityWelcomeModal 
          onLoginClick={handleFidelityLogin}
          onRegisterClick={handleFidelityRegister}
        />
      </div>

      {/* Fidelity Welcome Banner - Mobile */}
      <div className="md:hidden">
        <FidelityWelcomeBanner 
          onRegisterClick={handleFidelityRegister}
        />
      </div>

      {/* Fidelity Toast - Triggered on add to cart */}
      <FidelityToast
        trigger={fidelityToastTrigger.trigger}
        productName={fidelityToastTrigger.productName}
        onSignUpClick={handleFidelityRegister}
      />
    </div>
  )
}

export default AppRouter
