import { MessageCircle } from 'lucide-react'
import { PHONE_E164 } from '../constants'

const DEFAULT_MESSAGE = 'Bonjour Maison Mayssa, je souhaite vous passer une commande.'

export function WhatsAppFloatingButton() {
  const url = `https://wa.me/${PHONE_E164}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 cursor-pointer"
      aria-label="Commander sur WhatsApp"
    >
      <MessageCircle size={22} />
      <span className="text-sm font-bold hidden sm:inline">Commander sur WhatsApp</span>
    </a>
  )
}
