import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../hooks/useAuth'
import { AccountPage } from '../components/auth/AccountPage'
import { PremiumBackLink } from '../components/layout/PremiumEditorial'

export default function PremiumAccountPage() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center pt-[104px]">
        <div className="animate-spin w-8 h-8 border-2 border-mayssa-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />
  }

  return (
    <>
      <Helmet>
        <title>Mon compte — Maison Mayssa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-mayssa-soft pt-[104px] pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <PremiumBackLink to="/" />
          <AccountPage />
        </div>
      </div>
    </>
  )
}
