import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bell, Calendar, Mail } from 'lucide-react'
import type { UserProfile } from '../../lib/firebase'

interface AdminRappelsTabProps {
  allUsers: Record<string, UserProfile>
}

export function AdminRappelsTab({ allUsers }: AdminRappelsTabProps) {
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
                if (emails) {
                  navigator.clipboard.writeText(emails)
                }
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
