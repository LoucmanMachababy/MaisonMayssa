import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Copy, Star, MapPin } from 'lucide-react'
import { getReviewByOrderId } from '../lib/firebase'
import { formatOrderItemName } from '../lib/utils'
import { STORE_ADDRESS_LINE, STORE_MAPS_URL } from '../constants/store'
import { ReviewForm, type OrderItemForReview } from './ReviewForm'

export type OrderConfirmationData = {
  orderId: string
  /** Numéro de commande affiché au client (ex. 1001) */
  orderNumber?: number
  total: number
  deliveryFee?: number
  customer: { firstName: string; lastName: string; phone: string }
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
  const [showReviewForm, setShowReviewForm] = useState(true)
  const [reviewAlreadySubmitted, setReviewAlreadySubmitted] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    getReviewByOrderId(data.orderId).then((review) => {
      if (!cancelled) setReviewAlreadySubmitted(!!review)
    })
    return () => { cancelled = true }
  }, [data.orderId])

  const finalTotal = data.total + (data.deliveryFee ?? 0)
  const statusUrl = `${window.location.origin}/commande/${data.orderId}`

  const copyStatusLink = () => {
    navigator.clipboard.writeText(statusUrl)
  }

  const displayOrderRef = data.orderNumber != null ? `#${data.orderNumber}` : data.orderId

  const pickupWhen = [
    data.requestedDate
      ? new Date(data.requestedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
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
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-mayssa-espresso px-6 py-8 text-center text-white">
          <CheckCircle2 size={56} className="mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold">Commande confirmée &amp; payée !</h2>
          <p className="text-emerald-100 text-sm mt-1">Numéro de commande</p>
          <p className="text-2xl font-mono font-bold mt-2 tracking-wider">{displayOrderRef}</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/75 mb-2">Récapitulatif</h3>
            <div className="space-y-1.5 text-sm text-mayssa-brown">
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}× {formatOrderItemName(item)}</span>
                  <span className="font-medium">{(item.price * item.quantity).toFixed(2).replace('.', ',')} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-mayssa-gold pt-2 border-t border-mayssa-brown/10">
                <span>Payé</span>
                <span>{finalTotal.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-mayssa-gold/30 bg-mayssa-soft/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-mayssa-gold shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/75">Votre retrait en click &amp; collect</h3>
            </div>
            <p className="text-sm text-mayssa-brown leading-relaxed">
              {pickupWhen && (
                <>
                  <strong>{pickupWhen}</strong>
                  <br />
                </>
              )}
              Galerie marchande du Carrefour
              <br />
              {STORE_ADDRESS_LINE}
            </p>
            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-mayssa-gold font-medium hover:underline"
            >
              <MapPin size={12} /> Itinéraire
            </a>
            <p className="text-[11px] text-mayssa-brown/60 mt-3 leading-relaxed">
              Présentez votre numéro de commande <strong>{displayOrderRef}</strong> au comptoir.
              Un email de confirmation vous a été envoyé.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="border border-mayssa-brown/10 rounded-xl p-3 bg-slate-50">
              <p className="text-[10px] font-bold text-mayssa-brown/75 mb-2">Ma commande du {data.requestedDate ? new Date(data.requestedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'jour'}</p>
              <div className="flex gap-3 items-start">
                <a
                  href={statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 rounded-lg overflow-hidden bg-white border border-mayssa-brown/10"
                  aria-label="Ouvrir le suivi de commande"
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(statusUrl)}`}
                    alt="QR code suivi de commande"
                    width={100}
                    height={100}
                    loading="lazy"
                    decoding="async"
                    className="block"
                  />
                </a>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-mayssa-brown/65 mb-1">Lien de suivi à partager</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={statusUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs text-mayssa-gold font-medium truncate hover:underline"
                    >
                      Voir le récap et le statut
                    </a>
                    <button
                      type="button"
                      onClick={copyStatusLink}
                      aria-label="Copier le lien de suivi"
                      className="p-1.5 rounded-lg hover:bg-mayssa-brown/10 cursor-pointer"
                      title="Copier le lien"
                    >
                      <Copy size={14} className="text-mayssa-brown" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-mayssa-brown/10 pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-mayssa-gold" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/75">Donner mon avis</h3>
            </div>
            {showReviewForm && reviewAlreadySubmitted !== null && (
              <ReviewForm
                orderId={data.orderId}
                items={data.items as OrderItemForReview[]}
                customerName={data.customer.firstName}
                onSubmitted={() => setReviewAlreadySubmitted(true)}
                onSkip={() => setShowReviewForm(false)}
                alreadySubmitted={reviewAlreadySubmitted}
              />
            )}
            {!showReviewForm && (
              <p className="text-xs text-mayssa-brown/65">Tu pourras laisser un avis plus tard en revenant sur le site.</p>
            )}
          </div>

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
