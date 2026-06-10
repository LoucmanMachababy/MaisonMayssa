import { Link } from 'react-router-dom'

interface CgvAcceptanceProps {
  checked: boolean
  onChange: (value: boolean) => void
  className?: string
}

/** Case d'acceptation CGV + confidentialité (checkout). */
export function CgvAcceptance({ checked, onChange, className = '' }: CgvAcceptanceProps) {
  return (
    <label className={`flex items-start gap-2.5 cursor-pointer select-none ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-mayssa-brown"
      />
      <span className="text-[10px] sm:text-xs text-mayssa-brown/75 leading-relaxed">
        J&apos;accepte les{' '}
        <Link to="/legal#cgv" target="_blank" rel="noopener noreferrer" className="text-mayssa-gold underline hover:text-mayssa-brown">
          conditions générales de vente
        </Link>
        {' '}et la{' '}
        <Link to="/legal#confidentialite" target="_blank" rel="noopener noreferrer" className="text-mayssa-gold underline hover:text-mayssa-brown">
          politique de confidentialité
        </Link>
        .
      </span>
    </label>
  )
}
