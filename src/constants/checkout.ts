/** Click & collect uniquement — livraison et retrait à domicile désactivés. */
export const CLICK_COLLECT_ONLY = true

/** Paiement en ligne simulé (Stripe / Apple Pay / Google Pay) — réactiver quand prêt. */
export const SIMULATED_PAYMENT_ENABLED = false

/** Affiche « Paiement indisponible » et bloque la validation de commande. */
export const ONLINE_PAYMENT_UNAVAILABLE = true

export function isPaymentConfirmedByDefault(): boolean {
  return !SIMULATED_PAYMENT_ENABLED && !ONLINE_PAYMENT_UNAVAILABLE
}

export const GOOGLE_REVIEWS_URL = 'https://share.google/SnbgYqcKXwUSRqx29'

export type SimulatedPaymentMethod = 'card' | 'apple_pay' | 'google_pay'
