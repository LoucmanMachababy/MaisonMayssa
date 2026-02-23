import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Calendar, Mail, Star, Send, CheckCircle, AlertCircle, Loader2, MessageCircle, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import type { UserProfile, Order } from '../../lib/firebase'
import { sendBulkGoogleReviewEmails } from '../../lib/firebase'

const GOOGLE_REVIEW_LINK = 'https://share.google/PsKmSr5Vx1VXqaNWx'

function phoneToWa(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33') && digits.length >= 11) return digits
  if (digits.startsWith('0') && digits.length >= 10) return '33' + digits.slice(1)
  if (digits.length >= 9) return '33' + digits
  return digits
}

function buildReviewMessage(firstName?: string): string {
  const prenom = firstName?.trim() || 'vous'
  return (
    `Bonjour ${prenom},\n\n` +
    `Merci pour votre commande chez Maison Mayssa ! J'espère que vous vous êtes régalé(e) 😍🎂\n\n` +
    `Si vous avez un moment, un petit avis Google nous aiderait énormément :\n` +
    `👉 ${GOOGLE_REVIEW_LINK}\n\n` +
    `Merci pour votre confiance 🙏`
  )
}

interface AdminRappelsTabProps {
  allUsers: Record<string, UserProfile>
  orders: Record<string, Order>
}

type BulkChannel = 'email' | 'whatsapp'
type BulkSendState = 'idle' | 'confirm' | 'loading' | 'success' | 'error'

