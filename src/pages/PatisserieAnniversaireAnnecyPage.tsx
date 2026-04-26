import { PillarPageLayout } from '../components/PillarPageLayout'

export function PatisserieAnniversaireAnnecyPage() {
  return (
    <PillarPageLayout
      title="Pâtisserie anniversaire Annecy — Maison Mayssa, livrée le soir"
      description="Pâtisserie d'anniversaire à Annecy : trompe-l'œil spectaculaires, layer cups, boxes mixtes. Livrée le soir 18h30-2h, 7j/7. L'effet wow garanti."
      canonical="https://maison-mayssa.fr/patisserie-anniversaire-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Anniversaire Annecy' },
      ]}
      heroImage="/Boxe-trompeloeil.webp"
      heroEyebrow="Occasion spéciale"
      heroTitle="Pâtisserie d'anniversaire à Annecy"
      heroSubtitle="Trompe-l'œil, layer cups, boxes gourmandes — des pâtisseries qui font l'effet wow le jour J."
      categoryProductIds={[
        'box-trompe-loeil',
        'trompe-loeil-mangue',
        'trompe-loeil-cabosse',
        'layer-mangue-passion',
        'layer-nutella-oreo',
        'layer-pistache-fraise',
        'box-mixte',
        'box-fruitee',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: "Quelle pâtisserie d'anniversaire choisir ?",
          a: "Pour un effet wow garanti, je recommande un trompe-l'œil (mangue, cabosse de cacao, noix de pécan) ou une box de 7 trompe-l'œil à partager. Pour un public plus jeune, une layer cup (Nutella Oreo, Pistache Fraise) fait toujours son effet. Pour un mix de saveurs : une box mixte brownies + cookies + trompe-l'œil.",
        },
        {
          q: "Combien de temps à l'avance commander pour un anniversaire ?",
          a: "Pour les trompe-l'œil et boxes complètes : 3 jours minimum. Pour les brownies, cookies et layer cups : 24h-48h suffisent. Pour une grosse commande événementielle (anniversaire 20+ personnes), contacte-moi directement par WhatsApp pour qu'on s'organise.",
        },
        {
          q: "Livrez-vous les pâtisseries le soir pour l'anniversaire ?",
          a: "Oui, service de 18h30 à 2h du matin, 7j/7. Je peux livrer tes pâtisseries juste avant ou pendant la fête sur Annecy et alentours (rayon 5-10 km). Précise ton créneau préféré à la commande.",
        },
        {
          q: 'Puis-je personnaliser une pâtisserie pour un anniversaire ?',
          a: "Oui, dans une certaine mesure : message sur un tiramisu personnalisé, choix précis des saveurs dans une box découverte ou box fruitée, assortiment sur mesure. Pour les demandes très spécifiques, on en parle par WhatsApp.",
        },
        {
          q: "Quel budget pour un anniversaire ?",
          a: "Tout dépend du nombre d'invités. Un trompe-l'œil = 6 à 8,50 €. Une box de 7 trompe-l'œil = 50 €. Une box mixte brownies + cookies = 25 €. Livraison offerte dès 50 € d'achat.",
        },
      ]}
      relatedPages={[
        'trompe-loeil-annecy',
        'cadeau-gourmand-annecy',
        'brownies-annecy',
      ]}
    >
      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Pourquoi une pâtisserie artisanale pour un anniversaire ?
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Un anniversaire, c'est <strong>un moment de souvenir</strong>. Ce qui marque
            ce n'est pas seulement le cadeau, c'est la <strong>surprise gustative et
            visuelle</strong> qui déclenche des sourires et des exclamations. Une
            pâtisserie artisanale Maison Mayssa, c'est exactement ça : une création qui
            fait parler pendant toute la soirée.
          </p>
          <p>
            Les <strong>trompe-l'œil pâtissiers</strong> sont particulièrement redoutables
            pour un anniversaire. Quand tu sors de sa boîte une "vraie" mangue (sauf que
            c'est de la ganache, du coulis et du chocolat blanc), l'effet est immédiat. Les
            invités prennent des photos, les enfants n'en reviennent pas, les adultes
            veulent tous goûter pour comprendre. C'est un dessert qui devient une
            animation.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Nos pâtisseries idéales pour un anniversaire à Annecy
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🎂 Box de 7 trompe-l'œil — L'effet wow absolu
          </h3>
          <p>
            Sept trompe-l'œil différents dans une box présentable. Quand tu l'offres ou que
            tu la poses sur la table, c'est un moment suspendu. Chacun choisit le fruit qui
            lui fait envie. 50 € (au lieu de 55,50 € à l'unité). Parfait pour un groupe de 7
            personnes, ou pour créer un moment de dégustation collective à 10-15.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🍰 Layer Cups — Le gâteau d'anniversaire revisité
          </h3>
          <p>
            Les layer cups sont notre version artisanale du gâteau d'anniversaire en
            format individuel. Grande et petite taille. Saveurs signature : Mangue Passion,
            Nutella Oreo, Pistache Fraise, Framboise Spéculoos, Lotus Spéculoos, Fraise
            Vanille. On peut les panacher pour que chacun ait sa saveur préférée.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🎁 Box Mini Mixte — Pour les buffets sucrés
          </h3>
          <p>
            La Box Mini Mixte réunit mini brownies, mini cookies et mini pancakes dans un
            assortiment généreux. Idéal pour un buffet d'anniversaire, pour varier les
            plaisirs, et pour que personne ne reste sur sa faim. Les enfants adorent.
          </p>

          <h3 className="text-base font-bold text-mayssa-brown mt-4">
            🍓 Box Fruitée — Pour les amateurs de fraîcheur
          </h3>
          <p>
            6 trompe-l'œil fruités au choix parmi mangue, passion, fraise, framboise,
            myrtille, citron, banane. Plus léger, plus frais, idéal en fin de repas copieux
            ou pour un anniversaire de printemps / été.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Livraison le soir de l'anniversaire
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Maison Mayssa livre <strong>de 18h30 à 2h du matin, 7 jours sur 7</strong>, sur
            Annecy et ses alentours. Cet horaire étendu est pensé pour coller aux moments
            où les gens fêtent : apéro à 19h, dîner à 20h30, surprise de minuit. Tu me
            précises ton créneau, je m'organise.
          </p>
          <p>
            <strong>Zone couverte</strong> : Annecy centre, Annecy-le-Vieux, Seynod,
            Meythet, Pringy, Cran-Gevrier, Épagny (rayon 5-10 km). Livraison offerte dès
            50 € d'achat, sinon forfait 5 €. Pour les zones plus éloignées, on s'arrange au
            cas par cas par WhatsApp.
          </p>
          <p>
            Tu peux aussi opter pour le <strong>retrait sur place</strong> si tu préfères
            venir chercher toi-même. Je suis flexible sur les créneaux.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Anticiper sa commande d'anniversaire
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Pour un anniversaire réussi, mon conseil : <strong>anticipe de 3 à 5 jours</strong>,
            surtout si tu veux des trompe-l'œil. Ça me laisse le temps de préparer
            tranquillement, de respecter le process artisanal, et d'adapter si tu as des
            demandes spécifiques (message personnalisé, couleurs, taille de box).
          </p>
          <p>
            Pour les brownies, cookies et layer cups : 24h à 48h avant suffisent. Pour une
            grosse commande (plus de 20 personnes), contacte-moi par WhatsApp pour qu'on
            s'organise, je peux faire des devis personnalisés et prévoir l'organisation.
          </p>
          <p>
            Le plus simple : remplis le panier sur le site, choisis ta date, et envoie ta
            commande par WhatsApp. Je te confirme l'heure et on est bon.
          </p>
        </div>
      </section>
    </PillarPageLayout>
  )
}
