import { Command, Menu, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { ProfileDropdown } from '@/components/common/profile-dropdown'
import { NotificationCenter } from '@/components/communication/notification-center'

export function TopNavbar({ breadcrumbs = [], onOpenCommand }) {
  const { theme, toggleTheme } = useTheme()
  const { toggleCollapsed, setMobileOpen } = useSidebar()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border/60 glass px-3 sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={toggleCollapsed} aria-label="Toggle sidebar">
        <PanelLeft className="size-5" />
      </Button>

      {breadcrumbs.length > 0 && (
        <div className="hidden min-w-0 md:block">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <button
        type="button"
        onClick={onOpenCommand}
        className="relative ml-auto hidden h-10 w-full max-w-sm items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-left text-sm text-muted-foreground transition hover:border-primary/40 md:flex"
      >
        <Search className="size-4" />
        <span className="flex-1">Search…</span>
        <kbd className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-1.5 font-mono text-[10px]">
          <Command className="size-3" />K
        </kbd>
      </button>

      <div className="ml-0 flex items-center gap-1.5 md:ml-2">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenCommand} aria-label="Search">
          <Search className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <NotificationCenter />
        <ProfileDropdown />
      </div>
    </header>
  )
}
