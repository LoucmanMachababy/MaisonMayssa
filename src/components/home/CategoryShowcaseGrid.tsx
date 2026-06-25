import { motion } from 'framer-motion'
import { CATEGORY_SHOWCASE, type CatalogFilter } from '../../lib/categories'

interface CategoryShowcaseGridProps {
  onCategorySelect: (category: CatalogFilter) => void
}

export function CategoryShowcaseGrid({ onCategorySelect }: CategoryShowcaseGridProps) {
  return (
    <section id="categories" className="w-full scroll-mt-28">
      <div className="mb-10 sm:mb-14 text-center space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
          La maison
        </p>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-mayssa-brown">
          Explorez nos univers
        </h2>
        <p className="text-sm text-mayssa-brown/60 max-w-lg mx-auto">
          Des créations pensées pour surprendre l&apos;œil et séduire le palais.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
        {CATEGORY_SHOWCASE.map((cat, index) => (
          <motion.button
            key={cat.id}
            type="button"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              onCategorySelect(cat.id)
              document.getElementById('la-carte')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="group relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl sm:rounded-3xl cursor-pointer text-left shadow-premium focus:outline-none focus-visible:ring-2 focus-visible:ring-mayssa-gold/60"
          >
            <img
              src={cat.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-mayssa-espresso/75 via-mayssa-espresso/25 to-mayssa-espresso/10 transition-opacity duration-500 group-hover:from-mayssa-espresso/85" />
            <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-8 text-center">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-white/60 mb-2">
                {cat.subtitle}
              </p>
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-[0.12em]">
                {cat.title}
              </h3>
              <span className="mt-4 text-[9px] uppercase tracking-[0.3em] text-mayssa-gold-light opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                Découvrir
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
