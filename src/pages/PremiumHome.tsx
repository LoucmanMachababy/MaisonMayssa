import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { CATALOG_PRODUCTS, TROMPE_PREORDER } from '../constants/catalog'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { EditorialImageBand } from '../components/decorative/EditorialImageBand'
import { LIFESTYLE } from '../lib/decorativeAssets'
import { useSettings } from '../hooks/useSettings'
import { getPreorderOpeningDisplayLabel } from '../lib/utils'

export default function PremiumHome() {
  const settings = useSettings()
  const ordersOpen = (settings?.ordersOpen !== false) && !settings?.eventModeEnabled
  const preorderOpeningLabel = useMemo(
    () => getPreorderOpeningDisplayLabel(settings, TROMPE_PREORDER.availableFrom),
    [settings],
  )

  const categories = [
    { name: 'Les Canette Cake', image: '/nouvelle-img/canette-cake-speculos-framboise.png', path: '/carte?categorie=canette-cake' },
    { name: 'Nos trompe-l\'œil', image: LIFESTYLE.heroSpread, path: '/carte?categorie=patisseries' },
    { name: 'Le salé', image: '/nouvelle-img/Panuozzo-Italien.png', path: '/carte?categorie=sale' },
    { name: 'Les Cup de fruits', image: '/nouvelle-img/Cup-de-fruit-mixte.png', path: '/carte?categorie=fruits' },
    { name: 'La Chocolaterie', image: '/nouvelle-img/tablette-chocolat-dubai-pistache.png', path: '/carte?categorie=chocolaterie' },
    { name: 'Nos jus frais', image: '/nouvelle-img/limonade-bresilienne.png', path: '/carte?categorie=jus' },
    { name: 'Événements', image: LIFESTYLE.boxAll, path: '/evenements' },
  ]

  // Filter "Bientôt disponible" products
  const comingSoonProducts = CATALOG_PRODUCTS.filter(p => !p.available && p.visible)

  return (
    <div className="w-full">
      <Helmet>
        <title>Maison Mayssa — Trompe l&apos;œil pâtissier | Précommandes Annecy</title>
        <meta
          name="description"
          content="Maison Mayssa : trompe-l'œil pâtissiers artisanaux, canette cakes, chocolaterie et événements sur mesure. Précommande en ligne, retrait sur créneau."
        />
        <link rel="canonical" href="https://maison-mayssa.fr/" />
      </Helmet>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] w-full flex items-center justify-center py-28 overflow-hidden bg-mayssa-espresso">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={LIFESTYLE.heroSpread}
            alt="Assortiment de trompe-l'œil artisanaux Maison Mayssa"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-mayssa-brown/85 via-mayssa-brown/25 to-mayssa-brown/10" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block px-6 py-3 mb-6 border border-mayssa-gold/70 bg-mayssa-brown/50 backdrop-blur-sm text-sm sm:text-base md:text-lg lg:text-xl text-mayssa-gold font-medium tracking-[0.12em] sm:tracking-[0.15em] uppercase shadow-lg"
          >
            Ouverture des précommandes le {preorderOpeningLabel}
          </motion.p>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-5xl md:text-7xl lg:text-[6rem] text-white mb-6 tracking-tight leading-[1.1]"
          >
            L'art du trompe-l'œil pâtissier
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-mayssa-soft/90 mb-10 max-w-2xl mx-auto font-light"
          >
            Des créations artisanales pensées pour surprendre l'œil et séduire le palais.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          >
            <Link 
              to="/carte" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-mayssa-brown text-sm tracking-widest uppercase hover:bg-mayssa-gold hover:text-white transition-colors duration-300"
            >
              {ordersOpen ? 'Précommander' : 'Découvrir la carte'}
            </Link>
            <Link 
              to="/carte" 
              className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white text-sm tracking-widest uppercase hover:bg-white/10 transition-colors duration-300"
            >
              Découvrir la carte
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 text-xs md:text-sm text-mayssa-soft/60 tracking-widest uppercase"
          >
            Fabrication artisanale — Quantités limitées — Retrait sur créneau
          </motion.p>
        </div>
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
            src="/nouvelle-img/photo-trompe-loeil-site.png"
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

      {/* Google Reviews Carousel */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-6 h-6 text-mayssa-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <h2 className="font-display text-3xl md:text-5xl text-mayssa-brown mb-4">L'avis de nos clients</h2>
            <p className="text-mayssa-brown/50 font-light tracking-[0.2em] uppercase text-xs">Avis Google</p>
          </div>

          <div className="relative overflow-hidden -mx-6 px-6">
            {/* Gradient masks for smooth fade effect on edges */}
            <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            
            <motion.div 
              className="flex w-max"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            >
              {[1, 2].map((setIndex) => (
                <div key={setIndex} className="flex gap-6 px-3">
                  {[
                    { name: 'Sarah M.', text: "Une expérience incroyable ! Les trompe-l'œil sont aussi beaux que bons. Le goût de la mangue est juste exceptionnel, on sent vraiment le fruit frais. Je recommande les yeux fermés." },
                    { name: 'Thomas L.', text: "Découvert sur Instagram, je n'ai pas été déçu. La qualité est au rendez-vous, c'est très fin et peu sucré. La pistache est une vraie merveille. Service client au top." },
                    { name: 'Amélie D.', text: "Des pâtisseries d'une rare élégance. C'est le cadeau parfait pour surprendre ses invités. La cabosse de cacao est intense et le praliné est à tomber par terre." },
                    { name: 'Karim B.', text: "Tout simplement les meilleurs trompe-l'œil que j'ai pu goûter. Le travail artisanal se ressent dans chaque bouchée. Mention spéciale pour la cacahuète qui est incroyable." },
                    { name: 'Julie R.', text: "Une très belle découverte ! Les textures sont parfaites, le visuel est bluffant. On sent que ce sont des produits de qualité. Hâte de goûter les autres créations." }
                  ].map((review, i) => (
                    <div key={i} className="shrink-0 w-[85vw] md:w-[400px] bg-mayssa-soft p-8 md:p-10 rounded-2xl border border-mayssa-brown/5">
                      <div className="flex items-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4 text-mayssa-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-mayssa-brown/80 font-light leading-relaxed mb-8 italic">"{review.text}"</p>
                      <p className="font-display text-lg text-mayssa-brown">{review.name}</p>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

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
        image={LIFESTYLE.boxSeven}
        imageAlt="Box de 7 trompe-l'œil Maison Mayssa"
        imagePosition="center"
        eyebrow="Notre philosophie"
        title="L'illusion parfaite pour une émotion véritable"
        description="Chaque création est sculptée à la main pour tromper l'œil — mangue, citron, cacahuète, cabosse… — avant de révéler des saveurs authentiques qui marquent les esprits."
        ctaLabel="Découvrir notre savoir-faire"
        ctaTo="/a-propos"
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
