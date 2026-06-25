import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { usePremiumAuth } from '../components/layout/PremiumAuthLayer'
import { TrompeLoeilMarquee } from '../components/decorative/TrompeLoeilMarquee'
import { LIFESTYLE } from '../lib/decorativeAssets'
import { Helmet } from 'react-helmet-async'
import { Cart } from '../components/Cart'
import { useOrderCheckoutContext } from '../contexts/OrderCheckoutContext'
import { STRIPE_LIVE } from '../constants/checkout'
import { STRIPE_PUBLISHABLE_KEY } from '../lib/stripe'

export default function PremiumCart() {
  const { openAccount } = usePremiumAuth()
  const checkout = useOrderCheckoutContext()
  /** En Stripe réel, le paiement réussi crée la commande directement (→ email). */
  const useRealStripe = STRIPE_LIVE && !!STRIPE_PUBLISHABLE_KEY

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
    eventModeEnabled,
    eventModeMessage,
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
    openOrderRecap,
    handleUpdateQuantity,
    handleApplyPromo,
    handleClearPromo,
    paymentConfirmed,
    paymentMethod,
    confirmSimulatedPayment,
    confirmPaymentAndPlaceOrder,
    resetSimulatedPayment,
  } = checkout

  return (
    <div className="min-h-screen bg-gradient-to-b from-mayssa-soft via-[#faf6f1] to-mayssa-soft pb-32">
      <Helmet>
        <title>Panier — Maison Mayssa</title>
        <meta name="description" content="Finalisez votre précommande Maison Mayssa : retrait sur créneau, paiement et confirmation." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-[104px]">

        {cart.length === 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 bg-white border border-mayssa-brown/5 overflow-hidden mb-0"
            >
              <div className="relative min-h-[240px] md:min-h-[360px] overflow-hidden">
                <img
                  src={LIFESTYLE.boxOpen}
                  alt="Box de trompe-l'œil Maison Mayssa"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-mayssa-brown/30 to-transparent" />
              </div>
              <div className="flex flex-col items-center justify-center text-center md:text-left md:items-start px-8 py-16 md:px-12">
                <span className="text-mayssa-gold text-xs tracking-[0.3em] uppercase mb-4">Votre panier</span>
                <p className="font-display text-2xl md:text-3xl text-mayssa-brown mb-4">Il est encore vide</p>
                <p className="text-mayssa-brown/60 font-light leading-relaxed mb-8 max-w-sm">
                  Découvrez nos trompe-l&apos;œil, boxes et créations artisanales — chaque bouchée est une surprise.
                </p>
                <Link
                  to="/carte"
                  className="inline-flex items-center justify-center px-8 py-4 bg-mayssa-brown text-white text-xs tracking-widest uppercase hover:bg-mayssa-espresso transition-colors duration-300"
                >
                  Découvrir la carte
                </Link>
              </div>
            </motion.div>
            <TrompeLoeilMarquee className="-mx-6 md:mx-0" />
          </>
        ) : eventModeEnabled ? (
          <div className="text-center py-16 bg-white border border-mayssa-brown/5 px-6">
            <p className="text-mayssa-brown font-semibold text-lg mb-3">
              Précommandes fermées cette semaine
            </p>
            {eventModeMessage.trim() ? (
              <p className="text-mayssa-brown/70 text-base leading-relaxed whitespace-pre-line">
                {eventModeMessage}
              </p>
            ) : (
              <p className="text-mayssa-brown/60 text-base">
                Consultez la carte et retrouvez-nous sur l&apos;événement.
              </p>
            )}
            <Link
              to="/carte"
              className="inline-flex items-center justify-center mt-8 px-8 py-4 bg-mayssa-brown text-white text-sm tracking-widest uppercase hover:bg-mayssa-espresso transition-colors duration-300"
            >
              Voir la carte
            </Link>
          </div>
        ) : (
          <div className="hidden md:block premium-cart-page">
            <Link
              to="/carte"
              className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-mayssa-brown/50 hover:text-mayssa-brown transition-colors mb-10"
            >
              ← Continuer mes achats
            </Link>
            <header className="premium-cart-page__intro">
              <span className="premium-cart-page__eyebrow">Maison Mayssa</span>
              <h1 className="premium-cart-page__title">Votre précommande</h1>
              <p className="premium-cart-page__lede">
                Retrait sur créneau · Fabrication artisanale · Quantités limitées
              </p>
            </header>
            <Cart
              items={cart}
              total={total}
              note={note}
              customer={customer}
              onUpdateQuantity={handleUpdateQuantity}
              onNoteChange={setNote}
              onCustomerChange={setCustomer}
              onSend={() => openOrderRecap('whatsapp')}
              onAccountClick={openAccount}
              selectedReward={selectedReward}
              onSelectReward={setSelectedReward}
              deliverySlots={deliverySlots}
              minDate={deliverySchedule.minDate}
              minDateRetrait={deliverySchedule.minDateRetrait}
              minDateLivraison={deliverySchedule.minDateLivraison}
              maxDate={deliverySchedule.maxDate}
              availableWeekdays={deliverySchedule.availableWeekdays}
              pickupDates={deliverySchedule.pickupDates}
              preorderOpenDate={deliverySchedule.preorderOpenDate}
              preorderOpenTime={deliverySchedule.preorderOpenTime}
              retraitTimeSlots={deliverySchedule.retraitTimeSlots}
              livraisonTimeSlots={deliverySchedule.livraisonTimeSlots}
              ordersOpen={ordersOpen}
              ordersExplicit={ordersExplicit}
              ordersClosedMessage={eventModeMessage}
              promoCodeInput={promoCodeInput}
              setPromoCodeInput={setPromoCodeInput}
              appliedPromo={appliedPromo}
              onApplyPromo={handleApplyPromo}
              onClearPromo={handleClearPromo}
              donationAmount={donationAmount}
              setDonationAmount={setDonationAmount}
              referralCodeInput={referralCodeInput}
              setReferralCodeInput={setReferralCodeInput}
              pendingOrder={pendingOrder}
              onAllowAnotherOrder={allowAnotherOrder}
              paymentConfirmed={paymentConfirmed}
              paymentMethod={paymentMethod}
              onConfirmPayment={useRealStripe ? confirmPaymentAndPlaceOrder : confirmSimulatedPayment}
              onResetPayment={resetSimulatedPayment}
            />
          </div>
        )}

        {/* Mobile : le panier s'ouvre en sheet (PremiumCartSheetLayer) */}
        {cart.length > 0 && !eventModeEnabled && (
          <p className="md:hidden text-center text-xs text-mayssa-brown/50 py-8 tracking-wide">
            Votre précommande s&apos;affiche ci-dessus en panneau coulissant
          </p>
        )}
      </div>
    </div>
  )
}
