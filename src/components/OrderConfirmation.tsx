import { motion } from 'framer-motion'
import { CheckCircle2, MapPin, User, Phone, CalendarPlus } from 'lucide-react'
import { formatOrderItemName } from '../lib/utils'
import { STORE_ADDRESS_FULL, STORE_MAPS_URL } from '../constants/store'
import { downloadPickupIcs } from '../lib/calendar'

export type OrderConfirmationData = {
  orderId: string
  /** Numéro de commande affiché au client (ex. 1001) */
  orderNumber?: number
  total: number
  deliveryFee?: number
  customer: { firstName: string; lastName: string; phone: string; email?: string }
  items: { name: string; quantity: number; price: number; productId?: string }[]
  deliveryMode?: 'livraison' | 'retrait'
  requestedDate?: string
  requestedTime?: string
}

interface OrderConfirmationProps {
  data: OrderConfirmationData
  /** @deprecated conservé pour rétrocompat ; n'est plus utilisé en click & collect. */
  whatsappMessage?: string
  onClose: () => void
}

export function OrderConfirmation({ data, onClose }: OrderConfirmationProps) {
  const finalTotal = data.total + (data.deliveryFee ?? 0)
  const displayOrderRef = data.orderNumber != null ? `#${data.orderNumber}` : data.orderId

  const customerName = [data.customer.firstName, data.customer.lastName]
    .filter(Boolean)
    .join(' ')
    .trim()

  const pickupWhen = [
    data.requestedDate
      ? new Date(data.requestedDate + 'T12:00:00').toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : null,
    data.requestedTime ? `à ${data.requestedTime}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="bg-mayssa-espresso px-6 py-8 text-center text-white">
          <CheckCircle2 size={52} className="mx-auto mb-3 text-emerald-300" />
          <h2 className="text-xl font-display font-bold">Commande confirmée</h2>
          <p className="text-white/70 text-sm mt-2">Paiement reçu — merci pour votre confiance</p>
          <p className="text-emerald-100/90 text-xs mt-4 uppercase tracking-widest">Numéro de commande</p>
          <p className="text-2xl font-mono font-bold mt-1 tracking-wider">{displayOrderRef}</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl border border-mayssa-brown/10 bg-mayssa-soft/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <User size={16} className="text-mayssa-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">Client</p>
                <p className="text-sm font-semibold text-mayssa-brown">{customerName || 'Client'}</p>
                {data.customer.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-mayssa-brown/70 mt-1">
                    <Phone size={13} className="shrink-0" />
                    {data.customer.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-mayssa-brown/10">
              <MapPin size={16} className="text-mayssa-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50">
                  Retrait click &amp; collect
                </p>
                {pickupWhen && (
                  <p className="text-sm font-semibold text-mayssa-brown mt-1">{pickupWhen}</p>
                )}
                <p className="text-sm text-mayssa-brown/80 mt-1 leading-relaxed">{STORE_ADDRESS_FULL}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                  <a
                    href={STORE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-mayssa-gold font-medium hover:underline"
                  >
                    <MapPin size={12} /> Voir l&apos;itinéraire
                  </a>
                  {data.requestedDate && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadPickupIcs({
                          orderRef: displayOrderRef,
                          date: data.requestedDate!,
                          time: data.requestedTime,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-mayssa-gold font-medium hover:underline cursor-pointer"
                    >
                      <CalendarPlus size={12} /> Ajouter à mon agenda
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/75 mb-2">Votre commande</h3>
            <div className="space-y-1.5 text-sm text-mayssa-brown">
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="min-w-0">
                    {item.quantity}× {formatOrderItemName(item)}
                  </span>
                  <span className="font-medium shrink-0">
                    {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-mayssa-gold pt-2 border-t border-mayssa-brown/10">
                <span>Total payé</span>
                <span>{finalTotal.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-mayssa-brown/60 leading-relaxed text-center">
            Présentez le numéro <strong>{displayOrderRef}</strong> au comptoir le jour du retrait.
            {data.customer.email
              ? ' Un email de confirmation vous a été envoyé.'
              : ''}
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Retour au catalogue"
            className="w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors cursor-pointer"
          >
            Retour au catalogue
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
