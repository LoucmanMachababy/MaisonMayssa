import { useEffect } from 'react'

const NOTIFICATION_COOLDOWN_KEY = 'maison-mayssa-last-visit'
const COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes entre chaque notification

function sendNotification() {
  const lastVisit = localStorage.getItem(NOTIFICATION_COOLDOWN_KEY)
  const now = Date.now()

  if (lastVisit && now - parseInt(lastVisit) < COOLDOWN_MS) return

  localStorage.setItem(NOTIFICATION_COOLDOWN_KEY, now.toString())

  const visitorInfo = {
    userAgent: navigator.userAgent,
    referrer: document.referrer || null,
    timestamp: new Date().toISOString(),
    screenSize: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
  }

  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitorInfo),
  }).catch(() => {})
}

export function useVisitorNotification() {
  useEffect(() => {
    // Déléguer à requestIdleCallback pour ne pas bloquer l'affichage initial
    const cb = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 0))
    cb(() => sendNotification(), { timeout: 3000 })
  }, [])
}
