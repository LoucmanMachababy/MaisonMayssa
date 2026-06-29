import type { Order, OrderStatus } from './firebase'

/** Commande réglée en ligne (Stripe ou simulation dev). */
export function isOrderOnlinePaid(order: Pick<Order, 'paymentStatus'>): boolean {
  return order.paymentStatus === 'paid' || order.paymentStatus === 'simulated_paid'
}

/** Statut initial : payé en ligne → commande validée (plus d'étape « en attente » admin). */
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
  return paid ? 'validee' : 'en_attente'
}

/** Commandes visibles dans l'onglet admin « Nouvelles commandes » (à traiter avant la préparation). */
export function isNewOrderInAdminQueue(order: Pick<Order, 'status'>): boolean {
  return order.status === 'en_attente' || order.status === 'validee'
}
