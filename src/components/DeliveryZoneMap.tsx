import { useEffect, useRef } from 'react'
import { ANNECY_GARE, DELIVERY_RADIUS_KM } from '../lib/delivery'

/** Carte de la zone de livraison avec Leaflet */
export function DeliveryZoneMap() {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    let map: L.Map | null = null
    let cancelled = false

    const init = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')
      if (cancelled || !wrapper.parentElement) return

      const container = document.createElement('div')
      container.className = 'w-full h-[280px]'
      wrapper.innerHTML = ''
      wrapper.appendChild(container)

      map = L.map(container).setView([ANNECY_GARE.lat, ANNECY_GARE.lng], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)

      L.circle([ANNECY_GARE.lat, ANNECY_GARE.lng], {
        color: '#a67c52',
        fillColor: '#a67c52',
        fillOpacity: 0.15,
        weight: 2,
        radius: DELIVERY_RADIUS_KM * 1000,
      }).addTo(map)

      L.marker([ANNECY_GARE.lat, ANNECY_GARE.lng])
        .addTo(map)
        .bindPopup("Maison Mayssa · Gare d'Annecy")
    }

    init()
    return () => {
      cancelled = true
      if (map) {
        map.remove()
        map = null
      }
      wrapper.innerHTML = ''
    }
  }, [])

  return (
    <div className="rounded-2xl overflow-hidden border border-mayssa-brown/10 bg-mayssa-soft/30">
      <div ref={wrapperRef} className="w-full min-h-[280px]" />
      <div className="px-3 py-2 bg-white/95 border-t border-mayssa-brown/5">
        <p className="text-xs font-medium text-mayssa-brown">
          📍 Livraison dans un rayon de <strong>{DELIVERY_RADIUS_KM} km</strong> autour de la gare d&apos;Annecy
        </p>
      </div>
    </div>
  )
}
