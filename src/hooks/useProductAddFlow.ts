import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Product, ProductSize } from '../types'
import { useCartStore } from '../lib/store'
import { useStock } from '../hooks/useStock'
import { useProducts } from '../hooks/useProducts'
import {
  BOX_DECOUVERTE_TROMPE_PRODUCT_ID,
  isDiscoveryTrompeBoxId,
  CANDY_FRUIT_SAUCE_PRODUCT_ID,
  isCandyFruitFlavorProductId,
  isCustomizableTrompeBundleBoxId,
  getTrompeBundleSelectionSlotCount,
} from '../constants'
import type { CandyFruitFlavor } from '../constants/candyFruit'
import {
  getAvailableCandyFruitFlavors,
  getCandyFruitExcludedFlavorIds,
} from '../constants/candyFruit'
import {
  getEligibleTrompeIdsForDiscoveryBox,
  listIndividualTrompeLoeilProducts,
} from '../lib/discoveryBox'
import { trackAddToCart } from '../lib/siteAnalytics'

export interface ProductAddedInfo {
  product: Product
  quantity: number
}

interface UseProductAddFlowOptions {
  /** Reste sur la page courante au lieu de rediriger vers /panier */
  stayOnPage?: boolean
  /** Appelé après un ajout réussi au panier */
  onAdded?: (info: ProductAddedInfo) => void
}

export function useProductAddFlow(options?: UseProductAddFlowOptions) {
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const { getStock, settings } = useStock()
  const { availableProducts } = useProducts()

  const [discoveryBoxProduct, setDiscoveryBoxProduct] = useState<Product | null>(null)
  const [sizeProduct, setSizeProduct] = useState<Product | null>(null)
  const [candyFruitProduct, setCandyFruitProduct] = useState<Product | null>(null)

  const discoveryEligibleTrompes = useMemo(() => {
    const ids = new Set(
      getEligibleTrompeIdsForDiscoveryBox(availableProducts, settings.boxDecouverteTrompeExcludedIds),
    )
    return listIndividualTrompeLoeilProducts(availableProducts).filter((p) => ids.has(p.id))
  }, [availableProducts, settings.boxDecouverteTrompeExcludedIds])

  const afterAdd = (product: Product, quantity: number) => {
    if (options?.onAdded) {
      options.onAdded({ product, quantity })
      return
    }
    if (!options?.stayOnPage) {
      navigate('/panier')
    }
  }

  const tryAddProduct = (product: Product, quantity = 1) => {
    if (!product.available) return false

    if (
      isDiscoveryTrompeBoxId(product.id) ||
      isCustomizableTrompeBundleBoxId(product.id)
    ) {
      setDiscoveryBoxProduct(product)
      return true
    }

    if (product.sizes && product.sizes.length > 0) {
      setSizeProduct(product)
      return true
    }

    if (isCandyFruitFlavorProductId(product.id)) {
      const excluded = getCandyFruitExcludedFlavorIds(product.id, settings)
      if (getAvailableCandyFruitFlavors(product.id, excluded).length === 0) return false
      setCandyFruitProduct(product)
      return true
    }

    if (product.id === CANDY_FRUIT_SAUCE_PRODUCT_ID) {
      addItem(product, quantity)
      trackAddToCart(product.id, product.name)
      afterAdd(product, quantity)
      return true
    }

    addItem(product, quantity)
    trackAddToCart(product.id, product.name)
    afterAdd(product, quantity)
    return true
  }

  const confirmDiscoveryBox = (selectionIds: string[]) => {
    if (!discoveryBoxProduct) return
    addItem(discoveryBoxProduct, 1, { trompeDiscoverySelection: selectionIds })
    trackAddToCart(discoveryBoxProduct.id, discoveryBoxProduct.name)
    const added = discoveryBoxProduct
    setDiscoveryBoxProduct(null)
    afterAdd(added, 1)
  }

  const confirmSize = (product: Product, size: ProductSize) => {
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${size.ml}`,
      name: `${product.name} (${size.label})`,
      price: size.price,
    }
    addItem(cartProduct, 1)
    trackAddToCart(cartProduct.id, cartProduct.name)
    setSizeProduct(null)
    afterAdd(cartProduct, 1)
  }

  const confirmCandyFruit = (product: Product, flavor: CandyFruitFlavor, quantity: number) => {
    const formatLabel = product.id.includes('canette') ? 'Canette' : 'Box'
    const cartProduct: Product = {
      ...product,
      id: `${product.id}-${flavor.id}`,
      name: `Candy Fruit Chez Mima ${formatLabel} — ${flavor.label}`,
      image: flavor.image,
      images: [flavor.image],
      category: 'Candy Fruit',
    }
    addItem(cartProduct, quantity)
    trackAddToCart(cartProduct.id, cartProduct.name)
    setCandyFruitProduct(null)
    afterAdd(cartProduct, quantity)
  }

  const discoverySlotCount = discoveryBoxProduct
    ? getTrompeBundleSelectionSlotCount(discoveryBoxProduct.id)
    : undefined

  const candyFruitExcludedFlavorIds = useMemo(() => {
    if (!candyFruitProduct) return []
    return getCandyFruitExcludedFlavorIds(candyFruitProduct.id, settings)
  }, [
    candyFruitProduct,
    settings.candyFruitBoxExcludedFlavorIds,
    settings.candyFruitCanetteExcludedFlavorIds,
  ])

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
    candyFruitProduct,
    setCandyFruitProduct,
    candyFruitExcludedFlavorIds,
    confirmCandyFruit,
    getStock,
  }
}
