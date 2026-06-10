import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { checkUserIsAdmin } from '../lib/adminAccess'

export function useIsAdmin() {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      setIsAdmin(false)
      setChecking(false)
      return
    }

    let cancelled = false
    setChecking(true)
    checkUserIsAdmin(user)
      .then((admin) => {
        if (!cancelled) setIsAdmin(admin)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return {
    isAdmin,
    loading: authLoading || checking,
  }
}
