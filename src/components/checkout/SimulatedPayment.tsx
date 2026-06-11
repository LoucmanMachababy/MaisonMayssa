import { useState } from 'react'
import { CreditCard, Check, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { SimulatedPaymentMethod } from '../../constants/checkout'

interface SimulatedPaymentProps {
  total: number
  confirmed: boolean
  selectedMethod: SimulatedPaymentMethod | null
  onConfirm: (method: SimulatedPaymentMethod) => void
  onReset?: () => void
  className?: string
}

const METHODS: { id: SimulatedPaymentMethod; label: string; sub: string; icon: string }[] = [
  { id: 'card', label: 'Carte bancaire', sub: 'Stripe (simulation)', icon: '💳' },
  { id: 'apple_pay', label: 'Apple Pay', sub: 'Paiement sécurisé', icon: '' },
  { id: 'google_pay', label: 'Google Pay', sub: 'Paiement sécurisé', icon: 'G' },
]

export function SimulatedPayment({
  total,
  confirmed,
  selectedMethod,
  onConfirm,
  onReset,
  className = '',
}: SimulatedPaymentProps) {
  const [loading, setLoading] = useState<SimulatedPaymentMethod | null>(null)

  const handlePay = async (method: SimulatedPaymentMethod) => {
    if (confirmed || loading) return
    setLoading(method)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(null)
    onConfirm(method)
  }

  if (confirmed && selectedMethod) {
    const label = METHODS.find((m) => m.id === selectedMethod)?.label ?? 'Paiement'
    return (
      <div className={cn('rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2', className)}>
        <div className="flex items-center gap-2 text-emerald-800">
          <Check size={18} className="shrink-0" />
          <p className="text-sm font-semibold">Paiement simulé confirmé</p>
        </div>
        <p className="text-xs text-emerald-700/80">
          {label} · {total.toFixed(2).replace('.', ',')} € — mode démo (aucun débit réel).
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

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-mayssa-brown">
        <CreditCard size={16} className="text-mayssa-gold" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Paiement en ligne</p>
        <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Simulation</span>
      </div>
      <p className="text-[10px] text-mayssa-brown/60 leading-relaxed">
        Choisissez un moyen de paiement pour valider votre commande. Intégration Stripe à venir — aucun montant ne sera débité.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {METHODS.map((method) => (
          <button
            key={method.id}
            type="button"
            disabled={!!loading}
            onClick={() => handlePay(method.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-4 transition-all cursor-pointer min-h-[72px]',
              loading === method.id
                ? 'border-mayssa-gold bg-mayssa-gold/10'
                : 'border-mayssa-brown/10 bg-white hover:border-mayssa-gold/50 hover:bg-mayssa-soft/50',
            )}
          >
            {loading === method.id ? (
              <Loader2 size={20} className="animate-spin text-mayssa-gold" />
            ) : method.id === 'apple_pay' ? (
              <span className="text-sm font-semibold tracking-tight">Apple Pay</span>
            ) : method.id === 'google_pay' ? (
              <span className="text-sm font-bold">
                <span className="text-blue-600">G</span> Pay
              </span>
            ) : (
              <span className="text-xl">{method.icon}</span>
            )}
            <span className="text-[10px] font-bold text-mayssa-brown text-center leading-tight">{method.label}</span>
            <span className="text-[9px] text-mayssa-brown/45">{method.sub}</span>
          </button>
        ))}
      </div>
      <p className="text-[9px] text-mayssa-brown/45 text-center">
        Total à régler : <strong className="text-mayssa-brown">{total.toFixed(2).replace('.', ',')} €</strong>
      </p>
    </div>
  )
}
