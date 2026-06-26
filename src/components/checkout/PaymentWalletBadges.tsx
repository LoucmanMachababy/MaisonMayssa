import { cn } from '../../lib/utils'

/** Pastilles visuelles Apple Pay / Google Pay (toujours affichées au checkout). */
export function PaymentWalletBadges({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-2 text-white text-xs font-semibold tracking-tight shadow-sm">
        <AppleMark />
        Pay
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-mayssa-brown/15 bg-white px-3 py-2 text-xs font-semibold text-mayssa-brown shadow-sm">
        <GoogleMark />
        Pay
      </span>
    </div>
  )
}

function AppleMark() {
  return (
    <svg aria-hidden viewBox="0 0 14 17" className="h-3.5 w-3.5 fill-current">
      <path d="M11.64 8.86c-.03-2.86 2.34-4.23 2.44-4.29-1.33-1.94-3.4-2.2-4.13-2.23-1.76-.18-3.44 1.04-4.33 1.04-.9 0-2.28-1.01-3.75-.98-1.93.03-3.7 1.12-4.69 2.85-2 3.47-.51 8.61 1.44 11.43.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 1.99-.93 3.74-.93 1.74 0 2.24.93 3.76.9 1.55-.03 2.53-1.41 3.47-2.81 1.09-1.59 1.54-3.13 1.56-3.21-.04-.02-3-1.15-3.03-4.56zM9.52 2.58c.8-.97 1.34-2.32 1.19-3.67-1.15.05-2.54.77-3.37 1.73-.74.86-1.39 2.24-1.22 3.56 1.29.1 2.61-.66 3.4-1.62z" />
    </svg>
  )
}

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

/** Bouton style Apple Pay (mode simulé). */
export function SimulatedApplePayButton({
  loading,
  disabled,
  onClick,
}: {
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-4 text-white text-sm font-semibold shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer min-h-[52px]"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <>
          <AppleMark />
          Pay
        </>
      )}
    </button>
  )
}

/** Bouton style Google Pay (mode simulé). */
export function SimulatedGooglePayButton({
  loading,
  disabled,
  onClick,
}: {
  loading?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-mayssa-brown/15 bg-white px-4 py-4 text-sm font-semibold text-mayssa-brown shadow-sm transition-colors hover:bg-mayssa-soft/60 disabled:opacity-50 cursor-pointer min-h-[52px]"
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-mayssa-brown/20 border-t-mayssa-brown" />
      ) : (
        <>
          <GoogleMark />
          Pay
        </>
      )}
    </button>
  )
}
