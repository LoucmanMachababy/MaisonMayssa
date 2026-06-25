import { loadStripe, type Stripe } from '@stripe/stripe-js'

/** Clé publiable Stripe (sûre côté front). Vide si non configurée → mode simulé. */
export const STRIPE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''

let _stripePromise: Promise<Stripe | null> | null = null

/** Singleton loadStripe — ne recharge pas le script à chaque rendu. */
export function getStripePromise(): Promise<Stripe | null> {
  if (!STRIPE_PUBLISHABLE_KEY) return Promise.resolve(null)
  if (!_stripePromise) _stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  return _stripePromise
}
