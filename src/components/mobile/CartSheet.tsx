import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useDragControls, useReducedMotion } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, User, Phone, Mail, MapPin, Calendar, Clock, Star, Gift, Tag, Heart, ChevronDown, ChevronLeft, ChevronRight, Check, Lock } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate, normalizeOrderProductBaseId, trompeSelectionDisplayLabels } from '../../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY, isTrompeBoxWithStoredSelection } from '../../constants'
import { ReservationTimer } from '../ReservationTimer'
import { useAuth } from '../../hooks/useAuth'
import { useFocusTrap } from '../../hooks/useAccessibility'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { REWARD_COSTS, REWARD_LABELS } from '../../lib/rewards'
import type { CartItem, CustomerInfo } from '../../types'
import type { DeliverySlotsMap } from '../../lib/firebase'
import {
  CheckoutAlerts,
  CheckoutCgv,
  CheckoutJourneyCard,
  CheckoutOrderSummary,
  CheckoutPayGate,
  CheckoutPaymentIntro,
} from '../checkout/CheckoutUi'
import { PaymentSection } from '../checkout/PaymentSection'
import type { StripePaymentConfirmHandler } from '../checkout/StripePayment'
import { CLICK_COLLECT_ONLY, PAYMENT_ENABLED } from '../../constants/checkout'
import type { PaymentMethod } from '../../constants/checkout'
import { STORE_ADDRESS_LINE } from '../../constants/store'
import {
  getPickupSlotsForDate,
  OPENING_HOURS_LABEL,
  getMinDate,
  getSelectableDates,
  formatDateLabel,
  validateCustomer,
  computeDeliveryFee,
} from '../../lib/delivery'

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  note: string
  customer: CustomerInfo
  onUpdateQuantity: (id: string, quantity: number) => void
  onNoteChange: (note: string) => void
  onCustomerChange: (customer: CustomerInfo) => void
  /** Valide la commande (paiement Stripe + réservation du créneau click & collect). */
  onSend: () => void
  onAccountClick?: () => void
  selectedReward?: { type: keyof typeof REWARD_COSTS; id: string } | null
  onSelectReward?: (reward: { type: keyof typeof REWARD_COSTS; id: string } | null) => void
  deliverySlots?: DeliverySlotsMap
  minDate?: string
  minDateRetrait?: string
  minDateLivraison?: string
  maxDate?: string
  availableWeekdays?: number[]
  pickupDates?: string[]
  preorderOpenDate?: string
  preorderOpenTime?: string
  retraitTimeSlots?: string[]
  livraisonTimeSlots?: string[]
  ordersOpen?: boolean
  /** Si true, l'admin a manuellement forcé l'ouverture — bypasse la coupure 17h. */
  ordersExplicit?: boolean
  promoCodeInput?: string
  setPromoCodeInput?: (v: string) => void
  appliedPromo?: { code: string; discount: number } | null
  onApplyPromo?: () => void
  onClearPromo?: () => void
  donationAmount?: number
  setDonationAmount?: (v: number) => void
  referralCodeInput?: string
  setReferralCodeInput?: (v: string) => void
  mysteryFraiseDiscount?: number
  pendingOrder?: { orderNumber?: number; placedAt: number } | null
  onAllowAnotherOrder?: () => void
  paymentConfirmed?: boolean
  paymentMethod?: PaymentMethod | null
  onConfirmPayment?: StripePaymentConfirmHandler
  onResetPayment?: () => void
  /** Stripe réel : commande créée au paiement (pas de bouton manuel étape 3). */
  autoPlaceOrderOnPayment?: boolean
}

type WizardStep = 1 | 2 | 3

