import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- aligné sur React.lazy (composants à props variées)
type AnyComponent = ComponentType<any>

const STORAGE_KEY = 'mm_chunk_reload_attempted'

/** Erreurs fréquentes quand le navigateur a encore l’ancien manifeste après un déploiement Vite. */
export function isStaleChunkLoadError(err: unknown): boolean {
  if (err == null) return false
  const name = err instanceof Error ? err.name : ''
  const message = err instanceof Error ? err.message : String(err)
  if (name === 'ChunkLoadError') return true
  return /Failed to fetch dynamically imported module|Loading chunk \S+ failed|Importing a module script failed|error loading dynamically imported module|dynamically imported module/i.test(
    message,
  )
}

/**
 * Comme `React.lazy`, mais si le chunk JS est introuvable (souvent après mise en prod),
 * déclenche un rechargement unique pour récupérer le nouvel `index.html` et les bons noms de fichiers.
 */
export function lazyWithRetry(
  /** Retour typé lâche : l’import dynamique + `.then(...)` est mal inféré par TS. */
  importFn: () => Promise<unknown>,
): LazyExoticComponent<AnyComponent> {
  const factory = async (): Promise<{ default: AnyComponent }> => {
    try {
      return (await importFn()) as { default: AnyComponent }
    } catch (err) {
      if (isStaleChunkLoadError(err) && typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(STORAGE_KEY)) {
        sessionStorage.setItem(STORAGE_KEY, '1')
        window.location.reload()
        return new Promise(() => {
          /* la page se recharge */
        }) as Promise<{ default: AnyComponent }>
      }
      throw err
    }
  }
  return lazy(factory as Parameters<typeof lazy>[0]) as LazyExoticComponent<AnyComponent>
}

/** Réinitialiser après un chargement réussi pour permettre un nouveau reload auto si besoin plus tard. */
export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
