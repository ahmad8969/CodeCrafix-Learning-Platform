import { Badge } from '@/components/ui/badge'
import { Clock3, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusVariant = {
  draft: 'secondary',
  published: 'success',
  archived: 'warning',
}

export function StatusBadge({ status, className }) {
  return (
    <Badge variant={statusVariant[status] || 'secondary'} className={cn('capitalize', className)}>
      {status || 'draft'}
    </Badge>
  )
}

export function PreviewBadge({ allowed }) {
  if (!allowed) return null
  return (
    <Badge variant="outline" className="gap-1">
      <Eye className="size-3" /> Preview
    </Badge>
  )
}

export function DurationBadge({ value, suffix = 'min' }) {
  if (value == null || value === '') return null
  return (
    <Badge variant="ghost" className="gap-1 font-normal">
      <Clock3 className="size-3" />
      {value}
      {typeof value === 'number' ? ` ${suffix}` : ''}
    </Badge>
  )
}
