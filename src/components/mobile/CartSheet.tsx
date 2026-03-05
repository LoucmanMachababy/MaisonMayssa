import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, User, Phone, Mail, MapPin, Truck, Calendar, Clock, Star, Gift, Instagram, Tag, Heart } from 'lucide-react'
import { SnapIcon } from '../SnapIcon'
import { hapticFeedback } from '../../lib/haptics'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate } from '../../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL, DELIVERY_SLOT_MAX_CAPACITY } from '../../constants'
import { AddressAutocomplete } from '../AddressAutocomplete'
import { ReservationTimer } from '../ReservationTimer'
import { useAuth } from '../../hooks/useAuth'
import { useFocusTrap } from '../../hooks/useAccessibility'
import { REWARD_COSTS, REWARD_LABELS } from '../../lib/rewards'
import type { CartItem, CustomerInfo } from '../../types'
import type { DeliverySlotsMap } from '../../lib/firebase'
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
  onSend: () => void
  onSendInstagram: () => void
  onSendSnap: () => void
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
}

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
}: CartSheetProps) {
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasItems = items.length > 0
  const { isAuthenticated, profile } = useAuth()

  useFocusTrap(sheetRef, isOpen, onClose)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Touched state for real-time validation
  const [touched, setTouched] = useState<Partial<Record<keyof typeof customer, boolean>>>({})
  const markTouched = (field: keyof typeof customer) =>
    setTouched(prev => ({ ...prev, [field]: true }))

  // Distance calculation
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
    // Même jour → vérifier l'heure
    const [h, m] = (preorderOpenTime ?? '00:00').split(':').map(Number)
    return now.getHours() * 60 + now.getMinutes() >= (h ?? 0) * 60 + (m ?? 0)
  }, [preorderOpenDate, preorderOpenTime])
  const selectableDates = useMemo(
    () => getSelectableDates(minDate, maxDate, availableWeekdays, pickupDates, preorderIsOpen),
    [minDate, maxDate, availableWeekdays, pickupDates, preorderIsOpen],
  )
  // Si des dates de récupération sont configurées mais les précommandes pas encore ouvertes → bloquer
  const pickupDatesMode = !!(pickupDates && pickupDates.length > 0)
  const useDateSelect = selectableDates.length > 0
  // Message d'attente : afficher quand les précommandes sont configurées mais pas encore ouvertes
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

  const validationErrors = useMemo(() => validateCustomer(customer), [customer])
  const showError = (field: keyof typeof customer) =>
    touched[field] && validationErrors[field as keyof CustomerInfo]

  const isCustomerValid = Object.keys(validationErrors).length === 0
  const hasNonTrompeLoeil = items.some((item) => item.product.category !== "Trompe l'oeil")
  const hasTrompeLoeil = items.some((item) => item.product.category === "Trompe l'oeil")
  const trompeLoeilBeforeMinDate = hasTrompeLoeil && !!customer.date && customer.date < minDate
  const orderCutoffPassed = !isBeforeOrderCutoff()
  const isClassicPreorderPhase = isBeforeFirstPickupDate(FIRST_PICKUP_DATE_CLASSIC)
  const canSend =
    hasItems &&
    isCustomerValid &&
    ordersOpen !== false &&
    !trompeLoeilBeforeMinDate &&
    (!hasNonTrompeLoeil || !orderCutoffPassed || ordersExplicit)

  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (info.velocity.y > 500 || info.offset.y > 200) {
      hapticFeedback('light')
      onClose()
    }
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden cursor-pointer"
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
            className="fixed bottom-0 left-0 right-0 z-50 h-[90vh] rounded-t-3xl bg-mayssa-cream shadow-2xl md:hidden flex flex-col"
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 rounded-full bg-mayssa-brown/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-mayssa-brown/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingBag size={20} className="text-mayssa-brown" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-mayssa-caramel text-[9px] font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-lg text-mayssa-brown">Ma Commande</h2>
              </div>
              <button
                type="button"
                onClick={() => { hapticFeedback('light'); onClose() }}
                aria-label="Fermer le panier"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-mayssa-brown/5 text-mayssa-brown/75 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Cart Items */}
              {hasItems ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
                    Articles ({itemCount})
                  </p>
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 p-2.5 rounded-xl bg-white/80">
                      {item.product.image && (
                        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={item.product.image} alt={item.product.name} width={56} height={56} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xs text-mayssa-brown truncate">{item.product.name}</h3>
                        {item.product.description ? (
                          <p className="text-[10px] text-mayssa-brown/65 truncate">{item.product.description}</p>
                        ) : null}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-bold text-sm text-mayssa-caramel">
                            {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => { hapticFeedback('light'); onUpdateQuantity(item.product.id, item.quantity - 1) }}
                              aria-label={item.quantity === 1 ? `Supprimer ${item.product.name}` : `Réduire ${item.product.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-mayssa-cream text-mayssa-brown cursor-pointer"
                            >
                              {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                            </button>
                            <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => { hapticFeedback('light'); onUpdateQuantity(item.product.id, item.quantity + 1) }}
                              aria-label={`Ajouter ${item.product.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-mayssa-brown text-mayssa-cream cursor-pointer"
                            >
                              <Plus size={12} />
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
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mayssa-brown/5 mb-3">
                    <ShoppingBag size={28} className="text-mayssa-brown/30" />
                  </div>
                  <p className="text-mayssa-brown/75 font-medium text-sm">Ton panier est vide</p>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
                  Tes informations *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", showError('firstName') ? "ring-red-300" : "ring-mayssa-brown/10")}>
                      <User size={14} className="text-mayssa-caramel flex-shrink-0" />
                      <input
                        value={customer.firstName}
                        onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                        onBlur={() => markTouched('firstName')}
                        placeholder="Prénom"
                        aria-label="Prénom"
                        className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                      />
                    </div>
                    {showError('firstName') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.firstName}</p>}
                  </div>
                  <div>
                    <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", showError('lastName') ? "ring-red-300" : "ring-mayssa-brown/10")}>
                      <User size={14} className="text-mayssa-caramel flex-shrink-0" />
                      <input
                        value={customer.lastName}
                        onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                        onBlur={() => markTouched('lastName')}
                        placeholder="Nom"
                        aria-label="Nom"
                        className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                      />
                    </div>
                    {showError('lastName') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", showError('phone') ? "ring-red-300" : "ring-mayssa-brown/10")}>
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
                      className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                    />
                  </div>
                  {showError('phone') && <p className="text-[9px] text-red-400 pl-3 mt-0.5">{validationErrors.phone}</p>}
                </div>
                <div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-mayssa-brown/10">
                    <Mail size={14} className="text-mayssa-caramel flex-shrink-0" aria-hidden />
                    <input
                      type="email"
                      value={customer.email ?? ''}
                      onChange={(e) => onCustomerChange({ ...customer, email: e.target.value.trim() || undefined })}
                      placeholder="Email (récap + notif)"
                      aria-label="Email pour récap et notifications"
                      className="w-full bg-transparent text-xs font-medium text-mayssa-brown placeholder:text-mayssa-brown/40 focus:outline-none"
                    />
                  </div>
                  <p className="text-[9px] text-mayssa-brown/50 pl-3 mt-0.5">Optionnel</p>
                </div>
              </div>

              {/* Delivery Mode */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
                  Mode de récupération
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { hapticFeedback('light'); onCustomerChange({ ...customer, wantsDelivery: false }) }}
                    aria-label="Choisir retrait sur place"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl p-3 text-xs font-bold transition-all cursor-pointer",
                      !customer.wantsDelivery
                        ? "bg-mayssa-brown text-mayssa-cream shadow-lg"
                        : "bg-white/80 text-mayssa-brown ring-1 ring-mayssa-brown/10"
                    )}
                  >
                    <MapPin size={18} />
                    <span>Retrait</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { hapticFeedback('light'); onCustomerChange({ ...customer, wantsDelivery: true }) }}
                    aria-label="Choisir livraison"
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl p-3 text-xs font-bold transition-all cursor-pointer",
                      customer.wantsDelivery
                        ? "bg-mayssa-caramel text-white shadow-lg"
                        : "bg-white/80 text-mayssa-brown ring-1 ring-mayssa-brown/10"
                    )}
                  >
                    <Truck size={18} />
                    <span>Livraison</span>
                  </button>
                </div>

                {customer.wantsDelivery && (
                  <div>
                    <div className={cn("rounded-xl bg-white/80 px-3 py-2.5 ring-1", validationErrors.address ? "ring-red-300" : "ring-mayssa-caramel/30")}>
                      <AddressAutocomplete
                        value={customer.address}
                        onChange={(address, coordinates) => onCustomerChange({ ...customer, address, addressCoordinates: coordinates })}
                        placeholder="Tape ton adresse..."
                        ariaLabel="Adresse de livraison"
                      />
                    </div>
                    {isAuthenticated && profile?.address && customer.address === profile.address && (
                      <p className="mt-1.5 text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 flex items-center gap-1">
                        <MapPin size={10} />
                        Adresse pré-remplie depuis ton profil
                      </p>
                    )}
                    <div className="mt-2">
                      <label id="cart-sheet-delivery-instructions-label" className="block text-[9px] font-medium text-mayssa-brown/70 mb-0.5">Instructions livreur</label>
                      <input
                        id="cart-sheet-delivery-instructions"
                        type="text"
                        value={customer.deliveryInstructions ?? ''}
                        onChange={(e) => onCustomerChange({ ...customer, deliveryInstructions: e.target.value })}
                        placeholder="Code, étage, sonner 2 fois…"
                        aria-labelledby="cart-sheet-delivery-instructions-label"
                        className="w-full rounded-lg bg-white/80 px-2.5 py-1.5 text-xs text-mayssa-brown placeholder:text-mayssa-brown/40 ring-1 ring-mayssa-brown/10 focus:outline-none focus:ring-2 focus:ring-mayssa-caramel/30"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
                  Date et heure *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", validationErrors.date ? "ring-red-300" : "ring-mayssa-brown/10")}>
                    <Calendar size={14} className="text-mayssa-caramel flex-shrink-0" />
                    {useDateSelect ? (
                      <select
                        value={selectableDates.includes(customer.date) ? customer.date : selectableDates[0] ?? ''}
                        onChange={(e) => onCustomerChange({ ...customer, date: e.target.value, time: '' })}
                        className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none cursor-pointer"
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
                        type="date"
                        min={minDate}
                        max={maxDate}
                        value={customer.date}
                        onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                        className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none"
                        aria-label="Date de retrait ou livraison"
                      />
                    )}
                  </div>
                  <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", validationErrors.time ? "ring-red-300" : "ring-mayssa-brown/10")}>
                    <Clock size={14} className="text-mayssa-caramel flex-shrink-0" aria-hidden="true" />
                    <select
                      value={customer.time}
                      onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                      className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none cursor-pointer"
                      aria-label="Heure de retrait ou livraison"
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
                  {customer.wantsDelivery ? 'Livraison 20h - 2h' : 'Retrait 18h30 - 2h'}
                </p>
                {customer.wantsDelivery && customer.date && timeSlots.length === 0 && (
                  <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5">
                    Plus de créneaux disponibles pour cette date en livraison. Choisissez une autre date ou heure.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/75">
                  Notes (optionnel)
                </p>
                <textarea
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Allergies, instructions..."
                  className="w-full min-h-[60px] resize-none rounded-xl bg-white/80 p-3 text-xs text-mayssa-brown ring-1 ring-mayssa-brown/10 focus:outline-none focus:ring-mayssa-caramel/50"
                />
              </div>

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
                <div className="space-y-3">
                  {/* Points à gagner */}
                  <div className="bg-mayssa-caramel/10 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
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

                  {/* Récompenses disponibles */}
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

              <p className="text-[9px] text-mayssa-brown/75 text-center flex items-center justify-center gap-1">
                <MessageCircle size={12} />
                Commande via WhatsApp, Instagram ou Snapchat.
              </p>
              <div className="mt-1 rounded-xl bg-mayssa-soft/60 border border-mayssa-brown/10 px-3 py-2.5 text-[9px] text-mayssa-brown/80 space-y-1">
                <p className="font-semibold text-[10px] text-mayssa-brown text-center">
                  Comment se passe la commande ?
                </p>
                <p><span className="font-semibold">1.</span> Je remplis mon panier sur le site.</p>
                <p><span className="font-semibold">2.</span> J&apos;envoie ma commande sur WhatsApp (ou Insta / Snap).</p>
                <p><span className="font-semibold">3.</span> Maison Mayssa me confirme la commande et l&apos;heure.</p>
                <p><span className="font-semibold">4.</span> Paiement à la livraison / au retrait ou via PayPal.</p>
              </div>
              {hasNonTrompeLoeil && isClassicPreorderPhase && (
                <p className="text-[10px] text-mayssa-brown/80 text-center bg-mayssa-cream/80 rounded-lg px-2 py-1.5 border border-mayssa-caramel/30">
                  Précommandes — récup. à partir du {FIRST_PICKUP_DATE_CLASSIC_LABEL}.
                </p>
              )}
              {orderCutoffPassed && hasNonTrompeLoeil && (
                <p className="text-[10px] text-amber-700 text-center bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-200">
                  Commandes (pâtisseries, cookies…) jusqu&apos;à 17h. Trompe-l&apos;œil toujours dispo.
                </p>
              )}
              {trompeLoeilBeforeMinDate && (
                <p className="text-[10px] text-amber-700 text-center bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-200">
                  Les précommandes trompe l&apos;œil sont possibles à partir du {formatDateLabel(minDate)}.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-mayssa-brown/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/50 backdrop-blur-sm">
              {customer.wantsDelivery && totalAfterDiscount > 0 && totalAfterDiscount < FREE_DELIVERY_THRESHOLD && isWithinDeliveryZone && (
                <p className="text-center text-[10px] font-semibold text-mayssa-caramel bg-mayssa-caramel/10 rounded-lg py-1.5 mb-2">
                  Plus que {(FREE_DELIVERY_THRESHOLD - totalAfterDiscount).toFixed(2).replace('.', ',')} € pour la livraison offerte !
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-mayssa-brown/75">Total</span>
                  {appliedPromo && appliedPromo.discount > 0 && (
                    <span className="text-[9px] text-emerald-600 ml-1">(-{appliedPromo.discount.toFixed(2)} € promo)</span>
                  )}
                  {mysteryFraiseDiscount > 0 && (
                    <span className="text-[9px] text-amber-600 ml-1">(-{mysteryFraiseDiscount.toFixed(2)} € mystère Fraise)</span>
                  )}
                  {donationAmount > 0 && (
                    <span className="text-[9px] text-mayssa-rose ml-1">(+{donationAmount.toFixed(2)} € don)</span>
                  )}
                  {customer.wantsDelivery && deliveryFee !== null && deliveryFee > 0 && (
                    <span className="text-[9px] text-mayssa-brown/40 ml-1">(+{DELIVERY_FEE}€ livraison)</span>
                  )}
                </div>
                <span className="text-2xl font-bold text-mayssa-brown">
                  {finalTotal.toFixed(2).replace('.', ',')} €
                </span>
              </div>

              {pendingOrder ? (
                <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 p-4 text-center space-y-2">
                  <div className="text-3xl">✅</div>
                  <p className="text-sm font-bold text-emerald-800">
                    Commande déjà reçue{pendingOrder.orderNumber ? ` (n°${pendingOrder.orderNumber})` : ''} !
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Nous avons bien reçu votre commande. Nous vous recontacterons rapidement pour confirmer. Merci ! 🙏
                  </p>
                </div>
              ) : (
                <>
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
                    aria-label={hasItems && canSend ? 'Envoyer la commande sur WhatsApp' : hasItems ? 'Complète tes infos pour envoyer' : 'Panier vide'}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base shadow-xl transition-all cursor-pointer",
                      canSend
                        ? "bg-[#25D366] text-white hover:bg-[#20bd5a]"
                        : "bg-mayssa-brown/30 text-mayssa-cream/70"
                    )}
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    {hasItems
                      ? canSend
                        ? 'Envoyer sur WhatsApp'
                        : ordersOpen === false
                          ? 'Commandes fermées'
                          : trompeLoeilBeforeMinDate
                            ? `À partir du ${formatDateLabel(minDate)}`
                            : orderCutoffPassed && hasNonTrompeLoeil
                              ? "Jusqu'à 17h"
                              : 'Complète tes infos'
                      : 'Panier vide'}
                  </motion.button>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (canSend) {
                          hapticFeedback('success')
                          onSendInstagram()
                          onClose()
                        }
                      }}
                      disabled={!canSend}
                      aria-label={canSend ? 'Envoyer la commande sur Instagram' : 'Complète tes infos pour envoyer'}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer",
                        canSend
                          ? "bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white"
                          : "bg-mayssa-brown/20 text-mayssa-cream/70"
                      )}
                    >
                      <Instagram size={16} aria-hidden="true" />
                      Instagram
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (canSend) {
                          hapticFeedback('success')
                          onSendSnap()
                          onClose()
                        }
                      }}
                      disabled={!canSend}
                      aria-label={canSend ? 'Envoyer la commande sur Snapchat' : 'Complète tes infos pour envoyer'}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer",
                        canSend
                          ? "bg-[#FFFC00] text-black"
                          : "bg-mayssa-brown/20 text-mayssa-cream/70"
                      )}
                    >
                      <SnapIcon size={16} aria-hidden="true" />
                      Snapchat
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
