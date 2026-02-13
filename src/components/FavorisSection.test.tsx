import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FavorisSection } from './FavorisSection'
import type { Product } from '../types'

vi.mock('../lib/haptics', () => ({ hapticFeedback: vi.fn() }))

const mockProduct: Product = {
  id: 'test-1',
  name: 'Brownie',
  category: 'Brownies',
  price: 5,
  image: '/test.webp',
}

describe('FavorisSection', () => {
  it('affiche l’état vide avec le message', () => {
    render(
      <FavorisSection
        favorites={[]}
        onRemove={vi.fn()}
        onAddToCart={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(screen.getByText(/Aucun favori pour le moment/)).toBeInTheDocument()
    expect(screen.getByText(/Vos Coups de Coeur/)).toBeInTheDocument()
  })

  it('affiche le bouton Vider les favoris quand il y a des favoris', () => {
    render(
      <FavorisSection
        favorites={[mockProduct]}
        onRemove={vi.fn()}
        onAddToCart={vi.fn()}
        onClear={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Vider les favoris/i })).toBeInTheDocument()
    expect(screen.getByText('Brownie')).toBeInTheDocument()
  })

  it('appelle onClear au clic sur Vider les favoris', () => {
    const onClear = vi.fn()
    render(
      <FavorisSection
        favorites={[mockProduct]}
        onRemove={vi.fn()}
        onAddToCart={vi.fn()}
        onClear={onClear}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Vider les favoris/i }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('appelle onAddToCart au clic sur ajouter au panier', () => {
    const onAddToCart = vi.fn()
    render(
      <FavorisSection
        favorites={[mockProduct]}
        onRemove={vi.fn()}
        onAddToCart={onAddToCart}
        onClear={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Ajouter au panier/i }))
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct)
  })
})
