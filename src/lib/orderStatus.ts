import type { Order, OrderStatus } from './firebase'

/** Commande réglée en ligne (Stripe ou simulation dev). */
export function isOrderOnlinePaid(order: Pick<Order, 'paymentStatus'>): boolean {
  return order.paymentStatus === 'paid' || order.paymentStatus === 'simulated_paid'
}

/** Statut initial : payé en ligne → directement en préparation (plus de validation manuelle). */
export function resolveInitialOrderStatus(input: {
  paymentMethod?: Order['paymentMethod']
  paymentStatus?: Order['paymentStatus']
  stripePaymentIntentId?: string | null
}): OrderStatus {
  const paid =
    input.paymentStatus === 'paid' ||
    input.paymentStatus === 'simulated_paid' ||
    !!input.stripePaymentIntentId ||
    !!input.paymentMethod
  return paid ? 'en_preparation' : 'en_attente'
}
