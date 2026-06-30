import { PillarPageLayout } from '../components/PillarPageLayout'

export function CadeauGourmandAnnecyPage() {
  return (
    <PillarPageLayout
      title="Cadeau gourmand Annecy — Coffrets pâtissiers Maison Mayssa"
      description="Cadeau gourmand original à Annecy : coffrets trompe-l'œil, boxes mixtes brownies & cookies, assortiments pâtissiers artisanaux. Click & collect à Annecy."
      canonical="https://maison-mayssa.fr/cadeau-gourmand-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Cadeau gourmand Annecy' },
      ]}
      heroImage="/nouvelle-img/photo-trompe-loeil-site.png"
      heroEyebrow="Cadeau original"
      heroTitle="Cadeau gourmand à Annecy"
      heroSubtitle="Boxes et coffrets artisanaux à offrir — un cadeau qui marque, plus qu'une simple boîte de chocolats."
      categoryProductIds={[
        'box-decouverte-trompe-5',
        'box-decouverte-trompe-8',
        'trompe-loeil-mangue',
        'trompe-loeil-pistache',
        'trompe-loeil-cacahuete',
        'trompe-loeil-cabosse',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: "Quel coffret offrir comme cadeau gourmand ?",
          a: "Pour impressionner : la Box Découverte — 5 trompe-l'œil au choix (40 €). Pour un cadeau plus accessible : la Box Mixte brownies + cookies (25 €). Je panache avec plaisir selon le budget.",
        },
        {
          q: "Le cadeau est-il présentable à offrir tel quel ?",
          a: "Oui, nos boxes sont présentées dans un packaging soigné qui donne envie. Tu peux l'offrir directement, pas besoin de paquet cadeau supplémentaire. Sur demande, je peux ajouter un petit mot manuscrit.",
        },
        {
          q: "Puis-je faire récupérer le cadeau par quelqu'un d'autre ?",
          a: "Oui ! La commande se retire en click & collect à la boutique Maison Mayssa (galerie marchande du Carrefour, 134 avenue de Genève à Annecy). N'importe qui peut venir chercher le cadeau sur le créneau choisi (18h30-2h, 7j/7) en présentant le numéro de commande. Pratique pour offrir une surprise.",
        },
        {
          q: "Combien à l'avance faut-il commander ?",
          a: "Pour les boxes avec trompe-l'œil (Box Découverte) : 3 jours minimum. Pour les boxes brownies / cookies / mixtes : 24h à 48h avant. Pour un cadeau urgent : contacte-moi par WhatsApp, je fais au mieux.",
        },
        {
          q: "Y a-t-il une option avec un message personnalisé ?",
          a: "Oui, je peux ajouter un petit mot manuscrit ou personnaliser un tiramisu avec un texte (anniversaire, merci, félicitations…). Indique ta demande dans les notes de commande ou envoie-moi un message.",
        },
      ]}
      relatedPages={[
        'trompe-loeil-annecy',
        'patisserie-anniversaire-annecy',
        'brownies-annecy',
      ]}
    >
      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Un cadeau gourmand qui sort de l'ordinaire
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Offrir des chocolats industriels, c'est gentil mais générique. Offrir une
            bougie, c'est prévisible. Offrir <strong>un coffret pâtissier artisanal Maison
            Mayssa</strong>, c'est offrir une expérience : la surprise à l'ouverture, le
            moment de dégustation partagé, la conversation déclenchée.
          </p>
          <p>
            Que ce soit pour <strong>un anniversaire, un merci, une pendaison de
            crémaillère, la Saint-Valentin, la fête des mères / pères, Noël, ou juste
            parce que</strong>, nos boxes et coffrets sont pensés pour faire effet. Les
            trompe-l'œil surtout : l'effet "je n'arrive pas à croire que ce soit une
            pâtisserie" est garanti.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Nos coffrets et boxes cadeaux
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🎲 Box Découverte — 5 trompe-l'œil à composer
          </h3>
          <p>
            40 € — Choisis 5 trompe-l'œil parmi toute notre gamme (13 saveurs). Idéal
            quand tu connais les goûts de la personne et que tu veux sélectionner ses
            préférés. Ou au contraire quand tu veux lui faire découvrir des saveurs
            originales (amande, cabosse de cacao, noix de pécan). C'est notre box
            signature trompe-l'œil, présentée dans un coffret soigné prêt à offrir.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🍪 Box Brownies / Cookies / Mixte — Gourmandise accessible
          </h3>
          <p>
            Plus abordables mais tout aussi efficaces : nos boxes brownies, cookies ou
            mixtes (brownies + cookies + parfois des mini-pancakes) sont parfaites pour
            un cadeau spontané ou pour un petit budget. Le goût artisanal fait toute la
            différence, crois-moi.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Un cadeau prêt à offrir, à récupérer en boutique
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Tu commandes et tu paies <strong>100 % en ligne</strong> par carte bancaire ou
            Apple Pay, puis tu viens chercher ton coffret en click & collect à la boutique
            Maison Mayssa, dans la galerie marchande du centre commercial Carrefour, 134
            avenue de Genève à Annecy. Créneaux de retrait de <strong>18h30 à 2h du matin,
            7 jours sur 7</strong>.
          </p>
          <p>
            <strong>Retrait gratuit en boutique</strong>. Chaque coffret est présenté dans
            un packaging soigné, prêt à offrir : tu n'as plus qu'à le remettre à la personne.
            Et si tu préfères, quelqu'un d'autre peut venir le récupérer avec ton numéro de
            commande.
          </p>
          <p>
            Option : je peux ajouter <strong>un petit mot manuscrit</strong> de ta part
            (ou imprimer un message) pour accompagner le cadeau. Précise-le dans les notes
            de commande.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Conseils pour choisir le bon coffret
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <ul className="space-y-3 list-none p-0">
            <li>
              <strong>Tu veux impressionner</strong> → Box Découverte (40 €). Compose 5
              trompe-l'œil au choix — l'effet wow est garanti.
            </li>
            <li>
              <strong>La personne aime le chocolat</strong> → Box Brownies (9 saveurs, dont
              Nutella Oreo, El Mordjene, Caramel Cacahuète). Ou trompe-l'œil cabosse de
              cacao pour un combo wow + chocolat.
            </li>
            <li>
              <strong>La personne préfère les saveurs fruitées</strong> → Box Découverte avec
              mangue, passion, framboise, fraise.
            </li>
            <li>
              <strong>Tu ne connais pas ses goûts</strong> → Box Mixte. Il y a forcément
              quelque chose qui lui plaira, et elle peut partager avec son entourage.
            </li>
            <li>
              <strong>Budget serré</strong> → Box Brownies ou Box Cookies (moins de 25 €).
              L'effet artisanal reste intact, le prix reste accessible.
            </li>
            <li>
              <strong>Occasion spéciale (mariage, naissance)</strong> → Contacte-moi par
              WhatsApp pour un devis personnalisé. Je peux faire des assortiments sur
              mesure, adapter les quantités et organiser le retrait pour les gros volumes.
            </li>
          </ul>
        </div>
      </section>
    </PillarPageLayout>
  )
}
