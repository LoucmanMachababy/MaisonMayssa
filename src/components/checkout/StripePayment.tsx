import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type {
  StripeElementsOptions,
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from '@stripe/stripe-js'
import type { PaymentIntent } from '@stripe/stripe-js'
import { Check, Loader2, Lock, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getStripePromise, STRIPE_PUBLISHABLE_KEY } from '../../lib/stripe'
import { createPaymentIntent, type PaymentIntentItem } from '../../lib/firebase'
import type { PaymentMethod } from '../../constants/checkout'

export type StripePaymentConfirmHandler = (
  method: PaymentMethod,
  paymentIntentId: string,
) => void | Promise<void>

export interface StripePaymentProps {
  total: number
  confirmed: boolean
  items: PaymentIntentItem[]
  discountAmount?: number
  donationAmount?: number
  phone?: string
  onConfirm: StripePaymentConfirmHandler
  onReset?: () => void
  className?: string
}

const stripePromise = getStripePromise()

const EXPRESS_CHECKOUT_OPTIONS = {
  paymentMethods: {
    applePay: 'auto' as const,
    googlePay: 'auto' as const,
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

function methodFromIntent(pi: PaymentIntent): PaymentMethod {
  const pm = pi.payment_method
  if (pm && typeof pm === 'object') {
    const typed = pm as { type?: string; card?: { wallet?: { type?: string } } }
    const wallet = typed.card?.wallet?.type
    if (wallet === 'apple_pay') return 'apple_pay'
    if (wallet === 'google_pay') return 'google_pay'
    if (typed.type === 'paypal') return 'paypal'
    if (typed.type === 'card') return 'card'
  }
  return 'card'
}

function itemsKey(items: PaymentIntentItem[]) {
  return items.map((i) => `${i.price}:${i.quantity}`).join('|')
}

function hasExpressWallets(event: StripeExpressCheckoutElementReadyEvent): boolean {
  const methods = event.availablePaymentMethods
  if (!methods) return false
  return Boolean(methods.applePay || methods.googlePay)
}

function StripePaymentForm({
  total,
  onConfirm,
  setPaymentError,
}: {
  total: number
  onConfirm: StripePaymentConfirmHandler
  setPaymentError: (msg: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [expressState, setExpressState] = useState<'loading' | 'ready' | 'hidden'>('loading')
  const returnUrl = `${window.location.origin}${window.location.pathname}`

  const finalizePayment = useCallback(
    async (paymentIntent: PaymentIntent) => {
      await onConfirm(methodFromIntent(paymentIntent), paymentIntent.id)
    },
    [onConfirm],
  )

  useEffect(() => {
    if (!stripe) return
    const params = new URLSearchParams(window.location.search)
    const cs = params.get('payment_intent_client_secret')
    if (!cs) return

    stripe.retrievePaymentIntent(cs).then(async ({ paymentIntent }) => {
      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        try {
          await finalizePayment(paymentIntent)
          const url = new URL(window.location.href)
          url.searchParams.delete('payment_intent')
          url.searchParams.delete('payment_intent_client_secret')
          url.searchParams.delete('redirect_status')
          window.history.replaceState({}, '', url.pathname + url.search)
        } catch {
          setPaymentError('Paiement reçu mais la commande n\'a pas pu être finalisée. Contacte-nous.')
        }
      } else if (paymentIntent?.status === 'requires_payment_method') {
        setPaymentError('Le paiement a été annulé ou refusé. Réessaie.')
      }
    })
  }, [stripe, finalizePayment, setPaymentError])

  // Ne pas bloquer l'UI si onReady ne se déclenche pas (ex. environnement sans wallet).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setExpressState((prev) => (prev === 'loading' ? 'hidden' : prev))
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [])

  const handleExpressReady = useCallback((event: StripeExpressCheckoutElementReadyEvent) => {
    setExpressState(hasExpressWallets(event) ? 'ready' : 'hidden')
  }, [])

  const handleExpressClick = useCallback((event: StripeExpressCheckoutElementClickEvent) => {
    event.resolve()
  }, [])

  const handleExpressConfirm = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (submitting || !stripe || !elements) {
        event.paymentFailed({ reason: 'fail' })
        return
      }
      setSubmitting(true)
      setPaymentError('')

      try {
        const { error: payError, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
          redirect: 'if_required',
        })

        if (payError) {
          setPaymentError(payError.message ?? 'Le paiement a échoué.')
          event.paymentFailed({ reason: 'fail', message: payError.message })
          return
        }

        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
          try {
            await finalizePayment(paymentIntent)
          } catch (err) {
            console.error('[Stripe] post-payment order:', err)
            setPaymentError('Paiement reçu mais la commande n\'a pas pu être finalisée. Contacte-nous.')
          }
          return
        }

        setPaymentError("Le paiement n'a pas pu être confirmé. Réessaie.")
        event.paymentFailed({ reason: 'fail' })
      } catch (err) {
        console.error('[Stripe] express checkout:', err)
        setPaymentError('Une erreur est survenue lors du paiement. Réessaie.')
        event.paymentFailed({ reason: 'fail' })
      } finally {
        setSubmitting(false)
      }
    },
    [elements, finalizePayment, returnUrl, setPaymentError, stripe, submitting],
  )

  const handleCardPay = async () => {
    if (submitting || !stripe || !elements) return
    setSubmitting(true)
    setPaymentError('')

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setPaymentError(submitError.message ?? 'Vérifie tes informations de paiement.')
        return
      }

      const { error: payError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      })

      if (payError) {
        setPaymentError(payError.message ?? 'Le paiement a échoué. Vérifie tes informations.')
        return
      }

      if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
        await finalizePayment(paymentIntent)
        return
      }

      setPaymentError("Le paiement n'a pas pu être confirmé. Réessaie.")
    } finally {
      setSubmitting(false)
    }
  }

  const showExpressSection = expressState !== 'hidden'

  return (
    <div className="space-y-4">
      {showExpressSection && (
        <>
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-mayssa-brown/55">
            Paiement express
          </p>
          <div className="min-h-[52px]">
            <ExpressCheckoutElement
              options={EXPRESS_CHECKOUT_OPTIONS}
              onReady={handleExpressReady}
              onClick={handleExpressClick}
              onConfirm={handleExpressConfirm}
              onLoadError={(e) => {
                console.error('[Stripe] ExpressCheckout load error:', e.error)
                setExpressState('hidden')
              }}
            />
          </div>
          {expressState === 'loading' && (
            <p className="text-center text-[10px] text-mayssa-brown/45">
              Vérification Apple Pay &amp; Google Pay…
            </p>
          )}
        </>
      )}

      {showExpressSection && expressState === 'ready' && (
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-mayssa-brown/45">
          <span className="flex-1 h-px bg-mayssa-brown/10" />
          ou par carte
          <span className="flex-1 h-px bg-mayssa-brown/10" />
        </div>
      )}

      {!showExpressSection && (
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-mayssa-brown/55">
          Paiement par carte
        </p>
      )}

      <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />

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
        Paiement 100&nbsp;% sécurisé
      </p>
    </div>
  )
}

