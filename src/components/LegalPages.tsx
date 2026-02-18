import { motion } from 'framer-motion'

const FAQ_ITEMS = [
  { q: 'Comment passer commande ?', a: 'Remplis ton panier sur le site, choisis retrait ou livraison, puis clique sur « Envoyer sur WhatsApp ». Le message est pré-rempli : il te suffit de l\'envoyer pour confirmer. Commande par WhatsApp uniquement.' },
  { q: 'Quels sont les horaires de retrait et livraison ?', a: 'Service de 18h30 à 2h du matin. Livraison sur Annecy et alentours. Retrait possible sur place.' },
  { q: 'Comment se passe le paiement ?', a: 'Tu peux régler par PayPal (lien proposé après la commande) ou à la livraison / au retrait. Aucun paiement en ligne obligatoire.' },
  { q: "C'est quoi la précommande ?", a: "Trompes l'œil : le mercredi on prend les précommandes pour une récupération le samedi ; le samedi on prend les précommandes pour une récupération le mercredi. La date de récupération peut être décalée de 1 à 2 jours selon la préparation. Pâtisseries, cookies, boxes et le reste sont disponibles en permanence (pas de jour fixe)." },
  { q: 'Livraison offerte ?', a: "Oui, dès 45 € d'achat sur la zone habituelle (rayon d'environ 5 km depuis Annecy). Sinon forfait 5 €. Pour les secteurs plus éloignés, nous contacter par WhatsApp." },
]

export function FAQSection() {
  return (
    <motion.section
      id="faq"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-12 sm:mt-16 section-shell bg-white/80 border border-mayssa-brown/5"
    >
      <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6">
        Questions fréquentes
      </h2>
      <dl className="space-y-4">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border-b border-mayssa-brown/10 pb-4 last:border-0">
            <dt className="text-sm font-bold text-mayssa-brown mb-1">{item.q}</dt>
            <dd className="text-sm text-mayssa-brown/80 leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>
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
      className="mt-12 sm:mt-16 section-shell bg-white/80 border border-mayssa-brown/5"
    >
      <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6">
        Politique de confidentialité
      </h2>
      <div className="prose prose-sm max-w-none text-mayssa-brown/80 space-y-4">
        <p>
          <strong>Responsable du traitement</strong> : Maison Mayssa – Annecy (74), France.
        </p>
        <p>
          <strong>Données collectées</strong> : Les informations que vous renseignez (prénom, nom, téléphone, adresse, date et heure de commande) sont utilisées pour traiter votre précommande et vous contacter si besoin. Les commandes sont enregistrées sur une base de données sécurisée (Firebase) pour la gestion des commandes. Les données ne sont jamais vendues ni cédées à des tiers.
        </p>
        <p>
          <strong>Cookies et stockage local</strong> : Le site utilise le stockage local du navigateur (localStorage) pour mémoriser le contenu de votre panier afin que vous ne le perdiez pas en fermant la page. Aucun cookie tiers ou outil de traçage publicitaire n&apos;est utilisé. En continuant à utiliser le site, vous acceptez ce stockage local.
        </p>
        <p>
          <strong>Vos droits</strong> : Vous pouvez demander l’accès, la rectification ou l’effacement de vos données en nous contactant par WhatsApp ou par téléphone.
        </p>
        <p className="text-sm text-mayssa-brown/60">
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
      className="mt-12 sm:mt-16 section-shell bg-white/80 border border-mayssa-brown/5"
    >
      <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6">
        Mentions légales
      </h2>
      <div className="prose prose-sm max-w-none text-mayssa-brown/80 space-y-4">
        <p>
          <strong>Éditeur du site</strong> : Maison Mayssa – Annecy et alentours (74), France.
        </p>
        <p>
          <strong>Contact</strong> : 06 19 87 10 05 · Commande et contact : WhatsApp uniquement · Instagram : @maison_mayssa74 (réseaux).
        </p>
        <p>
          <strong>Hébergement</strong> : Le site est hébergé sur Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
        </p>
        <p>
          <strong>Propriété intellectuelle</strong> : Les textes, images et contenus de ce site sont protégés. Toute reproduction sans autorisation est interdite.
        </p>
        <p>
          <strong>Liens externes</strong> : Les liens vers WhatsApp, Instagram ou d’autres sites tiers ne nous engagent pas sur leur contenu.
        </p>
        <p className="text-sm text-mayssa-brown/60">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}.
        </p>
      </div>
    </motion.section>
  )
}

export default function LegalPagesSections() {
  return (
    <>
      <FAQSection />
      <ConfidentialiteSection />
      <MentionsLegalesSection />
    </>
  )
}
