import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReservationTimer } from './ReservationTimer'

describe('ReservationTimer', () => {
  beforeEach(() => vi.useFakeTimers())

  it('retourne null si pas de expiresAt', () => {
    const { container } = render(<ReservationTimer />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche Précommande confirmée si confirmed', () => {
    render(
      <ReservationTimer expiresAt={Date.now() + 60000} confirmed={true} />
    )
    expect(screen.getByText(/Précommande confirmée/)).toBeInTheDocument()
  })

  it('affiche le countdown quand pas confirmé et pas expiré', () => {
    const inOneMin = Date.now() + 60 * 1000
    render(<ReservationTimer expiresAt={inOneMin} />)
    expect(screen.getByText(/En attente de précommande/)).toBeInTheDocument()
  })

  it('affiche Expiré quand remaining <= 0', () => {
    const past = Date.now() - 1000
    render(<ReservationTimer expiresAt={past} />)
    expect(screen.getByText(/Expiré/)).toBeInTheDocument()
  })
})
