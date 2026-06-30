import { describe, it, expect } from 'vitest'
import { buildPickupIcs } from './calendar'

describe('buildPickupIcs', () => {
  it('génère un VEVENT valide avec date et heure', () => {
    const ics = buildPickupIcs({ orderRef: '#1001', date: '2026-07-04', time: '14:30' })
    expect(ics).not.toBeNull()
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('DTSTART:20260704T143000')
    // +30 min par défaut
    expect(ics).toContain('DTEND:20260704T150000')
    expect(ics).toContain('UID:pickup-1001@maison-mayssa.fr')
  })

  it('place le retrait à midi quand aucune heure n’est fournie', () => {
    const ics = buildPickupIcs({ orderRef: '#1001', date: '2026-07-04' })
    expect(ics).toContain('DTSTART:20260704T120000')
    expect(ics).toContain('DTEND:20260704T123000')
  })

  it('inclut un rappel 2h avant', () => {
    const ics = buildPickupIcs({ orderRef: '#1001', date: '2026-07-04', time: '14:00' })
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:-PT2H')
  })

  it('utilise des sauts de ligne CRLF (RFC 5545)', () => {
    const ics = buildPickupIcs({ orderRef: '#1001', date: '2026-07-04', time: '14:00' })
    expect(ics).toContain('\r\n')
  })

  it('retourne null pour une date invalide', () => {
    expect(buildPickupIcs({ orderRef: '#1001', date: '' })).toBeNull()
    expect(buildPickupIcs({ orderRef: '#1001', date: 'pas-une-date' })).toBeNull()
  })

  it('respecte une durée personnalisée', () => {
    const ics = buildPickupIcs({ orderRef: '#1001', date: '2026-07-04', time: '14:00', durationMinutes: 60 })
    expect(ics).toContain('DTSTART:20260704T140000')
    expect(ics).toContain('DTEND:20260704T150000')
  })
})
