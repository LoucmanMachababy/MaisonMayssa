import { describe, it, expect } from 'vitest'
import { isPreorderOpenNow, type PreorderOpening } from './firebase'

describe('isPreorderOpenNow', () => {
  const saturday = 6
  const wednesday = 3

  it('retourne true si on est le jour d’ouverture à 00:00', () => {
    const openings: PreorderOpening[] = [{ day: saturday, fromTime: '00:00' }]
    const date = new Date('2025-02-15T12:00:00') // samedi 12h
    expect(isPreorderOpenNow(openings, date)).toBe(true)
  })

  it('retourne false si on est un autre jour', () => {
    const openings: PreorderOpening[] = [{ day: saturday, fromTime: '00:00' }]
    const date = new Date('2025-02-13T12:00:00') // jeudi
    expect(isPreorderOpenNow(openings, date)).toBe(false)
  })

  it('retourne true mercredi à 12h si ouverture mercredi 12:00', () => {
    const openings: PreorderOpening[] = [{ day: wednesday, fromTime: '12:00' }]
    const date = new Date('2025-02-12T12:30:00') // mercredi 12h30
    expect(isPreorderOpenNow(openings, date)).toBe(true)
  })

  it('retourne false mercredi à 11h si ouverture mercredi 12:00', () => {
    const openings: PreorderOpening[] = [{ day: wednesday, fromTime: '12:00' }]
    const date = new Date('2025-02-12T11:00:00')
    expect(isPreorderOpenNow(openings, date)).toBe(false)
  })

  it('retourne true si au moins une plage matche', () => {
    const openings: PreorderOpening[] = [
      { day: 0, fromTime: '00:00' },
      { day: saturday, fromTime: '00:00' },
    ]
    const date = new Date('2025-02-15T10:00:00') // samedi
    expect(isPreorderOpenNow(openings, date)).toBe(true)
  })
})
