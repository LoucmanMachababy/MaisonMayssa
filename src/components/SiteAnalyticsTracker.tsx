import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  hasAnalyticsConsent,
  sanitizeTargetId,
  trackClick,
  trackPageView,
  type SiteTrackGroup,
} from '../lib/siteAnalytics'

const CONSENT_POLL_MS = 1500

function resolveClickTarget(el: Element) {
  const trackable = el.closest('[data-track], a[href], button, [role="button"]') as HTMLElement | null
  if (!trackable) return null
  if (trackable.closest('[data-analytics-ignore]')) return null
  if (trackable.closest('.admin-panel, [data-admin]')) return null

  const explicitId = trackable.dataset.track
  if (explicitId) {
    return {
      id: explicitId,
      label: trackable.dataset.trackLabel || trackable.getAttribute('aria-label') || trackable.textContent?.trim() || explicitId,
      group: (trackable.dataset.trackGroup as SiteTrackGroup) || 'other',
    }
  }

  if (trackable.tagName === 'A') {
    const anchor = trackable as HTMLAnchorElement
    const href = anchor.getAttribute('href') ?? ''
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return null
    }
    let path = href
    if (href.startsWith('http')) {
      try {
        const url = new URL(href)
        if (url.origin !== window.location.origin) {
          return {
            id: `link-external-${sanitizeTargetId(url.hostname)}`,
            label: anchor.textContent?.trim() || url.hostname,
            group: 'navigation' as SiteTrackGroup,
          }
        }
        path = url.pathname
      } catch {
        return null
      }
    }
    const label = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || path
    return {
      id: `link-${sanitizeTargetId(path)}`,
      label: label.slice(0, 80),
      group: 'navigation' as SiteTrackGroup,
    }
  }

  const label = trackable.getAttribute('aria-label') || trackable.textContent?.trim()
  if (!label || label.length < 2) return null

  return {
    id: `btn-${sanitizeTargetId(label)}`,
    label: label.slice(0, 80),
    group: 'cta' as SiteTrackGroup,
  }
}

/** Capture les pages vues et les clics (après consentement cookies). */
export function SiteAnalyticsTracker() {
  const location = useLocation()
  const lastPageRef = useRef<string | null>(null)
  const consentRef = useRef(hasAnalyticsConsent())

  useEffect(() => {
    const interval = window.setInterval(() => {
      consentRef.current = hasAnalyticsConsent()
    }, CONSENT_POLL_MS)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return
    if (!consentRef.current && !hasAnalyticsConsent()) return
    if (lastPageRef.current === location.pathname) return
    lastPageRef.current = location.pathname
    trackPageView(location.pathname, document.title)
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return

    const onClick = (event: MouseEvent) => {
      if (!hasAnalyticsConsent()) return
      const target = event.target
      if (!(target instanceof Element)) return
      const resolved = resolveClickTarget(target)
      if (!resolved) return
      trackClick(resolved.id, resolved.label, resolved.group, location.pathname)
    }

    document.addEventListener('click', onClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [location.pathname])

  return null
}
