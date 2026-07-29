import { FileCode2, FilePlus2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FileExplorer({ files = [], activeFile, onSelect, onAdd, className }) {
  return (
    <div className={cn('flex h-full flex-col border-r border-border bg-[#080e1a]', className)}>
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={() => {
            const name = window.prompt('New file path', 'notes.js')
            if (name) onAdd?.(name.trim())
          }}
        >
          <FilePlus2 className="size-3.5" />
        </Button>
      </div>
      <ul className="space-y-0.5 p-1">
        {files.map((file) => (
          <li key={file.path}>
            <button
              type="button"
              onClick={() => onSelect?.(file.path)}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
                activeFile === file.path
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              )}
            >
              <FileCode2 className="size-3.5 shrink-0" />
              <span className="truncate">{file.path}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EditorTabs({ files = [], activeFile, onSelect, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-border bg-[#0b1220] px-2 py-1', className)}>
      {files.map((file) => (
        <button
          key={file.path}
          type="button"
          onClick={() => onSelect?.(file.path)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs',
            activeFile === file.path
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted/30'
          )}
        >
          {file.path}
        </button>
      ))}
    </div>
  )
}
