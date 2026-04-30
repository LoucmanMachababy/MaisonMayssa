import { motion } from 'framer-motion'

const FAQ_ITEMS = [
  { q: 'Comment commander des pâtisseries en trompe-l\'œil sur Annecy ?', a: 'Ajoutez vos créations artisanales au panier, choisissez le retrait sur Annecy ou la livraison à domicile, puis validez via WhatsApp ou Instagram. La commande est confirmée par notre équipe.' },
  { q: 'Quels sont vos secteurs et horaires de livraison ?', a: 'Notre service de livraison de pâtisserie haut de gamme opère de 18h30 à 2h du matin sur le bassin annécien (Annecy et ses alentours, dans un rayon de 5km). Retrait sur place également disponible.' },
  { q: 'Comment régler ma commande de pâtisseries ?', a: 'Pour votre confort, le paiement s\'effectue à la livraison ou au retrait (espèces). Un lien de paiement PayPal sécurisé est aussi proposé. Aucun paiement n\'est exigé en ligne lors de la commande.' },
  { q: 'Quel est le délai pour une précommande de trompe-l\'œil ?', a: 'Nos trompe-l\'œil sont des pâtisseries artisanales nécessitant environ 3 jours de préparation (selon la collection). Les disponibilités exactes sont affichées dans le calendrier de commande. Nos autres créations (cookies, brownies) sont disponibles en permanence.' },
  { q: 'Quels sont les tarifs de livraison autour d\'Annecy ?', a: 'La livraison de vos desserts est offerte dès 50 € d\'achat sur notre zone (bassin annécien). Pour les commandes inférieures, un forfait de 5 € s\'applique. Pour les zones plus éloignées (Haute-Savoie), contactez-nous directement.' },
]

export function FAQSection() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQ_ITEMS.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mt-16 sm:mt-24 scroll-mt-24 max-w-4xl mx-auto"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      
      <div className="text-center mb-10">
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-gold">
          Pâtisserie Annecy
        </p>
        <h2 className="text-3xl sm:text-4xl font-display font-medium text-mayssa-brown mt-3 tracking-tight">
          Questions Fréquentes
        </h2>
      </div>

      <div className="bg-white/60 backdrop-blur-2xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_10px_40px_rgba(42,27,18,0.03)] border border-white/80">
        <dl className="space-y-6 sm:space-y-8">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-mayssa-gold/10 pb-6 sm:pb-8 last:border-0 last:pb-0">
              <dt className="text-base sm:text-lg font-display font-medium text-mayssa-brown mb-2 sm:mb-3">
                {item.q}
              </dt>
              <dd className="text-sm sm:text-base font-light text-mayssa-brown/70 leading-relaxed">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.section>
  )
}

export function ConfidentialiteSection() {
  return (
    <motion.section
      id="confidentialite"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 sm:mt-16 bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_10px_40px_rgba(42,27,18,0.03)] rounded-[2.5rem] p-8 sm:p-12"
    >
      <h2 className="text-2xl sm:text-3xl font-display font-medium text-mayssa-brown mb-8 tracking-tight">
        Politique de confidentialité
      </h2>
      <div className="prose prose-sm max-w-none text-mayssa-brown/70 space-y-5 font-light leading-relaxed">
        <p>
          <strong className="text-mayssa-brown font-medium">Responsable du traitement</strong> : Maison Mayssa – Pâtisserie artisanale Annecy (74), France.
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Données collectées</strong> : Les informations que vous renseignez (prénom, nom, téléphone, adresse, date et heure de commande) sont utilisées exclusivement pour traiter votre commande de pâtisserie et vous contacter si besoin. Les commandes sont enregistrées sur une base de données sécurisée (Firebase). Vos données ne sont jamais vendues ni cédées à des tiers.
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Cookies et stockage local</strong> : Le site de Maison Mayssa utilise le stockage local du navigateur (localStorage) pour mémoriser le contenu de votre panier afin que vous ne le perdiez pas en fermant la page. Aucun cookie tiers ou outil de traçage publicitaire n'est utilisé.
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Vos droits</strong> : Vous pouvez demander l’accès, la rectification ou l’effacement de vos données en nous contactant par WhatsApp ou par téléphone.
        </p>
        <p className="text-xs text-mayssa-brown/50 pt-4 border-t border-mayssa-gold/10">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}.
        </p>
      </div>
    </motion.section>
  )
}

export function MentionsLegalesSection() {
  return (
    <motion.section
      id="mentions-legales"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 sm:mt-16 bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_10px_40px_rgba(42,27,18,0.03)] rounded-[2.5rem] p-8 sm:p-12"
    >
      <h2 className="text-2xl sm:text-3xl font-display font-medium text-mayssa-brown mb-8 tracking-tight">
        Mentions légales
      </h2>
      <div className="prose prose-sm max-w-none text-mayssa-brown/70 space-y-5 font-light leading-relaxed">
        <p>
          <strong className="text-mayssa-brown font-medium">Éditeur du site</strong> : Maison Mayssa – Pâtisserie artisanale haut de gamme, Annecy et alentours (74), France.
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Contact</strong> : 06 19 87 10 05 · Commande et contact : WhatsApp uniquement · Instagram : @maison_mayssa74 (réseaux).
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Hébergement</strong> : Le site est hébergé sur Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        </p>
        <p>
          <strong className="text-mayssa-brown font-medium">Propriété intellectuelle</strong> : Les textes, images et contenus de ce site sont protégés. Toute reproduction sans autorisation est strictement interdite.
        </p>
        <p className="text-xs text-mayssa-brown/50 pt-4 border-t border-mayssa-gold/10">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}.
        </p>
      </div>
    </motion.section>
  )
}

export default function LegalPagesSections() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <FAQSection />
      <ConfidentialiteSection />
      <MentionsLegalesSection />
    </div>
  )
}
