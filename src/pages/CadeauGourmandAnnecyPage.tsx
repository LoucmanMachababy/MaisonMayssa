import { PillarPageLayout } from '../components/PillarPageLayout'

export function CadeauGourmandAnnecyPage() {
  return (
    <PillarPageLayout
      title="Cadeau gourmand Annecy — Coffrets pâtissiers Maison Mayssa"
      description="Cadeau gourmand original à Annecy : coffrets trompe-l'œil, boxes mixtes brownies & cookies, assortiments pâtissiers artisanaux. Livraison offerte dès 50€."
      canonical="https://maison-mayssa.fr/cadeau-gourmand-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Cadeau gourmand Annecy' },
      ]}
      heroImage="/box-mixte.webp"
      heroEyebrow="Cadeau original"
      heroTitle="Cadeau gourmand à Annecy"
      heroSubtitle="Boxes et coffrets artisanaux à offrir — un cadeau qui marque, plus qu'une simple boîte de chocolats."
      categoryProductIds={[
        'box-trompe-loeil',
        'box-mixte',
        'box-decouverte-trompe-5',
        'box-fruitee',
        'box-de-tout',
        'box-brownies',
        'box-cookies',
        'mini-box-mixte',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: "Quel coffret offrir comme cadeau gourmand ?",
          a: "Pour impressionner : la Box 7 Trompe-l'œil (50 €) ou la Box Découverte 5 Trompe-l'œil au choix (40 €). Pour un cadeau plus accessible : la Box Mixte brownies + cookies (25 €). Pour une touche fruitée : la Box Fruitée (35 €). Je panache avec plaisir selon le budget.",
        },
        {
          q: "Le cadeau est-il présentable à offrir tel quel ?",
          a: "Oui, nos boxes sont présentées dans un packaging soigné qui donne envie. Tu peux l'offrir directement, pas besoin de paquet cadeau supplémentaire. Sur demande, je peux ajouter un petit mot manuscrit.",
        },
        {
          q: "Puis-je livrer le cadeau directement à la personne ?",
          a: "Bien sûr ! Indique l'adresse du destinataire à la commande et j'irai livrer directement chez elle/lui. Précise le créneau horaire idéal (18h30-2h, 7j/7 sur Annecy et alentours).",
        },
        {
          q: "Combien à l'avance faut-il commander ?",
          a: "Pour les boxes avec trompe-l'œil (Box 7, Box Découverte, Box Fruitée) : 3 jours minimum. Pour les boxes brownies / cookies / mixtes : 24h à 48h avant. Pour un cadeau urgent : contacte-moi par WhatsApp, je fais au mieux.",
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
            🎁 Box 7 Trompe-l'œil — Le cadeau signature
          </h3>
          <p>
            L'intégrale des 7 saveurs classiques de trompe-l'œil : mangue, citron, pistache,
            passion, framboise, cacahuète, fraise. 50 € (au lieu de 55,50 € à l'unité).
            Présentée dans une boîte qui donne envie. C'est le cadeau signature Maison
            Mayssa, celui qui marque les esprits.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🍫 Box de tout — La box signature au choix
          </h3>
          <p>
            Un assortiment généreux de trompe-l'œil, brownies et cookies. Pour les grands
            gourmands qui veulent tout goûter. À panacher selon les préférences du destinataire.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🎲 Box Découverte 5 Trompe-l'œil — À composer
          </h3>
          <p>
            40 € — Choisis 5 trompe-l'œil parmi toute notre gamme (13 saveurs). Idéal
            quand tu connais les goûts de la personne et que tu veux sélectionner ses
            préférés. Ou au contraire quand tu veux lui faire découvrir des saveurs
            originales (amande, cabosse de cacao, noix de pécan).
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🍓 Box Fruitée — Légèreté et fraîcheur
          </h3>
          <p>
            35 € — 6 trompe-l'œil fruités au choix parmi mangue, passion, fraise, framboise,
            myrtille, citron, grappe de banane. Plus léger, parfait pour un cadeau de
            printemps / été ou pour quelqu'un qui préfère les saveurs fruitées aux
            chocolats lourds.
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
          Livraison cadeau directement chez le destinataire
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Tu peux m'indiquer <strong>l'adresse du destinataire</strong> directement à la
            commande, et je livre chez lui / elle dans le créneau que tu précises. Service
            de <strong>18h30 à 2h du matin, 7 jours sur 7</strong>, sur Annecy et alentours
            (rayon 5-10 km : Seynod, Annecy-le-Vieux, Meythet, Pringy, Cran-Gevrier,
            Épagny).
          </p>
          <p>
            <strong>Livraison offerte dès 50 € d'achat</strong>. Sinon forfait de 5 €.
            Pour les zones plus éloignées, contacte-moi par WhatsApp pour qu'on s'arrange.
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
              <strong>Tu veux impressionner</strong> → Box 7 Trompe-l'œil (50 €). L'effet wow
              est garanti, même pour quelqu'un qui pense tout avoir déjà goûté.
            </li>
            <li>
              <strong>La personne aime le chocolat</strong> → Box Brownies (9 saveurs, dont
              Nutella Oreo, El Mordjene, Caramel Cacahuète). Ou trompe-l'œil cabosse de
              cacao pour un combo wow + chocolat.
            </li>
            <li>
              <strong>La personne préfère les saveurs fruitées</strong> → Box Fruitée (35 €)
              ou Box Découverte avec mangue, passion, framboise, fraise.
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
              mesure, adapter les quantités, prévoir une livraison coordonnée.
            </li>
          </ul>
        </div>
      </section>
    </PillarPageLayout>
  )
}
