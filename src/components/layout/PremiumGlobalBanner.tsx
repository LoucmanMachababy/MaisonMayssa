import { useSettings } from '../../hooks/useSettings'

export function PremiumGlobalBanner() {
  const settings = useSettings()

  if (!settings?.globalMessageEnabled || !settings.globalMessage?.trim()) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-mayssa-gold text-mayssa-brown text-center text-xs sm:text-sm px-4 py-2.5 tracking-wide">
      {settings.globalMessage.trim()}
    </div>
  )
}
