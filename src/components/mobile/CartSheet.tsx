import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, Send, MessageCircle, User, Phone, MapPin, Truck, Calendar, Clock, Star, Gift } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'
import { cn, isBeforeOrderCutoff, isBeforeFirstPickupDate } from '../../lib/utils'
import { FIRST_PICKUP_DATE_CLASSIC, FIRST_PICKUP_DATE_CLASSIC_LABEL } from '../../constants'
import { AddressAutocomplete } from '../AddressAutocomplete'
import { ReservationTimer } from '../ReservationTimer'
import { useAuth } from '../../hooks/useAuth'
import { REWARD_COSTS, REWARD_LABELS } from '../../lib/firebase'
import type { CartItem, Channel, CustomerInfo } from '../../types'
import {
  ANNECY_GARE,
  DELIVERY_RADIUS_KM,
  DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  calculateDistance,
  generateTimeSlots,
  getMinDate,
  validateCustomer,
  computeDeliveryFee,
} from '../../lib/delivery'

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  note: string
  channel: Channel
  customer: CustomerInfo
  onUpdateQuantity: (id: string, quantity: number) => void
  onNoteChange: (note: string) => void
  onChannelChange: (channel: Channel) => void
  onCustomerChange: (customer: CustomerInfo) => void
  onSend: () => void
  onAccountClick?: () => void
  selectedReward?: { type: keyof typeof REWARD_COSTS; id: string } | null
  onSelectReward?: (reward: { type: keyof typeof REWARD_COSTS; id: string } | null) => void
}

