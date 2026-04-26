import { motion } from 'framer-motion'
import { Sparkles, Heart, MapPin, Award } from 'lucide-react'

/**
 * Section SEO Annecy — visible en bas de home, avant les avis.
 * ~500 mots de contenu pédagogique/marketing, ciblant :
 *  - "trompe-l'œil pâtissier" (expertise, définition)
 *  - "pâtisserie artisanale Annecy" (ancrage local)
 *  - "ingrédients frais" (qualité)
 *  - GEO : contenu citation-friendly pour ChatGPT/Perplexity
 *
 * Remplace l'ancienne section sr-only (2 lignes) par un vrai contenu
 * visible + indexable.
 */
export function SEOAnnecySection() {
  return (
    <motion.section
      id="seo-annecy"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mt-16 sm:mt-24 scroll-mt-24"
      aria-labelledby="seo-annecy-heading"
    >
      <div className="section-shell bg-white/70 backdrop-blur-3xl border border-mayssa-gold/10 shadow-[0_10px_40px_rgba(212,175,55,0.05)] rounded-[2.5rem] p-8 sm:p-12">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-gold mb-3">
            Pâtisserie artisanale Annecy
          </p>
          <h2
            id="seo-annecy-heading"
            className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-mayssa-brown leading-tight max-w-2xl mx-auto"
          >
            L'art du trompe-l'œil pâtissier à Annecy
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 sm:gap-10">
          {/* Bloc 1 : Qu'est-ce qu'un trompe-l'œil ? */}
          <article className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-mayssa-caramel shrink-0" />
              <h3 className="font-display text-lg font-bold text-mayssa-brown">
                Qu'est-ce qu'un trompe-l'œil pâtissier ?
              </h3>
            </div>
            <p className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
              Un <strong>trompe-l'œil pâtissier</strong> est une création artisanale qui
              reproduit visuellement un vrai fruit, objet ou élément naturel, mais dont
              l'intérieur cache une pâtisserie gourmande. Une mangue, un citron, une framboise :
              chaque création ressemble à s'y méprendre à l'original, jusqu'à la texture et la
              couleur. L'émotion de la découverte, la surprise du goût qui révèle une mousse ou
              une ganache fondante, c'est ce qui rend cet art si spécial.
            </p>
          </article>

          {/* Bloc 2 : Notre atelier */}
          <article className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-mayssa-caramel shrink-0" />
              <h3 className="font-display text-lg font-bold text-mayssa-brown">
                Notre atelier à Annecy
              </h3>
            </div>
            <p className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
              Installée à <strong>Annecy en Haute-Savoie</strong>, Maison Mayssa prépare chaque
              commande à la main dans son atelier. Nous couvrons Annecy centre,
              Annecy-le-Vieux, Seynod, Meythet, Pringy, Cran-Gevrier et Épagny dans un rayon
              d'environ <strong>5 à 10 km</strong>. Livraison offerte dès 50 € d'achat, retrait
              sur place possible. Service étendu de 18h30 à 2h du matin, 7 jours sur 7, parce que
              la gourmandise ne s'arrête pas le soir.
            </p>
          </article>

          {/* Bloc 3 : Nos ingrédients */}
          <article className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-mayssa-caramel shrink-0" />
              <h3 className="font-display text-lg font-bold text-mayssa-brown">
                Des ingrédients frais, sélectionnés avec soin
              </h3>
            </div>
            <p className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
              Chez Maison Mayssa, nous privilégions les <strong>fruits frais de saison</strong>,
              les chocolats de qualité, les pralinés faits maison. Nos coulis sont préparés le
              jour même, nos ganaches montées à la minute. Pas de conservateurs cachés, pas de
              colorants artificiels douteux : juste du bon, du vrai. Nos saveurs évoluent au fil
              des saisons — découvre nos dernières créations <strong>amande</strong> et{' '}
              <strong>cabosse de cacao</strong>, ou les classiques mangue, pistache, citron,
              passion, framboise, fraise.
            </p>
          </article>

          {/* Bloc 4 : Pourquoi nous choisir */}
          <article className="space-y-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-mayssa-caramel shrink-0" />
              <h3 className="font-display text-lg font-bold text-mayssa-brown">
                Pourquoi choisir Maison Mayssa ?
              </h3>
            </div>
            <p className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
              Artisanat 100% fait-maison, créativité sans limites, proximité client : Maison
              Mayssa, c'est une pâtisserie à taille humaine où chaque commande est préparée
              spécifiquement pour vous. Nos <strong>trompe-l'œil en précommande</strong>{' '}
              (3 jours de préparation) garantissent une fraîcheur absolue. Nos{' '}
              <strong>brownies, cookies, layer cups, tiramisus et boxes mixtes</strong> sont
              disponibles en permanence. Commande simple via WhatsApp, Instagram ou Snapchat,
              paiement PayPal ou à la livraison — aucun paiement en ligne obligatoire.
            </p>
          </article>
        </div>

        <div className="mt-10 pt-8 border-t border-mayssa-brown/10 text-center">
          <p className="text-sm sm:text-base text-mayssa-brown/80 leading-relaxed max-w-2xl mx-auto">
            Envie d'en savoir plus sur notre démarche, nos valeurs et notre histoire ?{' '}
            <a
              href="/a-propos"
              className="font-bold text-mayssa-caramel hover:text-mayssa-brown transition-colors underline decoration-mayssa-gold/40 underline-offset-4"
            >
              Découvrir Maison Mayssa →
            </a>
          </p>
        </div>
      </div>
    </motion.section>
  )
}
