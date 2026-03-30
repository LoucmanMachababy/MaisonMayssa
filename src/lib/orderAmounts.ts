import type { Order } from './firebase'

/** Seuil (€) : à partir de ce total, un acompte de 50 % est proposé côté admin. */
export const DEPOSIT_50_PERCENT_MIN_TOTAL_EUR = 30

/** Acompte enregistré par l’admin (€). */
export function getOrderDepositAmount(order: Order): number {
  const d = order.depositAmount
  if (d == null || d <= 0 || Number.isNaN(d)) return 0
  return Math.round(d * 100) / 100
}

/** Montant d’acompte conseillé (50 % du total), ou `null` si la commande est sous le seuil. */
export function getSuggestedDeposit50Percent(order: Order): number | null {
  const t = order.total ?? 0
  if (t < DEPOSIT_50_PERCENT_MIN_TOTAL_EUR || Number.isNaN(t)) return null
  return Math.round(t * 0.5 * 100) / 100
}

/** L’acompte enregistré correspond au demi-total (règle 50 %). */
export function isDepositMatchingSuggested50(order: Order): boolean {
  const s = getSuggestedDeposit50Percent(order)
  if (s == null) return false
  const d = getOrderDepositAmount(order)
  return Math.abs(d - s) < 0.005
}

/** Montant encore dû : total commande − acompte (≥ 0). */
export function getOrderRemainingToPay(order: Order): number {
  const total = order.total ?? 0
  const deposit = getOrderDepositAmount(order)
  return Math.max(0, Math.round((total - deposit) * 100) / 100)
}
