import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { HelpCircle, MessageCircle } from 'lucide-react'
import { Footer } from '../components/Footer'
import { FAQ_CATEGORIES } from '../lib/faqItems'
import { PHONE_E164 } from '../constants'
import { hapticFeedback } from '../lib/haptics'

/**
 * Page FAQ dédiée — 15 Q&A regroupées par catégories.
 * SEO : title + description + schema FAQPage via Helmet.
 */
export function FAQPage() {
  // Aplatit toutes les Q&A pour le schema.org FAQPage
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
        <meta
          property="og:title"
          content="FAQ Maison Mayssa — Commande, livraison, précommandes Annecy"
        />
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
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-mayssa-soft">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
          {/* Lien retour */}
          <div className="mb-8">
            <a
              href="/"
              className="text-sm font-bold uppercase tracking-widest text-mayssa-caramel hover:text-mayssa-brown transition-colors"
            >
              ← Retour à la boutique
            </a>
          </div>

          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 sm:mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-mayssa-cream mb-4">
              <HelpCircle size={18} className="text-mayssa-caramel" />
              <span className="text-xs font-bold uppercase tracking-widest text-mayssa-caramel">
                Foire aux questions
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-mayssa-brown leading-tight mb-6">
              Toutes vos questions, mes réponses
            </h1>
            <p className="text-base sm:text-lg text-mayssa-brown/70 font-light leading-relaxed max-w-2xl mx-auto">
              Commande, livraison, précommandes trompe-l'œil, conservation… j'ai rassemblé les
              questions les plus fréquentes. Si tu ne trouves pas ta réponse,{' '}
              <a
                href={`https://wa.me/${PHONE_E164}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-mayssa-caramel hover:text-mayssa-brown transition-colors"
              >
                écris-moi sur WhatsApp
              </a>
              .
            </p>
          </motion.header>

          {/* Catégories */}
          <div className="space-y-8 sm:space-y-10">
            {FAQ_CATEGORIES.map((category, catIdx) => (
              <motion.section
                key={category.id}
                id={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: catIdx * 0.05 }}
                className="section-shell bg-white/80 border border-mayssa-brown/5"
              >
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6 pb-3 border-b-2 border-mayssa-gold/30">
                  {category.title}
                </h2>
                <dl className="space-y-5">
                  {category.items.map((item, i) => (
                    <div
                      key={i}
                      className="pb-5 border-b border-mayssa-brown/10 last:border-0 last:pb-0"
                    >
                      <dt className="text-base font-bold text-mayssa-brown mb-2">{item.q}</dt>
                      <dd className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
                        {item.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.section>
            ))}
          </div>

          {/* CTA contact */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 bg-mayssa-cream/50 rounded-2xl p-6 sm:p-8 text-center"
          >
            <h2 className="text-xl font-display font-bold text-mayssa-brown mb-3">
              Ta question n'est pas dans la liste ?
            </h2>
            <p className="text-sm sm:text-base text-mayssa-brown/80 mb-5 leading-relaxed">
              Écris-moi directement sur WhatsApp, je te réponds rapidement.
            </p>
            <a
              href={`https://wa.me/${PHONE_E164}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticFeedback('medium')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20bd5a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/50"
            >
              <MessageCircle size={18} />
              Me contacter sur WhatsApp
            </a>
          </motion.div>
        </div>
        <Footer />
      </div>
    </>
  )
}