export function CartSheet({
  isOpen,
  onClose,
  items,
  total,
  note,
  channel,
  customer,
  onUpdateQuantity,
  onNoteChange,
  onChannelChange,
  onCustomerChange,
  onSend,
  onAccountClick,
  selectedReward,
  onSelectReward,
}: CartSheetProps) {
  const dragControls = useDragControls()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const hasItems = items.length > 0
  const { isAuthenticated, profile } = useAuth()

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

  const deliveryFee = useMemo(() => computeDeliveryFee(customer, total), [customer, total])

  const finalTotal = total + (deliveryFee ?? 0)

  // Calcul des points de fidélité
  const pointsToEarn = Math.round(finalTotal) // 1 € = 1 point
  const availableRewards = isAuthenticated && profile 
    ? Object.entries(REWARD_COSTS).filter(([_, cost]) => profile.loyalty.points >= cost)
    : []

  const timeSlots = useMemo(() => generateTimeSlots(customer.wantsDelivery), [customer.wantsDelivery])

  const minDate = getMinDate()

  const validationErrors = useMemo(() => validateCustomer(customer), [customer])
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
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
                onClick={() => { hapticFeedback('light'); onClose() }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-mayssa-brown/5 text-mayssa-brown/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Cart Items */}
              {hasItems ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
                    Articles ({itemCount})
                  </p>
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3 p-2.5 rounded-xl bg-white/80">
                      {item.product.image && (
                        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs text-mayssa-brown truncate">{item.product.name}</h4>
                        <p className="text-[10px] text-mayssa-brown/50 truncate">{item.product.description}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="font-bold text-sm text-mayssa-caramel">
                            {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { hapticFeedback('light'); onUpdateQuantity(item.product.id, item.quantity - 1) }}
                              aria-label={item.quantity === 1 ? `Supprimer ${item.product.name}` : `Réduire ${item.product.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-md bg-mayssa-cream text-mayssa-brown cursor-pointer"
                            >
                              {item.quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
                            </button>
                            <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                            <button
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
                  <p className="text-mayssa-brown/60 font-medium text-sm">Ton panier est vide</p>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
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
              </div>

              {/* Delivery Mode */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
                  Mode de récupération
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { hapticFeedback('light'); onCustomerChange({ ...customer, wantsDelivery: false }) }}
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
                    onClick={() => { hapticFeedback('light'); onCustomerChange({ ...customer, wantsDelivery: true }) }}
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
                      />
                    </div>
                    {isAuthenticated && profile?.address && customer.address === profile.address && (
                      <p className="mt-1.5 text-[10px] text-emerald-600 bg-emerald-50 rounded-lg px-2 py-1 flex items-center gap-1">
                        <MapPin size={10} />
                        Adresse pré-remplie depuis ton profil
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
                  Date et heure *
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", validationErrors.date ? "ring-red-300" : "ring-mayssa-brown/10")}>
                    <Calendar size={14} className="text-mayssa-caramel flex-shrink-0" />
                    <input
                      type="date"
                      min={minDate}
                      value={customer.date}
                      onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                      className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none"
                    />
                  </div>
                  <div className={cn("flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 ring-1", validationErrors.time ? "ring-red-300" : "ring-mayssa-brown/10")}>
                    <Clock size={14} className="text-mayssa-caramel flex-shrink-0" />
                    <select
                      value={customer.time}
                      onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                      className="w-full bg-transparent text-xs font-medium text-mayssa-brown focus:outline-none cursor-pointer"
                    >
                      <option value="">Heure</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[9px] text-mayssa-brown/50">
                  {customer.wantsDelivery ? 'Livraison 20h - 2h' : 'Retrait 18h30 - 2h'}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-mayssa-brown/60">
                  Notes (optionnel)
                </p>
                <textarea
                  value={note}
                  onChange={(e) => onNoteChange(e.target.value)}
                  placeholder="Allergies, instructions..."
                  className="w-full min-h-[60px] resize-none rounded-xl bg-white/80 p-3 text-xs text-mayssa-brown ring-1 ring-mayssa-brown/10 focus:outline-none focus:ring-mayssa-caramel/50"
                />
              </div>

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
                            <span className="text-[10px] text-mayssa-brown/60">{cost} pts</span>
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
                    Crée ton compte pour des récompenses gratuites.
                  </p>
                  <button
                    onClick={() => {
                      if (onAccountClick) {
                        hapticFeedback('light')
                        onAccountClick()
                        onClose()
                      }
                    }}
                    className="w-full py-2 px-3 bg-mayssa-caramel text-white rounded-xl text-[10px] font-bold hover:bg-mayssa-brown transition-colors"
                  >
                    Créer mon compte (+15 pts bonus)
                  </button>
                </div>
              )}

              <p className="text-[9px] text-mayssa-brown/60 text-center flex items-center justify-center gap-1">
                <MessageCircle size={12} />
                Commande par WhatsApp uniquement.
              </p>
              {hasNonTrompeLoeil && isClassicPreorderPhase && (
                <p className="text-[10px] text-mayssa-brown/80 text-center bg-mayssa-cream/80 rounded-lg px-2 py-1.5 border border-mayssa-caramel/30">
                  Précommandes — récup. à partir du {FIRST_PICKUP_DATE_CLASSIC_LABEL}.
                </p>
              )}
              {orderCutoffPassed && hasNonTrompeLoeil && (
                <p className="text-[10px] text-amber-700 text-center bg-amber-50 rounded-lg px-2 py-1.5 border border-amber-200">
                  Commandes (pâtisseries, cookies…) jusqu&apos;à 23h. Trompe-l&apos;œil toujours dispo.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-mayssa-brown/10 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/50 backdrop-blur-sm">
              {customer.wantsDelivery && total > 0 && total < FREE_DELIVERY_THRESHOLD && isWithinDeliveryZone && (
                <p className="text-center text-[10px] font-semibold text-mayssa-caramel bg-mayssa-caramel/10 rounded-lg py-1.5 mb-2">
                  Plus que {(FREE_DELIVERY_THRESHOLD - total).toFixed(2).replace('.', ',')} € pour la livraison offerte !
                </p>
              )}

              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-mayssa-brown/60">Total</span>
                  {customer.wantsDelivery && deliveryFee !== null && deliveryFee > 0 && (
                    <span className="text-[9px] text-mayssa-brown/40 ml-1">(+{DELIVERY_FEE}€ livraison)</span>
                  )}
                </div>
                <span className="text-2xl font-bold text-mayssa-brown">
                  {finalTotal.toFixed(2).replace('.', ',')} €
                </span>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (canSend) {
                    hapticFeedback('success')
                    onSend()
                    onClose()
                  } else {
                    hapticFeedback('warning')
                  }
                }}
                disabled={!canSend}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base shadow-xl transition-all cursor-pointer",
                  canSend
                    ? "bg-[#25D366] text-white hover:bg-[#20bd5a]"
                    : "bg-mayssa-brown/30 text-mayssa-cream/70"
                )}
              >
                <MessageCircle size={18} />
                {hasItems
                  ? canSend
                    ? 'Envoyer sur WhatsApp'
                    : orderCutoffPassed && hasNonTrompeLoeil ? "Jusqu'à 23h" : 'Complète tes infos'
                  : 'Panier vide'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
