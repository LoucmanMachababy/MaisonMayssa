/**
 * Statistiques de navigation / clics agrégées dans Firebase RTDB (vue admin).
 * Données anonymes, sans PII — activé après acceptation du bandeau cookies.
 */

import { ref, runTransaction, set, onValue, type Unsubscribe } from 'firebase/database'
import { db } from './firebase'

export const COOKIE_CONSENT_KEY = 'maison-mayssa-cookies-accepted'

export type SiteTrackGroup =
  | 'navigation'
  | 'cta'
  | 'product'
  | 'category'
  | 'cart'
  | 'footer'
  | 'account'
  | 'other'

export type SiteAnalyticsTarget = {
  count: number
  label?: string
  group?: SiteTrackGroup
  lastAt?: number
  lastPage?: string
}

export type SiteAnalyticsPage = {
  views: number
  label?: string
  path?: string
  lastAt?: number
}

export type SiteAnalyticsDaily = {
  views?: number
  clicks?: number
  targets?: Record<string, number>
}

export type SiteAnalyticsSnapshot = {
  targets: Record<string, SiteAnalyticsTarget>
  pages: Record<string, SiteAnalyticsPage>
  daily: Record<string, SiteAnalyticsDaily>
}

const siteAnalyticsRef = ref(db, 'siteAnalytics')

const pendingIncrements = new Map<string, number>()
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false

export function sanitizePageKey(pathname: string): string {
  const clean = pathname.split('?')[0].split('#')[0] || '/'
  return clean.replace(/\//g, '_').replace(/^_+|_+$/g, '') || 'home'
}

export function sanitizeTargetId(id: string): string {
  return id.replace(/[.#$/[\]]/g, '_').slice(0, 100)
}

export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === 'true'
  } catch {
    return false
  }
}

function queueIncrement(path: string, amount = 1): void {
  pendingIncrements.set(path, (pendingIncrements.get(path) ?? 0) + amount)
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flushPendingIncrements()
  }, 2500)
}

async function flushPendingIncrements(): Promise<void> {
  if (flushing || pendingIncrements.size === 0) return
  flushing = true
  const batch = new Map(pendingIncrements)
  pendingIncrements.clear()

  try {
    await Promise.all(
      [...batch.entries()].map(([path, amount]) =>
        runTransaction(ref(db, path), (current) => {
          const base = typeof current === 'number' ? current : 0
          return base + amount
        }),
      ),
    )
  } catch {
    for (const [path, amount] of batch) {
      pendingIncrements.set(path, (pendingIncrements.get(path) ?? 0) + amount)
    }
  } finally {
    flushing = false
    if (pendingIncrements.size > 0 && !flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null
        void flushPendingIncrements()
      }, 5000)
    }
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function trackPageView(pathname: string, title?: string): void {
  if (!hasAnalyticsConsent() || pathname.startsWith('/admin')) return

  const pageKey = sanitizePageKey(pathname)
  const day = todayKey()

  queueIncrement(`siteAnalytics/pages/${pageKey}/views`)
  queueIncrement(`siteAnalytics/daily/${day}/views`)

  void Promise.all([
    set(ref(db, `siteAnalytics/pages/${pageKey}/label`), title || pathname),
    set(ref(db, `siteAnalytics/pages/${pageKey}/path`), pathname),
    set(ref(db, `siteAnalytics/pages/${pageKey}/lastAt`), Date.now()),
  ]).catch(() => {})
}

export function trackClick(
  targetId: string,
  label: string,
  group: SiteTrackGroup,
  page?: string,
): void {
  if (!hasAnalyticsConsent() || (page?.startsWith('/admin') ?? false)) return

  const id = sanitizeTargetId(targetId)
  const day = todayKey()

  queueIncrement(`siteAnalytics/targets/${id}/count`)
  queueIncrement(`siteAnalytics/daily/${day}/clicks`)
  queueIncrement(`siteAnalytics/daily/${day}/targets/${id}`)

  void Promise.all([
    set(ref(db, `siteAnalytics/targets/${id}/label`), label.slice(0, 80)),
    set(ref(db, `siteAnalytics/targets/${id}/group`), group),
    set(ref(db, `siteAnalytics/targets/${id}/lastAt`), Date.now()),
    page ? set(ref(db, `siteAnalytics/targets/${id}/lastPage`), page) : Promise.resolve(),
  ]).catch(() => {})
}

export function trackProductView(productId: string, productName: string): void {
  trackClick(`product-view-${sanitizeTargetId(productId)}`, productName, 'product')
}

export function trackAddToCart(productId: string, productName: string): void {
  trackClick(`product-cart-${sanitizeTargetId(productId)}`, `Ajouter · ${productName}`, 'product')
}

export function listenSiteAnalytics(callback: (data: SiteAnalyticsSnapshot) => void): Unsubscribe {
  return onValue(siteAnalyticsRef, (snapshot) => {
    const raw = snapshot.val() ?? {}
    callback({
      targets: raw.targets ?? {},
      pages: raw.pages ?? {},
      daily: raw.daily ?? {},
    })
  })
}

export const SITE_TRACK_GROUP_LABELS: Record<SiteTrackGroup, string> = {
  navigation: 'Navigation',
  cta: 'Actions / boutons',
  product: 'Produits',
  category: 'Catégories',
  cart: 'Panier',
  footer: 'Pied de page',
  account: 'Compte',
  other: 'Autre',
}

export function getRecentDayKeys(days: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = 0; i < days; i += 1) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

export function aggregateTargetCountsForDays(
  daily: Record<string, SiteAnalyticsDaily>,
  dayKeys: string[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const day of dayKeys) {
    const targets = daily[day]?.targets ?? {}
    for (const [id, count] of Object.entries(targets)) {
      if (typeof count === 'number') {
        totals[id] = (totals[id] ?? 0) + count
      }
    }
  }
  return totals
}

export function aggregatePageViewsForDays(
  daily: Record<string, SiteAnalyticsDaily>,
  dayKeys: string[],
): number {
  return dayKeys.reduce((sum, day) => sum + (daily[day]?.views ?? 0), 0)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    void flushPendingIncrements()
  })
}
