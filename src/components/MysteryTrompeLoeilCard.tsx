import { useState } from 'react'
import { motion } from 'framer-motion'
import { HelpCircle, Sparkles } from 'lucide-react'
import type { Product } from '../types'
import { submitMysteryGuess } from '../lib/firebase'
import { ProductBadges } from './ProductBadges'
import { hapticFeedback } from '../lib/haptics'

const PARFUM_OPTIONS = ['Gousse de vanille', 'Fraise', 'Myrtilles'] as const

interface MysteryTrompeLoeilCardProps {
  product: Product
  onAdd?: (product: Product) => void
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function MysteryTrompeLoeilCard({ product, onToast }: MysteryTrompeLoeilCardProps) {
  const [guess, setGuess] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!guess || submitting) return
    hapticFeedback('medium')
    setSubmitting(true)
    try {
      const res = await submitMysteryGuess(guess)
      if (res.success && res.winner) {
        onToast('Bravo ! Tu as 10 % de réduction sur le Trompe l\'oeil Fraise pour ta prochaine commande.', 'success')
        setGuess('')
      } else if (res.success && res.alreadyRevealed) {
        onToast('Déjà trouvé ! C\'est le Trompe l\'oeil Fraise.', 'info')
      } else if (res.success) {
        onToast('Bien vu, c\'est la Fraise ! Connecte-toi pour pouvoir bénéficier des 10 %.', 'info')
      } else if (res.error === 'wrong') {
        onToast("Ce n'est pas celui-là… Réessaie !", 'error')
      } else {
        onToast('Une erreur est survenue.', 'error')
      }
    } catch (err) {
      console.error('[Mystery] submitMysteryGuess:', err)
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : ''
      const isCorsOrInternal = msg.includes('internal') || msg.includes('CORS') || msg.includes('fetch')
      const hint = typeof window !== 'undefined' && window.location.origin.includes('localhost') && isCorsOrInternal
        ? ' En local : utilise les émulateurs (docs/TEST-EMULATEUR.md).'
        : ''
      onToast((msg ? `Erreur : ${msg}.` : 'Erreur de connexion.') + hint, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col gap-3 sm:gap-4 overflow-hidden rounded-2xl sm:rounded-[2rem] bg-white/60 p-3 sm:p-4 shadow-xl ring-1 ring-white/40"
    >
      <div className="absolute top-4 right-4 z-10">
        <ProductBadges badges={product.badges ?? []} />
      </div>

      {/* Placeholder image */}
      <div className="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-mayssa-soft to-mayssa-caramel/20 flex items-center justify-center">
        <HelpCircle size={64} className="text-mayssa-brown/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl sm:text-7xl font-display font-bold text-mayssa-brown/20">?</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-mayssa-caramel">
          <Sparkles size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Nouveauté</span>
        </div>
        <h3 className="font-display font-bold text-mayssa-brown text-lg sm:text-xl">
          Trompe l&apos;oeil mystère
        </h3>
        <p className="text-xs text-mayssa-brown/70">
          Devine le parfum et gagne <strong>10 % de réduction</strong> dessus (premier à trouver) !
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" onClick={(e) => e.stopPropagation()}>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/60">
          Quel parfum ?
        </label>
        <select
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          className="w-full rounded-xl border border-mayssa-brown/20 bg-white px-3 py-2.5 text-sm font-medium text-mayssa-brown focus:outline-none focus:ring-2 focus:ring-mayssa-caramel cursor-pointer"
          required
        >
          <option value="">Choisir…</option>
          {PARFUM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting || !guess}
          className="w-full py-2.5 rounded-xl bg-mayssa-brown text-white text-sm font-bold hover:bg-mayssa-caramel transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Vérification…' : 'Vérifier'}
        </button>
      </form>

      <p className="text-[10px] text-mayssa-brown/50">
        {product.price.toFixed(2).replace('.', ',')} € · Précommande
      </p>
    </motion.article>
  )
}
