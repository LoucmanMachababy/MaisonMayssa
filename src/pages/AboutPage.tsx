import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Sparkles, Heart, MapPin, Clock, MessageCircle } from 'lucide-react'
import { PHONE_E164 } from '../constants'
import { EditorialImageBand } from '../components/decorative/EditorialImageBand'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { LIFESTYLE } from '../lib/decorativeAssets'
import {
  PremiumBackLink,
  PremiumPageIntro,
  PremiumCard,
  PremiumSectionTitle,
  PremiumProse,
  PremiumCtaBlock,
  PremiumButton,
} from '../components/layout/PremiumEditorial'

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
        <meta property="og:title" content="Notre histoire — Maison Mayssa, pâtisserie artisanale Annecy" />
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

      <div className="min-h-screen bg-mayssa-soft pt-[104px] pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <PremiumBackLink to="/" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PremiumPageIntro
              eyebrow="Notre histoire"
              title="Maison Mayssa, l'art du trompe-l'œil à Annecy"
              subtitle="Une pâtisserie artisanale où chaque création trompe l'œil et régale les papilles."
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-12 aspect-[16/10] overflow-hidden bg-mayssa-marble"
          >
            <img
              src="/nouvelle-img/photo-trompe-loeil-site.png"
              alt="Box de trompe-l'œil artisanaux Maison Mayssa — cacahuètes et créations pâtissières"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </motion.div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <Heart size={20} className="text-mayssa-gold" />
                <PremiumSectionTitle>Je suis Mayssa</PremiumSectionTitle>
              </div>
              <PremiumProse>
                <p>
                  Passionnée de pâtisserie depuis toujours, j'ai lancé <strong>Maison Mayssa</strong> à
                  Annecy pour partager ma gourmandise et mon amour du fait-maison. Ce qui a commencé
                  par un simple plaisir de cuisiner pour mes proches est devenu une vraie aventure :
                  créer chaque jour des pâtisseries qui font sourire, surprennent et régalent.
                </p>
                <p>
                  Mes <strong>trompe-l'œil pâtissiers</strong> sont devenus ma marque de fabrique.
                  Une mangue qui ressemble à s'y méprendre à un fruit frais, mais qui cache à
                  l'intérieur une ganache onctueuse et un coulis parfumé. Chaque création est un
                  petit défi technique, un hommage à la nature et au savoir-faire artisanal.
                </p>
              </PremiumProse>
            </PremiumCard>

            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} className="text-mayssa-gold" />
                <PremiumSectionTitle>Ma philosophie : l'artisanat, sans compromis</PremiumSectionTitle>
              </div>
              <PremiumProse>
                <p>
                  Chez Maison Mayssa, <strong>tout est fait à la main</strong>, sur commande, avec
                  des ingrédients que je choisis avec soin. Pas de raccourci : juste du bon, du vrai,
                  du savoureux.
                </p>
                <p>
                  Un trompe-l'œil, c'est plusieurs heures de préparation : façonnage, crèmes, coulis,
                  assemblage minutieux, finition. C'est long, c'est exigeant, mais c'est ce qui fait
                  toute la différence.
                </p>
              </PremiumProse>
            </PremiumCard>

            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <Clock size={20} className="text-mayssa-gold" />
                <PremiumSectionTitle>Comment je travaille</PremiumSectionTitle>
              </div>
              <PremiumProse>
                <p>
                  Les <strong>trompe-l'œil fonctionnent en précommande</strong> : compte environ{' '}
                  <strong>3 jours</strong> entre ta commande et la récupération.
                </p>
                <p>
                  Les commandes se passent par <strong>WhatsApp, Instagram ou Snapchat</strong>.
                  Tu remplis ton panier sur le site, tu choisis ton créneau, et un message pré-rempli
                  est généré pour m'envoyer ta commande en un clic.
                </p>
              </PremiumProse>
            </PremiumCard>

            <PremiumCard>
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={20} className="text-mayssa-gold" />
                <PremiumSectionTitle>Pourquoi Annecy ?</PremiumSectionTitle>
              </div>
              <PremiumProse>
                <p>
                  Annecy, c'est chez moi. Je couvre la ville et ses alentours dans un rayon d'environ{' '}
                  <strong>5 à 10 km</strong>. La <strong>livraison est offerte dès 50 € d'achat</strong>{' '}
                  sur la zone habituelle.
                </p>
              </PremiumProse>
            </PremiumCard>

            <PremiumCtaBlock
              title="Envie de goûter ?"
              description="Découvre toute ma carte et compose ton panier. Une question ? Je réponds directement sur WhatsApp."
            >
              <PremiumButton to="/carte">Voir la carte</PremiumButton>
              <PremiumButton
                href={`https://wa.me/${PHONE_E164}`}
                variant="whatsapp"
                external
              >
                <MessageCircle size={16} />
                Me contacter
              </PremiumButton>
            </PremiumCtaBlock>
          </motion.article>

          <p className="mt-12 text-center text-sm text-mayssa-brown/60">
            Des questions sur la commande ou la livraison ?{' '}
            <Link to="/faq" className="text-mayssa-gold hover:text-mayssa-brown transition-colors tracking-widest uppercase text-xs">
              Consulter la FAQ →
            </Link>
          </p>
        </div>
      </div>

      <EditorialImageBand
        image={LIFESTYLE.boxAll}
        imageAlt="Assortiment de trompe-l'œil artisanaux — Maison Mayssa"
        imagePosition="center"
        eyebrow="Savoir-faire"
        title="Chaque détail compte"
        description="Du modelage à la finition, nos trompe-l'œil sont façonnés un par un. Pas de production de masse — juste l'attention portée à chaque courbe, chaque texture, chaque saveur."
        ctaLabel="Voir la carte"
        ctaTo="/carte"
        reversed
      />

      <TrompeLoeilMarquee />
    </>
  )
}
