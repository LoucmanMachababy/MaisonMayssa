import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, MapPin, Calendar, Instagram } from 'lucide-react'
import type { CartItem, CustomerInfo } from '../types'
import { BOX_DECOUVERTE_TROMPE_PRODUCT_ID, PRODUCTS } from '../constants'
import { formatDateYyyyMmDdToFrench } from '../lib/utils'
import { useFocusTrap } from '../hooks/useAccessibility'
import { useRef, useState, useEffect } from 'react'
import { SnapIcon } from './SnapIcon'

export type OrderRecapSendChannel = 'whatsapp' | 'instagram' | 'snap'

interface OrderRecapModalProps {
  isOpen: boolean
  onClose: () => void
  /** Le canal affiché est passé ici pour éviter une closure périmée sur l’état parent. */
  onConfirm: (channel: OrderRecapSendChannel) => void | Promise<void>
  /** Canal d’envoi après validation (texte du bouton et consigne). */
  channel?: OrderRecapSendChannel
  customer: CustomerInfo
  items: CartItem[]
  total: number
  deliveryFee: number
  discountAmount?: number
  donationAmount?: number
}

const CHANNEL_COPY: Record<
  OrderRecapSendChannel,
  { hint: string; confirmLabel: string; buttonClass: string }
> = {
  whatsapp: {
    hint: "Vérifie les infos avant d'envoyer sur WhatsApp.",
    confirmLabel: 'Oui, envoyer sur WhatsApp',
    buttonClass: 'bg-[#25D366] text-white shadow-lg hover:bg-[#20bd5a]',
  },
  instagram: {
    hint: 'Vérifie les infos. Ensuite tu pourras copier le message pour Instagram.',
    confirmLabel: 'Oui, confirmer (Instagram)',
    buttonClass:
      'bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-lg hover:opacity-95',
  },
  snap: {
    hint: 'Vérifie les infos. Ensuite tu pourras copier le message pour Snapchat.',
    confirmLabel: 'Oui, confirmer (Snapchat)',
    buttonClass: 'bg-[#FFFC00] text-black shadow-lg hover:brightness-95',
  },
}

export function OrderRecapModal({
  isOpen,
  onClose,
  onConfirm,
  channel = 'whatsapp',
  customer,
  items,
  total,
  deliveryFee,
  discountAmount = 0,
  donationAmount = 0,
}: OrderRecapModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, isOpen, onClose)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) setSubmitting(false)
  }, [isOpen])

  const finalTotal = total - discountAmount + deliveryFee + donationAmount
  const modeLabel = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'
  const copy = CHANNEL_COPY[channel]

  const handleConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onConfirm(channel)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm cursor-pointer"
      />
      <motion.div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Récapitulatif de la commande"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onPointerDown={(e) => e.stopPropagation()}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[86] max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-5 pb-4 border-b border-mayssa-brown/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-mayssa-brown">Récapitulatif</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-mayssa-brown/10 text-mayssa-brown hover:bg-mayssa-brown/20 transition-colors cursor-pointer"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-mayssa-brown/60 mt-1">{copy.hint}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={18} className="text-mayssa-caramel shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-mayssa-brown">{modeLabel}</p>
              {customer.wantsDelivery && customer.address ? (
                <p className="text-mayssa-brown/80">{customer.address}</p>
              ) : (
                <p className="text-mayssa-brown/80">Retrait sur place (Annecy)</p>
              )}
            </div>
          </div>

          {(customer.date || customer.time) && (
            <div className="flex items-start gap-3 text-sm">
              <Calendar size={18} className="text-mayssa-caramel shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-mayssa-brown">Date et heure</p>
                <p className="text-mayssa-brown/80">
                  {customer.date ? formatDateYyyyMmDdToFrench(customer.date) : ''}
                  {customer.date && customer.time ? ' · ' : ''}
                  {customer.time ?? ''}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-mayssa-soft/50 p-3 border border-mayssa-brown/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">Articles</p>
            <ul className="space-y-2 text-sm text-mayssa-brown/80">
              {items.map((item) => {
                const baseId = item.product.id.replace(/-\d{13,}$/, '')
                const isDiscoveryBox = baseId === BOX_DECOUVERTE_TROMPE_PRODUCT_ID
                const sel = item.trompeDiscoverySelection
                return (
                  <li key={item.product.id}>
                    <div>
                      {item.quantity}× {item.product.name} —{' '}
                      {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                    </div>
                    {isDiscoveryBox && sel && sel.length > 0 && (
                      <ul className="mt-1 ml-3 text-[11px] text-mayssa-brown/65 list-disc space-y-0.5">
                        {sel.map((tid) => (
                          <li key={tid}>
                            {PRODUCTS.find((p) => p.id === tid)?.name.replace(/^Trompe l'œil\s+/i, '').trim() ?? tid}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {(discountAmount > 0 || donationAmount > 0) && (
            <div className="space-y-1 text-sm text-mayssa-brown/70 pt-2 border-t border-mayssa-brown/10">
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Code promo</span>
                  <span className="text-emerald-600">-{discountAmount.toFixed(2).replace('.', ',')} €</span>
                </div>
              )}
              {donationAmount > 0 && (
                <div className="flex justify-between">
                  <span>Don au projet</span>
                  <span className="text-mayssa-rose">+{donationAmount.toFixed(2).replace('.', ',')} €</span>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between text-base font-bold text-mayssa-brown pt-2 border-t border-mayssa-brown/10">
            <span>Total</span>
            <span>{finalTotal.toFixed(2).replace('.', ',')} €</span>
          </div>
        </div>

        <div className="p-5 pt-4 border-t border-mayssa-brown/10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${copy.buttonClass}`}
          >
            {channel === 'whatsapp' && <MessageCircle size={20} />}
            {channel === 'instagram' && <Instagram size={20} />}
            {channel === 'snap' && <SnapIcon size={20} />}
            {submitting ? 'Envoi…' : copy.confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-medium text-mayssa-brown/70 hover:text-mayssa-brown hover:bg-mayssa-soft/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Non, modifier ma commande
          </button>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
