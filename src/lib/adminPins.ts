const STORAGE_KEY = 'admin-pins'

export type PinnedItems = {
  orderIds: string[]
  clientPhones: string[]
}

function load(): PinnedItems {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { orderIds: [], clientPhones: [] }
    const parsed = JSON.parse(raw) as PinnedItems
    return {
      orderIds: Array.isArray(parsed.orderIds) ? parsed.orderIds : [],
      clientPhones: Array.isArray(parsed.clientPhones) ? parsed.clientPhones : [],
    }
  } catch {
    return { orderIds: [], clientPhones: [] }
  }
}

function save(data: PinnedItems) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function getPinnedOrders(): string[] {
  return load().orderIds
}

export function getPinnedClients(): string[] {
  return load().clientPhones
}

export function togglePinOrder(orderId: string): boolean {
  const data = load()
  const idx = data.orderIds.indexOf(orderId)
  if (idx >= 0) {
    data.orderIds.splice(idx, 1)
  } else {
    data.orderIds.push(orderId)
  }
  save(data)
  return data.orderIds.includes(orderId)
}

export function togglePinClient(phone: string): boolean {
  const normalized = phone.replace(/\D/g, '')
  if (!normalized) return false
  const data = load()
  const idx = data.clientPhones.indexOf(normalized)
  if (idx >= 0) {
    data.clientPhones.splice(idx, 1)
  } else {
    data.clientPhones.push(normalized)
  }
  save(data)
  return data.clientPhones.includes(normalized)
}

export function isOrderPinned(orderId: string): boolean {
  return load().orderIds.includes(orderId)
}

export function isClientPinned(phone: string): boolean {
  return load().clientPhones.includes(phone.replace(/\D/g, ''))
}
