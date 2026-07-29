import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Lightbulb,
  Play,
  Send,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { MonacoEditorPane } from '@/components/workspace/monaco-editor-pane'
import { FileExplorer, EditorTabs } from '@/components/workspace/file-explorer'
import { PreviewPanel } from '@/components/workspace/preview-panel'
import { LessonContent } from '@/components/lesson/lesson-content'
import { practiceService } from '@/services/practice.service'
import { notify, getErrorMessage } from '@/utils/error'
import { cn } from '@/lib/utils'

function DifficultyBadge({ value }) {
  const map = { easy: 'success', medium: 'warning', hard: 'danger' }
  return <Badge variant={map[value] || 'secondary'}>{value}</Badge>
}

export function McqSolver({ question, onResult }) {
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const multi = Boolean(question.allowMultipleAnswers)

  const toggle = (id) => {
    setSelected((prev) => {
      if (multi) return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      return [id]
    })
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const data = await practiceService.submit(question._id, { selectedOptionIds: selected })
      setResult(data)
      onResult?.(data)
      notify.success(data.feedback || 'Submitted')
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {(question.options || []).map((opt) => {
          const active = selected.includes(opt.id)
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full border border-border text-xs font-bold uppercase">
                {opt.id}
              </span>
              <span className="text-sm">{opt.label}</span>
            </button>
          )
        })}
      </div>
      <Button onClick={submit} disabled={!selected.length || submitting}>
        <Send className="size-4" /> {submitting ? 'Submitting…' : 'Submit answer'}
      </Button>
      {result && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold capitalize text-foreground">{result.status}</p>
          <p className="text-muted-foreground">{result.feedback}</p>
          <p className="mt-1 text-xs">
            Score {result.score}/{result.maxScore}
            {result.xpAwarded ? ` · +${result.xpAwarded} XP` : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export function CodingPracticeLab({ question, onResult }) {
  const [files, setFiles] = useState(question.starterFiles || [])
  const [activeFile, setActiveFile] = useState(
    question.starterFiles?.find((f) => f.entry)?.path || question.starterFiles?.[0]?.path || 'index.html'
  )
  const [logs, setLogs] = useState([])
  const [previewKey, setPreviewKey] = useState(0)
  const [device, setDevice] = useState('desktop')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [hintIndex, setHintIndex] = useState(0)
  const [hintsUsed, setHintsUsed] = useState([])

  useEffect(() => {
    setFiles(question.starterFiles || [])
    setActiveFile(
      question.starterFiles?.find((f) => f.entry)?.path ||
        question.starterFiles?.[0]?.path ||
        'index.html'
    )
    setResult(null)
    setLogs([])
    setHintIndex(0)
    setHintsUsed([])
  }, [question._id])

  const active = files.find((f) => f.path === activeFile) || files[0]

  const run = async () => {
    window.__ccPracticeLogs = []
    setLogs([])
    setPreviewKey((k) => k + 1)
    setBusy(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      const data = await practiceService.run(question._id, {
        files,
        consoleLogs: window.__ccPracticeLogs || [],
        stdout: (window.__ccPracticeLogs || []).join('\n'),
        executionTimeMs: 700,
      })
      setResult({ ...data, kind: 'run' })
      notify.success('Public tests evaluated')
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const onConsoleMessage = useCallback((msg) => {
    const line = (msg.args || []).join(' ')
    window.__ccPracticeLogs = [...(window.__ccPracticeLogs || []).slice(-80), line]
    setLogs((prev) => [...prev.slice(-100), { level: msg.level, args: msg.args, ts: msg.ts }])
  }, [])


  const submit = async () => {
    setBusy(true)
    try {
      window.__ccPracticeLogs = []
      setLogs([])
      setPreviewKey((k) => k + 1)
      await new Promise((r) => setTimeout(r, 700))
      const data = await practiceService.submit(question._id, {
        files,
        consoleLogs: window.__ccPracticeLogs || [],
        stdout: (window.__ccPracticeLogs || []).join('\n'),
        hintsUsed,
        executionTimeMs: 700,
      })
      setResult({ ...data, kind: 'submit' })
      onResult?.(data)
      notify.success(data.feedback || 'Submitted')
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const revealHint = () => {
    const hints = question.hints || []
    if (hintIndex >= hints.length) return
    const h = hints[hintIndex]
    setHintsUsed((prev) => [...new Set([...prev, h.order])])
    setHintIndex((i) => i + 1)
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <DifficultyBadge value={question.difficulty} />
            <Badge variant="secondary">{question.primaryLanguageId || 'browser'}</Badge>
            <span className="text-xs text-muted-foreground">+{question.xpReward || 0} XP</span>
          </div>
          <LessonContent content={question.description || ''} />
          {question.constraints && (
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Constraints:</strong> {question.constraints}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-bold">Public test cases</h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {(question.testCases || []).map((t) => (
              <li key={t.id} className="rounded-lg border border-border/70 px-3 py-2">
                <p className="font-medium text-foreground">{t.label || t.id}</p>
                {t.sampleInput && <p>Input: {t.sampleInput}</p>}
                {t.sampleOutput && <p>Sample: {t.sampleOutput}</p>}
              </li>
            ))}
            {question.hiddenTestCount > 0 && (
              <li className="text-[11px]">+ {question.hiddenTestCount} hidden test(s) on submit</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">Hints</h3>
            <Button size="sm" variant="outline" onClick={revealHint} disabled={hintIndex >= (question.hints || []).length}>
              <Lightbulb className="size-3.5" /> Reveal hint
            </Button>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {(question.hints || []).slice(0, hintIndex).map((h) => (
              <li key={h.order}>
                Hint {h.order}: {h.text}
                {h.xpPenalty ? ` (−${h.xpPenalty} XP)` : ''}
              </li>
            ))}
            {hintIndex === 0 && <li>No hints revealed yet.</li>}
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1220]">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <Button size="sm" onClick={run} disabled={busy}>
            <Play className="size-3.5" /> Run
          </Button>
          <Button size="sm" variant="secondary" onClick={submit} disabled={busy}>
            <Send className="size-3.5" /> Submit
          </Button>
        </div>
        <div className="grid min-h-[420px] grid-cols-[120px_minmax(0,1fr)]">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelect={setActiveFile}
            onAdd={(path) =>
              setFiles((prev) =>
                prev.some((f) => f.path === path)
                  ? prev
                  : [...prev, { path, language: 'javascript', content: '', entry: false }]
              )
            }
          />
          <div className="flex min-w-0 flex-col">
            <EditorTabs files={files} activeFile={activeFile} onSelect={setActiveFile} />
            <div className="grid min-h-0 flex-1 lg:grid-cols-2">
              <MonacoEditorPane
                value={active?.content || ''}
                language={active?.language || 'html'}
                onChange={(v) =>
                  setFiles((prev) => prev.map((f) => (f.path === activeFile ? { ...f, content: v } : f)))
                }
                className="h-[260px] rounded-none border-0 lg:h-full"
              />
              <PreviewPanel
                files={files}
                previewKey={previewKey}
                onConsoleMessage={onConsoleMessage}
                onRefresh={() => setPreviewKey((k) => k + 1)}
                device={device}
                onDeviceChange={setDevice}
                className="min-h-[220px]"
              />
            </div>
          </div>
        </div>
        <div className="max-h-32 overflow-auto border-t border-border p-2 font-mono text-[11px] text-slate-300">
          {logs.length === 0 && <p className="text-muted-foreground">Console output appears after Run.</p>}
          {logs.map((l, i) => (
            <p key={`${l.ts}-${i}`}>{(l.args || []).join(' ')}</p>
          ))}
        </div>
        {result && (
          <div className="border-t border-border p-3 text-sm">
            <p className="font-semibold capitalize">
              {result.kind}: {result.status} — {result.score}/{result.maxScore}
            </p>
            <p className="text-xs text-muted-foreground">{result.feedback}</p>
            {result.hiddenSummary && (
              <p className="mt-1 text-xs text-muted-foreground">
                Hidden: {result.hiddenSummary.passed}/{result.hiddenSummary.total} passed
              </p>
            )}
            <ul className="mt-2 space-y-1 text-xs">
              {(result.publicResults || []).map((r) => (
                <li key={r.id} className={r.passed ? 'text-emerald-400' : 'text-amber-300'}>
                  {r.passed ? '✓' : '✗'} {r.label}: {r.message}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground">
              {result.executionTimeMs}ms · {result.memoryKb}KB
              {result.xpAwarded ? ` · +${result.xpAwarded} XP` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PracticeQuestionSolver({ questionId, onNext }) {
  const queryClient = useQueryClient()
  const { data: question, isLoading } = useQuery({
    queryKey: ['practice-question', questionId],
    queryFn: () => practiceService.get(questionId),
    enabled: Boolean(questionId),
  })
  const { data: history } = useQuery({
    queryKey: ['practice-attempts', questionId],
    queryFn: () => practiceService.attempts(questionId),
    enabled: Boolean(questionId),
  })

  if (isLoading || !question) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  const bookmarked = Boolean(history?.progress?.bookmarked)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">{question.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {question.category} · Attempts {history?.progress?.submissionCount || 0}
            {history?.progress?.bestScore != null ? ` · Best ${history.progress.bestScore}%` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await practiceService.bookmark(questionId)
                queryClient.invalidateQueries({ queryKey: ['practice-attempts', questionId] })
              } catch (e) {
                notify.error(getErrorMessage(e))
              }
            }}
          >
            {bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
            Bookmark
          </Button>
          {onNext && (
            <Button size="sm" variant="secondary" onClick={onNext}>
              Next <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {question.type === 'coding' ? (
        <CodingPracticeLab
          question={question}
          onResult={() => queryClient.invalidateQueries({ queryKey: ['practice-attempts', questionId] })}
        />
      ) : question.type === 'multiple_choice' || question.type === 'true_false' ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <LessonContent content={question.description || ''} />
          <div className="mt-4">
            <McqSolver
              question={question}
              onResult={() => queryClient.invalidateQueries({ queryKey: ['practice-attempts', questionId] })}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Trophy className="mb-2 size-5 text-primary" />
          Question type <strong>{question.type}</strong> is architecture-ready. Coding and MCQ are
          available in this phase.
        </div>
      )}

      {history?.attempts?.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-bold">Attempt history</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {history.attempts.slice(0, 8).map((a) => (
              <li key={a._id} className="flex justify-between gap-2 border-b border-border/50 py-1.5">
                <span className="capitalize">
                  {a.kind} · {a.status}
                </span>
                <span>
                  {a.score}% · {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
