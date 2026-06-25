import { PremiumCard, PremiumProse, PremiumSectionTitle } from './layout/PremiumEditorial'
import { LEGAL, LEGAL_LAST_UPDATE } from '../lib/legalInfo'

const FAQ_ITEMS = [
  { q: 'Comment commander des pâtisseries en trompe-l\'œil sur Annecy ?', a: 'Ajoutez vos créations artisanales au panier, choisissez votre créneau de retrait, puis réglez en ligne par carte bancaire ou Apple Pay. La commande est confirmée immédiatement après paiement (click & collect).' },
  { q: 'Où et quand récupérer ma commande ?', a: 'Retrait en click & collect à la boutique Maison Mayssa, galerie marchande du centre commercial Carrefour, 134 avenue de Genève, 74000 Annecy, de 18h30 à 2h du matin, 7 jours sur 7.' },
  { q: 'Comment régler ma commande de pâtisseries ?', a: 'Le paiement s\'effectue en ligne au moment de la commande, par carte bancaire (Visa, Mastercard, CB) ou Apple Pay, via un paiement sécurisé. La commande est confirmée dès le règlement.' },
  { q: 'Quel est le délai pour une précommande de trompe-l\'œil ?', a: 'Nos trompe-l\'œil sont des pâtisseries artisanales nécessitant environ 3 jours de préparation (selon la collection). Les disponibilités exactes sont affichées dans le calendrier de commande.' },
  { q: 'Le retrait est-il gratuit ?', a: 'Oui, le retrait en click & collect à la boutique est sans frais supplémentaires. Vous ne réglez que le montant de vos créations.' },
]

function LegalUpdate() {
  return (
    <p className="text-xs text-mayssa-brown/50 pt-4 border-t border-mayssa-gold/15">
      Dernière mise à jour : {LEGAL_LAST_UPDATE}.
    </p>
  )
}

