import { useKeyboardNavigation } from '../hooks/useAccessibility'

interface SkipLinkProps {
  href: string
  children: React.ReactNode
}

function SkipLink({ href, children }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (target) {
      // Scroll vers l'élément
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      
      // Donner le focus à l'élément cible
      if (target instanceof HTMLElement) {
        target.focus()
        // Si l'élément n'est pas focusable par défaut, le rendre temporairement focusable
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
          target.addEventListener('blur', () => {
            target.removeAttribute('tabindex')
          }, { once: true })
        }
      }
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[1000] focus:px-4 focus:py-2 focus:bg-mayssa-brown focus:text-white focus:rounded-lg focus:shadow-lg focus:font-bold focus:text-sm focus:outline-none focus:ring-2 focus:ring-mayssa-caramel focus:ring-offset-2 transition-all duration-200"
    >
      {children}
    </a>
  )
}

export function SkipLinks() {
  const isKeyboardNavigation = useKeyboardNavigation()

  // Ajouter les styles CSS pour .sr-only si pas déjà présent
  if (typeof document !== 'undefined') {
    const existingStyles = document.getElementById('skip-links-styles')
    if (!existingStyles) {
      const style = document.createElement('style')
      style.id = 'skip-links-styles'
      style.textContent = `
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
        
        .focus\\:not-sr-only:focus {
          position: static !important;
          width: auto !important;
          height: auto !important;
          padding: revert !important;
          margin: revert !important;
          overflow: visible !important;
          clip: auto !important;
          white-space: normal !important;
        }
      `
      document.head.appendChild(style)
    }
  }

  return (
    <>
      <SkipLink href="#main-content">
        Aller au contenu principal
      </SkipLink>
      <SkipLink href="#la-carte">
        Aller à la carte des produits
      </SkipLink>
      <SkipLink href="#commande">
        Aller au panier
      </SkipLink>
      <SkipLink href="#contact">
        Aller aux informations de contact
      </SkipLink>
      
      {/* Indicateur visuel pour la navigation clavier */}
      {isKeyboardNavigation && (
        <div className="fixed top-2 right-2 z-[1001] bg-mayssa-brown text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
          ⌨️ Navigation clavier active
        </div>
      )}
    </>
  )
}

/**
 * Composant pour créer des régions accessibles avec des landmarks ARIA
 */
interface AccessibleRegionProps {
  as?: React.ElementType
  role?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  children: React.ReactNode
  className?: string
}

export function AccessibleRegion({
  as: Component = 'section',
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  children,
  className = '',
  ...props
}: AccessibleRegionProps) {
  return (
    <Component
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={className}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * Composant pour les titres avec hiérarchie automatique
 */
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}

export function AccessibleHeading({ level, children, className = '', id, ...props }: AccessibleHeadingProps) {
  const Component = `h${level}` as React.ElementType
  
  return (
    <Component
      id={id}
      className={`font-display font-bold text-mayssa-brown ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * Composant pour les boutons avec état de chargement accessible
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  loadingText?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

export function AccessibleButton({
  loading = false,
  loadingText = 'Chargement...',
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const getVariantClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-mayssa-brown text-white hover:bg-mayssa-caramel focus:ring-mayssa-caramel disabled:bg-mayssa-brown/50`
      case 'secondary':
        return `${baseClasses} bg-white text-mayssa-brown border-2 border-mayssa-brown hover:bg-mayssa-brown hover:text-white focus:ring-mayssa-brown disabled:opacity-50`
      case 'ghost':
        return `${baseClasses} bg-transparent text-mayssa-brown hover:bg-mayssa-soft focus:ring-mayssa-brown disabled:opacity-50`
      default:
        return baseClasses
    }
  }

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={loading ? 'loading-description' : undefined}
      className={`${getVariantClasses()} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{loadingText}</span>
          </div>
        </>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Composant pour les erreurs avec annonce automatique
 */
interface ErrorMessageProps {
  error?: string
  fieldName?: string
  className?: string
}

export function ErrorMessage({ error, fieldName, className = '' }: ErrorMessageProps) {
  if (!error) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`text-red-600 text-sm font-medium mt-1 ${className}`}
      id={fieldName ? `${fieldName}-error` : undefined}
    >
      <span className="sr-only">Erreur: </span>
      {error}
    </div>
  )
}

/**
 * Composant pour les status de chargement accessibles
 */
interface LoadingStatusProps {
  isLoading: boolean
  message?: string
  children?: React.ReactNode
}

export function LoadingStatus({ isLoading, message = 'Chargement en cours...', children }: LoadingStatusProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
      aria-label={isLoading ? message : undefined}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-mayssa-brown">
          <div className="w-5 h-5 border-2 border-mayssa-brown border-t-transparent rounded-full animate-spin" />
          <span>{message}</span>
        </div>
      ) : (
        children
      )}
    </div>
  )
}