import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, MapPin, Calendar } from 'lucide-react'
import type { CartItem, CustomerInfo } from '../types'
import { formatDateYyyyMmDdToFrench } from '../lib/utils'
import { useFocusTrap } from '../hooks/useAccessibility'
import { useRef } from 'react'

interface OrderRecapModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
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
  customer,
  items,
  total,
  deliveryFee,
  discountAmount = 0,
  donationAmount = 0,
}: OrderRecapModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap(modalRef, isOpen, onClose)

  const finalTotal = total - discountAmount + deliveryFee + donationAmount
  const modeLabel = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'

  const handleConfirm = () => {
    onConfirm()
    onClose()
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
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
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
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[61] max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
          <p className="text-xs text-mayssa-brown/60 mt-1">
            Vérifie les infos avant d&apos;envoyer sur WhatsApp.
          </p>
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
            <ul className="space-y-1 text-sm text-mayssa-brown/80">
              {items.map((item) => (
                <li key={item.product.id}>
                  {item.quantity}× {item.product.name} — {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
                </li>
              ))}
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#25D366] text-white font-bold shadow-lg hover:bg-[#20bd5a] transition-colors cursor-pointer"
          >
            <MessageCircle size={20} />
            Envoyer sur WhatsApp
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-medium text-mayssa-brown/70 hover:text-mayssa-brown hover:bg-mayssa-soft/50 transition-colors cursor-pointer"
          >
            Modifier ma commande
          </button>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
