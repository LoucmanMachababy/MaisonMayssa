import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Message principal affiché en cas d'erreur */
  message?: string
  /** Sous-texte (conseil) */
  subMessage?: string
  /** Si fourni, affiche "Réessayer" et appelle ce callback au lieu de recharger la page */
  onRetry?: () => void
  /** Si fourni, affiche un lien "Retour au site" (ou label personnalisé) */
  onBack?: () => void
  /** Label du lien retour (défaut: "Retour au site") */
  backLabel?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    import('@sentry/react').then(({ captureException }) => {
      captureException(error)
    }).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      const {
        message = "Oups, une erreur s'est produite",
        subMessage = 'Rechargez la page pour réessayer.',
        onRetry,
        onBack,
        backLabel = 'Retour au site',
      } = this.props
      return (
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #fef5ec 0%, #fff9f4 100%)',
            fontFamily: 'system-ui, sans-serif',
            color: '#5b3a29',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
            {message}
          </h1>
          <p style={{ fontSize: 14, color: '#8b5a3c', marginBottom: 16, textAlign: 'center' }}>
            {subMessage}
          </p>
          {this.state.error && (
            <p style={{ fontSize: 11, color: '#c0392b', background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: 8, padding: '6px 12px', marginBottom: 16, maxWidth: 320, wordBreak: 'break-all', textAlign: 'left' }}>
              {this.state.error.message}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  padding: '12px 24px',
                  background: '#5b3a29',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Réessayer
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: onRetry ? 'transparent' : '#5b3a29',
                color: '#5b3a29',
                border: onRetry ? '2px solid #5b3a29' : 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {onRetry ? 'Recharger la page' : 'Recharger'}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  color: '#8b5a3c',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                {backLabel}
              </button>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
