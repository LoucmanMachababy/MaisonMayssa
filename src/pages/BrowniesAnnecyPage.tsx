import { PillarPageLayout } from '../components/PillarPageLayout'

export function BrowniesAnnecyPage() {
  return (
    <PillarPageLayout
      title="Brownies artisanaux Annecy — Maison Mayssa, fondants faits maison"
      description="Brownies artisanaux à Annecy : Nutella Oreo, Pistache Framboise, El Mordjene, Caramel Cacahuète… 9 saveurs ultra fondantes. Livraison et retrait 7j/7."
      canonical="https://maison-mayssa.fr/brownies-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Brownies Annecy' },
      ]}
      heroImage="/brownie-nutella-oreo.webp"
      heroEyebrow="Pâtisserie gourmande Annecy"
      heroTitle="Brownies artisanaux à Annecy"
      heroSubtitle="Ultra fondants, saveurs originales, faits maison à la demande. 9 recettes pour tous les goûts."
      categoryProductIds={[
        'brownie-nutella-oreo',
        'brownie-el-mordjene',
        'brownie-el-mordjen-kinder',
        'brownie-pistache-framboise',
        'brownie-caramel-cacahuete',
        'brownie-speculoos-framboise',
        'brownie-fraise-vanille',
        'brownie-patissiere-pecan',
        'brownie-tiramisu-cafe',
        'brownie-creme-brule-vanille',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: 'Quelle est la différence entre un brownie artisanal et un brownie industriel ?',
          a: "Un brownie artisanal est fait à partir d'ingrédients bruts (chocolat de couverture, beurre, sucre, œufs) et cuit peu de temps avant dégustation. Pas de conservateurs, pas de poudres. Le résultat : une texture ultra fondante au cœur, légèrement croustillante sur le dessus, et un goût de chocolat intense qu'on ne retrouve pas en industriel.",
        },
        {
          q: 'Quelle saveur de brownie me recommandez-vous ?',
          a: "Pour une première fois, je recommande le Nutella Oreo (best-seller, ultra gourmand) ou le Caramel Cacahuète (croquant / fondant, goût torréfié). Pour les amateurs de pistache, la Pistache Framboise est un must. Le El Mordjene Kinder pour les vraiment gourmands.",
        },
        {
          q: 'Les brownies sont-ils disponibles le jour même ?',
          a: "Oui, généralement les brownies sont disponibles le jour même selon stock, ou au plus tard le lendemain. Ce ne sont pas des précommandes comme les trompe-l'œil. Cutoff : commande avant 17h pour récup' dans la soirée.",
        },
        {
          q: 'Combien coûte un brownie ?',
          a: "Tous nos brownies sont à 3,50 € l'unité. Des boxes de plusieurs brownies sont aussi disponibles pour composer un cadeau ou partager.",
        },
        {
          q: 'Comment conserver les brownies ?',
          a: "Au réfrigérateur entre 2 et 4 °C, dans leur emballage d'origine. Consommation idéale dans les 48h. Sors-les 10 minutes avant dégustation pour retrouver le fondant parfait.",
        },
      ]}
      relatedPages={[
        'trompe-loeil-annecy',
        'cookies-annecy',
        'cadeau-gourmand-annecy',
      ]}
    >
      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Des brownies fondants, faits maison à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Chez <strong>Maison Mayssa à Annecy</strong>, les brownies sont préparés à la
            main, en petite quantité, avec une obsession : le <strong>fondant parfait</strong>.
            Pas un brownie sec et farineux comme on trouve parfois en boulangerie, pas un
            brownie sans goût acheté en grande surface. Un vrai brownie artisanal, avec sa
            croûte légèrement craquante, son cœur dense et coulant, et cette intensité de
            chocolat qui laisse une trace en bouche.
          </p>
          <p>
            Je varie les plaisirs avec <strong>9 saveurs signatures</strong>, entre
            classiques revisités (Nutella Oreo, Caramel Cacahuète) et associations plus
            audacieuses (Pistache Framboise, Tiramisu Café, Crème Brûlée Vanille). Chaque
            brownie est réalisé avec du chocolat de couverture de qualité, du beurre frais,
            des œufs, et des ingrédients premium pour les garnitures.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Nos 9 saveurs de brownies artisanaux
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <ul className="space-y-2 list-none p-0">
            <li>
              <strong>Nutella Oreo</strong> — Chocolat intense, Nutella fondant, éclats
              d'Oreo. Le best-seller.
            </li>
            <li>
              <strong>El Mordjene</strong> — La pâte à tartiner El Mordjene coulante au cœur
              d'un brownie ultra fondant.
            </li>
            <li>
              <strong>El Mordjene Kinder</strong> — Combo ultime : cœur El Mordjene et
              éclats de Kinder Bueno.
            </li>
            <li>
              <strong>Caramel Cacahuète</strong> — Caramel fondant et cacahuètes
              torréfiées croquantes. Le duo qui tue.
            </li>
            <li>
              <strong>Pistache Framboise</strong> — Brownie à la pistache, relevé par
              la fraîcheur acidulée de la framboise.
            </li>
            <li>
              <strong>Spéculoos Framboise</strong> — Fondant chocolaté, spéculoos épicé
              et touche fruitée. Originalité garantie.
            </li>
            <li>
              <strong>Fraise Vanille</strong> — Brownie moelleux aux notes douces de vanille
              et de fraise fraîche.
            </li>
            <li>
              <strong>Noix de Pécan Pâtissière</strong> — Brownie aux noix de pécan caramélisées
              et crème pâtissière vanille.
            </li>
            <li>
              <strong>Tiramisu Café</strong> — L'esprit tiramisu transposé en brownie : café
              intense, mascarpone, cacao.
            </li>
            <li>
              <strong>Crème Brûlée Vanille</strong> — Brownie surmonté d'une crème brûlée
              caramélisée à la vanille. Créatif.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Comment je fais mes brownies
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Le secret d'un brownie réussi, c'est le <strong>bon rapport chocolat / beurre /
            cuisson</strong>. Je fais fondre le chocolat noir avec du beurre frais à basse
            température pour préserver les arômes. Les œufs sont battus juste assez pour
            emprisonner l'air sans alléger la pâte. Je rajoute un peu de sucre, très peu
            de farine (c'est ça le secret du fondant), puis les garnitures spécifiques à
            chaque recette.
          </p>
          <p>
            La cuisson se fait à <strong>température modérée</strong>, juste assez pour que
            le cœur reste coulant. C'est ce qui donne cette texture qu'on reconnaît entre
            mille : la surface craque sous la dent, et le cœur se libère en bouche.
          </p>
          <p>
            Chaque brownie est fait à la commande, emballé soigneusement, livré ou remis
            dans les heures qui suivent. Aucun stock, aucune attente en rayon. Fraîcheur
            absolue.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Commander ses brownies à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Les brownies sont <strong>disponibles en permanence</strong> (pas de précommande
            spécifique comme les trompe-l'œil). Commande avant 17h pour une récupération le
            soir même (entre 18h30 et 2h du matin). Pour les commandes en soirée ou weekend,
            c'est le lendemain au plus tôt.
          </p>
          <p>
            <strong>Zone de livraison</strong> : Annecy centre, Annecy-le-Vieux, Seynod,
            Meythet, Pringy, Cran-Gevrier, Épagny (rayon 5-10 km). Livraison offerte dès
            50 € d'achat, sinon 5 € de forfait. Retrait sur place également possible.
          </p>
          <p>
            Tu peux composer une <strong>box mixte</strong> en panachant plusieurs saveurs,
            ou ajouter des cookies à ta commande. Format idéal pour partager en soirée,
            offrir ou se faire plaisir solo.
          </p>
        </div>
      </section>
    </PillarPageLayout>
  )
}
