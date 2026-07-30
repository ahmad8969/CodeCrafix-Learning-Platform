import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { platformService } from '@/services/platform.service'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return ''
  }
}

export function NotificationCenter() {
  const { isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => platformService.notifications({ limit: 30 }),
    enabled: isAuthenticated,
    refetchInterval: open ? 15000 : 60000,
  })

  const items = data?.items || []
  const unread = useMemo(() => items.filter((n) => !n.readAt).length, [items])

  const markRead = useMutation({
    mutationFn: (id) => platformService.markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!isAuthenticated) return null

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5">
          <span>Notifications</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {unread ? `${unread} unread` : 'All caught up'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</p>
          ) : (
            items.map((n) => {
              const content = (
                <>
                  <span className="text-sm font-medium leading-snug">{n.title}</span>
                  {n.body ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                  ) : null}
                  <span className="text-[10px] text-muted-foreground">{formatWhen(n.createdAt)}</span>
                </>
              )
              const className = cn(
                'flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left outline-none transition hover:bg-muted',
                !n.readAt && 'bg-primary/5'
              )
              if (n.link) {
                return (
                  <Link
                    key={n._id}
                    to={n.link}
                    className={className}
                    onClick={() => {
                      if (!n.readAt) markRead.mutate(n._id)
                      setOpen(false)
                    }}
                  >
                    {content}
                  </Link>
                )
              }
              return (
                <button
                  key={n._id}
                  type="button"
                  className={className}
                  onClick={() => {
                    if (!n.readAt) markRead.mutate(n._id)
                  }}
                >
                  {content}
                </button>
              )
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
