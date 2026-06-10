import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useAuth } from '../hooks/useAuth'
import { AuthPageLayout } from '../components/auth/AuthPageLayout'
import { RegisterForm } from '../components/auth/AuthForms'

export default function PremiumRegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/compte', { replace: true })
    }
  }, [isAuthenticated, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-mayssa-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Inscription — Maison Mayssa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AuthPageLayout
        title="Rejoignez la Maison"
        subtitle="Créez votre compte en quelques instants et recevez 15 points de bienvenue offerts."
        image="/nouvelle-img/Plusieurs-trompeloeil.png"
        imagePosition="center center"
      >
        <RegisterForm onSuccess={() => navigate('/compte')} />
      </AuthPageLayout>
    </>
  )
}
