import { useState } from 'react'
import { CreditCard, Check, Loader2, Lock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { STRIPE_LIVE, type PaymentMethod } from '../../constants/checkout'
import {
  SimulatedApplePayButton,
  SimulatedGooglePayButton,
} from './PaymentWalletBadges'

interface SimulatedPaymentProps {
  total: number
  confirmed: boolean
  selectedMethod: PaymentMethod | null
  onConfirm: (method: PaymentMethod) => void
  onReset?: () => void
  className?: string
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Carte bancaire',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
}

/**
 * Paiement simulé (démo) quand Stripe n'est pas configuré.
 * Affiche Apple Pay et Google Pay de façon visible.
 */
export function SimulatedPayment({
  total,
  confirmed,
  selectedMethod,
  onConfirm,
  onReset,
  className = '',
}: SimulatedPaymentProps) {
  const [loading, setLoading] = useState<PaymentMethod | null>(null)

  const handlePay = async (method: PaymentMethod) => {
    if (confirmed || loading) return
    setLoading(method)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(null)
    onConfirm(method)
  }

  if (confirmed && selectedMethod) {
    const label = METHOD_LABELS[selectedMethod] ?? 'Paiement'
    return (
      <div className={cn('rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2', className)}>
        <div className="flex items-center gap-2 text-emerald-800">
          <Check size={18} className="shrink-0" />
          <p className="text-sm font-semibold">Paiement confirmé</p>
        </div>
        <p className="text-xs text-emerald-700/80">
          {label} · {total.toFixed(2).replace('.', ',')} €
        </p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-[10px] text-emerald-800/70 underline hover:text-emerald-900 cursor-pointer"
          >
            Changer de moyen de paiement
          </button>
        )}
      </div>
    )
  }

  const busy = !!loading

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-mayssa-brown">
        <CreditCard size={16} className="text-mayssa-gold" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Paiement sécurisé</p>
        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
          <Lock size={9} /> Stripe
        </span>
      </div>

      <p className="text-[10px] text-mayssa-brown/60 leading-relaxed">
        Réglez votre commande en ligne pour réserver votre retrait en click &amp; collect.
        {!STRIPE_LIVE && ' Paiement de démonstration — aucun montant débité pour le moment.'}
      </p>

      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-mayssa-brown/55">
        Paiement express
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SimulatedApplePayButton
          loading={loading === 'apple_pay'}
          disabled={busy}
          onClick={() => handlePay('apple_pay')}
        />
        <SimulatedGooglePayButton
          loading={loading === 'google_pay'}
          disabled={busy}
          onClick={() => handlePay('google_pay')}
        />
      </div>

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-mayssa-brown/45">
        <span className="flex-1 h-px bg-mayssa-brown/10" />
        ou par carte
        <span className="flex-1 h-px bg-mayssa-brown/10" />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => handlePay('card')}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-4 transition-all cursor-pointer min-h-[72px]',
          loading === 'card'
            ? 'border-mayssa-gold bg-mayssa-gold/10'
            : 'border-mayssa-brown/10 bg-white hover:border-mayssa-gold/50 hover:bg-mayssa-soft/50',
        )}
      >
        {loading === 'card' ? (
          <Loader2 size={20} className="animate-spin text-mayssa-gold" />
        ) : (
          <CreditCard size={20} className="text-mayssa-brown" />
        )}
        <span className="text-[10px] font-bold text-mayssa-brown text-center leading-tight">Carte bancaire</span>
        <span className="text-[9px] text-mayssa-brown/45">Visa · Mastercard · CB</span>
      </button>

      <p className="text-[9px] text-mayssa-brown/45 text-center">
        Total à régler : <strong className="text-mayssa-brown">{total.toFixed(2).replace('.', ',')} €</strong>
      </p>
    </div>
  )
}
