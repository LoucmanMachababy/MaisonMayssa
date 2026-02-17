import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

// Déferrer Sentry et Analytics après le premier rendu pour améliorer LCP/TBT (Performance mobile)
function deferNonCritical() {
  const run = () => {
    import('./lib/sentry').then(({ initSentry }) => initSentry())
    import('./lib/analytics').then(({ initAnalytics }) => initAnalytics())
  }
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(run, { timeout: 4000 })
  } else {
    setTimeout(run, 1500)
  }
}
if (document.readyState === 'complete') deferNonCritical()
else window.addEventListener('load', deferNonCritical)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
