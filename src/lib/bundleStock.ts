/**
 * Stock affiché pour une box bundle : minimum des composants.
 * Si au moins un composant est suivi en stock et qu'un autre manque dans Firebase → 0 (rupture).
 * Si aucun composant n'a d'entrée → null (pas de badge stock).
 */
export function getBundleEffectiveStock(
  product: { id: string; bundleProductIds?: string[] },
  getStockFn: (id: string) => number | null,
): number | null {
  if (!product.bundleProductIds?.length) return getStockFn(product.id)
  const values = product.bundleProductIds.map((pid) => getStockFn(pid))
  if (values.every((s) => s === null)) return null
  if (values.some((s) => s === null)) return 0
  return Math.min(...(values as number[]))
}

export function isProductSoldOutByStock(
  product: { id: string; bundleProductIds?: string[] },
  getStockFn: (id: string) => number | null,
): boolean {
  const eff = getBundleEffectiveStock(product, getStockFn)
  return eff !== null && eff <= 0
}
