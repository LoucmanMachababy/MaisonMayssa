import { useMemo, useState, useEffect, useRef, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useVisitorNotification } from './hooks/useVisitorNotification'
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
import { FavorisSection } from './components/FavorisSection'
import { OfflineIndicator } from './components/OfflineIndicator'
import { InstagramInstructionModal } from './components/InstagramInstructionModal'
import { SnapInstructionModal } from './components/SnapInstructionModal'
import { FloatingCartBar } from './components/FloatingCartBar'
import { ComplementarySuggestions } from './components/ComplementarySuggestions'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { AdminPanel } from './components/admin/AdminPanel'
import { ResourcePreloader, defaultPreloadConfig } from './components/ResourcePreloader'
import { AccessibilityProvider, AccessibilityControls } from './components/AccessibilityProvider'
import { SkipLinks } from './components/SkipLinks'
import { FidelityWelcomeModal, FidelityWelcomeBanner } from './components/FidelityWelcomeModal'
import { FidelityToast, FidelityCheckoutReminder } from './components/FidelityToast'
import { useStock } from './hooks/useStock'
import { useAuth } from './hooks/useAuth'
import { AuthModals } from './components/auth/AuthModals'
import { AccountPage } from './components/auth/AccountPage'
import { addUserPoints } from './lib/firebase'

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
import { TrompeLOeilModal } from './components/TrompeLOeilModal'
import { createOrder, updateStock as firebaseUpdateStock, getStock as fetchAllStock, REWARD_COSTS, REWARD_LABELS, claimReward } from './lib/firebase'
import { PHONE_E164, FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL } from './constants'
import { useProducts } from './hooks/useProducts'
import type {
  Product,
  ProductSize,
  CartItem,
  Channel,
  ProductCategory,
  CustomerInfo,
} from './types'
import {
  ANNECY_GARE,
  DELIVERY_RADIUS_KM,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  calculateDistance,
  computeDeliveryFee,
} from './lib/delivery'
import { isPreorderNotYetAvailable, isBeforeOrderCutoff, isBeforeFirstPickupDate } from './lib/utils'
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
  Eye
} from 'lucide-react'

