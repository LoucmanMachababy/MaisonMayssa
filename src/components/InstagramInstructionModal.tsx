import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, MessageCircle, Copy, ChevronRight } from 'lucide-react'
import { useEscapeKey } from '../hooks/useEscapeKey'
import { hapticFeedback } from '../lib/haptics'

const INSTAGRAM_DM_URL = 'https://ig.me/m/maison.mayssa74'

interface InstagramInstructionModalProps {
  isOpen: boolean
  onClose: () => void
  messageParts?: string[]
}

export function InstagramInstructionModal({ isOpen, onClose, messageParts = [] }: InstagramInstructionModalProps) {
  useEscapeKey(onClose, isOpen)

  const [currentPart, setCurrentPart] = useState(0)
  const [copiedParts, setCopiedParts] = useState<Set<number>>(new Set([0]))
  const totalParts = messageParts.length
  const hasMultipleParts = totalParts > 1

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPart(0)
      setCopiedParts(new Set([0])) // Part 0 is already copied by handleSend
    }
  }, [isOpen])

  const handleCopyPart = async (index: number) => {
    hapticFeedback('light')
    try {
      await navigator.clipboard.writeText(messageParts[index])
      setCopiedParts(prev => new Set(prev).add(index))
      setCurrentPart(index)
    } catch {}
  }

  const handleCopyNext = async () => {
    const nextPart = currentPart + 1
    if (nextPart < totalParts) {
      await handleCopyPart(nextPart)
    }
  }

  const handleOpenDMs = () => {
    hapticFeedback('medium')
    window.open(INSTAGRAM_DM_URL, '_blank')
  }

  const allPartsCopied = copiedParts.size >= totalParts

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[70] mx-auto max-w-md pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl pointer-events-auto max-h-[85vh] overflow-y-auto">
            {/* Close button */}
            <button
              onClick={() => { hapticFeedback('light'); onClose() }}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-mayssa-brown/60 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:text-mayssa-brown hover:scale-110 active:scale-95 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center space-y-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
                  Commande Instagram
                </p>
                <h3 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  C'est presque fini !
                </h3>
                {hasMultipleParts && (
                  <p className="text-xs text-mayssa-brown/60 mt-1">
                    Ta commande fait {totalParts} messages (limite Instagram)
                  </p>
                )}
              </div>

              {/* Step 1: Message copied */}
              <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 400, delay: 0.2 }}
                  className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white"
                >
                  <Check size={20} strokeWidth={3} />
                </motion.div>
                <div>
                  <p className="font-bold text-mayssa-brown">
                    {hasMultipleParts ? `Message 1/${totalParts} copié !` : 'Message copié !'}
                  </p>
                  <p className="text-sm text-mayssa-brown/70 mt-0.5">
                    {hasMultipleParts
                      ? 'Colle-le en DM, puis reviens copier la suite.'
                      : 'Ta commande est prête dans ton presse-papier.'}
                  </p>
                </div>
              </div>

              {/* Multi-part: Copy remaining parts */}
              {hasMultipleParts && (
                <div className="space-y-2">
                  {messageParts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleCopyPart(index)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
                        copiedParts.has(index)
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-mayssa-soft/50 border border-mayssa-brown/5 hover:bg-mayssa-soft'
                      }`}
                    >
                      <div className={`flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        copiedParts.has(index) ? 'bg-emerald-500 text-white' : 'bg-mayssa-brown/10 text-mayssa-brown'
                      }`}>
                        {copiedParts.has(index) ? <Check size={14} /> : index + 1}
                      </div>
                      <span className={`flex-1 text-sm font-medium ${copiedParts.has(index) ? 'text-emerald-700' : 'text-mayssa-brown'}`}>
                        Message {index + 1}/{totalParts}
                        {copiedParts.has(index) && ' · copié'}
                      </span>
                      {!copiedParts.has(index) && <Copy size={14} className="text-mayssa-brown/40" />}
                    </button>
                  ))}

                  {!allPartsCopied && (
                    <button
                      onClick={handleCopyNext}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-mayssa-caramel/10 text-mayssa-caramel font-bold text-sm hover:bg-mayssa-caramel/20 transition-colors cursor-pointer"
                    >
                      <Copy size={16} />
                      Copier le message {currentPart + 2}/{totalParts}
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: Open Instagram */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 rounded-2xl bg-mayssa-cream/80 p-4 border border-mayssa-brown/5">
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-mayssa-brown">
                      {hasMultipleParts ? 'Colle chaque message en DM' : 'Colle-le en DM Instagram'}
                    </p>
                    <p className="text-sm text-mayssa-brown/70 mt-0.5">
                      {hasMultipleParts
                        ? 'Envoie les messages un par un dans la discussion.'
                        : 'Ouvre les messages Instagram et colle ta commande dans la discussion.'}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleOpenDMs}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white font-bold shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <MessageCircle size={20} />
                  Ouvrir les DMs Instagram
                </motion.button>
              </div>

              <p className="text-center text-xs text-mayssa-brown/50">
                Tu peux aussi coller le message (Ctrl+V ou maintenir appuyé) sur une autre app.
              </p>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}