export function CartSheet({
  isOpen,
  onClose,
  items,
  total,
  note,
  customer,
  onUpdateQuantity,
  onNoteChange,
  onCustomerChange,
  onSend,
  onAccountClick,
  selectedReward,
  onSelectReward,
  deliverySlots = {},
  minDate: minDateProp,
  minDateRetrait,
  minDateLivraison,
  maxDate: maxDateProp,
  availableWeekdays,
  pickupDates,
  preorderOpenDate,
  preorderOpenTime,
  ordersOpen = true,
  ordersExplicit = false,
  promoCodeInput = '',
  setPromoCodeInput,
  appliedPromo = null,
  onApplyPromo,
  onClearPromo,
  donationAmount = 0,
  setDonationAmount,
  referralCodeInput = '',
  setReferralCodeInput,
  mysteryFraiseDiscount = 0,
  pendingOrder = null,
  onAllowAnotherOrder,
  paymentConfirmed = false,
  paymentMethod = null,
  onConfirmPayment,
  onResetPayment,
  autoPlaceOrderOnPayment = false,
}: CartSheetProps) {
  const [dismissSecondOrderPrompt, setDismissSecondOrderPrompt] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  useEffect(() => {
    setDismissSecondOrderPrompt(false)
  }, [pendingOrder?.placedAt])

  // --- Wizard state ---
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [showOptions, setShowOptions] = useState(false)
  // Reset le wizard quand la sheet se ferme ou se rouvre
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1)
    }
  }, [isOpen])

  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasItems = items.length > 0
  const { isAuthenticated, profile } = useAuth()
  const prefersReducedMotion = useReducedMotion()

  useFocusTrap(sheetRef, isOpen, onClose)

  useBodyScrollLock(isOpen)

  // Touched state for real-time validation
  const [touched, setTouched] = useState<Partial<Record<keyof typeof customer, boolean>>>({})
  const markTouched = (field: keyof typeof customer) =>
    setTouched(prev => ({ ...prev, [field]: true }))

  const totalAfterDiscount = total - (appliedPromo?.discount ?? 0)
  const deliveryFee = useMemo(() => computeDeliveryFee(customer, totalAfterDiscount), [customer, totalAfterDiscount])
  const finalTotal = totalAfterDiscount + (deliveryFee ?? 0) + donationAmount

  // Points de fidélité
  const pointsToEarn = Math.round(finalTotal) // 1 € = 1 point
  const availableRewards = isAuthenticated && profile
    ? Object.entries(REWARD_COSTS).filter(([, cost]) => profile.loyalty.points >= cost)
    : []

  // Créneaux de retrait selon les horaires boutique (Lun-Sam 11h-21h30, Dim 9h-12h).
  const allTimeSlots = useMemo(
    () => getPickupSlotsForDate(customer.date),
    [customer.date],
  )
  const getPlacesLeft = (time: string) =>
    customer.wantsDelivery && customer.date
      ? Math.max(0, DELIVERY_SLOT_MAX_CAPACITY - (deliverySlots[customer.date]?.[time] ?? 0))
      : DELIVERY_SLOT_MAX_CAPACITY
  const isSlotFull = (time: string) =>
    Boolean(customer.wantsDelivery && customer.date && (deliverySlots[customer.date]?.[time] ?? 0) >= DELIVERY_SLOT_MAX_CAPACITY)

  const minDate = CLICK_COLLECT_ONLY
    ? (minDateRetrait ?? (minDateProp && minDateProp.trim() ? minDateProp : getMinDate()))
    : (minDateRetrait != null && minDateLivraison != null)
      ? (customer.wantsDelivery ? minDateLivraison : minDateRetrait)
      : (minDateProp && minDateProp.trim() ? minDateProp : getMinDate())
  const maxDate = maxDateProp && maxDateProp.trim() ? maxDateProp : undefined
  const preorderIsOpen = useMemo(() => {
    if (!preorderOpenDate) return true
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    if (preorderOpenDate > todayStr) return false
    if (preorderOpenDate < todayStr) return true
    const [h, m] = (preorderOpenTime ?? '00:00').split(':').map(Number)
    return now.getHours() * 60 + now.getMinutes() >= (h ?? 0) * 60 + (m ?? 0)
  }, [preorderOpenDate, preorderOpenTime])
  const selectableDates = useMemo(
    () => getSelectableDates(minDate, maxDate, availableWeekdays, pickupDates, preorderIsOpen),
    [minDate, maxDate, availableWeekdays, pickupDates, preorderIsOpen],
  )
  const pickupDatesMode = !!(pickupDates && pickupDates.length > 0)
  const useDateSelect = selectableDates.length > 0
  const openingLabel = useMemo(() => {
    if (!pickupDatesMode || useDateSelect || !preorderOpenDate) return null
    const dateLabel = formatDateLabel(preorderOpenDate)
    return preorderOpenTime && preorderOpenTime !== '00:00'
      ? `Ouverture ${dateLabel} à ${preorderOpenTime}`
      : `Ouverture ${dateLabel}`
  }, [pickupDatesMode, useDateSelect, preorderOpenDate, preorderOpenTime])

  useEffect(() => {
    if (useDateSelect && selectableDates.length > 0 && (!customer.date || !selectableDates.includes(customer.date))) {
      onCustomerChange({ ...customer, date: selectableDates[0], time: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDateSelect, selectableDates, customer.date])

  useEffect(() => {
    if (!customer.time) return
    const inList = allTimeSlots.includes(customer.time)
    if (!inList) {
      onCustomerChange({ ...customer, time: '' })
      return
    }
    if (customer.wantsDelivery && customer.date) {
      const taken = deliverySlots[customer.date]
      if (taken && (taken[customer.time] ?? 0) >= DELIVERY_SLOT_MAX_CAPACITY) {
        onCustomerChange({ ...customer, time: '' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.wantsDelivery, customer.date, customer.time, deliverySlots, allTimeSlots])

  const validationErrors = useMemo(
    () => validateCustomer(customer),
    [customer],
  )
  const showError = (field: keyof typeof customer) =>
    touched[field] && validationErrors[field as keyof CustomerInfo]

  const isCustomerValid = Object.keys(validationErrors).length === 0
  const hasNonTrompeLoeil = items.some((item) => item.product.category !== "Trompe l'œil")
  const hasTrompeLoeil = items.some((item) => item.product.category === "Trompe l'œil")
  const trompeLoeilBeforeMinDate = hasTrompeLoeil && !!customer.date && customer.date < minDate
  const orderCutoffPassed = !isBeforeOrderCutoff()
  const isClassicPreorderPhase = isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)
  // Conditions pour AFFICHER le paiement (hors paiement lui-même) : on ne doit
  // pas pouvoir encaisser si la commande ne peut aboutir (commandes fermées…).
  const canPay =
    hasItems &&
    isCustomerValid &&
    acceptedTerms &&
    ordersOpen !== false &&
    !trompeLoeilBeforeMinDate &&
    (!hasNonTrompeLoeil || !orderCutoffPassed || ordersExplicit)
  const canSend = canPay && paymentConfirmed && !autoPlaceOrderOnPayment

  // --- Wizard step validation ---
  const canAdvanceFromStep1 = hasItems
  const canAdvanceFromStep2 = hasItems && isCustomerValid
  const canAdvanceFromStep = (step: WizardStep) =>
    step === 1 ? canAdvanceFromStep1 : step === 2 ? canAdvanceFromStep2 : canSend

  const goToStep = (step: WizardStep) => {
    hapticFeedback('light')
    setCurrentStep(step)
  }

  const goNext = () => {
    if (!canAdvanceFromStep(currentStep)) {
      hapticFeedback('warning')
      // Si étape 2 : forcer l'affichage des erreurs (mark all as touched)
      if (currentStep === 2) {
        setTouched({ firstName: true, lastName: true, phone: true, address: true, date: true, time: true })
      }
      return
    }
    hapticFeedback('light')
    if (currentStep < 3) setCurrentStep((s) => (s + 1) as WizardStep)
  }

  const goBack = () => {
    if (currentStep === 1) return
    hapticFeedback('light')
    setCurrentStep((s) => (s - 1) as WizardStep)
  }

  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (info.velocity.y > 500 || info.offset.y > 200) {
      hapticFeedback('light')
      onClose()
    }
  }

  // Step labels
  const stepLabels: Record<WizardStep, string> = {
    1: 'Panier',
    2: 'Coordonnées',
    3: 'Paiement',
  }

  // Motion variants pour transitions horizontales (ou fade si reduced-motion)
  const stepTransition = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -40 }, transition: { duration: 0.25, ease: 'easeOut' as const } }

  // ============================================================================
  // STEP 1 — Panier (items + total + toggle options)
  // ============================================================================
  const renderStep1 = () => (
    <motion.div key="step1" {...stepTransition} className="space-y-4">
      {/* Cart Items */}
      {hasItems ? (
        <div className="space-y-2.5">
          <p className="cart-sheet-section-label">
            Articles ({itemCount})
          </p>
          {items.map((item) => (
            <div key={item.product.id} className="cart-sheet-item">
              {item.product.image && (
                <div className="cart-sheet-item-img">
                  <img src={item.product.image} alt={item.product.name} width={56} height={56} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="cart-sheet-item-name truncate">{item.product.name}</h3>
                {item.product.description ? (
                  <p className="text-[10px] text-mayssa-brown/65 truncate">{item.product.description}</p>
                ) : null}
                {(() => {
                  const baseId = normalizeOrderProductBaseId(item.product.id)
                  const sel = item.trompeDiscoverySelection
                  if (!sel?.length || !isTrompeBoxWithStoredSelection(baseId)) return null
                  const labels = trompeSelectionDisplayLabels(sel)
                  return (
                    <ul className="mt-1 text-[9px] text-mayssa-brown/55 space-y-0.5 list-disc list-inside max-h-20 overflow-y-auto">
                      {labels.map((label, idx) => (
                        <li key={`${sel[idx]}-${idx}`}>{label}</li>
                      ))}
                    </ul>
                  )
                })()}
                <div className="flex items-center justify-between mt-2">
                  <span className="cart-sheet-item-price">
                    {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); onUpdateQuantity(item.product.id, item.quantity - 1) }}
                      aria-label={item.quantity === 1 ? `Supprimer ${item.product.name}` : `Réduire ${item.product.name}`}
                      className="cart-sheet-qty-btn cart-sheet-qty-btn--minus cursor-pointer"
                    >
                      {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-mayssa-brown">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); onUpdateQuantity(item.product.id, item.quantity + 1) }}
                      aria-label={`Ajouter ${item.product.name}`}
                      className="cart-sheet-qty-btn cart-sheet-qty-btn--plus cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                {item.reservationExpiresAt && (
                  <div className="mt-1">
                    <ReservationTimer
                      expiresAt={item.reservationExpiresAt}
                      confirmed={item.reservationConfirmed}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="cart-sheet-empty">
          <div className="cart-sheet-empty-icon">
            <ShoppingBag size={28} strokeWidth={1.25} />
          </div>
          <p className="font-display text-lg text-mayssa-brown mb-1">Panier vide</p>
          <p className="text-mayssa-brown/55 text-xs">Ajoutez des créations depuis la carte</p>
        </div>
      )}

      {/* Sous-total simple */}
      {hasItems && (
        <div className="cart-sheet-total-row">
          <span className="cart-sheet-section-label mb-0">Sous-total</span>
          <span className="cart-sheet-item-price">
            {total.toFixed(2).replace('.', ',')} €
          </span>
        </div>
      )}

      {/* Toggle "Plus d'options" */}
      {hasItems && (setPromoCodeInput != null || setDonationAmount != null || isAuthenticated) && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setShowOptions((s) => !s) }}
            aria-expanded={showOptions}
            aria-controls="cart-more-options"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/60 border border-mayssa-brown/10 text-xs font-bold text-mayssa-brown cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Tag size={14} className="text-mayssa-caramel" />
              Plus d'options{appliedPromo ? ' (promo appliqué)' : donationAmount > 0 ? ` (don ${donationAmount}€)` : selectedReward ? ' (récompense)' : ''}
            </span>
            <ChevronDown
              size={16}
              className={cn('transition-transform', showOptions && 'rotate-180')}
            />
          </button>

          {showOptions && (
            <div id="cart-more-options" className="space-y-3 pl-2 border-l-2 border-mayssa-caramel/20">
              {/* Code promo */}
              {setPromoCodeInput != null && onApplyPromo != null && onClearPromo != null && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">Code promo</p>
                  {appliedPromo ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                      <span className="text-xs font-semibold text-emerald-800">
                        <Tag size={12} className="inline mr-1" />
                        {appliedPromo.code} : -{appliedPromo.discount.toFixed(2).replace('.', ',')} €
                      </span>
                      <button type="button" onClick={() => { hapticFeedback('light'); onClearPromo() }} aria-label="Retirer le code promo" className="text-[10px] font-medium text-emerald-700 hover:underline">
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="Code promo"
                        aria-label="Code promo"
                        className="flex-1 rounded-xl bg-white/80 px-3 py-2.5 text-xs ring-1 ring-mayssa-brown/10"
                      />
                      <button
                        type="button"
                        onClick={() => { hapticFeedback('light'); onApplyPromo() }}
                        disabled={!promoCodeInput.trim()}
                        aria-label="Appliquer le code promo"
                        className="rounded-xl bg-mayssa-caramel px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Code parrain */}
              {setReferralCodeInput != null && isAuthenticated && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">Code parrain</p>
                  <input
                    type="text"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    placeholder="ex. MAYSSA-ABC1 (-5 €)"
                    aria-label="Code parrain"
                    className="w-full rounded-xl bg-white/80 px-3 py-2.5 text-xs ring-1 ring-mayssa-brown/10"
                  />
                </div>
              )}

              {/* Soutien au projet */}
              {setDonationAmount != null && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75 flex items-center gap-1">
                    <Heart size={10} /> Soutenir le projet
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[2, 5, 10, 15].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => { hapticFeedback('light'); setDonationAmount(donationAmount === amount ? 0 : amount) }}
                        aria-label={donationAmount === amount ? `Retirer le don de ${amount} €` : `Ajouter un don de ${amount} €`}
                        className={cn(
                          'rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all',
                          donationAmount === amount ? 'bg-mayssa-rose text-white' : 'bg-white/80 text-mayssa-brown ring-1 ring-mayssa-brown/10'
                        )}
                      >
                        {amount} €
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="cart-sheet-donation-other" className="text-[10px] text-mayssa-brown/75">Autre :</label>
                    <input
                      id="cart-sheet-donation-other"
                      type="number"
                      min={0}
                      step={1}
                      value={donationAmount > 0 && [2, 5, 10, 15].includes(donationAmount) ? '' : donationAmount || ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value)
                        setDonationAmount(isNaN(v) || v < 0 ? 0 : Math.round(v * 100) / 100)
                      }}
                      placeholder="0"
                      aria-label="Montant du don en euros (autre)"
                      className="w-16 rounded-lg bg-white/80 px-2 py-1.5 text-xs ring-1 ring-mayssa-brown/10"
                    />
                    <span className="text-[10px] text-mayssa-brown/75">€</span>
                  </div>
                </div>
              )}

              {/* Points & Récompenses */}
              {isAuthenticated && profile && hasItems && (
                <div className="space-y-2">
                  <div className="bg-mayssa-caramel/10 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-mayssa-caramel" />
                        <span className="text-xs font-medium text-mayssa-brown">
                          +{pointsToEarn} points avec cette commande
                        </span>
                      </div>
                      <span className="text-xs font-bold text-mayssa-caramel">
                        {profile.loyalty.points} pts
                      </span>
                    </div>
                  </div>

                  {availableRewards.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-mayssa-brown/80">Récompenses disponibles :</p>
                      {availableRewards.slice(0, 2).map(([rewardType, cost]) => (
                        <div
                          key={rewardType}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                            selectedReward?.type === rewardType
                              ? 'border-mayssa-caramel bg-mayssa-caramel/10'
                              : 'border-mayssa-brown/20 bg-white/80 hover:border-mayssa-caramel/50'
                          }`}
                          onClick={() => {
                            if (onSelectReward) {
                              hapticFeedback('light')
                              onSelectReward(
                                selectedReward?.type === rewardType
                                  ? null
                                  : { type: rewardType as keyof typeof REWARD_COSTS, id: `reward_${Date.now()}` }
                              )
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Gift size={12} className="text-mayssa-caramel" />
                            <span className="text-xs font-medium text-mayssa-brown">
                              {REWARD_LABELS[rewardType as keyof typeof REWARD_LABELS]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-mayssa-brown/75">{cost} pts</span>
                            {selectedReward?.type === rewardType && (
                              <div className="w-3 h-3 rounded-full bg-mayssa-caramel flex items-center justify-center">
                                <span className="text-white text-[6px]">✓</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {selectedReward && (
                        <p className="text-[10px] text-emerald-600 font-medium bg-emerald-50 rounded-lg p-2 text-center">
                          🎁 {REWARD_LABELS[selectedReward.type]} ajouté à ta commande
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Incitation connexion si pas connecté */}
              {!isAuthenticated && hasItems && (
                <div className="bg-gradient-to-r from-mayssa-caramel/10 to-mayssa-rose/10 rounded-xl p-3 border border-mayssa-caramel/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-mayssa-caramel" />
                    <span className="text-xs font-bold text-mayssa-brown">
                      +{pointsToEarn} points avec cette commande !
                    </span>
                  </div>
                  <p className="text-[10px] text-mayssa-brown/70 mb-2">
                    1 € = 1 point. Cadeaux à 60, 100, 150 ou 250 pts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onAccountClick) {
                        hapticFeedback('light')
                        onAccountClick()
                        onClose()
                      }
                    }}
                    aria-label="Créer mon compte pour gagner des points bonus"
                    className="w-full py-2 px-3 bg-mayssa-caramel text-white rounded-xl text-[10px] font-bold hover:bg-mayssa-brown transition-colors"
                  >
                    Créer mon compte (+15 pts bonus)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )

  // ============================================================================
  // STEP 2 — Infos (mode, adresse, date/heure, identité, tel, email, note)
  // ============================================================================
  const renderStep2 = () => (
    <motion.div key="step2" {...stepTransition} className="space-y-4">
      {/* Click & collect */}
      <div className="space-y-2">
        <p className="cart-sheet-section-label">Click &amp; collect</p>
        <div className="cart-sheet-panel flex items-start gap-2.5">
          <MapPin size={18} className="text-mayssa-caramel shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-mayssa-brown">Retrait à la boutique</p>
            <p className="text-[11px] text-mayssa-brown/75 mt-1 font-medium">Galerie marchande du Carrefour — {STORE_ADDRESS_LINE}</p>
            <p className="text-[10px] text-mayssa-brown/60 mt-1 leading-relaxed">Choisissez votre créneau de retrait. Votre commande payée vous attend au comptoir, prête à emporter.</p>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="space-y-2">
        <p className="cart-sheet-section-label">
          Date et heure *
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className={cn('cart-sheet-field', showError('date') && 'is-error')}>
            <Calendar size={14} className="text-mayssa-caramel flex-shrink-0" />
            {useDateSelect ? (
              <select
                value={selectableDates.includes(customer.date) ? customer.date : selectableDates[0] ?? ''}
                onChange={(e) => { markTouched('date'); onCustomerChange({ ...customer, date: e.target.value, time: '' }) }}
                className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none cursor-pointer"
                aria-label="Date de retrait"
              >
                <option value="">Choisir une date</option>
                {selectableDates.map((d) => (
                  <option key={d} value={d}>{formatDateLabel(d)}</option>
                ))}
              </select>
            ) : pickupDatesMode ? (
              <span className="text-xs text-mayssa-brown/50 italic">
                {openingLabel ?? 'Aucune date disponible'}
              </span>
            ) : (
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={customer.date}
                onChange={(e) => { markTouched('date'); onCustomerChange({ ...customer, date: e.target.value }) }}
                className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none"
                aria-label="Date de retrait"
              />
            )}
          </div>
          <div className={cn('cart-sheet-field', showError('time') && 'is-error')}>
            <Clock size={14} className="text-mayssa-caramel flex-shrink-0" aria-hidden="true" />
            <select
              value={customer.time}
              onChange={(e) => { markTouched('time'); onCustomerChange({ ...customer, time: e.target.value }) }}
              className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none cursor-pointer"
              aria-label="Heure de retrait"
            >
              <option value="">Heure</option>
              {allTimeSlots.map((time) => {
                const full = isSlotFull(time)
                const placesLeft = getPlacesLeft(time)
                return (
                  <option key={time} value={time} disabled={full}>
                    {time}{full ? ' — Complet' : placesLeft < DELIVERY_SLOT_MAX_CAPACITY ? ` — Plus que ${placesLeft} place${placesLeft > 1 ? 's' : ''}` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        </div>
        <p className="text-[9px] text-mayssa-brown/65">
          Click &amp; collect · {OPENING_HOURS_LABEL}
        </p>
      </div>

      {/* Customer Info — identité + contact */}
      <div className="space-y-3">
        <p className="cart-sheet-section-label">
          Vos informations *
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className={cn('cart-sheet-field', showError('firstName') && 'is-error')}>
              <User size={14} className="text-mayssa-caramel flex-shrink-0" />
              <input
                value={customer.firstName}
                onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                onBlur={() => markTouched('firstName')}
                placeholder="Prénom"
                aria-label="Prénom"
                className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/55 placeholder:opacity-100 focus:outline-none"
              />
            </div>
            {showError('firstName') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.firstName}</p>}
          </div>
          <div>
            <div className={cn('cart-sheet-field', showError('lastName') && 'is-error')}>
              <User size={14} className="text-mayssa-caramel flex-shrink-0" />
              <input
                value={customer.lastName}
                onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                onBlur={() => markTouched('lastName')}
                placeholder="Nom"
                aria-label="Nom"
                className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/55 placeholder:opacity-100 focus:outline-none"
              />
            </div>
            {showError('lastName') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.lastName}</p>}
          </div>
        </div>
        <div>
          <div className={cn('cart-sheet-field', showError('phone') && 'is-error')}>
            <Phone size={14} className="text-mayssa-caramel flex-shrink-0" />
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => {
                let value = e.target.value.replace(/\s/g, '')
                if (value.length > 2) value = value.match(/.{1,2}/g)?.join(' ') || value
                onCustomerChange({ ...customer, phone: value })
              }}
              onBlur={() => markTouched('phone')}
              placeholder="Téléphone"
              aria-label="Téléphone"
              className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/55 placeholder:opacity-100 focus:outline-none"
            />
          </div>
          {showError('phone') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.phone}</p>}
        </div>
        <div>
          <div className={cn('cart-sheet-field', showError('email') && 'is-error')}>
            <Mail size={14} className="text-mayssa-caramel flex-shrink-0" aria-hidden />
            <input
              type="email"
              value={customer.email ?? ''}
              onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
              onBlur={() => markTouched('email')}
              placeholder="Email *"
              aria-label="Email pour la confirmation de commande"
              className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/55 placeholder:opacity-100 focus:outline-none"
            />
          </div>
          {showError('email')
            ? <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.email}</p>
            : <p className="text-[9px] text-mayssa-brown/50 pl-3 mt-0.5">Pour recevoir ta confirmation</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <p className="cart-sheet-section-label">
          Notes (optionnel)
        </p>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Allergies, instructions..."
          className="cart-sheet-textarea"
        />
      </div>
    </motion.div>
  )

  // ============================================================================
  // STEP 3 — Paiement & validation
  // ============================================================================
  const renderStep3 = () => (
    <motion.div key="step3" {...stepTransition} className="space-y-4">
      {/* Récap items */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
          Ta commande ({itemCount} article{itemCount > 1 ? 's' : ''})
        </p>
        <div className="cart-sheet-panel space-y-1.5 max-h-44 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product.id} className="flex justify-between items-center text-xs">
              <span className="flex-1 truncate pr-2">
                <span className="font-semibold text-mayssa-brown">{item.quantity}×</span>{' '}
                <span className="text-mayssa-brown/80">{item.product.name}</span>
              </span>
              <span className="font-bold text-mayssa-caramel shrink-0">
                {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Récap infos client */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
          Récapitulatif
        </p>
        <div className="cart-sheet-panel space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin size={12} className="text-mayssa-caramel mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-mayssa-brown">Click &amp; collect</p>
              <p className="text-mayssa-brown/70 text-[11px]">Galerie Carrefour — {STORE_ADDRESS_LINE}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={12} className="text-mayssa-caramel mt-0.5 shrink-0" />
            <p className="text-mayssa-brown/80">
              {customer.date ? formatDateLabel(customer.date) : '—'}
              {customer.time && ` · ${customer.time}`}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <User size={12} className="text-mayssa-caramel mt-0.5 shrink-0" />
            <p className="text-mayssa-brown/80">
              {`${customer.firstName} ${customer.lastName}`.trim()}
              {customer.phone && ` · ${customer.phone}`}
            </p>
          </div>
          {note && note.trim() && (
            <div className="flex items-start gap-2 pt-1 border-t border-mayssa-brown/10">
              <span className="text-mayssa-brown/70 text-[11px] italic">Note : {note}</span>
            </div>
          )}
        </div>
      </div>

      <CheckoutPaymentIntro />

      <CheckoutOrderSummary
        subtotal={total + mysteryFraiseDiscount}
        promoDiscount={appliedPromo?.discount}
        promoCode={appliedPromo?.code}
        mysteryDiscount={mysteryFraiseDiscount}
        donation={donationAmount}
        total={finalTotal}
      />

      <CheckoutJourneyCard />

      <CheckoutAlerts
        hasNonTrompeLoeil={hasNonTrompeLoeil}
        isClassicPreorderPhase={isClassicPreorderPhase}
        firstPickupLabel={FIRST_PICKUP_DATE_CLASSIC_LABEL}
        orderCutoffPassed={orderCutoffPassed}
        trompeLoeilBeforeMinDate={trompeLoeilBeforeMinDate}
        minDateLabel={formatDateLabel(minDate)}
      />

      <CheckoutCgv checked={acceptedTerms} onChange={setAcceptedTerms} />

      {canPay ? (
        PAYMENT_ENABLED && onConfirmPayment && (
          <PaymentSection
            total={finalTotal}
            confirmed={paymentConfirmed}
            selectedMethod={paymentMethod}
            onConfirm={onConfirmPayment}
            onReset={onResetPayment}
            items={items.map((i) => ({ price: i.product.price, quantity: i.quantity }))}
            discountAmount={(appliedPromo?.discount ?? 0) + mysteryFraiseDiscount}
            donationAmount={donationAmount}
            phone={customer.phone}
          />
        )
      ) : (
        <CheckoutPayGate
          message={
            ordersOpen === false
              ? 'Commandes fermées — le paiement est indisponible.'
              : !isCustomerValid
                ? 'Complète tes coordonnées (nom, email, téléphone, créneau) pour payer.'
                : !acceptedTerms
                  ? 'Accepte les CGV pour accéder au paiement.'
                  : 'Finalise ta commande pour accéder au paiement.'
          }
        />
      )}

    </motion.div>
  )

  // ============================================================================
  // Step Indicator (progress bar)
  // ============================================================================
  const renderStepIndicator = () => (
    <div className="cart-sheet-steps flex-shrink-0">
      {([1, 2, 3] as const).map((step, idx) => {
        const isActive = step === currentStep
        const isCompleted = step < currentStep
        const isClickable = step < currentStep
        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              onClick={() => { if (isClickable) goToStep(step) }}
              disabled={!isClickable}
              aria-label={`Étape ${step} : ${stepLabels[step]}${isActive ? ' (actuelle)' : isCompleted ? ' (complétée)' : ''}`}
              aria-current={isActive ? 'step' : undefined}
              className={cn('cart-sheet-step-btn', isClickable && 'cursor-pointer')}
            >
              <div
                className={cn(
                  'cart-sheet-step-dot',
                  isActive && 'is-active',
                  isCompleted && 'is-done',
                  !isActive && !isCompleted && 'is-idle',
                )}
              >
                {isCompleted ? <Check size={12} /> : step}
              </div>
              <span
                className={cn(
                  'cart-sheet-step-label',
                  isActive && 'is-active',
                  isCompleted && 'is-done',
                  !isActive && !isCompleted && 'is-idle',
                )}
              >
                {stepLabels[step]}
              </span>
            </button>
            {idx < 2 && (
              <div className={cn('cart-sheet-step-line', step < currentStep && 'is-done')} />
            )}
          </div>
        )
      })}
    </div>
  )

  // ============================================================================
  // Footer — Back + Next / boutons d'envoi à l'étape 3
  // ============================================================================
  const renderFooter = () => {
    // Cas commande récente : afficher le bloc "commande en attente"
    if (pendingOrder) {
      return (
        <div className="cart-sheet-footer">
          <div className="cart-sheet-panel border-emerald-200 bg-emerald-50/80 p-4 text-center space-y-3">
            <div className="text-3xl">✅</div>
            <p className="text-sm font-bold text-emerald-800">
              Votre commande a bien été reçue{pendingOrder.orderNumber ? ` (n°${pendingOrder.orderNumber})` : ''} !
            </p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Nous la traitons et nous vous recontacterons rapidement pour confirmer. Merci ! 🙏
            </p>
            {!dismissSecondOrderPrompt && onAllowAnotherOrder ? (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-emerald-900">
                  Souhaitez-vous passer une autre commande ?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => onAllowAnotherOrder()}
                    className="w-full py-3 rounded-xl bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-transform cursor-pointer"
                  >
                    Oui, une autre commande
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissSecondOrderPrompt(true)}
                    className="w-full py-2.5 rounded-xl border border-emerald-700/40 text-emerald-900 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Non, merci
                  </button>
                </div>
              </div>
            ) : null}
            <p className="text-[9px] text-emerald-600/70 italic">
              Ce rappel disparaît au bout de 48 h.
            </p>
          </div>
        </div>
      )
    }

    // Étape 3 Stripe réel : paiement dans PaymentSection, footer = retour seulement
    if (currentStep === 3 && autoPlaceOrderOnPayment) {
      return (
        <div className="cart-sheet-footer">
          <button
            type="button"
            onClick={goBack}
            aria-label="Revenir à l'étape précédente"
            className="cart-sheet-btn-ghost cursor-pointer w-full"
          >
            <ChevronLeft size={14} />
            Retour
          </button>
        </div>
      )
    }

    // Étape 3 : bouton manuel uniquement en mode paiement simulé
    if (currentStep === 3 && !autoPlaceOrderOnPayment) {
      return (
        <div className="cart-sheet-footer space-y-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (canSend) {
                hapticFeedback('success')
                onSend()
              } else {
                hapticFeedback('warning')
              }
            }}
            disabled={!canSend}
            aria-label={hasItems && canSend ? 'Valider et payer ma commande click and collect' : hasItems ? 'Complète tes infos pour payer' : 'Panier vide'}
            className={cn(
              'cart-sheet-btn-primary cursor-pointer',
              canSend ? 'is-enabled' : 'is-disabled',
            )}
          >
            <Lock size={18} aria-hidden="true" />
            {hasItems
              ? canSend
                ? `Payer ${finalTotal.toFixed(2).replace('.', ',')} € · réserver`
                : ordersOpen === false
                  ? 'Commandes fermées'
                  : !paymentConfirmed
                  ? 'Choisis un paiement'
                  : !acceptedTerms
                    ? 'Accepte les CGV'
                    : trompeLoeilBeforeMinDate
                      ? `À partir du ${formatDateLabel(minDate)}`
                      : orderCutoffPassed && hasNonTrompeLoeil
                        ? "Jusqu'à 17h"
                        : 'Complète tes infos'
              : 'Panier vide'}
          </motion.button>

          <button
            type="button"
            onClick={goBack}
            aria-label="Revenir à l'étape précédente"
            className="cart-sheet-btn-ghost cursor-pointer w-full"
          >
            <ChevronLeft size={14} />
            Retour
          </button>
        </div>
      )
    }

    // Étape 1 ou 2 : bouton Retour (si 2) + Continuer
    const canAdvance = canAdvanceFromStep(currentStep)
    const nextLabel =
      currentStep === 1
        ? 'Continuer'
        : currentStep === 2
          ? 'Voir le récap'
          : 'Envoyer'
    return (
      <div className="cart-sheet-footer">
        {hasItems && (
          <div className="cart-sheet-footer-total">
            <span className="cart-sheet-footer-total-label">Total</span>
            <span className="cart-sheet-footer-total-value">
              {finalTotal.toFixed(2).replace('.', ',')} €
            </span>
          </div>
        )}
        <div className={cn('grid gap-2', currentStep === 2 ? 'grid-cols-[auto_1fr]' : 'grid-cols-1')}>
          {currentStep === 2 && (
            <button
              type="button"
              onClick={goBack}
              aria-label="Revenir à l'étape précédente"
              className="cart-sheet-btn-ghost cursor-pointer"
            >
              <ChevronLeft size={14} />
              Retour
            </button>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={goNext}
            disabled={!canAdvance}
            aria-label={nextLabel}
            className={cn(
              'cart-sheet-btn-primary cursor-pointer',
              canAdvance ? 'is-enabled' : 'is-disabled',
            )}
          >
            {nextLabel}
            <ChevronRight size={16} aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="cart-sheet-backdrop fixed inset-0 z-50 md:hidden cursor-pointer"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Panier"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="cart-sheet fixed bottom-0 left-0 right-0 z-50 h-[92dvh] max-h-[92dvh] md:hidden flex flex-col"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="cart-sheet-handle" />
            </div>

            {/* Header */}
            <div className="cart-sheet-header flex-shrink-0">
              <div>
                <span className="cart-sheet-eyebrow">Maison Mayssa</span>
                <h2 className="cart-sheet-title">Votre précommande</h2>
                {itemCount > 0 && (
                  <p className="cart-sheet-count">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { hapticFeedback('light'); onClose() }}
                aria-label="Fermer le panier"
                className="cart-sheet-close cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Progress indicator */}
            {renderStepIndicator()}

            {/* Step content (scrollable) */}
            <div className="cart-sheet-body flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {renderFooter()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
