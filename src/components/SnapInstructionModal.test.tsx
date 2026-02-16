import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapInstructionModal } from './SnapInstructionModal'

describe('SnapInstructionModal', () => {
  const defaultMessage = 'Bonjour, je souhaite commander...'

  it('ne rend rien si isOpen false', () => {
    const { container } = render(
      <SnapInstructionModal isOpen={false} onClose={vi.fn()} message={defaultMessage} />
    )
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    expect(screen.queryByText(/Copier le message/)).not.toBeInTheDocument()
  })

  it('affiche le titre, le bouton copier et le lien Snapchat quand ouvert', () => {
    render(<SnapInstructionModal isOpen={true} onClose={vi.fn()} message={defaultMessage} />)
    expect(screen.getByText(/Commande enregistrée !/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Copier le message/i })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Ouvrir Snapchat : mayssasucree74/i })
    expect(link).toHaveAttribute('href', 'https://www.snapchat.com/add/mayssasucree74')
  })

  it('appelle onClose au clic sur fermer', () => {
    const onClose = vi.fn()
    render(<SnapInstructionModal isOpen={true} onClose={onClose} message={defaultMessage} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
