import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, CreditCard, Copy } from 'lucide-react'
import { PAYPAL_ME_USER, PHONE_E164 } from '../constants'

export type OrderConfirmationData = {
  orderId: string
  total: number
  deliveryFee?: number
  customer: { firstName: string; lastName: string; phone: string }
  items: { name: string; quantity: number; price: number }[]
  deliveryMode?: 'livraison' | 'retrait'
  requestedDate?: string
  requestedTime?: string
}

interface OrderConfirmationProps {
  data: OrderConfirmationData
  whatsappMessage: string
  onClose: () => void
}

export function OrderConfirmation({ data, whatsappMessage, onClose }: OrderConfirmationProps) {
  const finalTotal = data.total + (data.deliveryFee ?? 0)
  const paypalUrl = `https://www.paypal.me/${PAYPAL_ME_USER}/${finalTotal.toFixed(2).replace('.', ',')}`
  const statusUrl = `${window.location.origin}${window.location.pathname}#/commande/${data.orderId}`

  const copyStatusLink = () => {
    navigator.clipboard.writeText(statusUrl)
  }

  const copyPaypalNote = () => {
    const note = `Commande ${data.orderId} - ${data.customer.firstName} ${data.customer.lastName}\n${data.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}\nTotal: ${finalTotal.toFixed(2)} €`
    navigator.clipboard.writeText(note)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-emerald-600 px-6 py-8 text-center text-white">
          <CheckCircle2 size={56} className="mx-auto mb-3" />
          <h2 className="text-xl font-display font-bold">Commande enregistrée !</h2>
          <p className="text-emerald-100 text-sm mt-1">Numéro de commande</p>
          <p className="text-2xl font-mono font-bold mt-2 tracking-wider">{data.orderId}</p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">Récapitulatif</h3>
            <div className="space-y-1.5 text-sm text-mayssa-brown">
              {data.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.quantity}× {item.name}</span>
                  <span className="font-medium">{(item.price * item.quantity).toFixed(2).replace('.', ',')} €</span>
                </div>
              ))}
              {data.deliveryFee != null && data.deliveryFee > 0 && (
                <div className="flex justify-between pt-2 border-t border-mayssa-brown/10">
                  <span>Livraison</span>
                  <span>+{data.deliveryFee.toFixed(2).replace('.', ',')} €</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-mayssa-caramel pt-2">
                <span>Total</span>
                <span>{finalTotal.toFixed(2).replace('.', ',')} €</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-mayssa-brown/60 mb-2">Prochaines étapes</h3>
            <ol className="space-y-2 text-sm text-mayssa-brown">
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mayssa-caramel/20 text-mayssa-caramel flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Envoyez le message</strong> sur WhatsApp pour confirmer votre commande</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mayssa-caramel/20 text-mayssa-caramel flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Réglez</strong> par PayPal ou à la récupération</span>
              </li>
              <li className="flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-mayssa-caramel/20 text-mayssa-caramel flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Suivez votre commande</strong> avec le lien ci-dessous</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={`https://wa.me/${PHONE_E164}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
            >
              <MessageSquare size={20} />
              Envoyer sur WhatsApp
            </a>

            <div className="border border-mayssa-brown/10 rounded-xl p-4 bg-mayssa-soft/30">
              <p className="text-xs font-bold text-mayssa-brown/70 mb-2">Payer par PayPal (optionnel)</p>
              <a
                href={paypalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#003087] text-white font-bold hover:bg-[#003087]/90 transition-colors text-sm"
              >
                <CreditCard size={18} />
                Payer {finalTotal.toFixed(2).replace('.', ',')} € via PayPal
              </a>
              <p className="text-[10px] text-mayssa-brown/50 mt-2">
                Indiquez bien &quot;Commande {data.orderId}&quot; dans la note PayPal pour que nous puissions faire le lien.
              </p>
              <button
                type="button"
                onClick={copyPaypalNote}
                className="mt-2 flex items-center gap-1 text-[10px] text-mayssa-caramel hover:underline cursor-pointer"
              >
                <Copy size={12} />
                Copier la note à inclure
              </button>
            </div>

            <div className="border border-mayssa-brown/10 rounded-xl p-3 bg-slate-50">
              <p className="text-[10px] font-bold text-mayssa-brown/60 mb-2">Suivre ma commande</p>
              <div className="flex items-center gap-2">
                <a
                  href={`#/commande/${data.orderId}`}
                  onClick={() => {
                    window.location.hash = `#/commande/${data.orderId}`
                    onClose()
                  }}
                  className="flex-1 text-xs text-mayssa-caramel font-medium truncate hover:underline"
                >
                  {statusUrl.replace(/^https?:\/\/[^/]+/, '')}
                </a>
                <button
                  type="button"
                  onClick={copyStatusLink}
                  className="p-1.5 rounded-lg hover:bg-mayssa-brown/10 cursor-pointer"
                  title="Copier le lien"
                >
                  <Copy size={14} className="text-mayssa-brown" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-mayssa-brown text-white font-bold hover:bg-mayssa-caramel transition-colors cursor-pointer"
          >
            Retour au catalogue
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
