import { ALLERGEN_TRACE_NOTE, getProductAllergens } from '../../lib/productAllergens'
import type { ProductCategory } from '../../types'

interface ProductAllergensBlockProps {
  productId: string
  category: ProductCategory
  compact?: boolean
}

export function ProductAllergensBlock({ productId, category, compact }: ProductAllergensBlockProps) {
  const allergens = getProductAllergens(productId, category)

  if (compact) {
    return (
      <p className="text-[10px] text-mayssa-brown/40 leading-relaxed">
        <span className="uppercase tracking-wider text-mayssa-brown/50">Allergènes : </span>
        {allergens.join(' · ')}
      </p>
    )
  }

  return (
    <div className="pt-5 border-t border-mayssa-brown/8">
      <h2 className="text-[10px] tracking-[0.3em] uppercase text-mayssa-brown/40 mb-3">
        Allergènes
      </h2>
      <div className="flex flex-wrap gap-2">
        {allergens.map((allergen) => (
          <span
            key={allergen}
            className="px-2.5 py-1 text-xs border border-mayssa-brown/12 text-mayssa-brown/65 bg-mayssa-soft"
          >
            {allergen}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-mayssa-brown/40 mt-3 leading-relaxed">{ALLERGEN_TRACE_NOTE}</p>
    </div>
  )
}
