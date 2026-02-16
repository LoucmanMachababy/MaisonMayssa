import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Copy } from 'lucide-react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { hapticFeedback } from '../lib/haptics'

const SNAPCHAT_ADD_URL = 'https://www.snapchat.com/add/mayssasucree74'

interface SnapInstructionModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

export function SnapInstructionModal({ isOpen, onClose, message }: SnapInstructionModalProps) {
  useEscapeKey(onClose, isOpen)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    hapticFeedback('medium')
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

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
              <h3 className="text-lg sm:text-xl font-display font-bold text-mayssa-brown text-center mb-2">
                Commande enregistrée !
              </h3>
              <p className="text-sm text-mayssa-brown/80 text-center mb-4">
                1. Copiez le message ci-dessous
                <br />
                2. Ouvrez Snapchat et collez-le à Mayssa
              </p>

              {/* Bouton Copier — bien visible pour que le client comprenne */}
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-2xl font-bold text-sm shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer mb-4 ${
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

              <div className="rounded-xl bg-mayssa-soft/50 border border-mayssa-brown/10 p-3 mb-4 max-h-32 overflow-y-auto">
                <p className="text-xs text-mayssa-brown/80 whitespace-pre-wrap break-words font-mono">
                  {message.slice(0, 200)}
                  {message.length > 200 ? '…' : ''}
                </p>
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
                Ouvrir Snapchat : mayssasucree74
              </a>

              <p className="text-[10px] text-mayssa-brown/50 text-center mt-4">
                Ajoute <strong>mayssasucree74</strong> et envoie-lui le message copié.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
