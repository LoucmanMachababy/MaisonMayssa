import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, MapPin, Phone, Calendar, Clock, RefreshCw } from 'lucide-react'
import type { ActiveSession } from '../../types'

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

function formatRelativeTime(ms: number): string {
  const diffS = Math.floor((Date.now() - ms) / 1000)
  if (diffS < 60) return `il y a ${diffS}s`
  const diffM = Math.floor(diffS / 60)
  if (diffM < 60) return `il y a ${diffM} min`
  return `il y a ${Math.floor(diffM / 60)}h`
}

export function AdminSessionsTab() {
  const [sessions, setSessions] = useState<Record<string, ActiveSession>>({})
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let unsub: (() => void) | undefined
    import('../../lib/firebase').then(({ listenActiveSessions }) => {
      unsub = listenActiveSessions(setSessions)
    })
    return () => unsub?.()
  }, [])

  // Actualise l'heure toutes les 15s pour que "il y a X min" reste précis
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(interval)
  }, [])

  const activeSessions = useMemo(() => {
    return Object.values(sessions)
      .filter((s) => now - s.updatedAt < SESSION_TTL_MS)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [sessions, now])

  const totalRevenuePotentiel = activeSessions.reduce((sum, s) => sum + s.cartTotal, 0)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-800">
          <ShoppingBag size={16} className="inline mr-2" />
          Clients ayant un panier actif en ce moment (mis à jour dans les 30 dernières minutes). Les sessions disparaissent automatiquement après envoi de commande ou fermeture de l'onglet.
        </p>
      </div>

      {/* Stats synthèse */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-mayssa-brown/10 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-mayssa-brown">{activeSessions.length}</p>
          <p className="text-xs text-mayssa-brown/60 mt-1">Paniers actifs</p>
        </div>
        <div className="rounded-2xl bg-white border border-mayssa-brown/10 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-mayssa-brown">{totalRevenuePotentiel.toFixed(0)} €</p>
          <p className="text-xs text-mayssa-brown/60 mt-1">Potentiel estimé</p>
        </div>
      </div>

      {/* Liste */}
      <div className="rounded-2xl bg-white border border-mayssa-brown/10 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-mayssa-brown">Sessions en cours</h3>
          <span className="flex items-center gap-1 text-xs text-mayssa-brown/40">
            <RefreshCw size={12} className="animate-spin-slow" />
            Temps réel
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <p className="text-sm text-mayssa-brown/40 py-4 text-center">Aucun client actif pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {activeSessions.map((session) => {
              const isRecent = now - session.updatedAt < 5 * 60 * 1000
              return (
                <li
                  key={session.sessionId}
                  className={`rounded-xl border p-3 ${
                    isRecent
                      ? 'bg-green-50 border-green-200'
                      : 'bg-mayssa-soft/30 border-mayssa-brown/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShoppingBag size={15} className="text-mayssa-brown/60 shrink-0" />
                      <span className="font-semibold text-sm text-mayssa-brown">
                        {session.cartItemCount} article{session.cartItemCount > 1 ? 's' : ''}
                      </span>
                      <span className="text-sm font-bold text-mayssa-caramel">
                        {session.cartTotal.toFixed(2)} €
                      </span>
                    </div>
                    <span className="text-xs text-mayssa-brown/40 shrink-0">
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                    {session.deliveryMode && (
                      <span className="text-xs text-mayssa-brown/60 flex items-center gap-1">
                        <MapPin size={11} />
                        {session.deliveryMode === 'livraison' ? 'Livraison' : 'Retrait'}
                        {session.city ? ` · ${session.city}` : ''}
                      </span>
                    )}
                    {session.hasPhone && (
                      <span className="text-xs text-green-700 flex items-center gap-1">
                        <Phone size={11} />
                        Tél renseigné
                      </span>
                    )}
                    {session.hasDate && (
                      <span className="text-xs text-blue-700 flex items-center gap-1">
                        <Calendar size={11} />
                        Date choisie
                      </span>
                    )}
                    {!session.hasPhone && !session.hasDate && (
                      <span className="text-xs text-orange-600 flex items-center gap-1">
                        <Clock size={11} />
                        Formulaire incomplet
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </motion.section>
  )
}
