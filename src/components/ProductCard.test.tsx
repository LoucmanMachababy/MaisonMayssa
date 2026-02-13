import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from './ProductCard'
import type { Product } from '../types'

vi.mock('../lib/haptics', () => ({ hapticFeedback: vi.fn() }))
vi.mock('../hooks/use3DTilt', () => ({
  use3DTilt: () => ({ ref: { current: null }, style: {}, handlers: {} }),
}))

const product: Product = {
  id: 'brownie-1',
  name: 'Brownie Classique',
  category: 'Brownies',
  price: 4.5,
  image: '/brownie.webp',
}

describe('ProductCard', () => {
  it('affiche le nom et le prix du produit', () => {
    const onAdd = vi.fn()
    render(<ProductCard product={product} onAdd={onAdd} />)
    expect(screen.getByText('Brownie Classique')).toBeInTheDocument()
    expect(screen.getByText(/4,50 €/)).toBeInTheDocument()
  })

  it('appelle onAdd au clic sur la carte', () => {
    const onAdd = vi.fn()
    render(<ProductCard product={product} onAdd={onAdd} />)
    const card = screen.getByText('Brownie Classique').closest('[role="button"]')
    expect(card).toBeInTheDocument()
    fireEvent.click(card!)
    expect(onAdd).toHaveBeenCalledWith(product)
  })

  it('affiche le bouton favori si onToggleFavorite fourni', () => {
    const onAdd = vi.fn()
    const onToggleFavorite = vi.fn()
    render(
      <ProductCard
        product={product}
        onAdd={onAdd}
        onToggleFavorite={onToggleFavorite}
      />
    )
    expect(screen.getByRole('button', { name: /Ajouter aux favoris/i })).toBeInTheDocument()
  })

  it('appelle onToggleFavorite au clic sur le cœur', () => {
    const onToggleFavorite = vi.fn()
    render(
      <ProductCard
        product={product}
        onAdd={vi.fn()}
        onToggleFavorite={onToggleFavorite}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Ajouter aux favoris/i }))
    expect(onToggleFavorite).toHaveBeenCalledWith(product)
  })
})
