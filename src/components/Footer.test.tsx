import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  afterEach(() => { window.location.hash = '' })

  it('affiche le nom de la marque et les liens', () => {
    render(<Footer />)
    expect(screen.getByText('Maison Mayssa')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /La Carte/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Commander sur WhatsApp/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mentions légales/i })).toBeInTheDocument()
  })

  it('affiche les infos de livraison (45 €)', () => {
    render(<Footer />)
    expect(screen.getByText(/Commande par WhatsApp uniquement/)).toBeInTheDocument()
  })

  it('le logo a un titre après 5 clics (accès admin)', () => {
    render(<Footer />)
    const logo = screen.getByRole('img', { name: /logo/i })
    for (let i = 0; i < 5; i++) {
      fireEvent.click(logo)
    }
    expect(window.location.hash).toBe('#admin')
  })
})
