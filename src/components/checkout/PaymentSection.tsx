import { SimulatedPayment } from './SimulatedPayment'
import { StripePayment } from './StripePayment'
import { STRIPE_LIVE, type PaymentMethod } from '../../constants/checkout'
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/stripe'
import type { PaymentIntentItem } from '../../lib/firebase'

interface PaymentSectionProps {
  total: number
  confirmed: boolean
  selectedMethod: PaymentMethod | null
  onConfirm: (method: PaymentMethod) => void
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
 * - sinon → paiement simulé (démo, aucun débit) pour ne pas bloquer la mise en ligne.
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
      onConfirm={onConfirm}
      onReset={onReset}
      className={className}
    />
  )
}
