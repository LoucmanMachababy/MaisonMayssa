/**
 * Analytics centralisé : Firebase Analytics + événements conversion
 * Fonctions no-op si analytics non initialisé (dev, etc.)
 */

let analyticsInitialized = false

export async function initAnalytics(): Promise<void> {
  if (analyticsInitialized) return
  try {
    const { getAnalytics } = await import('firebase/analytics')
    const { app } = await import('./firebase')
    const analytics = getAnalytics(app)
    ;(window as unknown as { _firebaseAnalytics?: unknown })._firebaseAnalytics = analytics
    analyticsInitialized = true
  } catch {
    // Firebase Analytics non dispo (clés manquantes, etc.)
  }
}

function getAnalyticsInstance(): { logEvent: (name: string, params?: Record<string, unknown>) => void } | null {
  const ga = (window as unknown as { _firebaseAnalytics?: { logEvent: (n: string, p?: Record<string, unknown>) => void } })._firebaseAnalytics
  return ga && typeof ga.logEvent === 'function' ? ga : null
}

export function logEvent(name: string, params?: Record<string, unknown>): void {
  try {
    getAnalyticsInstance()?.logEvent(name, params)
  } catch {
    // ignore
  }
}

// Événements conversion
export const AnalyticsEvents = {
  add_to_cart: (productId: string, name: string, price: number, quantity: number) =>
    logEvent('add_to_cart', { item_id: productId, item_name: name, price, quantity }),

  view_cart: (itemCount: number, total: number) =>
    logEvent('view_cart', { item_count: itemCount, total }),

  begin_checkout: (itemCount: number, total: number) =>
    logEvent('begin_checkout', { item_count: itemCount, total }),

  send_to_whatsapp: (orderId: string, total: number) =>
    logEvent('send_to_whatsapp', { order_id: orderId, total }),

  sign_up: (method: string) =>
    logEvent('sign_up', { method }),

  login: (method: string) =>
    logEvent('login', { method }),

  page_view: (page: string, title?: string) =>
    logEvent('page_view', { page_title: title ?? page }),
}
