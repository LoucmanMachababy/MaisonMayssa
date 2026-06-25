import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Instagram, Mail, MapPin } from 'lucide-react'
import { PHONE_E164 } from '../constants'
import { STORE_ADDRESS_FULL, STORE_MAPS_URL, STORE_OPENING_DATE_LABEL } from '../constants/store'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { LIFESTYLE } from '../lib/decorativeAssets'

export default function PremiumContact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Contact Maison Mayssa — ${form.name}`)
    const body = encodeURIComponent(
      `Nom : ${form.name}\nEmail : ${form.email}\n\n${form.message}`,
    )
    window.location.href = `mailto:contact@maison-mayssa.fr?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-mayssa-soft">
      <Helmet>
        <title>Contact — Maison Mayssa, pâtisserie trompe-l&apos;œil Annecy</title>
        <meta name="description" content="Contactez Maison Mayssa pour vos questions, commandes click & collect ou événements sur mesure à Annecy. Boutique : galerie marchande du Carrefour, 134 avenue de Genève. WhatsApp 7j/7." />
        <link rel="canonical" href="https://maison-mayssa.fr/contact" />
      </Helmet>

      <section className="relative h-[40vh] min-h-[320px] w-full flex items-end overflow-hidden bg-mayssa-espresso pt-[104px]">
        <img
          src={LIFESTYLE.heroSpread}
          alt="Trompe-l'œil artisanaux Maison Mayssa"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/80 via-mayssa-brown/25 to-transparent" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12 w-full">
          <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-3 block">Contact</span>
          <h1 className="font-display text-4xl md:text-5xl text-white">Nous écrire</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 py-16 pb-24">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-mayssa-brown/60 font-light max-w-lg mx-auto mb-16"
        >
          Une question sur nos créations, une demande particulière ? Nous vous répondons sous 48h.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <a
              href="mailto:contact@maison-mayssa.fr"
              className="flex items-center gap-4 text-mayssa-brown hover:text-mayssa-gold transition-colors"
            >
              <Mail size={20} className="text-mayssa-gold" />
              contact@maison-mayssa.fr
            </a>
            <a
              href={STORE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 text-mayssa-brown hover:text-mayssa-gold transition-colors"
            >
              <MapPin size={20} className="text-mayssa-gold shrink-0 mt-0.5" />
              <span>
                {STORE_ADDRESS_FULL}
                <span className="block text-xs text-mayssa-brown/50 mt-1">
                  Click &amp; collect — ouverture le {STORE_OPENING_DATE_LABEL}
                </span>
              </span>
            </a>
            <a
              href={`tel:+${PHONE_E164}`}
              className="flex items-center gap-4 text-mayssa-brown hover:text-mayssa-gold transition-colors"
            >
              <span className="w-5 shrink-0 text-center text-mayssa-gold">☎</span>
              +33 6 19 87 10 05
            </a>
            <a
              href="https://instagram.com/maison_mayssa74"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-mayssa-brown hover:text-mayssa-gold transition-colors"
            >
              <Instagram size={20} className="text-mayssa-gold" />
              @maison_mayssa74
            </a>
          </div>

          <div className="bg-white p-8 border border-mayssa-brown/5">
            {sent ? (
              <p className="text-mayssa-brown/70 text-center py-8">
                Votre client mail s&apos;ouvre — envoyez le message pour nous contacter.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Nom</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors"
                >
                  Envoyer
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <TrompeLoeilMarquee variant="dark" />
    </div>
  )
}
