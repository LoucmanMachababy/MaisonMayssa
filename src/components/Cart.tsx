import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Minus, Plus, MessageCircle, Send, Copy, Ghost as Snapchat, Instagram, User, Phone, MapPin, Truck, Calendar, Clock } from 'lucide-react'
import type { CartItem, Channel, CustomerInfo } from '../types'
import { cn } from '../lib/utils'
import { useMemo } from 'react'
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

    // Generate time slots (every 30 minutes from 17:00 to 02:00)
    const timeSlots = useMemo(() => {
        const slots: string[] = []
        // From 17:00 to 23:30
        for (let hour = 17; hour < 24; hour++) {
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
        return slots
    }, [])

    // Get minimum date (today) - using local date to avoid timezone issues
    const today = new Date()
    const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Validation
    const isCustomerValid = 
        customer.firstName.trim() && 
        customer.lastName.trim() && 
        customer.phone.trim() &&
        customer.date.trim() &&
        customer.time.trim()
    const canSend = hasItems && isCustomerValid

    return (
        <aside className="sticky top-8 flex flex-col h-[calc(100vh-4rem)] section-shell bg-white/95">
            <header className="flex items-center justify-between flex-shrink-0 pb-4 border-b border-mayssa-brown/5">
                <div className="flex items-center gap-3 text-mayssa-brown">
                    <div className="relative">
                        <ShoppingBag size={24} />
                        {itemCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-mayssa-caramel text-[10px] font-bold text-white shadow-lg">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl font-display font-bold">Votre Panier</h2>
                </div>
            </header>

            {/* Zone scrollable pour tout le contenu */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                <div className="space-y-6 py-4">
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
                                className="group flex items-center gap-4 rounded-3xl bg-mayssa-soft/50 p-3 ring-1 ring-mayssa-brown/5 transition-all hover:bg-white hover:ring-mayssa-caramel/20"
                            >
                                {item.product.image && (
                                    <div className="h-16 w-16 overflow-hidden rounded-2xl shadow-sm">
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <h4 className="truncate text-sm font-bold text-mayssa-brown">
                                        {item.product.name}
                                    </h4>
                                    <p className="text-xs font-semibold text-mayssa-caramel">
                                        {item.product.price.toFixed(2)} €
                                    </p>
                                </div>

                                <div className="flex items-center gap-1 rounded-2xl bg-white p-1 shadow-sm border border-mayssa-brown/5">
                                    <button
                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-mayssa-brown">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                        className="flex h-7 w-7 items-center justify-center rounded-xl text-mayssa-brown transition-all hover:bg-mayssa-cream hover:scale-110 active:scale-95"
                                    >
                                        <Plus size={14} />
                                    </button>
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
                    <div className="space-y-6 pt-6 border-t border-mayssa-brown/5">
                {/* Infos client */}
                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                        Vos informations
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50 transition-all">
                            <User size={18} className="text-mayssa-caramel flex-shrink-0" />
                            <input
                                value={customer.firstName}
                                onChange={(e) => onCustomerChange({ ...customer, firstName: e.target.value })}
                                placeholder="Votre prénom *"
                                className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50 transition-all">
                            <User size={18} className="text-mayssa-caramel flex-shrink-0" />
                            <input
                                value={customer.lastName}
                                onChange={(e) => onCustomerChange({ ...customer, lastName: e.target.value })}
                                placeholder="Votre nom *"
                                className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 ring-2 ring-mayssa-brown/10 focus-within:ring-mayssa-caramel/50 transition-all sm:col-span-2">
                            <Phone size={18} className="text-mayssa-caramel flex-shrink-0" />
                            <input
                                type="tel"
                                value={customer.phone}
                                onChange={(e) => onCustomerChange({ ...customer, phone: e.target.value })}
                                placeholder="Votre numéro de téléphone *"
                                className="w-full bg-transparent text-sm font-semibold text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Mode de récupération - Gros boutons clairs */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            Comment souhaitez-vous récupérer votre commande ?
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: false })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 rounded-3xl p-4 text-sm font-bold transition-all shadow-lg cursor-pointer",
                                    !customer.wantsDelivery
                                        ? "bg-mayssa-brown text-mayssa-cream ring-4 ring-mayssa-caramel/30 scale-105"
                                        : "bg-white/70 text-mayssa-brown hover:bg-white hover:scale-105 hover:shadow-xl border-2 border-mayssa-brown/20 active:scale-95"
                                )}
                            >
                                <MapPin size={24} />
                                <span>Retrait sur place</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onCustomerChange({ ...customer, wantsDelivery: true })}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 rounded-3xl p-4 text-sm font-bold transition-all shadow-lg cursor-pointer",
                                    customer.wantsDelivery
                                        ? "bg-mayssa-caramel text-white ring-4 ring-mayssa-caramel/30 scale-105"
                                        : "bg-white/70 text-mayssa-brown hover:bg-white hover:scale-105 hover:shadow-xl border-2 border-mayssa-brown/20 active:scale-95"
                                )}
                            >
                                <Truck size={24} />
                                <span>Livraison à domicile</span>
                            </button>
                        </div>

                        {customer.wantsDelivery && (
                            <div className="rounded-2xl bg-white/80 px-4 py-3 ring-2 ring-mayssa-caramel/30 focus-within:ring-mayssa-caramel/50 transition-all">
                                <AddressAutocomplete
                                    value={customer.address}
                                    onChange={(address) =>
                                        onCustomerChange({ ...customer, address })
                                    }
                                    placeholder="Commencez à taper votre adresse (ex: 1 rue de la Paix, Annecy)..."
                                />
                                <p className="mt-2 text-[10px] text-mayssa-brown/60">
                                    💡 L'autocomplétion vous propose des adresses pendant que vous tapez
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Date et heure - Obligatoires */}
                    <div className="space-y-3 rounded-3xl bg-mayssa-soft/60 p-4 ring-1 ring-mayssa-brown/5">
                        <p className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            📅 Date et heure souhaitées *
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-mayssa-brown/10">
                                <Calendar size={16} className="text-mayssa-caramel flex-shrink-0" />
                                <input
                                    type="date"
                                    min={minDate}
                                    value={customer.date}
                                    onChange={(e) => onCustomerChange({ ...customer, date: e.target.value })}
                                    required
                                    className="w-full bg-transparent text-sm font-medium text-mayssa-brown focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-mayssa-brown/10">
                                <Clock size={16} className="text-mayssa-caramel flex-shrink-0" />
                                <select
                                    value={customer.time}
                                    onChange={(e) => onCustomerChange({ ...customer, time: e.target.value })}
                                    required
                                    className="w-full bg-transparent text-sm font-medium text-mayssa-brown focus:outline-none cursor-pointer"
                                >
                                    <option value="">Choisir l'heure</option>
                                    {timeSlots.map((time) => (
                                        <option key={time} value={time}>
                                            {time}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-[10px] text-mayssa-brown/60">
                            Service de 17h à 2h du matin • Créneaux toutes les 30 minutes
                        </p>
                    </div>
                    </div>

                    {/* Détails commande + canaux */}
                    <div className="space-y-4">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-mayssa-brown/60">
                            Détails de commande
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => onNoteChange(e.target.value)}
                            placeholder="Informations complémentaires (allergies, occasion spéciale, instructions particulières...)"
                            className="w-full min-h-[90px] resize-none rounded-3xl bg-white/80 p-4 text-sm text-mayssa-brown ring-2 ring-mayssa-brown/10 focus:bg-white focus:outline-none focus:ring-mayssa-caramel/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <ChannelButton
                            active={channel === 'whatsapp'}
                            onClick={() => onChannelChange('whatsapp')}
                            icon={<MessageCircle size={18} />}
                            label="WhatsApp"
                            activeClass="bg-emerald-500 text-white shadow-emerald-500/30"
                        />
                        <ChannelButton
                            active={channel === 'instagram'}
                            onClick={() => onChannelChange('instagram')}
                            icon={<Instagram size={18} />}
                            label="Instagram"
                            activeClass="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-pink-500/30"
                        />
                        <ChannelButton
                            active={channel === 'snapchat'}
                            onClick={() => onChannelChange('snapchat')}
                            icon={<Snapchat size={18} />}
                            label="Snapchat"
                            activeClass="bg-[#fffc00] text-black shadow-yellow-400/30"
                        />
                    </div>
                    </div>
                </div>
                </div>
            </div>

            {/* Footer fixe avec total et bouton */}
            <div className="flex-shrink-0 pt-4 border-t border-mayssa-brown/5 space-y-3">
                <div className="rounded-[2rem] bg-mayssa-brown p-6 text-mayssa-cream shadow-2xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium opacity-80">Sous-total</span>
                        <span className="text-base font-semibold">{total.toFixed(2)} €</span>
                    </div>
                    {customer.wantsDelivery && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="opacity-80">Livraison Annecy & alentours</span>
                            <span>
                                {deliveryFee > 0 ? '+ 5,00 €' : 'Offerte (≥ 30 €)'}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-mayssa-cream/20 pt-3">
                        <span className="text-sm font-medium opacity-90">Total estimé</span>
                        <span className="text-2xl font-display font-bold">
                            {finalTotal.toFixed(2)} €
                        </span>
                    </div>

                    <button
                        onClick={onSend}
                        disabled={!canSend}
                        className="mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-mayssa-caramel px-6 py-4 font-bold text-white shadow-xl transition-all hover:scale-[1.02] hover:bg-mayssa-gold active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {channel === 'whatsapp' ? <Send size={20} /> : <Copy size={20} />}
                        <span>
                            {hasItems
                                ? isCustomerValid
                                    ? 'Envoyer ma commande'
                                    : 'Complétez vos informations'
                                : 'Panier vide'}
                        </span>
                    </button>
                </div>

                <p className="text-center text-[10px] text-mayssa-brown/40 italic">
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
                "flex flex-1 flex-col items-center gap-2 rounded-2xl p-3 text-[10px] font-bold transition-all cursor-pointer",
                active 
                    ? `${activeClass} scale-105` 
                    : "bg-mayssa-soft text-mayssa-brown hover:bg-white hover:-translate-y-1 hover:shadow-lg border border-mayssa-brown/5 active:scale-95"
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}
