import { useEffect, useRef, useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { StripeElementsOptions } from '@stripe/stripe-js'
import { Check, Loader2, Lock, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getStripePromise } from '../../lib/stripe'
import { createPaymentIntent, type PaymentIntentItem } from '../../lib/firebase'
import type { PaymentMethod } from '../../constants/checkout'

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

/**
 * Bloc de paiement Stripe réel (carte + Apple Pay / Google Pay via Payment Element).
 *
 * 1. Demande un PaymentIntent au serveur (Cloud Function createPaymentIntent).
 * 2. Affiche le Payment Element avec le clientSecret retourné.
 * 3. Sur « Payer », confirme le paiement ; en cas de succès, remonte onConfirm().
 *
 * La commande n'est créée qu'après ce succès (le bouton « Payer · réserver »
 * du panier reste gardé par paymentConfirmed).
 */
export function StripePayment(props: StripePaymentProps) {
  const { total, confirmed, items, discountAmount, donationAmount, phone, onReset, className = '' } = props
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestedRef = useRef(false)

  // Crée le PaymentIntent une seule fois à l'ouverture de l'étape paiement.
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
    // items volontairement hors deps : on fige le montant à l'entrée de l'étape.
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
      <div className={cn('flex items-center justify-center gap-2 py-6 text-mayssa-brown/60', className)}>
        <Loader2 size={18} className="animate-spin text-mayssa-gold" />
        <span className="text-xs">Initialisation du paiement sécurisé…</span>
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

/** Déduit le moyen réellement utilisé à partir du PaymentIntent confirmé. */
function methodFromIntent(pi: { payment_method?: unknown; payment_method_types?: string[] }): PaymentMethod {
  const pm = pi.payment_method
  const type =
    pm && typeof pm === 'object' && 'type' in pm
      ? String((pm as { type?: string }).type)
      : pi.payment_method_types?.[0]
  if (type === 'paypal') return 'paypal'
  if (type === 'card') return 'card'
  // wallets (apple/google) remontent souvent comme 'card' — on garde 'card' par défaut.
  return 'card'
}

function StripePaymentInner({ total, onConfirm }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Retour de redirection (PayPal) : Stripe ajoute payment_intent_client_secret à l'URL.
  // Si le paiement est déjà réussi, on confirme la commande sans re-payer.
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

  const handlePay = async () => {
    if (!stripe || !elements || submitting) return
    setSubmitting(true)
    setError(null)

    // Carte / Apple Pay / Google Pay → pas de redirection (reste sur la page).
    // PayPal → redirige vers PayPal puis revient sur return_url (géré au montage).
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/panier`,
      },
      redirect: 'if_required',
    })

    if (payError) {
      setError(payError.message ?? 'Le paiement a échoué. Vérifie tes informations.')
      setSubmitting(false)
      return
    }

    if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')) {
      onConfirm(methodFromIntent(paymentIntent))
      return
    }

    setError('Le paiement n\'a pas pu être confirmé. Réessaie.')
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <p className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || submitting}
        className="group relative w-full flex items-center justify-center gap-2.5 py-5 rounded-2xl bg-gradient-to-r from-mayssa-gold to-[#d4a23f] text-white text-base font-extrabold tracking-wide shadow-[0_8px_24px_rgba(184,134,11,0.35)] hover:shadow-[0_10px_30px_rgba(184,134,11,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none cursor-pointer"
      >
        {submitting ? <Loader2 size={22} className="animate-spin" /> : <Lock size={20} />}
        <span>{submitting ? 'Paiement en cours…' : `Payer ${total.toFixed(2).replace('.', ',')} €`}</span>
      </button>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-mayssa-brown/55">
        <Lock size={11} className="text-mayssa-gold" />
        Paiement 100&nbsp;% sécurisé · carte, Apple&nbsp;Pay, Google&nbsp;Pay &amp; PayPal
      </p>
    </div>
  )
}
