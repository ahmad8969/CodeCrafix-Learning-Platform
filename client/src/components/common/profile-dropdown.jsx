import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LogOut, KeyRound, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserAvatar } from '@/components/common/user-avatar'
import { LogoutDialog } from '@/components/modals/logout-dialog'
import { useAuth } from '@/contexts/auth-context'
import { ROLE_LABELS, ROUTES } from '@/constants'
import { notify } from '@/utils/error'

export function ProfileDropdown() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.LOGIN}>Sign in</Link>
      </Button>
    )
  }

  const handleLogout = async () => {
    await logout()
    setOpen(false)
    notify.success('Signed out')
    navigate(ROUTES.LOGIN)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
            <UserAvatar user={user} />
            <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
              {user.fullName}
            </span>
            <Badge variant="secondary" className="hidden capitalize md:inline-flex">
              {ROLE_LABELS[user.role] || user.role}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span>{user.fullName}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={ROUTES.SETTINGS}>
              <Settings className="size-4" /> Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={ROUTES.CHANGE_PASSWORD}>
              <KeyRound className="size-4" /> Change password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(e) => {
              e.preventDefault()
              setOpen(true)
            }}
          >
            <LogOut className="size-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog open={open} onOpenChange={setOpen} onConfirm={handleLogout} />
    </>
  )
}
