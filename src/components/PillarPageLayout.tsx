import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { ChevronRight, MessageCircle, ShoppingBag, HelpCircle, ArrowRight } from 'lucide-react'
import { PRODUCTS, PHONE_E164 } from '../constants'
import { PremiumButton, PremiumCtaBlock } from './layout/PremiumEditorial'
import { hapticFeedback } from '../lib/haptics'
import type { FAQItem } from '../lib/faqItems'
import { PILLAR_PAGES, type RelatedPage } from '../lib/pillarPages'

export type BreadcrumbItem = {
  name: string
  url?: string
}

interface PillarPageLayoutProps {
  title: string
  description: string
  canonical: string
  breadcrumb: BreadcrumbItem[]
  heroImage: string
  heroEyebrow: string
  heroTitle: string
  heroSubtitle: string
  /** Les IDs des produits à afficher dans le mini-catalogue (filtre PRODUCTS) */
  categoryProductIds: string[]
  /** Nombre max de produits affichés dans le mini-catalogue (défaut 6) */
  maxCatalogProducts?: number
  /** FAQ spécifiques à la page (3-5 Q&A) */
  faqItems: FAQItem[]
  /** Slugs des autres pages piliers à afficher dans "À découvrir aussi" */
  relatedPages: string[]
  /** Contenu éditorial principal (sections H2 + paragraphes) */
  children: React.ReactNode
}

export function PillarPageLayout({
  title,
  description,
  canonical,
  breadcrumb,
  heroImage,
  heroEyebrow,
  heroTitle,
  heroSubtitle,
  categoryProductIds,
  maxCatalogProducts = 6,
  faqItems,
  relatedPages,
  children,
}: PillarPageLayoutProps) {
  // Filtrer les produits du catalogue
  const catalogProducts = categoryProductIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, maxCatalogProducts)

  // Schema.org ItemList de Product (rich results Google)
  const productSchema = catalogProducts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: catalogProducts.map((product, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description || product.name,
        image: product.image ? `https://maison-mayssa.fr${product.image}` : undefined,
        brand: { '@type': 'Brand', name: 'Maison Mayssa' },
        offers: {
          '@type': 'Offer',
          url: `https://maison-mayssa.fr/produit/${product.id}`,
          priceCurrency: 'EUR',
          price: String(product.price),
          availability: product.preorder
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          seller: { '@id': 'https://maison-mayssa.fr/#bakery' },
        },
      },
    })),
  } : null

  // Schema.org BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      ...(item.url ? { item: `https://maison-mayssa.fr${item.url}` } : {}),
    })),
  }

  // Schema.org FAQPage (pour la section FAQ de la page)
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  } : null

  const related = relatedPages
    .map((slug) => PILLAR_PAGES[slug])
    .filter((p): p is RelatedPage => !!p)

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`https://maison-mayssa.fr${heroImage}`} />
        {productSchema && (
          <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
        )}
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      <div className="min-h-screen bg-mayssa-soft pt-[104px] pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <nav
            aria-label="Fil d'Ariane"
            className="mb-6 flex items-center gap-1.5 text-xs text-mayssa-brown/60 flex-wrap"
          >
            {breadcrumb.map((item, idx) => {
              const isLast = idx === breadcrumb.length - 1
              return (
                <span key={idx} className="flex items-center gap-1.5">
                  {item.url && !isLast ? (
                    <Link
                      to={item.url}
                      className="hover:text-mayssa-gold transition-colors"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-mayssa-brown font-semibold' : ''}>
                      {item.name}
                    </span>
                  )}
                  {!isLast && <ChevronRight size={12} className="text-mayssa-brown/30" />}
                </span>
              )
            })}
          </nav>

          {/* Hero */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 sm:mb-14"
          >
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-mayssa-gold mb-3">
              {heroEyebrow}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-mayssa-brown leading-tight mb-5">
              {heroTitle}
            </h1>
            <p className="text-base sm:text-lg text-mayssa-brown/70 font-light leading-relaxed max-w-2xl mx-auto">
              {heroSubtitle}
            </p>
          </motion.header>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 aspect-[16/10] overflow-hidden bg-mayssa-marble"
          >
            <img
              src={heroImage}
              alt={heroTitle}
              className="w-full h-64 sm:h-80 md:h-96 object-cover"
              loading="eager"
            />
          </motion.div>

          {/* Contenu éditorial */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white border border-mayssa-brown/5 p-8 sm:p-10 space-y-10 sm:space-y-12"
          >
            {children}
          </motion.article>

          {/* Mini-catalogue inline */}
          {catalogProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="mt-12 sm:mt-16 bg-white border border-mayssa-brown/5 p-8 sm:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag size={22} className="text-mayssa-gold" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Nos créations
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {catalogProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/produit/${product.id}`}
                    className="group block"
                    onClick={() => hapticFeedback('light')}
                  >
                    <div className="aspect-square overflow-hidden bg-mayssa-marble mb-2 border border-mayssa-brown/5 group-hover:border-mayssa-gold/30 transition-colors">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-mayssa-brown leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-xs text-mayssa-gold mt-0.5 tracking-wide">
                      {product.price.toFixed(2).replace('.', ',')} €
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  to="/carte"
                  className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-mayssa-brown hover:text-mayssa-gold transition-colors"
                >
                  Voir toute la carte
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.section>
          )}

          {/* FAQ courte */}
          {faqItems.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="mt-12 sm:mt-16 bg-white border border-mayssa-brown/5 p-8 sm:p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle size={22} className="text-mayssa-gold" />
                <h2 className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown">
                  Questions fréquentes
                </h2>
              </div>
              <dl className="space-y-5">
                {faqItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="pb-5 border-b border-mayssa-brown/10 last:border-0 last:pb-0"
                  >
                    <dt className="text-base font-bold text-mayssa-brown mb-2">
                      {item.q}
                    </dt>
                    <dd className="text-sm sm:text-base text-mayssa-brown/85 leading-relaxed">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 pt-5 border-t border-mayssa-brown/10 text-center">
                <Link
                  to="/faq"
                  className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase text-mayssa-brown hover:text-mayssa-gold transition-colors"
                >
                  Voir toutes les questions
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.section>
          )}

          {/* Maillage interne : À découvrir aussi */}
          {related.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className="mt-12 sm:mt-16"
              aria-labelledby="related-pages-heading"
            >
              <h2
                id="related-pages-heading"
                className="text-xl sm:text-2xl font-display font-bold text-mayssa-brown mb-6 text-center"
              >
                À découvrir aussi
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((page) => (
                  <Link
                    key={page.slug}
                    to={`/${page.slug}`}
                    className="group block overflow-hidden bg-white border border-mayssa-brown/5 hover:border-mayssa-gold/30 transition-colors"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-mayssa-cream/40">
                      <img
                        src={page.image}
                        alt={page.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-display text-mayssa-brown mb-1 group-hover:text-mayssa-gold transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-xs text-mayssa-brown/70 leading-relaxed">
                        {page.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 sm:mt-16"
          >
            <PremiumCtaBlock
              title="Envie de passer commande ?"
              description="Découvre toute ma carte ou contacte-moi directement sur WhatsApp."
            >
              <PremiumButton to="/carte">
                <ShoppingBag size={16} />
                Voir la carte
              </PremiumButton>
              <PremiumButton
                href={`https://wa.me/${PHONE_E164}`}
                variant="whatsapp"
                external
                onClick={() => hapticFeedback('medium')}
              >
                <MessageCircle size={16} />
                WhatsApp
              </PremiumButton>
            </PremiumCtaBlock>
          </motion.div>
        </div>
      </div>
    </>
  )
}
