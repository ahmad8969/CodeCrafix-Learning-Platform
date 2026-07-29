import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge, DurationBadge, PreviewBadge } from '@/components/curriculum/badges'
import { DragHandle } from '@/components/curriculum/drag-handle'
import { cn } from '@/lib/utils'

export function CurriculumNodeCard({
  title,
  subtitle,
  status,
  duration,
  previewAllowed,
  expanded,
  onToggle,
  onAdd,
  addLabel,
  onEdit,
  onDelete,
  onOpen,
  dragHandleProps,
  depth = 0,
  children,
  className,
  readOnly = false,
}) {
  return (
    <div className={cn('space-y-2', className)} style={{ marginLeft: depth ? depth * 12 : 0 }}>
      <Card className="border-border/80 p-2 shadow-none">
        <div className="flex items-center gap-1">
          {!readOnly && dragHandleProps && <DragHandle {...dragHandleProps} />}
          <Button type="button" size="icon" variant="ghost" className="size-8" onClick={onToggle}>
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen || onToggle}>
            <p className="truncate text-sm font-semibold">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </button>
          <div className="hidden items-center gap-1 sm:flex">
            <StatusBadge status={status} />
            <DurationBadge value={duration} />
            <PreviewBadge allowed={previewAllowed} />
          </div>
          {!readOnly && (
            <>
              {onAdd && (
                <Button type="button" size="icon" variant="ghost" className="size-8" onClick={onAdd} title={addLabel}>
                  <Plus className="size-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" size="icon" variant="ghost" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>}
                  {onOpen && <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>}
                  {onDelete && (
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </Card>
      {expanded && children}
    </div>
  )
}