export function AdminRappelsTab({ allUsers, orders }: AdminRappelsTabProps) {
  const [channel, setChannel] = useState<BulkChannel>('email')
  const [bulkState, setBulkState] = useState<BulkSendState>('idle')
  const [bulkResult, setBulkResult] = useState<{ sent: number } | null>(null)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [showWaList, setShowWaList] = useState(false)
  const [copiedNumbers, setCopiedNumbers] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  /** Clients avec commande validée ou livrée, dédupliqués par téléphone */
  const waContacts = useMemo(() => {
    const seen = new Set<string>()
    const result: { firstName: string; phone: string; waPhone: string }[] = []
    for (const order of Object.values(orders)) {
      if (!['validee', 'livree'].includes(order.status)) continue
      const phone = order.customer?.phone?.trim()
      if (!phone) continue
      const waPhone = phoneToWa(phone)
      if (seen.has(waPhone)) continue
      seen.add(waPhone)
      result.push({
        firstName: order.customer?.firstName?.trim() || '',
        phone,
        waPhone,
      })
    }
    return result
  }, [orders])

  async function handleBulkEmailSend() {
    setBulkState('loading')
    setBulkError(null)
    try {
      const result = await sendBulkGoogleReviewEmails()
      setBulkResult(result)
      setBulkState('success')
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Erreur inconnue')
      setBulkState('error')
    }
  }

  function copyAllNumbers() {
    const numbers = waContacts.map((c) => c.phone).join('\n')
    navigator.clipboard.writeText(numbers).then(() => {
      setCopiedNumbers(true)
      setTimeout(() => setCopiedNumbers(false), 2500)
    })
  }

  function copyMessage() {
    navigator.clipboard.writeText(buildReviewMessage()).then(() => {
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2500)
    })
  }

  function resetBulk() {
    setBulkState('idle')
    setBulkResult(null)
    setBulkError(null)
  }

  const notifyOpening = useMemo(() => {
    return Object.entries(allUsers)
      .filter(([, p]) => p.notifyOrderOpening === true)
      .map(([uid, p]) => ({ uid, profile: p }))
  }, [allUsers])

  const sorted = useMemo(() => {
    const list = Object.entries(allUsers)
      .filter(([, p]) => p.lastOrderAt != null)
      .map(([uid, p]) => ({ uid, profile: p, lastOrderAt: p.lastOrderAt! }))
    list.sort((a, b) => a.lastOrderAt - b.lastOrderAt)
    return list
  }, [allUsers])

  const now = Date.now()
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* ===== CAMPAGNE AVIS GOOGLE ===== */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-amber-200">
        <h3 className="font-bold text-mayssa-brown mb-1 flex items-center gap-2">
          <Star size={18} className="text-amber-500" />
          Campagne avis Google
        </h3>
        <p className="text-xs text-mayssa-brown/60 mb-4">
          Envoie le message d'avis Google à tous les clients ayant une commande validée ou livrée (dédupliqué par contact).
        </p>

        {/* Choix du canal */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setChannel('email'); resetBulk() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              channel === 'email'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-mayssa-brown/60 border-mayssa-brown/20 hover:border-amber-300'
            }`}
          >
            <Mail size={14} />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setChannel('whatsapp'); resetBulk() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
              channel === 'whatsapp'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-white text-mayssa-brown/60 border-mayssa-brown/20 hover:border-green-300'
            }`}
          >
            <MessageCircle size={14} />
            WhatsApp
          </button>
        </div>

        {/* ── Canal EMAIL ── */}
        <AnimatePresence mode="wait">
          {channel === 'email' && (
            <motion.div
              key="email-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {bulkState === 'idle' && (
                <button
                  type="button"
                  onClick={() => setBulkState('confirm')}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Send size={15} />
                  Envoyer à tous ({waContacts.length} clients)
                </button>
              )}

              {bulkState === 'confirm' && (
                <div className="space-y-3">
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    ⚠️ Cette action enverra un email à <strong>tous les clients</strong> ayant une commande validée/livrée. Confirmes-tu ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleBulkEmailSend}
                      className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      <Send size={15} />
                      Oui, envoyer
                    </button>
                    <button
                      type="button"
                      onClick={resetBulk}
                      className="text-sm text-mayssa-brown/60 hover:text-mayssa-brown px-4 py-2 rounded-xl border border-mayssa-brown/20 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {bulkState === 'loading' && (
                <div className="flex items-center gap-2 text-sm text-mayssa-brown/70">
                  <Loader2 size={16} className="animate-spin text-amber-500" />
                  Envoi en cours…
                </div>
              )}

              {bulkState === 'success' && bulkResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <CheckCircle size={16} />
                    <span><strong>{bulkResult.sent} email{bulkResult.sent > 1 ? 's' : ''}</strong> envoyé{bulkResult.sent > 1 ? 's' : ''} avec succès !</span>
                  </div>
                  <button type="button" onClick={resetBulk} className="text-xs text-mayssa-brown/50 hover:text-mayssa-brown underline">
                    Réinitialiser
                  </button>
                </div>
              )}

              {bulkState === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertCircle size={16} />
                    <span>Erreur : {bulkError}</span>
                  </div>
                  <button type="button" onClick={resetBulk} className="text-xs text-mayssa-brown/50 hover:text-mayssa-brown underline">
                    Réessayer
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Canal WHATSAPP ── */}
          {channel === 'whatsapp' && (
            <motion.div
              key="wa-panel"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {waContacts.length === 0 ? (
                <p className="text-sm text-mayssa-brown/50">Aucun client avec numéro de téléphone trouvé.</p>
              ) : (
                <>
                  <p className="text-xs text-mayssa-brown/60">
                    <strong>{waContacts.length} client{waContacts.length > 1 ? 's' : ''}</strong> avec commande validée/livrée.
                    Copie les numéros pour créer une liste de diffusion WhatsApp, ou ouvre chaque conversation.
                  </p>

                  {/* Actions rapides */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyAllNumbers}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        copiedNumbers
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-mayssa-brown/20 text-mayssa-brown hover:border-green-400 hover:text-green-700'
                      }`}
                    >
                      {copiedNumbers ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copiedNumbers ? 'Copié !' : 'Copier tous les numéros'}
                    </button>
                    <button
                      type="button"
                      onClick={copyMessage}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        copiedMessage
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-white border-mayssa-brown/20 text-mayssa-brown hover:border-green-400 hover:text-green-700'
                      }`}
                    >
                      {copiedMessage ? <CheckCircle size={14} /> : <Copy size={14} />}
                      {copiedMessage ? 'Copié !' : 'Copier le message'}
                    </button>
                  </div>

                  {/* Aperçu du message */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <p className="text-[10px] text-green-700 font-medium mb-1 uppercase tracking-wide">Aperçu du message</p>
                    <pre className="text-xs text-green-900 whitespace-pre-wrap font-sans leading-relaxed">
                      {buildReviewMessage('Prénom')}
                    </pre>
                  </div>

                  {/* Liste des contacts */}
                  <button
                    type="button"
                    onClick={() => setShowWaList((v) => !v)}
                    className="flex items-center gap-1 text-xs text-mayssa-brown/60 hover:text-mayssa-brown transition-colors"
                  >
                    {showWaList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showWaList ? 'Masquer' : 'Voir'} les {waContacts.length} liens WhatsApp
                  </button>

                  <AnimatePresence>
                    {showWaList && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        {waContacts.map((c) => (
                          <li key={c.waPhone} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 bg-mayssa-soft/30 border border-mayssa-brown/10">
                            <span className="text-sm text-mayssa-brown font-medium truncate">
                              {c.firstName || '—'}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-mayssa-brown/50">{c.phone}</span>
                              <a
                                href={`https://wa.me/${c.waPhone}?text=${encodeURIComponent(buildReviewMessage(c.firstName))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                                title="Ouvrir WhatsApp"
                              >
                                <ExternalLink size={13} />
                                Ouvrir
                              </a>
                            </div>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== CLIENTS À RELANCER ===== */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
        <p className="text-sm text-amber-800">
          <Bell size={16} className="inline mr-2" />
          Liste des clients avec une dernière commande enregistrée. Idéal pour un rappel douceur (ex. -10 % après 2 semaines sans commande).
        </p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-3">Clients à relancer ({sorted.length})</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucun client avec historique de commande.</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map(({ uid, profile, lastOrderAt }) => {
              const daysSince = Math.floor((now - lastOrderAt) / (24 * 60 * 60 * 1000))
              const isOld = now - lastOrderAt > twoWeeksMs
              return (
                <li
                  key={uid}
                  className={`flex items-center justify-between gap-2 rounded-xl p-3 border ${
                    isOld ? 'bg-amber-50 border-amber-200' : 'bg-mayssa-soft/30 border-mayssa-brown/10'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-mayssa-brown truncate">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-xs text-mayssa-brown/60 flex items-center gap-1">
                      {profile.email}
                      {profile.phone && ` · ${profile.phone}`}
                    </p>
                    {(profile.occasionsInteret?.length ?? 0) > 0 && (
                      <p className="text-xs text-mayssa-caramel mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {profile.occasionsInteret!.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-bold ${isOld ? 'text-amber-700' : 'text-mayssa-brown/60'}`}>
                      Il y a {daysSince} jour{daysSince > 1 ? 's' : ''}
                    </p>
                    <p className="text-[10px] text-mayssa-brown/50">
                      {new Date(lastOrderAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ===== RÉVEIL OUVERTURE COMMANDES ===== */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-2 flex items-center gap-2">
          <Mail size={18} />
          Réveil ouverture des commandes ({notifyOpening.length})
        </h3>
        <p className="text-xs text-mayssa-brown/60 mb-3">
          Ces clients souhaitent recevoir un rappel à l&apos;ouverture des précommandes.
        </p>
        {notifyOpening.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucun.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-3">
              {notifyOpening.map(({ uid, profile }) => (
                <li key={uid} className="flex items-center justify-between gap-2 rounded-xl p-2 bg-mayssa-soft/30 border border-mayssa-brown/10">
                  <span className="text-sm text-mayssa-brown">{profile.firstName} {profile.lastName}</span>
                  <span className="text-xs text-mayssa-brown/60 truncate">{profile.email}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                const emails = notifyOpening.map(({ profile }) => profile.email).filter(Boolean).join('; ')
                if (emails) navigator.clipboard.writeText(emails)
              }}
              className="text-sm font-medium text-mayssa-caramel hover:text-mayssa-brown flex items-center gap-1"
            >
              <Mail size={14} />
              Copier les emails
            </button>
          </>
        )}
      </div>
    </motion.section>
  )
}
