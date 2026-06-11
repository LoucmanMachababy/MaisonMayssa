import { CreditCard } from 'lucide-react'
import { cn } from '../../lib/utils'

interface PaymentUnavailableProps {
  className?: string
}

export function PaymentUnavailable({ className = '' }: PaymentUnavailableProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-mayssa-brown/12 bg-mayssa-soft/50 px-4 py-4 text-center space-y-2',
        className,
      )}
      role="status"
    >
      <div className="flex items-center justify-center gap-2 text-mayssa-brown/70">
        <CreditCard size={16} className="text-mayssa-brown/45 shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-widest">Paiement</p>
      </div>
      <p className="text-sm font-semibold text-mayssa-brown">Paiement indisponible pour le moment</p>
      <p className="text-[10px] text-mayssa-brown/55 leading-relaxed max-w-xs mx-auto">
        La validation en ligne sera bientôt disponible. Revenez un peu plus tard pour finaliser votre commande.
      </p>
    </div>
  )
}
