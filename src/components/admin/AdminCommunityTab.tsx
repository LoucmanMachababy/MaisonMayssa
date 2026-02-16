import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Upload } from 'lucide-react'
import type { Order } from '../../lib/firebase'
import { setCommunityMap, type CommunityMapData } from '../../lib/firebase'

// Centroïdes approximatifs pour quelques CP de Haute-Savoie (pour la carte publique)
const CP_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  '74000': { lat: 45.9, lng: 6.12 },
  '74100': { lat: 46.12, lng: 6.08 },
  '74200': { lat: 46.35, lng: 6.48 },
  '74300': { lat: 46.08, lng: 6.58 },
  '74400': { lat: 45.92, lng: 6.65 },
  '74500': { lat: 46.38, lng: 6.58 },
  '74600': { lat: 45.92, lng: 6.43 },
  '74250': { lat: 46.05, lng: 6.35 },
  '74130': { lat: 46.0, lng: 6.25 },
  '74120': { lat: 45.88, lng: 6.43 },
}

const FRENCH_CP_REGEX = /\b(73\d{3}|74\d{3}|01\d{3}|38\d{3}|69\d{3})\b/g

function extractPostalCodes(address: string): string[] {
  if (!address?.trim()) return []
  const matches = address.match(FRENCH_CP_REGEX)
  return [...new Set(matches ?? [])]
}

interface AdminCommunityTabProps {
  orders: Record<string, Order>
}

export function AdminCommunityTab({ orders }: AdminCommunityTabProps) {
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  const aggregated = useMemo(() => {
    const byCp: Record<string, { count: number; label: string }> = {}
    for (const order of Object.values(orders)) {
      const addr = order.customer?.address
      const cps = extractPostalCodes(addr ?? '')
      for (const cp of cps) {
        if (!byCp[cp]) byCp[cp] = { count: 0, label: cp }
        byCp[cp].count += 1
      }
    }
    return Object.entries(byCp).sort((a, b) => b[1].count - a[1].count)
  }, [orders])

  const handlePublish = async () => {
    setPublishing(true)
    setPublished(false)
    try {
      const data: CommunityMapData = {}
      for (const [cp, { count, label }] of aggregated) {
        const centroid = CP_CENTROIDS[cp]
        data[cp] = {
          count,
          label,
          ...(centroid && { lat: centroid.lat, lng: centroid.lng }),
        }
      }
      await setCommunityMap(data)
      setPublished(true)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-mayssa-brown/5">
        <h3 className="font-bold text-mayssa-brown mb-3 flex items-center gap-2">
          <MapPin size={18} />
          Carte de la communauté
        </h3>
        <p className="text-xs text-mayssa-brown/60 mb-3">
          Agrégation anonyme des commandes par code postal (extrait de l&apos;adresse). Publiez pour afficher sur le site.
        </p>
        {aggregated.length === 0 ? (
          <p className="text-sm text-mayssa-brown/50">Aucune adresse avec code postal détecté.</p>
        ) : (
          <>
            <ul className="space-y-1 mb-4 max-h-48 overflow-y-auto">
              {aggregated.map(([cp, { count, label }]) => (
                <li key={cp} className="flex justify-between text-sm">
                  <span className="text-mayssa-brown">{label}</span>
                  <span className="font-medium text-mayssa-caramel">{count} commande{count > 1 ? 's' : ''}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-mayssa-caramel text-white text-sm font-medium hover:bg-mayssa-brown transition-colors disabled:opacity-50"
            >
              <Upload size={16} />
              {publishing ? 'Publication…' : 'Publier sur le site'}
            </button>
            {published && <p className="mt-2 text-xs text-emerald-600">Carte mise à jour sur le site.</p>}
          </>
        )}
      </div>
    </motion.section>
  )
}
