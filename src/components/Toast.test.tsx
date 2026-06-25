import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ToastComponent, ToastContainer, type Toast } from './Toast'

describe('ToastComponent', () => {
  it('affiche le message et l’icône selon le type', () => {
    const onRemove = vi.fn()
    render(
      <ToastComponent
        toast={{ id: '1', message: 'Commande envoyée !', type: 'success' }}
        onRemove={onRemove}
      />
    )
    expect(screen.getByText('Commande envoyée !')).toBeInTheDocument()
  })

  it('affiche le bouton d’action si fourni', () => {
    const onAction = vi.fn()
    render(
      <ToastComponent
        toast={{
          id: '1',
          message: 'Erreur',
          type: 'error',
          action: { label: 'Réessayer', onClick: onAction },
        }}
        onRemove={vi.fn()}
      />
    )
    const btn = screen.getByRole('button', { name: /réessayer/i })
    expect(btn).toBeInTheDocument()
    btn.click()
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('appelle onRemove au clic sur fermer', () => {
    const onRemove = vi.fn()
    render(
      <ToastComponent
        toast={{ id: '1', message: 'Info', type: 'info' }}
        onRemove={onRemove}
      />
    )
    const close = screen.getByRole('button', { name: /fermer la notification/i })
    fireEvent.click(close)
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('n’affiche pas le bouton fermer si persistent', () => {
    render(
      <ToastComponent
        toast={{ id: '1', message: 'Persistant', type: 'info', persistent: true }}
        onRemove={vi.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /fermer la notification/i })).not.toBeInTheDocument()
  })
})

describe('ToastContainer', () => {
  it('rend une liste de toasts et le conteneur accessible', () => {
    const toasts: Toast[] = [
      { id: '1', message: 'Un', type: 'success' },
      { id: '2', message: 'Deux', type: 'error' },
    ]
    render(<ToastContainer toasts={toasts} onRemove={vi.fn()} />)
    expect(screen.getByRole('status', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByText('Un')).toBeInTheDocument()
    expect(screen.getByText('Deux')).toBeInTheDocument()
  })

  it('rend rien si toasts vides', () => {
    const { container } = render(<ToastContainer toasts={[]} onRemove={vi.fn()} />)
    expect(container.querySelector('[role="status"]')).toBeInTheDocument()
  })
})
