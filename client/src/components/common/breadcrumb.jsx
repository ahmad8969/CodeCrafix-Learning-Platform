import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-sm text-muted-foreground', className)}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
            {last || !item.href ? (
              <span className={cn(last && 'font-medium text-foreground')}>{item.label}</span>
            ) : (
              <Link to={item.href} className="transition-colors hover:text-foreground">
                {item.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
