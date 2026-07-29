import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AI_LABELS = {
  explain_code: 'Explain Code',
  find_bug: 'Find Bug',
  improve_code: 'Improve Code',
  generate_example: 'Generate Example',
  generate_quiz: 'Generate Quiz',
  generate_assignment: 'Generate Assignment',
  explain_error: 'Explain Error',
  code_review: 'Code Review',
  ask_instructor_ai: 'Ask Instructor AI',
}

export function ConsolePanel({
  logs = [],
  onClear,
  problems = [],
  expectedOutput,
  hints = [],
  challengePlaceholder,
  aiEnabled = true,
  aiActions = [],
  showTests = false,
  onAiAction,
  className,
}) {
  const [open, setOpen] = useState(true)
  const [tab, setTab] = useState('console')
  const tabs = ['console', 'output', 'problems', ...(showTests ? ['tests'] : []), 'ai']

  return (
    <div className={cn('border-t border-border bg-[#080e1a]', className)}>
      <div className="flex items-center gap-1 border-b border-border px-2 py-1">
        {tabs.map((id) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? 'secondary' : 'ghost'}
            className="h-7 capitalize"
            onClick={() => {
              setTab(id)
              setOpen(true)
            }}
          >
            {id === 'ai' ? 'AI' : id}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-1">
          {tab === 'console' && (
            <Button size="sm" variant="ghost" className="h-7" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7" onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="max-h-40 overflow-auto p-2 font-mono text-[11px] leading-5">
          {tab === 'console' && (
            <div className="space-y-1">
              {logs.length === 0 && (
                <p className="text-muted-foreground">Console ready. Run the preview to see logs.</p>
              )}
              {logs.map((log, i) => (
                <div
                  key={`${log.ts}-${i}`}
                  className={cn(
                    'flex gap-2',
                    log.level === 'error' && 'text-red-400',
                    log.level === 'warn' && 'text-amber-300',
                    log.level === 'info' && 'text-cyan-300',
                    log.level === 'log' && 'text-slate-300'
                  )}
                >
                  <span className="shrink-0 text-slate-500">
                    {new Date(log.ts).toLocaleTimeString()}
                  </span>
                  <span>{(log.args || []).join(' ')}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'output' && (
            <div className="space-y-2 text-slate-300">
              <p className="font-sans text-xs font-semibold text-foreground">Expected output</p>
              <p className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                {expectedOutput || 'No expected output defined for this lesson.'}
              </p>
              {hints?.length > 0 && (
                <>
                  <p className="font-sans text-xs font-semibold text-foreground">Hints</p>
                  <ul className="list-disc space-y-1 pl-4 font-sans text-xs text-muted-foreground">
                    {hints.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </>
              )}
              {challengePlaceholder && (
                <>
                  <p className="font-sans text-xs font-semibold text-foreground">Challenge</p>
                  <p className="font-sans text-xs text-muted-foreground">{challengePlaceholder}</p>
                </>
              )}
            </div>
          )}
          {tab === 'problems' && (
            <div className="space-y-1">
              {problems.length === 0 && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <TriangleAlert className="size-3.5" /> No problems detected.
                </p>
              )}
              {problems.map((p, i) => (
                <p key={i} className="text-amber-300">
                  {p}
                </p>
              ))}
            </div>
          )}
          {tab === 'tests' && (
            <p className="font-sans text-xs text-muted-foreground">
              Public / hidden test runner architecture is ready — evaluation arrives in Prompt 007+.
            </p>
          )}
          {tab === 'ai' && (
            <div className="space-y-2 font-sans">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                {aiEnabled
                  ? 'AI actions are wired to a configurable provider facade (placeholder responses).'
                  : 'AI is disabled for this lesson.'}
              </p>
              {aiEnabled && (
                <div className="flex flex-wrap gap-1">
                  {(aiActions.length ? aiActions : Object.keys(AI_LABELS)).map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={() => onAiAction?.(action)}
                    >
                      {AI_LABELS[action] || action}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
