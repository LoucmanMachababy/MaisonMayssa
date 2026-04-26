import { PillarPageLayout } from '../components/PillarPageLayout'

export function TrompeLoeilAnnecyPage() {
  return (
    <PillarPageLayout
      title="Trompe-l'œil pâtissier Annecy — Maison Mayssa, créations artisanales"
      description="Trompe-l'œil pâtissier à Annecy : mangue, pistache, passion, amande, cabosse de cacao… Créations artisanales Maison Mayssa, précommande 3 jours, livraison offerte dès 50€."
      canonical="https://maison-mayssa.fr/trompe-loeil-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: "Trompe-l'œil Annecy" },
      ]}
      heroImage="/Trompe-loeil-header.webp"
      heroEyebrow="Pâtisserie artisanale Annecy"
      heroTitle="L'art du trompe-l'œil pâtissier à Annecy"
      heroSubtitle="Des fruits qui trompent l'œil, des saveurs qui régalent. Créations artisanales faites main."
      categoryProductIds={[
        'trompe-loeil-mangue',
        'trompe-loeil-citron',
        'trompe-loeil-pistache',
        'trompe-loeil-passion',
        'trompe-loeil-framboise',
        'trompe-loeil-cacahuete',
        'trompe-loeil-fraise',
        'trompe-loeil-myrtille',
        'trompe-loeil-cafe',
        'trompe-loeil-vanille',
        'trompe-loeil-pecan',
        'trompe-loeil-amande',
        'trompe-loeil-cabosse',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: "Qu'est-ce qu'un trompe-l'œil pâtissier ?",
          a: "Un trompe-l'œil pâtissier est une création artisanale qui reproduit visuellement un vrai fruit, une coque ou un élément naturel, mais dont l'intérieur cache une pâtisserie gourmande — ganache, coulis, mousse ou praliné. L'effet de surprise est garanti : on croit croquer dans une mangue ou une framboise, et on découvre une explosion de saveurs.",
        },
        {
          q: "Combien de temps à l'avance dois-je commander ?",
          a: "Les trompe-l'œil fonctionnent en précommande : environ 3 jours entre ta commande et la récupération. C'est le temps nécessaire pour façonner la coque, préparer les ganaches et coulis, puis assembler chaque pièce à la main.",
        },
        {
          q: "Quelles saveurs de trompe-l'œil proposez-vous ?",
          a: "Actuellement 13 saveurs : mangue, citron, pistache, passion, framboise, fraise, myrtille, café, vanille, cacahuète, noix de pécan, amande et cabosse de cacao. La gamme évolue régulièrement, consulte la carte à jour sur le site.",
        },
        {
          q: "Livrez-vous les trompe-l'œil à Annecy ?",
          a: "Oui, livraison sur Annecy et alentours (rayon 5-10 km : Seynod, Annecy-le-Vieux, Meythet, Pringy, Cran-Gevrier, Épagny). Livraison offerte dès 50 € d'achat, sinon forfait 5 €. Retrait sur place possible.",
        },
        {
          q: "Combien coûte un trompe-l'œil ?",
          a: "Nos trompe-l'œil classiques sont à 6 €, les saveurs premium (cacahuète, noix de pécan) à 7 €, les créations signature (amande, cabosse de cacao) à partir de 7,50 €. Des box de 5 ou 7 trompe-l'œil sont disponibles pour économiser.",
        },
      ]}
      relatedPages={[
        'brownies-annecy',
        'cookies-annecy',
        'patisserie-anniversaire-annecy',
      ]}
    >
      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Qu'est-ce qu'un trompe-l'œil pâtissier ?
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Le <strong>trompe-l'œil pâtissier</strong> est une discipline artisanale où le
            pâtissier reproduit visuellement un fruit, une coque ou un élément naturel avec
            une précision bluffante. À l'extérieur : une mangue, un citron, une framboise,
            une amande qu'on jurerait fraîchement cueillie. À l'intérieur : une pâtisserie
            gourmande — ganache, coulis, mousse, biscuit moelleux.
          </p>
          <p>
            Cette technique exigeante repose sur le façonnage minutieux de coques en
            chocolat blanc teinté, en pâte à sucre ou en pâte d'amande. Chaque détail
            compte : la texture, les nuances de couleur, les petits défauts naturels qui
            donnent l'illusion parfaite. Quand on croque dedans, c'est la surprise totale —
            le visuel trompe l'œil, le goût régale le palais.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Des trompe-l'œil faits main à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Chez <strong>Maison Mayssa à Annecy</strong>, chaque trompe-l'œil est façonné
            à la main, à la commande. Pas de production industrielle, pas de pièces en
            stock qui vieillissent : je prépare chaque création spécifiquement pour toi
            quand tu commandes.
          </p>
          <p>
            Ce choix de la précommande n'est pas un hasard. Il me permet de garantir
            la <strong>fraîcheur absolue</strong> au moment de la dégustation : les coulis
            sont préparés peu avant la livraison, les ganaches montées à la minute, les
            coques sont assemblées dans les heures qui précèdent la récupération. Le
            résultat, c'est une pâtisserie qui n'a rien à voir avec ce que tu trouves
            dans le commerce : textures vivantes, goûts intenses, sensations authentiques.
          </p>
          <p>
            Je livre sur <strong>Annecy et alentours</strong> dans un rayon d'environ 5 à
            10 km : Annecy centre, Annecy-le-Vieux, Seynod, Meythet, Pringy, Cran-Gevrier,
            Épagny. Service de 18h30 à 2h du matin, 7 jours sur 7.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Nos 13 saveurs de trompe-l'œil
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            La gamme évolue au fil des saisons et de mes envies. Voici les saveurs
            actuellement disponibles chez Maison Mayssa :
          </p>
          <ul className="space-y-2 list-none p-0">
            <li>
              <strong>🥭 Mangue</strong> — Morceaux de mangue fraîche, coulis, ganache
              mangue, coque chocolat blanc. Best-seller.
            </li>
            <li>
              <strong>🍋 Citron</strong> — Curd citron, ganache citron, biscuit moelleux.
              Frais, vif, équilibré.
            </li>
            <li>
              <strong>🌰 Pistache</strong> — Pâte de pistache, ganache, éclats de pistache
              grillée. Intensité pure.
            </li>
            <li>
              <strong>🍑 Passion</strong> — Coulis passion, ganache, biscuit. Exotique et
              acidulé.
            </li>
            <li>
              <strong>🫐 Framboise</strong> — Coulis framboise, morceaux, ganache.
              Fruité absolu.
            </li>
            <li>
              <strong>🍓 Fraise</strong> — Fraises fraîches, coulis, crème, pâte à sucre.
            </li>
            <li>
              <strong>🫐 Myrtille</strong> — Ganache vanille, coulis et morceaux de
              myrtilles, biscuit moelleux.
            </li>
            <li>
              <strong>☕ Café</strong> — Mousse mascarpone café, cœur fondant, biscuit
              imbibé, cacao.
            </li>
            <li>
              <strong>🍦 Vanille (gousse)</strong> — Ganache vanille Bourbon, coulis
              fondant, biscuit moelleux.
            </li>
            <li>
              <strong>🥜 Cacahuète</strong> — Cacahuètes caramélisées, praliné, crème
              beurre de cacahuète, pâte à sucre.
            </li>
            <li>
              <strong>🌰 Noix de pécan</strong> — Praliné noix de pécan, caramel beurre
              salé, ganache onctueuse, coque chocolat.
            </li>
            <li>
              <strong>🌰 Amande</strong> — Crème d'amande, amandes effilées, ganache
              vanille, biscuit moelleux. <em>Nouveauté 2026.</em>
            </li>
            <li>
              <strong>🍫 Cabosse de cacao</strong> — Ganache chocolat intense, mousse
              cacao, praliné, biscuit chocolat. <em>Nouveauté 2026.</em>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Quels ingrédients pour nos trompe-l'œil ?
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            La qualité d'un trompe-l'œil pâtissier se joue sur les détails. Chez Maison
            Mayssa, je sélectionne avec soin chaque ingrédient :
          </p>
          <ul className="space-y-2 list-none p-0">
            <li>
              <strong>Fruits frais de saison</strong> — mangues mûres à point, framboises
              parfumées, citrons non traités. Je refuse les fruits congelés ou reconstitués.
            </li>
            <li>
              <strong>Chocolats de couverture</strong> — chocolats blanc, au lait et noir
              de qualité pour les coques, qui fondent proprement et ne laissent aucune
              trace cireuse en bouche.
            </li>
            <li>
              <strong>Pralinés maison</strong> — pour la cacahuète, la pistache, la noix de
              pécan : je fais mon propre praliné pour garantir un goût brut et intense.
            </li>
            <li>
              <strong>Ganaches montées à la minute</strong> — légèreté, texture soyeuse,
              jamais granuleuse.
            </li>
            <li>
              <strong>Pâte à sucre et pâte d'amande</strong> — pour les finitions visuelles,
              toujours au goût naturel.
            </li>
          </ul>
          <p>
            Pas de conservateurs cachés, pas de colorants artificiels douteux, pas de
            poudres à diluer. C'est ce qui explique que la dégustation d'un trompe-l'œil
            Maison Mayssa n'a pas le même goût qu'une pâtisserie industrielle.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Comment commander un trompe-l'œil à Annecy ?
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Le processus est simple :
          </p>
          <ol className="space-y-2 list-decimal pl-5">
            <li>
              <strong>Choisis tes trompe-l'œil</strong> sur le site (à l'unité, en box de 5
              ou 7). Ajoute au panier.
            </li>
            <li>
              <strong>Remplis tes infos</strong> — mode retrait ou livraison, date et heure
              de récupération (3 jours minimum pour les trompe-l'œil), numéro de téléphone.
            </li>
            <li>
              <strong>Envoie ta commande</strong> via WhatsApp, Instagram ou Snapchat. Le
              message est pré-rempli, il suffit de l'envoyer.
            </li>
            <li>
              <strong>Je te confirme</strong> rapidement par message la commande et l'heure
              exacte.
            </li>
            <li>
              <strong>Paiement à la livraison / au retrait</strong> ou via PayPal. Aucun
              paiement en ligne obligatoire.
            </li>
          </ol>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Offrir un trompe-l'œil en cadeau à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Les trompe-l'œil sont un cadeau qui marque. Effet wow garanti à l'ouverture
            de la box, conversation assurée pendant toute la soirée. Parfait pour un
            anniversaire, une pendaison de crémaillère, un cadeau "merci" ou une
            attention originale à offrir à quelqu'un qui a déjà tout.
          </p>
          <p>
            Les <strong>box de 5 ou 7 trompe-l'œil</strong> sont présentées dans un
            packaging soigné, prêt à offrir. Tu peux aussi panacher avec des brownies
            ou des cookies pour composer un coffret gourmand complet.
          </p>
        </div>
      </section>
    </PillarPageLayout>
  )
}
