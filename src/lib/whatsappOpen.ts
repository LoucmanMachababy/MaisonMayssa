/**
 * Ouvre WhatsApp avec un texte prérempli. Si l’URL dépasse la limite prudente des navigateurs / WhatsApp,
 * copie le message complet dans le presse-papiers et ouvre WhatsApp avec un court rappel à coller.
 *
 * `preOpenedWindow` : onglet ouvert au geste utilisateur (avant un `await`) pour éviter le blocage popup ;
 * on y assigne ensuite `location.href` vers wa.me.
 */
const SAFE_WA_URL_MAX = 2000

export function openWhatsAppWithPrefilledMessage(
  phoneE164: string,
  message: string,
  shortFallbackText: string,
  preOpenedWindow?: Window | null,
): { opened: boolean; usedClipboardFallback: boolean } {
  const digits = phoneE164.replace(/\D/g, '')
  if (!digits || !message.trim()) {
    return { opened: false, usedClipboardFallback: false }
  }

  let tryUrl = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  let usedClipboardFallback = false
  if (tryUrl.length > SAFE_WA_URL_MAX) {
    void navigator.clipboard.writeText(message).catch(() => {})
    tryUrl = `https://wa.me/${digits}?text=${encodeURIComponent(shortFallbackText)}`
    usedClipboardFallback = true
  }

  if (preOpenedWindow && !preOpenedWindow.closed) {
    try {
      preOpenedWindow.location.href = tryUrl
      return { opened: true, usedClipboardFallback }
    } catch {
      /* navigate from opener peut échouer (politique navigateur) */
    }
  }

  const w = window.open(tryUrl, '_blank', 'noopener,noreferrer')
  return { opened: !!w, usedClipboardFallback }
}
