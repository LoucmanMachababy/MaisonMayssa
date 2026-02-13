import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Copy } from 'lucide-react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { hapticFeedback } from '../lib/haptics'

const SNAPCHAT_ADD_URL = 'https://www.snapchat.com/add/mayssasucree74'

interface SnapInstructionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SnapInstructionModal({ isOpen, onClose }: SnapInstructionModalProps) {
  useEscapeKey(onClose, isOpen)

  const handleOpenSnap = () => {
    hapticFeedback('medium')
    window.open(SNAPCHAT_ADD_URL, '_blank')
  }

  if (!isOpen) return null

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
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto max-w-md pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto">
            <button
              type="button"
              onClick={() => { hapticFeedback('light'); onClose() }}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>

            <div className="p-6 sm:p-8">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check size={28} strokeWidth={2.5} />
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-display font-bold text-mayssa-brown text-center mb-2">
                Message copié !
              </h3>
              <p className="text-sm text-mayssa-brown/80 text-center mb-6">
                Collez le message sur Snapchat pour envoyer votre commande à Mayssa.
              </p>

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
                <Copy size={18} />
                Ouvrir Snapchat : mayssasucree74
              </a>

              <p className="text-[10px] text-mayssa-brown/50 text-center mt-4">
                Ajoute <strong>mayssasucree74</strong> et envoie-lui le message collé.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
