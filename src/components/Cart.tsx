import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, User, Phone, Mail, MapPin, Truck, Calendar, Clock, Star, Gift, Instagram, Tag, Heart } from 'lucide-react'
import { SnapIcon } from './SnapIcon'
import type { CartItem, CustomerInfo } from '../types'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate } from '../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY } from '../constants'
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
    /** Si défini, le client a déjà passé une commande récente → on bloque */
    pendingOrder?: { orderNumber?: number; placedAt: number } | null
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
}: CartProps) {
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

    const validationErrors = useMemo(() => validateCustomer(customer), [customer])
    // Show error only for fields the user has interacted with
    const showError = (field: keyof typeof customer) =>
        touched[field] && validationErrors[field as keyof CustomerInfo]

    const isCustomerValid = Object.keys(validationErrors).length === 0
    const hasNonTrompeLoeil = items.some((item) => item.product.category !== "Trompe l'oeil")
    const hasTrompeLoeil = items.some((item) => item.product.category === "Trompe l'oeil")
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

    return (
        <div className="flex flex-col min-w-0 w-full overflow-hidden section-shell bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] !p-4 sm:!p-8 md:!p-10 rounded-[2.5rem]">
            <header className="flex items-center justify-between flex-shrink-0 pb-6 border-b border-mayssa-gold/10">
                <div className="flex items-center gap-3 text-mayssa-brown">
                    <div className="relative">
                        <ShoppingBag size={24} className="sm:w-8 sm:h-8" strokeWidth={1.5} />
                        {itemCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-mayssa-gold text-[10px] sm:text-[11px] font-bold text-white shadow-lg ring-2 ring-white">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-display font-medium tracking-tight">Votre Panier</h2>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] lg:items-start gap-8 lg:gap-12 mt-8">
                {/* Left Column: Items & Notes */}
                <div className="space-y-8 min-w-0">
                    <div className="space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            Articles sélectionnés ({itemCount})
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
                                            className="group flex items-center gap-4 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 p-3 sm:p-4 shadow-sm hover:shadow-lg transition-all"
                                        >
                                            {item.product.image && (
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-sm flex-shrink-0 ring-1 ring-mayssa-gold/30">
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
                                                    <h3 className="truncate text-sm sm:text-base font-bold text-mayssa-brown flex-1">
                                                        {item.product.name}
                                                    </h3>
                                                </div>
                                                {item.product.description && (
                                                    <p className="text-[10px] sm:text-xs text-mayssa-brown/60 mt-0.5 line-clamp-2 leading-relaxed">
                                                        {item.product.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <p className="text-xs text-mayssa-brown/60">
                                                        {item.product.price.toFixed(2).replace('.', ',')} €
                                                    </p>
                                                    <p className="text-sm font-bold text-mayssa-gold">
                                                        = {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
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
                                                <div className="flex items-center gap-1.5 rounded-2xl bg-white/80 backdrop-blur-md p-1 shadow-sm border border-mayssa-gold/20">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                                        aria-label={`Réduire ${item.product.name}`}
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-brown hover:text-mayssa-gold hover:scale-110 active:scale-95 cursor-pointer"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold text-mayssa-brown">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                                        aria-label={`Ajouter ${item.product.name}`}
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-brown hover:text-mayssa-gold hover:scale-110 active:scale-95 cursor-pointer"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-mayssa-brown/40 bg-white/40 backdrop-blur-lg rounded-[2.5rem] border border-dashed border-mayssa-brown/20 shadow-inner">
                                    <ShoppingBag size={48} className="opacity-20" />
                                    <p className="text-base font-medium">Votre panier est vide</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 block">
                            Instructions particulières
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="Allergies ou instructions livraison"
                            className="w-full min-h-[120px] resize-none rounded-[2rem] bg-white/60 backdrop-blur-xl p-5 text-sm md:text-base text-mayssa-brown border border-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.02)] focus:outline-none focus:ring-1 focus:ring-mayssa-gold/50 transition-all placeholder:text-mayssa-brown/40"
                        />
                    </div>
                </div>

                {/* Right Column: Info & Totals */}
                <div className="space-y-8 lg:sticky lg:top-24 lg:self-start min-w-0">
                    <div className="space-y-6 bg-white/80 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] border border-mayssa-gold/20 shadow-[0_10px_40px_rgba(212,175,55,0.05)]">
                        {/* Code promo */}
                        {setPromoCodeInput != null && onApplyPromo != null && onClearPromo != null && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">Code promo</p>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#E8F3E8] border border-[#A3C7A3] px-4 py-3">
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
                                        <input
                                            type="text"
                                            value={promoCodeInput}
                                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                                            placeholder="Code promo"
                                            className="flex-1 rounded-2xl bg-white/60 backdrop-blur-md px-4 py-3 text-sm border border-mayssa-brown/10 focus:outline-none focus:ring-1 focus:ring-mayssa-gold shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
                                        />
                                        <button
                                            type="button"
                                            onClick={onApplyPromo}
                                            disabled={!promoCodeInput.trim()}
                                            aria-label="Appliquer le code promo"
                                            className="rounded-2xl bg-mayssa-brown px-4 py-3 text-sm font-bold text-mayssa-gold hover:bg-mayssa-brown/90 shadow-lg disabled:opacity-50 cursor-pointer transition-all border border-mayssa-gold/20"
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
                                <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">Code parrain</p>
                                <p className="text-[10px] text-mayssa-brown/60">Un ami t&apos;a parrainé ? Saisis son code pour avoir -5 € sur ta 1ère commande.</p>
                                <input
                                    type="text"
                                    value={referralCodeInput}
                                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                    placeholder="ex. MAYSSA-ABC1"
                                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-mayssa-brown/10 focus:ring-2 focus:ring-mayssa-caramel"
                                />
                            </div>
                        )}

                        {/* Soutien au projet */}
                        {setDonationAmount != null && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 flex items-center gap-1.5">
                                    <Heart size={12} /> Soutenir le projet
                                </p>
                                <p className="text-[10px] text-mayssa-brown/60">Montant libre (optionnel)</p>
                                <div className="flex flex-wrap gap-2">
                                    {[2, 5, 10, 15].map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setDonationAmount(donationAmount === amount ? 0 : amount)}
                                            aria-label={donationAmount === amount ? `Retirer le don de ${amount} €` : `Ajouter un don de ${amount} €`}
                                            className={cn(
                                                'rounded-xl px-3 py-2 text-sm font-bold transition-all',
                                                donationAmount === amount
                                                    ? 'bg-mayssa-rose text-white ring-2 ring-mayssa-brown/20'
                                                    : 'bg-white text-mayssa-brown ring-1 ring-mayssa-brown/10 hover:ring-mayssa-caramel'
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

                        <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60 border-b border-mayssa-brown/5 pb-3">
                            Informations de livraison
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className={cn(
                                    "flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-md px-4 py-3.5 transition-all shadow-sm border",
                                    showError('firstName') ? "border-red-300 ring-1 ring-red-300" : "border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold"
                                )}>
                                    <User size={18} className="text-mayssa-gold flex-shrink-0" />
                                    <input
                                        value={customer.firstName}
                                        onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                        onBlur={() => markTouched('firstName')}
                                        placeholder="Prénom *"
                                        aria-label="Prénom"
                                        className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                    />
                                </div>
                                {showError('firstName') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.firstName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <div className={cn(
                                    "flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-md px-4 py-3.5 transition-all shadow-sm border",
                                    showError('lastName') ? "border-red-300 ring-1 ring-red-300" : "border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold"
                                )}>
                                    <User size={18} className="text-mayssa-gold flex-shrink-0" />
                                    <input
                                        value={customer.lastName}
                                        onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                                        onBlur={() => markTouched('lastName')}
                                        placeholder="Nom *"
                                        aria-label="Nom"
                                        className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                    />
                                </div>
                                {showError('lastName') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className={cn(
                                "flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-md px-4 py-3.5 transition-all shadow-sm border",
                                showError('phone') ? "border-red-300 ring-1 ring-red-300" : "border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold"
                            )}>
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
                                    className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                />
                            </div>
                            {showError('phone') && <p className="text-[10px] text-red-500 pl-4">{validationErrors.phone}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3 rounded-2xl bg-white/60 backdrop-blur-md px-4 py-3.5 border border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold shadow-sm transition-all">
                                <Mail size={18} className="text-mayssa-gold flex-shrink-0" />
                                <input
                                    type="email"
                                    value={customer.email ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
                                    placeholder="Email (récap + notifs)"
                                    aria-label="Email pour récap de commande"
                                    className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                />
                            </div>
                            <p className="text-[10px] text-mayssa-brown/50 pl-4">Optionnel. Tu recevras le récap et un mail quand ta commande est validée.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: false })}
                                aria-label="Choisir retrait sur place"
                                className={cn(
                                    "flex flex-col items-center gap-2 rounded-[1.5rem] py-4 transition-all cursor-pointer backdrop-blur-md",
                                    !customer.wantsDelivery ? "bg-mayssa-brown text-mayssa-gold border border-mayssa-gold/30 shadow-lg -translate-y-1" : "bg-white/50 text-mayssa-brown border border-mayssa-brown/10 hover:bg-white/80"
                                )}
                            >
                                <MapPin size={22} className={!customer.wantsDelivery ? "text-mayssa-gold" : "text-mayssa-brown"} />
                                <span className="text-xs font-bold uppercase tracking-wide">Retrait</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: true })}
                                aria-label="Choisir livraison"
                                className={cn(
                                    "flex flex-col items-center gap-2 rounded-[1.5rem] py-4 transition-all cursor-pointer backdrop-blur-md",
                                    customer.wantsDelivery ? "bg-mayssa-brown text-mayssa-gold border border-mayssa-gold/30 shadow-lg -translate-y-1" : "bg-white/50 text-mayssa-brown border border-mayssa-brown/10 hover:bg-white/80"
                                )}
                            >
                                <Truck size={22} className={customer.wantsDelivery ? "text-mayssa-gold" : "text-mayssa-brown"} />
                                <span className="text-xs font-bold uppercase tracking-wide">Livraison</span>
                            </button>
                        </div>

                        {customer.wantsDelivery && (
                            <div className={cn(
                                "rounded-3xl bg-white/60 backdrop-blur-xl p-5 transition-all shadow-inner border",
                                validationErrors.address ? "border-red-300 ring-1 ring-red-300" : "border-white"
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
                            <div className={cn(
                                "flex items-center gap-2 rounded-2xl bg-white/60 backdrop-blur-md px-3 py-3 shadow-sm transition-all border",
                                validationErrors.date ? "border-red-300 ring-1 ring-red-300" : "border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold"
                            )}>
                                <Calendar size={16} className="text-mayssa-gold" aria-hidden="true" />
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
                            <div className={cn(
                                "flex items-center gap-2 rounded-2xl bg-white/60 backdrop-blur-md px-3 py-3 shadow-sm transition-all border",
                                validationErrors.time ? "border-red-300 ring-1 ring-red-300" : "border-mayssa-brown/10 focus-within:ring-1 focus-within:ring-mayssa-gold focus-within:border-mayssa-gold"
                            )}>
                                <Clock size={16} className="text-mayssa-gold" aria-hidden="true" />
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

                        <div className="space-y-4 pt-6 mt-6 border-t border-mayssa-gold/10">
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
                                <div className="flex items-center justify-between pt-4 mt-2 border-t border-mayssa-gold/10">
                                    <span className="text-lg font-bold text-mayssa-brown uppercase tracking-wider">Total</span>
                                    <span className="text-4xl font-display font-medium text-mayssa-gold drop-shadow-sm">{finalTotal.toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>

                            {/* Points & Récompenses */}
                            {isAuthenticated && profile && hasItems && (
                                <div className="space-y-3 pt-5 mt-5 border-t border-mayssa-gold/10">
                                    {/* Points à gagner */}
                                    <div className="flex items-center justify-between bg-gradient-to-r from-mayssa-gold/10 to-transparent border border-mayssa-gold/20 rounded-2xl p-4 shadow-sm backdrop-blur-md">
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
                                                        className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm backdrop-blur-sm ${
                                                            selectedReward?.type === rewardType
                                                                ? 'border-mayssa-gold bg-mayssa-gold/5 shadow-[0_4px_12px_rgba(212,175,55,0.1)]'
                                                                : 'border-mayssa-brown/10 bg-white/40 hover:border-mayssa-gold/30 hover:bg-white/60'
                                                        }`}
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
                                <div className="bg-gradient-to-r from-white/90 to-mayssa-gold/5 rounded-2xl p-4 border border-mayssa-gold/20 shadow-sm backdrop-blur-md">
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
                                    /* ── Blocage double-commande ── */
                                    <div className="max-w-md mx-auto rounded-3xl bg-[#E8F3E8] border border-[#A3C7A3] p-6 text-center space-y-4 shadow-xl backdrop-blur-md">
                                        <div className="text-5xl drop-shadow-md">✨</div>
                                        <div className="space-y-1.5">
                                            <p className="text-base font-bold text-[#2D5A2D] uppercase tracking-widest">
                                                Commande validée{pendingOrder.orderNumber ? ` (n°${pendingOrder.orderNumber})` : ''} !
                                            </p>
                                            <p className="text-xs text-[#2D5A2D]/80 leading-relaxed max-w-[250px] mx-auto">
                                                Nous avons bien reçu votre commande et elle est en cours de traitement. Nous vous recontacterons rapidement pour confirmer.
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-[#2D5A2D]/50 italic">
                                            Ce message disparaîtra dans 48 h.
                                        </p>
                                    </div>
                                ) : (
                                <>
                                <p className="text-[10px] uppercase tracking-widest text-mayssa-brown/50 text-center font-bold flex items-center justify-center gap-1.5 mb-2">
                                    <MessageCircle size={14} className="text-mayssa-gold" />
                                    Finaliser la commande
                                </p>
                                <div className="max-w-md mx-auto rounded-3xl bg-white/40 border border-white/60 p-5 text-[10px] text-mayssa-brown/70 space-y-2 backdrop-blur-md shadow-sm">
                                    <p className="font-bold text-[11px] text-mayssa-brown uppercase tracking-wider border-b border-mayssa-brown/5 pb-2 mb-3">
                                        Parcours Maison Mayssa
                                    </p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">1.</span> je remplis mon panier sur le site.</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">2.</span> j&apos;envoie ma commande sur WhatsApp (ou Insta/Snap).</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">3.</span> Maison Mayssa me confirme la commande et l&apos;heure.</p>
                                    <p className="flex items-start gap-2"><span className="font-bold text-mayssa-gold">4.</span> je règle à la livraison/retrait ou par PayPal.</p>
                                </div>

                                {hasNonTrompeLoeil && isClassicPreorderPhase && (
                                    <p className="text-[11px] text-mayssa-brown text-center bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-mayssa-gold/20 shadow-sm">
                                        Précommandes — récupération à partir du <span className="font-bold text-mayssa-gold">{FIRST_PICKUP_DATE_CLASSIC_LABEL}</span>.
                                    </p>
                                )}
                                {orderCutoffPassed && hasNonTrompeLoeil && (
                                    <p className="text-[11px] text-amber-800 text-center bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200/50 shadow-sm">
                                        Commandes (pâtisseries, cookies…) possibles jusqu&apos;à 17h. Les précommandes trompe-l&apos;œil restent disponibles.
                                    </p>
                                )}
                                {trompeLoeilBeforeMinDate && (
                                    <p className="text-[11px] text-amber-800 text-center bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200/50 shadow-sm">
                                        Les précommandes trompe l&apos;œil sont possibles à partir du {formatDateLabel(minDate)}.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={onSend}
                                    disabled={!canSend}
                                    aria-label="Envoyer la commande sur WhatsApp"
                                    className="relative w-full overflow-hidden flex items-center justify-center gap-3 rounded-[2rem] bg-[#25D366] text-white py-5 text-sm uppercase tracking-widest font-bold shadow-xl transition-all hover:bg-[#20bd5a] hover:scale-[1.02] hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:shadow-none cursor-pointer group"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 rounded-[2rem]" />
                                    <MessageCircle size={22} className="relative z-10" />
                                    <span className="relative z-10 drop-shadow-sm">{hasItems ? (canSend ? 'WhatsApp' : ordersOpen === false ? 'Fermé' : trompeLoeilBeforeMinDate ? `Dès le ${formatDateLabel(minDate)}` : orderCutoffPassed && hasNonTrompeLoeil ? 'Jusqu\'à 17h' : 'Vérifier Formulaire') : 'Panier Vide'}</span>
                                </button>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onSendInstagram}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Instagram"
                                        className="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white py-4 text-xs font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:shadow-none cursor-pointer group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 rounded-[1.5rem]" />
                                        <Instagram size={18} className="relative z-10" />
                                        <span className="relative z-10 drop-shadow-sm">Insta</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSendSnap}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Snapchat"
                                        className="relative overflow-hidden w-full flex items-center justify-center gap-2 rounded-[1.5rem] bg-[#FFFC00] text-black py-4 text-xs font-bold uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] hover:brightness-105 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 disabled:shadow-none cursor-pointer group"
                                    >
                                        <div className="absolute inset-0 bg-white/50 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 rounded-[1.5rem]" />
                                        <SnapIcon size={18} className="relative z-10" />
                                        <span className="relative z-10 font-black">Snap</span>
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
    )
}
