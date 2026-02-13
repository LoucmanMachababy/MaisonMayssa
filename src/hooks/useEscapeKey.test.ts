import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useEscapeKey } from './useEscapeKey'

describe('useEscapeKey', () => {
  it('appelle onClose quand Escape est pressée', () => {
    const onClose = vi.fn()
    renderHook(() => useEscapeKey(onClose, true))
    const ev = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(ev)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('n’appelle pas onClose pour une autre touche', () => {
    const onClose = vi.fn()
    renderHook(() => useEscapeKey(onClose, true))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('n’enregistre pas le listener si enabled false', () => {
    const onClose = vi.fn()
    renderHook(() => useEscapeKey(onClose, false))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onClose).not.toHaveBeenCalled()
  })
})
