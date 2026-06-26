import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { Check, Loader2, Lock, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getStripePromise } from '../../lib/stripe'
import { createPaymentIntent, type PaymentIntentItem } from '../../lib/firebase'
import type { PaymentMethod } from '../../constants/checkout'
import { PaymentWalletBadges } from './PaymentWalletBadges'

export interface StripePaymentProps {
  total: number
  confirmed: boolean
  /** Données pour recalculer le montant côté serveur (source de vérité). */
  items: PaymentIntentItem[]
  discountAmount?: number
  donationAmount?: number
  phone?: string
  onConfirm: (method: PaymentMethod) => void
  onReset?: () => void
  className?: string
}

const stripePromise = getStripePromise()

const EXPRESS_CHECKOUT_OPTIONS = {
  paymentMethods: {
    applePay: 'always' as const,
    googlePay: 'always' as const,
    link: 'never' as const,
    paypal: 'never' as const,
    amazonPay: 'never' as const,
    klarna: 'never' as const,
  },
  layout: {
    maxColumns: 2,
    maxRows: 1,
    overflow: 'never' as const,
  },
  buttonType: {
    applePay: 'buy' as const,
    googlePay: 'buy' as const,
  },
}

const PAYMENT_ELEMENT_OPTIONS = {
  layout: 'accordion' as const,
  wallets: {
    applePay: 'never' as const,
    googlePay: 'never' as const,
  },
}

/**
 * Bloc de paiement Stripe réel (Apple Pay / Google Pay en tête + carte).
 */
export function StripePayment(props: StripePaymentProps) {
  const { total, confirmed, items, discountAmount, donationAmount, phone, onReset, className = '' } = props
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestedRef = useRef(false)

  useEffect(() => {
    if (confirmed || requestedRef.current) return
    requestedRef.current = true
    createPaymentIntent({ items, discountAmount, donationAmount, phone })
      .then((r) => setClientSecret(r.clientSecret))
      .catch((e) => {
        console.error('[Stripe] createPaymentIntent:', e)
        setError("Le paiement n'a pas pu être initialisé. Réessaie dans un instant.")
        requestedRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (confirmed) {
    return (
      <div className={cn('rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-2', className)}>
        <div className="flex items-center gap-2 text-emerald-800">
          <Check size={18} className="shrink-0" />
          <p className="text-sm font-semibold">Paiement confirmé</p>
        </div>
        <p className="text-xs text-emerald-700/80">{total.toFixed(2).replace('.', ',')} € réglés</p>
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

  if (error) {
    return (
      <div className={cn('rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2', className)}>
        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{error}</p>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className={cn('space-y-3', className)}>
        <PaymentWalletBadges />
        <div className="flex items-center justify-center gap-2 py-4 text-mayssa-brown/60">
          <Loader2 size={18} className="animate-spin text-mayssa-gold" />
          <span className="text-xs">Initialisation du paiement sécurisé…</span>
        </div>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'flat',
      variables: {
        colorPrimary: '#B8860B',
        colorText: '#1E120D',
        colorBackground: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '12px',
      },
    },
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-mayssa-brown">
        <Lock size={16} className="text-mayssa-gold" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Paiement sécurisé</p>
        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
          <Lock size={9} /> Stripe
        </span>
      </div>
      <Elements stripe={stripePromise} options={options}>
        <StripePaymentInner {...props} />
      </Elements>
    </div>
  )
}

function methodFromIntent(pi: { payment_method?: unknown; payment_method_types?: string[] }): PaymentMethod {
  const pm = pi.payment_method
  const type =
    pm && typeof pm === 'object' && 'type' in pm
      ? String((pm as { type?: string }).type)
      : pi.payment_method_types?.[0]
  if (type === 'paypal') return 'paypal'
  if (type === 'card') return 'card'
  return 'card'
}

function StripePaymentInner({ total, onConfirm }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expressReady, setExpressReady] = useState(false)

  useEffect(() => {
    if (!stripe) return
    const params = new URLSearchParams(window.location.search)
    const cs = params.get('payment_intent_client_secret')
    if (!cs) return
    stripe.retrievePaymentIntent(cs).then(({ paymentIntent }) => {
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        onConfirm(methodFromIntent(paymentIntent))
      } else if (paymentIntent?.status === 'requires_payment_method') {
        setError('Le paiement a été annulé ou refusé. Réessaie.')
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripe])

  const confirmPayment = useCallback(async (): Promise<boolean> => {
    if (!stripe || !elements) return false

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Vérifie tes informations de paiement.')
      return false
    }

    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/panier`,
      },
      redirect: 'if_required',
    })

    if (payError) {
      setError(payError.message ?? 'Le paiement a échoué. Vérifie tes informations.')
      return false
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onConfirm(methodFromIntent(paymentIntent))
      return true
    }

    setError('Le paiement n\'a pas pu être confirmé. Réessaie.')
    return false
  }, [elements, onConfirm, stripe])

  const handleExpressConfirm = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    await confirmPayment()
    setSubmitting(false)
  }

  const handleCardPay = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    await confirmPayment()
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-mayssa-brown/55">
        Paiement express
      </p>

      <div className="min-h-[52px]">
        <ExpressCheckoutElement
          options={EXPRESS_CHECKOUT_OPTIONS}
          onReady={() => setExpressReady(true)}
          onConfirm={handleExpressConfirm}
        />
      </div>

      {!expressReady && <PaymentWalletBadges />}

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-mayssa-brown/45">
        <span className="flex-1 h-px bg-mayssa-brown/10" />
        ou par carte
        <span className="flex-1 h-px bg-mayssa-brown/10" />
      </div>

      <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />

      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleCardPay}
        disabled={!stripe || submitting}
        className="group relative w-full flex items-center justify-center gap-2.5 py-5 rounded-2xl bg-gradient-to-r from-mayssa-gold to-[#d4a23f] text-white text-base font-extrabold tracking-wide shadow-[0_8px_24px_rgba(184,134,11,0.35)] hover:shadow-[0_10px_30px_rgba(184,134,11,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none cursor-pointer"
      >
        {submitting ? <Loader2 size={22} className="animate-spin" /> : <Lock size={20} />}
        <span>{submitting ? 'Paiement en cours…' : `Payer ${total.toFixed(2).replace('.', ',')} €`}</span>
      </button>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-mayssa-brown/55">
        <Lock size={11} className="text-mayssa-gold" />
        Paiement 100&nbsp;% sécurisé · Apple&nbsp;Pay, Google&nbsp;Pay &amp; carte bancaire
      </p>
    </div>
  )
}
