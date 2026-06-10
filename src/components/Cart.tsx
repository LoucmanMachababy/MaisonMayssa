import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, User, Phone, Mail, MapPin, Truck, Calendar, Clock, Star, Gift, Instagram, Tag, Heart } from 'lucide-react'
import { SnapIcon } from './SnapIcon'
import type { CartItem, CustomerInfo } from '../types'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate, normalizeOrderProductBaseId, trompeSelectionDisplayLabels } from '../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY, isTrompeBoxWithStoredSelection } from '../constants'
import { ReservationTimer } from './ReservationTimer'
import { useAuth } from '../hooks/useAuth'
import { REWARD_COSTS, REWARD_LABELS } from '../lib/rewards'
import type { DeliverySlotsMap } from '../lib/firebase'
import { AddressAutocomplete } from './AddressAutocomplete'
import {
    ANNECY_GARE,
    DELIVERY_RADIUS_KM,
    DELIVERY_FEE,
    FREE_DELIVERY_THRESHOLD,
    calculateDistance,
    generateTimeSlots,
    getMinDate,
    getSelectableDates,
    formatDateLabel,
    validateCustomer,
    computeDeliveryFee,
    normalizeInstagramHandle,
} from '../lib/delivery'

interface CartProps {
    items: CartItem[]
    total: number
    note: string
    customer: CustomerInfo
    onUpdateQuantity: (id: string, quantity: number) => void
    onNoteChange: (note: string) => void
    onCustomerChange: (customer: CustomerInfo) => void
    onSend: () => void
    onSendInstagram: () => void
    onSendSnap: () => void
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
    /** Canal pour libellés identité (nom/prénom vs pseudo Insta/Snap) */
    orderContactIdentity?: 'whatsapp' | 'instagram' | 'snap'
    onOrderContactIdentityChange?: (v: 'whatsapp' | 'instagram' | 'snap') => void
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
    onSendInstagram,
    onSendSnap,
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
    retraitTimeSlots,
    livraisonTimeSlots,
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
    orderContactIdentity = 'whatsapp',
    onOrderContactIdentityChange,
}: CartProps) {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
    const [dismissSecondOrderPrompt, setDismissSecondOrderPrompt] = useState(false)
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

    const distanceFromAnnecy = useMemo(() => {
        return calculateDistance(customer.addressCoordinates, ANNECY_GARE)
    }, [customer.addressCoordinates])

    const isWithinDeliveryZone = distanceFromAnnecy !== null && distanceFromAnnecy <= DELIVERY_RADIUS_KM

    const totalAfterDiscount = total - (appliedPromo?.discount ?? 0)
    const deliveryFee = useMemo(() => computeDeliveryFee(customer, totalAfterDiscount), [customer, totalAfterDiscount])
    const finalTotal = totalAfterDiscount + (deliveryFee ?? 0) + donationAmount

    // Calcul des points de fidélité
    const pointsToEarn = Math.round(finalTotal) // 1 € = 1 point
    const availableRewards = isAuthenticated && profile 
      ? Object.entries(REWARD_COSTS).filter(([_, cost]) => profile.loyalty.points >= cost)
      : []

    const allTimeSlots = useMemo(() => {
      if (customer.wantsDelivery && livraisonTimeSlots && livraisonTimeSlots.length > 0) return livraisonTimeSlots
      if (!customer.wantsDelivery && retraitTimeSlots && retraitTimeSlots.length > 0) return retraitTimeSlots
      return generateTimeSlots(customer.wantsDelivery)
    }, [customer.wantsDelivery, retraitTimeSlots, livraisonTimeSlots])
    const timeSlots = useMemo(() => {
      if (!customer.wantsDelivery || !customer.date) return allTimeSlots
      const taken = deliverySlots[customer.date]
      if (!taken) return allTimeSlots
      return allTimeSlots.filter((t) => (taken[t] ?? 0) < DELIVERY_SLOT_MAX_CAPACITY)
    }, [customer.wantsDelivery, customer.date, deliverySlots, allTimeSlots])
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

    const minDate = (minDateRetrait != null && minDateLivraison != null)
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

    const handleContactIdentityChange = (v: 'whatsapp' | 'instagram' | 'snap') => {
        if (v === 'instagram' || v === 'snap') {
            onCustomerChange({ ...customer, lastName: '' })
        }
        onOrderContactIdentityChange?.(v)
    }

    const validationErrors = useMemo(
        () => validateCustomer(customer, { identityMode: orderContactIdentity }),
        [customer, orderContactIdentity],
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
    const canSend =
      hasItems &&
      isCustomerValid &&
      ordersOpen !== false &&
      !trompeLoeilBeforeMinDate &&
      (!hasNonTrompeLoeil || !orderCutoffPassed || ordersExplicit)

    const stepLabels: Record<1 | 2 | 3 | 4, string> = {
        1: 'Options',
        2: 'Infos',
        3: 'Livraison',
        4: 'Validation',
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
                                <div className="space-y-4">
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
                            placeholder="Allergies ou instructions livraison"
                            className="premium-cart-checkout__textarea"
                        />
                    </div>
                </div>

                {/* Right Column: Info & Totals */}
                <div className="premium-cart-checkout__flow space-y-6 min-w-0">
                        {/* Étapes */}
                        <div className="premium-cart-checkout__steps">
                           {([1, 2, 3, 4] as const).map((s) => (
                             <button
                               key={s}
                               type="button"
                               disabled={s > step && s !== step}
                               onClick={() => { if (s <= step) setStep(s) }}
                               className={cn(
                                 'premium-cart-checkout__step',
                                 step === s && 'is-active',
                                 step > s && 'is-done',
                               )}
                             >
                               <span className={cn('premium-cart-checkout__step-bar', (step >= s) && 'is-done')} />
                               <span className="premium-cart-checkout__step-label">{stepLabels[s]}</span>
                             </button>
                           ))}
                        </div>

                        <div className={step === 1 ? 'space-y-6 block' : 'hidden'}>
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
                                <p className="text-[10px] text-mayssa-brown/60">Un ami t&apos;a parrainé ? Saisis son code pour avoir -5 € sur ta 1ère commande.</p>
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
                                <p className="text-[10px] text-mayssa-brown/60">Montant libre (optionnel)</p>
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
                                    <span className="text-sm text-mayssa-brown/60">Autre :</span>
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
                                    <span className="text-sm text-mayssa-brown/60">€</span>
                                </div>
                            </div>
                        )}

                            <div className="pt-4 border-t border-mayssa-gold/20">
                                <button type="button" onClick={() => setStep(2)} className="premium-cart-checkout__btn-primary">
                                    Suivant : Mes informations →
                                </button>
                            </div>
                        </div>

                        <div className={step === 2 ? 'space-y-6 block' : 'hidden'}>
                        <p className="premium-cart-checkout__section-label border-b border-mayssa-brown/8 pb-3">
                            Informations de livraison
                        </p>

                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-mayssa-brown/70">Tu finalises par</p>
                            <div className="premium-cart-checkout__segment">
                                {(['whatsapp', 'instagram', 'snap'] as const).map((id) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => handleContactIdentityChange(id)}
                                        className={cn(
                                            'premium-cart-checkout__chip inline-flex items-center gap-1.5',
                                            orderContactIdentity === id && 'is-active',
                                        )}
                                    >
                                        {id === 'whatsapp' && <MessageCircle size={14} />}
                                        {id === 'instagram' && <Instagram size={14} />}
                                        {id === 'snap' && <SnapIcon size={14} />}
                                        {id === 'whatsapp' ? 'WhatsApp' : id === 'instagram' ? 'Instagram' : 'Snapchat'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-mayssa-brown/55 leading-relaxed">
                                {orderContactIdentity === 'whatsapp'
                                    ? 'Nom et prénom pour te recontacter.'
                                    : orderContactIdentity === 'instagram'
                                      ? 'Ton @ Instagram (pseudo du compte, pas ton nom ni prénom) — pour te retrouver en DM.'
                                      : 'Pseudo Snapchat pour t’envoyer la commande.'}
                            </p>
                        </div>

                        {orderContactIdentity === 'whatsapp' ? (
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
                        ) : (
                        <div className="space-y-1.5">
                            <div className={cn('premium-cart-checkout__field', showError('firstName') && 'is-error')}>
                                {orderContactIdentity === 'instagram' ? (
                                    <Instagram size={18} className="text-mayssa-gold flex-shrink-0" />
                                ) : (
                                    <SnapIcon size={18} className="text-mayssa-gold flex-shrink-0" />
                                )}
                                <input
                                    value={customer.firstName}
                                    onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                    onBlur={() => {
                                        markTouched('firstName')
                                        if (orderContactIdentity === 'instagram') {
                                            const n = normalizeInstagramHandle(customer.firstName)
                                            if (n !== customer.firstName) onCustomerChange({ ...customer, firstName: n })
                                        }
                                    }}
                                    placeholder={
                                        orderContactIdentity === 'instagram'
                                            ? '@pseudo Instagram *'
                                            : "Nom d'utilisateur Snapchat *"
                                    }
                                    aria-label={
                                        orderContactIdentity === 'instagram'
                                            ? "Nom d'utilisateur Instagram"
                                            : "Nom d'utilisateur Snapchat"
                                    }
                                />
                            </div>
                            {showError('firstName') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.firstName}</p>}
                        </div>
                        )}

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
                            <div className="premium-cart-checkout__field">
                                <Mail size={18} className="text-mayssa-gold flex-shrink-0" />
                                <input
                                    type="email"
                                    value={customer.email ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
                                    placeholder="Email (récap + notifs)"
                                    aria-label="Email pour récap de commande"
                                />
                            </div>
                            <p className="text-[10px] text-mayssa-brown/50 pl-4">Optionnel. Tu recevras le récap et un mail quand ta commande est validée.</p>
                        </div>
                            <div className="pt-4 border-t border-mayssa-gold/20">
                                <button type="button" onClick={() => setStep(3)} className="premium-cart-checkout__btn-primary">
                                    Suivant : Récupération →
                                </button>
                            </div>
                        </div>

                        <div className={step === 3 ? 'space-y-6 block' : 'hidden'}>
                        <p className="premium-cart-checkout__section-label border-b border-mayssa-brown/8 pb-3">
                            Mode de récupération
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: false })}
                                aria-label="Choisir retrait sur place"
                                className={cn('premium-cart-checkout__mode', !customer.wantsDelivery && 'is-active')}
                            >
                                <MapPin size={22} />
                                <span>Retrait</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: true })}
                                aria-label="Choisir livraison"
                                className={cn('premium-cart-checkout__mode', customer.wantsDelivery && 'is-active')}
                            >
                                <Truck size={22} />
                                <span>Livraison</span>
                            </button>
                        </div>

                        {customer.wantsDelivery && (
                            <div className={cn(
                                'premium-cart-checkout__panel',
                                validationErrors.address && 'border-red-300',
                            )}>
                                <AddressAutocomplete
                                    value={customer.address}
                                    onChange={(address, coordinates) => onCustomerChange({ ...customer, address, addressCoordinates: coordinates })}
                                    placeholder="Votre adresse complète..."
                                />
                                <p className="mt-3 text-[10px] text-mayssa-brown/60 leading-relaxed italic">
                                    🚗 Livraison gratuite dès {FREE_DELIVERY_THRESHOLD}€ (rayon {DELIVERY_RADIUS_KM}km).
                                </p>
                                {isAuthenticated && profile?.address && customer.address === profile.address && (
                                    <p className="mt-2 text-[10px] text-emerald-700 bg-emerald-50/80 rounded-lg px-2 py-1.5 flex items-center gap-1 border border-emerald-100">
                                        <MapPin size={10} />
                                        Adresse pré-remplie depuis votre profil
                                    </p>
                                )}
                                <div className="mt-4">
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-mayssa-brown/60 mb-2">Instructions pour le livreur</label>
                                    <input
                                        type="text"
                                        value={customer.deliveryInstructions ?? ''}
                                        onChange={(e) => onCustomerChange({ ...customer, deliveryInstructions: e.target.value })}
                                        placeholder="Code immeuble, étage, sonner 2 fois…"
                                        className="w-full rounded-2xl border border-mayssa-brown/10 bg-white/50 px-4 py-3 text-xs text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none focus:ring-1 focus:ring-mayssa-gold transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn('premium-cart-checkout__field', validationErrors.date && 'is-error')}>
                                <Calendar size={16} className="text-mayssa-gold shrink-0" aria-hidden="true" />
                                {useDateSelect ? (
                                  <select
                                    id="cart-date"
                                    value={selectableDates.includes(customer.date) ? customer.date : selectableDates[0] ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, date: e.target.value, time: '' })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none cursor-pointer"
                                    aria-label="Date de retrait ou livraison"
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
                                    aria-label="Date de retrait ou livraison"
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
                                    aria-label="Heure de retrait ou livraison"
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
                        {customer.wantsDelivery && customer.date && timeSlots.length === 0 && (
                            <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                                Plus de créneaux disponibles pour cette date en livraison. Choisissez une autre date ou heure.
                            </p>
                        )}

                        {/* Free delivery progress banner */}
                        {customer.wantsDelivery && totalAfterDiscount > 0 && totalAfterDiscount < FREE_DELIVERY_THRESHOLD && isWithinDeliveryZone && (
                            <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-mayssa-gold/10 to-mayssa-brown/5 p-4 border border-mayssa-gold/20 shadow-sm">
                                <Truck size={18} className="text-mayssa-gold flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-[11px] uppercase tracking-wider font-bold text-mayssa-brown">
                                        Plus que {(FREE_DELIVERY_THRESHOLD - totalAfterDiscount).toFixed(2).replace('.', ',')} €
                                    </p>
                                    <p className="text-[10px] text-mayssa-brown/60 mt-0.5 mb-2">pour la livraison offerte !</p>
                                    <div className="h-1.5 rounded-full bg-white/50 overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-mayssa-gold to-[#D4AF37] transition-all"
                                            style={{ width: `${Math.min(100, (totalAfterDiscount / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                            <div className="pt-4 mt-4 border-t border-mayssa-gold/20">
                                <button type="button" onClick={() => setStep(4)} className="premium-cart-checkout__btn-primary">
                                    Suivant : Validation →
                                </button>
                            </div>
                        </div>

                        <div className={step === 4 ? 'space-y-6 block' : 'hidden'}>
                        <p className="premium-cart-checkout__section-label border-b border-mayssa-brown/8 pb-3">
                            Validation
                        </p>

                        <div className="space-y-4 pt-4 mt-4 border-t border-mayssa-gold/10">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-mayssa-brown/60">Sous-total</span>
                                    <span className="font-bold text-mayssa-brown">{(total + mysteryFraiseDiscount).toFixed(2)} €</span>
                                </div>
                                {appliedPromo && appliedPromo.discount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-[#2D5A2D]">
                                        <span>Code promo ({appliedPromo.code})</span>
                                        <span className="font-bold">-{appliedPromo.discount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {mysteryFraiseDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-amber-600">
                                        <span>Réduction mystère Fraise (10 %)</span>
                                        <span className="font-bold">-{mysteryFraiseDiscount.toFixed(2)} €</span>
                                    </div>
                                )}
                                {customer.wantsDelivery && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-mayssa-brown/60">Livraison</span>
                                        <span className="font-bold text-mayssa-brown">
                                            {!customer.addressCoordinates ? 'À définir' : deliveryFee === 0 ? 'Gratuite' : `${DELIVERY_FEE.toFixed(2)} €`}
                                        </span>
                                    </div>
                                )}
                                {donationAmount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-mayssa-rose">
                                        <span>Don au projet</span>
                                        <span className="font-bold">+{donationAmount.toFixed(2)} €</span>
                                    </div>
                                )}
                                <div className="premium-cart-checkout__total">
                                    <span className="premium-cart-checkout__total-label">Total</span>
                                    <span className="premium-cart-checkout__total-value">{finalTotal.toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>

                            {/* Points & Récompenses */}
                            {isAuthenticated && profile && hasItems && (
                                <div className="space-y-3 pt-5 mt-5 border-t border-mayssa-gold/10">
                                    {/* Points à gagner */}
                                    <div className="premium-cart-checkout__loyalty">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/50 p-1.5 rounded-full shadow-inner">
                                                <Star size={16} className="text-mayssa-gold" />
                                            </div>
                                            <span className="text-sm font-medium text-mayssa-brown">
                                                Tu gagneras <span className="font-bold text-mayssa-gold">{pointsToEarn} points</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase tracking-wider text-mayssa-brown/60">Solde actuel</p>
                                            <p className="font-bold text-lg text-mayssa-gold drop-shadow-sm">{profile.loyalty.points} pts</p>
                                        </div>
                                    </div>

                                    {/* Récompenses disponibles */}
                                    {availableRewards.length > 0 && (
                                        <div className="space-y-3 mt-4">
                                            <p className="text-xs uppercase tracking-widest font-bold text-mayssa-brown/60">
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
                                                            <span className="text-[11px] font-medium text-mayssa-brown/60">{cost} pts</span>
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
                                            Gagne {pointsToEarn} points avec cette commande !
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-mayssa-brown/60 leading-relaxed mb-3">
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
                                <p className="text-[10px] uppercase tracking-widest text-mayssa-brown/50 text-center font-bold flex items-center justify-center gap-1.5 mb-2">
                                    <MessageCircle size={14} className="text-mayssa-gold" />
                                    Finaliser la commande
                                </p>
                                <div className="premium-cart-checkout__panel max-w-md mx-auto text-[10px] text-mayssa-brown/70 space-y-2">
                                    <p className="font-bold text-[11px] text-mayssa-brown uppercase tracking-wider border-b border-mayssa-brown/5 pb-2 mb-3">
                                        Parcours Maison Mayssa
                                    </p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">1.</span> je remplis mon panier sur le site.</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">2.</span> j&apos;envoie ma commande sur WhatsApp (ou Insta/Snap).</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">3.</span> Maison Mayssa me confirme la commande et l&apos;heure.</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">4.</span> je règle à la livraison/retrait ou par PayPal.</p>
                                </div>

                                {hasNonTrompeLoeil && isClassicPreorderPhase && (
                                    <p className="premium-cart-checkout__notice text-mayssa-brown">
                                        Précommandes — récupération à partir du <span className="font-bold text-mayssa-gold">{FIRST_PICKUP_DATE_CLASSIC_LABEL}</span>.
                                    </p>
                                )}
                                {orderCutoffPassed && hasNonTrompeLoeil && (
                                    <p className="premium-cart-checkout__notice is-warning">
                                        Commandes (pâtisseries, cookies…) possibles jusqu&apos;à 17h. Les précommandes trompe-l&apos;œil restent disponibles.
                                    </p>
                                )}
                                {trompeLoeilBeforeMinDate && (
                                    <p className="premium-cart-checkout__notice is-warning">
                                        Les précommandes trompe l&apos;œil sont possibles à partir du {formatDateLabel(minDate)}.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={onSend}
                                    disabled={!canSend}
                                    aria-label="Envoyer la commande sur WhatsApp"
                                    className="premium-cart-checkout__btn-primary premium-cart-checkout__btn-whatsapp"
                                >
                                    <MessageCircle size={20} />
                                    <span>{hasItems ? (canSend ? 'WhatsApp' : ordersOpen === false ? 'Fermé' : trompeLoeilBeforeMinDate ? `Dès le ${formatDateLabel(minDate)}` : orderCutoffPassed && hasNonTrompeLoeil ? 'Jusqu\'à 17h' : 'Vérifier Formulaire') : 'Panier Vide'}</span>
                                </button>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onSendInstagram}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Instagram"
                                        className="premium-cart-checkout__btn-primary premium-cart-checkout__btn-instagram"
                                    >
                                        <Instagram size={18} />
                                        <span>Insta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSendSnap}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Snapchat"
                                        className="premium-cart-checkout__btn-primary premium-cart-checkout__btn-snap"
                                    >
                                        <SnapIcon size={18} />
                                        <span>Snap</span>
                                    </button>
                                </div>
                                </>
                                )}
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
