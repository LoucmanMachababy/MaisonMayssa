import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, isOpen, isBeforeOrderCutoff, isPreorderNotYetAvailable, isBeforeFirstPickupDate } from './utils'

describe('cn', () => {
  it('merge des classes Tailwind', () => {
    expect(cn('a', 'b')).toBe('a b')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('gère les conditionnels', () => {
    expect(cn('base', false && 'hidden', true && 'block')).toBe('base block')
  })
})

describe('isOpen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retourne true à 19h', () => {
    vi.setSystemTime(new Date('2025-02-13T19:00:00'))
    expect(isOpen()).toBe(true)
  })

  it('retourne true à 18h30', () => {
    vi.setSystemTime(new Date('2025-02-13T18:30:00'))
    expect(isOpen()).toBe(true)
  })

  it('retourne false à 18h', () => {
    vi.setSystemTime(new Date('2025-02-13T18:00:00'))
    expect(isOpen()).toBe(false)
  })

  it('retourne true à 2h du matin', () => {
    vi.setSystemTime(new Date('2025-02-14T02:00:00'))
    expect(isOpen()).toBe(true)
  })

  it('retourne false à 10h', () => {
    vi.setSystemTime(new Date('2025-02-13T10:00:00'))
    expect(isOpen()).toBe(false)
  })
})

describe('isBeforeOrderCutoff', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retourne true avant 23h (Paris)', () => {
    // 22h à Paris = 21h UTC en hiver
    vi.setSystemTime(new Date('2025-02-13T21:00:00Z'))
    expect(isBeforeOrderCutoff()).toBe(true)
  })

  it('retourne false à 23h ou après (Paris)', () => {
    vi.setSystemTime(new Date('2025-02-13T22:00:00Z')) // 23h Paris
    expect(isBeforeOrderCutoff()).toBe(false)
  })
})

describe('isPreorderNotYetAvailable', () => {
  it('retourne false sans preorder', () => {
    expect(isPreorderNotYetAvailable({})).toBe(false)
    expect(isPreorderNotYetAvailable({ preorder: undefined })).toBe(false)
  })

  it('retourne false si availableFrom est dans le passé', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(isPreorderNotYetAvailable({ preorder: { availableFrom: past.toISOString().slice(0, 10) } })).toBe(false)
  })

  it('retourne true si availableFrom est dans le futur', () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    expect(isPreorderNotYetAvailable({ preorder: { availableFrom: future.toISOString().slice(0, 10) } })).toBe(true)
  })
})

describe('isBeforeFirstPickupDate', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('retourne true avant le 18 février 2026', () => {
    vi.setSystemTime(new Date('2026-02-17T12:00:00'))
    expect(isBeforeFirstPickupDate('2026-02-18')).toBe(true)
  })

  it('retourne false le 18 février 2026', () => {
    vi.setSystemTime(new Date('2026-02-18T00:00:00'))
    expect(isBeforeFirstPickupDate('2026-02-18')).toBe(false)
  })

  it('retourne false après le 18 février 2026', () => {
    vi.setSystemTime(new Date('2026-02-19T12:00:00'))
    expect(isBeforeFirstPickupDate('2026-02-18')).toBe(false)
  })
})
