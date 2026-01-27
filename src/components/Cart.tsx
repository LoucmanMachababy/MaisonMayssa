import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, Send, Copy, Ghost as Snapchat, Instagram, User, Phone, MapPin, Truck, Calendar, Clock } from 'lucide-react'
import type { CartItem, Channel, CustomerInfo } from '../types'
import { cn } from '../lib/utils'
import { useEffect, useMemo } from 'react'
import { AddressAutocomplete } from './AddressAutocomplete'

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

    // Delivery fee logic: +5€ if delivery requested and total < 30€
    const deliveryFee = customer.wantsDelivery && total < 30 ? 5 : 0
    const finalTotal = total + deliveryFee

    // Generate time slots based on delivery mode
    // Pickup: 18:30 to 02:00 | Delivery: 20:00 to 02:00
    const timeSlots = useMemo(() => {
        const slots: string[] = []
        if (customer.wantsDelivery) {
            // Delivery: from 20:00 to 02:00
            for (let hour = 20; hour < 24; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`)
                slots.push(`${hour.toString().padStart(2, '0')}:30`)
            }
            // From 00:00 to 02:00
            for (let hour = 0; hour <= 2; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`)
                if (hour < 2) {
                    slots.push(`${hour.toString().padStart(2, '0')}:30`)
                }
            }
        } else {
            // Pickup: from 18:30 to 02:00
            slots.push('18:30')
            for (let hour = 19; hour < 24; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`)
                slots.push(`${hour.toString().padStart(2, '0')}:30`)
            }
            // From 00:00 to 02:00
            for (let hour = 0; hour <= 2; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`)
                if (hour < 2) {
                    slots.push(`${hour.toString().padStart(2, '0')}:30`)
                }
            }
        }
        return slots
    }, [customer.wantsDelivery])

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

    // Get minimum date (today) - using local date to avoid timezone issues
    const today = new Date()
    const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Validation with detailed errors
    const validationErrors = useMemo(() => {
        const errors: Partial<Record<keyof CustomerInfo, string>> = {}
        
        if (!customer.firstName.trim()) {
            errors.firstName = 'Le prénom est requis'
        }
        if (!customer.lastName.trim()) {
            errors.lastName = 'Le nom est requis'
        }
        if (!customer.phone.trim()) {
            errors.phone = 'Le téléphone est requis'
        } else if (!/^(\+33|0)[1-9](\d{2}){4}$/.test(customer.phone.replace(/\s/g, ''))) {
            errors.phone = 'Format de téléphone invalide'
        }
        if (customer.wantsDelivery && !customer.address.trim()) {
            errors.address = 'L\'adresse est requise pour la livraison'
        }
        if (!customer.date.trim()) {
            errors.date = 'La date est requise'
        }
        if (!customer.time.trim()) {
            errors.time = 'L\'heure est requise'
        }
        
        return errors
    }, [customer])

    const isCustomerValid = Object.keys(validationErrors).length === 0
    const canSend = hasItems && isCustomerValid

    return (
        <aside className="lg:sticky lg:top-8 flex flex-col min-w-0 w-full max-w-full overflow-hidden lg:h-[calc(100vh-4rem)] section-shell bg-white/95 lg:max-h-[calc(100vh-4rem)] !p-4 sm:!p-5 lg:!p-5">
            <header className="flex items-center justify-between flex-shrink-0 pb-3 sm:pb-4 border-b border-mayssa-brown/5">
                <div className="flex items-center gap-2 sm:gap-3 text-mayssa-brown">
                    <div className="relative">
                        <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                        {itemCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-mayssa-caramel text-[9px] sm:text-[10px] font-bold text-white shadow-lg">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold">Votre Panier</h2>
                </div>
            </header>

            {/* Zone scrollable pour tout le contenu */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 custom-scrollbar">
                <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
                    {/* Liste des items */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {hasItems ? (
                                items.map((item) => (
                                    <motion.div
                                        key={item.product.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex items-center gap-2 sm:gap-4 rounded-2xl sm:rounded-3xl bg-mayssa-soft/50 p-2 sm:p-3 ring-1 ring-mayssa-brown/5 transition-all hover:bg-white hover:ring-mayssa-caramel/20"
                                    >
                                        {item.product.image && (
                                            <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-xl sm:rounded-2xl shadow-sm flex-shrink-0">
                                                <img
                                                    src={item.product.image}
                                                    alt={item.product.name}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start gap-1.5 sm:gap-2">
                                                <h4 className="truncate text-xs sm:text-sm font-bold text-mayssa-brown flex-1">
                                                    {item.product.name}
                                                </h4>
                                                {item.quantity > 1 && (
                                                    <span className="flex-shrink-0 px-1.5 sm:px-2 py-0.5 rounded-lg bg-mayssa-caramel/10 text-[10px] sm:text-xs font-bold text-mayssa-caramel">
                                                        x{item.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            {item.product.description && (
                                                <p className="text-[9px] sm:text-[10px] text-mayssa-brown/60 mt-0.5 line-clamp-2">
                                                    {item.product.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] sm:text-xs text-mayssa-brown/60">
                                                    {item.product.price.toFixed(2).replace('.', ',')} €
                                                    {item.quantity > 1 && (
                                                        <span className="ml-1">× {item.quantity}</span>
                                                    )}
                                                </p>
                                                <p className="text-[11px] sm:text-sm font-bold text-mayssa-caramel">
                                                    = {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center gap-1 sm:gap-1.5 flex-shrink-0">
                                            <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl bg-white p-0.5 sm:p-1 shadow-sm border border-mayssa-brown/5">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg sm:rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95"
                                                    aria-label="Diminuer la quantité"
                                                >
                                                    <Minus size={12} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                                <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs font-bold text-mayssa-brown">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                                    className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg sm:rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95"
                                                    aria-label="Augmenter la quantité"
                                                >
                                                    <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                                                </button>
                                            </div>
                                            {item.quantity === 1 && (
                                                <p className="text-[8px] sm:text-[9px] text-mayssa-brown/50 text-center max-w-[60px] sm:max-w-[70px]">
                                                    Ajouter un supplément
                                                </p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-mayssa-brown/40">
                                    <div className="rounded-full bg-mayssa-soft p-6">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <p className="text-sm font-medium">Votre panier est vide</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Formulaire client */}
                    <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-mayssa-brown/5">
                        {/* Infos client */}
                        <div className="space-y-3 sm:space-y-4">
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                                Vos informations
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                <div className="space-y-1">
                                    <div className={cn(
                                        "flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white/80 px-3 sm:px-4 py-2 sm:py-3 transition-all",
                                        validationErrors.firstName ? "ring-2 ring-red-300" : "ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50"
                                    )}>
                                        <User size={16} className="sm:w-[18px] sm:h-[18px] text-mayssa-caramel flex-shrink-0" />
                                        <input
                                            value={customer.firstName}
                                            onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                            placeholder="Votre prénom *"
                                            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                                        />
                                    </div>
                                    {validationErrors.firstName && (
                                        <p className="text-[10px] text-red-500 px-1">{validationErrors.firstName}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className={cn(
                                        "flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white/80 px-3 sm:px-4 py-2 sm:py-3 transition-all",
                                        validationErrors.lastName ? "ring-2 ring-red-300" : "ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50"
                                    )}>
                                        <User size={16} className="sm:w-[18px] sm:h-[18px] text-mayssa-caramel flex-shrink-0" />
                                        <input
                                            value={customer.lastName}
                                            onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                                            placeholder="Votre nom *"
                                            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                                        />
                                    </div>
                                    {validationErrors.lastName && (
                                        <p className="text-[10px] text-red-500 px-1">{validationErrors.lastName}</p>
                                    )}
                                </div>
                                <div className="space-y-1 sm:col-span-2">
                                    <div className={cn(
                                        "flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white/80 px-3 sm:px-4 py-2 sm:py-3 transition-all",
                                        validationErrors.phone ? "ring-2 ring-red-300" : "ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50"
                                    )}>
                                        <Phone size={16} className="sm:w-[18px] sm:h-[18px] text-mayssa-caramel flex-shrink-0" />
                                        <input
                                            type="tel"
                                            value={customer.phone}
                                            onChange={(e) => {
                                                let value = e.target.value.replace(/\s/g, '')
                                                // Format: 06 12 34 56 78
                                                if (value.length > 2) {
                                                    value = value.match(/.{1,2}/g)?.join(' ') || value
                                                }
                                                onCustomerChange({ ...customer, phone: value })
                                            }}
                                            placeholder="Votre numéro de téléphone *"
                                            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                                        />
                                    </div>
                                    {validationErrors.phone && (
                                        <p className="text-[10px] text-red-500 px-1">{validationErrors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mode de récupération - Gros boutons clairs */}
                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            Comment souhaitez-vous récupérer votre commande ?
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: false })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer",
                                    !customer.wantsDelivery
                                        ? "bg-mayssa-brown text-mayssa-cream ring-2 sm:ring-4 ring-mayssa-caramel/30 scale-105"
                                        : "bg-white/70 text-mayssa-brown hover:bg-white hover:scale-105 hover:shadow-xl border-2 border-mayssa-brown/20 active:scale-95"
                                )}
                            >
                                <MapPin size={20} className="sm:w-6 sm:h-6" />
                                <span className="text-center leading-tight">Retrait sur place</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: true })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-xs sm:text-sm font-bold transition-all shadow-lg cursor-pointer",
                                    customer.wantsDelivery
                                        ? "bg-mayssa-caramel text-white ring-2 sm:ring-4 ring-mayssa-caramel/30 scale-105"
                                        : "bg-white/70 text-mayssa-brown hover:bg-white hover:scale-105 hover:shadow-xl border-2 border-mayssa-brown/20 active:scale-95"
                                )}
                            >
                                <Truck size={20} className="sm:w-6 sm:h-6" />
                                <span className="text-center leading-tight">Livraison à domicile</span>
                            </button>
                        </div>

                        {customer.wantsDelivery && (
                            <div className="space-y-1">
                                <div className={cn(
                                    "rounded-xl sm:rounded-2xl bg-white/80 px-3 sm:px-4 py-2 sm:py-3 transition-all",
                                    validationErrors.address ? "ring-2 ring-red-300" : "ring-2 ring-mayssa-caramel/30 focus-within:ring-mayssa-caramel/50"
                                )}>
                                    <AddressAutocomplete
                                        value={customer.address}
                                        onChange={(address) =>
                                            onCustomerChange({ ...customer, address })
                                        }
                                        placeholder="Commencez à taper votre adresse (ex: 1 rue de la Paix, Annecy)..."
                                    />
                                    <p className="mt-2 text-[9px] sm:text-[10px] text-mayssa-brown/60">
                                        💡 L'autocomplétion vous propose des adresses pendant que vous tapez
                                    </p>
                                </div>
                                {validationErrors.address && (
                                    <p className="text-[10px] text-red-500 px-1">{validationErrors.address}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Date et heure - Obligatoires */}
                    <div className="space-y-2 sm:space-y-3 rounded-2xl sm:rounded-3xl bg-mayssa-soft/60 p-3 sm:p-4 ring-1 ring-mayssa-brown/5">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            📅 Date et heure souhaitées *
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                            <div className="space-y-1">
                                <div className={cn(
                                    "flex items-center gap-2 rounded-xl sm:rounded-2xl bg-white/80 px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all",
                                    validationErrors.date ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/10"
                                )}>
                                    <Calendar size={14} className="sm:w-4 sm:h-4 text-mayssa-caramel flex-shrink-0" />
                                    <input
                                        type="date"
                                        min={minDate}
                                        value={customer.date}
                                        onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                                        required
                                        className="w-full bg-transparent text-xs sm:text-sm font-medium text-mayssa-brown focus:outline-none"
                                    />
                                </div>
                                {validationErrors.date && (
                                    <p className="text-[10px] text-red-500 px-1">{validationErrors.date}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className={cn(
                                    "flex items-center gap-2 rounded-xl sm:rounded-2xl bg-white/80 px-2.5 sm:px-3 py-2 sm:py-2.5 transition-all",
                                    validationErrors.time ? "ring-2 ring-red-300" : "ring-1 ring-mayssa-brown/10"
                                )}>
                                    <Clock size={14} className="sm:w-4 sm:h-4 text-mayssa-caramel flex-shrink-0" />
                                    <select
                                        value={customer.time}
                                        onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                                        required
                                        className="w-full bg-transparent text-xs sm:text-sm font-medium text-mayssa-brown focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Choisir l'heure</option>
                                        {timeSlots.map((time) => (
                                            <option key={time} value={time}>
                                                {time}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {validationErrors.time && (
                                    <p className="text-[10px] text-red-500 px-1">{validationErrors.time}</p>
                                )}
                            </div>
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-mayssa-brown/60">
                            {customer.wantsDelivery
                                ? 'Livraison de 20h à 2h du matin • Créneaux toutes les 30 minutes'
                                : 'Retrait de 18h30 à 2h du matin • Créneaux toutes les 30 minutes'
                            }
                        </p>
                    </div>

                        {/* Détails commande + canaux */}
                        <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-2 sm:space-y-3">
                                <label className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                                    Détails de commande
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => onNoteChange(e.target.value)}
                                    placeholder="Informations complémentaires (allergies, occasion spéciale, instructions particulières...)"
                                    className="w-full min-h-[80px] sm:min-h-[90px] resize-none rounded-2xl sm:rounded-3xl bg-white/80 p-3 sm:p-4 text-xs sm:text-sm text-mayssa-brown ring-2 ring-mayssa-brown/10 focus:bg-white focus:outline-none focus:ring-mayssa-caramel/50 transition-all"
                                />
                            </div>
                            <div className="flex gap-2">
                                <ChannelButton
                                    active={channel === 'whatsapp'}
                                    onClick={() => onChannelChange('whatsapp')}
                                    icon={<MessageCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                    label="WhatsApp"
                                    activeClass="bg-emerald-500 text-white shadow-emerald-500/30"
                                />
                                <ChannelButton
                                    active={channel === 'instagram'}
                                    onClick={() => onChannelChange('instagram')}
                                    icon={<Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                    label="Instagram"
                                    activeClass="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-pink-500/30"
                                />
                                <ChannelButton
                                    active={channel === 'snapchat'}
                                    onClick={() => onChannelChange('snapchat')}
                                    icon={<Snapchat size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                    label="Snapchat"
                                    activeClass="bg-[#fffc00] text-black shadow-yellow-400/30"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer fixe avec total et bouton */}
            <div className="flex-shrink-0 pt-3 sm:pt-4 border-t border-mayssa-brown/5 space-y-2 sm:space-y-3">
                {customer.wantsDelivery && total > 0 && total < 30 && (
                    <p className="text-center text-xs sm:text-sm font-semibold text-mayssa-caramel bg-mayssa-caramel/10 rounded-xl py-2 px-3">
                        Plus que {(30 - total).toFixed(2).replace('.', ',')} € pour la livraison offerte
                    </p>
                )}
                <div className="rounded-2xl sm:rounded-[2rem] bg-mayssa-brown p-4 sm:p-6 text-mayssa-cream shadow-2xl space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium opacity-80">Sous-total</span>
                        <span className="text-sm sm:text-base font-semibold">{total.toFixed(2)} €</span>
                    </div>
                    {customer.wantsDelivery && (
                        <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="opacity-80">Livraison Annecy & alentours</span>
                            <span>
                                {deliveryFee > 0 ? '+ 5,00 €' : 'Offerte (≥ 30 €)'}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-mayssa-cream/20 pt-2 sm:pt-3">
                        <span className="text-xs sm:text-sm font-medium opacity-90">Total estimé</span>
                        <span className="text-xl sm:text-2xl font-display font-bold">
                            {finalTotal.toFixed(2)} €
                        </span>
                    </div>

                    {canSend && (
                        <p className="text-[10px] sm:text-xs opacity-80 text-center">
                            Vous allez envoyer {itemCount} article{itemCount > 1 ? 's' : ''}, {finalTotal.toFixed(2).replace('.', ',')} € · {customer.wantsDelivery ? 'Livraison' : 'Retrait'}
                        </p>
                    )}

                    <button
                        onClick={onSend}
                        disabled={!canSend}
                        className="mt-2 flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-mayssa-caramel px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-mayssa-gold active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {channel === 'whatsapp' ? <Send size={18} className="sm:w-5 sm:h-5" /> : <Copy size={18} className="sm:w-5 sm:h-5" />}
                        <span>
                            {hasItems
                                ? isCustomerValid
                                    ? 'Envoyer ma commande'
                                    : 'Complétez vos informations'
                                : 'Panier vide'}
                        </span>
                    </button>
                </div>

                <p className="text-center text-[9px] sm:text-[10px] text-mayssa-brown/40 italic">
                    * Livraison offerte dès 30 € • Annecy & alentours (+5 €)
                </p>
            </div>
        </aside>
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
