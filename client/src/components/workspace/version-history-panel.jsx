import { useQuery } from '@tanstack/react-query'
import { History, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { workspaceService } from '@/services/curriculum.service'
import { cn } from '@/lib/utils'

export function VersionHistoryPanel({ lessonId, currentVersion, onRestore, className }) {
  const { data, isLoading } = useQuery({
    queryKey: ['workspace-versions', lessonId],
    queryFn: () => workspaceService.versions(lessonId),
    enabled: Boolean(lessonId),
  })

  const versions = data?.versions || []

  return (
    <div className={cn('border-t border-border bg-[#080e1a] p-2', className)}>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <History className="size-3.5" />
        Version history
        {currentVersion ? <span className="text-primary">v{currentVersion}</span> : null}
      </div>
      {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
      {!isLoading && versions.length === 0 && (
        <p className="text-xs text-muted-foreground">No versions yet. Saves create history.</p>
      )}
      <ul className="max-h-36 space-y-1 overflow-auto">
        {versions.map((v) => (
          <li
            key={v.version}
            className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs"
          >
            <div>
              <p className="font-medium text-foreground">
                v{v.version}
                {v.label ? ` — ${v.label}` : ''}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {v.source} · {v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              disabled={v.version === currentVersion}
              onClick={() => onRestore?.(v.version)}
              title="Restore"
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
