import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Sparkles, Heart, MapPin, Clock, MessageCircle } from 'lucide-react'
import { Footer } from '../components/Footer'
import { PHONE_E164 } from '../constants'
import { hapticFeedback } from '../lib/haptics'

/**
 * Page "À propos" — Notre histoire, Maison Mayssa
 *
 * Contenu éditorial en 1ère personne (chaleureux, personnel).
 * Les passages marqués [À COMPLÉTER] sont à adapter par Mayssa avec
 * son histoire réelle, dates, anecdotes spécifiques.
 *
 * SEO :
 * - Title + meta description dédiés via Helmet
 * - Canonical /a-propos
 * - Schema.org AboutPage
 */
export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>Notre histoire — Maison Mayssa, pâtisserie artisanale Annecy</title>
        <meta
          name="description"
          content="Découvrez Maison Mayssa : pâtisserie artisanale à Annecy, spécialisée dans les trompe-l'œil faits maison. Notre histoire, nos valeurs, notre savoir-faire."
        />
        <link rel="canonical" href="https://maison-mayssa.fr/a-propos" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://maison-mayssa.fr/a-propos" />
        <meta
          property="og:title"
          content="Notre histoire — Maison Mayssa, pâtisserie artisanale Annecy"
        />
        <meta
          property="og:description"
          content="Découvrez Maison Mayssa : pâtisserie artisanale à Annecy, spécialisée dans les trompe-l'œil faits maison."
        />
        <meta property="og:image" content="https://maison-mayssa.fr/logo.webp" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'À propos de Maison Mayssa',
            url: 'https://maison-mayssa.fr/a-propos',
            description:
              "Présentation de Maison Mayssa, pâtisserie artisanale à Annecy spécialisée dans les trompe-l'œil.",
            mainEntity: {
              '@type': 'Bakery',
              '@id': 'https://maison-mayssa.fr/#bakery',
              name: 'Maison Mayssa',
            },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-mayssa-soft">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
          {/* Lien retour */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <a
              href="/"
              className="text-sm font-bold uppercase tracking-widest text-mayssa-caramel hover:text-mayssa-brown transition-colors"
            >
              ← Retour à la boutique
            </a>
          </motion.div>

          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center mb-12 sm:mb-16"
          >
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-gold mb-4">
              Notre histoire
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-mayssa-brown leading-tight mb-6">
              Maison Mayssa, l'art du trompe-l'œil à Annecy
            </h1>
            <p className="text-lg sm:text-xl text-mayssa-brown/70 font-light leading-relaxed max-w-2xl mx-auto">
              Une pâtisserie artisanale où chaque création trompe l'œil et régale les papilles.
            </p>
          </motion.header>

          {/* Image hero */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            className="mb-12 rounded-[2rem] overflow-hidden shadow-lg"
          >
            <img
              src="/Trompe-loeil-header.webp"
              alt="Trompe-l'œil pâtissier Maison Mayssa Annecy"
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
              loading="eager"
            />
          </motion.div>

          {/* Content sections */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            className="section-shell bg-white/80 border border-mayssa-brown/5 space-y-10 sm:space-y-12"
          >
            {/* Intro */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Heart size={22} className="text-mayssa-caramel" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Je suis Mayssa
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
                <p>
                  Passionnée de pâtisserie depuis toujours, j'ai lancé <strong>Maison Mayssa</strong> à
                  Annecy pour partager ma gourmandise et mon amour du fait-maison. Ce qui a commencé
                  par un simple plaisir de cuisiner pour mes proches est devenu une vraie aventure :
                  créer chaque jour des pâtisseries qui font sourire, surprennent et régalent.
                </p>
                <p>
                  Mes <strong>trompe-l'œil pâtissiers</strong> sont devenus ma marque de fabrique.
                  Une mangue qui ressemble à s'y méprendre à un fruit frais, mais qui cache à
                  l'intérieur une ganache onctueuse et un coulis parfumé. Un citron bluffant de
                  réalisme, qui fond en bouche. Chaque création est un petit défi technique, un
                  hommage à la nature et au savoir-faire artisanal.
                </p>
              </div>
            </section>

            {/* Philosophie */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={22} className="text-mayssa-caramel" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Ma philosophie : l'artisanat, sans compromis
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
                <p>
                  Chez Maison Mayssa, <strong>tout est fait à la main</strong>, sur commande, avec
                  des ingrédients que je choisis avec soin. Je privilégie les fruits frais de
                  saison, les chocolats de qualité, les pralinés maison. Pas de colorants artificiels
                  douteux, pas de conservateurs cachés : juste du bon, du vrai, du savoureux.
                </p>
                <p>
                  Je travaille avec passion sur chaque pièce. Un trompe-l'œil, c'est plusieurs heures
                  de préparation : façonnage de la coque, préparation des crèmes et coulis, assemblage
                  minutieux, finition à la pâte à sucre ou au chocolat. C'est long, c'est exigeant,
                  mais c'est ce qui fait toute la différence.
                </p>
              </div>
            </section>

            {/* Process */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={22} className="text-mayssa-caramel" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Comment je travaille
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
                <p>
                  Les <strong>trompe-l'œil fonctionnent en précommande</strong> : je les prépare à
                  la demande pour garantir une fraîcheur absolue le jour de la dégustation. Compte
                  environ <strong>3 jours</strong> entre ta commande et la récupération. C'est le
                  temps qu'il me faut pour faire un travail propre, sans raccourci.
                </p>
                <p>
                  Pour les autres pâtisseries — <strong>brownies, cookies, layer cups, tiramisus,
                  boxes mixtes</strong> — c'est plus souple : elles sont généralement disponibles
                  dans la journée ou le lendemain, selon les stocks. Je produis en petite quantité,
                  toujours frais du jour.
                </p>
                <p>
                  Les commandes se passent par <strong>WhatsApp, Instagram ou Snapchat</strong>.
                  Tu remplis ton panier sur le site, tu choisis ton créneau, et un message pré-rempli
                  est généré pour m'envoyer ta commande en un clic. Je te confirme dès que je l'ai
                  vue.
                </p>
              </div>
            </section>

            {/* Valeurs */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Heart size={22} className="text-mayssa-caramel" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Mes valeurs
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
                <ul className="space-y-3 list-none p-0">
                  <li>
                    <strong>🍓 Qualité avant tout</strong> : ingrédients sélectionnés, frais,
                    sans compromis sur le goût.
                  </li>
                  <li>
                    <strong>✋ Fait-maison intégral</strong> : chaque création est imaginée,
                    préparée et finie à la main.
                  </li>
                  <li>
                    <strong>🎨 Créativité</strong> : je teste régulièrement de nouvelles saveurs
                    et formes pour te surprendre (découvre nos dernières nouveautés amande et
                    cabosse de cacao !).
                  </li>
                  <li>
                    <strong>💬 Proximité client</strong> : je réponds personnellement à chaque
                    message, je suis à l'écoute de tes envies et demandes spéciales.
                  </li>
                  <li>
                    <strong>⏰ Flexibilité horaires</strong> : service étendu de 18h30 à 2h du
                    matin, 7 jours sur 7, parce que la gourmandise ne s'arrête pas à 19h.
                  </li>
                </ul>
              </div>
            </section>

            {/* Pourquoi Annecy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={22} className="text-mayssa-caramel" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Pourquoi Annecy ?
                </h2>
              </div>
              <div className="prose prose-sm sm:prose-base max-w-none text-mayssa-brown/85 space-y-4 leading-relaxed">
                <p>
                  Annecy, c'est chez moi. J'y suis ancrée, j'y cuisine, j'y livre. Je couvre la
                  ville et ses alentours dans un rayon d'environ <strong>5 à 10 km</strong> :
                  Annecy centre, Annecy-le-Vieux, Seynod, Meythet, Pringy, Cran-Gevrier, Épagny.
                  Pour les zones plus éloignées, on s'arrange au cas par cas — contacte-moi par
                  WhatsApp.
                </p>
                <p>
                  La <strong>livraison est offerte dès 50 € d'achat</strong> sur la zone habituelle.
                  Sinon, c'est un petit forfait de 5 €. Le retrait est aussi possible, pour ceux qui
                  veulent passer dire bonjour.
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="bg-mayssa-cream/50 rounded-2xl p-6 sm:p-8 text-center">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-3">
                Envie de goûter ?
              </h2>
              <p className="text-sm sm:text-base text-mayssa-brown/80 mb-5 leading-relaxed">
                Découvre toute ma carte et compose ton panier. Une question ? Je réponds
                directement sur WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/#la-carte"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-mayssa-brown text-white font-bold text-sm hover:bg-mayssa-caramel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
                >
                  Voir la carte
                </a>
                <a
                  href={`https://wa.me/${PHONE_E164}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => hapticFeedback('medium')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
                >
                  <MessageCircle size={18} />
                  Me contacter
                </a>
              </div>
            </section>
          </motion.article>

          {/* Lien FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-mayssa-brown/70 mb-3">
              Des questions précises sur la commande, la livraison, les précommandes ?
            </p>
            <a
              href="/faq"
              className="inline-block text-sm font-bold uppercase tracking-widest text-mayssa-caramel hover:text-mayssa-brown transition-colors"
            >
              Consulte la FAQ complète →
            </a>
          </motion.div>
        </div>
        <Footer />
      </div>
    </>
  )
}
