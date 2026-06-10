import { BoxDecouverteTrompeModal } from '../BoxDecouverteTrompeModal'
import { SizeSelectorModal } from '../SizeSelectorModal'
import type { useProductAddFlow } from '../../hooks/useProductAddFlow'

type Flow = ReturnType<typeof useProductAddFlow>

export function ProductAddModals({ flow }: { flow: Flow }) {
  return (
    <>
      <BoxDecouverteTrompeModal
        product={flow.discoveryBoxProduct}
        eligibleTrompes={flow.discoveryEligibleTrompes}
        getStock={flow.getStock}
        slotCount={flow.discoverySlotCount}
        onClose={() => flow.setDiscoveryBoxProduct(null)}
        onConfirm={flow.confirmDiscoveryBox}
      />
      <SizeSelectorModal
        product={flow.sizeProduct}
        onClose={() => flow.setSizeProduct(null)}
        onSelect={(product, size) => flow.confirmSize(product, size)}
      />
    </>
  )
}
