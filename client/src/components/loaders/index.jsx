import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export function Spinner({ className, size = 'md' }) {
  const sizes = { sm: 'size-4', md: 'size-6', lg: 'size-10' }
  return <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function ButtonLoader({ className }) {
  return <Loader2 className={cn('size-4 animate-spin', className)} />
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-border p-6">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

export { Skeleton }
