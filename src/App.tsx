import { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { lazyWithRetry, clearChunkReloadFlag } from './lib/lazyWithRetry'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AnimatePresence, motion } from 'framer-motion'
import { useActiveSession } from './hooks/useActiveSession'
import { Navbar } from './components/Navbar'
import { BirthdayBanner } from './components/BirthdayBanner'
import { Header } from './components/Header'
import { ProductCard } from './components/ProductCard'
import { Cart } from './components/Cart'
import { Footer } from './components/Footer'
import { ToastContainer, type Toast } from './components/Toast'
import { Confetti, useConfetti } from './components/effects'
import { OfflineIndicator } from './components/OfflineIndicator'
import { CookieBanner } from './components/CookieBanner'
import { EventModeModal } from './components/EventModeModal'
import {
  InstagramInstructionModal,
  type InstagramOrderModalData,
} from './components/InstagramInstructionModal'
import { SnapInstructionModal, type SnapOrderModalData } from './components/SnapInstructionModal'
import { FloatingCartBar } from './components/FloatingCartBar'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
const AdminPanel = lazyWithRetry(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })))
import { ResourcePreloader, defaultPreloadConfig } from './components/ResourcePreloader'
import { AccessibilityProvider, AccessibilityControls } from './components/AccessibilityProvider'
import { SkipLinks } from './components/SkipLinks'
import { FidelityWelcomeModal, FidelityWelcomeBanner } from './components/FidelityWelcomeModal'
import { FidelityToast, FidelityCheckoutReminder } from './components/FidelityToast'
import { useStock } from './hooks/useStock'
import { useAuth } from './hooks/useAuth'
const AuthModals = lazyWithRetry(() => import('./components/auth/AuthModals').then(m => ({ default: m.AuthModals })))
const AccountPage = lazyWithRetry(() => import('./components/auth/AccountPage').then(m => ({ default: m.AccountPage })))
import { listenDeliverySlots, reserveDeliverySlot, listenSettings } from './lib/firebase'
import {
  PRODUCTS,
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  PHONE_E164,
  DISCOVERY_BOX_TROMPE_SLOT_COUNT,
  isCustomizableTrompeBundleBoxId,
  getTrompeBundleSelectionSlotCount,
  isTrompeBoxWithStoredSelection,
} from './constants'
import { getMinDate } from './lib/delivery'
import {
  getEffectiveStockForProductCard,
  getEligibleTrompeIdsForDiscoveryBox,
  listIndividualTrompeLoeilProducts,
} from './lib/discoveryBox'
// Firebase importé dynamiquement pour le reste
// addUserPoints, createOrder, etc. sont importés via import() dans les handlers

import { VisualBackground } from './components/effects/VisualBackground'

const Testimonials = lazyWithRetry(() => import('./components/Testimonials').then(m => ({ default: m.Testimonials })))
const FAQSection = lazyWithRetry(() => import('./components/LegalPages').then(m => ({ default: m.FAQSection })))
const LegalPagesSections = lazyWithRetry(() => import('./components/LegalPages').then(m => ({ default: m.default })))
import {
  BottomNav,
  FloatingCartPreview,
  SwipeableProductCard,
  FlyToCart,
  useFlyToCart,
  CartSheet,
  ProductDetailModal,
  StickyCategoryTabs,
  VoiceSearch,
  useVoiceSearch,
} from './components/mobile'
const OnboardingTour = lazyWithRetry(() => import('./components/mobile/OnboardingTour').then(m => ({ default: m.OnboardingTour })))
import { hapticFeedback } from './lib/haptics'

const SizeSelectorModal = lazyWithRetry(() => import('./components/SizeSelectorModal').then(m => ({ default: m.SizeSelectorModal })))
const TiramisuCustomizationModal = lazyWithRetry(() => import('./components/TiramisuCustomizationModal').then(m => ({ default: m.TiramisuCustomizationModal })))
const BoxCustomizationModal = lazyWithRetry(() => import('./components/BoxCustomizationModal').then(m => ({ default: m.BoxCustomizationModal })))
const BoxFlavorsModal = lazyWithRetry(() => import('./components/BoxFlavorsModal').then(m => ({ default: m.BoxFlavorsModal })))
const BoxDecouverteTrompeModal = lazyWithRetry(() =>
  import('./components/BoxDecouverteTrompeModal').then(m => ({ default: m.BoxDecouverteTrompeModal })),
)
const ComplementarySuggestions = lazyWithRetry(() => import('./components/ComplementarySuggestions').then(m => ({ default: m.ComplementarySuggestions })))
const CommunityMapSection = lazyWithRetry(() => import('./components/CommunityMapSection').then(m => ({ default: m.CommunityMapSection })))
import { TrompeLOeilModal } from './components/TrompeLOeilModal'
import { OrderConfirmation } from './components/OrderConfirmation'
import { OrderRecapModal, type OrderRecapSendChannel } from './components/OrderRecapModal'
import { AggregateRatingSchema } from './components/AggregateRatingSchema'
import { OrderStatusPage } from './components/OrderStatusPage'
import { DeliveryZoneMap } from './components/DeliveryZoneMap'
import { REWARD_COSTS, REWARD_LABELS } from './lib/rewards'
import { useProducts } from './hooks/useProducts'
import { useReviews } from './hooks/useReviews'
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
  formatDateLabel,
  normalizeInstagramHandle,
} from './lib/delivery'
import { buildOrderMessage, buildShortSocialPasteMessage } from './lib/orderMessage'
import { openWhatsAppWithPrefilledMessage } from './lib/whatsappOpen'
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
} from 'lucide-react'
import { REFERRAL_DISCOUNT_EUR } from './constants'

// ─── Anti-double-commande ─────────────────────────────────────────────────────

const MM_PENDING_ORDER_KEY = 'mm_pending_order'
const PENDING_ORDER_BLOCK_MS = 48 * 60 * 60 * 1000 // 48 h

type PendingOrderEntry = { phone: string; placedAt: number; orderNumber?: number }

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function markOrderPlaced(phone: string, orderNumber?: number): void {
  const entry: PendingOrderEntry = { phone: normalizePhone(phone), placedAt: Date.now(), orderNumber }
  try { localStorage.setItem(MM_PENDING_ORDER_KEY, JSON.stringify(entry)) } catch { /* ignore */ }
}

