import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Remonte en haut de page à chaque changement de route.
 * Évite d'atterrir sur le footer quand on navigue depuis une page déjà scrollée.
 */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    if (hash) return

    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search, hash])

  return null
}
