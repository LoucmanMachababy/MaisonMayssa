import { PremiumCard, PremiumProse, PremiumSectionTitle } from './layout/PremiumEditorial'

const FAQ_ITEMS = [
  { q: 'Comment commander des pâtisseries en trompe-l\'œil sur Annecy ?', a: 'Ajoutez vos créations artisanales au panier, choisissez le retrait sur Annecy ou la livraison à domicile, puis validez via WhatsApp ou Instagram. La commande est confirmée par notre équipe.' },
  { q: 'Quels sont vos secteurs et horaires de livraison ?', a: 'Notre service de livraison de pâtisserie haut de gamme opère de 18h30 à 2h du matin sur le bassin annécien (Annecy et ses alentours, dans un rayon de 5km). Retrait sur place également disponible.' },
  { q: 'Comment régler ma commande de pâtisseries ?', a: 'Pour votre confort, le paiement s\'effectue à la livraison ou au retrait (espèces). Un lien de paiement PayPal sécurisé est aussi proposé. Aucun paiement n\'est exigé en ligne lors de la commande.' },
  { q: 'Quel est le délai pour une précommande de trompe-l\'œil ?', a: 'Nos trompe-l\'œil sont des pâtisseries artisanales nécessitant environ 3 jours de préparation (selon la collection). Les disponibilités exactes sont affichées dans le calendrier de commande. Nos autres créations (cookies, brownies) sont disponibles en permanence.' },
  { q: 'Quels sont les tarifs de livraison autour d\'Annecy ?', a: 'La livraison de vos desserts est offerte dès 50 € d\'achat sur notre zone (bassin annécien). Pour les commandes inférieures, un forfait de 5 € s\'applique. Pour les zones plus éloignées (Haute-Savoie), contactez-nous directement.' },
]

export function FAQSection() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <section id="faq" className="scroll-mt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <PremiumCard>
        <PremiumSectionTitle>Questions fréquentes</PremiumSectionTitle>
        <dl className="space-y-6">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-mayssa-gold/15 pb-6 last:border-0 last:pb-0">
              <dt className="font-display text-lg text-mayssa-brown mb-2">{item.q}</dt>
              <dd className="text-sm text-mayssa-brown/70 leading-relaxed font-light">{item.a}</dd>
            </div>
          ))}
        </dl>
      </PremiumCard>
    </section>
  )
}

export function ConfidentialiteSection() {
  return (
    <section id="confidentialite" className="mt-8 scroll-mt-28">
      <PremiumCard>
        <PremiumSectionTitle>Politique de confidentialité</PremiumSectionTitle>
        <PremiumProse>
          <p>
            <strong className="text-mayssa-brown font-medium">Responsable du traitement</strong> : Maison Mayssa – Pâtisserie artisanale Annecy (74), France.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Données collectées</strong> : Les informations que vous renseignez (prénom, nom, téléphone, adresse, date et heure de commande) sont utilisées exclusivement pour traiter votre commande de pâtisserie et vous contacter si besoin. Les commandes sont enregistrées sur une base de données sécurisée (Firebase). Vos données ne sont jamais vendues ni cédées à des tiers.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Cookies et stockage local</strong> : Le site utilise le stockage local du navigateur (localStorage) pour mémoriser le contenu de votre panier. Aucun cookie tiers ou outil de traçage publicitaire n&apos;est utilisé.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Vos droits</strong> : Vous pouvez demander l&apos;accès, la rectification ou l&apos;effacement de vos données en nous contactant par WhatsApp ou par téléphone.
          </p>
          <p className="text-xs text-mayssa-brown/50 pt-4 border-t border-mayssa-gold/15">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}.
          </p>
        </PremiumProse>
      </PremiumCard>
    </section>
  )
}

export function MentionsLegalesSection() {
  return (
    <section id="mentions-legales" className="mt-8 scroll-mt-28">
      <PremiumCard>
        <PremiumSectionTitle>Mentions légales</PremiumSectionTitle>
        <PremiumProse>
          <p>
            <strong className="text-mayssa-brown font-medium">Éditeur du site</strong> : Maison Mayssa – Pâtisserie artisanale haut de gamme, Annecy et alentours (74), France.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Contact</strong> : 06 19 87 10 05 · Commande et contact : WhatsApp uniquement · Instagram : @maison_mayssa74.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Hébergement</strong> : Le site est hébergé sur Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.
          </p>
          <p>
            <strong className="text-mayssa-brown font-medium">Propriété intellectuelle</strong> : Les textes, images et contenus de ce site sont protégés. Toute reproduction sans autorisation est strictement interdite.
          </p>
          <p className="text-xs text-mayssa-brown/50 pt-4 border-t border-mayssa-gold/15">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}.
          </p>
        </PremiumProse>
      </PremiumCard>
    </section>
  )
}

export default function LegalPagesSections() {
  return (
    <div className="space-y-8">
      <FAQSection />
      <ConfidentialiteSection />
      <MentionsLegalesSection />
    </div>
  )
}