export function CGVSection() {
  return (
    <section id="cgv" className="scroll-mt-28">
      <PremiumCard>
        <PremiumSectionTitle>Conditions générales de vente (CGV)</PremiumSectionTitle>
        <PremiumProse>
          <p>
            Les présentes conditions générales de vente (CGV) régissent les commandes passées sur le site{' '}
            <a href={LEGAL.site} className="text-mayssa-gold hover:underline">{LEGAL.site}</a> et validées auprès de{' '}
            <strong className="text-mayssa-brown font-medium">{LEGAL.brand}</strong>, enseigne commerciale de{' '}
            <strong className="text-mayssa-brown font-medium">{LEGAL.companyName}</strong>.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">1. Vendeur</h3>
          <p>
            <strong className="text-mayssa-brown font-medium">{LEGAL.companyName}</strong> — {LEGAL.legalForm}<br />
            {LEGAL.director}<br />
            {LEGAL.city}, {LEGAL.country}<br />
            SIREN : {LEGAL.siren} · SIRET : {LEGAL.siret}<br />
            N° TVA : {LEGAL.tva} · {LEGAL.rcs}<br />
            Téléphone : {LEGAL.phone} · Email : {LEGAL.email}<br />
            Instagram : {LEGAL.instagram}
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">2. Produits</h3>
          <p>
            {LEGAL.brand} propose des préparations culinaires sucrées et salées faites maison : trompe-l&apos;œil, pâtisseries,
            limonades, mojitos sans alcool, chocolaterie, boxes et créations artisanales. Les produits sont présentés avec
            leurs descriptions, prix TTC et allergènes lorsque disponibles. Les photographies sont non contractuelles
            dans la mesure où chaque création est artisanale.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">3. Commande</h3>
          <p>
            Le client compose son panier sur le site, renseigne ses coordonnées et choisit un créneau de retrait,
            puis procède au paiement en ligne (click &amp; collect). La commande est définitive après confirmation
            du paiement. {LEGAL.brand} se réserve le droit de refuser ou d&apos;ajuster une commande en cas
            d&apos;indisponibilité ou d&apos;erreur manifeste de prix ; le cas échéant, le client est remboursé.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">4. Prix et paiement</h3>
          <p>
            Les prix sont indiqués en euros TTC sur le site au moment de la commande. Le retrait en click &amp; collect
            est sans frais. Le paiement s&apos;effectue en ligne au moment de la commande, par carte bancaire
            (Visa, Mastercard, CB) ou Apple Pay, via un prestataire de paiement sécurisé. Aucun débit n&apos;intervient
            avant la validation de la commande.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">5. Délais et exécution</h3>
          <p>
            Les trompe-l&apos;œil et certaines créations nécessitent un délai de préparation (environ 3 jours, selon les
            disponibilités affichées). Les autres produits sont préparés selon les stocks et créneaux ouverts. Le client
            s&apos;engage à se présenter au créneau de retrait choisi ou à prévenir en cas d&apos;empêchement.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">6. Retrait — Click &amp; collect</h3>
          <p>
            Retrait à la boutique {LEGAL.brand}, galerie marchande du centre commercial Carrefour, 134 avenue de Genève,
            74000 Annecy, selon les créneaux proposés (généralement entre 18h30 et 2h du matin, 7 j/7). La commande payée
            est tenue à disposition du client au comptoir, sur présentation du numéro de commande. Aucune livraison à
            domicile n&apos;est assurée.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">7. Droit de rétractation</h3>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne s&apos;applique pas
            aux denrées périssables et aux produits confectionnés selon les spécifications du consommateur. Les pâtisseries
            et boissons fraîches de {LEGAL.brand} entrent dans cette catégorie.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">8. Allergènes et hygiène</h3>
          <p>
            Les produits sont élaborés dans un atelier artisanal où sont manipulés gluten, lait, œufs, fruits à coque,
            arachides et soja. Les informations allergènes sont indiquées sur les fiches produit ; le client doit nous
            signaler toute allergie sévère avant commande.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">9. Réclamations</h3>
          <p>
            Toute réclamation doit être adressée dans les 24 heures suivant la réception, par WhatsApp, email ({LEGAL.email})
            ou téléphone ({LEGAL.phone}), accompagnée si possible d&apos;une photo. Nous ferons notre maximum pour trouver
            une solution équitable.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">10. Médiation et litiges</h3>
          <p>
            En cas de litige non résolu, le client peut recourir gratuitement à un médiateur de la consommation :{' '}
            <a href="https://www.medicys.fr/" target="_blank" rel="noopener noreferrer" className="text-mayssa-gold hover:underline">
              MEDICYS
            </a>
            . À défaut d&apos;accord amiable, les tribunaux compétents seront ceux du ressort du siège du vendeur,
            sous réserve des dispositions légales protectrices du consommateur.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">11. Données personnelles</h3>
          <p>
            Le traitement des données personnelles est décrit dans notre{' '}
            <a href="#confidentialite" className="text-mayssa-gold hover:underline">politique de confidentialité</a>.
          </p>

          <LegalUpdate />
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
            Conformément aux articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans
            l&apos;économie numérique (LCEN).
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Éditeur du site</h3>
          <p>
            <strong className="text-mayssa-brown font-medium">{LEGAL.companyName}</strong> ({LEGAL.brand})<br />
            {LEGAL.legalForm}<br />
            {LEGAL.director} — Directeur de la publication<br />
            {LEGAL.city}, {LEGAL.country}<br />
            SIREN : {LEGAL.siren} · SIRET : {LEGAL.siret}<br />
            N° TVA intracommunautaire : {LEGAL.tva}<br />
            {LEGAL.rcs}<br />
            Activité : {LEGAL.activity}
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Contact</h3>
          <p>
            Téléphone : {LEGAL.phone}<br />
            Email : {LEGAL.email}<br />
            Instagram : {LEGAL.instagram}<br />
            Boutique : galerie marchande du Carrefour, 134 avenue de Genève, 74000 Annecy<br />
            Commandes : en ligne sur ce site (click &amp; collect)
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Hébergement</h3>
          <p>{LEGAL.host}</p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Propriété intellectuelle</h3>
          <p>
            L&apos;ensemble du contenu du site (textes, images, logos, créations visuelles) est la propriété de{' '}
            {LEGAL.companyName} ou de ses partenaires. Toute reproduction, représentation ou exploitation sans autorisation
            écrite est interdite.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Crédits</h3>
          <p>
            Site conçu et développé pour {LEGAL.brand}. Photographies et créations : {LEGAL.brand}.
          </p>

          <LegalUpdate />
        </PremiumProse>
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
            {LEGAL.brand} ({LEGAL.companyName}) s&apos;engage à protéger vos données personnelles conformément au
            Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Responsable du traitement</h3>
          <p>
            {LEGAL.companyName} — {LEGAL.director}<br />
            {LEGAL.city}<br />
            Contact : {LEGAL.email} · {LEGAL.phone}
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Données collectées</h3>
          <p>
            <strong className="text-mayssa-brown font-medium">Commande</strong> : prénom, nom, téléphone, email,
            date et heure de retrait, contenu du panier, instructions éventuelles.<br />
            <strong className="text-mayssa-brown font-medium">Compte client</strong> (optionnel) : email, mot de passe (haché),
            téléphone, date de naissance (programme fidélité), historique de commandes et points.<br />
            <strong className="text-mayssa-brown font-medium">Navigation</strong> : stockage local (panier, préférences cookies),
            événements de mesure d&apos;audience anonymisés (Firebase Analytics).
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Finalités et bases légales</h3>
          <p>
            Traitement et suivi des commandes (exécution du contrat) · Gestion du compte fidélité (exécution du contrat /
            consentement) · Communication avec le client (intérêt légitime) · Amélioration du site (intérêt légitime) ·
            Obligations légales comptables et fiscales.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Durée de conservation</h3>
          <p>
            Données de commande : jusqu&apos;à 3 ans après la dernière transaction (sauf obligation comptable plus longue).
            Compte client : tant que le compte est actif, puis suppression sur demande. Données analytics : selon la
            politique de rétention de Google Firebase (paramétrage standard).
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Destinataires et sous-traitants</h3>
          <p>
            Vos données peuvent être traitées par : Google Firebase (hébergement base de données, authentification, analytics) —
            Vercel (hébergement du site) — Stripe (paiement en ligne sécurisé). Ces prestataires peuvent être situés hors UE ;
            des garanties appropriées (clauses contractuelles types) s&apos;appliquent. Vos données ne sont jamais vendues à des tiers.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Cookies et stockage local</h3>
          <p>
            Le site utilise le stockage local (localStorage) pour le panier et vos préférences. Firebase Analytics collecte
            des données de navigation anonymisées (pages vues, événements de conversion). Aucun cookie publicitaire tiers
            n&apos;est déposé. Vous pouvez refuser les cookies non essentiels via le bandeau affiché à votre première visite.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Vos droits</h3>
          <p>
            Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition
            et de portabilité de vos données. Pour les exercer : {LEGAL.email} ou {LEGAL.phone}. Vous pouvez introduire une
            réclamation auprès de la CNIL (www.cnil.fr).
          </p>

          <LegalUpdate />
        </PremiumProse>
      </PremiumCard>
    </section>
  )
}