function AppRouter() {
  const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin')
  useEffect(() => {
    const handler = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  if (isAdmin) return <AdminPanel />
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
  useEffect(() => { stockMapRef.current = stockMap }, [stockMap])
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated }, [isAuthenticated])

  // Notification de visite Telegram
  useVisitorNotification()

  // Confetti effect
  const { trigger: confettiTrigger, origin: confettiOrigin, fire: fireConfetti } = useConfetti()

  // Fly-to-cart animation
  const { trigger: flyTrigger, currentProduct: flyProduct, fly: flyToCart } = useFlyToCart()

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [isFavoritesSheetOpen, setIsFavoritesSheetOpen] = useState(false)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null)

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

  // Remove initial loader once app is mounted
  useEffect(() => {
    const loader = document.getElementById('initial-loader')
    if (loader) {
      // Fade out animation
      loader.style.transition = 'opacity 0.5s ease-out'
      loader.style.opacity = '0'
      setTimeout(() => {
        loader.remove()
      }, 500)
    }
  }, [])


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
          const currentStock = await fetchAllStock()
          for (const item of expired) {
            const origId = getOriginalProductId(item.product.id)
            const qty = currentStock[origId] ?? 0
            await firebaseUpdateStock(origId, qty + item.quantity)
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
        for (const item of expired) {
          const origId = getOriginalProductId(item.product.id)
          const qty = stockMapRef.current[origId] ?? 0
          firebaseUpdateStock(origId, qty + item.quantity)
        }
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
  const [channel, setChannel] = useState<Channel>('whatsapp')
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
          address: p.address || '',
          addressCoordinates: null,
          wantsDelivery: !!p.wantsDelivery,
          date: '',
          time: '',
        }
      }
    } catch {}
    return {
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      addressCoordinates: null,
      wantsDelivery: false,
      date: '',
      time: '',
    }
  })

  // Save customer info to localStorage (persistent fields only)
  useEffect(() => {
    localStorage.setItem('maison-mayssa-customer', JSON.stringify({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      address: customer.address,
      wantsDelivery: customer.wantsDelivery,
    }))
  }, [customer.firstName, customer.lastName, customer.phone, customer.address, customer.wantsDelivery])

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

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  )

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
        await firebaseUpdateStock(product.id, Math.max(0, currentQty - quantity))
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
          await firebaseUpdateStock(origId, currentQty + item.quantity)
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
        if (delta > 0) {
          if (currentQty !== null && currentQty < delta) {
            showToast(`Stock insuffisant (${currentQty} restant${currentQty > 1 ? 's' : ''})`, 'error')
            return
          }
          if (currentQty !== null) {
            await firebaseUpdateStock(origId, currentQty - delta)
          }
        } else {
          if (currentQty !== null) {
            await firebaseUpdateStock(origId, currentQty + Math.abs(delta))
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

  const buildOrderMessage = () => {
    if (cart.length === 0) return ''

    const distanceFromAnnecy = calculateDistance(customer.addressCoordinates, ANNECY_GARE)
    const isWithinDeliveryZone = distanceFromAnnecy !== null && distanceFromAnnecy <= DELIVERY_RADIUS_KM

    let deliveryFee = 0
    let deliveryStatus: 'free' | 'paid' | 'to_define' = 'free'

    if (customer.wantsDelivery) {
      if (!customer.addressCoordinates || !isWithinDeliveryZone) {
        deliveryStatus = 'to_define'
      } else if (total < FREE_DELIVERY_THRESHOLD) {
        deliveryFee = DELIVERY_FEE
        deliveryStatus = 'paid'
      }
    }

    const finalTotal = total + deliveryFee
    const modeTexte = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'

    // Retire les emojis des noms pour un message WhatsApp lisible
    const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim()

    const getOrderLineLabel = (item: CartItem): string => {
      const p = item.product
      const name = stripEmoji(p.name)
      const cat = p.category
      if (cat === "Trompe l'oeil") return `🎨 ${name} (PRÉCOMMANDE – à récupérer sous ${p.preorder?.daysToPickup ?? 3} j)`
      if (cat === 'Tiramisus') {
        const base = p.description ? p.description : ''
        return `Tiramisu – ${name}${base ? ` – ${base}` : ''}`
      }
      if (cat === 'Brownies') return `Brownie – ${name}`
      if (cat === 'Cookies') return `Cookie – ${name}`
      if (cat === 'Layer Cups') return `Layer cup – ${name}`
      if (cat === 'Boxes') return p.description ? `${name} – ${p.description}` : name
      if (cat === 'Mini Gourmandises') return p.description ? `${name} – ${p.description}` : name
      return p.description ? `${name} – ${p.description}` : name
    }

    const lines: string[] = []

    // —— En-tête ——
    lines.push('Bonjour Maison Mayssa', '', "Je souhaiterais passer une commande, voici les détails :", '')

    // —— INFORMATIONS CLIENT ——
    lines.push('*INFORMATIONS CLIENT*', '')
    lines.push(`Nom : ${customer.lastName || '[à compléter]'}`)
    lines.push(`Prénom : ${customer.firstName || '[à compléter]'}`)
    lines.push(`Téléphone : ${customer.phone || '[à compléter]'}`)
    lines.push(`Mode : ${modeTexte}`)

    if (customer.wantsDelivery && customer.address.trim()) {
      lines.push(`Adresse : ${customer.address.trim()}`)
      if (distanceFromAnnecy !== null) {
        lines.push(`Distance : ${distanceFromAnnecy.toFixed(1)} km depuis la gare d'Annecy`)
      }
    }

    if (customer.date && customer.time) {
      const dateObj = new Date(customer.date)
      const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
      lines.push(`Date souhaitée : ${dateFormatted}`)
      lines.push(`Heure souhaitée : ${customer.time}`)
    }

    lines.push('', '')

    // —— COMMANDE (numérotée, une ligne par produit) ——
    lines.push('*COMMANDE*', '')
    cart.forEach((item, index) => {
      const label = getOrderLineLabel(item)
      const totalPrice = (item.product.price * item.quantity).toFixed(2).replace('.', ',')
      const qty = item.quantity > 1 ? `${item.quantity}× ` : ''
      lines.push(`${index + 1}. ${qty}${label} → ${totalPrice} €`)
      lines.push('')
    })

    // Ajouter la récompense si sélectionnée
    if (selectedReward && isAuthenticated) {
      lines.push(`${cart.length + 1}. 🎁 ${REWARD_LABELS[selectedReward.type]} (récompense fidélité) → 0,00 €`)
      lines.push('')
    }

    // —— Récapitulatif ——
    lines.push('*RÉCAPITULATIF*', '')
    lines.push(`Sous-total : ${total.toFixed(2)} €`)

    if (customer.wantsDelivery) {
      if (deliveryStatus === 'to_define') {
        lines.push('')
        lines.push(`⚠️ LIVRAISON HORS ZONE (> ${DELIVERY_RADIUS_KM} km)`)
        lines.push('Tarif à définir ensemble.')
        lines.push(`Total produits : ${total.toFixed(2)} €`)
      } else if (deliveryStatus === 'paid') {
        lines.push(`Livraison : +${DELIVERY_FEE} €`)
        lines.push(`*Total : ${finalTotal.toFixed(2)} €*`)
      } else {
        lines.push(`Livraison : offerte (≥ ${FREE_DELIVERY_THRESHOLD} €)`)
        lines.push(`*Total : ${finalTotal.toFixed(2)} €*`)
      }
    } else {
      lines.push(`*Total : ${total.toFixed(2)} €*`)
    }

    lines.push('', '')

    if (note.trim() && note.trim() !== 'Pour le … (date, créneau, adresse)') {
      lines.push('*INFOS COMPLÉMENTAIRES*', '')
      lines.push(note.trim(), '', '')
    }

    // Mention précommande si trompe l'oeil dans le panier
    const hasTrompeLoeil = cart.some(i => i.product.category === "Trompe l'oeil")
    if (hasTrompeLoeil) {
      lines.push('⚠️ *PRÉCOMMANDE TROMPE L\'ŒIL*')
      lines.push('Les trompe l\'œil sont à récupérer sous 3 jours après validation de la commande.')
      lines.push('', '')
    }

    // Précommande produits classiques (cookies, brownies, minibox…) — récupération à partir du 18/02
    const hasClassic = cart.some(i => i.product.category !== "Trompe l'oeil")
    if (hasClassic && isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)) {
      lines.push('📅 *PRÉCOMMANDE*')
      lines.push(`Récupération des pâtisseries, cookies, boxes… à partir du ${FIRST_PICKUP_DATE_CLASSIC_LABEL}.`)
      lines.push('', '')
    }

    lines.push('Merci beaucoup, à très vite !')
    lines.push('— Site de précommande Maison Mayssa (WhatsApp uniquement)')

    return lines.join('\n')
  }

  const buildInstagramMessages = (): string[] => {
    if (cart.length === 0) return []

    const distanceFromAnnecy = calculateDistance(customer.addressCoordinates, ANNECY_GARE)
    const isWithinDeliveryZone = distanceFromAnnecy !== null && distanceFromAnnecy <= DELIVERY_RADIUS_KM
    let deliveryFee = 0
    if (customer.wantsDelivery) {
      if (customer.addressCoordinates && isWithinDeliveryZone && total < FREE_DELIVERY_THRESHOLD) {
        deliveryFee = DELIVERY_FEE
      }
    }
    const finalTotal = total + deliveryFee
    const mode = customer.wantsDelivery ? 'Livraison' : 'Retrait'

    const stripEmoji = (s: string) => s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim()

    // -- Header (compact) --
    const header: string[] = []
    header.push('Bonjour ! Commande via le site :')
    header.push(`${customer.firstName} ${customer.lastName} · ${customer.phone}`)
    header.push(`Mode : ${mode}`)
    if (customer.wantsDelivery && customer.address.trim()) {
      header.push(`Adr : ${customer.address.trim()}`)
    }
    if (customer.date && customer.time) {
      const d = new Date(customer.date)
      header.push(`Date : ${d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${customer.time}`)
    }
    header.push('')

    // -- Item lines (compact) --
    // Skip generic descriptions for products with size already in name (Layer Cups, etc.)
    const itemLines: string[] = []
    cart.forEach((item, i) => {
      const name = stripEmoji(item.product.name)
      const cat = item.product.category
      const isTrompeLoeil = cat === "Trompe l'oeil"
      // Include description only for Tiramisus (has customization info) and Boxes
      const needsDesc = cat === 'Tiramisus' || cat === 'Boxes' || cat === 'Mini Gourmandises'
      const desc = needsDesc && item.product.description ? ` (${item.product.description})` : ''
      const precoTag = isTrompeLoeil ? ' [PRÉCO]' : ''
      const price = (item.product.price * item.quantity).toFixed(2).replace('.', ',')
      const qty = item.quantity > 1 ? `${item.quantity}× ` : ''
      itemLines.push(`${i + 1}. ${qty}${name}${desc}${precoTag} → ${price}€`)
    })

    // Ajouter la récompense si sélectionnée
    if (selectedReward && isAuthenticated) {
      itemLines.push(`${cart.length + 1}. 🎁 ${REWARD_LABELS[selectedReward.type]} [FIDÉLITÉ] → 0€`)
    }

    // -- Footer (compact) --
    const footer: string[] = ['']
    if (customer.wantsDelivery) {
      const delivLabel = deliveryFee > 0 ? `+${DELIVERY_FEE}€` : (!customer.addressCoordinates || !isWithinDeliveryZone) ? 'à définir' : 'offerte'
      footer.push(`Livraison : ${delivLabel}`)
    }
    footer.push(`Total : ${finalTotal.toFixed(2).replace('.', ',')}€`)
    const hasTrompeLoeilIG = cart.some(i => i.product.category === "Trompe l'oeil")
    const hasClassicIG = cart.some(i => i.product.category !== "Trompe l'oeil")
    if (hasTrompeLoeilIG) {
      footer.push(`⚠️ Trompe l'œil = précommande (récup. sous 3j)`)
    }
    if (hasClassicIG && isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)) {
      footer.push(`📅 Précommande — récup. à partir du ${FIRST_PICKUP_DATE_CLASSIC_LABEL}`)
    }
    if (note.trim() && note.trim() !== 'Pour le … (date, créneau, adresse)') {
      footer.push(`Note : ${note.trim()}`)
    }

    // Try to fit everything in one message
    const full = [...header, ...itemLines, ...footer].join('\n')
    if (full.length <= 950) return [full]

    // Split into multiple messages
    const IG_LIMIT = 900
    const messages: string[] = []
    let current = header.join('\n') + '\n'

    for (const line of itemLines) {
      if ((current + line + '\n').length > IG_LIMIT) {
        messages.push(current.trim())
        current = '(suite)\n'
      }
      current += line + '\n'
    }

    // Add footer to last chunk or new one
    const footerStr = footer.join('\n')
    if ((current + footerStr).length > IG_LIMIT) {
      messages.push(current.trim())
      messages.push(footerStr.trim())
    } else {
      current += footerStr
      messages.push(current.trim())
    }

    // Label parts
    if (messages.length > 1) {
      return messages.map((m, i) => `[${i + 1}/${messages.length}]\n${m}`)
    }
    return messages
  }

  const [instagramParts, setInstagramParts] = useState<string[]>([])
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false)

  const handleSend = async () => {
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'oeil")
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff()) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 23h. Les précommandes trompe-l\'œil restent disponibles.', 'error', 5000)
      return
    }

    // Envoi uniquement par WhatsApp — ouvre l'app avec le message prérempli
    const message = buildOrderMessage()
    if (!message) return
    const encoded = encodeURIComponent(message)
    window.open(`https://wa.me/${PHONE_E164}?text=${encoded}`, '_blank')
    showToast('WhatsApp s\'ouvre avec votre commande — envoyez le message !', 'success')

    // --- Confirmer les réservations trompe l'oeil (le stock reste décrémenté) ---
    const trompeLOeilItems = cart.filter(
      (item) =>
        item.product.category === "Trompe l'oeil" &&
        item.reservationExpiresAt &&
        !item.reservationConfirmed,
    )

    if (trompeLOeilItems.length > 0) {
      // Marquer les réservations comme confirmées (le timer ne les touchera plus)
      setCart((current) =>
        current.map((item) =>
          item.reservationExpiresAt && !item.reservationConfirmed && item.product.category === "Trompe l'oeil"
            ? { ...item, reservationConfirmed: true }
            : item,
        ),
      )

      // Créer la précommande dans Firebase pour l'admin
      try {
        await createOrder({
          items: trompeLOeilItems.map((item) => ({
            productId: getOriginalProductId(item.product.id),
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
          })),
          customer: {
            firstName: customer.firstName || 'Client',
            lastName: customer.lastName || '',
            phone: customer.phone || '',
          },
          total: trompeLOeilItems.reduce(
            (sum, item) => sum + item.product.price * item.quantity,
            0,
          ),
          status: 'en_attente',
          createdAt: Date.now(),
        })
      } catch {
        // Silently fail — commande quand même dans le panier
      }
    }

    // --- Réclamation de la récompense sélectionnée ---
    if (selectedReward && isAuthenticated && user) {
      try {
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
        const orderTotal = total + (computeDeliveryFee(customer, total) || 0) // Inclut les frais de livraison
        const basePoints = Math.round(orderTotal) // 1 € = 1 point
        
        // Générer un ID de commande simple pour traçabilité
        const orderId = `order_${Date.now()}`

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

    // Message dédié pour les invités (non connectés)
    if (!isAuthenticated) {
      showToast(
        'Merci pour votre commande, nous vous confirmerons si celle-ci a été validée en privé.',
        'success',
        8000
      )
    }
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

        <main id="main-content" className="mt-8 sm:mt-12 flex flex-col gap-12 sm:gap-20 md:gap-28 items-center" role="main" aria-label="Contenu principal">
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
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-10 py-2.5 rounded-xl bg-white/60 border border-mayssa-brown/10 text-sm text-mayssa-brown placeholder-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:bg-white transition-all"
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
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAdd={handleAddToCart}
                        isFavorite={isFavorite(product.id)}
                        onToggleFavorite={toggleFavorite}
                        stock={getStock(product.id)}
                        isPreorderDay={isPreorderDay}
                        dayNames={dayNames}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Mobile Swipeable List — tap = ajout direct (pas de page détail / pavé) */}
                <div className="md:hidden space-y-3">
                  {filteredProducts.map((product) => (
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
                    />
                  ))}
                </div>
              </>
            )}
          </motion.section>

          {/* Favoris Section */}
          <FavorisSection
            favorites={favorites}
            onRemove={removeFavorite}
            onAddToCart={handleAddToCart}
            onClear={clearFavorites}
          />

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
              channel={channel}
              customer={customer}
              onUpdateQuantity={handleUpdateQuantity}
              onNoteChange={setNote}
              onChannelChange={setChannel}
              onCustomerChange={setCustomer}
              onSend={handleSend}
              onAccountClick={handleAccountClick}
              selectedReward={selectedReward}
              onSelectReward={setSelectedReward}
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
          className="mt-12 sm:mt-16 md:mt-24 section-shell bg-white/80 border border-mayssa-brown/5 premium-shadow"
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
                <li>• Précommande uniquement, pas de paiement en ligne</li>
                <li>• Règlement à la livraison ou au retrait</li>
              </ul>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-mayssa-brown/60">
                Pour toute question sur la zone de livraison ou un besoin particulier (grosse
                commande, événement, Ramadan, etc.), le plus simple est d&apos;envoyer un message
                directement via WhatsApp (commande et contact par WhatsApp uniquement).
              </p>
            </div>
          </div>
        </motion.section>

        <Suspense fallback={null}>
          <Testimonials />
          <LegalPagesSections />
        </Suspense>
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
        channel={channel}
        customer={customer}
        onUpdateQuantity={handleUpdateQuantity}
        onNoteChange={setNote}
        onChannelChange={setChannel}
        onCustomerChange={setCustomer}
        onSend={handleSend}
        onAccountClick={handleAccountClick}
        selectedReward={selectedReward}
        onSelectReward={setSelectedReward}
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

      {/* Complementary product suggestions */}
      <ComplementarySuggestions
        products={suggestedProducts}
        onAdd={(p) => { setSuggestedProducts([]); handleAddToCart(p) }}
        onDismiss={() => setSuggestedProducts([])}
      />

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

      {/* Snap instruction modal - après copie pour Snapchat */}
      <SnapInstructionModal
        isOpen={isSnapModalOpen}
        onClose={() => setIsSnapModalOpen(false)}
      />

      {/* PWA install prompt */}
      <PWAInstallPrompt />

      {/* Onboarding Tour - Mobile (lazy, s'affiche 1.5s après le mount) */}
      <Suspense fallback={null}>
        <OnboardingTour />
      </Suspense>

      {/* Auth Modals */}
      <AuthModals
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

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
                  <AccountPage onClose={() => setIsAccountPageOpen(false)} />
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
