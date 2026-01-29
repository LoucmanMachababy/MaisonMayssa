import { useEffect } from 'react'

const NOTIFICATION_COOLDOWN_KEY = 'maison-mayssa-last-visit'
const COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes entre chaque notification

export function useVisitorNotification() {
  useEffect(() => {
    // Vérifier si on a déjà envoyé une notification récemment
    const lastVisit = localStorage.getItem(NOTIFICATION_COOLDOWN_KEY)
    const now = Date.now()

    if (lastVisit && now - parseInt(lastVisit) < COOLDOWN_MS) {
      // Cooldown actif, ne pas envoyer de notification
      return
    }

    // Enregistrer cette visite
    localStorage.setItem(NOTIFICATION_COOLDOWN_KEY, now.toString())

    // Collecter les infos du visiteur (anonymes)
    const visitorInfo = {
      userAgent: navigator.userAgent,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
    }

    // Envoyer la notification (fire and forget)
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitorInfo),
    }).catch(() => {
      // Silently fail - ne pas perturber l'expérience utilisateur
    })
  }, [])
}
