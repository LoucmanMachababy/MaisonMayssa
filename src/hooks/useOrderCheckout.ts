import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Toast } from '../components/Toast'
import type { OrderConfirmationData } from '../components/OrderConfirmation'
import type { InstagramOrderModalData } from '../components/InstagramInstructionModal'
import type { SnapOrderModalData } from '../components/SnapInstructionModal'
import type { OrderRecapSendChannel } from '../components/OrderRecapModal'
import type { CartItem, CustomerInfo } from '../types'
import { useCartStore } from '../lib/store'
import { useStock } from './useStock'
import { useAuth } from './useAuth'
import { useActiveSession } from './useActiveSession'
import {
  listenDeliverySlots,
  reserveDeliverySlot,
  isTrompeLoeilProductId,
  type DeliverySlotsMap,
} from '../lib/firebase'
import {
  PRODUCTS,
  REFERRAL_DISCOUNT_EUR,
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  isDiscoveryTrompeBoxId,
  isCustomizableTrompeBundleBoxId,
  getTrompeBundleSelectionSlotCount,
  isTrompeBoxWithStoredSelection,
} from '../constants'
import {
  ANNECY_GARE,
  calculateDistance,
  computeDeliveryFee,
  formatDateLabel,
  getMinDate,
  normalizeInstagramHandle,
} from '../lib/delivery'
import { buildOrderMessage, buildShortSocialPasteMessage } from '../lib/orderMessage'
import { isBeforeOrderCutoff } from '../lib/utils'
import { REWARD_COSTS, REWARD_LABELS } from '../lib/rewards'
import {
  MM_PENDING_ORDER_KEY,
  getPendingOrder,
  markOrderPlaced,
} from '../lib/pendingOrder'
import { resolveInitialOrderStatus } from '../lib/orderStatus'
import { buildOrderItemFromCart } from '../lib/orderItems'
import {
  CLICK_COLLECT_ONLY,
  STRIPE_LIVE,
  isPaymentConfirmedByDefault,
  type PaymentMethod,
} from '../constants/checkout'
import { STRIPE_PUBLISHABLE_KEY } from '../lib/stripe'

const TROMPE_CATEGORIES = ["Trompe l'œil", "Nos trompe-l'œil"] as const

export function getOriginalProductId(cartProductId: string): string {
  return cartProductId.replace(/-\d{10,}$/, '')
}

export function isTrompeLoeilCartItem(item: CartItem): boolean {
  const origId = getOriginalProductId(item.product.id)
  return (
    isTrompeLoeilProductId(origId) ||
    (TROMPE_CATEGORIES as readonly string[]).includes(item.product.category)
  )
}

type SaveOrderResult =
  | { ok: true; orderId: string; orderNumber: number }
  | { ok: false; reason?: 'stock' | 'empty' }

