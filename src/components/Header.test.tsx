import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('affiche le nom Maison Mayssa', () => {
    render(<Header />)
    expect(screen.getByText('Mayssa')).toBeInTheDocument()
expect(screen.getByText(/Maison/)).toBeInTheDocument()
  })

  it('affiche le CTA Commander sur WhatsApp et le lien Instagram', () => {
    render(<Header />)
    expect(screen.getByRole('link', { name: /Commander sur WhatsApp/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Instagram/i })).toBeInTheDocument()
  })

  it('affiche Livraison offerte et WhatsApp uniquement', () => {
    render(<Header />)
    expect(screen.getByText(/Livraison offerte dès 45 €/)).toBeInTheDocument()
    expect(screen.getByText(/Commande par WhatsApp uniquement/)).toBeInTheDocument()
  })
})