export function StripePayment(props: StripePaymentProps) {
  const { total, confirmed, items, discountAmount, donationAmount, phone, onReset, className = '' } = props
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const intentVersionRef = useRef(0)

  const paymentKey = useMemo(
    () =>
      JSON.stringify({
        items: itemsKey(items),
        discount: discountAmount ?? 0,
        donation: donationAmount ?? 0,
        phone: phone ?? '',
      }),
    [items, discountAmount, donationAmount, phone],
  )

  useEffect(() => {
    if (confirmed) return

    const version = ++intentVersionRef.current
    setLoading(true)
    setInitError(null)
    setPaymentError(null)
    setClientSecret(null)

    createPaymentIntent({ items, discountAmount, donationAmount, phone })
      .then((r) => {
        if (intentVersionRef.current !== version) return
        setClientSecret(r.clientSecret)
      })
      .catch((e) => {
        if (intentVersionRef.current !== version) return
        console.error('[Stripe] createPaymentIntent:', e)
        const code = e && typeof e === 'object' && 'code' in e ? String((e as { code?: string }).code) : ''
        const message =
          code === 'functions/failed-precondition'
            ? 'Le paiement en ligne est temporairement indisponible. Réessaie dans quelques minutes.'
            : "Le paiement n'a pas pu être initialisé. Réessaie dans un instant."
        setInitError(message)
      })
      .finally(() => {
        if (intentVersionRef.current === version) setLoading(false)
      })
    // paymentKey résume items + remises — évite les re-fetch si la référence items change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed, paymentKey])

  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <div className={cn('rounded-xl border border-amber-200 bg-amber-50 p-4', className)}>
        <p className="text-xs text-amber-900">Clé Stripe manquante — paiement indisponible.</p>
      </div>
    )
  }

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

  if (initError) {
    return (
      <div className={cn('rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2', className)}>
        <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{initError}</p>
      </div>
    )
  }

  if (!clientSecret || loading) {
    return (
      <div className={cn('flex items-center justify-center gap-2 py-4 text-mayssa-brown/60', className)}>
        <Loader2 size={18} className="animate-spin text-mayssa-gold" />
        <span className="text-xs">Initialisation du paiement sécurisé…</span>
      </div>
    )
  }

  const elementsOptions: StripeElementsOptions = {
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

      <Elements key={clientSecret} stripe={stripePromise} options={elementsOptions}>
        <StripePaymentForm total={total} onConfirm={props.onConfirm} setPaymentError={setPaymentError} />
      </Elements>

      {paymentError && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {paymentError}
        </p>
      )}
    </div>
  )
}