export function useOrderCheckout() {
  const { items: cart, setItems, clearCart } = useCartStore()
  const { getStock, settings } = useStock()
  const { user, isAuthenticated, profile } = useAuth()

  const [deliverySlots, setDeliverySlots] = useState<DeliverySlotsMap>({})
  const [note, setNote] = useState('')
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
          wantsDelivery: CLICK_COLLECT_ONLY ? false : !!p.wantsDelivery,
          date: '',
          time: '',
          deliveryInstructions: p.deliveryInstructions || '',
        }
      }
    } catch {
      /* ignore */
    }
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

  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null)
  const [donationAmount, setDonationAmount] = useState(0)
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [selectedReward, setSelectedReward] = useState<{
    type: keyof typeof REWARD_COSTS
    id: string
  } | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(isPaymentConfirmedByDefault())
  const stripePaymentIntentIdRef = useRef<string | null>(null)
  const useRealStripe = STRIPE_LIVE && !!STRIPE_PUBLISHABLE_KEY

  const confirmSimulatedPayment = useCallback((method: PaymentMethod, _paymentIntentId?: string) => {
    setPaymentMethod(method)
    stripePaymentIntentIdRef.current = null
    setPaymentConfirmed(true)
  }, [])

  const resetSimulatedPayment = useCallback(() => {
    setPaymentMethod(null)
    stripePaymentIntentIdRef.current = null
    setPaymentConfirmed(isPaymentConfirmedByDefault())
  }, [])

  /**
   * Appelé quand le paiement (Stripe réel) a réussi : enregistre la méthode,
   * crée la commande immédiatement (→ trigger email), puis marque payé.
   * `handleSend` est défini plus bas ; on passe par une ref pour l'appeler.
   */
  const handleSendRef = useRef<(() => Promise<SaveOrderResult | void>) | null>(null)

  const [toasts, setToasts] = useState<Toast[]>([])
  const [orderRecapChannel, setOrderRecapChannel] = useState<OrderRecapSendChannel | null>(null)
  const [orderContactIdentity, setOrderContactIdentity] = useState<OrderRecapSendChannel>('whatsapp')
  const [instagramOrderModal, setInstagramOrderModal] = useState<InstagramOrderModalData | null>(null)
  const [snapOrderModal, setSnapOrderModal] = useState<SnapOrderModalData | null>(null)
  const [orderConfirmation, setOrderConfirmation] = useState<
    (OrderConfirmationData & { whatsappMessage: string }) | null
  >(null)
  const [pendingOrderOverride, setPendingOrderOverride] = useState(false)

  const eventModeEnabled = settings.eventModeEnabled === true
  const eventModeMessage = settings.eventModeMessage ?? ''
  const ordersOpen = (settings.ordersOpen !== false) && !eventModeEnabled
  const ordersExplicit = settings.ordersOpen === true && !eventModeEnabled

  const deliverySchedule = useMemo(() => {
    const today = getMinDate()
    const fallback =
      settings.firstAvailableDate && settings.firstAvailableDate.trim()
        ? settings.firstAvailableDate.trim()
        : today
    const minRetrait =
      settings.firstAvailableDateRetrait && settings.firstAvailableDateRetrait.trim()
        ? settings.firstAvailableDateRetrait.trim()
        : fallback
    const minLivraison =
      settings.firstAvailableDateLivraison && settings.firstAvailableDateLivraison.trim()
        ? settings.firstAvailableDateLivraison.trim()
        : fallback
    return {
      minDate: minRetrait,
      minDateRetrait: minRetrait,
      minDateLivraison: minLivraison,
      maxDate:
        settings.lastAvailableDate && settings.lastAvailableDate.trim()
          ? settings.lastAvailableDate.trim()
          : undefined,
      availableWeekdays:
        settings.availableWeekdays && settings.availableWeekdays.length > 0
          ? settings.availableWeekdays
          : undefined,
      retraitTimeSlots:
        settings.retraitTimeSlots && settings.retraitTimeSlots.length > 0
          ? settings.retraitTimeSlots
          : undefined,
      livraisonTimeSlots:
        settings.livraisonTimeSlots && settings.livraisonTimeSlots.length > 0
          ? settings.livraisonTimeSlots
          : undefined,
      pickupDates:
        settings.pickupDates && settings.pickupDates.length > 0 ? settings.pickupDates : undefined,
      preorderOpenDate: settings.preorderOpenDate,
      preorderOpenTime: settings.preorderOpenTime,
    }
  }, [settings])

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart],
  )

  const { sessionId } = useActiveSession(cart, customer, total)

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'success', duration?: number) => {
      const id = Math.random().toString(36).substring(7)
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const confirmPaymentAndPlaceOrder = useCallback(
    async (method: PaymentMethod, paymentIntentId?: string) => {
      if (!paymentIntentId || paymentIntentId.startsWith('simulated_')) {
        showToast('Paiement invalide. Réessaie.', 'error', 6000)
        return
      }

      setPaymentMethod(method)
      stripePaymentIntentIdRef.current = paymentIntentId

      const result = await handleSendRef.current?.()
      if (result && !result.ok) {
        setPaymentConfirmed(true)
        showToast(
          'Ton paiement a bien été reçu, mais la commande n\'a pas pu être enregistrée. Contacte-nous avec ton relevé bancaire.',
          'error',
          12000,
        )
        return
      }

      setPaymentConfirmed(true)
    },
    [showToast],
  )

  const openOrderRecap = useCallback((ch: OrderRecapSendChannel) => {
    setOrderContactIdentity(ch)
    setOrderRecapChannel(ch)
  }, [])

  useEffect(() => listenDeliverySlots(setDeliverySlots), [])

  useEffect(() => {
    localStorage.setItem(
      'maison-mayssa-customer',
      JSON.stringify({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address,
        wantsDelivery: CLICK_COLLECT_ONLY ? false : customer.wantsDelivery,
        deliveryInstructions: customer.deliveryInstructions || '',
      }),
    )
  }, [
    customer.firstName,
    customer.lastName,
    customer.phone,
    customer.email,
    customer.address,
    customer.wantsDelivery,
    customer.deliveryInstructions,
  ])

  const profileSyncedRef = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || !profile || profileSyncedRef.current) return
    profileSyncedRef.current = true
    setCustomer((prev) => ({
      ...prev,
      firstName: prev.firstName || profile.firstName || '',
      lastName: prev.lastName || profile.lastName || '',
      phone: prev.phone || profile.phone || '',
      address: prev.address || profile.address || '',
      addressCoordinates: prev.addressCoordinates || profile.addressCoordinates || null,
    }))
  }, [isAuthenticated, profile])

  useEffect(() => {
    if (!isAuthenticated) profileSyncedRef.current = false
  }, [isAuthenticated])

  const wasGuestRef = useRef(!isAuthenticated)
  useEffect(() => {
    if (isAuthenticated && wasGuestRef.current) {
      wasGuestRef.current = false
      clearCart()
    }
    if (!isAuthenticated) wasGuestRef.current = true
  }, [isAuthenticated, clearCart])

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref?.trim()) setReferralCodeInput(ref.trim().toUpperCase())
  }, [])

  const pendingOrderInfo = pendingOrderOverride ? null : getPendingOrder(customer.phone)

  const allowAnotherOrder = useCallback(() => {
    try {
      localStorage.removeItem(MM_PENDING_ORDER_KEY)
    } catch {
      /* ignore */
    }
    setPendingOrderOverride(false)
  }, [])

  const recordPlacedOrder = useCallback((phone: string, orderNumber?: number) => {
    markOrderPlaced(phone, orderNumber)
    setPendingOrderOverride(false)
  }, [])

  useEffect(() => {
    if (!pendingOrderInfo) return
    import('../lib/firebase')
      .then(({ getOrderRelease }) =>
        getOrderRelease(customer.phone)
          .then((releasedAt: number | null) => {
            if (releasedAt && releasedAt > pendingOrderInfo.placedAt) {
              try {
                localStorage.removeItem(MM_PENDING_ORDER_KEY)
              } catch {
                /* ignore */
              }
              setPendingOrderOverride(true)
            }
          })
          .catch(() => {}),
      )
      .catch(() => {})
  }, [customer.phone, pendingOrderInfo?.placedAt])

  const handleApplyPromo = async () => {
    const code = promoCodeInput.trim()
    if (!code) return
    try {
      const { validatePromoCode } = await import('../lib/firebase')
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

  const confirmTrompeReservations = useCallback(() => {
    const trompeItems = cart.filter(
      (item) =>
        isTrompeLoeilCartItem(item) && item.reservationExpiresAt && !item.reservationConfirmed,
    )
    if (trompeItems.length === 0) return
    setItems(
      cart.map((item) =>
        item.reservationExpiresAt && !item.reservationConfirmed && isTrompeLoeilCartItem(item)
          ? { ...item, reservationConfirmed: true }
          : item,
      ),
    )
  }, [cart, setItems])

  const saveOrderToFirebase = async (
    source: 'site' | 'whatsapp' | 'instagram' | 'snap',
  ): Promise<SaveOrderResult> => {
    if (cart.length === 0) return { ok: false, reason: 'empty' }
    const discount = appliedPromo?.discount ?? 0
    let referralDiscount = 0
    let referrerUid: string | null = null
    const canUseReferral =
      user &&
      profile &&
      (profile.orderStats?.orderCount ?? 0) === 0 &&
      !profile.referredByCode &&
      referralCodeInput?.trim()
    if (canUseReferral) {
      const { getReferrerByCode } = await import('../lib/firebase')
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
    const paymentStatus = stripePaymentIntentIdRef.current
      ? ('paid' as const)
      : paymentMethod
        ? ('simulated_paid' as const)
        : undefined
    const initialStatus = resolveInitialOrderStatus({
      paymentMethod: paymentMethod ?? undefined,
      paymentStatus,
      stripePaymentIntentId: stripePaymentIntentIdRef.current,
    })
    try {
      const {
        createOrder,
        incrementPromoCodeUsage,
        applyReferralAfterOrder,
      } = await import('../lib/firebase')
      const distanceKm =
        customer.wantsDelivery && customer.addressCoordinates
          ? calculateDistance(customer.addressCoordinates, ANNECY_GARE)
          : undefined

      // Gestion de stock désactivée : la production se fait à la commande,
      // aucune limite de quantité ne bloque le passage d'une commande,
      // donc plus rien à décrémenter ni à restaurer.
      let result: { orderId: string; orderNumber: number } | null
      const rollbackStock = async () => {}
      try {
        result = await createOrder({
          items: cart.map((item) => buildOrderItemFromCart(item)),
          customer: {
            firstName:
              source === 'instagram'
                ? normalizeInstagramHandle(customer.firstName) || 'client'
                : customer.firstName || 'Client',
            lastName: source === 'instagram' ? '' : customer.lastName || '',
            phone: customer.phone || '',
            ...(customer.email?.trim() && { email: customer.email.trim() }),
            ...(customer.wantsDelivery &&
              customer.address.trim() && { address: customer.address.trim() }),
            ...(customer.wantsDelivery &&
              customer.addressCoordinates && { addressCoordinates: customer.addressCoordinates }),
            ...(customer.wantsDelivery &&
              customer.deliveryInstructions?.trim() && {
                deliveryInstructions: customer.deliveryInstructions.trim(),
              }),
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
          status: initialStatus,
          source,
          deliveryMode: customer.wantsDelivery ? 'livraison' : 'retrait',
          requestedDate: customer.date || undefined,
          requestedTime: customer.time || undefined,
          ...(deliveryFee > 0 && { deliveryFee }),
          ...(distanceKm != null && { distanceKm }),
          ...(note.trim() &&
            note.trim() !== 'Pour le … (date, créneau, adresse)' && { clientNote: note.trim() }),
          ...(appliedPromo && { promoCode: appliedPromo.code, discountAmount: appliedPromo.discount }),
          ...(donation > 0 && { donationAmount: donation }),
          ...(user?.uid && { userId: user.uid }),
          ...(paymentMethod && {
            paymentMethod,
            paymentStatus,
            ...(stripePaymentIntentIdRef.current && {
              stripePaymentIntentId: stripePaymentIntentIdRef.current,
            }),
          }),
          ...(referralDiscount > 0 &&
            referrerUid && {
              referralCode: referralCodeInput!.trim(),
              referralDiscountAmount: referralDiscount,
              referrerUserId: referrerUid,
            }),
          createdAt: Date.now(),
        })
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
        const { updateUserOrderStats } = await import('../lib/firebase')
        updateUserOrderStats(user.uid, {
          hasTrompeLoeil: cart.some(isTrompeLoeilCartItem),
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
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('Stock insuffisant')) {
        return { ok: false, reason: 'stock' }
      }
      return { ok: false }
    }
  }

  const validateBeforeSend = (): boolean => {
    if (!ordersOpen) {
      showToast('Les commandes sont fermées pour le moment.', 'error', 5000)
      return false
    }
    if (getPendingOrder(customer.phone)) {
      showToast(
        'Une commande est déjà enregistrée pour ce numéro. Dans le panier, choisissez « Oui, une autre commande » si vous souhaitez en ajouter une.',
        'error',
        7000,
      )
      return false
    }
    const hasNonTrompeLoeil = cart.some((item) => !isTrompeLoeilCartItem(item))
    const hasTrompeLoeil = cart.some(isTrompeLoeilCartItem)
    const minDateForMode = customer.wantsDelivery
      ? deliverySchedule.minDateLivraison
      : deliverySchedule.minDateRetrait
    if (hasTrompeLoeil && customer.date && customer.date < minDateForMode) {
      showToast(
        `Les précommandes trompe l'œil sont possibles à partir du ${formatDateLabel(minDateForMode)}.`,
        'error',
        5000,
      )
      return false
    }
    if (hasNonTrompeLoeil && !isBeforeOrderCutoff() && !ordersExplicit) {
      showToast(
        "Commandes (pâtisseries, cookies…) possibles jusqu'à 17h. Les précommandes trompe-l'œil restent disponibles.",
        'error',
        5000,
      )
      return false
    }
    const invalidTrompeSelectionBox = cart.some((item) => {
      const oid = getOriginalProductId(item.product.id)
      const sel = item.trompeDiscoverySelection
      if (isDiscoveryTrompeBoxId(oid)) {
        const n = getTrompeBundleSelectionSlotCount(oid)
        return !sel || sel.length !== n || new Set(sel).size !== n
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
      showToast(
        "Une box trompe-l'œil au choix est incomplète. Ouvre le panier pour sélectionner toutes les saveurs.",
        'error',
        8000,
      )
      return false
    }
    return true
  }

  const claimSelectedReward = async () => {
    if (!selectedReward || !isAuthenticated || !user) return
    try {
      const { claimReward } = await import('../lib/firebase')
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

  const addLoyaltyPoints = async (referralDiscountAmount: number) => {
    if (!isAuthenticated || !user || cart.length === 0) return
    try {
      const totalAfterDiscount = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
      const orderTotal =
        totalAfterDiscount +
        (computeDeliveryFee(customer, totalAfterDiscount) || 0) +
        (donationAmount ?? 0)
      const basePoints = Math.round(orderTotal)
      const orderIdPts = `order_${Date.now()}`
      const { addUserPoints } = await import('../lib/firebase')
      await addUserPoints(user.uid, {
        reason: 'order_points',
        points: basePoints,
        at: Date.now(),
        amount: orderTotal,
        orderId: orderIdPts,
      })
      showToast(`+${basePoints} points gagnés avec cette commande !`, 'success', 4000)
    } catch (error) {
      console.error('Error adding loyalty points:', error)
    }
  }

  const getReferralDiscount = async (): Promise<number> => {
    const canUseReferral =
      user &&
      profile &&
      (profile.orderStats?.orderCount ?? 0) === 0 &&
      !profile.referredByCode &&
      referralCodeInput?.trim()
    if (!canUseReferral) return 0
    const { getReferrerByCode } = await import('../lib/firebase')
    const referrerUid = await getReferrerByCode(referralCodeInput!.trim())
    if (referrerUid && referrerUid !== user!.uid) return REFERRAL_DISCOUNT_EUR
    return 0
  }

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    const item = cart.find((i) => i.product.id === id)
    const isTrompeReservation = item?.reservationExpiresAt && !item.reservationConfirmed

    if (quantity <= 0) {
      if (isTrompeReservation && item && isAuthenticated) {
        const origId = getOriginalProductId(item.product.id)
        const { updateStock, getStockDecrementItems } = await import('../lib/firebase')
        const pairs = getStockDecrementItems(origId, item.quantity, PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        })
        for (const pair of pairs) {
          const currentQty = getStock(pair.productId)
          if (currentQty !== null) await updateStock(pair.productId, currentQty + pair.quantity)
        }
      }
      setItems(cart.filter((i) => i.product.id !== id))
      return
    }

    if (isTrompeReservation && item && isAuthenticated) {
      const delta = quantity - item.quantity
      if (delta !== 0) {
        const origId = getOriginalProductId(item.product.id)
        const { updateStock, getStockDecrementItems } = await import('../lib/firebase')
        const pairs = getStockDecrementItems(origId, Math.abs(delta), PRODUCTS, {
          trompeDiscoverySelection: item.trompeDiscoverySelection,
        })
        if (delta > 0) {
          const minStock = pairs.reduce((min: number, pair: { productId: string; quantity: number }) => {
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

    setItems(
      cart.map((i) => (i.product.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i)),
    )
  }

  /**
   * Valide la commande en click & collect : enregistre la commande payée
   * (paiement Stripe confirmé en amont), affiche la confirmation, puis vide
   * le panier. Plus d'ouverture WhatsApp — le parcours est 100 % en ligne.
   */
  const handleSend = async (): Promise<SaveOrderResult | void> => {
    if (!validateBeforeSend()) return { ok: false }

    if (useRealStripe && !stripePaymentIntentIdRef.current && !paymentConfirmed) {
      showToast('Le paiement en ligne est requis avant de valider la commande.', 'error', 6000)
      return { ok: false }
    }

    const referralDiscountAmount = await getReferralDiscount()
    const orderResult = await saveOrderToFirebase('site')
    if (!orderResult.ok) {
      if (orderResult.reason === 'stock') {
        showToast(
          'Un ou plusieurs produits ne sont plus disponibles en quantité suffisante. Mets à jour ton panier puis réessaie.',
          'error',
          8000,
        )
      } else if (orderResult.reason !== 'empty') {
        showToast("Erreur lors de l'enregistrement de la commande.", 'error')
      }
      return orderResult
    }
    const { orderId, orderNumber } = orderResult
    recordPlacedOrder(customer.phone, orderNumber)

    try {
      const { AnalyticsEvents } = await import('../lib/analytics')
      AnalyticsEvents.send_to_whatsapp(orderId, total + (computeDeliveryFee(customer, total) ?? 0))
    } catch {
      /* ignore */
    }

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
        ...(customer.email?.trim() && { email: customer.email.trim() }),
      },
      items: cart.map((i) => {
        const orig = getOriginalProductId(i.product.id)
        let name = i.product.name
        if (isTrompeBoxWithStoredSelection(orig) && i.trompeDiscoverySelection?.length) {
          const labels = i.trompeDiscoverySelection.map(
            (tid) =>
              PRODUCTS.find((p) => p.id === tid)?.name.replace(/^Trompe l'œil\s+/i, '').trim() ?? tid,
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
      deliveryMode: 'retrait',
      requestedDate: customer.date || undefined,
      requestedTime: customer.time || undefined,
      whatsappMessage: '',
    })

    confirmTrompeReservations()
    await claimSelectedReward()
    await addLoyaltyPoints(referralDiscountAmount)

    const { removeActiveSession } = await import('../lib/firebase')
    await removeActiveSession(sessionId)
    stripePaymentIntentIdRef.current = null
    setPaymentMethod(null)
    setPaymentConfirmed(isPaymentConfirmedByDefault())
    clearCart()
    return orderResult
  }

  // Garde la ref à jour pour confirmPaymentAndPlaceOrder (défini avant handleSend).
  useEffect(() => {
    handleSendRef.current = handleSend
  })

  const handleSendInstagram = async () => {
    if (!validateBeforeSend()) return

    const referralDiscountAmount = await getReferralDiscount()
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
      } else if (instagramResult.reason !== 'empty') {
        showToast("Erreur lors de l'enregistrement de la commande.", 'error')
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

    setInstagramOrderModal({
      orderNumber: instagramResult.orderNumber,
      shortPasteMessage,
      customer: { ...customer },
      items: cart.map((i) => ({ ...i, product: { ...i.product } })),
      finalTotal,
      deliveryFee: deliveryFeeVal,
      discountAmount: appliedPromo?.discount ?? 0,
      donationAmount: donationVal,
    })

    confirmTrompeReservations()
    await claimSelectedReward()
    await addLoyaltyPoints(referralDiscountAmount)

    const { removeActiveSession } = await import('../lib/firebase')
    await removeActiveSession(sessionId)

    try {
      await navigator.clipboard.writeText(shortPasteMessage)
    } catch {
      /* ignore */
    }

    clearCart()
  }

  const handleSendSnap = async () => {
    if (!validateBeforeSend()) return

    const referralDiscountAmount = await getReferralDiscount()
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
      } else if (snapResult.reason !== 'empty') {
        showToast("Erreur lors de l'enregistrement de la commande.", 'error')
      }
      return
    }
    recordPlacedOrder(customer.phone, snapResult.orderNumber)

    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0) - referralDiscountAmount
    const deliveryFeeVal = computeDeliveryFee(customer, totalAfterDiscount) ?? 0
    const donationVal = donationAmount ?? 0
    const finalTotal = totalAfterDiscount + deliveryFeeVal + donationVal

    const shortPasteSnap = buildShortSocialPasteMessage(
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
        orderNumber: snapResult.orderNumber,
        contactIdentity: 'snap',
      },
      480,
    )

    setSnapOrderModal({
      orderNumber: snapResult.orderNumber,
      shortPasteMessage: shortPasteSnap,
      customer: { ...customer },
      items: cart.map((i) => ({ ...i, product: { ...i.product } })),
      finalTotal,
      deliveryFee: deliveryFeeVal,
      discountAmount: appliedPromo?.discount ?? 0,
      donationAmount: donationVal,
    })

    confirmTrompeReservations()
    await claimSelectedReward()
    await addLoyaltyPoints(referralDiscountAmount)

    const { removeActiveSession } = await import('../lib/firebase')
    await removeActiveSession(sessionId)

    try {
      await navigator.clipboard.writeText(shortPasteSnap)
    } catch {
      /* ignore */
    }

    clearCart()
  }

  const handleOrderRecapConfirm = async (ch: OrderRecapSendChannel) => {
    if (ch === 'whatsapp') await handleSend()
    else if (ch === 'instagram') await handleSendInstagram()
    else await handleSendSnap()
  }

  const deliveryFeeForRecap = useMemo(() => {
    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0)
    return computeDeliveryFee(customer, totalAfterDiscount) ?? 0
  }, [total, appliedPromo?.discount, customer])

  return {
    cart,
    total,
    note,
    setNote,
    customer,
    setCustomer,
    deliverySlots,
    deliverySchedule,
    ordersOpen,
    ordersExplicit,
    eventModeEnabled,
    eventModeMessage,
    promoCodeInput,
    setPromoCodeInput,
    appliedPromo,
    donationAmount,
    setDonationAmount,
    referralCodeInput,
    setReferralCodeInput,
    selectedReward,
    setSelectedReward,
    pendingOrder: pendingOrderInfo,
    allowAnotherOrder,
    orderContactIdentity,
    setOrderContactIdentity,
    toasts,
    showToast,
    dismissToast,
    orderRecapChannel,
    setOrderRecapChannel,
    openOrderRecap,
    orderConfirmation,
    setOrderConfirmation,
    instagramOrderModal,
    setInstagramOrderModal,
    snapOrderModal,
    setSnapOrderModal,
    handleUpdateQuantity,
    handleSend,
    handleSendInstagram,
    handleSendSnap,
    handleOrderRecapConfirm,
    handleApplyPromo,
    handleClearPromo,
    deliveryFeeForRecap,
    paymentConfirmed,
    paymentMethod,
    useRealStripe,
    confirmSimulatedPayment,
    confirmPaymentAndPlaceOrder,
    resetSimulatedPayment,
  }
}
