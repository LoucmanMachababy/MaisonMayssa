import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, MessageCircle, Copy } from 'lucide-react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { hapticFeedback } from '../lib/haptics'
import type { CartItem, CustomerInfo } from '../types'
import { SocialOrderRecapPanel } from './SocialOrderRecapPanel'

const INSTAGRAM_HANDLE = 'maison_mayssa74'
const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_HANDLE}`

export type InstagramOrderModalData = {
  orderNumber: number
  shortPasteMessage: string
  customer: CustomerInfo
  items: CartItem[]
  finalTotal: number
  deliveryFee: number
  discountAmount: number
  donationAmount: number
}

interface InstagramInstructionModalProps {
  data: InstagramOrderModalData | null
  onClose: () => void
}

export function InstagramInstructionModal({ data, onClose }: InstagramInstructionModalProps) {
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

  const handleOpenDMs = () => {
    hapticFeedback('medium')
    window.open(INSTAGRAM_DM_URL, '_blank')
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
                  Commande Instagram
                </p>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Dernière étape
                </h3>
                <p className="text-xs text-mayssa-brown/70 leading-relaxed">
                  Tu n&apos;as qu&apos;à <strong>copier-coller</strong> le message ci-dessous dans un DM à{' '}
                  <strong>@{INSTAGRAM_HANDLE}</strong>. Le récap de ta commande est aussi affiché pour vérifier.
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

              <div className="rounded-2xl bg-amber-50/90 border border-amber-100 p-3">
                <p className="text-[11px] font-semibold text-mayssa-brown mb-1">Message à envoyer (court)</p>
                <p className="text-[10px] text-mayssa-brown/55 mb-2">
                  Il a été copié automatiquement ; sinon appuie sur le bouton.
                </p>
                <div className="rounded-xl bg-white/90 border border-mayssa-brown/10 p-3 max-h-28 overflow-y-auto mb-3">
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

              <div className="flex flex-col gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenDMs}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <MessageCircle size={20} />
                  Ouvrir Instagram — @{INSTAGRAM_HANDLE}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
