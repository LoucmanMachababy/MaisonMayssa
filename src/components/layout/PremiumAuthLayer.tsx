import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function usePremiumAuth() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const openAccount = () => {
    navigate(isAuthenticated ? '/compte' : '/connexion')
  }

  return { openAccount }
}
