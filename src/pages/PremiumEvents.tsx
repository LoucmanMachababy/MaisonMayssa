import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { EditorialImageBand } from '../components/decorative/EditorialImageBand'
import { LIFESTYLE } from '../lib/decorativeAssets'

export default function PremiumEvents() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    eventType: 'Mariage',
    date: '',
    message: '',
  })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Devis événement — ${form.eventType} — ${form.name}`)
    const body = encodeURIComponent(
      `Nom : ${form.name}\nEmail : ${form.email}\nType : ${form.eventType}\nDate prévue : ${form.date || '—'}\n\n${form.message}`,
    )
    window.location.href = `mailto:contact@maison-mayssa.fr?subject=${subject}&body=${body}`
    setSent(true)
  }
  return (
    <div className="min-h-screen bg-mayssa-soft">
      <Helmet>
        <title>Événements sur mesure à Annecy — Maison Mayssa</title>
        <meta name="description" content="Mariages, anniversaires, événements d'entreprise à Annecy et alentours : Maison Mayssa crée des pâtisseries trompe-l'œil sur mesure pour vos moments d'exception. Livraison sur tout le bassin annécien." />
        <link rel="canonical" href="https://maison-mayssa.fr/evenements" />
      </Helmet>
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[500px] w-full flex items-center justify-center overflow-hidden bg-mayssa-espresso">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={LIFESTYLE.events}
            alt="Box complète de trompe-l'œil pour événements Maison Mayssa"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/75 via-mayssa-brown/20 to-transparent" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto mt-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-4xl md:text-6xl text-white mb-6"
          >
            Vos Événements
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-mayssa-soft/90 font-light"
          >
            Mariages, anniversaires, réceptions d'entreprise. Rendez vos moments inoubliables avec nos créations sur mesure.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-24">
          <div>
            <h2 className="font-display text-3xl text-mayssa-brown mb-6">L'Excellence sur mesure</h2>
            <p className="text-mayssa-brown/70 leading-relaxed font-light mb-6">
              Maison Mayssa vous accompagne dans la réalisation de vos événements les plus précieux. Nous concevons des pièces uniques, adaptées à vos envies et au thème de votre réception.
            </p>
            <p className="text-mayssa-brown/70 leading-relaxed font-light">
              De la pyramide de trompe-l'œil aux mignardises raffinées, chaque création est pensée pour émerveiller vos convives tant par son esthétique que par ses saveurs.
            </p>
          </div>
          <div className="aspect-[4/5] bg-mayssa-marble relative">
            <img src={LIFESTYLE.boxAll} alt="Box de trompe-l'œil pour événements" className="w-full h-full object-cover object-center" />
          </div>
        </div>

        <TrompeLoeilMarquee />

        {/* Form */}
        <div className="bg-white p-8 md:p-12 border border-mayssa-brown/5 shadow-sm">
          <div className="text-center mb-10">
            <h3 className="font-display text-2xl text-mayssa-brown mb-3">Demande de devis</h3>
            <p className="text-mayssa-brown/60 text-sm">Parlez-nous de votre projet, nous vous recontacterons sous 48h.</p>
          </div>

          {sent ? (
            <p className="text-center text-mayssa-brown/70 py-8">
              Votre client mail s&apos;ouvre — envoyez le message pour recevoir un devis sous 48h.
            </p>
          ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Nom & Prénom</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold transition-colors" placeholder="Votre nom" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold transition-colors" placeholder="votre@email.com" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Type d'événement</label>
                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold transition-colors text-mayssa-brown">
                  <option>Mariage</option>
                  <option>Anniversaire</option>
                  <option>Événement d'entreprise</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Date prévue</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold transition-colors text-mayssa-brown" />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-widest uppercase text-mayssa-brown/70 mb-2">Votre message</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-mayssa-soft/50 border border-mayssa-brown/10 px-4 py-3 focus:outline-none focus:border-mayssa-gold transition-colors resize-none" placeholder="Détaillez vos envies, le nombre de convives attendus..." />
            </div>

            <button type="submit" className="w-full py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors duration-300 mt-4">
              Envoyer la demande
            </button>
          </form>
          )}
        </div>
      </section>

      <EditorialImageBand
        image={LIFESTYLE.boxSeven}
        imageAlt="Box de trompe-l'œil pour réceptions et événements"
        eyebrow="L'art de recevoir"
        title="Des tables qui marquent les esprits"
        description="Pyramides de trompe-l'œil, mignardises assorties, pièces monumentales : nous concevons des présentations dignes de vos plus beaux moments, avec le même soin que pour nos créations individuelles."
        ctaLabel="Découvrir nos boxes"
        ctaTo="/carte?categorie=boxes"
        dark
      />
    </div>
  )
}
