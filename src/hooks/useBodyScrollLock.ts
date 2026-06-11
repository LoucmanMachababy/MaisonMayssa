import { useEffect } from 'react'

const MOBILE_MQ = '(max-width: 767px)'

/** Bloque le scroll du body uniquement sur mobile (panier sheet, modales). */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      document.body.style.overflow = ''
      return
    }

    const mq = window.matchMedia(MOBILE_MQ)
    const apply = () => {
      document.body.style.overflow = mq.matches ? 'hidden' : ''
    }

    apply()
    mq.addEventListener('change', apply)
    return () => {
      mq.removeEventListener('change', apply)
      document.body.style.overflow = ''
    }
  }, [locked])
}
