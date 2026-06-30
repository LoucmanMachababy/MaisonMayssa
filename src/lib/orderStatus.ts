import type { Order, OrderStatus } from './firebase'

/** Commande réglée en ligne (Stripe ou simulation dev). */
export function isOrderOnlinePaid(order: Pick<Order, 'paymentStatus'>): boolean {
  return order.paymentStatus === 'paid' || order.paymentStatus === 'simulated_paid'
}

/** Statut initial : toute nouvelle commande va directement en préparation. */
export function resolveInitialOrderStatus(_input?: {
  paymentMethod?: Order['paymentMethod']
  paymentStatus?: Order['paymentStatus']
  stripePaymentIntentId?: string | null
}): OrderStatus {
  return 'en_preparation'
}

/** Commandes en préparation (file active admin). Inclut legacy en_attente/validee. */
export function isNewOrderInAdminQueue(order: Pick<Order, 'status'>): boolean {
  return (
    order.status === 'en_preparation' ||
    order.status === 'validee' ||
    order.status === 'en_attente'
  )
}

/** Affichage admin : legacy → en préparation ou validée. */
export function adminOrderStatusLabel(
  status: OrderStatus | undefined,
  paidOnline = false,
): 'validee' | 'en_preparation' | 'pret' | 'livree' | 'refusee' {
  if (status === 'en_attente' || status === 'validee') return paidOnline ? 'validee' : 'en_preparation'
  if (status === 'en_preparation') return 'en_preparation'
  return status ?? 'en_preparation'
}
