import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CartSheet } from '../mobile/CartSheet'
import { FloatingCartPreview } from '../mobile/FloatingCartPreview'
import { OrderRecapModal } from '../OrderRecapModal'
import { OrderConfirmation } from '../OrderConfirmation'
import { InstagramInstructionModal } from '../InstagramInstructionModal'
import { SnapInstructionModal } from '../SnapInstructionModal'
import { ToastContainer } from '../Toast'
import { useOrderCheckoutContext } from '../../contexts/OrderCheckoutContext'
import { usePremiumAuth } from './PremiumAuthLayer'
import { STRIPE_LIVE } from '../../constants/checkout'
import { STRIPE_PUBLISHABLE_KEY } from '../../lib/stripe'

export function PremiumCartSheetLayer() {
  const location = useLocation()
  const { openAccount } = usePremiumAuth()
  const [sheetOpen, setSheetOpen] = useState(false)

  const {
    cart,
    total,
    note,
    setNote,
    customer,
    setCustomer,
    deliverySlots,
    deliverySchedule,
    ordersOpen,
    ordersExplicit,
    promoCodeInput,
    setPromoCodeInput,
    appliedPromo,
    donationAmount,
    setDonationAmount,
    referralCodeInput,
    setReferralCodeInput,
    selectedReward,
    setSelectedReward,
    pendingOrder,
    allowAnotherOrder,
    orderContactIdentity,
    setOrderContactIdentity,
    toasts,
    dismissToast,
    orderRecapChannel,
    setOrderRecapChannel,
    openOrderRecap,
    orderConfirmation,
    setOrderConfirmation,
    instagramOrderModal,
    setInstagramOrderModal,
    snapOrderModal,
    setSnapOrderModal,
    handleUpdateQuantity,
    handleOrderRecapConfirm,
    handleApplyPromo,
    handleClearPromo,
    deliveryFeeForRecap,
    paymentConfirmed,
    paymentMethod,
    confirmSimulatedPayment,
    confirmPaymentAndPlaceOrder,
    resetSimulatedPayment,
  } = useOrderCheckoutContext()

  /** En Stripe réel, le paiement réussi crée la commande directement (→ email). */
  const useRealStripe = STRIPE_LIVE && !!STRIPE_PUBLISHABLE_KEY

  const isPanierPage = location.pathname === '/panier'
  const hasItems = cart.length > 0

  useEffect(() => {
    if (isPanierPage && hasItems) {
      setSheetOpen(true)
    }
  }, [isPanierPage, hasItems])

  const sheetProps = {
    isOpen: sheetOpen,
    onClose: () => setSheetOpen(false),
    items: cart,
    total,
    note,
    customer,
    onUpdateQuantity: handleUpdateQuantity,
    onNoteChange: setNote,
    onCustomerChange: setCustomer,
    onSend: () => openOrderRecap('whatsapp'),
    onAccountClick: openAccount,
    selectedReward,
    onSelectReward: setSelectedReward,
    deliverySlots,
    minDate: deliverySchedule.minDate,
    minDateRetrait: deliverySchedule.minDateRetrait,
    minDateLivraison: deliverySchedule.minDateLivraison,
    maxDate: deliverySchedule.maxDate,
    availableWeekdays: deliverySchedule.availableWeekdays,
    pickupDates: deliverySchedule.pickupDates,
    preorderOpenDate: deliverySchedule.preorderOpenDate,
    preorderOpenTime: deliverySchedule.preorderOpenTime,
    retraitTimeSlots: deliverySchedule.retraitTimeSlots,
    livraisonTimeSlots: deliverySchedule.livraisonTimeSlots,
    ordersOpen,
    ordersExplicit,
    promoCodeInput,
    setPromoCodeInput,
    appliedPromo,
    onApplyPromo: handleApplyPromo,
    onClearPromo: handleClearPromo,
    donationAmount,
    setDonationAmount,
    referralCodeInput,
    setReferralCodeInput,
    pendingOrder,
    onAllowAnotherOrder: allowAnotherOrder,
    orderContactIdentity,
    onOrderContactIdentityChange: setOrderContactIdentity,
    paymentConfirmed,
    paymentMethod,
    onConfirmPayment: useRealStripe ? confirmPaymentAndPlaceOrder : confirmSimulatedPayment,
    onResetPayment: resetSimulatedPayment,
  }

  return (
    <>
      {!isPanierPage && hasItems && (
        <FloatingCartPreview
          items={cart}
          total={total}
          onExpand={() => setSheetOpen(true)}
        />
      )}

      <CartSheet {...sheetProps} />

      <OrderRecapModal
        isOpen={orderRecapChannel !== null}
        channel={orderRecapChannel ?? 'whatsapp'}
        onClose={() => setOrderRecapChannel(null)}
        onConfirm={handleOrderRecapConfirm}
        customer={customer}
        items={cart}
        total={total}
        deliveryFee={deliveryFeeForRecap}
        discountAmount={appliedPromo?.discount ?? 0}
        donationAmount={donationAmount ?? 0}
      />

      <InstagramInstructionModal
        data={instagramOrderModal}
        onClose={() => setInstagramOrderModal(null)}
      />

      <SnapInstructionModal data={snapOrderModal} onClose={() => setSnapOrderModal(null)} />

      {orderConfirmation && (
        <OrderConfirmation
          data={orderConfirmation}
          whatsappMessage={orderConfirmation.whatsappMessage}
          onClose={() => setOrderConfirmation(null)}
        />
      )}

      {toasts.length > 0 && <ToastContainer toasts={toasts} onRemove={dismissToast} />}
    </>
  )
}
