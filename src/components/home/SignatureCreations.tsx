import { motion } from 'framer-motion'
import type { ProductWithAvailability } from '../../hooks/useProducts'
import { ProductCard } from '../ProductCard'

interface SignatureCreationsProps {
  products: ProductWithAvailability[]
  onAdd: (product: ProductWithAvailability) => void
  onViewDetail?: (product: ProductWithAvailability) => void
  getStock?: (product: ProductWithAvailability) => number | null
  isPreorderDay?: boolean
  dayNames?: string
}

export function SignatureCreations({
  products,
  onAdd,
  onViewDetail,
  getStock,
  isPreorderDay = true,
  dayNames = '',
}: SignatureCreationsProps) {
  if (products.length === 0) return null

  return (
    <section id="signatures" className="w-full scroll-mt-28">
      <div className="mb-10 sm:mb-12 text-center space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-mayssa-brown/45">
          Créations signatures
        </p>
        <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-mayssa-brown">
          Découvrez nos trompe-l&apos;œil stars
        </h2>
        <p className="text-sm text-mayssa-brown/60 max-w-xl mx-auto">
          Chaque pièce est réalisée en quantité limitée.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 sm:gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard
              product={product}
              onAdd={onAdd}
              onViewDetail={onViewDetail}
              stock={getStock?.(product) ?? null}
              isPreorderDay={isPreorderDay}
              dayNames={dayNames}
              priority={index < 3}
              size="large"
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
