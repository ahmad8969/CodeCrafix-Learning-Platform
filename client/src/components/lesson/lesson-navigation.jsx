import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Layers3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function LessonNavigation({
  previous,
  next,
  moduleHref,
  continueHref,
  continueLabel = 'Continue learning',
  lessonPath,
  className,
}) {
  return (
    <div className={cn('sticky bottom-3 z-20 mt-8', className)}>
      <div className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-elevation-2 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {previous ? (
            <Button asChild variant="outline" size="sm">
              <Link to={lessonPath(previous)}>
                <ArrowLeft className="size-4" /> Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ArrowLeft className="size-4" /> Previous
            </Button>
          )}
          {moduleHref && (
            <Button asChild variant="ghost" size="sm">
              <Link to={moduleHref}>
                <Layers3 className="size-4" /> Back to module
              </Link>
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {continueHref && (
            <Button asChild variant="secondary" size="sm">
              <Link to={continueHref}>{continueLabel}</Link>
            </Button>
          )}
          {next ? (
            <Button asChild size="sm">
              <Link to={lessonPath(next)}>
                Next <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" disabled>
              Next <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
