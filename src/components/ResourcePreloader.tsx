import { useEffect } from 'react'

interface FontPreloadConfig {
  href: string
  as?: 'font'
  type?: string
  crossOrigin?: 'anonymous' | 'use-credentials'
}

interface ImagePreloadConfig {
  href: string
  as?: 'image'
  type?: string
}

interface ResourcePreloaderProps {
  fonts?: FontPreloadConfig[]
  images?: ImagePreloadConfig[]
  criticalCSS?: string[]
}

/**
 * Composant pour précharger les ressources critiques
 * Améliore les performances en préchargeant les polices et images importantes
 */
export function ResourcePreloader({ fonts = [], images = [], criticalCSS = [] }: ResourcePreloaderProps) {
  useEffect(() => {
    // Préchargement des polices
    fonts.forEach(font => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = font.as || 'font'
      link.href = font.href
      if (font.type) link.type = font.type
      if (font.crossOrigin) link.crossOrigin = font.crossOrigin
      
      // Évite les doublons
      if (!document.querySelector(`link[href="${font.href}"]`)) {
        document.head.appendChild(link)
      }
    })

    // Préchargement des images critiques
    images.forEach(image => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = image.as || 'image'
      link.href = image.href
      if (image.type) link.type = image.type
      
      if (!document.querySelector(`link[href="${image.href}"]`)) {
        document.head.appendChild(link)
      }
    })

    // Préchargement du CSS critique
    criticalCSS.forEach(cssPath => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'style'
      link.href = cssPath
      
      if (!document.querySelector(`link[href="${cssPath}"]`)) {
        document.head.appendChild(link)
      }
    })
  }, [fonts, images, criticalCSS])

  return null // Ce composant n'affiche rien
}

/**
 * Hook pour précharger des ressources de manière conditionnelle
 */
export function useResourcePreload() {
  const preloadImage = (src: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const preloadImages = async (sources: string[]) => {
    try {
      const promises = sources.map(preloadImage)
      return await Promise.all(promises)
    } catch (error) {
      console.warn('Failed to preload some images:', error)
      return []
    }
  }

  const preloadFont = (fontUrl: string, fontFamily: string) => {
    const font = new FontFace(fontFamily, `url(${fontUrl})`)
    return font.load().then(loadedFont => {
      document.fonts.add(loadedFont)
      return loadedFont
    })
  }

  return {
    preloadImage,
    preloadImages,
    preloadFont
  }
}

/**
 * Configuration par défaut pour Maison Mayssa
 */
export const defaultPreloadConfig = {
  fonts: [] as Array<{ href: string; as: 'font'; type: string; crossOrigin: 'anonymous' }>,
  images: [
    {
      href: '/logo.webp',
      as: 'image' as const
    }
  ]
}

/**
 * Hook pour détecter et respecter les préférences de performance de l'utilisateur
 */
export function usePerformancePreferences() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  const prefersReducedData = 
    connection?.saveData || 
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const shouldOptimizeForLowEnd = 
    prefersReducedData || 
    navigator.hardwareConcurrency <= 2 ||
    (navigator as any).deviceMemory <= 2

  return {
    prefersReducedData,
    prefersReducedMotion,
    shouldOptimizeForLowEnd,
    // Helper pour conditionner le chargement des ressources
    shouldPreload: !prefersReducedData && !shouldOptimizeForLowEnd
  }
}