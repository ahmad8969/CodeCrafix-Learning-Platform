import { Bookmark, BookmarkCheck, Printer, Share2 } from 'lucide-react'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DurationBadge } from '@/components/curriculum/badges'
import { cn } from '@/lib/utils'

export function BookmarkButton({ active, onToggle, disabled }) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? 'primary' : 'outline'}
      onClick={onToggle}
      disabled={disabled}
    >
      {active ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
      {active ? 'Saved' : 'Bookmark'}
    </Button>
  )
}

export function LessonHeader({
  title,
  breadcrumbItems = [],
  moduleName,
  weekName,
  difficulty,
  estimatedTime,
  updatedAt,
  readingProgress = 0,
  bookmarked,
  onBookmark,
  onShare,
  onPrint,
  className,
}) {
  return (
    <header className={cn('space-y-4 border-b border-border pb-5', className)}>
      <Breadcrumb items={breadcrumbItems} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {moduleName && <Badge variant="outline">{moduleName}</Badge>}
            {weekName && <Badge variant="secondary">{weekName}</Badge>}
            {difficulty && (
              <Badge variant="ghost" className="capitalize">
                {difficulty}
              </Badge>
            )}
            <DurationBadge value={estimatedTime} />
            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BookmarkButton active={bookmarked} onToggle={onBookmark} />
          <Button type="button" size="sm" variant="outline" onClick={onShare}>
            <Share2 className="size-4" /> Share
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onPrint}>
            <Printer className="size-4" /> Print
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Reading progress</span>
          <span>{Math.round(readingProgress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400 transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, readingProgress))}%` }}
          />
        </div>
      </div>
    </header>
  )
}
