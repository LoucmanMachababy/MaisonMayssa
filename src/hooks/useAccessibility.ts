import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Hook pour gérer la navigation au clavier
 */
export function useKeyboardNavigation() {
  const [isKeyboardNavigation, setIsKeyboardNavigation] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setIsKeyboardNavigation(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardNavigation(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isKeyboardNavigation
}

/**
 * Hook pour annoncer des changements aux screen readers
 */
export function useScreenReaderAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Créer l'élément d'annonce s'il n'existe pas
    if (!announcerRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.setAttribute('class', 'sr-only')
      announcer.style.position = 'absolute'
      announcer.style.left = '-10000px'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.overflow = 'hidden'
      
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current)
        announcerRef.current = null
      }
    }
  }, [])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority)
      announcerRef.current.textContent = message
      
      // Clear le message après un délai pour permettre les nouvelles annonces
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return announce
}

/**
 * Hook pour gérer le focus et le focus trapping
 */
export function useFocusManagement() {
  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
      
      if (e.key === 'Escape') {
        // Permettre aux modals de se fermer avec Escape
        const escapeEvent = new CustomEvent('modal-escape')
        container.dispatchEvent(escapeEvent)
      }
    }

    container.addEventListener('keydown', handleTabKey)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  }, [])

  const restoreFocus = useCallback((element: HTMLElement) => {
    element?.focus()
  }, [])

  return { trapFocus, restoreFocus }
}

/**
 * Hook pour détecter les préférences d'accessibilité de l'utilisateur
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false,
    prefersReducedTransparency: false
  })

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
        prefersReducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
      })
    }

    updatePreferences()

    // Écouter les changements de préférences
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
      window.matchMedia('(prefers-reduced-transparency: reduce)')
    ]

    mediaQueries.forEach(mq => mq.addEventListener('change', updatePreferences))

    return () => {
      mediaQueries.forEach(mq => mq.removeEventListener('change', updatePreferences))
    }
  }, [])

  return preferences
}

/**
 * Hook pour gérer les raccourcis clavier
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Créer une clé basée sur les modificateurs et la touche
      const keys = []
      if (e.ctrlKey) keys.push('ctrl')
      if (e.metaKey) keys.push('cmd')
      if (e.shiftKey) keys.push('shift')
      if (e.altKey) keys.push('alt')
      keys.push(e.key.toLowerCase())
      
      const shortcutKey = keys.join('+')
      
      if (shortcuts[shortcutKey]) {
        e.preventDefault()
        shortcuts[shortcutKey]()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Hook pour améliorer la navigation par région ARIA
 */
export function useAriaRegions() {
  const announceRegion = useCallback((regionName: string) => {
    // Annoncer quand l'utilisateur entre dans une nouvelle région
    const announcement = `Navigation vers ${regionName}`
    
    // Utiliser l'API Speech Synthesis si disponible
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(announcement)
      utterance.volume = 0.1 // Volume bas pour ne pas déranger
      utterance.rate = 1.2
      speechSynthesis.speak(utterance)
    }
  }, [])

  const createLandmark = useCallback((role: string, label: string) => ({
    role,
    'aria-label': label,
    onFocus: () => announceRegion(label)
  }), [announceRegion])

  return { announceRegion, createLandmark }
}

/**
 * Hook pour gérer l'état de chargement accessible
 */
export function useAccessibleLoading(isLoading: boolean, loadingMessage = 'Chargement en cours') {
  const announce = useScreenReaderAnnouncer()

  useEffect(() => {
    if (isLoading) {
      announce(loadingMessage)
    }
  }, [isLoading, loadingMessage, announce])

  return {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
    'aria-label': isLoading ? loadingMessage : undefined
  }
}

/**
 * Hook pour les formulaires accessibles
 */
export function useAccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const announce = useScreenReaderAnnouncer()

  const validateField = useCallback((fieldName: string, value: string, rules: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    email?: boolean
  }) => {
    const newErrors = { ...errors }
    
    if (rules.required && !value.trim()) {
      newErrors[fieldName] = 'Ce champ est requis'
    } else if (rules.minLength && value.length < rules.minLength) {
      newErrors[fieldName] = `Minimum ${rules.minLength} caractères requis`
    } else if (rules.maxLength && value.length > rules.maxLength) {
      newErrors[fieldName] = `Maximum ${rules.maxLength} caractères autorisés`
    } else if (rules.pattern && !rules.pattern.test(value)) {
      newErrors[fieldName] = 'Format invalide'
    } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors[fieldName] = 'Email invalide'
    } else {
      delete newErrors[fieldName]
    }
    
    setErrors(newErrors)
    
    // Annoncer les erreurs
    if (newErrors[fieldName]) {
      announce(`Erreur sur le champ ${fieldName}: ${newErrors[fieldName]}`, 'assertive')
    }
    
    return !newErrors[fieldName]
  }, [errors, announce])

  const getFieldProps = useCallback((fieldName: string) => ({
    'aria-invalid': !!errors[fieldName],
    'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined
  }), [errors])

  const getErrorProps = useCallback((fieldName: string) => ({
    id: `${fieldName}-error`,
    role: 'alert',
    'aria-live': 'assertive' as const
  }), [])

  return {
    errors,
    validateField,
    getFieldProps,
    getErrorProps,
    hasErrors: Object.keys(errors).length > 0
  }
}