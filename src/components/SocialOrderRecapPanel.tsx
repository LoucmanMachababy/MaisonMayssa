import { MapPin, Calendar, Hash } from 'lucide-react'
import type { CartItem, CustomerInfo } from '../types'
import { formatDateYyyyMmDdToFrench } from '../lib/utils'

type SocialOrderRecapPanelProps = {
  orderNumber: number
  customer: CustomerInfo
  items: CartItem[]
  finalTotal: number
  deliveryFee: number
  discountAmount?: number
  donationAmount?: number
}

export function SocialOrderRecapPanel({
  orderNumber,
  customer,
  items,
  finalTotal,
  deliveryFee,
  discountAmount = 0,
  donationAmount = 0,
}: SocialOrderRecapPanelProps) {
  const modeLabel = customer.wantsDelivery ? 'Livraison' : 'Retrait sur place'

  return (
    <div className="rounded-2xl bg-mayssa-soft/60 border border-mayssa-brown/10 p-4 space-y-3 text-sm text-mayssa-brown">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-mayssa-caramel">
        <Hash size={14} />
        Commande n°{orderNumber}
      </div>

      <div className="flex items-start gap-2">
        <MapPin size={16} className="text-mayssa-caramel shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">{modeLabel}</p>
          {customer.wantsDelivery && customer.address ? (
            <p className="text-mayssa-brown/80 text-xs leading-snug">{customer.address}</p>
          ) : (
            <p className="text-mayssa-brown/80 text-xs">Retrait sur place (Annecy)</p>
          )}
        </div>
      </div>

      {(customer.date || customer.time) && (
        <div className="flex items-start gap-2">
          <Calendar size={16} className="text-mayssa-caramel shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Date et heure</p>
            <p className="text-mayssa-brown/80 text-xs">
              {customer.date ? formatDateYyyyMmDdToFrench(customer.date) : ''}
              {customer.date && customer.time ? ' · ' : ''}
              {customer.time ?? ''}
            </p>
          </div>
        </div>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-mayssa-brown/50 mb-1.5">Articles</p>
        <ul className="space-y-1 text-xs text-mayssa-brown/85">
          {items.map((item) => (
            <li key={item.product.id}>
              {item.quantity}× {item.product.name} —{' '}
              {(item.product.price * item.quantity).toFixed(2).replace('.', ',')} €
            </li>
          ))}
        </ul>
      </div>

      {(discountAmount > 0 || donationAmount > 0 || deliveryFee > 0) && (
        <div className="space-y-1 text-xs text-mayssa-brown/70 pt-2 border-t border-mayssa-brown/10">
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <span>Code promo</span>
              <span className="text-emerald-600">-{discountAmount.toFixed(2).replace('.', ',')} €</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>+{deliveryFee.toFixed(2).replace('.', ',')} €</span>
            </div>
          )}
          {donationAmount > 0 && (
            <div className="flex justify-between">
              <span>Don au projet</span>
              <span className="text-mayssa-rose">+{donationAmount.toFixed(2).replace('.', ',')} €</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between font-bold text-mayssa-brown pt-2 border-t border-mayssa-brown/10">
        <span>Total</span>
        <span>{finalTotal.toFixed(2).replace('.', ',')} €</span>
      </div>
    </div>
  )
}