export function AccessibiliteSection() {
  return (
    <section id="accessibilite" className="mt-8 scroll-mt-28">
      <PremiumCard>
        <PremiumSectionTitle>Déclaration d&apos;accessibilité</PremiumSectionTitle>
        <PremiumProse>
          <p>
            {LEGAL.brand} ({LEGAL.companyName}) s&apos;engage à rendre son site{' '}
            <a href={LEGAL.site} className="text-mayssa-gold hover:underline">{LEGAL.site}</a>{' '}
            accessible conformément à l&apos;article 47 de la loi n° 2005-102 du 11 février 2005 et au référentiel général
            d&apos;amélioration de l&apos;accessibilité (RGAA).
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">État de conformité</h3>
          <p>
            Le site est <strong className="text-mayssa-brown font-medium">partiellement conforme</strong> au RGAA
            (version 4.1) : la plupart des pages respectent les critères essentiels, mais certains contenus ou
            interactions restent en cours d&apos;amélioration.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Fonctionnalités d&apos;accessibilité</h3>
          <p>
            Un bouton d&apos;options d&apos;accessibilité (en bas à gauche de l&apos;écran) permet d&apos;activer :
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-mayssa-brown/75">
            <li>un mode contraste élevé ;</li>
            <li>la réduction des animations ;</li>
            <li>un focus clavier agrandi ;</li>
            <li>l&apos;ajustement de la taille du texte.</li>
          </ul>
          <p className="mt-3">
            Le site intègre également des attributs ARIA sur les éléments interactifs, une navigation au clavier sur
            les modales et formulaires, le respect des préférences système (<code>prefers-reduced-motion</code>) et une
            structure sémantique avec zone de contenu principal.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Contenus non accessibles</h3>
          <p>Les contenus suivants ne sont pas encore totalement accessibles :</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-mayssa-brown/75">
            <li>certaines images décoratives sans texte alternatif descriptif ;</li>
            <li>quelques contrastes de couleurs sur éléments secondaires ;</li>
            <li>certains composants animés complexes (carrousels, transitions) en cours d&apos;optimisation.</li>
          </ul>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Établissement de la déclaration</h3>
          <p>
            Cette déclaration a été établie le {LEGAL_LAST_UPDATE}.<br />
            Technique : audit interne et tests automatisés (Lighthouse, navigation clavier).
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Retour et contact</h3>
          <p>
            Si vous rencontrez un défaut d&apos;accessibilité vous empêchant d&apos;accéder à un contenu ou une
            fonctionnalité, contactez-nous :<br />
            Email : {LEGAL.email} · Téléphone : {LEGAL.phone}<br />
            Nous nous efforçons de vous répondre sous 7 jours ouvrés.
          </p>

          <h3 className="font-display text-lg text-mayssa-brown mt-6 mb-2">Voies de recours</h3>
          <p>
            Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez saisir le{' '}
            <a
              href="https://formulaire.defenseurdesdroits.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mayssa-gold hover:underline"
            >
              Défenseur des droits
            </a>
            {' '}ou son délégué régional.
          </p>

          <LegalUpdate />
        </PremiumProse>
      </PremiumCard>
    </section>
  )
}

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
    <section id="faq" className="mt-8 scroll-mt-28">
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

export default function LegalPagesSections() {
  return (
    <div className="space-y-8">
      <CGVSection />
      <MentionsLegalesSection />
      <ConfidentialiteSection />
      <AccessibiliteSection />
      <FAQSection />
    </div>
  )
}
