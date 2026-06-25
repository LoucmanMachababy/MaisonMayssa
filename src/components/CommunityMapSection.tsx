import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { listenCommunityMap, type CommunityMapData } from '../lib/firebase'

export function CommunityMapSection() {
  const [data, setData] = useState<CommunityMapData>({})

  useEffect(() => {
    return listenCommunityMap(setData)
  }, [])

  const entries = Object.entries(data).filter(([, v]) => v && v.count > 0).sort((a, b) => b[1].count - a[1].count)
  if (entries.length === 0) return null

  return (
    <section className="py-10 px-4 bg-mayssa-soft/30" id="communaute">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-xl font-bold text-mayssa-brown mb-2 flex items-center justify-center gap-2">
          <MapPin size={22} className="text-mayssa-caramel" />
          Nos clients nous font confiance
        </h2>
        <p className="text-sm text-mayssa-brown/70 mb-4">
          Annecy, Rumilly, et alentours… Merci à vous.
        </p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-mayssa-brown/80">
          {entries.slice(0, 15).map(([cp, { count, label }]) => (
            <span key={cp}>
              {label} ({count} commande{count > 1 ? 's' : ''})
            </span>
          ))}
          {entries.length > 15 && <span className="text-mayssa-brown/50">…</span>}
        </div>
      </div>
    </section>
  )
}
