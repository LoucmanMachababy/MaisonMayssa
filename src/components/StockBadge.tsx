interface StockBadgeProps {
  stock: number | null
  isPreorderDay: boolean
  dayNames: string
  compact?: boolean
}

export function StockBadge({ stock, isPreorderDay, dayNames, compact = false }: StockBadgeProps) {
  // Not a managed product
  if (stock === null) return null

  // Sold out
  if (stock <= 0) {
    return (
      <span className={`inline-flex items-center font-bold text-red-600 bg-red-50 border border-red-200 ${
        compact ? 'text-[8px] px-1.5 py-0.5 rounded-md' : 'text-[10px] px-2 py-1 rounded-lg'
      }`}>
        Rupture de stock
      </span>
    )
  }

  // Not the right day
  if (!isPreorderDay) {
    return (
      <span className={`inline-flex items-center font-bold text-orange-600 bg-orange-50 border border-orange-200 ${
        compact ? 'text-[8px] px-1.5 py-0.5 rounded-md' : 'text-[10px] px-2 py-1 rounded-lg'
      }`}>
        Dispo {dayNames}
      </span>
    )
  }

  // Low stock warning
  if (stock <= 5) {
    return (
      <span className={`inline-flex items-center font-bold text-orange-600 bg-orange-50 border border-orange-200 ${
        compact ? 'text-[8px] px-1.5 py-0.5 rounded-md' : 'text-[10px] px-2 py-1 rounded-lg'
      }`}>
        Plus que {stock} !
      </span>
    )
  }

  // Available
  return (
    <span className={`inline-flex items-center font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 ${
      compact ? 'text-[8px] px-1.5 py-0.5 rounded-md' : 'text-[10px] px-2 py-1 rounded-lg'
    }`}>
      {stock} disponibles
    </span>
  )
}
