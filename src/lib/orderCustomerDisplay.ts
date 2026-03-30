import type { Order } from './firebase'
import { normalizeInstagramHandle } from './delivery'

/** Libellé client pour listes admin : @pseudo pour Instagram, etc. */
export function formatOrderCustomerDisplayName(order: Pick<Order, 'customer' | 'source'>): string {
  const c = order.customer
  const src = order.source ?? 'site'
  if (src === 'instagram') {
    const raw = c.contactHandle?.trim() || c.firstName?.trim()
    if (raw) return `@${normalizeInstagramHandle(raw)}`
  }
  if (src === 'snap' && (c.contactHandle?.trim() || c.firstName?.trim())) {
    return `Snap : ${(c.contactHandle ?? c.firstName).trim()}`
  }
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return full || 'Client'
}
