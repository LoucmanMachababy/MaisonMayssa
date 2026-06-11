import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Remonte en haut de page à chaque changement de route (pathname).
 * Les changements de query (?q=, ?categorie=…) ne remontent pas — filtres carte, etc.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

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
  }, [pathname, hash])

  return null
}
