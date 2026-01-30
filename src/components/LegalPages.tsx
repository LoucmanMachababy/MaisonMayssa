import { motion } from 'framer-motion'

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
          <strong>Données collectées</strong> : Les informations que vous renseignez (prénom, nom, téléphone, adresse, date et heure de commande) sont utilisées uniquement pour traiter votre précommande et vous contacter si besoin. Elles ne sont pas enregistrées sur nos serveurs : elles servent à générer le message envoyé par vos soins sur WhatsApp ou Instagram.
        </p>
        <p>
          <strong>Cookies et stockage local</strong> : Le site utilise le stockage local du navigateur (localStorage) pour mémoriser le contenu de votre panier afin que vous ne le perdiez pas en fermant la page. Aucun cookie tiers ou outil de traçage publicitaire n’est utilisé.
        </p>
        <p>
          <strong>Vos droits</strong> : Vous pouvez demander l’accès, la rectification ou l’effacement de vos données en nous contactant par message (WhatsApp, Instagram) ou par téléphone.
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
          <strong>Contact</strong> : 06 19 87 10 05 · Instagram : @maison.mayssa74.
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
