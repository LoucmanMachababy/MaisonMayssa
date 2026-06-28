import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, User, Phone, Mail, MapPin, Calendar, Clock, Star, Gift, Tag, Heart, Lock, ChevronLeft, ChevronRight, Sparkles, CreditCard, Check } from 'lucide-react'
import type { CartItem, CustomerInfo } from '../types'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate, normalizeOrderProductBaseId, trompeSelectionDisplayLabels } from '../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY, isTrompeBoxWithStoredSelection } from '../constants'
import { STORE_ADDRESS_LINE } from '../constants/store'
import { ReservationTimer } from './ReservationTimer'
import { useAuth } from '../hooks/useAuth'
import { REWARD_COSTS, REWARD_LABELS } from '../lib/rewards'
import type { DeliverySlotsMap } from '../lib/firebase'
import { PaymentSection } from './checkout/PaymentSection'
import type { StripePaymentConfirmHandler } from './checkout/StripePayment'
import {
    CheckoutAlerts,
    CheckoutCgv,
    CheckoutJourneyCard,
    CheckoutOrderSummary,
    CheckoutPayGate,
    CheckoutPaymentIntro,
} from './checkout/CheckoutUi'
import { PAYMENT_ENABLED, CLICK_COLLECT_ONLY } from '../constants/checkout'
import type { PaymentMethod } from '../constants/checkout'
import {
    getPickupSlotsForDate,
    OPENING_HOURS_LABEL,
    getMinDate,
    getSelectableDates,
    formatDateLabel,
    validateCustomer,
    computeDeliveryFee,
} from '../lib/delivery'

interface CartProps {
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
    /** Date minimum (définie par l'admin). Par défaut = aujourd'hui. */
    minDate?: string
    /** Première date retrait (si défini avec minDateLivraison, le calendrier utilise celle du mode choisi). */
    minDateRetrait?: string
    /** Première date livraison. */
    minDateLivraison?: string
    /** Date maximum (définie par l'admin). Optionnel. */
    maxDate?: string
    /** Si false, les clients ne peuvent pas envoyer de commande. */
    ordersOpen?: boolean
    /** Message affiché quand les commandes sont fermées (ex: événement). */
    ordersClosedMessage?: string
    /** Si true, l'admin a manuellement forcé l'ouverture — bypasse la coupure 17h. */
    ordersExplicit?: boolean
    /** Jours de la semaine autorisés (0=dim…6=sam). Si défini, le client ne peut choisir que ces jours. */
    availableWeekdays?: number[]
    /** Dates de récupération proposées aux clients (YYYY-MM-DD). Si renseigné, remplace availableWeekdays. */
    pickupDates?: string[]
    /** Date d'ouverture des précommandes (YYYY-MM-DD). */
    preorderOpenDate?: string
    /** Heure d'ouverture des précommandes (HH:mm). */
    preorderOpenTime?: string
    /** Créneaux retrait (définis par l'admin). Si absent = défaut (ex. 18:30). */
    retraitTimeSlots?: string[]
    /** Créneaux livraison (définis par l'admin). Si absent = défaut. */
    livraisonTimeSlots?: string[]
    promoCodeInput?: string
    setPromoCodeInput?: (v: string) => void
    appliedPromo?: { code: string; discount: number } | null
    onApplyPromo?: () => void
    onClearPromo?: () => void
    donationAmount?: number
    setDonationAmount?: (v: number) => void
    referralCodeInput?: string
    setReferralCodeInput?: (v: string) => void
    /** Réduction 10 % gagnée en trouvant le trompe l'oeil mystère (Fraise) */
    mysteryFraiseDiscount?: number
    /** Si défini, le client a déjà passé une commande récente → message + choix autre commande */
    pendingOrder?: { orderNumber?: number; placedAt: number } | null
    /** Lève le rappel local (48 h) pour permettre une nouvelle commande avec le même numéro */
    onAllowAnotherOrder?: () => void
    paymentConfirmed?: boolean
    paymentMethod?: PaymentMethod | null
    onConfirmPayment?: StripePaymentConfirmHandler
    onResetPayment?: () => void
    /** Stripe réel : la commande est créée automatiquement au paiement (pas de bouton « Réserver »). */
    autoPlaceOrderOnPayment?: boolean
}

