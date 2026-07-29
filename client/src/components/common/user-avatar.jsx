import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function UserAvatar({ user, className }) {
  const initials =
    user?.fullName
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'CC'

  return (
    <Avatar className={cn('size-8', className)}>
      {user?.profileImage && <AvatarImage src={user.profileImage} alt={user.fullName} />}
      <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
