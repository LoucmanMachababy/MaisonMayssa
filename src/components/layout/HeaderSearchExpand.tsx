import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProducts } from '../../hooks/useProducts'
import { searchPages, searchProducts } from '../../lib/siteSearch'
import { cn } from '../../lib/utils'

interface HeaderSearchExpandProps {
  isSolid: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HeaderSearchExpand({ isSolid, open, onOpenChange }: HeaderSearchExpandProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { catalogProducts } = useProducts()

  const productResults = useMemo(() => searchProducts(catalogProducts, query, 5), [catalogProducts, query])
  const pageResults = useMemo(() => searchPages(query, 3), [query])
  const hasQuery = query.trim().length > 0
  const showDropdown = open && hasQuery

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, onOpenChange])

  const close = () => onOpenChange(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    if (productResults[0]) {
      navigate(`/produit/${productResults[0].id}`)
      close()
      return
    }
    navigate(`/carte?q=${encodeURIComponent(q)}`)
    close()
  }

  return (
    <div ref={rootRef} className={cn('relative flex items-center shrink-0', open && 'ml-4 lg:ml-6')}>
      <motion.form
        onSubmit={handleSubmit}
        animate={{ width: open ? 280 : 'auto' }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={cn(
          'flex items-center shrink-0',
          open && 'h-9 border overflow-hidden max-w-[42vw] sm:max-w-none',
          open &&
            (isSolid
              ? 'border-mayssa-brown/30 bg-white'
              : 'border-white/50 bg-white/10 backdrop-blur-sm'),
        )}
      >
        <button
          type="button"
          onClick={() => (open ? close() : onOpenChange(true))}
          aria-label={open ? 'Fermer la recherche' : 'Rechercher'}
          aria-expanded={open}
          data-track="nav-search"
          data-track-label="Rechercher"
          data-track-group="navigation"
          className={cn(
            'flex items-center justify-center shrink-0 cursor-pointer transition-colors hover:text-mayssa-gold focus:outline-none border-0 bg-transparent p-0',
            open ? 'w-9 h-9' : '',
            isSolid ? 'text-mayssa-brown/80' : 'text-white/90',
          )}
        >
          <Search size={20} strokeWidth={1.5} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center flex-1 min-w-0 pr-1"
            >
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher"
                className={cn(
                  'w-full min-w-0 bg-transparent text-sm focus:outline-none placeholder:opacity-100 pr-2',
                  isSolid
                    ? 'text-mayssa-brown placeholder:text-mayssa-brown/45'
                    : 'text-white placeholder:text-white/55',
                )}
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Effacer"
                  className={cn(
                    'p-1 shrink-0 cursor-pointer',
                    isSolid ? 'text-mayssa-brown/40 hover:text-mayssa-brown' : 'text-white/50 hover:text-white',
                  )}
                >
                  <X size={14} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-[calc(100%+10px)] w-[min(320px,85vw)] bg-white border border-mayssa-brown/10 shadow-[0_16px_48px_rgba(42,27,18,0.12)] z-[60] overflow-hidden"
          >
            {productResults.length === 0 && pageResults.length === 0 ? (
              <div className="px-4 py-5 text-sm text-mayssa-brown/60">
                Aucun résultat —{' '}
                <Link
                  to={`/carte?q=${encodeURIComponent(query.trim())}`}
                  onClick={close}
                  className="text-mayssa-gold hover:text-mayssa-brown underline-offset-2 hover:underline"
                >
                  voir la carte
                </Link>
              </div>
            ) : (
              <ul className="py-2 max-h-[min(50vh,320px)] overflow-y-auto custom-scrollbar">
                {pageResults.map((page) => (
                  <li key={page.path}>
                    <Link
                      to={page.path}
                      onClick={close}
                      className="block px-4 py-2.5 text-sm text-mayssa-brown hover:bg-mayssa-soft/80 transition-colors"
                    >
                      {page.label}
                    </Link>
                  </li>
                ))}
                {productResults.map((product) => (
                  <li key={product.id}>
                    <Link
                      to={`/produit/${product.id}`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-mayssa-soft/80 transition-colors"
                    >
                      {product.image && (
                        <img src={product.image} alt="" className="w-9 h-9 object-cover border border-mayssa-brown/8 shrink-0" />
                      )}
                      <span className="text-sm text-mayssa-brown truncate flex-1">{product.name}</span>
                      <span className="text-xs font-display text-mayssa-gold shrink-0">
                        {product.price.toFixed(2).replace('.', ',')} €
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to={`/carte?q=${encodeURIComponent(query.trim())}`}
                    onClick={close}
                    className="block px-4 py-2.5 text-[10px] tracking-widest uppercase text-mayssa-brown/50 hover:text-mayssa-gold border-t border-mayssa-brown/8"
                  >
                    Tous les résultats
                  </Link>
                </li>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