export function Cart({
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
    ordersClosedMessage = '',
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
}: CartProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [stepDirection, setStepDirection] = useState(1)
    const [dismissSecondOrderPrompt, setDismissSecondOrderPrompt] = useState(false)

    const goToStep = (next: 1 | 2 | 3 | 4) => {
        setStepDirection(next > step ? 1 : -1)
        setStep(next)
    }
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    useEffect(() => {
        setDismissSecondOrderPrompt(false)
    }, [pendingOrder?.placedAt])

    const hasItems = items.length > 0
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const { isAuthenticated, profile } = useAuth()

    // Touched state for real-time validation feedback
    const [touched, setTouched] = useState<Partial<Record<keyof typeof customer, boolean>>>({})
    const markTouched = (field: keyof typeof customer) =>
        setTouched(prev => ({ ...prev, [field]: true }))

    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0)
    const deliveryFee = useMemo(() => computeDeliveryFee(customer, totalAfterDiscount), [customer, totalAfterDiscount])
    const finalTotal = totalAfterDiscount + (deliveryFee ?? 0) + donationAmount

    // Calcul des points de fidélité
    const pointsToEarn = Math.round(finalTotal) // 1 € = 1 point
    const availableRewards = isAuthenticated && profile 
      ? Object.entries(REWARD_COSTS).filter(([_, cost]) => profile.loyalty.points >= cost)
      : []

    // Créneaux de retrait selon les horaires d'ouverture de la boutique
    // (Lun-Sam 11h-21h30, Dim 9h-12h) pour la date choisie.
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

    // Reset time if slot n'est plus dans la liste (admin) ou créneau livraison complet
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
    }, [customer.wantsDelivery, customer.date, customer.time, deliverySlots, allTimeSlots])

    const minDate = CLICK_COLLECT_ONLY
      ? (minDateRetrait ?? (minDateProp && minDateProp.trim() ? minDateProp : getMinDate()))
      : (minDateRetrait != null && minDateLivraison != null)
        ? (customer.wantsDelivery ? minDateLivraison : minDateRetrait)
        : (minDateProp && minDateProp.trim() ? minDateProp : getMinDate())
    const maxDate = maxDateProp && maxDateProp.trim() ? maxDateProp : undefined
    // Précommandes ouvertes si la date+heure d'ouverture est passée (ou si pas configurée)
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
    }, [useDateSelect, selectableDates, customer.date])

    const validationErrors = useMemo(
        () => validateCustomer(customer),
        [customer],
    )
    // Show error only for fields the user has interacted with
    const showError = (field: keyof typeof customer) =>
        touched[field] && validationErrors[field as keyof CustomerInfo]

    const isCustomerValid = Object.keys(validationErrors).length === 0
    const hasNonTrompeLoeil = items.some((item) => item.product.category !== "Trompe l'œil")
    const hasTrompeLoeil = items.some((item) => item.product.category === "Trompe l'œil")
    // Bloquer seulement si la date choisie par le client est avant minDate (pas si aujourd'hui l'est)
    const trompeLoeilBeforeMinDate = hasTrompeLoeil && !!customer.date && customer.date < minDate
    const orderCutoffPassed = !isBeforeOrderCutoff()
    const isClassicPreorderPhase = isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)
    // Conditions pour accéder au paiement (hors paiement lui-même) : tout doit
    // être prêt AVANT d'afficher le bloc Stripe, sinon on encaisserait sans
    // pouvoir honorer (ex. commandes fermées).
    const canPay =
      hasItems &&
      isCustomerValid &&
      acceptedTerms &&
      ordersOpen !== false &&
      !trompeLoeilBeforeMinDate &&
      (!hasNonTrompeLoeil || !orderCutoffPassed || ordersExplicit)

    const stepLabels: Record<1 | 2 | 3 | 4, string> = {
        1: 'Options',
        2: 'Coordonnées',
        3: CLICK_COLLECT_ONLY ? 'Créneau' : 'Livraison',
        4: 'Paiement',
    }

    const stepIcons: Record<1 | 2 | 3 | 4, typeof Sparkles> = {
        1: Sparkles,
        2: User,
        3: MapPin,
        4: CreditCard,
    }

    const stepMotion = {
        initial: (direction: number) => ({ opacity: 0, x: direction > 0 ? 28 : -28, filter: 'blur(4px)' }),
        animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
        exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -28 : 28, filter: 'blur(4px)' }),
    }

    return (
        <div className="premium-cart-checkout min-w-0 w-full overflow-hidden">
            <div className="premium-cart-checkout__inner">
            {!ordersOpen && ordersClosedMessage.trim().length > 0 && (
                <div className="premium-cart-checkout__alert mb-6">
                    <p className="text-sm font-bold text-mayssa-brown">Précommandes fermées cette semaine</p>
                    <p className="text-xs text-mayssa-brown/70 mt-1 leading-relaxed">
                        {ordersClosedMessage}
                    </p>
                </div>
            )}
            <header className="premium-cart-checkout__header">
                <div>
                    <span className="premium-cart-checkout__eyebrow">Maison Mayssa</span>
                    <h2 className="premium-cart-checkout__title">Votre précommande</h2>
                    {itemCount > 0 && (
                        <p className="premium-cart-checkout__count">{itemCount} article{itemCount > 1 ? 's' : ''} sélectionné{itemCount > 1 ? 's' : ''}</p>
                    )}
                </div>
                <ShoppingBag size={28} className="text-mayssa-gold shrink-0" strokeWidth={1.25} />
            </header>

            <div className="premium-cart-checkout__grid">
                {/* Left Column: Items & Notes */}
                <div className={`space-y-8 min-w-0 ${step > 1 ? 'hidden lg:block' : 'block'}`}>
                    <div className="space-y-4">
                        <p className="premium-cart-checkout__section-label">
                            Articles ({itemCount})
                        </p>
                        <AnimatePresence mode="popLayout">
                            {hasItems ? (
                                <div className="divide-y divide-mayssa-brown/8">
                                    {items.map((item) => (
                                        <motion.div
                                            key={item.product.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="premium-cart-checkout__item group"
                                        >
                                            {item.product.image && (
                                                <div className="premium-cart-checkout__item-img">
                                                    <img
                                                        src={item.product.image}
                                                        alt={item.product.name}
                                                        width={80}
                                                        height={80}
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start gap-2">
                                                    <h3 className="premium-cart-checkout__item-name truncate flex-1">
                                                        {item.product.name}
                                                    </h3>
                                                </div>
                                                {item.product.description && (
                                                    <p className="text-[10px] sm:text-xs text-mayssa-brown/60 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {item.product.description}
                                                    </p>
                                                )}
                                                {(() => {
                                                    const baseId = normalizeOrderProductBaseId(item.product.id)
                                                    const sel = item.trompeDiscoverySelection
                                                    if (!sel?.length || !isTrompeBoxWithStoredSelection(baseId)) return null
                                                    const labels = trompeSelectionDisplayLabels(sel)
                                                    return (
                                                        <ul className="mt-1.5 text-[10px] text-mayssa-brown/55 space-y-0.5 list-disc list-inside">
                                                            {labels.map((label, idx) => (
                                                                <li key={`${sel[idx]}-${idx}`}>{label}</li>
                                                            ))}
                                                        </ul>
                                                    )
                                                })()}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <p className="text-xs text-mayssa-brown/60">
                                                        {item.product.price.toFixed(2).replace('.', ',')} €
                                                    </p>
                                                    <p className="premium-cart-checkout__item-price">
                                                        {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                                                    </p>
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

                                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                                <div className="premium-cart-checkout__qty">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                                        aria-label={`Réduire ${item.product.name}`}
                                                        className="premium-cart-checkout__qty-btn"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold text-mayssa-brown">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                                        aria-label={`Ajouter ${item.product.name}`}
                                                        className="premium-cart-checkout__qty-btn"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="premium-cart-checkout__empty">
                                    <ShoppingBag size={40} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-display text-lg text-mayssa-brown">Panier vide</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-3">
                        <label className="premium-cart-checkout__section-label block">
                            Instructions particulières
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="Allergies ou demande particulière"
                            className="premium-cart-checkout__textarea"
                        />
                    </div>
                </div>

                {/* Right Column: Wizard */}
                <div className="premium-cart-checkout__flow min-w-0">
                    {/* Progress header */}
                    <div className="premium-cart-checkout__progress-head">
                        <div className="premium-cart-checkout__progress-meta">
                            <span className="premium-cart-checkout__progress-eyebrow">
                                Étape {step} sur 4
                            </span>
                            <h3 className="premium-cart-checkout__progress-title">
                                {stepLabels[step]}
                            </h3>
                        </div>
                        <div className="premium-cart-checkout__progress-track" aria-hidden="true">
                            <motion.div
                                className="premium-cart-checkout__progress-fill"
                                initial={false}
                                animate={{ width: `${(step / 4) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                            />
                        </div>
                        <div className="premium-cart-checkout__pills" role="tablist" aria-label="Étapes de commande">
                            {([1, 2, 3, 4] as const).map((s) => {
                                const Icon = stepIcons[s]
                                return (
                                    <button
                                        key={s}
                                        type="button"
                                        role="tab"
                                        aria-selected={step === s}
                                        aria-label={stepLabels[s]}
                                        disabled={s > step}
                                        onClick={() => { if (s <= step) goToStep(s) }}
                                        className={cn(
                                            'premium-cart-checkout__pill',
                                            step === s && 'is-active',
                                            step > s && 'is-done',
                                        )}
                                    >
                                        <span className="premium-cart-checkout__pill-icon">
                                            {step > s ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={1.75} />}
                                        </span>
                                        <span className="premium-cart-checkout__pill-label">{stepLabels[s]}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Animated step content */}
                    <div className={cn('premium-cart-checkout__step-viewport', step === 4 && 'premium-cart-checkout__step-viewport--payment')}>
                        <AnimatePresence mode="wait" custom={stepDirection}>
                            {step === 1 && (
                                <motion.div
                                    key="step-1"
                                    custom={stepDirection}
                                    variants={stepMotion}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                    className="premium-cart-checkout__step-panel space-y-6"
                                >
                        {/* Code promo */}
                        {setPromoCodeInput != null && onApplyPromo != null && onClearPromo != null && (
                            <div className="space-y-2">
                                <p className="premium-cart-checkout__section-label">Code promo</p>
                                {appliedPromo ? (
                                    <div className="premium-cart-checkout__promo-applied">
                                        <span className="text-sm font-semibold text-[#2D5A2D]">
                                            <Tag size={14} className="inline mr-1.5" />
                                            {appliedPromo.code} : -{appliedPromo.discount.toFixed(2).replace('.', ',')} €
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onClearPromo}
                                            aria-label="Retirer le code promo"
                                            className="text-xs font-medium text-[#2D5A2D] hover:underline"
                                        >
                                            Retirer
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <div className="premium-cart-checkout__field flex-1">
                                            <Tag size={16} className="text-mayssa-gold shrink-0" />
                                            <input
                                                type="text"
                                                value={promoCodeInput}
                                                onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                                placeholder="Code promo"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={onApplyPromo}
                                            disabled={!promoCodeInput.trim()}
                                            aria-label="Appliquer le code promo"
                                            className="premium-cart-checkout__btn-primary shrink-0 !w-auto px-5"
                                        >
                                            Appliquer
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Code parrain (1ère commande uniquement) */}
                        {setReferralCodeInput != null && isAuthenticated && profile && (profile.orderStats?.orderCount ?? 0) === 0 && !profile.referredByCode && (
                            <div className="space-y-2">
                                <p className="premium-cart-checkout__section-label">Code parrain</p>
                                <p className="premium-cart-checkout__muted">Un ami t&apos;a parrainé ? Saisis son code pour avoir -5 € sur ta 1ère commande.</p>
                                <div className="premium-cart-checkout__field">
                                    <Gift size={16} className="text-mayssa-gold shrink-0" />
                                    <input
                                        type="text"
                                        value={referralCodeInput}
                                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                        placeholder="ex. MAYSSA-ABC1"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Soutien au projet */}
                        {setDonationAmount != null && (
                            <div className="space-y-2">
                                <p className="premium-cart-checkout__section-label flex items-center gap-1.5">
                                    <Heart size={12} /> Soutenir le projet
                                </p>
                                <p className="premium-cart-checkout__muted">Montant libre (optionnel)</p>
                                <div className="premium-cart-checkout__segment">
                                    {[2, 5, 10, 15].map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setDonationAmount(donationAmount === amount ? 0 : amount)}
                                            aria-label={donationAmount === amount ? `Retirer le don de ${amount} €` : `Ajouter un don de ${amount} €`}
                                            className={cn(
                                                'premium-cart-checkout__chip',
                                                donationAmount === amount && 'is-active',
                                            )}
                                        >
                                            {amount} €
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-mayssa-brown/55">Autre :</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={donationAmount > 0 && [2, 5, 10, 15].includes(donationAmount) ? '' : donationAmount || ''}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value)
                                            setDonationAmount(isNaN(v) || v < 0 ? 0 : Math.round(v * 100) / 100)
                                        }}
                                        placeholder="0"
                                        className="w-20 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-mayssa-brown/10"
                                    />
                                    <span className="text-sm text-mayssa-brown/55">€</span>
                                </div>
                            </div>
                        )}

                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step-2"
                                    custom={stepDirection}
                                    variants={stepMotion}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                    className="premium-cart-checkout__step-panel space-y-6"
                                >
                        <p className="premium-cart-checkout__section-label border-b border-mayssa-brown/10 pb-3">
                            Vos coordonnées
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className={cn('premium-cart-checkout__field', showError('firstName') && 'is-error')}>
                                    <User size={18} className="text-mayssa-gold flex-shrink-0" />
                                    <input
                                        value={customer.firstName}
                                        onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                        onBlur={() => markTouched('firstName')}
                                        placeholder="Prénom *"
                                        aria-label="Prénom"
                                    />
                                </div>
                                {showError('firstName') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.firstName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <div className={cn('premium-cart-checkout__field', showError('lastName') && 'is-error')}>
                                    <User size={18} className="text-mayssa-gold flex-shrink-0" />
                                    <input
                                        value={customer.lastName}
                                        onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                                        onBlur={() => markTouched('lastName')}
                                        placeholder="Nom *"
                                        aria-label="Nom"
                                    />
                                </div>
                                {showError('lastName') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className={cn('premium-cart-checkout__field', showError('phone') && 'is-error')}>
                                <Phone size={18} className="text-mayssa-gold flex-shrink-0" />
                                <input
                                    type="tel"
                                    value={customer.phone}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\s/g, '')
                                        if (value.length > 2) value = value.match(/.{1,2}/g)?.join(' ') || value
                                        onCustomerChange({ ...customer, phone: value })
                                    }}
                                    onBlur={() => markTouched('phone')}
                                    placeholder="Numéro de téléphone *"
                                    aria-label="Numéro de téléphone"
                                />
                            </div>
                            {showError('phone') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.phone}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className={cn('premium-cart-checkout__field', showError('email') && 'is-error')}>
                                <Mail size={18} className="text-mayssa-gold flex-shrink-0" />
                                <input
                                    type="email"
                                    value={customer.email ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
                                    onBlur={() => markTouched('email')}
                                    placeholder="Email *"
                                    aria-label="Email pour la confirmation de commande"
                                />
                            </div>
                            {showError('email')
                                ? <p className="text-[10px] text-red-500 pl-4">{validationErrors.email}</p>
                                : <p className="premium-cart-checkout__muted pl-1">Pour recevoir ta confirmation de commande et de retrait.</p>}
                        </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step-3"
                                    custom={stepDirection}
                                    variants={stepMotion}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                                    className="premium-cart-checkout__step-panel space-y-6"
                                >
                        <p className="premium-cart-checkout__section-label border-b border-mayssa-brown/10 pb-3">
                            Créneau de retrait
                        </p>
                        <div className="premium-cart-checkout__panel flex items-start gap-3">
                            <MapPin size={22} className="text-mayssa-gold shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-mayssa-brown">Retrait à la boutique</p>
                                <p className="text-[12px] text-mayssa-brown/75 mt-1 font-medium">
                                    Galerie marchande du Carrefour — {STORE_ADDRESS_LINE}
                                </p>
                                <p className="text-[11px] text-mayssa-gold mt-1 font-semibold">
                                    {OPENING_HOURS_LABEL}
                                </p>
                                <p className="premium-cart-checkout__muted mt-1.5">
                                    Choisissez votre créneau de retrait. Votre commande payée vous attend au comptoir, prête à emporter.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn('premium-cart-checkout__field', validationErrors.date && 'is-error')}>
                                <Calendar size={16} className="text-mayssa-gold shrink-0" aria-hidden="true" />
                                {useDateSelect ? (
                                  <select
                                    id="cart-date"
                                    value={selectableDates.includes(customer.date) ? customer.date : selectableDates[0] ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, date: e.target.value, time: '' })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none cursor-pointer"
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
                                    id="cart-date"
                                    type="date"
                                    min={minDate}
                                    max={maxDate}
                                    value={customer.date}
                                    onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none"
                                    aria-label="Date de retrait"
                                  />
                                )}
                            </div>
                            <div className={cn('premium-cart-checkout__field', validationErrors.time && 'is-error')}>
                                <Clock size={16} className="text-mayssa-gold shrink-0" aria-hidden="true" />
                                <select
                                    id="cart-time"
                                    value={customer.time}
                                    onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none cursor-pointer"
                                    aria-label="Heure de retrait"
                                >
                                    <option value="">L'heure</option>
                                    {allTimeSlots.map((t) => {
                                        const full = isSlotFull(t)
                                        const placesLeft = getPlacesLeft(t)
                                        return (
                                            <option key={t} value={t} disabled={full}>
                                                {t}{full ? ' — Complet' : placesLeft < DELIVERY_SLOT_MAX_CAPACITY ? ` — Plus que ${placesLeft} place${placesLeft > 1 ? 's' : ''}` : ''}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <div
                                    key="step-4"
                                    className="premium-cart-checkout__step-panel space-y-6"
                                >
                        <CheckoutPaymentIntro />

                        <CheckoutOrderSummary
                            subtotal={total + mysteryFraiseDiscount}
                            promoDiscount={appliedPromo?.discount}
                            promoCode={appliedPromo?.code}
                            mysteryDiscount={mysteryFraiseDiscount}
                            donation={donationAmount}
                            total={finalTotal}
                        />

                            {/* Points & Récompenses */}
                            {isAuthenticated && profile && hasItems && (
                                <div className="space-y-3 pt-5 mt-5 border-t border-mayssa-brown/10">
                                    {/* Points à gagner */}
                                    <div className="premium-cart-checkout__loyalty">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-mayssa-soft p-1.5 rounded-full">
                                                <Star size={16} className="text-mayssa-gold" />
                                            </div>
                                            <span className="text-sm font-medium text-mayssa-brown">
                                                Vous gagnerez <span className="font-bold text-mayssa-gold">{pointsToEarn} points</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider text-mayssa-brown/50">Solde actuel</p>
                                            <p className="font-bold text-lg text-mayssa-gold">{profile.loyalty.points} pts</p>
                                        </div>
                                    </div>

                                    {/* Récompenses disponibles */}
                                    {availableRewards.length > 0 && (
                                        <div className="space-y-3 mt-4">
                                            <p className="text-xs uppercase tracking-widest font-bold text-mayssa-brown/50">
                                                Récompenses
                                            </p>
                                            <div className="grid gap-2">
                                                {availableRewards.slice(0, 2).map(([rewardType, cost]) => (
                                                    <div
                                                        key={rewardType}
                                                        className={cn(
                                                            'premium-cart-checkout__reward-item group',
                                                            selectedReward?.type === rewardType && 'is-selected',
                                                        )}
                                                        onClick={() => {
                                                            if (onSelectReward) {
                                                                onSelectReward(
                                                                    selectedReward?.type === rewardType
                                                                        ? null
                                                                        : { type: rewardType as keyof typeof REWARD_COSTS, id: `reward_${Date.now()}` }
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-1.5 rounded-full transition-colors ${selectedReward?.type === rewardType ? 'bg-mayssa-gold text-white shadow-md' : 'bg-transparent text-mayssa-gold group-hover:bg-mayssa-gold/10'}`}>
                                                                <Gift size={14} />
                                                            </div>
                                                            <span className="text-xs font-bold text-mayssa-brown">
                                                                {REWARD_LABELS[rewardType as keyof typeof REWARD_LABELS]}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[11px] font-medium text-mayssa-brown/50">{cost} pts</span>
                                                            {selectedReward?.type === rewardType && (
                                                                <div className="w-5 h-5 rounded-full bg-mayssa-brown flex items-center justify-center shadow-lg transform scale-110 transition-transform">
                                                                    <span className="text-mayssa-gold text-[10px] font-bold">✓</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedReward && (
                                                <p className="text-[11px] text-[#2D5A2D] font-medium bg-[#E8F3E8] border border-[#A3C7A3] rounded-xl p-2.5 text-center shadow-sm">
                                                    🎁 {REWARD_LABELS[selectedReward.type]} sera ajouté à ta commande
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Incitation connexion si pas connecté */}
                            {!isAuthenticated && hasItems && (
                                <div className="premium-cart-checkout__loyalty">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="bg-mayssa-gold/10 p-1.5 rounded-full">
                                            <Star size={16} className="text-mayssa-gold drop-shadow-sm" />
                                        </div>
                                        <span className="text-sm font-bold text-mayssa-brown">
                                            Gagnez {pointsToEarn} points avec cette commande !
                                        </span>
                                    </div>
                                    <p className="premium-cart-checkout__muted mb-3">
                                        1 € dépensé = 1 point. Cadeaux à 60, 100, 150 ou 250 pts (surprise, 5€, mini box, box).
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onAccountClick}
                                        aria-label="Ouvrir mon compte"
                                        className="w-full py-2.5 px-4 bg-mayssa-brown text-mayssa-gold border border-mayssa-gold/30 rounded-xl text-[11px] uppercase tracking-wider font-bold hover:bg-mayssa-brown/90 shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                        Créer mon compte (+15 pts bonus)
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3 pt-4">
                                {pendingOrder ? (
                                    /* ── Commande reçue + option 2e commande ── */
                                    <div className="premium-cart-checkout__success space-y-4">
                                        <div className="text-5xl drop-shadow-md">✨</div>
                                        <div className="space-y-1.5">
                                            <p className="text-base font-bold text-[#2D5A2D] uppercase tracking-widest">
                                                Votre commande a bien été reçue{pendingOrder.orderNumber ? ` (n°${pendingOrder.orderNumber})` : ''} !
                                            </p>
                                            <p className="text-xs text-[#2D5A2D]/80 leading-relaxed max-w-[280px] mx-auto">
                                                Nous la traitons et nous vous recontacterons rapidement pour confirmer.
                                            </p>
                                        </div>
                                        {!dismissSecondOrderPrompt && onAllowAnotherOrder ? (
                                            <div className="space-y-3 pt-1">
                                                <p className="text-xs font-semibold text-[#2D5A2D]">
                                                    Souhaitez-vous passer une autre commande ?
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDismissSecondOrderPrompt(true)}
                                                        className="py-2.5 px-4 rounded-xl border-2 border-[#2D5A2D]/30 text-[11px] font-bold uppercase tracking-wider text-[#2D5A2D] hover:bg-[#2D5A2D]/5 transition-all cursor-pointer"
                                                    >
                                                        Non, merci
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onAllowAnotherOrder()}
                                                        className="py-2.5 px-4 rounded-xl bg-[#2D5A2D] text-white text-[11px] font-bold uppercase tracking-wider shadow-md hover:bg-[#244a24] transition-all cursor-pointer"
                                                    >
                                                        Oui, une autre commande
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                        <p className="text-[10px] text-[#2D5A2D]/50 italic">
                                            Ce rappel disparaît automatiquement au bout de 48 h.
                                        </p>
                                    </div>
                                ) : (
                                <>
                                <CheckoutJourneyCard className="max-w-md mx-auto" />

                                <CheckoutAlerts
                                    hasNonTrompeLoeil={hasNonTrompeLoeil}
                                    isClassicPreorderPhase={isClassicPreorderPhase}
                                    firstPickupLabel={FIRST_PICKUP_DATE_CLASSIC_LABEL}
                                    orderCutoffPassed={orderCutoffPassed}
                                    trompeLoeilBeforeMinDate={trompeLoeilBeforeMinDate}
                                    minDateLabel={formatDateLabel(minDate)}
                                />

                                <CheckoutCgv
                                    checked={acceptedTerms}
                                    onChange={setAcceptedTerms}
                                    className="max-w-md mx-auto px-1"
                                />

                                {/* Le paiement ne s'affiche QUE si la commande peut aboutir
                                    (commandes ouvertes, infos valides, CGV, créneau OK) —
                                    sinon on ne doit pas pouvoir encaisser. */}
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
                                            className="max-w-md mx-auto"
                                        />
                                    )
                                ) : (
                                    <CheckoutPayGate
                                        className="max-w-md mx-auto"
                                        message={
                                            hasItems
                                                ? ordersOpen === false
                                                    ? 'Les commandes sont fermées pour le moment — le paiement est indisponible.'
                                                    : !isCustomerValid
                                                        ? 'Complétez vos coordonnées (nom, email, téléphone, créneau) pour payer.'
                                                        : !acceptedTerms
                                                            ? 'Acceptez les CGV pour accéder au paiement.'
                                                            : trompeLoeilBeforeMinDate
                                                                ? `Les trompe-l'œil sont disponibles à partir du ${formatDateLabel(minDate)}.`
                                                                : orderCutoffPassed && hasNonTrompeLoeil
                                                                    ? 'Commandes (pâtisseries, cookies…) possibles jusqu\'à 17h.'
                                                                    : 'Finalisez votre commande pour accéder au paiement.'
                                                : 'Votre panier est vide.'
                                        }
                                    />
                                )}

                                {/* Validation finale — mode paiement simulé uniquement */}
                                {canPay && paymentConfirmed && !autoPlaceOrderOnPayment && (
                                    <button
                                        type="button"
                                        onClick={onSend}
                                        aria-label="Valider et réserver ma commande click and collect"
                                        className="premium-cart-checkout__btn-primary"
                                    >
                                        <Lock size={18} />
                                        <span>Réserver mon retrait</span>
                                    </button>
                                )}
                                </>
                                )}
                            </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sticky footer navigation */}
                    {!pendingOrder && (
                        <motion.div
                            layout
                            className="premium-cart-checkout__footer"
                        >
                            <div className="premium-cart-checkout__footer-total">
                                <span className="premium-cart-checkout__footer-total-label">Total</span>
                                <span className="premium-cart-checkout__footer-total-value">
                                    {finalTotal.toFixed(2).replace('.', ',')} €
                                </span>
                            </div>
                            <div className="premium-cart-checkout__footer-actions">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => goToStep((step - 1) as 1 | 2 | 3 | 4)}
                                        className="premium-cart-checkout__btn-ghost"
                                    >
                                        <ChevronLeft size={16} />
                                        Retour
                                    </button>
                                )}
                                {step < 4 ? (
                                    <button
                                        type="button"
                                        onClick={() => goToStep((step + 1) as 1 | 2 | 3 | 4)}
                                        className="premium-cart-checkout__btn-primary premium-cart-checkout__btn-primary--gold"
                                    >
                                        Continuer
                                        <ChevronRight size={16} />
                                    </button>
                                ) : null}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
        </div>
    )
}
