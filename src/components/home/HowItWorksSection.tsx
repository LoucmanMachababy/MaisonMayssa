import { motion } from 'framer-motion'

const STEPS = [
  {
    step: '01',
    title: 'Choisissez vos créations',
    description: 'Parcourez la carte et composez votre sélection de douceurs artisanales.',
  },
  {
    step: '02',
    title: 'Choisissez votre créneau',
    description: 'Indiquez la date et l\'heure de retrait qui vous conviennent à la boutique.',
  },
  {
    step: '03',
    title: 'Payez en ligne',
    description: 'Réglez par carte bancaire ou Apple Pay — paiement sécurisé, commande confirmée aussitôt.',
  },
  {
    step: '04',
    title: 'Récupérez en click & collect',
    description: 'Retrait à la galerie marchande du Carrefour, av. de Genève, au créneau choisi.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="w-full scroll-mt-28 section-shell">
      <div className="text-center mb-10 sm:mb-14 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
          Comment ça marche
        </p>
        <h2 className="font-display text-2xl sm:text-3xl text-mayssa-brown">
          Votre précommande, en toute simplicité
        </h2>
      </div>

      <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item, i) => (
          <motion.div
            key={item.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="relative text-center md:text-left space-y-3"
          >
            <span className="font-display text-3xl text-mayssa-gold/40">{item.step}</span>
            <h3 className="font-display text-lg text-mayssa-brown">{item.title}</h3>
            <p className="text-sm text-mayssa-brown/65 leading-relaxed">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
