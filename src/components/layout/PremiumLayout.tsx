import { Outlet } from 'react-router-dom'
import { PremiumHeader } from './PremiumHeader'
import { PremiumFooter } from './PremiumFooter'
import { PremiumGlobalBanner } from './PremiumGlobalBanner'
import { PremiumCartSheetLayer } from './PremiumCartSheetLayer'
import { CookieBanner } from '../CookieBanner'
import { AccessibilityControls } from '../AccessibilityProvider'
import { OrderCheckoutProvider } from '../../contexts/OrderCheckoutContext'
import { useSettings } from '../../hooks/useSettings'

export function PremiumLayout() {
  const settings = useSettings()
  const ordersOpen = (settings?.ordersOpen !== false) && !settings?.eventModeEnabled
  const hasGlobalBanner = !!(settings?.globalMessageEnabled && settings.globalMessage?.trim())

  return (
    <OrderCheckoutProvider>
      <div className="min-h-screen flex flex-col bg-mayssa-soft text-mayssa-brown selection:bg-mayssa-gold/30">
        <PremiumGlobalBanner />
        <PremiumHeader hasGlobalBanner={hasGlobalBanner} ordersOpen={ordersOpen} />
        <main id="main-content" className="flex-grow" tabIndex={-1}>
          <Outlet />
        </main>
        <PremiumFooter />
        <PremiumCartSheetLayer />
        <CookieBanner />
        <AccessibilityControls />
      </div>
    </OrderCheckoutProvider>
  )
}
