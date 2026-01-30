import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, X } from 'lucide-react'
import { hapticFeedback } from '../../lib/haptics'

interface VoiceSearchProps {
  onResult: (text: string) => void
  isActive: boolean
  onToggle: () => void
}

// Check if speech recognition is supported
const SpeechRecognition = typeof window !== 'undefined'
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null

const INIT_TIMEOUT_MS = 4000

export function VoiceSearch({ onResult, isActive, onToggle }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognition>> | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Start recognition on user gesture (required by Chrome/Safari)
  const startListening = useCallback(() => {
    if (!SpeechRecognition) return
    setError(null)
    setTranscript('')
    setIsListening(false)

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      hapticFeedback('medium')
    }

    recognition.onresult = (event: any) => {
      const current = event.resultIndex
      const result = event.results[current]
      const text = result[0].transcript

      setTranscript(text)

      if (result.isFinal) {
        onResultRef.current(text)
        hapticFeedback('success')
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      const msg = event.error === 'not-allowed'
        ? 'Autorisez l\'accès au micro dans les paramètres du navigateur.'
        : event.error === 'no-speech'
        ? 'Aucune parole détectée. Réessayez.'
        : 'Recherche vocale indisponible. Réessayez.'
      setError(msg)
      hapticFeedback('warning')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) {
      setError('Impossible de démarrer le micro.')
      hapticFeedback('warning')
    }
  }, [])

  const handleToggleClick = useCallback(() => {
    hapticFeedback('light')
    if (!isActive) {
      startListening()
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (_) {}
        recognitionRef.current = null
      }
    }
    onToggle()
  }, [isActive, onToggle, startListening])

  useEffect(() => {
    if (!isActive || isListening || error) return
    const t = setTimeout(() => {
      setError('Le micro met trop de temps à répondre. Vérifiez les autorisations ou réessayez.')
      hapticFeedback('warning')
    }, INIT_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [isActive, isListening, error])

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (_) {}
        recognitionRef.current = null
      }
      setError(null)
      setTranscript('')
    }
  }, [isActive])

  if (!isSupported) return null

  return (
    <>
      {/* Voice button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleToggleClick}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
          isActive
            ? 'bg-mayssa-caramel text-white'
            : 'bg-white/60 text-mayssa-brown/60 hover:bg-white'
        }`}
      >
        {isActive ? <MicOff size={18} /> : <Mic size={18} />}
      </motion.button>

      {/* Full screen listening overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-mayssa-brown/95 backdrop-blur-lg flex flex-col items-center justify-center p-8 md:hidden"
          >
            {/* Close button */}
            <button
              onClick={handleToggleClick}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X size={20} />
            </button>

            {/* Listening animation */}
            <div className="relative mb-8">
              {/* Pulse rings */}
              {isListening && (
                <>
                  <motion.div
                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-mayssa-caramel"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="absolute inset-0 rounded-full bg-mayssa-caramel"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    className="absolute inset-0 rounded-full bg-mayssa-caramel"
                  />
                </>
              )}

              {/* Mic icon */}
              <motion.div
                animate={isListening ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-mayssa-caramel shadow-2xl"
              >
                <Mic size={40} className="text-white" />
              </motion.div>
            </div>

            {/* Status text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-white/80 text-lg font-medium mb-4 text-center px-4"
            >
              {error
                ? error
                : isListening
                ? "J'écoute..."
                : 'Initialisation...'}
            </motion.p>
            {error && (
              <p className="text-white/60 text-sm mb-2">
                Cliquez sur le micro pour réessayer.
              </p>
            )}

            {/* Transcript */}
            <AnimatePresence mode="wait">
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  <p className="text-2xl font-display text-white mb-2">
                    "{transcript}"
                  </p>
                  <p className="text-white/50 text-sm">
                    Recherche en cours...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hint */}
            <p className="absolute bottom-8 text-white/40 text-sm text-center px-8">
              Dis le nom d'un produit, par exemple : "Tiramisu" ou "Cookie"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook for using voice search
export function useVoiceSearch(onSearch: (query: string) => void) {
  const [isVoiceActive, setIsVoiceActive] = useState(false)

  const handleVoiceResult = useCallback((text: string) => {
    onSearch(text)
    setIsVoiceActive(false)
  }, [onSearch])

  const toggleVoice = useCallback(() => {
    setIsVoiceActive((prev) => !prev)
  }, [])

  return {
    isVoiceActive,
    toggleVoice,
    handleVoiceResult,
  }
}
