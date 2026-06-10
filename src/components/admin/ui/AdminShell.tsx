import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  ExternalLink,
  FileText,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Search,
  Sun,
  Truck,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type { User } from 'firebase/auth'
import { cn } from '../../../lib/utils'
import { formatOrderCustomerDisplayName } from '../../../lib/orderCustomerDisplay'
import type { Order, StockMap, UserProfile } from '../../../lib/firebase'
import { AdminNotificationsCenter } from '../AdminNotificationsCenter'
import { ADMIN_TAB_LABELS, type AdminMainTab, type AdminNavGroup } from '../adminNavigation'

export type AdminShellProps = {
  isDark: boolean
  onToggleDark: () => void
  sidebarMobileOpen: boolean
  onSidebarMobileOpen: (open: boolean) => void
  navGroups: AdminNavGroup[]
  tab: AdminMainTab
  onTabChange: (tab: AdminMainTab) => void
  user: User
  ordersOpen: boolean
  onLogout: () => void
  onOpenDailyReport: () => void
  showNotifications: boolean
  onToggleNotifications: () => void
  onCloseNotifications: () => void
  onNavigateFromNotifications: (tab: string) => void
  soundEnabled: boolean
  onToggleSound: () => void
  orders: Record<string, Order>
  stock: StockMap
  allUsers: Record<string, UserProfile>
  globalSearch: string
  onGlobalSearchChange: (value: string) => void
  globalSearchResults: [string, Order][]
  onSelectSearchOrder: (orderId: string) => void
  children: React.ReactNode
}

export function AdminShell({
  isDark,
  onToggleDark,
  navGroups,
  tab,
  onTabChange,
  user,
  ordersOpen,
  onLogout,
  onOpenDailyReport,
  showNotifications,
  onToggleNotifications,
  onCloseNotifications,
  onNavigateFromNotifications,
  soundEnabled,
  onToggleSound,
  orders,
  stock,
  allUsers,
  globalSearch,
  onGlobalSearchChange,
  globalSearchResults,
  onSelectSearchOrder,
  sidebarMobileOpen,
  onSidebarMobileOpen,
  children,
}: AdminShellProps) {
  const activeTabLabel = ADMIN_TAB_LABELS[tab] ?? 'Administration'
  const flatNav = navGroups.flatMap((g) => g.items)
  const pendingBadge = flatNav.find((n) => n.id === 'commandes')?.badge ?? 0

  return (
    <div className={cn('admin-app admin-v2', isDark ? 'admin-theme-dark' : 'admin-theme-light')} data-theme={isDark ? 'dark' : 'light'}>
      {/* ── Barre supérieure fixe ── */}
      <header className="admin-v2-topbar">
        <div className="admin-v2-topbar-inner">
          <div className="admin-v2-brand">
            <button
              type="button"
              className="admin-v2-menu-btn lg:hidden"
              onClick={() => onSidebarMobileOpen(!sidebarMobileOpen)}
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
            <a href="/" className="admin-v2-logo">
              <span className="admin-v2-logo-mark">M</span>
              <span className="admin-v2-logo-text">
                <span className="admin-v2-logo-name">Maison Mayssa</span>
                <span className="admin-v2-logo-sub">Console</span>
              </span>
            </a>
          </div>

          {/* Nav horizontale desktop */}
          <nav className="admin-v2-nav hidden lg:flex" aria-label="Navigation principale">
            {flatNav.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn('admin-v2-nav-item', active && 'admin-v2-nav-item--active')}
                >
                  <Icon size={15} strokeWidth={active ? 2.25 : 2} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="admin-v2-nav-badge">{item.badge}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="admin-v2-actions">
            <div className={cn('admin-v2-shop-status', ordersOpen ? 'is-open' : 'is-closed')}>
              <span className="admin-v2-shop-dot" />
              <span className="hidden sm:inline">{ordersOpen ? 'Ouvert' : 'Fermé'}</span>
            </div>

            <button type="button" className="admin-v2-action-btn" onClick={onOpenDailyReport} title="Rapport">
              <FileText size={16} />
            </button>

            <div className="relative">
              <button
                type="button"
                className={cn('admin-v2-action-btn', showNotifications && 'is-active')}
                onClick={onToggleNotifications}
                aria-label="Notifications"
              >
                <Bell size={16} />
                {pendingBadge > 0 && <span className="admin-v2-notif-dot" />}
              </button>
              <AdminNotificationsCenter
                orders={orders}
                stock={stock}
                allUsers={allUsers}
                isOpen={showNotifications}
                onClose={onCloseNotifications}
                onNavigate={onNavigateFromNotifications}
              />
            </div>

            <button type="button" className="admin-v2-action-btn" onClick={onToggleSound} title="Son">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button type="button" className="admin-v2-action-btn" onClick={onToggleDark} title="Thème">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <a href="/" className="admin-v2-action-btn hidden sm:inline-flex" title="Site">
              <ExternalLink size={16} />
            </a>

            <button type="button" className="admin-v2-action-btn admin-v2-action-btn--danger" onClick={onLogout} title="Déconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Titre de page + recherche */}
        <div className="admin-v2-subbar">
          <div className="admin-v2-subbar-inner">
            <div className="admin-v2-page-meta">
              <h1 className="admin-v2-page-title">{activeTabLabel}</h1>
              <p className="admin-v2-page-email">{user.email}</p>
            </div>
            <div className="admin-v2-search-wrap">
              <Search size={16} className="admin-v2-search-icon" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => onGlobalSearchChange(e.target.value)}
                placeholder="Rechercher client, tél. ou n° commande…"
                className="admin-v2-search"
                aria-label="Recherche"
              />
              {globalSearch && (
                <button type="button" className="admin-v2-search-clear" onClick={() => onGlobalSearchChange('')}>
                  <X size={14} />
                </button>
              )}
              <AnimatePresence>
                {globalSearchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="admin-v2-search-dropdown"
                  >
                    {globalSearchResults.map(([id, order]) => (
                      <button
                        key={id}
                        type="button"
                        className="admin-v2-search-hit"
                        onClick={() => onSelectSearchOrder(id)}
                      >
                        <div className="admin-v2-search-hit-icon">
                          {order.deliveryMode === 'livraison' ? <Truck size={14} /> : <MapPin size={14} />}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-semibold">{formatOrderCustomerDisplayName(order)}</p>
                          <p className="text-[10px] opacity-50">
                            {order.orderNumber ? `#${order.orderNumber}` : '—'} ·{' '}
                            {new Date(order.createdAt ?? 0).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-mayssa-gold">{order.total?.toFixed(0)}€</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="admin-v2-drawer-overlay lg:hidden"
              onClick={() => onSidebarMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="admin-v2-drawer lg:hidden"
            >
              <div className="admin-v2-drawer-head">
                <span className="font-display text-sm tracking-widest uppercase">Menu</span>
                <button type="button" onClick={() => onSidebarMobileOpen(false)} className="admin-v2-action-btn">
                  <X size={18} />
                </button>
              </div>
              {navGroups.map((group) => (
                <div key={group.label} className="admin-v2-drawer-group">
                  <p className="admin-v2-drawer-group-label">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={cn('admin-v2-drawer-item', tab === item.id && 'is-active')}
                        onClick={() => {
                          onTabChange(item.id)
                          onSidebarMobileOpen(false)
                        }}
                      >
                        <Icon size={16} />
                        <span>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="admin-v2-nav-badge">{item.badge}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <main className="admin-v2-main">
        <div className="admin-v2-main-inner">{children}</div>
      </main>
    </div>
  )
}
