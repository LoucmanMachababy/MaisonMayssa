/** Click & collect uniquement — livraison à domicile désactivée. */
export const CLICK_COLLECT_ONLY = true

/**
 * Gestion de stock désactivée : production à la commande, aucune limite de
 * quantité. Quand `false`, getStock() renvoie toujours « illimité » → plus de
 * badge « épuisé », plus de blocage « stock insuffisant » au paiement.
 */
export const STOCK_ENABLED = false

/**
 * Limite anti-double-commande (1 commande / 48 h par numéro). Désactivée :
 * un client peut enchaîner plusieurs commandes sans blocage.
 */
export const ORDER_LIMIT_ENABLED = false

/**
 * Paiement en ligne (carte / Apple Pay) via Stripe.
 *
 * Le parcours UI est prêt : le client choisit son moyen de paiement et
 * valide. Tant que `STRIPE_LIVE` est `false`, le paiement est *simulé*
 * (aucun débit réel) — la commande est enregistrée comme payée pour ne
 * pas bloquer la mise en ligne. Passer `STRIPE_LIVE` à `true` une fois
 * l'endpoint Stripe (Payment Intent + webhook) branché côté serveur.
 */
export const PAYMENT_ENABLED = true

/**
 * Bascule sur le vrai Stripe (clés de test actives).
 * Nécessite que la Cloud Function `createPaymentIntent` soit accessible
 * (déployée via `firebase deploy --only functions`, ou émulateur en dev).
 */
export const STRIPE_LIVE = true

/** Le paiement reste un préalable à la validation (carte / Apple Pay). */
export function isPaymentConfirmedByDefault(): boolean {
  return false
}

export const GOOGLE_REVIEWS_URL = 'https://share.google/SnbgYqcKXwUSRqx29'

/** Moyens de paiement proposés au checkout (via Stripe). */
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'paypal'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Carte bancaire',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  paypal: 'PayPal',
}

// --- Rétrocompat (transition) ------------------------------------------
/** @deprecated alias de {@link PaymentMethod} — conservé le temps de la migration. */
export type SimulatedPaymentMethod = PaymentMethod
/** @deprecated le paiement est désormais toujours actif ; utiliser {@link PAYMENT_ENABLED}. */
export const SIMULATED_PAYMENT_ENABLED = PAYMENT_ENABLED
/** @deprecated le paiement n'est plus bloqué ; conservé pour rétrocompat. */
export const ONLINE_PAYMENT_UNAVAILABLE = false
