/**
 * Sentry - monitoring des erreurs JS
 * Configure via VITE_SENTRY_DSN dans .env
 */

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || dsn === '') return

  import('@sentry/react').then(({ init }) => {
    init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
    })
  }).catch(() => {
    // Sentry non dispo
  })
}
