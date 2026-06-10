export const MM_PENDING_ORDER_KEY = 'mm_pending_order'
const PENDING_ORDER_BLOCK_MS = 48 * 60 * 60 * 1000 // 48 h

export type PendingOrderEntry = { phone: string; placedAt: number; orderNumber?: number }

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function markOrderPlaced(phone: string, orderNumber?: number): void {
  const entry: PendingOrderEntry = { phone: normalizePhone(phone), placedAt: Date.now(), orderNumber }
  try {
    localStorage.setItem(MM_PENDING_ORDER_KEY, JSON.stringify(entry))
  } catch {
    /* ignore */
  }
}

export function getPendingOrder(phone: string): PendingOrderEntry | null {
  try {
    const raw = localStorage.getItem(MM_PENDING_ORDER_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as PendingOrderEntry
    if (Date.now() - entry.placedAt > PENDING_ORDER_BLOCK_MS) {
      localStorage.removeItem(MM_PENDING_ORDER_KEY)
      return null
    }
    const normalized = normalizePhone(phone)
    if (!normalized || !entry.phone || entry.phone !== normalized) return null
    return entry
  } catch {
    return null
  }
}
