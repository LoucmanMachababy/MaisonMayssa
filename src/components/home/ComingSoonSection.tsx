import { motion } from 'framer-motion'
import type { ProductWithAvailability } from '../../hooks/useProducts'
import { ProductCard } from '../ProductCard'

interface ComingSoonSectionProps {
  products: ProductWithAvailability[]
  onViewDetail?: (product: ProductWithAvailability) => void
}

export function ComingSoonSection({ products, onViewDetail }: ComingSoonSectionProps) {
  if (products.length === 0) return null

  return (
    <section id="bientot" className="w-full scroll-mt-28">
      <div className="mb-10 sm:mb-12 text-center space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
          À venir
        </p>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-mayssa-brown">
          Bientôt chez Maison Mayssa
        </h2>
        <p className="text-sm text-mayssa-brown/60 max-w-xl mx-auto">
          De nouvelles créations arrivent bientôt — restez connectés.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
          >
            <ProductCard
              product={product}
              onAdd={() => {}}
              onViewDetail={onViewDetail}
              stock={null}
              comingSoon
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
