/**
 * Ouvre WhatsApp avec un texte prérempli. Si l’URL dépasse la limite prudente des navigateurs / WhatsApp,
 * copie le message complet dans le presse-papiers et ouvre WhatsApp avec un court rappel à coller.
 *
 * `preOpenedWindow` : onglet ouvert au geste utilisateur (avant un `await`) pour éviter le blocage popup ;
 * on y assigne ensuite `location.href` vers wa.me.
 */
const SAFE_WA_URL_MAX = 2000

/**
 * Lien pour ouvrir une conversation WhatsApp avec texte prérempli.
 * Sur **Android**, tente d’ouvrir **WhatsApp Business** (`com.whatsapp.w4b`) via une URL intent ;
 * si l’app n’est pas là, le navigateur utilise `S.browser_fallback_url` vers `wa.me`.
 * Sur iOS et ailleurs : `https://wa.me/...` (l’OS ouvre l’app définie par défaut pour les liens https).
 */
export function buildWhatsAppChatHref(phoneDigitsOrRaw: string, message: string): string {
  const digits = phoneDigitsOrRaw.replace(/\D/g, '')
  if (!digits) return 'https://wa.me/'
  const textEnc = encodeURIComponent(message)
  const httpsUrl = `https://wa.me/${digits}?text=${textEnc}`
  if (typeof navigator === 'undefined' || !/Android/i.test(navigator.userAgent)) {
    return httpsUrl
  }
  const fallbackEnc = encodeURIComponent(httpsUrl)
  return `intent://send?phone=${digits}&text=${textEnc}#Intent;scheme=whatsapp;package=com.whatsapp.w4b;S.browser_fallback_url=${fallbackEnc};end`
}

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

  let tryUrl = buildWhatsAppChatHref(digits, message)
  let usedClipboardFallback = false
  if (tryUrl.length > SAFE_WA_URL_MAX) {
    void navigator.clipboard.writeText(message).catch(() => {})
    tryUrl = buildWhatsAppChatHref(digits, shortFallbackText)
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
