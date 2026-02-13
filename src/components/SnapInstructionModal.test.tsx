import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SnapInstructionModal } from './SnapInstructionModal'

describe('SnapInstructionModal', () => {
  it('ne rend rien si isOpen false', () => {
    const { container } = render(
      <SnapInstructionModal isOpen={false} onClose={vi.fn()} />
    )
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    expect(screen.queryByText(/Message copié/)).not.toBeInTheDocument()
  })

  it('affiche le titre et le lien Snapchat quand ouvert', () => {
    render(<SnapInstructionModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText(/Message copié !/)).toBeInTheDocument()
    expect(screen.getByText(/Collez le message sur Snapchat/)).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Ouvrir Snapchat : mayssasucree74/i })
    expect(link).toHaveAttribute('href', 'https://www.snapchat.com/add/mayssasucree74')
  })

  it('appelle onClose au clic sur fermer', () => {
    const onClose = vi.fn()
    render(<SnapInstructionModal isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
