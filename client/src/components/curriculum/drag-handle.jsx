import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DragHandle({ attributes, listeners, className }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex size-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground hover:bg-muted active:cursor-grabbing',
        className
      )}
      aria-label="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
