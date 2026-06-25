import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar, Lock } from 'lucide-react'
import type { CartItem, CustomerInfo } from '../types'
import { PRODUCTS, isTrompeBoxWithStoredSelection } from '../constants'
import { STORE_ADDRESS_LINE } from '../constants/store'
import { formatDateYyyyMmDdToFrench } from '../lib/utils'
import { useFocusTrap } from '../hooks/useAccessibility'
import { useRef, useState, useEffect } from 'react'

/** @deprecated le canal n'est plus pertinent (click & collect), conservé pour rétrocompat de signature. */
export type OrderRecapSendChannel = 'whatsapp' | 'instagram' | 'snap'

interface OrderRecapModalProps {
  isOpen: boolean
  onClose: () => void
  /** Confirme la commande (le canal est ignoré en click & collect). */
  onConfirm: (channel: OrderRecapSendChannel) => void | Promise<void>
  /** @deprecated conservé pour rétrocompat ; le parcours est unique (click & collect). */
  channel?: OrderRecapSendChannel
  customer: CustomerInfo
  items: CartItem[]
  total: number
  deliveryFee: number
  discountAmount?: number
  donationAmount?: number
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
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[86] max-w-md mx-auto bg-mayssa-soft border border-mayssa-brown/10 overflow-hidden max-h-[90vh] flex flex-col"
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
          <p className="text-xs text-mayssa-brown/60 mt-1">Vérifie les infos avant de valider et payer ta commande.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-start gap-3 text-sm">
            <MapPin size={18} className="text-mayssa-caramel shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-mayssa-brown">Retrait en click &amp; collect</p>
              <p className="text-mayssa-brown/80">Galerie marchande du Carrefour — {STORE_ADDRESS_LINE}</p>
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
                const baseId = item.product.id.replace(/-\d{10,}$/, '')
                const showTrompeList = isTrompeBoxWithStoredSelection(baseId)
                const sel = item.trompeDiscoverySelection
                return (
                  <li key={item.product.id}>
                    <div>
                      {item.quantity}× {item.product.name} —{' '}
                      {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                    </div>
                    {showTrompeList && sel && sel.length > 0 && (
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-mayssa-brown text-white shadow-lg hover:bg-mayssa-espresso"
          >
            <Lock size={20} />
            {submitting ? 'Validation…' : `Confirmer · ${finalTotal.toFixed(2).replace('.', ',')} €`}
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
