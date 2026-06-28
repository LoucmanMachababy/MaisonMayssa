import { Lock, MapPin, CreditCard, ShoppingBag, User, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'
import { STORE_ADDRESS_LINE } from '../../constants/store'
import { CgvAcceptance } from '../legal/CgvAcceptance'

/** Libellés harmonisés desktop (4 étapes) / mobile (3 étapes). */
export const DESKTOP_CHECKOUT_STEPS = [
  { id: 1, label: 'Options', icon: Sparkles },
  { id: 2, label: 'Coordonnées', icon: User },
  { id: 3, label: 'Créneau', icon: MapPin },
  { id: 4, label: 'Paiement', icon: CreditCard },
] as const

export const MOBILE_CHECKOUT_STEPS = [
  { id: 1, label: 'Panier', icon: ShoppingBag },
  { id: 2, label: 'Coordonnées', icon: User },
  { id: 3, label: 'Paiement', icon: CreditCard },
] as const

export interface CheckoutOrderSummaryProps {
  subtotal: number
  promoDiscount?: number
  promoCode?: string
  mysteryDiscount?: number
  donation?: number
  total: number
  className?: string
  variant?: 'light' | 'dark'
}

export function CheckoutOrderSummary({
  subtotal,
  promoDiscount = 0,
  promoCode,
  mysteryDiscount = 0,
  donation = 0,
  total,
  className,
  variant = 'light',
}: CheckoutOrderSummaryProps) {
  const muted = variant === 'dark' ? 'text-white/60' : 'text-mayssa-brown/60'
  const strong = variant === 'dark' ? 'text-white/90' : 'text-mayssa-brown'
  const promo = variant === 'dark' ? 'text-emerald-300' : 'text-emerald-700'

  return (
    <div className={cn('checkout-summary space-y-2', className)}>
      <div className={cn('flex justify-between text-sm', muted)}>
        <span>Sous-total</span>
        <span className={cn('font-semibold', strong)}>{subtotal.toFixed(2).replace('.', ',')} €</span>
      </div>
      {promoDiscount > 0 && (
        <div className={cn('flex justify-between text-sm', promo)}>
          <span>Code {promoCode ? `(${promoCode})` : 'promo'}</span>
          <span className="font-semibold">-{promoDiscount.toFixed(2).replace('.', ',')} €</span>
        </div>
      )}
      {mysteryDiscount > 0 && (
        <div className={cn('flex justify-between text-sm', promo)}>
          <span>Mystère Fraise</span>
          <span className="font-semibold">-{mysteryDiscount.toFixed(2).replace('.', ',')} €</span>
        </div>
      )}
      {donation > 0 && (
        <div className={cn('flex justify-between text-sm', variant === 'dark' ? 'text-mayssa-rose' : 'text-mayssa-caramel')}>
          <span>Don au projet</span>
          <span className="font-semibold">+{donation.toFixed(2).replace('.', ',')} €</span>
        </div>
      )}
      <div className="checkout-summary__total">
        <span className="checkout-summary__total-label">Total</span>
        <span className="checkout-summary__total-value">{total.toFixed(2).replace('.', ',')} €</span>
      </div>
    </div>
  )
}

export function CheckoutJourneyCard({ className }: { className?: string }) {
  return (
    <div className={cn('checkout-journey', className)}>
      <p className="checkout-journey__title">
        <Lock size={12} className="inline mr-1.5 text-mayssa-gold" aria-hidden />
        Click &amp; collect en 4 étapes
      </p>
      <ol className="checkout-journey__steps">
        <li><span>1</span> Je choisis mes créations et mon créneau de retrait.</li>
        <li><span>2</span> Je règle en ligne (carte, Apple Pay ou Google Pay).</li>
        <li><span>3</span> Je reçois ma confirmation par e-mail.</li>
        <li><span>4</span> Je récupère à la boutique — {STORE_ADDRESS_LINE}.</li>
      </ol>
    </div>
  )
}

export interface CheckoutAlertsProps {
  hasNonTrompeLoeil?: boolean
  isClassicPreorderPhase?: boolean
  firstPickupLabel?: string
  orderCutoffPassed?: boolean
  trompeLoeilBeforeMinDate?: boolean
  minDateLabel?: string
}

export function CheckoutAlerts({
  hasNonTrompeLoeil,
  isClassicPreorderPhase,
  firstPickupLabel,
  orderCutoffPassed,
  trompeLoeilBeforeMinDate,
  minDateLabel,
}: CheckoutAlertsProps) {
  return (
    <div className="space-y-2">
      {hasNonTrompeLoeil && isClassicPreorderPhase && firstPickupLabel && (
        <p className="checkout-alert checkout-alert--info">
          Précommandes — récupération à partir du <strong>{firstPickupLabel}</strong>.
        </p>
      )}
      {orderCutoffPassed && hasNonTrompeLoeil && (
        <p className="checkout-alert checkout-alert--warning">
          Commandes (pâtisseries, cookies…) jusqu&apos;à 17h. Trompe-l&apos;œil toujours disponible.
        </p>
      )}
      {trompeLoeilBeforeMinDate && minDateLabel && (
        <p className="checkout-alert checkout-alert--warning">
          Trompe-l&apos;œil disponible à partir du {minDateLabel}.
        </p>
      )}
    </div>
  )
}

export function CheckoutPayGate({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn('checkout-alert checkout-alert--warning text-center', className)}>
      {message}
    </p>
  )
}

export function CheckoutCgv({
  checked,
  onChange,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  className?: string
}) {
  return (
    <CgvAcceptance checked={checked} onChange={onChange} className={cn('checkout-cgv', className)} />
  )
}

export function CheckoutPaymentIntro({ className }: { className?: string }) {
  return (
    <div className={cn('checkout-payment-intro', className)}>
      <p className="checkout-payment-intro__eyebrow">Étape finale</p>
      <p className="checkout-payment-intro__title">Régler ma précommande</p>
      <p className="checkout-payment-intro__hint">
        Choisis Apple Pay, Google Pay ou carte bancaire, puis valide le montant affiché.
      </p>
    </div>
  )
}
