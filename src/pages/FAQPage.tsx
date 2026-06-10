import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { FAQ_CATEGORIES } from '../lib/faqItems'
import { PHONE_E164 } from '../constants'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { LIFESTYLE } from '../lib/decorativeAssets'
import {
  PremiumBackLink,
  PremiumPageIntro,
  PremiumCard,
  PremiumCtaBlock,
  PremiumButton,
} from '../components/layout/PremiumEditorial'

export function FAQPage() {
  const allQA = FAQ_CATEGORIES.flatMap((cat) => cat.items)

  return (
    <>
      <Helmet>
        <title>FAQ Maison Mayssa — Commande, livraison, précommandes Annecy</title>
        <meta
          name="description"
          content="Toutes les questions fréquentes sur Maison Mayssa : commande WhatsApp, livraison Annecy, précommandes trompe-l'œil, paiement, horaires, conservation."
        />
        <link rel="canonical" href="https://maison-mayssa.fr/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://maison-mayssa.fr/faq" />
        <meta property="og:title" content="FAQ Maison Mayssa — Commande, livraison, précommandes Annecy" />
        <meta
          property="og:description"
          content="Toutes les questions fréquentes sur Maison Mayssa, pâtisserie artisanale à Annecy."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: allQA.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-mayssa-soft">
        <div className="relative h-[32vh] min-h-[260px] overflow-hidden bg-mayssa-espresso pt-[104px]">
          <img
            src={LIFESTYLE.heroSpread}
            alt="Assortiment de trompe-l'œil Maison Mayssa"
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-mayssa-brown/50 to-mayssa-soft" />
        </div>

        <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-10 pb-24">
          <PremiumBackLink to="/" />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PremiumPageIntro
              eyebrow="Foire aux questions"
              title="Toutes vos questions, mes réponses"
              subtitle="Commande, livraison, précommandes trompe-l'œil, conservation… Si tu ne trouves pas ta réponse, écris-moi sur WhatsApp."
            />
          </motion.div>

          <div className="space-y-8">
            {FAQ_CATEGORIES.map((category, catIdx) => (
              <motion.div
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: catIdx * 0.05 }}
              >
                <PremiumCard>
                  <h2 className="font-display text-2xl text-mayssa-brown mb-6 pb-3 border-b border-mayssa-gold/30">
                    {category.title}
                  </h2>
                  <dl className="space-y-5">
                    {category.items.map((item, i) => (
                      <div
                        key={i}
                        className="pb-5 border-b border-mayssa-brown/10 last:border-0 last:pb-0"
                      >
                        <dt className="text-base font-medium text-mayssa-brown mb-2">{item.q}</dt>
                        <dd className="text-sm sm:text-base text-mayssa-brown/75 font-light leading-relaxed">
                          {item.a}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </PremiumCard>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <PremiumCtaBlock
              title="Ta question n'est pas dans la liste ?"
              description="Écris-moi directement sur WhatsApp, je te réponds rapidement."
            >
              <PremiumButton href={`https://wa.me/${PHONE_E164}`} variant="whatsapp" external>
                <MessageCircle size={16} />
                WhatsApp
              </PremiumButton>
            </PremiumCtaBlock>
          </motion.div>
        </div>

        <TrompeLoeilMarquee />
      </div>
    </>
  )
}
