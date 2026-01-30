type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

const vibrationPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 50, 20],
  error: [30, 50, 30, 50, 30],
}

export function hapticFeedback(type: HapticType = 'light') {
  // Check if vibration API is available
  if (!('vibrate' in navigator)) return

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
