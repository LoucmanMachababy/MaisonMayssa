import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { lazyWithRetry } from './lib/lazyWithRetry'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AccessibilityProvider } from './components/AccessibilityProvider'
import { Footer } from './components/Footer'

import Home from './pages/Home'
import { OrderStatusPage } from './components/OrderStatusPage'

const AdminPanel = lazyWithRetry(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })))
const LegalPagesSections = lazyWithRetry(() => import('./components/LegalPages').then(m => ({ default: m.default })))

// Handle old hash routes (like #admin) -> new path routes (/admin)
function HashRedirector() {
  const navigate = useNavigate()
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash === '#admin') navigate('/admin', { replace: true })
      else if (hash === '#legal') navigate('/legal', { replace: true })
      else {
        const match = hash.match(/^#\/commande\/([a-zA-Z0-9_-]+)$/)
        if (match) {
          navigate(`/commande/${match[1]}`, { replace: true })
        }
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [navigate])
  return null
}

function OrderStatusWrapper() {
  const { orderId } = useParams()
  if (!orderId) return <Navigate to="/" />
  return <OrderStatusPage orderId={orderId} onBack={() => { window.location.href = '/' }} />
}

export default function App() {
  const [adminRetryKey, setAdminRetryKey] = useState(0)

  return (
    <AccessibilityProvider>
      <HashRedirector />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin" element={
          <div key={adminRetryKey}>
            <ErrorBoundary
              message="Erreur lors du chargement de l'espace admin."
              subMessage="Vérifiez votre connexion ou réessayez. En cas de problème, rechargez la page."
              onRetry={() => setAdminRetryKey((k) => k + 1)}
              onBack={() => { window.location.href = '/' }}
              backLabel="Retour au site"
            >
              <Suspense
                fallback={
                  <div className="flex items-center justify-center min-h-screen bg-mayssa-soft text-mayssa-brown">
                    <span>Chargement admin...</span>
                  </div>
                }
              >
                <AdminPanel />
              </Suspense>
            </ErrorBoundary>
          </div>
        } />

        <Route path="/legal" element={
          <div className="min-h-screen bg-mayssa-soft">
            <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
              <Suspense fallback={<div className="text-center text-mayssa-brown/60">Chargement des informations légales...</div>}>
                <LegalPagesSections />
              </Suspense>
            </div>
            <Footer />
          </div>
        } />

        <Route path="/commande/:orderId" element={
          <div className="min-h-screen bg-mayssa-soft">
            <OrderStatusWrapper />
          </div>
        } />
      </Routes>
    </AccessibilityProvider>
  )
}
