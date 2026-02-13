import { createContext, useContext, useEffect, useState } from 'react'
import { useAccessibilityPreferences } from '../hooks/useAccessibility'

interface AccessibilityContextType {
  // Préférences utilisateur
  highContrast: boolean
  reducedMotion: boolean
  largeFocus: boolean
  fontSize: 'small' | 'medium' | 'large'
  
  // Actions
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  toggleLargeFocus: () => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  
  // État système
  systemPreferences: {
    prefersReducedMotion: boolean
    prefersHighContrast: boolean
    prefersDarkMode: boolean
    prefersReducedTransparency: boolean
  }
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const systemPreferences = useAccessibilityPreferences()
  
  // États locaux avec persistance localStorage
  const [highContrast, setHighContrast] = useState(() => {
    const saved = localStorage.getItem('a11y-high-contrast')
    return saved ? JSON.parse(saved) : systemPreferences.prefersHighContrast
  })
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('a11y-reduced-motion')
    return saved ? JSON.parse(saved) : systemPreferences.prefersReducedMotion
  })
  
  const [largeFocus, setLargeFocus] = useState(() => {
    const saved = localStorage.getItem('a11y-large-focus')
    return saved ? JSON.parse(saved) : false
  })
  
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('a11y-font-size')
    return saved ? (saved as 'small' | 'medium' | 'large') : 'medium'
  })

  // Sauvegarder les préférences
  useEffect(() => {
    localStorage.setItem('a11y-high-contrast', JSON.stringify(highContrast))
  }, [highContrast])
  
  useEffect(() => {
    localStorage.setItem('a11y-reduced-motion', JSON.stringify(reducedMotion))
  }, [reducedMotion])
  
  useEffect(() => {
    localStorage.setItem('a11y-large-focus', JSON.stringify(largeFocus))
  }, [largeFocus])
  
  useEffect(() => {
    localStorage.setItem('a11y-font-size', fontSize)
  }, [fontSize])

  // Appliquer les styles au document
  useEffect(() => {
    const root = document.documentElement
    
    // Contraste élevé
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Mouvement réduit
    if (reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }
    
    // Focus agrandi
    if (largeFocus) {
      root.classList.add('large-focus')
    } else {
      root.classList.remove('large-focus')
    }
    
    // Taille de police
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)
    
  }, [highContrast, reducedMotion, largeFocus, fontSize])

  // Injecter les styles CSS
  useEffect(() => {
    const existingStyles = document.getElementById('accessibility-styles')
    if (existingStyles) return

    const style = document.createElement('style')
    style.id = 'accessibility-styles'
    style.textContent = `
      /* Contraste élevé */
      .high-contrast {
        --mayssa-brown: #000000;
        --mayssa-caramel: #0066cc;
        --mayssa-soft: #ffffff;
        --mayssa-cream: #f0f0f0;
        --mayssa-rose: #ffffff;
      }
      
      .high-contrast * {
        background-color: white !important;
        color: black !important;
        border-color: black !important;
      }
      
      .high-contrast button,
      .high-contrast .bg-mayssa-brown,
      .high-contrast .bg-mayssa-caramel {
        background-color: black !important;
        color: white !important;
        border: 2px solid black !important;
      }
      
      .high-contrast a,
      .high-contrast .text-mayssa-caramel,
      .high-contrast .text-blue-600 {
        color: #0066cc !important;
        text-decoration: underline !important;
      }

      /* Mouvement réduit */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        transform: none !important;
      }

      /* Focus agrandi */
      .large-focus *:focus {
        outline: 4px solid #f7b267 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 2px white, 0 0 0 6px #f7b267 !important;
      }

      /* Tailles de police */
      .font-small {
        font-size: 14px;
      }
      
      .font-medium {
        font-size: 16px;
      }
      
      .font-large {
        font-size: 18px;
      }
      
      .font-large .text-xs { font-size: 0.875rem; }
      .font-large .text-sm { font-size: 1rem; }
      .font-large .text-base { font-size: 1.125rem; }
      .font-large .text-lg { font-size: 1.25rem; }
      .font-large .text-xl { font-size: 1.375rem; }
      .font-large .text-2xl { font-size: 1.75rem; }
      .font-large .text-3xl { font-size: 2rem; }
      .font-large .text-4xl { font-size: 2.5rem; }

      /* Améliorations générales */
      button:focus,
      input:focus,
      textarea:focus,
      select:focus,
      a:focus {
        outline: 2px solid #f7b267 !important;
        outline-offset: 1px !important;
      }
      
      /* Indicateurs de focus pour les éléments interactifs */
      [role="button"]:focus,
      [tabindex]:focus {
        outline: 2px solid #f7b267 !important;
        outline-offset: 1px !important;
      }
    `
    
    document.head.appendChild(style)
  }, [])

  const value: AccessibilityContextType = {
    highContrast,
    reducedMotion,
    largeFocus,
    fontSize,
    toggleHighContrast: () => setHighContrast(!highContrast),
    toggleReducedMotion: () => setReducedMotion(!reducedMotion),
    toggleLargeFocus: () => setLargeFocus(!largeFocus),
    setFontSize: setFontSizeState,
    systemPreferences
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider')
  }
  return context
}

/**
 * Composant pour le panneau de contrôle d'accessibilité
 */
export function AccessibilityControls() {
  const {
    highContrast,
    reducedMotion,
    largeFocus,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeFocus,
    setFontSize
  } = useAccessibilityContext()

  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 z-50 w-12 h-12 bg-mayssa-brown text-white rounded-full shadow-lg hover:bg-mayssa-caramel focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:ring-offset-2 transition-all duration-200"
        aria-label="Ouvrir les options d'accessibilité"
        title="Options d'accessibilité"
      >
        ♿
      </button>

      {/* Panneau de contrôle */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 bg-white rounded-2xl shadow-2xl border border-mayssa-brown/20 p-6 w-80 max-w-[calc(100vw-2rem)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-mayssa-brown">
              Options d'accessibilité
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-mayssa-brown/60 hover:text-mayssa-brown"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Contraste élevé */}
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-mayssa-brown">
                Contraste élevé
              </span>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={toggleHighContrast}
                className="rounded border-mayssa-brown text-mayssa-brown focus:ring-mayssa-caramel"
              />
            </label>

            {/* Mouvement réduit */}
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-mayssa-brown">
                Réduire les animations
              </span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={toggleReducedMotion}
                className="rounded border-mayssa-brown text-mayssa-brown focus:ring-mayssa-caramel"
              />
            </label>

            {/* Focus agrandi */}
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium text-mayssa-brown">
                Focus agrandi
              </span>
              <input
                type="checkbox"
                checked={largeFocus}
                onChange={toggleLargeFocus}
                className="rounded border-mayssa-brown text-mayssa-brown focus:ring-mayssa-caramel"
              />
            </label>

            {/* Taille de police */}
            <div>
              <label className="block text-sm font-medium text-mayssa-brown mb-2">
                Taille du texte
              </label>
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                      fontSize === size
                        ? 'bg-mayssa-brown text-white border-mayssa-brown'
                        : 'bg-white text-mayssa-brown border-mayssa-brown/30 hover:border-mayssa-brown'
                    }`}
                  >
                    {size === 'small' && 'Petit'}
                    {size === 'medium' && 'Normal'}
                    {size === 'large' && 'Grand'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-mayssa-brown/10">
            <p className="text-xs text-mayssa-brown/60">
              Ces paramètres sont sauvegardés dans votre navigateur.
            </p>
          </div>
        </div>
      )}
    </>
  )
}