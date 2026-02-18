import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, User, Phone, Mail, MapPin, Truck, Calendar, Clock, Star, Gift, Instagram, Tag, Heart } from 'lucide-react'
import { SnapIcon } from './SnapIcon'
import type { CartItem, CustomerInfo } from '../types'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate } from '../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY } from '../constants'
import { ReservationTimer } from './ReservationTimer'
import { useAuth } from '../hooks/useAuth'
import { REWARD_COSTS, REWARD_LABELS } from '../lib/rewards'
import { useEffect, useMemo, useState } from 'react'
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

export type DeliverySlotsMap = Record<string, Record<string, number>>

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
    /** Date maximum (définie par l'admin). Optionnel. */
    maxDate?: string
    /** Jours de la semaine autorisés (0=dim…6=sam). Si défini, le client ne peut choisir que ces jours. */
    availableWeekdays?: number[]
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
    maxDate: maxDateProp,
    availableWeekdays,
    retraitTimeSlots,
    livraisonTimeSlots,
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

    const minDate = minDateProp && minDateProp.trim() ? minDateProp : getMinDate()
    const maxDate = maxDateProp && maxDateProp.trim() ? maxDateProp : undefined
    const selectableDates = useMemo(
      () => getSelectableDates(minDate, maxDate, availableWeekdays),
      [minDate, maxDate, availableWeekdays],
    )
    const useDateSelect = selectableDates.length > 0

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
    const orderCutoffPassed = !isBeforeOrderCutoff()
    const isClassicPreorderPhase = isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)
    const canSend =
      hasItems &&
      isCustomerValid &&
      (!hasNonTrompeLoeil || !orderCutoffPassed)

    return (
        <div className="flex flex-col min-w-0 w-full overflow-hidden section-shell bg-white/95 !p-4 sm:!p-8 md:!p-10 premium-shadow">
            <header className="flex items-center justify-between flex-shrink-0 pb-6 border-b border-mayssa-brown/5">
                <div className="flex items-center gap-3 text-mayssa-brown text-glow">
                    <div className="relative">
                        <ShoppingBag size={24} className="sm:w-8 sm:h-8" />
                        {itemCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-mayssa-caramel text-[10px] sm:text-[11px] font-bold text-white shadow-lg ring-2 ring-white">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold">Votre Panier</h2>
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
                                            className="group flex items-center gap-4 rounded-3xl bg-mayssa-soft/50 p-3 sm:p-4 ring-1 ring-mayssa-brown/5 transition-all hover:bg-white hover:ring-mayssa-caramel/20 active:shadow-md"
                                        >
                                            {item.product.image && (
                                                <div className="h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-sm flex-shrink-0">
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
                                                    <p className="text-sm font-bold text-mayssa-caramel">
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
                                                <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1 shadow-sm border border-mayssa-brown/5">
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                                        aria-label={`Réduire ${item.product.name}`}
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95 cursor-pointer"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-6 text-center text-xs font-bold text-mayssa-brown">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                                        aria-label={`Ajouter ${item.product.name}`}
                                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95 cursor-pointer"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-mayssa-brown/30 bg-mayssa-soft/30 rounded-[2.5rem] border border-dashed border-mayssa-brown/10">
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
                            placeholder="Allergies, une occasion spéciale, ou une demande particulière pour votre livraison ?"
                            className="w-full min-h-[120px] resize-none rounded-[2rem] bg-white p-5 text-sm md:text-base text-mayssa-brown ring-1 ring-mayssa-brown/10 focus:ring-2 focus:ring-mayssa-caramel transition-all premium-shadow"
                        />
                    </div>
                </div>

                {/* Right Column: Info & Totals */}
                <div className="space-y-8 lg:sticky lg:top-24 lg:self-start min-w-0">
                    <div className="space-y-6 bg-mayssa-soft/50 p-6 sm:p-8 rounded-[2.5rem] border border-mayssa-brown/5">
                        {/* Code promo */}
                        {setPromoCodeInput != null && onApplyPromo != null && onClearPromo != null && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">Code promo</p>
                                {appliedPromo ? (
                                    <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                                        <span className="text-sm font-semibold text-emerald-800">
                                            <Tag size={14} className="inline mr-1.5" />
                                            {appliedPromo.code} : -{appliedPromo.discount.toFixed(2).replace('.', ',')} €
                                        </span>
                                        <button
                                            type="button"
                                            onClick={onClearPromo}
                                            aria-label="Retirer le code promo"
                                            className="text-xs font-medium text-emerald-700 hover:underline"
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
                                            className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-mayssa-brown/10 focus:ring-2 focus:ring-mayssa-caramel"
                                        />
                                        <button
                                            type="button"
                                            onClick={onApplyPromo}
                                            disabled={!promoCodeInput.trim()}
                                            aria-label="Appliquer le code promo"
                                            className="rounded-2xl bg-mayssa-caramel px-4 py-3 text-sm font-bold text-white hover:bg-mayssa-brown disabled:opacity-50 cursor-pointer"
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
                                    "flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition-all shadow-sm",
                                    showError('firstName') ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5 focus-within:ring-mayssa-caramel"
                                )}>
                                    <User size={18} className="text-mayssa-caramel flex-shrink-0" />
                                    <input
                                        value={customer.firstName}
                                        onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                        onBlur={() => markTouched('firstName')}
                                        placeholder="Prénom *"
                                        aria-label="Prénom"
                                        className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                    />
                                </div>
                                {showError('firstName') && <p className="text-[10px] text-red-400 pl-4">{validationErrors.firstName}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <div className={cn(
                                    "flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition-all shadow-sm",
                                    showError('lastName') ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5 focus-within:ring-mayssa-caramel"
                                )}>
                                    <User size={18} className="text-mayssa-caramel flex-shrink-0" />
                                    <input
                                        value={customer.lastName}
                                        onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                                        onBlur={() => markTouched('lastName')}
                                        placeholder="Nom *"
                                        aria-label="Nom"
                                        className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                                    />
                                </div>
                                {showError('lastName') && <p className="text-[10px] text-red-400 pl-4">{validationErrors.lastName}</p>}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className={cn(
                                "flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 transition-all shadow-sm",
                                showError('phone') ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5 focus-within:ring-mayssa-caramel"
                            )}>
                                <Phone size={18} className="text-mayssa-caramel flex-shrink-0" />
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
                            {showError('phone') && <p className="text-[10px] text-red-400 pl-4">{validationErrors.phone}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-mayssa-brown/5 focus-within:ring-mayssa-caramel shadow-sm">
                                <Mail size={18} className="text-mayssa-caramel flex-shrink-0" />
                                <input
                                    type="email"
                                    value={customer.email ?? ''}
                                    onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
                                    placeholder="Email (pour recevoir le récap et les notifications)"
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
                                    "flex flex-col items-center gap-2 rounded-2xl py-4 transition-all shadow-sm cursor-pointer",
                                    !customer.wantsDelivery ? "bg-mayssa-brown text-white ring-2 ring-mayssa-caramel shadow-xl -translate-y-1" : "bg-white text-mayssa-brown border border-mayssa-brown/10 hover:bg-mayssa-rose/10"
                                )}
                            >
                                <MapPin size={22} />
                                <span className="text-xs font-bold uppercase tracking-wide">Retrait</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: true })}
                                aria-label="Choisir livraison"
                                className={cn(
                                    "flex flex-col items-center gap-2 rounded-2xl py-4 transition-all shadow-sm cursor-pointer",
                                    customer.wantsDelivery ? "bg-mayssa-caramel text-white ring-2 ring-mayssa-brown shadow-xl -translate-y-1" : "bg-white text-mayssa-brown border border-mayssa-brown/10 hover:bg-mayssa-rose/10"
                                )}
                            >
                                <Truck size={22} />
                                <span className="text-xs font-bold uppercase tracking-wide">Livraison</span>
                            </button>
                        </div>

                        {customer.wantsDelivery && (
                            <div className={cn(
                                "rounded-2xl bg-white p-4 transition-all shadow-inner",
                                validationErrors.address ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-caramel/20"
                            )}>
                                <AddressAutocomplete
                                    value={customer.address}
                                    onChange={(address, coordinates) => onCustomerChange({ ...customer, address, addressCoordinates: coordinates })}
                                    placeholder="Votre adresse complète..."
                                />
                                <p className="mt-3 text-[10px] text-mayssa-brown/50 leading-relaxed italic">
                                    🚗 Livraison gratuite dès {FREE_DELIVERY_THRESHOLD}€ (rayon de {DELIVERY_RADIUS_KM}km).
                                </p>
                                {isAuthenticated && profile?.address && customer.address === profile.address && (
                                    <p className="mt-2 text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 flex items-center gap-1">
                                        <MapPin size={10} />
                                        Adresse pré-remplie depuis votre profil
                                    </p>
                                )}
                                <div className="mt-3">
                                    <label className="block text-[10px] font-medium text-mayssa-brown/70 mb-1">Instructions pour le livreur</label>
                                    <input
                                        type="text"
                                        value={customer.deliveryInstructions ?? ''}
                                        onChange={(e) => onCustomerChange({ ...customer, deliveryInstructions: e.target.value })}
                                        placeholder="Code immeuble, étage, sonner 2 fois…"
                                        className="w-full rounded-xl border border-mayssa-brown/10 bg-white px-3 py-2 text-xs text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel/30"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn(
                                "flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm transition-all",
                                validationErrors.date ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5"
                            )}>
                                <Calendar size={16} className="text-mayssa-caramel" aria-hidden="true" />
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
                                "flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm transition-all",
                                validationErrors.time ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5"
                            )}>
                                <Clock size={16} className="text-mayssa-caramel" aria-hidden="true" />
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
                            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                                Plus de créneaux disponibles pour cette date. Choisissez une autre date.
                            </p>
                        )}

                        {/* Free delivery progress banner */}
                        {customer.wantsDelivery && totalAfterDiscount > 0 && totalAfterDiscount < FREE_DELIVERY_THRESHOLD && isWithinDeliveryZone && (
                            <div className="flex items-center gap-3 rounded-2xl bg-mayssa-caramel/10 p-3">
                                <Truck size={16} className="text-mayssa-caramel flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-mayssa-caramel">
                                        Plus que {(FREE_DELIVERY_THRESHOLD - totalAfterDiscount).toFixed(2).replace('.', ',')} € pour la livraison offerte !
                                    </p>
                                    <div className="mt-1.5 h-1.5 rounded-full bg-mayssa-brown/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-mayssa-caramel transition-all"
                                            style={{ width: `${Math.min(100, (totalAfterDiscount / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-6 border-t border-mayssa-brown/10">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-mayssa-brown/60">Sous-total</span>
                                    <span className="font-bold text-mayssa-brown">{(total + mysteryFraiseDiscount).toFixed(2)} €</span>
                                </div>
                                {appliedPromo && appliedPromo.discount > 0 && (
                                    <div className="flex items-center justify-between text-sm text-emerald-600">
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
                                <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-mayssa-brown/10">
                                    <span className="text-lg font-bold text-mayssa-brown">Total estimé</span>
                                    <span className="text-3xl font-display font-bold text-mayssa-caramel">{finalTotal.toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>

                            {/* Points & Récompenses */}
                            {isAuthenticated && profile && hasItems && (
                                <div className="space-y-3 pt-4 border-t border-mayssa-brown/10">
                                    {/* Points à gagner */}
                                    <div className="flex items-center justify-between bg-mayssa-caramel/10 rounded-xl p-3">
                                        <div className="flex items-center gap-2">
                                            <Star size={16} className="text-mayssa-caramel" />
                                            <span className="text-sm font-medium text-mayssa-brown">
                                                Tu gagneras <span className="font-bold">{pointsToEarn} points</span>
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-mayssa-brown/60">Solde actuel</p>
                                            <p className="font-bold text-mayssa-caramel">{profile.loyalty.points} pts</p>
                                        </div>
                                    </div>

                                    {/* Récompenses disponibles */}
                                    {availableRewards.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-mayssa-brown/80">
                                                Récompenses disponibles :
                                            </p>
                                            <div className="grid gap-2">
                                                {availableRewards.slice(0, 2).map(([rewardType, cost]) => (
                                                    <div
                                                        key={rewardType}
                                                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                                            selectedReward?.type === rewardType
                                                                ? 'border-mayssa-caramel bg-mayssa-caramel/10'
                                                                : 'border-mayssa-brown/20 bg-mayssa-soft/50 hover:border-mayssa-caramel/50'
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
                                                        <div className="flex items-center gap-2">
                                                            <Gift size={14} className="text-mayssa-caramel" />
                                                            <span className="text-xs font-medium text-mayssa-brown">
                                                                {REWARD_LABELS[rewardType as keyof typeof REWARD_LABELS]}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-mayssa-brown/60">{cost} pts</span>
                                                            {selectedReward?.type === rewardType && (
                                                                <div className="w-4 h-4 rounded-full bg-mayssa-caramel flex items-center justify-center">
                                                                    <span className="text-white text-[8px]">✓</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedReward && (
                                                <p className="text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg p-2 text-center">
                                                    🎁 {REWARD_LABELS[selectedReward.type]} sera ajouté à ta commande
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
                                        <Star size={16} className="text-mayssa-caramel" />
                                        <span className="text-sm font-bold text-mayssa-brown">
                                            Gagne {pointsToEarn} points avec cette commande !
                                        </span>
                                    </div>
                                    <p className="text-xs text-mayssa-brown/70 mb-2">
                                        Crée ton compte pour accumuler des points et débloquer des récompenses gratuites.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={onAccountClick}
                                        aria-label="Ouvrir mon compte"
                                        className="w-full py-2 px-3 bg-mayssa-caramel text-white rounded-xl text-xs font-bold hover:bg-mayssa-brown transition-colors"
                                    >
                                        Créer mon compte (+15 pts bonus)
                                    </button>
                                </div>
                            )}

                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] text-mayssa-brown/60 text-center font-medium flex items-center justify-center gap-1.5">
                                    <MessageCircle size={14} />
                                    Envoyez votre commande via WhatsApp, Instagram ou Snapchat.
                                </p>

                                {hasNonTrompeLoeil && isClassicPreorderPhase && (
                                    <p className="text-xs text-mayssa-brown/80 text-center bg-mayssa-cream/80 rounded-xl px-3 py-2 border border-mayssa-caramel/30">
                                        Précommandes — récupération à partir du {FIRST_PICKUP_DATE_CLASSIC_LABEL}.
                                    </p>
                                )}
                                {orderCutoffPassed && hasNonTrompeLoeil && (
                                    <p className="text-xs text-amber-700 text-center bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                                        Commandes (pâtisseries, cookies…) possibles jusqu&apos;à 23h. Les précommandes trompe-l&apos;œil restent disponibles.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={onSend}
                                    disabled={!canSend}
                                    aria-label="Envoyer la commande sur WhatsApp"
                                    className="w-full flex items-center justify-center gap-3 rounded-[2rem] bg-[#25D366] text-white py-5 text-base font-bold shadow-2xl transition-all hover:bg-[#20bd5a] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 cursor-pointer"
                                >
                                    <MessageCircle size={24} />
                                    <span>{hasItems ? (canSend ? 'Envoyer sur WhatsApp' : orderCutoffPassed && hasNonTrompeLoeil ? 'Commandes jusqu\'à 23h' : 'Vérifiez le formulaire') : 'Votre panier est vide'}</span>
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={onSendInstagram}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Instagram"
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white py-4 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 cursor-pointer"
                                    >
                                        <Instagram size={20} />
                                        <span>Instagram</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onSendSnap}
                                        disabled={!canSend}
                                        aria-label="Envoyer la commande sur Snapchat"
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FFFC00] text-black py-4 text-sm font-bold shadow-lg transition-all hover:scale-[1.02] hover:brightness-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 cursor-pointer"
                                    >
                                        <SnapIcon size={20} />
                                        <span>Snapchat</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
