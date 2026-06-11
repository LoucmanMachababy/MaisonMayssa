import { Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MenuSidebarSearchProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MenuSidebarSearch({ value, onChange, className }: MenuSidebarSearchProps) {
  return (
    <div className={cn('flex items-center h-10 w-full border-0', className)}>
      <Search size={16} strokeWidth={1.75} className="shrink-0 text-mayssa-brown/45" aria-hidden />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher…"
        aria-label="Rechercher un produit"
        autoComplete="off"
        className="w-full min-w-0 bg-transparent border-0 px-3 text-sm text-mayssa-brown placeholder:text-mayssa-brown/45 focus:outline-none focus:ring-0 focus-visible:outline-none shadow-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="p-2 shrink-0 text-mayssa-brown/40 hover:text-mayssa-brown cursor-pointer border-0 bg-transparent focus:outline-none"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
