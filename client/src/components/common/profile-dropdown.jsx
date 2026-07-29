import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserAvatar } from '@/components/common/user-avatar'
import { LogoutDialog } from '@/components/modals/logout-dialog'
import { ROLE_LABELS, ROUTES } from '@/constants'

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={ROUTES.LOGIN}>Sign in</Link>
      </Button>
    )
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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span>{user.fullName}</span>
              <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
              <Badge variant="primary" className="mt-1 w-fit capitalize">
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
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
            onClick={() => setOpen(true)}
          >
            <LogOut className="size-4" /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog open={open} onOpenChange={setOpen} onConfirm={handleLogout} />
    </>
  )
}
