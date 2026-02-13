import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
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

  render() {
    if (this.state.hasError) {
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
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Oups, une erreur s&apos;est produite
          </h1>
          <p style={{ fontSize: 14, color: '#8b5a3c', marginBottom: 24, textAlign: 'center' }}>
            Rechargez la page pour réessayer.
          </p>
          <button
            onClick={() => window.location.reload()}
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
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
