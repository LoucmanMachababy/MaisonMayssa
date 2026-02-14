import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StockBadge, SocialProofBadge } from './StockBadge'

describe('StockBadge', () => {
  it('retourne null si stock null (produit non géré)', () => {
    const { container } = render(
      <StockBadge stock={null} isPreorderDay={true} dayNames="sam. et mer." />
    )
    expect(container.firstChild).toBeNull()
  })

  it('affiche Rupture de stock si stock 0', () => {
    render(<StockBadge stock={0} isPreorderDay={true} dayNames="sam." />)
    expect(screen.getByText(/Rupture de stock/)).toBeInTheDocument()
  })

  it('affiche Dispo {dayNames} si pas le bon jour (produit précommande)', () => {
    render(<StockBadge stock={5} isPreorderDay={false} dayNames="sam. et mer." isPreorderProduct />)
    expect(screen.getByText(/Dispo sam\. et mer\./)).toBeInTheDocument()
  })

  it('affiche Plus que X ! si stock 1-2', () => {
    render(<StockBadge stock={1} isPreorderDay={true} dayNames="sam." />)
    expect(screen.getByText(/Plus que 1 !/)).toBeInTheDocument()
  })

  it('affiche X disponibles si stock > 5', () => {
    render(<StockBadge stock={10} isPreorderDay={true} dayNames="sam." />)
    expect(screen.getByText(/10 disponibles/)).toBeInTheDocument()
  })
})

describe('SocialProofBadge', () => {
  it('retourne null si pas de viewCount ni recentPurchases', () => {
    const { container } = render(<SocialProofBadge />)
    expect(container.firstChild).toBeNull()
  })

  it('affiche les vues si viewCount fourni', () => {
    render(<SocialProofBadge viewCount={100} />)
    expect(screen.getByText(/100\+ vues/)).toBeInTheDocument()
  })

  it('affiche les achats récents', () => {
    render(<SocialProofBadge recentPurchases={3} />)
    expect(screen.getByText(/3 récemment commandés/)).toBeInTheDocument()
  })
})
