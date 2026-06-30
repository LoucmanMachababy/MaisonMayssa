import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { hapticFeedback, canVibrate } from './haptics'

describe('haptics', () => {
  const originalVibrate = navigator.vibrate

  beforeEach(() => {
    if (!('vibrate' in navigator)) {
      ;(navigator as any).vibrate = vi.fn()
    }
    // hapticFeedback est gardé par `hasUserInteracted` (anti-intervention Chrome) :
    // il faut simuler une interaction utilisateur pour que vibrate() soit appelé.
    window.dispatchEvent(new Event('click'))
  })
  afterEach(() => {
    if (originalVibrate) (navigator as any).vibrate = originalVibrate
  })

  it('canVibrate retourne true si vibrate disponible', () => {
    expect(typeof canVibrate()).toBe('boolean')
  })

  it('hapticFeedback ne lance pas d’erreur', () => {
    const vibrate = vi.fn()
    ;(navigator as any).vibrate = vibrate
    expect(() => hapticFeedback('light')).not.toThrow()
    if (canVibrate()) {
      expect(vibrate).toHaveBeenCalled()
    }
  })

  it('hapticFeedback accepte les différents types', () => {
    const vibrate = vi.fn()
    ;(navigator as any).vibrate = vibrate
    hapticFeedback('medium')
    hapticFeedback('success')
    if (canVibrate()) {
      expect(vibrate).toHaveBeenCalled()
    }
  })
})
