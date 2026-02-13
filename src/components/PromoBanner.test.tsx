import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PromoBanner } from './PromoBanner'

const STORAGE_KEY = 'maison-mayssa-promo-dismissed'

describe('PromoBanner', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === STORAGE_KEY) return null
      return null
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('affiche le message de livraison offerte quand pas dismiss', async () => {
    const { findByText } = render(<PromoBanner />)
    expect(await findByText(/Livraison offerte dès 45 €/)).toBeInTheDocument()
  })

  it('a un bouton fermer accessible', async () => {
    const { findByRole } = render(<PromoBanner />)
    expect(await findByRole('button', { name: /fermer/i })).toBeInTheDocument()
  })

  it('masque la bannière après clic sur fermer et écrit dans localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const { findByRole } = render(<PromoBanner />)
    const close = await findByRole('button', { name: /fermer/i })
    fireEvent.click(close)
    expect(setItem).toHaveBeenCalledWith(STORAGE_KEY, '1')
    expect(screen.queryByText(/Livraison offerte dès 45 €/)).not.toBeInTheDocument()
  })
})
