import { Routes, Route, useNavigate, useParams, Navigate } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { lazyWithRetry } from './lib/lazyWithRetry'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AccessibilityProvider } from './components/AccessibilityProvider'
import { PremiumLayout } from './components/layout/PremiumLayout'
import { ScrollToTop } from './components/ScrollToTop'

import PremiumHome from './pages/PremiumHome'
import PremiumMenu from './pages/PremiumMenu'
import PremiumEvents from './pages/PremiumEvents'
import PremiumCart from './pages/PremiumCart'
import PremiumProduct from './pages/PremiumProduct'
import PremiumContact from './pages/PremiumContact'
import PremiumLoginPage from './pages/PremiumLoginPage'
import PremiumRegisterPage from './pages/PremiumRegisterPage'
import PremiumAccountPage from './pages/PremiumAccountPage'
import PremiumLegalPage from './pages/PremiumLegalPage'

import { OrderStatusPage } from './components/OrderStatusPage'
import { AboutPage } from './pages/AboutPage'
import { FAQPage } from './pages/FAQPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TrompeLoeilAnnecyPage } from './pages/TrompeLoeilAnnecyPage'
import { BrowniesAnnecyPage } from './pages/BrowniesAnnecyPage'
import { CookiesAnnecyPage } from './pages/CookiesAnnecyPage'
import { PatisserieAnniversaireAnnecyPage } from './pages/PatisserieAnniversaireAnnecyPage'
import { CadeauGourmandAnnecyPage } from './pages/CadeauGourmandAnnecyPage'

const AdminPanel = lazyWithRetry(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })))

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
  const navigate = useNavigate()
  if (!orderId) return <Navigate to="/" />
  return <OrderStatusPage orderId={orderId} onBack={() => navigate('/')} />
}

export default function App() {
  const [adminRetryKey, setAdminRetryKey] = useState(0)

  return (
    <AccessibilityProvider>
      <ScrollToTop />
      <HashRedirector />
      <Routes>
        <Route element={<PremiumLayout />}>
          <Route index element={<PremiumHome />} />
          <Route path="carte" element={<PremiumMenu />} />
          <Route path="produit/:id" element={<PremiumProduct />} />
          <Route path="evenements" element={<PremiumEvents />} />
          <Route path="panier" element={<PremiumCart />} />
          <Route path="contact" element={<PremiumContact />} />
          <Route path="connexion" element={<PremiumLoginPage />} />
          <Route path="inscription" element={<PremiumRegisterPage />} />
          <Route path="compte" element={<PremiumAccountPage />} />
          <Route path="a-propos" element={<AboutPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="trompe-loeil-annecy" element={<TrompeLoeilAnnecyPage />} />
          <Route path="brownies-annecy" element={<BrowniesAnnecyPage />} />
          <Route path="cookies-annecy" element={<CookiesAnnecyPage />} />
          <Route path="patisserie-anniversaire-annecy" element={<PatisserieAnniversaireAnnecyPage />} />
          <Route path="cadeau-gourmand-annecy" element={<CadeauGourmandAnnecyPage />} />
          <Route path="legal" element={<PremiumLegalPage />} />
          <Route path="commande/:orderId" element={<OrderStatusWrapper />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

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
                  <div className="flex flex-col items-center justify-center min-h-dvh bg-mayssa-ivory text-mayssa-brown gap-3">
                    <div className="w-8 h-8 border-2 border-mayssa-gold border-t-transparent animate-spin" />
                    <span className="text-xs tracking-[0.3em] uppercase text-mayssa-brown/40">Chargement admin</span>
                  </div>
                }
              >
                <AdminPanel />
              </Suspense>
            </ErrorBoundary>
          </div>
        } />

        <Route path="/mentions-legales" element={<Navigate to="/legal" replace />} />
        <Route path="/cgv" element={<Navigate to="/legal#cgv" replace />} />
        <Route path="/confidentialite" element={<Navigate to="/legal#confidentialite" replace />} />
        <Route path="/accessibilite" element={<Navigate to="/legal#accessibilite" replace />} />
      </Routes>
    </AccessibilityProvider>
  )
}
