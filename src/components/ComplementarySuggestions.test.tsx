import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComplementarySuggestions } from './ComplementarySuggestions'
import type { Product } from '../types'

vi.mock('../lib/haptics', () => ({ hapticFeedback: vi.fn() }))

const product: Product = {
  id: 'p1',
  name: 'Cookie chocolat',
  category: 'Cookies',
  price: 2.5,
  image: '/cookie.webp',
}

describe('ComplementarySuggestions', () => {
  it('ne rend rien si products vide', () => {
    const { container } = render(
      <ComplementarySuggestions products={[]} onAdd={vi.fn()} onDismiss={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('affiche le titre et la liste de produits', () => {
    render(
      <ComplementarySuggestions
        products={[product]}
        onAdd={vi.fn()}
        onDismiss={vi.fn()}
      />
    )
    expect(screen.getByText(/Tu pourrais aimer/)).toBeInTheDocument()
    expect(screen.getByText('Cookie chocolat')).toBeInTheDocument()
    expect(screen.getByText(/2,50 €/)).toBeInTheDocument()
  })

  it('appelle onDismiss au clic sur fermer', () => {
    const onDismiss = vi.fn()
    render(
      <ComplementarySuggestions
        products={[product]}
        onAdd={vi.fn()}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Fermer les suggestions/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('appelle onAdd avec le produit au clic sur un produit', () => {
    const onAdd = vi.fn()
    render(
      <ComplementarySuggestions
        products={[product]}
        onAdd={onAdd}
        onDismiss={vi.fn()}
      />
    )
    fireEvent.click(screen.getByText('Cookie chocolat'))
    expect(onAdd).toHaveBeenCalledWith(product)
  })
})
