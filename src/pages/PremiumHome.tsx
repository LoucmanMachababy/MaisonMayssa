import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { EditorialImageBand } from '../components/decorative/EditorialImageBand'
import { GoogleReviewsCarousel } from '../components/GoogleReviewsCarousel'
import { LIFESTYLE } from '../lib/decorativeAssets'
import { trackAttrs } from '../lib/trackAttrs'
import { useSettings } from '../hooks/useSettings'
import { useProducts } from '../hooks/useProducts'
import { FAQ_ITEMS_HOME } from '../lib/faqItems'

export default function PremiumHome() {
  const settings = useSettings()
  const ordersOpen = settings
    ? settings.ordersOpen !== false && !settings.eventModeEnabled
    : false
  /** Texte libre saisi dans l’admin — affiché tel quel, sans phrase automatique. */
  const heroAnnouncement = useMemo(() => {
    const fromRestock = settings?.nextRestockDate?.trim()
    if (fromRestock) return fromRestock
    if (settings?.globalMessageEnabled && settings.globalMessage?.trim()) {
      return settings.globalMessage.trim()
    }
    return null
  }, [settings])

  const categories = [
    { name: 'Les Canette Cake', image: LIFESTYLE.canetteCake, path: '/carte?categorie=canette-cake' },
    { name: 'Nos trompe-l\'œil', image: '/nouvelle-img/mangue-face.png', path: '/carte?categorie=patisseries' },
    { name: 'Le salé', image: LIFESTYLE.sale, path: '/carte?categorie=sale' },
    { name: 'Les Cup de fruits', image: LIFESTYLE.fruits, path: '/carte?categorie=fruits' },
    { name: 'La Chocolaterie', image: LIFESTYLE.chocolaterie, path: '/carte?categorie=chocolaterie' },
    { name: 'Nos jus frais', image: LIFESTYLE.jusFrais, path: '/carte?categorie=jus' },
    { name: 'Événements', image: LIFESTYLE.events, path: '/evenements' },
  ]

  const { comingSoonProducts } = useProducts()

  return (
    <div className="w-full">
      <Helmet>
        <title>Trompe-l&apos;œil pâtissier Annecy · Click &amp; collect | Maison Mayssa</title>
        <meta
          name="description"
          content="Maison Mayssa : trompe-l'œil pâtissiers artisanaux, canette cakes, chocolaterie et événements. Commande en ligne et click & collect à Annecy — galerie marchande du Carrefour, 134 avenue de Genève. Paiement carte & Apple Pay, 7j/7."
        />
        <link rel="canonical" href="https://maison-mayssa.fr/" />
        <meta property="og:title" content="Trompe-l'œil pâtissier Annecy · Click & collect — Maison Mayssa" />
        <meta property="og:description" content="Pâtisseries artisanales qui trompent l'œil, à commander en ligne et à retirer en click & collect à Annecy (galerie marchande du Carrefour, avenue de Genève). Paiement sécurisé, 7j/7." />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS_HOME.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          })}
        </script>
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] w-full flex flex-col overflow-hidden bg-mayssa-espresso">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={LIFESTYLE.heroSpread}
            alt="Assortiment de trompe-l'œil artisanaux Maison Mayssa"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/85 via-mayssa-brown/25 to-mayssa-brown/10" />
        </div>
        
        <div className="relative z-10 flex flex-1 flex-col justify-center text-center px-4 sm:px-6 pt-28 pb-6 sm:pt-32 sm:pb-10 max-w-5xl mx-auto w-full">
          {heroAnnouncement && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block max-w-full px-4 py-2.5 sm:px-6 sm:py-3 mb-4 sm:mb-6 border border-mayssa-gold/70 bg-mayssa-brown/50 backdrop-blur-sm text-xs sm:text-sm md:text-lg lg:text-xl text-mayssa-gold font-medium tracking-[0.1em] sm:tracking-[0.15em] uppercase shadow-lg whitespace-pre-line leading-snug"
            >
              {heroAnnouncement}
            </motion.p>
          )}

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-3xl sm:text-4xl md:text-7xl lg:text-[6rem] text-white mb-4 sm:mb-6 tracking-tight leading-[1.15]"
          >
            L'art du trompe-l'œil pâtissier
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-mayssa-soft/90 mb-6 sm:mb-10 max-w-2xl mx-auto font-light"
          >
            Des créations artisanales pensées pour surprendre l'œil et séduire le palais.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6 max-w-sm sm:max-w-none mx-auto w-full sm:w-auto"
          >
            {ordersOpen ? (
              <>
                <Link 
                  to="/carte" 
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white text-mayssa-brown text-sm tracking-widest uppercase hover:bg-mayssa-gold hover:text-white transition-colors duration-300 cursor-pointer"
                  {...trackAttrs('hero-precommander', 'Précommander', 'cta')}
                >
                  Précommander
                </Link>
                <Link 
                  to="/carte" 
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 border border-white/30 text-white text-sm tracking-widest uppercase hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                  {...trackAttrs('hero-decouvrir-carte', 'Découvrir la carte', 'cta')}
                >
                  Découvrir la carte
                </Link>
              </>
            ) : (
              <Link 
                to="/carte" 
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white text-mayssa-brown text-sm tracking-widest uppercase hover:bg-mayssa-gold hover:text-white transition-colors duration-300 cursor-pointer"
                {...trackAttrs('hero-decouvrir-carte', 'Découvrir la carte', 'cta')}
              >
                Découvrir la carte
              </Link>
            )}
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="relative z-10 shrink-0 px-4 pb-6 sm:pb-8 text-center text-[0.65rem] sm:text-xs md:text-sm text-mayssa-soft/60 tracking-[0.15em] sm:tracking-widest uppercase leading-relaxed"
        >
          Fabrication artisanale — Quantités limitées — Retrait sur créneau
        </motion.p>
      </section>

      {/* Categories - Full Width Grid */}
      <section className="w-full bg-mayssa-brown">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 6).map((category) => (
            <Link 
              key={category.name} 
              to={category.path}
              className="group relative block aspect-square md:aspect-auto md:h-[600px] overflow-hidden"
            >
              <img 
                src={category.image} 
                alt={category.name} 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-mayssa-brown/15 group-hover:bg-mayssa-brown/30 transition-colors duration-500" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <h3 className="font-display text-2xl md:text-3xl lg:text-4xl text-white tracking-[0.15em] uppercase text-center px-4 relative">
                  {category.name}
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white transition-all duration-500 group-hover:w-24" />
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <Link
          to="/evenements"
          className="group relative block w-full h-[280px] sm:h-[360px] md:h-[420px] overflow-hidden"
        >
          <img
            src={LIFESTYLE.events}
            alt="Événements sur mesure Maison Mayssa"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-mayssa-espresso/25 group-hover:bg-mayssa-espresso/40 transition-colors duration-500" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase">Sur mesure</span>
            <h3 className="font-display text-3xl md:text-5xl text-white tracking-[0.12em] uppercase text-center px-4">
              Événements
            </h3>
            <span className="text-white/70 text-sm tracking-widest uppercase group-hover:text-mayssa-gold transition-colors">
              Mariages · Anniversaires · Réceptions
            </span>
          </div>
        </Link>
      </section>

      <TrompeLoeilMarquee variant="dark" />

      {/* Editorial — l'expérience en box */}
      <section className="grid lg:grid-cols-2 bg-mayssa-ivory border-y border-mayssa-brown/5">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative aspect-[4/5] sm:aspect-[5/4] lg:aspect-auto lg:min-h-[560px] overflow-hidden"
        >
          <img
            src={LIFESTYLE.boxOpen}
            alt="Box de trompe-l'œil Maison Mayssa — présentation artisanale"
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center px-8 md:px-14 lg:px-20 py-16 lg:py-24"
        >
          <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-6">L&apos;expérience</span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-mayssa-brown mb-6 leading-tight">
            Chaque création,<br />une illusion parfaite
          </h2>
          <div className="w-12 h-px bg-mayssa-gold/50 mb-8" />
          <p className="text-mayssa-brown/70 font-light leading-relaxed mb-4 max-w-md">
            Nos boxes réunissent l&apos;essence de Maison Mayssa : des trompe-l&apos;œil sculptés à la main,
            présentés avec soin — le cadeau idéal ou la table d&apos;hôte qui fait sensation.
          </p>
          <p className="text-mayssa-brown/50 text-sm font-light leading-relaxed mb-10 max-w-md">
            Cacahuètes caramélisées, fruits éclatants, cabosses de cacao… Chaque bouchée révèle
            des saveurs authentiques derrière l&apos;apparence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/carte?categorie=boxes"
              className="inline-flex items-center justify-center px-8 py-4 bg-mayssa-brown text-white text-xs tracking-widest uppercase hover:bg-mayssa-espresso transition-colors"
            >
              Nos boxes
            </Link>
            <Link
              to="/carte?categorie=patisseries"
              className="inline-flex items-center justify-center px-8 py-4 border border-mayssa-brown/20 text-mayssa-brown text-xs tracking-widest uppercase hover:border-mayssa-gold hover:text-mayssa-gold transition-colors"
            >
              Tous les trompe-l&apos;œil
            </Link>
          </div>
        </motion.div>
      </section>

      <GoogleReviewsCarousel />

      <EditorialImageBand
        image={LIFESTYLE.mangueCluster}
        imageAlt="Trompe-l'œil mangue façonnés à la main — Maison Mayssa"
        imagePosition="center 40%"
        eyebrow="Les coulisses"
        title="L'atelier derrière l'illusion"
        description="Chaque trompe-l'œil naît ici : modelage, glaçage, finitions à la main. Un savoir-faire artisanal qui transforme la pâte en fruit, en noix, en cabosse — pour surprendre avant même la première bouchée."
        ctaLabel="Notre histoire"
        ctaTo="/a-propos"
        reversed
      />

      <EditorialImageBand
        image="/nouvelle-img/Cup-de-fruit-mixte.png"
        imageAlt="Cup de fruits frais — Maison Mayssa"
        imagePosition="center"
        eyebrow="Notre philosophie"
        title="Du sucré, du salé, du frais"
        description="Cookies fondants, brownies généreux, cups de fruits, tablettes pistache, panuozzo italien… Une carte pensée pour toutes les occasions et tous les goûts."
        ctaLabel="Découvrir la carte"
        ctaTo="/carte"
        dark
      />

      {/* Bientôt chez Maison Mayssa */}
      {comingSoonProducts.length > 0 && (
        <section className="py-24 md:py-32 bg-mayssa-ivory border-t border-mayssa-brown/5 overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="font-display text-4xl md:text-5xl text-mayssa-brown mb-4">Bientôt chez Maison Mayssa</h2>
              <div className="w-12 h-px bg-mayssa-gold" />
            </div>
            <Link 
              to="/carte" 
              className="inline-flex items-center gap-2 text-mayssa-brown hover:text-mayssa-gold transition-colors tracking-widest uppercase text-sm"
            >
              Voir toute la carte <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative w-full">
            {/* Gradient masks for smooth fade effect on edges */}
            <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-mayssa-ivory to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-mayssa-ivory to-transparent z-10 pointer-events-none" />
            
            <motion.div 
              className="flex w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            >
              {[1, 2].map((setIndex) => (
                <div key={setIndex} className="flex gap-8 px-4">
                  {comingSoonProducts.map((product) => (
                    <Link to={`/produit/${product.id}`} key={`${setIndex}-${product.id}`} className="group cursor-pointer block w-[260px] md:w-[300px] shrink-0">
                      <div className="relative aspect-[4/5] mb-6 overflow-hidden bg-mayssa-marble">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${product.images && product.images.length > 1 ? 'group-hover:opacity-0' : ''}`}
                        />
                        {product.images && product.images.length > 1 && (
                          <img 
                            src={product.images[1]} 
                            alt={`${product.name} vue 2`} 
                            className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 scale-105 opacity-0 group-hover:opacity-100 group-hover:scale-100"
                          />
                        )}
                      </div>
                      <h3 className="font-display text-xl text-mayssa-brown mb-2">{product.name}</h3>
                      <p className="text-mayssa-brown/60 text-sm font-light line-clamp-2">{product.description}</p>
                    </Link>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Bloc SEO local : click & collect Annecy (signaux géographiques pour Google) */}
      <section className="py-20 md:py-28 px-6 bg-mayssa-soft border-t border-mayssa-brown/5">
        <div className="max-w-4xl mx-auto">
          <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-5 block text-center">
            Click &amp; collect · Annecy
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-mayssa-brown mb-8 text-center leading-tight">
            Votre pâtisserie artisanale à retirer à Annecy
          </h2>
          <div className="space-y-5 text-mayssa-brown/75 font-light leading-relaxed text-base md:text-lg max-w-3xl mx-auto">
            <p>
              <strong className="font-medium text-mayssa-brown">Maison Mayssa</strong> est votre
              pâtisserie artisanale de référence pour les{' '}
              <strong className="font-medium text-mayssa-brown">trompe-l&apos;œil pâtissiers à Annecy</strong>.
              Mangue, pistache, citron, passion, framboise, cabosse de cacao… des fruits qui trompent
              l&apos;œil et régalent les papilles, façonnés à la main pour une fraîcheur absolue.
            </p>
            <p>
              Commandez et payez en ligne, puis récupérez votre commande en{' '}
              <strong className="font-medium text-mayssa-brown">click &amp; collect</strong> à notre
              boutique : <strong className="font-medium text-mayssa-brown">galerie marchande du centre
              commercial Carrefour, 134 avenue de Genève à Annecy</strong>. Ouverture le{' '}
              <strong className="font-medium text-mayssa-brown">4 juillet 2026</strong> — au cœur de la{' '}
              <strong className="font-medium text-mayssa-brown">Haute-Savoie (74)</strong>, à deux pas
              de Seynod, Annecy-le-Vieux et Cran-Gevrier.
            </p>
            <p>
              Au-delà des trompe-l&apos;œil, retrouvez nos brownies fondants, cookies moelleux,
              canette cakes, cups de fruits frais et notre chocolaterie — à retirer de 18h30 à 2h du
              matin, 7 jours sur 7. <Link to="/trompe-loeil-annecy" className="text-mayssa-gold underline underline-offset-2 hover:text-mayssa-brown transition-colors">Découvrir les trompe-l&apos;œil</Link>{' '}
              ou <Link to="/carte" className="text-mayssa-gold underline underline-offset-2 hover:text-mayssa-brown transition-colors">voir toute la carte</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 text-center px-6 bg-mayssa-ivory border-t border-mayssa-brown/5">
        <div className="max-w-3xl mx-auto">
          <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-6 block">Communauté</span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-mayssa-brown mb-8">
            Suivez les coulisses de la Maison
          </h2>
          <p className="text-mayssa-brown/80 font-light text-lg mb-12">
            Découvrez nos nouvelles créations en avant-première, notre savoir-faire artisanal et partagez vos moments de dégustation avec nous.
          </p>
          <a 
            href="https://instagram.com/maison_mayssa74" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 bg-mayssa-brown text-white text-xs tracking-[0.2em] uppercase hover:bg-mayssa-gold transition-colors duration-500 rounded-full shadow-xl"
          >
            Rejoindre @maison_mayssa74 <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>
  )
}
