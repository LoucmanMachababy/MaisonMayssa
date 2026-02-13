type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
}

// Chrome bloque vibrate() tant que l'utilisateur n'a pas interagi avec la page (Intervention)
let hasUserInteracted = false
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true
    window.removeEventListener('click', markInteracted)
    window.removeEventListener('touchstart', markInteracted)
    window.removeEventListener('keydown', markInteracted)
  }
  window.addEventListener('click', markInteracted, { once: true, passive: true })
  window.addEventListener('touchstart', markInteracted, { once: true, passive: true })
  window.addEventListener('keydown', markInteracted, { once: true, passive: true })
}

export function hapticFeedback(type: HapticType = 'light') {
  if (!('vibrate' in navigator)) return
  if (!hasUserInteracted) return

  const pattern = vibrationPatterns[type]
  try {
    navigator.vibrate(pattern)
  } catch {
    // Silently fail if vibration is not supported
  }
}

export function canVibrate(): boolean {
  return 'vibrate' in navigator
}
