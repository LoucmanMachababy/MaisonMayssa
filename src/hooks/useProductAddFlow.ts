import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product, ProductSize } from '../types'
import { useCartStore } from '../lib/store'
import { useStock } from '../hooks/useStock'
import { useProducts } from '../hooks/useProducts'
import {
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  isCustomizableTrompeBundleBoxId,
  getTrompeBundleSelectionSlotCount,
} from '../constants'
import {
  getEligibleTrompeIdsForDiscoveryBox,
  listIndividualTrompeLoeilProducts,
} from '../lib/discoveryBox'

export function useProductAddFlow() {
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const { getStock, settings } = useStock()
  const { availableProducts } = useProducts()

  const [discoveryBoxProduct, setDiscoveryBoxProduct] = useState<Product | null>(null)
  const [sizeProduct, setSizeProduct] = useState<Product | null>(null)

  const discoveryEligibleTrompes = useMemo(() => {
    const ids = new Set(
      getEligibleTrompeIdsForDiscoveryBox(availableProducts, settings.boxDecouverteTrompeExcludedIds),
    )
    return listIndividualTrompeLoeilProducts(availableProducts).filter((p) => ids.has(p.id))
  }, [availableProducts, settings.boxDecouverteTrompeExcludedIds])

  const tryAddProduct = (product: Product, quantity = 1) => {
    if (!product.available) return false

    if (
      product.id === BOX_DECOUVERTE_TROMPE_PRODUCT_ID ||
      isCustomizableTrompeBundleBoxId(product.id)
    ) {
      setDiscoveryBoxProduct(product)
      return true
    }

    if (product.sizes && product.sizes.length > 0) {
      setSizeProduct(product)
      return true
    }

    addItem(product, quantity)
    navigate('/panier')
    return true
  }

  const confirmDiscoveryBox = (selectionIds: string[]) => {
    if (!discoveryBoxProduct) return
    addItem(discoveryBoxProduct, 1, { trompeDiscoverySelection: selectionIds })
    setDiscoveryBoxProduct(null)
    navigate('/panier')
  }

  const confirmSize = (product: Product, size: ProductSize) => {
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}`,
      name: `${product.name} (${size.label})`,
      price: size.price,
    }
    addItem(cartProduct, 1)
    setSizeProduct(null)
    navigate('/panier')
  }

  const discoverySlotCount = discoveryBoxProduct
    ? getTrompeBundleSelectionSlotCount(discoveryBoxProduct.id)
    : undefined

  return {
    tryAddProduct,
    discoveryBoxProduct,
    setDiscoveryBoxProduct,
    discoveryEligibleTrompes,
    discoverySlotCount,
    confirmDiscoveryBox,
    sizeProduct,
    setSizeProduct,
    confirmSize,
    getStock,
  }
}
