import type { LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

/* ── Primitives UI admin v2 ── */

export function AdminPanel({
  children,
  className,
  padding = true,
}: {
  children: React.ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div className={cn('admin-panel', padding && 'admin-panel-pad', className)}>
      {children}
    </div>
  )
}

export function AdminPanelHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}) {
  return (
    <div className="admin-panel-header">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon && (
          <div className="admin-panel-header-icon">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="admin-panel-title">{title}</h2>
          {description && <p className="admin-panel-desc">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function AdminKpi({
  label,
  value,
  hint,
  tone = 'default',
  onClick,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'warning' | 'info' | 'gold'
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('admin-kpi-v2', tone !== 'default' && `admin-kpi-v2--${tone}`, onClick && 'cursor-pointer')}
    >
      <span className="admin-kpi-v2-label">{label}</span>
      <p className="admin-kpi-v2-value">{value}</p>
      {hint && <span className="admin-kpi-v2-hint">{hint}</span>}
    </Tag>
  )
}

export function AdminBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'warning' | 'success' | 'danger' | 'info' | 'gold'
}) {
  return <span className={cn('admin-badge', `admin-badge--${tone}`)}>{children}</span>
}

export function AdminBtn({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn('admin-btn inline-flex items-center gap-2', `admin-btn--${variant}`, className)}
    >
      {children}
    </button>
  )
}

export function AdminAlert({
  children,
  tone = 'info',
  title,
}: {
  children?: React.ReactNode
  tone?: 'info' | 'warning' | 'success' | 'danger'
  title: string
}) {
  return (
    <div className={cn('admin-alert', `admin-alert--${tone}`)}>
      <p className="admin-alert-title">{title}</p>
      {children && <div className="admin-alert-body">{children}</div>}
    </div>
  )
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="admin-empty">
      <p className="admin-empty-title">{title}</p>
      {description && <p className="admin-empty-desc">{description}</p>}
      {action}
    </div>
  )
}

export function AdminToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('admin-toolbar', className)}>{children}</div>
}

export function AdminDivider() {
  return <div className="admin-divider" aria-hidden />
}
