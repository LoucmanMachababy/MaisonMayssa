import { PillarPageLayout } from '../components/PillarPageLayout'

export function PatisserieAnniversaireAnnecyPage() {
  return (
    <PillarPageLayout
      title="Pâtisserie anniversaire Annecy — Maison Mayssa, click & collect le soir"
      description="Pâtisserie d'anniversaire à Annecy : trompe-l'œil spectaculaires, layer cups, boxes mixtes. Retrait le soir 18h30-2h en click & collect, 7j/7. L'effet wow garanti."
      canonical="https://maison-mayssa.fr/patisserie-anniversaire-annecy"
      breadcrumb={[
        { name: 'Accueil', url: '/' },
        { name: 'Anniversaire Annecy' },
      ]}
      heroImage="/nouvelle-img/boite-5-trompe-loeil.png"
      heroEyebrow="Occasion spéciale"
      heroTitle="Pâtisserie d'anniversaire à Annecy"
      heroSubtitle="Trompe-l'œil, layer cups, box découverte — des pâtisseries qui font l'effet wow le jour J."
      categoryProductIds={[
        'box-decouverte-trompe-5',
        'box-decouverte-trompe-8',
        'trompe-loeil-mangue',
        'trompe-loeil-cabosse',
        'trompe-loeil-pistache',
        'trompe-loeil-fraise',
      ]}
      maxCatalogProducts={6}
      faqItems={[
        {
          q: "Quelle pâtisserie d'anniversaire choisir ?",
          a: "Pour un effet wow garanti, je recommande un trompe-l'œil (mangue, cabosse de cacao, noix de pécan) ou une box découverte de 5 à 8 trompe-l'œil à composer selon le nombre d'invités. Une box partagée fait toujours son effet pour souffler les bougies à plusieurs.",
        },
        {
          q: "Combien de temps à l'avance commander pour un anniversaire ?",
          a: "Pour les trompe-l'œil et boxes complètes : 3 jours minimum. Pour les brownies, cookies et layer cups : 24h-48h suffisent. Pour une grosse commande événementielle (anniversaire 20+ personnes), contacte-moi directement par WhatsApp pour qu'on s'organise.",
        },
        {
          q: "Puis-je retirer mes pâtisseries le soir pour l'anniversaire ?",
          a: "Oui, en click & collect avec des créneaux de 18h30 à 2h du matin, 7j/7. Tu commandes et tu paies en ligne, puis tu viens chercher tes pâtisseries à la boutique Maison Mayssa, galerie marchande du Carrefour, 134 avenue de Genève à Annecy. Choisis ton créneau juste avant la fête.",
        },
        {
          q: 'Puis-je personnaliser une pâtisserie pour un anniversaire ?',
          a: "Oui, dans une certaine mesure : message sur un tiramisu personnalisé, choix précis des saveurs dans une box découverte ou box fruitée, assortiment sur mesure. Pour les demandes très spécifiques, on en parle par WhatsApp.",
        },
        {
          q: "Quel budget pour un anniversaire ?",
          a: "Tout dépend du nombre d'invités. Un trompe-l'œil = 7,50 à 9,50 €. Une box découverte de 5 trompe-l'œil au choix = 40 €, une box de 8 = 70 €. Retrait gratuit en boutique (click & collect).",
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
            🎂 Box Découverte — 5 trompe-l'œil à composer
          </h3>
          <p>
            Cinq trompe-l'œil différents au choix dans une box présentable. Quand tu l'offres
            ou que tu la poses sur la table, c'est un moment suspendu. Chacun choisit le fruit
            qui lui fait envie. 40 € — parfait pour un groupe de 5 à 10 personnes, ou pour
            créer un moment de dégustation collective.
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
        </div>
      </section>

      <section>
        <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-4">
          Retrait le soir de l'anniversaire
        </h2>
        <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
          <p>
            Maison Mayssa propose le retrait en click & collect <strong>de 18h30 à 2h du
            matin, 7 jours sur 7</strong>. Ces créneaux étendus sont pensés pour coller aux
            moments où les gens fêtent : apéro à 19h, dîner à 20h30, surprise de minuit. Tu
            choisis ton créneau à la commande, et tes pâtisseries sont prêtes à l'heure dite.
          </p>
          <p>
            <strong>Point de retrait</strong> : la boutique Maison Mayssa, dans la galerie
            marchande du centre commercial Carrefour, 134 avenue de Genève à Annecy.
            Commande et paiement se font 100 % en ligne par carte bancaire ou Apple Pay ; il
            ne te reste plus qu'à venir chercher ta commande sur ton créneau.
          </p>
          <p>
            Le <strong>retrait en boutique</strong> est le mode unique : pratique, rapide et
            gratuit. Je reste flexible sur les créneaux pour coller au timing de ta fête.
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
            grosse commande événementielle (plus de 20 personnes), contacte-moi par WhatsApp
            pour qu'on s'organise : je peux faire des devis personnalisés et prévoir
            l'organisation.
          </p>
          <p>
            Le plus simple : remplis le panier sur le site, choisis ta date et ton créneau
            de retrait, puis règle ta commande en ligne par carte bancaire ou Apple Pay. Tu
            reçois ta confirmation et il ne reste plus qu'à venir chercher ta commande en
            boutique.
          </p>
        </div>
      </section>
    </PillarPageLayout>
  )
}
