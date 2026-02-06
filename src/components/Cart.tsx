import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, Send, Copy, Instagram, User, Phone, MapPin, Truck, Calendar, Clock } from 'lucide-react'
import type { CartItem, Channel, CustomerInfo } from '../types'
import { cn } from '../lib/utils'
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
    validateCustomer,
    computeDeliveryFee,
} from '../lib/delivery'

interface CartProps {
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
}

export function Cart({
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
}: CartProps) {
    const hasItems = items.length > 0
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    // Touched state for real-time validation feedback
    const [touched, setTouched] = useState<Partial<Record<keyof typeof customer, boolean>>>({})
    const markTouched = (field: keyof typeof customer) =>
        setTouched(prev => ({ ...prev, [field]: true }))

    const distanceFromAnnecy = useMemo(() => {
        return calculateDistance(customer.addressCoordinates, ANNECY_GARE)
    }, [customer.addressCoordinates])

    const isWithinDeliveryZone = distanceFromAnnecy !== null && distanceFromAnnecy <= DELIVERY_RADIUS_KM

    const deliveryFee = useMemo(() => computeDeliveryFee(customer, total), [customer, total])

    const finalTotal = total + (deliveryFee ?? 0)

    const timeSlots = useMemo(() => generateTimeSlots(customer.wantsDelivery), [customer.wantsDelivery])

    // Reset time if switching to delivery and selected time is before 20:00
    // or if switching to pickup and selected time is before 18:30
    useEffect(() => {
        if (customer.time) {
            const [hourStr, minuteStr] = customer.time.split(':')
            const hour = parseInt(hourStr, 10)
            const minute = parseInt(minuteStr || '0', 10)

            if (customer.wantsDelivery) {
                // If time is before 20:00 (not valid for delivery), reset it
                if (hour < 20) {
                    onCustomerChange({ ...customer, time: '' })
                }
            } else {
                // If time is before 18:30 (not valid for pickup), reset it
                if (hour < 18 || (hour === 18 && minute < 30)) {
                    onCustomerChange({ ...customer, time: '' })
                }
            }
        }
    }, [customer.wantsDelivery])

    const minDate = getMinDate()

    const validationErrors = useMemo(() => validateCustomer(customer), [customer])
    // Show error only for fields the user has interacted with
    const showError = (field: keyof typeof customer) =>
        touched[field] && validationErrors[field as keyof CustomerInfo]

    const isCustomerValid = Object.keys(validationErrors).length === 0
    const canSend = hasItems && isCustomerValid

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
                                                        loading="lazy"
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                </div>
                                            )}

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start gap-2">
                                                    <h4 className="truncate text-sm sm:text-base font-bold text-mayssa-brown flex-1">
                                                        {item.product.name}
                                                    </h4>
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

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: false })}
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
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div className={cn(
                                "flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm transition-all",
                                validationErrors.date ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5"
                            )}>
                                <Calendar size={16} className="text-mayssa-caramel" />
                                <input
                                    type="date"
                                    min={minDate}
                                    value={customer.date}
                                    onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none"
                                />
                            </div>
                            <div className={cn(
                                "flex items-center gap-2 rounded-2xl bg-white px-3 py-3 shadow-sm transition-all",
                                validationErrors.time ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/5"
                            )}>
                                <Clock size={16} className="text-mayssa-caramel" />
                                <select
                                    value={customer.time}
                                    onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                                    className="w-full bg-transparent text-xs font-bold text-mayssa-brown focus:outline-none cursor-pointer"
                                >
                                    <option value="">L'heure</option>
                                    {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Free delivery progress banner */}
                        {customer.wantsDelivery && total > 0 && total < FREE_DELIVERY_THRESHOLD && isWithinDeliveryZone && (
                            <div className="flex items-center gap-3 rounded-2xl bg-mayssa-caramel/10 p-3">
                                <Truck size={16} className="text-mayssa-caramel flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-mayssa-caramel">
                                        Plus que {(FREE_DELIVERY_THRESHOLD - total).toFixed(2).replace('.', ',')} € pour la livraison offerte !
                                    </p>
                                    <div className="mt-1.5 h-1.5 rounded-full bg-mayssa-brown/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-mayssa-caramel transition-all"
                                            style={{ width: `${Math.min(100, (total / FREE_DELIVERY_THRESHOLD) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-6 border-t border-mayssa-brown/10">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-mayssa-brown/60">Sous-total</span>
                                    <span className="font-bold text-mayssa-brown">{total.toFixed(2)} €</span>
                                </div>
                                {customer.wantsDelivery && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-mayssa-brown/60">Livraison</span>
                                        <span className="font-bold text-mayssa-brown">
                                            {!customer.addressCoordinates ? 'À définir' : deliveryFee === 0 ? 'Gratuite' : `${DELIVERY_FEE.toFixed(2)} €`}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-mayssa-brown/10">
                                    <span className="text-lg font-bold text-mayssa-brown">Total estimé</span>
                                    <span className="text-3xl font-display font-bold text-mayssa-caramel">{finalTotal.toFixed(2).replace('.', ',')} €</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] text-mayssa-brown/60 text-center font-medium">Choisissez un mode pour envoyer votre commande :</p>
                                <div className="flex gap-2">
                                    <ChannelButton active={channel === 'whatsapp'} onClick={() => onChannelChange('whatsapp')} icon={<MessageCircle size={18} />} label="WhatsApp" activeClass="bg-emerald-500 text-white" />
                                    <ChannelButton active={channel === 'instagram'} onClick={() => onChannelChange('instagram')} icon={<Instagram size={18} />} label="Instagram" activeClass="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white" />
                                </div>

                                <button
                                    onClick={onSend}
                                    disabled={!canSend}
                                    className="w-full flex items-center justify-center gap-3 rounded-[2rem] bg-mayssa-brown text-white py-5 text-base font-bold shadow-2xl transition-all hover:bg-mayssa-caramel hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 cursor-pointer"
                                >
                                    {channel === 'whatsapp' ? <Send size={24} /> : <Copy size={24} />}
                                    <span>{hasItems ? (isCustomerValid ? 'Commander maintenant' : 'Vérifiez le formulaire') : 'Votre panier est vide'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ChannelButton({ active, onClick, icon, label, activeClass }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-1 flex-col items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl p-2 sm:p-3 text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer",
                active
                    ? `${activeClass} scale-105`
                    : "bg-mayssa-soft text-mayssa-brown hover:bg-white hover:-translate-y-1 hover:shadow-lg border border-mayssa-brown/5 active:scale-95"
            )}
        >
            {icon}
            <span className="text-center leading-tight">{label}</span>
        </button>
    )
}
