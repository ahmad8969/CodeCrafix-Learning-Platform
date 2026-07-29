import { cn } from '@/lib/utils'

export function WorkspaceStatusBar({
  runtime = 'browser',
  language,
  line = 1,
  column = 1,
  dirty,
  version,
  className,
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-t border-border bg-[#060b14] px-3 py-1 text-[10px] text-muted-foreground',
        className
      )}
    >
      <div className="flex gap-3">
        <span>Ln {line}, Col {column}</span>
        <span className="uppercase">{language}</span>
        <span className="uppercase text-emerald-400/80">{runtime}</span>
        {version != null && <span>v{version}</span>}
      </div>
      <div className="flex gap-3">
        <span>{dirty ? 'Modified' : 'Clean'}</span>
        <span>UTF-8</span>
        <span>CodeCrafters IDE</span>
      </div>
    </div>
  )
}
