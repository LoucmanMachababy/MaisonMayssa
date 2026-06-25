import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('affiche le nom Maison Mayssa', () => {
    render(<Header />)
    expect(screen.getByText(/Maison Mayssa/)).toBeInTheDocument()
  })

  it('affiche Nos créations du moment', () => {
    render(<Header />)
    expect(screen.getByText('Nos créations du moment')).toBeInTheDocument()
  })

  it('affiche les infos Annecy et horaires', () => {
    render(<Header />)
    expect(screen.getByText('Annecy')).toBeInTheDocument()
  })
})
