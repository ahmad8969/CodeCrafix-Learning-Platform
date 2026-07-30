import { PageLoader } from '@/components/loaders'
import { EmptyState } from '@/components/common/empty-state'
import { Button } from '@/components/ui/button'

export function QueryState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  onRetry,
  children,
}) {
  if (isLoading) return <PageLoader />
  if (isError) {
    return (
      <EmptyState
        title="Unable to load data"
        description={error?.message || 'Please try again in a moment.'}
        actionLabel={onRetry ? 'Retry' : undefined}
        onAction={onRetry}
      />
    )
  }
  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return children
}

export function InlineError({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2 text-sm">
      <span>{message || 'Something went wrong'}</span>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  )
}
