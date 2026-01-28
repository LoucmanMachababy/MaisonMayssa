import { useState, useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Coordinates } from '../types'

// Debounce function pour limiter les appels API
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface AddressSuggestion {
  label: string
  value: string
  coordinates: Coordinates
}

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, coordinates: Coordinates) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Commencez à taper votre adresse...",
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Debounce de la valeur pour limiter les appels API (300ms de délai)
  const debouncedValue = useDebounce(value, 300)

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recherche d'adresses avec l'API Adresse (data.gouv.fr)
  useEffect(() => {
    const searchAddresses = async (query: string) => {
      if (query.length < 3) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      setIsLoading(true)
      try {
        // API Adresse du gouvernement français - gratuite et sans limite
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=housenumber&autocomplete=1`
        )
        const data = await response.json()

        if (data.features && data.features.length > 0) {
          const formattedSuggestions: AddressSuggestion[] = data.features.map((feature: any) => ({
            label: feature.properties.label,
            value: feature.properties.label,
            coordinates: feature.geometry?.coordinates
              ? { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
              : null,
          }))
          setSuggestions(formattedSuggestions)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch (error) {
        console.error('Erreur lors de la recherche d\'adresse:', error)
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    }

    searchAddresses(debouncedValue)
  }, [debouncedValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    // Quand on tape manuellement, on efface les coordonnées (elles seront définies à la sélection)
    onChange(newValue, null)
  }

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.value, suggestion.coordinates)
    setShowSuggestions(false)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('', null)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mayssa-caramel pointer-events-none z-10" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-mayssa-brown placeholder:text-mayssa-brown/50 focus:outline-none pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-mayssa-soft transition-colors"
            aria-label="Effacer"
          >
            <X size={14} className="text-mayssa-brown/60" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-mayssa-brown/10 overflow-hidden">
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-mayssa-brown/60">
              Recherche en cours...
            </div>
          ) : (
            <ul className="max-h-48 sm:max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-mayssa-soft/50 transition-all flex items-start gap-2 sm:gap-3 group cursor-pointer active:bg-mayssa-soft"
                  >
                    <MapPin size={14} className="sm:w-4 sm:h-4 text-mayssa-caramel mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-xs sm:text-sm font-medium text-mayssa-brown group-hover:text-mayssa-caramel transition-colors">
                      {suggestion.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
