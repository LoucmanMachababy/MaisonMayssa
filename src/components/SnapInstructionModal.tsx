import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Copy } from 'lucide-react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { hapticFeedback } from '../lib/haptics'
import type { CartItem, CustomerInfo } from '../types'
import { SocialOrderRecapPanel } from './SocialOrderRecapPanel'

const SNAPCHAT_USERNAME = 'mayssasucree74'
const SNAPCHAT_ADD_URL = `https://www.snapchat.com/add/${SNAPCHAT_USERNAME}`

export type SnapOrderModalData = {
  orderNumber: number
  shortPasteMessage: string
  customer: CustomerInfo
  items: CartItem[]
  finalTotal: number
  deliveryFee: number
  discountAmount: number
  donationAmount: number
}

interface SnapInstructionModalProps {
  data: SnapOrderModalData | null
  onClose: () => void
}

export function SnapInstructionModal({ data, onClose }: SnapInstructionModalProps) {
  const isOpen = data !== null
  useEscapeKey(onClose, isOpen)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) setCopied(false)
  }, [isOpen, data?.orderNumber])

  const handleCopy = async () => {
    if (!data) return
    hapticFeedback('medium')
    try {
      await navigator.clipboard.writeText(data.shortPasteMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  const handleOpenSnap = () => {
    hapticFeedback('medium')
    window.open(SNAPCHAT_ADD_URL, '_blank')
  }

  if (!data) return null

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto max-w-md pointer-events-none max-h-[90vh]"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => { hapticFeedback('light'); onClose() }}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto">
              <div className="text-center space-y-1 pr-8">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
                  Commande Snapchat
                </p>
                <h3 className="text-xl font-display font-bold text-mayssa-brown">
                  Commande enregistrée
                </h3>
                <p className="text-xs text-mayssa-brown/70 leading-relaxed">
                  Tu n&apos;as qu&apos;à <strong>copier-coller</strong> le message ci-dessous et l&apos;envoyer à{' '}
                  <strong>{SNAPCHAT_USERNAME}</strong> (avec les deux « e » dans le pseudo). Le récap complet est
                  affiché pour contrôle.
                </p>
              </div>

              <SocialOrderRecapPanel
                orderNumber={data.orderNumber}
                customer={data.customer}
                items={data.items}
                finalTotal={data.finalTotal}
                deliveryFee={data.deliveryFee}
                discountAmount={data.discountAmount}
                donationAmount={data.donationAmount}
              />

              <div className="rounded-2xl bg-[#FFFC00]/25 border border-yellow-200/80 p-3">
                <p className="text-[11px] font-semibold text-mayssa-brown mb-1">Message à envoyer (court)</p>
                <p className="text-[10px] text-mayssa-brown/55 mb-2">
                  Copié automatiquement au besoin ; sinon utilise le bouton.
                </p>
                <div className="rounded-xl bg-white/95 border border-mayssa-brown/10 p-3 max-h-28 overflow-y-auto mb-3">
                  <p className="text-xs text-mayssa-brown/90 whitespace-pre-wrap break-words font-mono leading-relaxed">
                    {data.shortPasteMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-mayssa-caramel text-mayssa-brown hover:bg-mayssa-caramel/90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={18} strokeWidth={2.5} />
                      Message copié !
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copier le message
                    </>
                  )}
                </button>
              </div>

              <a
                href={SNAPCHAT_ADD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault()
                  handleOpenSnap()
                }}
                className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl bg-[#FFFC00] text-black font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                Ouvrir Snapchat — {SNAPCHAT_USERNAME}
              </a>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