function getPendingOrder(phone: string): PendingOrderEntry | null {
  try {
    const raw = localStorage.getItem(MM_PENDING_ORDER_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as PendingOrderEntry
    if (Date.now() - entry.placedAt > PENDING_ORDER_BLOCK_MS) {
      localStorage.removeItem(MM_PENDING_ORDER_KEY)
      return null
    }
    const normalized = normalizePhone(phone)
    if (!normalized || !entry.phone || entry.phone !== normalized) return null
    return entry
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────

function AppRouter() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  const [isLegal, setIsLegal] = useState(() => window.location.hash === '#legal')
  const [orderStatusId, setOrderStatusId] = useState<string | null>(null)
  const [adminRetryKey, setAdminRetryKey] = useState(0)

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash
      setIsAdmin(hash === '#admin')
      setIsLegal(hash === '#legal')
      const match = hash.match(/^#\/commande\/([a-zA-Z0-9_-]+)$/)
      setOrderStatusId(match ? match[1] : null)
    }
    handler()
    window.addEventListener('hashchange', handler)
    window.addEventListener('popstate', handler)
    return () => {
      window.removeEventListener('hashchange', handler)
      window.removeEventListener('popstate', handler)
    }
  }, [])

  if (isAdmin) {
    return (
      <div key={adminRetryKey}>
        <ErrorBoundary
          message="Erreur lors du chargement de l'espace admin."
          subMessage="Vérifiez votre connexion ou réessayez. En cas de problème, rechargez la page."
          onRetry={() => setAdminRetryKey((k) => k + 1)}
          onBack={() => { window.location.hash = '' }}
          backLabel="Retour au site"
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-mayssa-soft text-mayssa-brown">
                <span>Chargement admin...</span>
              </div>
            }
          >
            <AdminPanel />
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  }
  if (isLegal) {
    return (
      <div className="min-h-screen bg-mayssa-soft">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <Suspense fallback={<div className="text-center text-mayssa-brown/60">Chargement des informations légales...</div>}>
            <LegalPagesSections />
          </Suspense>
        </div>
        <Footer />
      </div>
    )
  }
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
  const { stock: stockMap, getStock, isPreorderDay, dayNames, settings } = useStock()

  // Client authentication
  const { user, isAuthenticated, profile } = useAuth()

  // Products with Firebase overrides
  const { availableProducts } = useProducts()

  const getCardStock = useCallback(
    (p: Product) =>
      getEffectiveStockForProductCard(p, getStock, {
        boxDecouverteExcludedIds: settings.boxDecouverteTrompeExcludedIds,
        catalog: availableProducts,
      }),
    [getStock, settings.boxDecouverteTrompeExcludedIds, availableProducts],
  )

  const discoveryEligibleTrompes = useMemo(() => {
    const ids = new Set(
      getEligibleTrompeIdsForDiscoveryBox(availableProducts, settings.boxDecouverteTrompeExcludedIds),
    )
    return listIndividualTrompeLoeilProducts(availableProducts).filter((p) => ids.has(p.id))
  }, [availableProducts, settings.boxDecouverteTrompeExcludedIds])

  // Refs pour accéder aux données courantes dans les timers (évite les closures stale)
  const stockMapRef = useRef(stockMap)
  const isAuthenticatedRef = useRef(isAuthenticated)
  const [deliverySlots, setDeliverySlots] = useState<Record<string, Record<string, number>>>({})
  const [ordersOpen, setOrdersOpen] = useState(true)
  /** true quand l'admin a manuellement forcé l'ouverture — bypasse la coupure 17h */
  const [ordersExplicit, setOrdersExplicit] = useState(false)
  const [globalMessage, setGlobalMessage] = useState('')
  const [globalMessageEnabled, setGlobalMessageEnabled] = useState(false)
  const [eventModeEnabled, setEventModeEnabled] = useState(false)
  const [eventModeMessage, setEventModeMessage] = useState('')
  const [eventModePosterUrl, setEventModePosterUrl] = useState('')
  const [nextRestockDate, setNextRestockDate] = useState('')
  const [deliverySchedule, setDeliverySchedule] = useState<{
    minDate: string
    minDateRetrait: string
    minDateLivraison: string
    maxDate?: string
    availableWeekdays?: number[]
    retraitTimeSlots?: string[]
    livraisonTimeSlots?: string[]
    pickupDates?: string[]
    preorderOpenDate?: string
    preorderOpenTime?: string
  }>(() => {
    const today = getMinDate()
    return { minDate: today, minDateRetrait: today, minDateLivraison: today }
  })
  useEffect(() => { stockMapRef.current = stockMap }, [stockMap])
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated }, [isAuthenticated])
  useEffect(() => {
    clearChunkReloadFlag()
  }, [])
  useEffect(() => {
    return listenDeliverySlots(setDeliverySlots)
  }, [])
  useEffect(() => {
    return listenSettings((s) => {
      const today = getMinDate()
      const fallback = (s.firstAvailableDate && s.firstAvailableDate.trim()) ? s.firstAvailableDate.trim() : today
      const minRetrait = (s.firstAvailableDateRetrait && s.firstAvailableDateRetrait.trim()) ? s.firstAvailableDateRetrait.trim() : fallback
      const minLivraison = (s.firstAvailableDateLivraison && s.firstAvailableDateLivraison.trim()) ? s.firstAvailableDateLivraison.trim() : fallback
      const eventOn = s.eventModeEnabled === true
      setEventModeEnabled(eventOn)
      setEventModeMessage(s.eventModeMessage ?? '')
      setEventModePosterUrl(s.eventModePosterUrl ?? '')
      // Mode événement = commandes fermées (prioritaire)
      setOrdersOpen((s.ordersOpen !== false) && !eventOn)
      setOrdersExplicit((s.ordersOpen === true) && !eventOn)
      setGlobalMessage(s.globalMessage ?? '')
      setGlobalMessageEnabled(s.globalMessageEnabled === true)
      setNextRestockDate(s.nextRestockDate ?? '')
      setDeliverySchedule({
        minDate: minRetrait,
        minDateRetrait: minRetrait,
        minDateLivraison: minLivraison,
        maxDate: (s.lastAvailableDate && s.lastAvailableDate.trim()) ? s.lastAvailableDate.trim() : undefined,
        availableWeekdays: s.availableWeekdays && s.availableWeekdays.length > 0 ? s.availableWeekdays : undefined,
        retraitTimeSlots: s.retraitTimeSlots && s.retraitTimeSlots.length > 0 ? s.retraitTimeSlots : undefined,
        livraisonTimeSlots: s.livraisonTimeSlots && s.livraisonTimeSlots.length > 0 ? s.livraisonTimeSlots : undefined,
        pickupDates: s.pickupDates && s.pickupDates.length > 0 ? s.pickupDates : undefined,
        preorderOpenDate: s.preorderOpenDate,
        preorderOpenTime: s.preorderOpenTime,
      })
    })
  }, [])

  // Redirection ancre au chargement (ex. https://www.maison-mayssa.fr/#avis → scroll vers la section avis)
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, '').split('/')[0]
      if (!hash || hash === 'admin') return
      const scrollToEl = (id: string) => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          return true
        }
        return false
      }
      if (scrollToEl(hash)) return
      // Section peut être lazy-loadée (ex. Testimonials) : réessayer après un délai
      const delays = [200, 500, 1000]
      delays.forEach((ms) => {
        setTimeout(() => scrollToEl(hash), ms)
      })
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  // Confetti effect
  const { trigger: confettiTrigger, origin: confettiOrigin, fire: fireConfetti } = useConfetti()

  // Fly-to-cart animation
  const { trigger: flyTrigger, currentProduct: flyProduct, fly: flyToCart } = useFlyToCart()

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false)
  const [orderRecapChannel, setOrderRecapChannel] = useState<OrderRecapSendChannel | null>(null)
  const [orderContactIdentity, setOrderContactIdentity] = useState<OrderRecapSendChannel>('whatsapp')
  const lastAddRef = useRef<{ id: string; at: number } | null>(null)
  const openOrderRecap = useCallback((ch: OrderRecapSendChannel) => {
    setOrderContactIdentity(ch)
    setIsCartSheetOpen(false)
    setOrderRecapChannel(ch)
  }, [])
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null)
  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [donationAmount, setDonationAmount] = useState(0)
  const [referralCodeInput, setReferralCodeInput] = useState('')


  const { getAverageRatingForProduct, getReviewCountForProduct } = useReviews()

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
      setSelectedProductForDetail(product)
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
    cartProductId.replace(/-\d{10,}$/, '')

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
          const { getStock: fetchAll, updateStock, getStockDecrementItems } = await import('./lib/firebase')
          const currentStock = await fetchAll()
          for (const item of expired) {
            const origId = getOriginalProductId(item.product.id)
            const pairs = getStockDecrementItems(origId, item.quantity, PRODUCTS, {
              trompeDiscoverySelection: item.trompeDiscoverySelection,
            })
            for (const pair of pairs) {
              const qty = currentStock[pair.productId] ?? 0
              await updateStock(pair.productId, qty + pair.quantity)
            }
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
        import('./lib/firebase').then(({ updateStock, getStockDecrementItems }) => {
          for (const item of expired) {
            const origId = getOriginalProductId(item.product.id)
            const pairs = getStockDecrementItems(origId, item.quantity, PRODUCTS, {
              trompeDiscoverySelection: item.trompeDiscoverySelection,
            })
            for (const pair of pairs) {
              const qty = stockMapRef.current[pair.productId] ?? 0
              updateStock(pair.productId, qty + pair.quantity)
            }
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
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("Trompe l'œil")
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
    } catch { /* ignore */ }
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
  const [selectedProductForDiscoveryBox, setSelectedProductForDiscoveryBox] = useState<Product | null>(null)
  const [selectedProductForTrompeLoeil, setSelectedProductForTrompeLoeil] = useState<Product | null>(null)

  const trompePickerEligibleTrompes = useMemo(() => {
    const p = selectedProductForDiscoveryBox
    if (!p) return []
    if (p.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) return discoveryEligibleTrompes
    if (isCustomizableTrompeBundleBoxId(p.id) && p.bundleProductIds?.length) {
      const allowed = new Set(p.bundleProductIds)
      return listIndividualTrompeLoeilProducts(availableProducts).filter((x) => allowed.has(x.id))
    }
    return []
  }, [selectedProductForDiscoveryBox, discoveryEligibleTrompes, availableProducts])

  const trompePickerSlotCount = selectedProductForDiscoveryBox
    ? getTrompeBundleSelectionSlotCount(selectedProductForDiscoveryBox.id)
    : DISCOVERY_BOX_TROMPE_SLOT_COUNT

  const [toasts, setToasts] = useState<Toast[]>([])
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
      showToast('Tu as encore des articles dans ton panier. Descendez vers « Voir la commande » pour finaliser.', 'info', 6000)
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

  // Suivi des sessions actives côté admin
  const { sessionId } = useActiveSession(cart, customer, total)

  const categories = useMemo(() => {
    return Array.from(new Set(availableProducts.map((p) => p.category))) as ProductCategory[]
  }, [availableProducts])

  // Si la catégorie active n'existe pas (ex. pas de trompe l'oeil), prendre la première
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0])
    }
  }, [categories, activeCategory])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Trompe l'œil": return <Eye size={20} />
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
    filtered = filtered.filter((p) => p.category === activeCategory)

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
    const arr = [...filteredProducts]
    // 1. Produits épinglés par l'admin en premier
    arr.sort((a, b) => {
      const aPinned = (a as { pinned?: boolean }).pinned ? 1 : 0
      const bPinned = (b as { pinned?: boolean }).pinned ? 1 : 0
      return bPinned - aPinned
    })
    // 2. Trompe l'œil : d'abord « bientôt en rupture » (même seuils que StockBadge : 1–5),
    //    puis tri par meilleurs avis (note moyenne puis nombre d'avis)
    if (activeCategory === "Trompe l'œil") {
      const pinnedCount = arr.filter((p) => (p as { pinned?: boolean }).pinned).length
      const trompeLoeil = arr.slice(pinnedCount)
      const rest = arr.slice(0, pinnedCount)
      const effStock = (p: Product) => getCardStock(p)
      const isSoonLowStock = (p: Product) => {
        const s = effStock(p)
        return s !== null && s >= 1 && s <= 5
      }
      trompeLoeil.sort((a, b) => {
        const aSoon = isSoonLowStock(a)
        const bSoon = isSoonLowStock(b)
        if (aSoon !== bSoon) return aSoon ? -1 : 1
        if (aSoon && bSoon) {
          const sa = effStock(a)!
          const sb = effStock(b)!
          if (sa !== sb) return sa - sb
        }
        const aRating = getAverageRatingForProduct(a.id)
        const bRating = getAverageRatingForProduct(b.id)
        const aCount = getReviewCountForProduct(a.id)
        const bCount = getReviewCountForProduct(b.id)
        if (aRating != null && bRating != null) {
          if (bRating !== aRating) return bRating - aRating
          return bCount - aCount
        }
        if (aRating != null) return -1
        if (bRating != null) return 1
        return bCount - aCount
      })
      return [...rest, ...trompeLoeil]
    }
    // 3. trompe-loeil-fraise en second si pas déjà épinglé (autres catégories)
    const fraiseIdx = arr.findIndex((p) => p.id === 'trompe-loeil-fraise')
    if (fraiseIdx > 0 && !(arr[fraiseIdx] as { pinned?: boolean }).pinned) {
      const pinnedCount = arr.filter((p) => (p as { pinned?: boolean }).pinned).length
      const [fraise] = arr.splice(fraiseIdx, 1)
      arr.splice(pinnedCount, 0, fraise)
    }
    return arr
  }, [filteredProducts, activeCategory, getAverageRatingForProduct, getReviewCountForProduct, getCardStock])

  const handleAddToCart = (product: Product) => {
    if (isPreorderNotYetAvailable(product)) return

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

    if (product.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID || isCustomizableTrompeBundleBoxId(product.id)) {
      setSelectedProductForDiscoveryBox(product)
      return
    }

    // If product has sizes (like Layer Cups), open size selector modal
    if (product.sizes && product.sizes.length > 0) {
      setSelectedProductForSize(product)
      return
    }

    // Sur mobile, certains navigateurs peuvent déclencher deux événements très rapprochés
    // pour un seul tap. On ignore un deuxième ajout sur le même produit < 350 ms.
    if (isMobile) {
      const now = Date.now()
      if (lastAddRef.current && lastAddRef.current.id === product.id && now - lastAddRef.current.at < 350) {
        return
      }
      lastAddRef.current = { id: product.id, at: now }
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

  const handleDiscoveryBoxConfirm = (selectionIds: string[]) => {
    if (!selectedProductForDiscoveryBox) return
    const base = selectedProductForDiscoveryBox
    if (base.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) {
      if (
        selectionIds.length !== DISCOVERY_BOX_TROMPE_SLOT_COUNT ||
        new Set(selectionIds).size !== DISCOVERY_BOX_TROMPE_SLOT_COUNT
      ) {
        return
      }
    } else if (isCustomizableTrompeBundleBoxId(base.id)) {
      const n = getTrompeBundleSelectionSlotCount(base.id)
      const allowed = new Set(base.bundleProductIds ?? [])
      if (
        n === 0 ||
        selectionIds.length !== n ||
        new Set(selectionIds).size !== n ||
        !selectionIds.every((id) => allowed.has(id))
      ) {
        return
      }
    } else {
      return
    }
    const resolveName = (id: string) =>
      availableProducts.find((p) => p.id === id)?.name ?? PRODUCTS.find((p) => p.id === id)?.name ?? id
    const cartProduct: Product = {
      ...base,
      id: `${base.id}-${Date.now()}`,
      description: `Choix : ${selectionIds.map(resolveName).join(', ')}`,
    }
    setCart((current) => {
      pendingAddToastRef.current = { message: `${base.name} ajouté au panier`, product: base }
      return [...current, { product: cartProduct, quantity: 1, trompeDiscoverySelection: selectionIds }]
    })
    setSelectedProductForDiscoveryBox(null)
  }

  const RESERVATION_DURATION_MS = 10 * 60 * 1000 // 10 minutes

  const handleTrompeLOeilConfirm = async (product: Product, quantity: number) => {
    // 1. Décrémenter le stock dans Firebase uniquement si connecté (règles : auth != null)
    if (isAuthenticated) {
      const { updateStock, getStockDecrementItems } = await import('./lib/firebase')
      const pairs = getStockDecrementItems(product.id, quantity, PRODUCTS)
      for (const pair of pairs) {
        const currentQty = getStock(pair.productId)
        if (currentQty !== null) {
          await updateStock(pair.productId, Math.max(0, currentQty - pair.quantity))
        }
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
        const { updateStock, getStockDecrementItems } = await import('./lib/firebase')

        const pairs = getStockDecrementItems(origId, item.quantity, PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        })
        for (const pair of pairs) {
          const currentQty = getStock(pair.productId)
          if (currentQty !== null) await updateStock(pair.productId, currentQty + pair.quantity)
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
        const { updateStock, getStockDecrementItems } = await import('./lib/firebase')

        const pairs = getStockDecrementItems(origId, Math.abs(delta), PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        })
        if (delta > 0) {
          // Vérifier le stock minimum parmi tous les composants
          const minStock = pairs.reduce((min, pair) => {
            const q = getStock(pair.productId)
            return q === null ? min : Math.min(min, q)
          }, Infinity)
          if (minStock !== Infinity && minStock < delta) {
            showToast(`Stock insuffisant (${minStock} restant${minStock > 1 ? 's' : ''})`, 'error')
            return
          }
          for (const pair of pairs) {
            const currentQty = getStock(pair.productId)
            if (currentQty !== null) await updateStock(pair.productId, currentQty - pair.quantity)
          }
        } else {
          for (const pair of pairs) {
            const currentQty = getStock(pair.productId)
            if (currentQty !== null) await updateStock(pair.productId, currentQty + pair.quantity)
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

  const [instagramOrderModal, setInstagramOrderModal] = useState<InstagramOrderModalData | null>(null)
  const [snapOrderModal, setSnapOrderModal] = useState<SnapOrderModalData | null>(null)
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

  // Détecte si ce numéro a déjà passé une commande dans les 48 dernières heures
  const [pendingOrderOverride, setPendingOrderOverride] = useState(false)

  // Toujours relire localStorage : après Insta/Snap, `orderConfirmation` ne change pas donc un useMemo cassait l’affichage du rappel / « une autre commande ».
  const pendingOrderInfo = pendingOrderOverride ? null : getPendingOrder(customer.phone)

  const allowAnotherOrder = useCallback(() => {
    try { localStorage.removeItem(MM_PENDING_ORDER_KEY) } catch { /* ignore */ }
    setPendingOrderOverride(false)
  }, [])

  const recordPlacedOrder = useCallback((phone: string, orderNumber?: number) => {
    markOrderPlaced(phone, orderNumber)
    setPendingOrderOverride(false)
  }, [])

  // Vérifie si l'admin a manuellement levé le blocage côté Firebase
  useEffect(() => {
    if (!pendingOrderInfo) return
    import('./lib/firebase').then(({ getOrderRelease }) => {
      getOrderRelease(customer.phone).then((releasedAt) => {
        if (releasedAt && releasedAt > pendingOrderInfo.placedAt) {
          try { localStorage.removeItem(MM_PENDING_ORDER_KEY) } catch { /* ignore */ }
          setPendingOrderOverride(true)
        }
      }).catch(() => {})
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.phone, pendingOrderInfo?.placedAt])

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

  type SaveOrderResult =
    | { ok: true; orderId: string; orderNumber: number }
    | { ok: false; reason?: 'stock' | 'empty' | 'duplicate' }

  const saveOrderToFirebase = async (source: 'whatsapp' | 'instagram' | 'snap'): Promise<SaveOrderResult> => {
    if (cart.length === 0) return { ok: false, reason: 'empty' }
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
    // Flag env : si true, la création passe par la CF serveur (valide stock,
    // anti-double-commande 48h, counter, slot, promo). Sinon, flow direct ancien.
    const USE_CF_ORDER = import.meta.env.VITE_USE_CF_ORDER === 'true'

    try {
      const {
        createOrder,
        createOrderViaCF,
        incrementPromoCodeUsage,
        applyReferralAfterOrder,
        decrementStockBatchStrict,
        incrementStockBatch,
        getStockDecrementItems: getDecrItems,
      } = await import('./lib/firebase')
      const distanceKm = customer.wantsDelivery && customer.addressCoordinates
        ? calculateDistance(customer.addressCoordinates, ANNECY_GARE)
        : undefined

      // Construction du payload (commun aux deux flows)
      const orderPayload = {
        items: cart.map((item) => {
          // Inclure les personnalisations (toppings, coulis, parfums...) dans le nom pour l'admin
          let name: string
          if (item.product.category === 'Tiramisus' && item.product.description) {
            name = `${item.product.name} – ${item.product.description}`
          } else if (item.product.description) {
            // Boxes, mini gourmandises, box fruitée, etc.
            name = `${item.product.name} – ${item.product.description}`
          } else {
            name = item.product.name
          }
          return {
            productId: getOriginalProductId(item.product.id),
            name,
            quantity: item.quantity,
            price: item.product.price,
            ...(item.trompeDiscoverySelection?.length
              ? { trompeDiscoverySelection: item.trompeDiscoverySelection }
              : {}),
          }
        }),
        customer: {
          firstName:
            source === 'instagram'
              ? normalizeInstagramHandle(customer.firstName) || 'client'
              : customer.firstName || 'Client',
          lastName: source === 'instagram' ? '' : customer.lastName || '',
          phone: customer.phone || '',
          ...(customer.email?.trim() && { email: customer.email.trim() }),
          ...(customer.wantsDelivery && customer.address.trim() && { address: customer.address.trim() }),
          ...(customer.wantsDelivery && customer.addressCoordinates && { addressCoordinates: customer.addressCoordinates }),
          ...(customer.wantsDelivery && customer.deliveryInstructions?.trim() && { deliveryInstructions: customer.deliveryInstructions.trim() }),
          ...(source === 'instagram' && {
            contactPlatform: 'instagram' as const,
            contactHandle: normalizeInstagramHandle(customer.firstName),
          }),
          ...(source === 'snap' && {
            contactPlatform: 'snap' as const,
            contactHandle: customer.firstName.trim(),
          }),
        },
        total: orderTotal,
        status: 'en_attente' as const,
        source,
        deliveryMode: customer.wantsDelivery ? 'livraison' as const : 'retrait' as const,
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
      }

      // --- Flow CF (stock + counter + slot + promo gérés serveur) ---
      if (USE_CF_ORDER) {
        const result = await createOrderViaCF(orderPayload)
        // Post-ops qui restent côté client (non critiques, user-connecté uniquement)
        if (referralDiscount > 0 && referrerUid && user?.uid) {
          applyReferralAfterOrder(user.uid, referralCodeInput!.trim(), referrerUid).catch(console.error)
        }
        if (user?.uid) {
          const { updateUserOrderStats } = await import('./lib/firebase')
          updateUserOrderStats(user.uid, {
            hasTrompeLoeil: cart.some((item) => item.product.category === "Trompe l'œil"),
            hasDonation: donation > 0,
            hasPromo: !!appliedPromo,
          }).catch(console.error)
        }
        return { ok: true, ...result }
      }

      // --- Flow direct (ancien) : stock côté client + createOrder direct ---
      const itemsToDecrement = cart.flatMap((item) => {
        const isTrompe = item.product.category === "Trompe l'œil"
        if (isTrompe && item.reservationConfirmed) return []
        if (isTrompe && isAuthenticated && item.reservationExpiresAt) return []
        return getDecrItems(getOriginalProductId(item.product.id), item.quantity, PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        }).map((d) => ({ ...d, label: item.product.name }))
      })

      if (itemsToDecrement.length > 0) {
        await decrementStockBatchStrict(itemsToDecrement)
      }

      let result: { orderId: string; orderNumber: number } | null
      const rollbackStock = async () => {
        if (itemsToDecrement.length === 0) return
        await incrementStockBatch(
          itemsToDecrement.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ).catch(() => {})
      }
      try {
        result = await createOrder({ ...orderPayload, createdAt: Date.now() })
      } catch (orderErr) {
        await rollbackStock()
        throw orderErr
      }
      if (!result) {
        await rollbackStock()
        return { ok: false }
      }
      if (referralDiscount > 0 && referrerUid && user?.uid) {
        applyReferralAfterOrder(user.uid, referralCodeInput!.trim(), referrerUid).catch(console.error)
      }
      if (appliedPromo?.code) {
        incrementPromoCodeUsage(appliedPromo.code).catch(console.error)
      }
      if (user?.uid) {
        const { updateUserOrderStats } = await import('./lib/firebase')
        updateUserOrderStats(user.uid, {
          hasTrompeLoeil: cart.some((item) => item.product.category === "Trompe l'œil"),
          hasDonation: donation > 0,
          hasPromo: !!appliedPromo,
        }).catch(console.error)
      }
      if (customer.wantsDelivery && customer.date && customer.time) {
        reserveDeliverySlot(customer.date, customer.time).catch(console.error)
      }
      return { ok: true, ...result }
    } catch (err) {
      console.error('[Firebase] Erreur sauvegarde commande:', err)
      // Mapping des erreurs CF (HttpsError) vers les reasons UI
      const errCode = (err as { code?: string })?.code
      const msg = err instanceof Error ? err.message : String(err)
      if (errCode === 'functions/failed-precondition' && msg.includes('Stock insuffisant')) {
        return { ok: false, reason: 'stock' }
      }
      if (errCode === 'functions/already-exists') {
        return { ok: false, reason: 'duplicate' }
      }
      if (msg.includes('Stock insuffisant')) {
        return { ok: false, reason: 'stock' }
      }
      return { ok: false }
    }
  }

  const handleSend = async () => {
    let whatsAppDraftTab: Window | null = null
    const abortWhatsAppDraft = () => {
      try {
        if (whatsAppDraftTab && !whatsAppDraftTab.closed) whatsAppDraftTab.close()
      } catch {
        /* ignore */
      }
      whatsAppDraftTab = null
    }

    if (!ordersOpen) {
      showToast('Les commandes sont fermées pour le moment.', 'error', 5000)
      return
    }
    if (getPendingOrder(customer.phone)) {
      showToast('Une commande est déjà enregistrée pour ce numéro. Dans le panier, choisissez « Oui, une autre commande » si vous souhaitez en ajouter une.', 'error', 7000)
      return
    }
    try {
      whatsAppDraftTab = window.open('about:blank', '_blank')
    } catch {
      whatsAppDraftTab = null
    }
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'œil")
    const hasTrompeLoeil = cart.some((item) => item.product.category === "Trompe l'œil")
    const minDateForMode = customer.wantsDelivery ? deliverySchedule.minDateLivraison : deliverySchedule.minDateRetrait
    if (hasTrompeLoeil && customer.date && customer.date < minDateForMode) {
      abortWhatsAppDraft()
      showToast(`Les précommandes trompe l'œil sont possibles à partir du ${formatDateLabel(minDateForMode)}.`, 'error', 5000)
      return
    }
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff() && !ordersExplicit) {
      abortWhatsAppDraft()
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 17h. Les précommandes trompe-l\'œil restent disponibles.', 'error', 5000)
      return
    }

    const invalidTrompeSelectionBox = cart.some((item) => {
      const oid = getOriginalProductId(item.product.id)
      const sel = item.trompeDiscoverySelection
      if (oid === BOX_DECOUVERTE_TROMPE_PRODUCT_ID) {
        return !sel || sel.length !== DISCOVERY_BOX_TROMPE_SLOT_COUNT || new Set(sel).size !== DISCOVERY_BOX_TROMPE_SLOT_COUNT
      }
      if (isCustomizableTrompeBundleBoxId(oid)) {
        const p = PRODUCTS.find((x) => x.id === oid)
        const n = getTrompeBundleSelectionSlotCount(oid)
        const allowed = new Set(p?.bundleProductIds ?? [])
        return (
          !sel ||
          n === 0 ||
          sel.length !== n ||
          new Set(sel).size !== n ||
          !sel.every((id) => allowed.has(id))
        )
      }
      return false
    })
    if (invalidTrompeSelectionBox) {
      abortWhatsAppDraft()
      showToast(
        'Une box trompe-l’œil au choix est incomplète. Ouvre le panier pour sélectionner toutes les saveurs.',
        'error',
        8000,
      )
      return
    }

    let referralDiscountAmount = 0
    const canUseReferral = user && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && referralCodeInput?.trim()
    if (canUseReferral) {
      const { getReferrerByCode } = await import('./lib/firebase')
      const referrerUid = await getReferrerByCode(referralCodeInput!.trim())
      if (referrerUid && referrerUid !== user!.uid) referralDiscountAmount = REFERRAL_DISCOUNT_EUR
    }

    // --- Enregistrer la commande dans Firebase d'abord (pour obtenir l'ID + n°) ---
    const orderResult = await saveOrderToFirebase('whatsapp')
    if (!orderResult.ok) {
      abortWhatsAppDraft()
      if (orderResult.reason === 'stock') {
        showToast(
          'Un ou plusieurs produits ne sont plus disponibles en quantité suffisante. Mets à jour ton panier puis réessaie.',
          'error',
          8000,
        )
      } else if (orderResult.reason === 'duplicate') {
        showToast(
          'Une commande récente est déjà enregistrée pour ce numéro (< 48h). Contacte-nous pour en passer une autre.',
          'error',
          8000,
        )
      } else if (orderResult.reason !== 'empty') {
        showToast('Erreur lors de l\'enregistrement de la commande.', 'error')
      }
      return
    }
    const { orderId, orderNumber } = orderResult
    recordPlacedOrder(customer.phone, orderNumber)

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
      contactIdentity: 'whatsapp',
      orderNumber,
    })
    if (!message) {
      abortWhatsAppDraft()
      return
    }

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
      items: cart.map((i) => {
        const orig = getOriginalProductId(i.product.id)
        let name = i.product.name
        if (isTrompeBoxWithStoredSelection(orig) && i.trompeDiscoverySelection?.length) {
          const labels = i.trompeDiscoverySelection.map(
            (id) =>
              PRODUCTS.find((p) => p.id === id)?.name.replace(/^Trompe l'œil\s+/i, '').trim() ?? id,
          )
          name = `${i.product.name} (${labels.join(', ')})`
        } else if (i.product.description) {
          name = `${i.product.name} – ${i.product.description}`
        }
        return {
          name,
          quantity: i.quantity,
          price: i.product.price,
          productId: orig,
        }
      }),
      deliveryMode: customer.wantsDelivery ? 'livraison' : 'retrait',
      requestedDate: customer.date || undefined,
      requestedTime: customer.time || undefined,
      whatsappMessage: message,
    })

    const waFallback =
      orderNumber != null
        ? `Commande Maison Mayssa n°${orderNumber} — le message détaillé a été copié : dans WhatsApp, appuie longuement dans le champ texte puis « Coller ».`
        : 'Commande Maison Mayssa — le message détaillé a été copié : colle-le dans WhatsApp.'
    const { usedClipboardFallback, opened } = openWhatsAppWithPrefilledMessage(
      PHONE_E164,
      message,
      waFallback,
      whatsAppDraftTab,
    )
    if (usedClipboardFallback) {
      showToast(
        'Le texte était trop long pour le lien WhatsApp : le message complet a été copié. Colle-le dans la conversation.',
        'info',
        9000,
      )
    } else if (!opened) {
      showToast(
        'Autorise les pop-ups pour ce site ou utilise le bouton « Envoyer sur WhatsApp » sur l’écran de confirmation.',
        'info',
        8000,
      )
    }

    // --- Confirmer les réservations trompe l'oeil (le stock reste décrémenté) ---
    const trompeLOeilItems = cart.filter(
      (item) =>
        item.product.category === "Trompe l'œil" &&
        item.reservationExpiresAt &&
        !item.reservationConfirmed,
    )
    if (trompeLOeilItems.length > 0) {
      setCart((current) =>
        current.map((item) =>
          item.reservationExpiresAt && !item.reservationConfirmed && item.product.category === "Trompe l'œil"
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

    // Supprimer la session active + vider le panier
    const { removeActiveSession } = await import('./lib/firebase')
    await removeActiveSession(sessionId)
    setCart([])
  }

  const handleSendInstagram = async () => {
    if (!ordersOpen) {
      showToast('Les commandes sont fermées pour le moment.', 'error', 5000)
      return
    }
    if (getPendingOrder(customer.phone)) {
      showToast('Une commande est déjà enregistrée pour ce numéro. Dans le panier, choisissez « Oui, une autre commande » si vous souhaitez en ajouter une.', 'error', 7000)
      return
    }
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'œil")
    const hasTrompeLoeil = cart.some((item) => item.product.category === "Trompe l'œil")
    const minDateForMode = customer.wantsDelivery ? deliverySchedule.minDateLivraison : deliverySchedule.minDateRetrait
    if (hasTrompeLoeil && customer.date && customer.date < minDateForMode) {
      showToast(`Les précommandes trompe l'œil sont possibles à partir du ${formatDateLabel(minDateForMode)}.`, 'error', 5000)
      return
    }
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff() && !ordersExplicit) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 17h.', 'error', 5000)
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
      contactIdentity: 'instagram',
    })
    if (!message) return

    const instagramResult = await saveOrderToFirebase('instagram')
    if (!instagramResult.ok) {
      if (instagramResult.reason === 'stock') {
        showToast(
          'Un ou plusieurs produits ne sont plus disponibles en quantité suffisante. Mets à jour ton panier puis réessaie.',
          'error',
          8000,
        )
      } else if (instagramResult.reason === 'duplicate') {
        showToast(
          'Une commande récente est déjà enregistrée pour ce numéro (< 48h). Contacte-nous pour en passer une autre.',
          'error',
          8000,
        )
      } else if (instagramResult.reason !== 'empty') {
        showToast('Erreur lors de l\'enregistrement de la commande.', 'error')
      }
      return
    }
    recordPlacedOrder(customer.phone, instagramResult.orderNumber)

    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
    const deliveryFeeVal = computeDeliveryFee(customer, totalAfterDiscount) ?? 0
    const donationVal = donationAmount ?? 0
    const finalTotal = totalAfterDiscount + deliveryFeeVal + donationVal

    const shortPasteMessage = buildShortSocialPasteMessage(
      {
        cart,
        customer,
        total,
        note,
        selectedReward,
        isAuthenticated,
        discountAmount: appliedPromo?.discount ?? 0,
        referralDiscountAmount,
        donationAmount: donationVal,
        dietaryPreferences: profile?.dietaryPreferences,
        orderNumber: instagramResult.orderNumber,
        contactIdentity: 'instagram',
      },
      920,
    )

    const modalPayload: InstagramOrderModalData = {
      orderNumber: instagramResult.orderNumber,
      shortPasteMessage,
      customer: { ...customer },
      items: cart.map((i) => ({ ...i, product: { ...i.product } })),
      finalTotal,
      deliveryFee: deliveryFeeVal,
      discountAmount: appliedPromo?.discount ?? 0,
      donationAmount: donationVal,
    }

    const trompeLOeilItemsIg = cart.filter(
      (item) =>
        item.product.category === "Trompe l'œil" &&
        item.reservationExpiresAt &&
        !item.reservationConfirmed,
    )
    if (trompeLOeilItemsIg.length > 0) {
      setCart((current) =>
        current.map((item) =>
          item.reservationExpiresAt && !item.reservationConfirmed && item.product.category === "Trompe l'œil"
            ? { ...item, reservationConfirmed: true }
            : item,
        ),
      )
    }

    if (selectedReward && isAuthenticated && user) {
      try {
        const { claimReward } = await import('./lib/firebase')
        const rewardId = await claimReward(user.uid, selectedReward.type, REWARD_COSTS[selectedReward.type])
        if (rewardId) {
          setSelectedReward(null)
          showToast(`Récompense ${REWARD_LABELS[selectedReward.type]} réclamée !`, 'success', 3000)
        }
      } catch (error) {
        console.error('Error claiming reward:', error)
        showToast('Erreur lors de la réclamation de la récompense', 'error')
      }
    }

    if (isAuthenticated && user && cart.length > 0) {
      try {
        const totalAfterDiscountPts = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
        const orderTotalPts = totalAfterDiscountPts + (computeDeliveryFee(customer, totalAfterDiscountPts) || 0) + (donationAmount ?? 0)
        const basePoints = Math.round(orderTotalPts)
        const orderIdPts = `order_${Date.now()}`
        const { addUserPoints } = await import('./lib/firebase')
        await addUserPoints(user.uid, {
          reason: 'order_points',
          points: basePoints,
          at: Date.now(),
          amount: orderTotalPts,
          orderId: orderIdPts,
        })
        showToast(`+${basePoints} points gagnés avec cette commande !`, 'success', 4000)
      } catch (error) {
        console.error('Error adding loyalty points:', error)
      }
    }

    const { removeActiveSession } = await import('./lib/firebase')
    await removeActiveSession(sessionId)

    try {
      await navigator.clipboard.writeText(shortPasteMessage)
    } catch { /* ignore */ }

    setInstagramOrderModal(modalPayload)
    setCart([])
  }

  const handleSendSnap = async () => {
    if (!ordersOpen) {
      showToast('Les commandes sont fermées pour le moment.', 'error', 5000)
      return
    }
    if (getPendingOrder(customer.phone)) {
      showToast('Une commande est déjà enregistrée pour ce numéro. Dans le panier, choisissez « Oui, une autre commande » si vous souhaitez en ajouter une.', 'error', 7000)
      return
    }
    const hasNonTrompeLoeil = cart.some((item) => item.product.category !== "Trompe l'œil")
    const hasTrompeLoeil = cart.some((item) => item.product.category === "Trompe l'œil")
    const minDateForMode = customer.wantsDelivery ? deliverySchedule.minDateLivraison : deliverySchedule.minDateRetrait
    if (hasTrompeLoeil && customer.date && customer.date < minDateForMode) {
      showToast(`Les précommandes trompe l'œil sont possibles à partir du ${formatDateLabel(minDateForMode)}.`, 'error', 5000)
      return
    }
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff() && !ordersExplicit) {
      showToast('Commandes (pâtisseries, cookies…) possibles jusqu\'à 17h.', 'error', 5000)
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
      contactIdentity: 'snap',
    })
    if (!message) return

    const snapResult = await saveOrderToFirebase('snap')
    if (!snapResult.ok) {
      if (snapResult.reason === 'stock') {
        showToast(
          'Un ou plusieurs produits ne sont plus disponibles en quantité suffisante. Mets à jour ton panier puis réessaie.',
          'error',
          8000,
        )
      } else if (snapResult.reason === 'duplicate') {
        showToast(
          'Une commande récente est déjà enregistrée pour ce numéro (< 48h). Contacte-nous pour en passer une autre.',
          'error',
          8000,
        )
      } else if (snapResult.reason !== 'empty') {
        showToast('Erreur lors de l\'enregistrement de la commande.', 'error')
      }
      return
    }
    recordPlacedOrder(customer.phone, snapResult.orderNumber)

    const totalAfterDiscountSnap = total - (appliedPromo?.discount ?? 0) - referralDiscountAmountSnap
    const deliveryFeeValSnap = computeDeliveryFee(customer, totalAfterDiscountSnap) ?? 0
    const donationValSnap = donationAmount ?? 0
    const finalTotalSnap = totalAfterDiscountSnap + deliveryFeeValSnap + donationValSnap

    const shortPasteSnap = buildShortSocialPasteMessage(
      {
        cart,
        customer,
        total,
        note,
        selectedReward,
        isAuthenticated,
        discountAmount: appliedPromo?.discount ?? 0,
        referralDiscountAmount: referralDiscountAmountSnap,
        donationAmount: donationValSnap,
        dietaryPreferences: profile?.dietaryPreferences,
        orderNumber: snapResult.orderNumber,
        contactIdentity: 'snap',
      },
      480,
    )

    const snapModalPayload: SnapOrderModalData = {
      orderNumber: snapResult.orderNumber,
      shortPasteMessage: shortPasteSnap,
      customer: { ...customer },
      items: cart.map((i) => ({ ...i, product: { ...i.product } })),
      finalTotal: finalTotalSnap,
      deliveryFee: deliveryFeeValSnap,
      discountAmount: appliedPromo?.discount ?? 0,
      donationAmount: donationValSnap,
    }

    const trompeLOeilItemsSnap = cart.filter(
      (item) =>
        item.product.category === "Trompe l'œil" &&
        item.reservationExpiresAt &&
        !item.reservationConfirmed,
    )
    if (trompeLOeilItemsSnap.length > 0) {
      setCart((current) =>
        current.map((item) =>
          item.reservationExpiresAt && !item.reservationConfirmed && item.product.category === "Trompe l'œil"
            ? { ...item, reservationConfirmed: true }
            : item,
        ),
      )
    }

    if (selectedReward && isAuthenticated && user) {
      try {
        const { claimReward } = await import('./lib/firebase')
        const rewardId = await claimReward(user.uid, selectedReward.type, REWARD_COSTS[selectedReward.type])
        if (rewardId) {
          setSelectedReward(null)
          showToast(`Récompense ${REWARD_LABELS[selectedReward.type]} réclamée !`, 'success', 3000)
        }
      } catch (error) {
        console.error('Error claiming reward:', error)
        showToast('Erreur lors de la réclamation de la récompense', 'error')
      }
    }

    if (isAuthenticated && user && cart.length > 0) {
      try {
        const totalAfterDiscountPts = total - (appliedPromo?.discount ?? 0) - referralDiscountAmountSnap
        const orderTotalPts = totalAfterDiscountPts + (computeDeliveryFee(customer, totalAfterDiscountPts) || 0) + (donationAmount ?? 0)
        const basePoints = Math.round(orderTotalPts)
        const orderIdPts = `order_${Date.now()}`
        const { addUserPoints } = await import('./lib/firebase')
        await addUserPoints(user.uid, {
          reason: 'order_points',
          points: basePoints,
          at: Date.now(),
          amount: orderTotalPts,
          orderId: orderIdPts,
        })
        showToast(`+${basePoints} points gagnés avec cette commande !`, 'success', 4000)
      } catch (error) {
        console.error('Error adding loyalty points:', error)
      }
    }

    const { removeActiveSession: removeSessionSnap } = await import('./lib/firebase')
    await removeSessionSnap(sessionId)

    try {
      await navigator.clipboard.writeText(shortPasteSnap)
    } catch { /* ignore */ }

    setSnapOrderModal(snapModalPayload)
    setCart([])
  }

  // Page maintenance : si les commandes sont fermées, afficher une page dédiée
  // (sauf pour l'admin qui accède via #admin)
  const isAdminRoute = typeof window !== 'undefined' && window.location.hash === '#admin'
  // IMPORTANT: le mode événement ferme les commandes mais le catalogue doit rester visible
  if (!ordersOpen && !eventModeEnabled && !isAdminRoute) {
    return (
      <div className="min-h-screen bg-mayssa-soft flex flex-col items-center justify-center px-6 py-12 text-center font-sans">
        <div className="max-w-sm w-full space-y-6">
          <div className="flex justify-center">
            <img src="/logo.webp" alt="Maison Mayssa" className="w-24 h-24 object-contain rounded-2xl shadow-lg" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-mayssa-brown">Maison Mayssa</h1>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-mayssa-brown/10">
            <p className="text-mayssa-brown text-base font-semibold leading-relaxed">
              Le site est fermé pour le moment.
            </p>
            <p className="text-mayssa-brown/60 text-sm mt-2">
              Revenez bientôt 🍪
            </p>
          </div>
          <p className="text-[10px] text-mayssa-brown/30">© {new Date().getFullYear()} Maison Mayssa</p>
        </div>
      </div>
    )
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
      <EventModeModal enabled={eventModeEnabled} message={eventModeMessage} posterUrl={eventModePosterUrl} />

      {/* Visual Effects (fond décoratif) */}
      <VisualBackground />
      <Confetti trigger={confettiTrigger} originX={confettiOrigin.x} originY={confettiOrigin.y} />

      <Navbar onAccountClick={handleAccountClick} />
      <BirthdayBanner />

      {/* Mode événement : commandes fermées + message */}
      {eventModeEnabled && (
        <div className="sticky top-0 z-50 w-full bg-mayssa-brown text-white text-center px-4 py-3 shadow-md">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm font-bold">
              Précommandes fermées cette semaine
            </p>
            {eventModePosterUrl.trim() && (
              <div className="mt-2 flex justify-center">
                <img
                  src={eventModePosterUrl}
                  alt="Affiche de l'événement Maison Mayssa"
                  loading="lazy"
                  decoding="async"
                  className="max-h-48 w-auto rounded-xl border border-white/15 shadow-md"
                />
              </div>
            )}
            {eventModeMessage.trim() && (
              <p className="text-xs text-white/85 mt-1">
                {eventModeMessage}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bannière message global admin */}
      {!eventModeEnabled && globalMessageEnabled && globalMessage.trim() && (
        <div className="sticky top-0 z-40 w-full bg-mayssa-caramel text-white text-center text-sm font-semibold px-4 py-2.5 shadow-md">
          📢 {globalMessage}
        </div>
      )}

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-mayssa-rose/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-mayssa-caramel/10 blur-[100px] rounded-full" />
      </div>

      {/* Header hero pleine largeur — carousel d'images trompe l'œil */}
      <div className="relative w-full pt-20 sm:pt-24">
        <Header
          nextRestockDate={nextRestockDate || undefined}
          ordersOpen={ordersOpen}
          eventModeEnabled={eventModeEnabled}
        />
      </div>

      {/* Transition douce header → contenu (cohérence visuelle) */}
      <div className="h-8 sm:h-12 bg-gradient-to-b from-mayssa-brown/5 to-transparent" />

      <div className="relative w-full px-4 pb-8 sm:pb-10 md:pb-12 sm:px-6 lg:px-8 overflow-x-hidden">

        <main id="main-content" className="mt-8 sm:mt-12 flex flex-col gap-12 sm:gap-20 md:gap-28 items-center" aria-label="Contenu principal">
          {/* SEO : trompe l'œil Annecy (référencement Google) */}
          <section id="trompe-loeil-annecy" className="sr-only">
            <h2>Trompe l&apos;œil à Annecy</h2>
            <p>Découvrez nos trompes l&apos;œil pâtissiers à Annecy : créations artisanales Maison Mayssa (mangue, citron, pistache, passion, framboise, cacahuète). Précommande, livraison et retrait sur Annecy.</p>
          </section>

          {/* Section produits — style Cedric Grolet Le Meurice */}
          <motion.section
            id="la-carte"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6 w-full"
          >
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-brown/40" size={18} />
                  <input
                    id="recherche-produits"
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

            {/* Category Filter - compact */}
            <div className="block">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        hapticFeedback('light')
                        setActiveCategory(cat)
                      }}
                      aria-label={isActive ? `Catégorie ${cat} sélectionnée` : `Filtrer par ${cat}`}
                      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 transition-all duration-300 cursor-pointer ${isActive
                        ? 'bg-mayssa-brown text-mayssa-gold border border-mayssa-gold/30 shadow-md'
                        : 'bg-white/50 backdrop-blur-md text-mayssa-brown border border-white/60 hover:bg-white/80 hover:shadow-md'
                        }`}
                    >
                      <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-mayssa-gold/10 text-mayssa-gold' : 'bg-mayssa-soft group-hover:bg-mayssa-gold/10'}`}>
                        {getCategoryIcon(cat)}
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                        {cat}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeCategoryDot"
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-mayssa-gold shadow-[0_0_10px_#D4AF37]"
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
                {/* Desktop Grid — rendu uniquement sur desktop (réduit le DOM) */}
                {!isMobile && (
                  <div className="grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                      {orderedProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAdd={(p) => {
                            if (eventModeEnabled) {
                              showToast('Précommandes fermées cette semaine. Consultez la carte et retrouvez-nous sur l’événement.', 'info', 6000)
                              return
                            }
                            handleAddToCart(p)
                          }}
                          onViewDetail={setSelectedProductForDetail}
                          stock={getCardStock(product)}
                          isPreorderDay={isPreorderDay}
                          dayNames={dayNames}
                          preorderOpenDate={deliverySchedule.preorderOpenDate}
                          preorderOpenTime={deliverySchedule.preorderOpenTime}
                          priority={index < 4}
                          highlightAsNew={product.highlightAsNew ?? false}
                          size="large"
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Mobile Swipeable List — rendu uniquement sur mobile */}
                {isMobile && (
                  <div className="space-y-3">
                    {orderedProducts.map((product, index) => (
                      <SwipeableProductCard
                        key={product.id}
                        product={product}
                        onAdd={(p) => {
                          if (eventModeEnabled) {
                            showToast('Précommandes fermées cette semaine. Consultez la carte et retrouvez-nous sur l’événement.', 'info', 6000)
                            return
                          }
                          handleAddToCart(p)
                        }}
                        onTap={(p) => {
                          if (eventModeEnabled) {
                            showToast('Précommandes fermées cette semaine. Consultez la carte et retrouvez-nous sur l’événement.', 'info', 6000)
                            return
                          }
                          handleAddToCart(p)
                        }}
                        onViewDetail={setSelectedProductForDetail}
                        stock={getCardStock(product)}
                        isPreorderDay={isPreorderDay}
                        dayNames={dayNames}
                        preorderOpenDate={deliverySchedule.preorderOpenDate}
                        preorderOpenTime={deliverySchedule.preorderOpenTime}
                        priority={index < 4}
                        highlightAsNew={product.highlightAsNew ?? false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.section>

          {/* Cart Section - Centered at the bottom for Desktop */}
          <motion.section
            id="commande"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-4xl lg:max-w-5xl mx-auto px-2 sm:px-4"
          >
            {eventModeEnabled ? (
              <div className="rounded-[2.5rem] border border-mayssa-brown/10 bg-white/70 backdrop-blur-2xl p-6 sm:p-8 shadow-premium-shadow">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Informations</p>
                <h2 className="mt-2 text-xl sm:text-2xl font-display text-mayssa-brown">
                  Précommandes fermées cette semaine
                </h2>
                {eventModeMessage.trim() && (
                  <p className="mt-3 text-sm sm:text-base text-mayssa-brown/75 leading-relaxed">
                    {eventModeMessage}
                  </p>
                )}
                <p className="mt-4 text-xs text-mayssa-brown/55">
                  La carte et les prix restent visibles ci-dessus.
                </p>
              </div>
            ) : (
              <>
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
                  onSend={() => openOrderRecap('whatsapp')}
                  onSendInstagram={() => openOrderRecap('instagram')}
                  onSendSnap={() => openOrderRecap('snap')}
                  onAccountClick={handleAccountClick}
                  selectedReward={selectedReward}
                  onSelectReward={setSelectedReward}
                  deliverySlots={deliverySlots}
                  minDate={deliverySchedule.minDate}
                  minDateRetrait={deliverySchedule.minDateRetrait}
                  minDateLivraison={deliverySchedule.minDateLivraison}
                  maxDate={deliverySchedule.maxDate}
                  availableWeekdays={deliverySchedule.availableWeekdays}
                  pickupDates={deliverySchedule.pickupDates}
                  preorderOpenDate={deliverySchedule.preorderOpenDate}
                  preorderOpenTime={deliverySchedule.preorderOpenTime}
                  retraitTimeSlots={deliverySchedule.retraitTimeSlots}
                  livraisonTimeSlots={deliverySchedule.livraisonTimeSlots}
                  ordersOpen={ordersOpen}
                  ordersExplicit={ordersExplicit}
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
                  pendingOrder={pendingOrderInfo}
                  onAllowAnotherOrder={allowAnotherOrder}
                  orderContactIdentity={orderContactIdentity}
                  onOrderContactIdentityChange={setOrderContactIdentity}
                />
              </>
            )}
          </motion.section>
        </main>

        {/* Notre maison & livraison (regroupés) */}
        <motion.section
          id="notre-histoire"
          className="content-visibility-auto mt-12 sm:mt-16 md:mt-24 section-shell bg-white/80 border border-mayssa-brown/5 premium-shadow scroll-mt-24"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.4fr_minmax(0,1fr)] items-start">
            <div className="space-y-4 sm:space-y-5">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-brown/50">
                Notre maison
              </p>
              <h2 className="text-2xl sm:text-3xl font-display text-mayssa-brown">
                Une passion née à la maison
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Maison Mayssa est née d&apos;une grande passion pour la cuisine, les desserts généreux et les
                tables chaleureuses que l&apos;on partage en famille ou entre amis. Derrière chaque création se
                cache une personne discrète mais profondément passionnée, qui préfère rester en retrait et
                laisser ses douceurs parler pour elle.
              </p>
              <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                Au fil des années, les proches, voisins et amis ont commencé à commander de plus en plus de
                brownies, cookies et trompes l&apos;œil. C&apos;est ainsi qu&apos;est née l&apos;envie de proposer un vrai
                service de précommande, tout en gardant l&apos;esprit maison : des recettes faites avec soin, des
                ingrédients choisis, et une attention particulière portée aux détails.
              </p>

              <div className="mt-4 sm:mt-6 rounded-2xl bg-mayssa-soft/70 p-4 sm:p-5 border border-mayssa-brown/10 space-y-3">
                <h3 className="font-display text-sm sm:text-base text-mayssa-brown">
                  Zone géographique &amp; infos pratiques
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/80">
                  Les commandes sont préparées à Annecy. La livraison est proposée sur Annecy et proches
                  alentours, avec un forfait de 5&nbsp;€ pour les commandes inférieures à {FREE_DELIVERY_THRESHOLD}
                  &nbsp;€. À partir de {FREE_DELIVERY_THRESHOLD}&nbsp;€ d&apos;achat, la livraison est offerte sur la zone habituelle.
                </p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-xs sm:text-sm text-mayssa-brown/80">
                  <li>Service de 18h30 à 2h du matin</li>
                  <li>Livraison Annecy & alentours</li>
                  <li>Précommande simple par WhatsApp</li>
                  <li>Règlement à la livraison, au retrait ou par PayPal</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-mayssa-brown/10 shadow-md">
                <img
                  src="/trompe-loeil-mangue.webp"
                  alt="Trompe-l'œil mangue Maison Mayssa"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="rounded-2xl bg-mayssa-soft/80 p-4 border border-mayssa-brown/10">
                <h3 className="font-display text-sm sm:text-base text-mayssa-brown mb-1.5">
                  Livraison autour d&apos;Annecy
                </h3>
                <p className="text-xs sm:text-sm text-mayssa-brown/75 leading-relaxed">
                  Pour les secteurs un peu plus éloignés du bassin annécien, la livraison peut être étudiée au
                  cas par cas directement par message, en fonction du jour et du montant de la commande.
                </p>
              </div>
              <div className="mt-1">
                <DeliveryZoneMap />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Comment ça marche / Click & Collect */}
        <motion.section
          id="click-collect"
          className="content-visibility-auto mt-12 sm:mt-16 section-shell bg-white/90 border border-mayssa-brown/5 premium-shadow scroll-mt-24"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center text-center gap-8 sm:gap-10">
            <div className="space-y-2">
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] text-mayssa-brown/60">
                Comment ça marche
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display text-mayssa-brown">
                Expérience Click &amp; Collect
              </h2>
            </div>

            <div className="grid w-full max-w-4xl gap-8 sm:gap-10 md:grid-cols-3">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mayssa-brown/20 bg-mayssa-soft/70 text-mayssa-brown/80">
                  <span className="text-lg">🛒</span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-mayssa-brown/60">
                  Étape 1
                </p>
                <p className="text-sm sm:text-base font-semibold text-mayssa-brown">
                  Commandez en ligne
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/70 max-w-xs">
                  Parcourez nos créations et composez votre commande en quelques clics.
                </p>
              </div>

              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mayssa-brown/20 bg-mayssa-soft/70 text-mayssa-brown/80">
                  <span className="text-lg">🕒</span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-mayssa-brown/60">
                  Étape 2
                </p>
                <p className="text-sm sm:text-base font-semibold text-mayssa-brown">
                  Choisissez votre créneau
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/70 max-w-xs">
                  Sélectionnez le jour et l&apos;heure qui vous conviennent pour le retrait.
                </p>
              </div>

              <div className="flex flex-col items-center text-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-mayssa-brown/20 bg-mayssa-soft/70 text-mayssa-brown/80">
                  <span className="text-lg">🧁</span>
                </div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-mayssa-brown/60">
                  Étape 3
                </p>
                <p className="text-sm sm:text-base font-semibold text-mayssa-brown">
                  Retirez en Point retrait
                </p>
                <p className="text-xs sm:text-sm leading-relaxed text-mayssa-brown/70 max-w-xs">
                  Récupérez vos douceurs à Annecy ou profitez de la livraison.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('commande')
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                } else {
                  window.location.hash = '#commande'
                }
              }}
              className="inline-flex items-center justify-center rounded-full bg-mayssa-brown px-8 sm:px-10 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.32em] text-white shadow-md hover:bg-mayssa-brown/90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Commander maintenant
            </button>
          </div>
        </motion.section>

        {/* Le projet : soutien & future boutique — après les infos pratiques */}
        {/* Comment ça marche / Click & Collect */}

        <Suspense fallback={null}>
          <FAQSection />
          <CommunityMapSection />
        </Suspense>
        <AggregateRatingSchema />
        <Footer />
        <Suspense fallback={null}>
          <Testimonials />
        </Suspense>
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
      {selectedProductForDiscoveryBox && (
        <Suspense fallback={null}>
          <BoxDecouverteTrompeModal
            product={selectedProductForDiscoveryBox}
            eligibleTrompes={trompePickerEligibleTrompes}
            getStock={getStock}
            slotCount={trompePickerSlotCount}
            onClose={() => setSelectedProductForDiscoveryBox(null)}
            onConfirm={handleDiscoveryBoxConfirm}
          />
        </Suspense>
      )}
      {/* Modal Trompe l'oeil (précommande) */}
      <TrompeLOeilModal
        product={selectedProductForTrompeLoeil}
        stock={selectedProductForTrompeLoeil ? getCardStock(selectedProductForTrompeLoeil) : null}
        onClose={() => setSelectedProductForTrompeLoeil(null)}
        onConfirm={handleTrompeLOeilConfirm}
        preorderOpenDate={deliverySchedule.preorderOpenDate}
        preorderOpenTime={deliverySchedule.preorderOpenTime}
      />

      {/* Mobile Components */}
      <BottomNav
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setIsCartSheetOpen(true)}
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
        onSend={() => openOrderRecap('whatsapp')}
        onSendInstagram={() => openOrderRecap('instagram')}
        onSendSnap={() => openOrderRecap('snap')}
        onAccountClick={handleAccountClick}
        selectedReward={selectedReward}
        onSelectReward={setSelectedReward}
        deliverySlots={deliverySlots}
        minDate={deliverySchedule.minDate}
        minDateRetrait={deliverySchedule.minDateRetrait}
        minDateLivraison={deliverySchedule.minDateLivraison}
        maxDate={deliverySchedule.maxDate}
        availableWeekdays={deliverySchedule.availableWeekdays}
        pickupDates={deliverySchedule.pickupDates}
        preorderOpenDate={deliverySchedule.preorderOpenDate}
        preorderOpenTime={deliverySchedule.preorderOpenTime}
        retraitTimeSlots={deliverySchedule.retraitTimeSlots}
        livraisonTimeSlots={deliverySchedule.livraisonTimeSlots}
        ordersOpen={ordersOpen}
        ordersExplicit={ordersExplicit}
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
        pendingOrder={pendingOrderInfo}
        onAllowAnotherOrder={allowAnotherOrder}
        orderContactIdentity={orderContactIdentity}
        onOrderContactIdentityChange={setOrderContactIdentity}
      />

      <OrderRecapModal
        isOpen={orderRecapChannel !== null}
        channel={orderRecapChannel ?? 'whatsapp'}
        onClose={() => setOrderRecapChannel(null)}
        onConfirm={async (ch) => {
          if (ch === 'whatsapp') await handleSend()
          else if (ch === 'instagram') await handleSendInstagram()
          else if (ch === 'snap') await handleSendSnap()
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
          onAdd={(p: Product) => { setSuggestedProducts([]); handleAddToCart(p) }}
          onDismiss={() => setSuggestedProducts([])}
        />
      </Suspense>

      {/* Product Detail Modal - Mobile */}
      <ProductDetailModal
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onAdd={handleAddToCart}
        stock={selectedProductForDetail ? getCardStock(selectedProductForDetail) : null}
        isPreorderDay={isPreorderDay}
        dayNames={dayNames}
      />

      {/* Instagram instruction modal - après envoi commande via Instagram */}
      <InstagramInstructionModal
        data={instagramOrderModal}
        onClose={() => setInstagramOrderModal(null)}
      />

      <SnapInstructionModal
        data={snapOrderModal}
        onClose={() => setSnapOrderModal(null)}
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
