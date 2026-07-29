import { Bell, Command, Menu, Moon, PanelLeft, Search, Sun, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/theme-context'
import { useSidebar } from '@/contexts/sidebar-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Breadcrumb } from '@/components/common/breadcrumb'

export function TopNavbar({ breadcrumbs = [], onOpenCommand }) {
  const { theme, toggleTheme } = useTheme()
  const { toggleCollapsed, setMobileOpen } = useSidebar()
  const { user, logout } = useAuth()

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

      <div className={cnActions()}>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpenCommand} aria-label="Search">
          <Search className="size-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/15 text-xs text-primary">
                  {user?.name?.slice(0, 2)?.toUpperCase() || <User className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                {user?.name || 'Guest'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login">Sign in</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

function cnActions() {
  return 'ml-0 flex items-center gap-1.5 md:ml-2'
}
