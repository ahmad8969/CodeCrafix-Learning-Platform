import { NavLink } from 'react-router-dom'
import { LayoutDashboard, LogOut, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/sidebar-context'
import { useAuth } from '@/contexts/auth-context'
import { APP_NAME, APP_TAGLINE } from '@/constants'
import { Separator } from '@/components/ui/separator'

function NavItem({ to, label, icon: Icon, collapsed, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          isActive ? 'bg-sidebar-accent text-primary' : 'text-sidebar-foreground/70 hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
          <Icon className="size-4 shrink-0" />
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export function AppSidebar({ title = 'Portal', items = [], className }) {
  const { collapsed } = useSidebar()
  const { logout } = useAuth()

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-64',
        className
      )}
      aria-label={`${title} navigation`}
    >
      <div className={cn('flex h-16 items-center gap-2 px-4', collapsed && 'justify-center px-2')}>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow-border">
          <Sparkles className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold tracking-tight">{APP_NAME}</p>
            <p className="truncate text-[11px] text-muted-foreground">{title}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {!collapsed && (
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        )}
        {items.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        <NavItem to="/settings" label="Settings" icon={Settings} collapsed={collapsed} />
        <button
          type="button"
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="size-4" />
          {!collapsed && 'Logout'}
        </button>
        {!collapsed && (
          <>
            <Separator className="my-2" />
            <p className="px-3 pb-2 text-[10px] text-muted-foreground">{APP_TAGLINE} · Foundation</p>
          </>
        )}
      </div>
    </aside>
  )
}

export const defaultPortalItems = [
  { to: '.', label: 'Overview', icon: LayoutDashboard, end: true },
]
