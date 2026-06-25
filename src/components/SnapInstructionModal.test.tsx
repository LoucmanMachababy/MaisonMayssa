import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapInstructionModal, type SnapOrderModalData } from './SnapInstructionModal'

const mockCustomer = {
  firstName: 'Jean',
  lastName: 'Dupont',
  phone: '0612345678',
  address: '',
  addressCoordinates: null,
  wantsDelivery: false,
  date: '2026-04-10',
  time: '10h–12h',
} as const

const mockData: SnapOrderModalData = {
  orderNumber: 42,
  shortPasteMessage: 'Bonjour, je souhaite commander...',
  customer: { ...mockCustomer },
  items: [
    {
      product: {
        id: 'p1',
        name: 'Cookie',
        price: 3,
        category: 'Cookies',
      },
      quantity: 2,
    },
  ],
  finalTotal: 6,
  deliveryFee: 0,
  discountAmount: 0,
  donationAmount: 0,
}

describe('SnapInstructionModal', () => {
  it('ne rend rien si data est null', () => {
    const { container } = render(<SnapInstructionModal data={null} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText(/Copier le message/)).not.toBeInTheDocument()
  })

  it('affiche le titre, le bouton copier et le lien Snapchat quand ouvert', () => {
    render(<SnapInstructionModal data={mockData} onClose={vi.fn()} />)
    expect(screen.getByText(/Commande enregistrée/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copier le message/i })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Ouvrir Snapchat — mayssasucree74/i })
    expect(link).toHaveAttribute('href', 'https://www.snapchat.com/add/mayssasucree74')
  })

  it('appelle onClose au clic sur fermer', () => {
    const onClose = vi.fn()
    render(<SnapInstructionModal data={mockData} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
