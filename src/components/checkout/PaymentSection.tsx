import { SimulatedPayment } from './SimulatedPayment'
import { StripePayment } from './StripePayment'
import type { StripePaymentConfirmHandler } from './StripePayment'
import { STRIPE_LIVE, type PaymentMethod } from '../../constants/checkout'
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/stripe'
import type { PaymentIntentItem } from '../../lib/firebase'
import { AlertCircle } from 'lucide-react'

interface PaymentSectionProps {
  total: number
  confirmed: boolean
  selectedMethod: PaymentMethod | null
  onConfirm: StripePaymentConfirmHandler
  onReset?: () => void
  /** Détail du panier pour le calcul serveur du PaymentIntent. */
  items: PaymentIntentItem[]
  discountAmount?: number
  donationAmount?: number
  phone?: string
  className?: string
}

/**
 * Aiguille entre le vrai paiement Stripe et le paiement simulé.
 *
 * - STRIPE_LIVE === true ET clé publiable présente → Stripe Payment Element réel.
 * - STRIPE_LIVE sans clé → message d'erreur explicite (pas de faux paiement en prod).
 * - sinon → paiement simulé (démo locale uniquement).
 */
export function PaymentSection({
  total,
  confirmed,
  selectedMethod,
  onConfirm,
  onReset,
  items,
  discountAmount,
  donationAmount,
  phone,
  className,
}: PaymentSectionProps) {
  const useRealStripe = STRIPE_LIVE && !!STRIPE_PUBLISHABLE_KEY
  const stripeMisconfigured = STRIPE_LIVE && !STRIPE_PUBLISHABLE_KEY

  if (stripeMisconfigured) {
    return (
      <div className={`rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2 ${className ?? ''}`}>
        <AlertCircle size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900">Paiement en ligne indisponible</p>
          <p className="text-xs text-amber-800/90 leading-relaxed">
            La configuration Stripe du site est incomplète. Le paiement par carte et Apple Pay ne peut pas
            être activé pour le moment. Réessaie plus tard ou contacte la boutique.
          </p>
        </div>
      </div>
    )
  }

  if (useRealStripe) {
    return (
      <StripePayment
        total={total}
        confirmed={confirmed}
        items={items}
        discountAmount={discountAmount}
        donationAmount={donationAmount}
        phone={phone}
        onConfirm={onConfirm}
        onReset={onReset}
        className={className}
      />
    )
  }

  return (
    <SimulatedPayment
      total={total}
      confirmed={confirmed}
      selectedMethod={selectedMethod}
      onConfirm={(method) => onConfirm(method, `simulated_${method}`)}
      onReset={onReset}
      className={className}
    />
  )
}
