import { PillarPageLayout } from '../components/PillarPageLayout'

export function CookiesAnnecyPage() {
  return (
    <PillarPageLayout
      title="Cookies artisanaux Annecy — Maison Mayssa, faits maison 7j/7"
      description="Cookies artisanaux à Annecy : Kinder Bueno, Nutella Oreo, Spéculoos Framboise, Caramel Daim… 11 saveurs moelleuses faites maison. Livraison et retrait 7j/7."
      canonical="https://maison-mayssa.fr/cookies-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Cookies Annecy' },
      ]}
      heroImage="/cookie-kinder-bueno.webp"
      heroEyebrow="Pâtisserie gourmande Annecy"
      heroTitle="Cookies artisanaux à Annecy"
      heroSubtitle="Moelleux à cœur, croustillants sur les bords, garnitures généreuses. 11 recettes maison."
      categoryProductIds={[
        'cookie-nutella-kinder-bueno',
        'cookie-nutella-oreo',
        'cookie-speculoos-framboise',
        'cookie-nutella-fraise',
        'cookie-fruits-rouges-bois',
        'cookie-chocolat-blanc-framboise',
        'cookie-caramel-daim',
        'cookie-caramel-cacahuete',
        'cookie-pistache-framboise',
        'cookie-praline-noix-pecan',
        'cookie-tiramisu-cafe',
        'cookie-creme-brulee-vanille',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: 'Quelle est la particularité de vos cookies ?',
          a: "Mes cookies sont faits maison avec une pâte reposée et beaucoup de garniture. Résultat : un extérieur légèrement croustillant, un intérieur moelleux et dense, et des inclusions généreuses (chocolat, praliné, biscuits, fruits) qui font toute la différence avec un cookie standard.",
        },
        {
          q: 'Quelle saveur de cookie choisir ?',
          a: "Pour un classique rassurant : Kinder Bueno ou Nutella Oreo. Pour les amateurs d'originalité : Tiramisu Café, Crème Brûlée Vanille ou Praliné Noix de Pécan. Pour les fans de fruits : Spéculoos Framboise ou Chocolat Blanc Framboise.",
        },
        {
          q: 'Les cookies sont-ils disponibles tout de suite ?',
          a: "Oui, généralement disponibles le jour même selon le stock, ou le lendemain. Commande avant 17h pour récupération le soir. Contrairement aux trompe-l'œil, les cookies ne demandent pas de précommande longue.",
        },
        {
          q: 'Combien coûte un cookie ?',
          a: "Tous nos cookies sont à 3 € l'unité. Des boxes de plusieurs cookies sont disponibles pour composer un goûter, partager en soirée ou offrir.",
        },
        {
          q: 'Puis-je commander des mini-cookies ?',
          a: "Oui ! Nous proposons la Box Mini Cookies (4 €) — mini cookies croustillants avec coulis au choix (Nutella, Bueno, Spéculoos, Pistache). Parfait pour les petits gourmands ou pour varier.",
        },
      ]}
      relatedPages={[
        'trompe-loeil-annecy',
        'brownies-annecy',
        'cadeau-gourmand-annecy',
      ]}
    >
      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Des cookies artisanaux, faits maison à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Un cookie bien fait, c'est simple et compliqué à la fois. Simple parce qu'il
            ne contient que quelques ingrédients de base. Compliqué parce que la texture
            parfaite — <strong>croustillante sur les bords, moelleuse à cœur, chewy mais
            pas mou</strong> — demande un équilibre précis entre beurre, sucres, farine,
            œufs, et surtout, un repos de la pâte.
          </p>
          <p>
            Chez <strong>Maison Mayssa à Annecy</strong>, je fais mes cookies à la main,
            avec du beurre frais, un mélange de sucre roux et sucre blanc (pour la
            caramélisation), et surtout beaucoup de garniture. Chaque cookie est
            généreusement chargé en chocolat, biscuits, praliné ou fruits selon la recette.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          11 recettes de cookies pour tous les goûts
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Un bon cookie doit avoir une personnalité. Voici les 11 recettes de la maison :
          </p>
          <ul className="space-y-2 list-none p-0">
            <li>
              <strong>Kinder Bueno</strong> — Cookie fondant au Nutella sublimé par le
              croquant du Kinder Bueno.
            </li>
            <li>
              <strong>Nutella Oreo</strong> — Nutella fondant et éclats d'Oreo. Duo iconique.
            </li>
            <li>
              <strong>Spéculoos Framboise</strong> — Pâte de spéculoos et coulis framboise.
              Épicé et fruité.
            </li>
            <li>
              <strong>Nutella Fraise</strong> — Nutella fondant et fraises fraîches.
              Réconfortant.
            </li>
            <li>
              <strong>Fruits Rouges des Bois</strong> — Mélange framboise, mûre, groseille
              dans une pâte moelleuse.
            </li>
            <li>
              <strong>Chocolat Blanc Framboise</strong> — Contraste parfait entre la
              douceur du chocolat blanc et l'acidité de la framboise.
            </li>
            <li>
              <strong>Caramel Daim</strong> — Caramel fondant et pépites de Daim croquantes.
            </li>
            <li>
              <strong>Caramel Cacahuète</strong> — Crème pâtissière douce, caramel beurre
              salé et cacahuète croquante.
            </li>
            <li>
              <strong>Pistache Framboise</strong> — Subtil contraste entre pistache douce
              et framboise fruitée.
            </li>
            <li>
              <strong>Praliné Noix de Pécan</strong> — Cookie au praliné maison avec éclats
              de noix de pécan.
            </li>
            <li>
              <strong>Tiramisu Café</strong> — L'esprit tiramisu en cookie : café, mascarpone,
              cacao. Créatif.
            </li>
            <li>
              <strong>Crème Brûlée Vanille</strong> — Cookie garni d'un cœur vanille caramélisé.
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Pourquoi choisir un cookie artisanal ?
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Un cookie industriel, c'est standardisé, souvent sec, avec des conservateurs
            pour tenir en rayon des semaines. Un cookie artisanal fait le jour même, c'est
            une autre histoire :
          </p>
          <ul className="space-y-2 list-none p-0">
            <li>
              <strong>Pâte maison</strong> — beurre frais, bons sucres, œufs, farine de qualité.
              Pas d'additifs.
            </li>
            <li>
              <strong>Garnitures généreuses</strong> — de vrais morceaux de chocolat, praliné
              fait maison, fruits frais.
            </li>
            <li>
              <strong>Cuisson juste</strong> — quelques minutes de trop et c'est sec,
              quelques minutes de moins et c'est cru. Je surveille au four.
            </li>
            <li>
              <strong>Fraîcheur</strong> — cuits la journée même ou la veille, livrés / récupérés
              dans les heures qui suivent.
            </li>
          </ul>
          <p>
            C'est ce qui explique pourquoi un cookie Maison Mayssa ne ressemble à aucun
            autre. La texture est vivante, le goût intense, les garnitures se révèlent
            à chaque bouchée.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Commander ses cookies à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Les cookies sont <strong>disponibles en permanence</strong>, sans précommande
            longue. Idéal pour un goûter improvisé, une soirée entre potes, ou un petit
            plaisir solo en fin de journée.
          </p>
          <p>
            Commande avant 17h pour récupération le soir même (service 18h30-2h du matin,
            7j/7). Livraison sur <strong>Annecy et alentours</strong> (rayon 5-10 km),
            offerte dès 50 € d'achat. Retrait sur place également possible.
          </p>
          <p>
            Compose ta box en panachant plusieurs saveurs, ou ajoute des brownies et
            mini-gourmandises pour un goûter complet. Pour les plus gourmands : la{' '}
            <strong>Box Mini Cookies (4 €)</strong> avec coulis au choix (Nutella, Bueno,
            Spéculoos, Pistache).
          </p>
        </div>
      </section>
    </PillarPageLayout>
  )
}
