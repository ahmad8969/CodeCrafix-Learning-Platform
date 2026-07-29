import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Flag, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MonacoEditorPane } from '@/components/workspace/monaco-editor-pane'
import { cn } from '@/lib/utils'

export function QuizCard({ quiz, href, actions, className }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{quiz.status}</Badge>
        {quiz.category && <Badge variant="secondary">{quiz.category}</Badge>}
      </div>
      {href ? (
        <a href={href} className="text-lg font-semibold hover:text-primary">
          {quiz.title}
        </a>
      ) : (
        <h3 className="text-lg font-semibold">{quiz.title}</h3>
      )}
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{quiz.description || '—'}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{quiz.totalQuestions || 0} questions</span>
        <span>{quiz.totalMarks || 0} marks</span>
        <span>{quiz.timeLimitMinutes || 0} min</span>
        <span>Pass {quiz.passingPercentage ?? 60}%</span>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function QuizTimer({ endsAt, onExpire, className }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!endsAt) return undefined
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  const remaining = endsAt ? Math.max(0, Math.floor((new Date(endsAt).getTime() - now) / 1000)) : null

  useEffect(() => {
    if (remaining === 0 && endsAt) onExpire?.()
  }, [remaining, endsAt, onExpire])

  if (remaining == null) return <span className={cn('text-sm text-muted-foreground', className)}>No timer</span>

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const urgent = remaining <= 60

  return (
    <span
      className={cn(
        'rounded-lg border px-3 py-1.5 font-mono text-sm font-bold tabular-nums',
        urgent ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-border bg-muted/40',
        className
      )}
    >
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  )
}

export function QuizProgressBar({ current, total, answered = 0, className }) {
  const pct = total ? Math.round((answered / total) * 100) : 0
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Question {current} / {total}
        </span>
        <span>{pct}% answered</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function QuestionNavigator({
  questions = [],
  answersByKey = {},
  currentKey,
  onSelect,
  className,
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {questions.map((q, i) => {
        const a = answersByKey[q.questionKey]
        const answered = Boolean(
          a &&
            !a.skipped &&
            ((a.selectedOptionIds || []).length || a.textAnswer || (a.codeSnapshot || []).length)
        )
        return (
          <button
            key={q.questionKey}
            type="button"
            onClick={() => onSelect?.(q.questionKey, i)}
            className={cn(
              'flex size-9 items-center justify-center rounded-lg border text-xs font-semibold transition',
              currentKey === q.questionKey && 'border-primary bg-primary text-primary-foreground',
              currentKey !== q.questionKey && answered && 'border-emerald-500/40 bg-emerald-500/10',
              currentKey !== q.questionKey && a?.bookmarked && 'ring-2 ring-amber-400/60',
              currentKey !== q.questionKey && a?.reviewedLater && 'border-dashed',
              currentKey !== q.questionKey && !answered && 'border-border bg-card hover:bg-muted'
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

export function BookmarkButton({ active, onClick }) {
  return (
    <Button type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={onClick}>
      <Bookmark className="size-3.5" /> {active ? 'Bookmarked' : 'Bookmark'}
    </Button>
  )
}

export function OptionCard({ option, selected, multi, onToggle, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle?.(option.id)}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40',
        disabled && 'opacity-60'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center border',
          multi ? 'rounded-sm' : 'rounded-full',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
      </span>
      <span>{option.label}</span>
    </button>
  )
}

export function QuestionCard({
  question,
  answer = {},
  onChange,
  disabled,
  showCorrect,
}) {
  const type = question?.type
  const multi = type === 'multiple_select' || question?.allowMultipleAnswers

  const toggleOption = (id) => {
    if (disabled) return
    const current = answer.selectedOptionIds || []
    let next
    if (multi) {
      next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    } else {
      next = [id]
    }
    onChange?.({
      ...answer,
      questionKey: question.questionKey,
      type,
      selectedOptionIds: next,
      skipped: false,
    })
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{type}</Badge>
        <Badge>{question.difficulty}</Badge>
        <Badge variant="outline">{question.marks} mark(s)</Badge>
      </div>
      <div>
        <h2 className="text-lg font-semibold">{question.title}</h2>
        {question.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>

      {(type === 'multiple_choice' || type === 'true_false' || type === 'multiple_select') && (
        <div className="space-y-2">
          {(question.options || []).map((opt) => (
            <OptionCard
              key={opt.id}
              option={opt}
              multi={multi}
              selected={(answer.selectedOptionIds || []).includes(opt.id)}
              onToggle={toggleOption}
              disabled={disabled}
            />
          ))}
          {showCorrect && question.correctOptionIds?.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Correct: {question.correctOptionIds.join(', ')}
            </p>
          )}
        </div>
      )}

      {type === 'fill_blank' && (
        <div className="space-y-2">
          <Input
            placeholder="Type your answer"
            value={answer.textAnswer || ''}
            disabled={disabled}
            onChange={(e) =>
              onChange?.({
                ...answer,
                questionKey: question.questionKey,
                type,
                textAnswer: e.target.value,
                skipped: false,
              })
            }
          />
          {showCorrect && question.acceptedAnswers?.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Accepted: {question.acceptedAnswers.join(' / ')}
            </p>
          )}
        </div>
      )}

      {type === 'coding' && (
        <CodingAnswer
          question={question}
          answer={answer}
          onChange={onChange}
          disabled={disabled}
        />
      )}

      {!['multiple_choice', 'true_false', 'multiple_select', 'fill_blank', 'coding'].includes(type) && (
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Architecture-ready type <strong>{type}</strong>. Use short answer for now or skip.
          <Textarea
            className="mt-3"
            placeholder="Your response"
            value={answer.textAnswer || ''}
            disabled={disabled}
            onChange={(e) =>
              onChange?.({
                ...answer,
                questionKey: question.questionKey,
                type,
                textAnswer: e.target.value,
                skipped: false,
              })
            }
          />
        </div>
      )}
    </div>
  )
}

function CodingAnswer({ question, answer, onChange, disabled }) {
  const files = useMemo(() => {
    if (answer.codeSnapshot?.length) return answer.codeSnapshot
    return (
      question.starterFiles || [
        { path: 'index.html', language: 'html', content: '<h1>Hello</h1>', entry: true },
        { path: 'script.js', language: 'javascript', content: 'console.log("ready");\n', entry: false },
      ]
    )
  }, [answer.codeSnapshot, question.starterFiles])

  const [activePath, setActivePath] = useState(files[0]?.path)
  const active = files.find((f) => f.path === activePath) || files[0]

  const updateFile = (content) => {
    const next = files.map((f) => (f.path === active.path ? { ...f, content } : f))
    onChange?.({
      ...answer,
      questionKey: question.questionKey,
      type: 'coding',
      codeSnapshot: next,
      skipped: false,
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {files.map((f) => (
          <Button
            key={f.path}
            type="button"
            size="sm"
            variant={f.path === active?.path ? 'default' : 'outline'}
            onClick={() => setActivePath(f.path)}
          >
            {f.path}
          </Button>
        ))}
      </div>
      <div className="h-[280px] overflow-hidden rounded-xl border border-border">
        <MonacoEditorPane
          language={active?.language || 'javascript'}
          value={active?.content || ''}
          onChange={disabled ? undefined : updateFile}
          readOnly={disabled}
          className="h-full border-0"
        />
      </div>
      <Textarea
        placeholder="Optional console stdout for grading"
        value={answer.stdout || ''}
        disabled={disabled}
        onChange={(e) =>
          onChange?.({
            ...answer,
            questionKey: question.questionKey,
            type: 'coding',
            codeSnapshot: files,
            stdout: e.target.value,
            skipped: false,
          })
        }
      />
    </div>
  )
}

export function ResultCard({ result, className }) {
  if (!result) return null
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5', className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{result.quiz?.title || 'Result'}</p>
          <h2 className="text-3xl font-extrabold tabular-nums">{result.percentage ?? 0}%</h2>
          <p className="text-sm text-muted-foreground">
            {result.marks ?? 0} / {result.maxMarks ?? 0} marks ·{' '}
            {formatDuration(result.timeTakenSeconds)}
          </p>
        </div>
        <Badge className={result.passed ? 'bg-emerald-600' : ''}>
          {result.passed ? 'Passed' : 'Failed'}
        </Badge>
      </div>
      {(result.xpAwarded > 0 || result.badgesEarned?.length > 0) && (
        <p className="mt-3 text-xs text-muted-foreground">
          +{result.xpAwarded || 0} XP
          {result.badgesEarned?.length ? ` · Badges: ${result.badgesEarned.join(', ')}` : ''}
        </p>
      )}
    </div>
  )
}

export function AnalysisChart({ analysis, className }) {
  if (!analysis) return null
  const topics = Object.entries(analysis.byTopic || {})
  const diffs = Object.entries(analysis.byDifficulty || {})
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      <Panel title="Topic performance">
        {topics.length ? (
          topics.map(([k, v]) => <BarRow key={k} label={k} value={v.correct} total={v.total} />)
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel title="Difficulty performance">
        {diffs.length ? (
          diffs.map(([k, v]) => <BarRow key={k} label={k} value={v.correct} total={v.total} />)
        ) : (
          <Empty />
        )}
      </Panel>
      <Panel title="Suggested revision">
        <ul className="space-y-1 text-sm text-muted-foreground">
          {(analysis.suggestedRevisionTopics || analysis.suggestedTopics || []).map((t) => (
            <li key={t}>· {t}</li>
          ))}
          {!(analysis.suggestedRevisionTopics || analysis.suggestedTopics)?.length && <Empty />}
        </ul>
      </Panel>
      <Panel title="Summary">
        <ul className="space-y-1 text-sm">
          <li>Correct: {analysis.correctCount ?? 0}</li>
          <li>Incorrect: {analysis.incorrectCount ?? 0}</li>
          <li>Skipped: {analysis.skippedCount ?? 0}</li>
        </ul>
      </Panel>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-bold">{title}</h3>
      {children}
    </div>
  )
}

function BarRow({ label, value = 0, total = 0 }) {
  const pct = total ? Math.round((value / total) * 100) : 0
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs">
        <span>{label || 'General'}</span>
        <span>
          {value}/{total} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-muted-foreground">No data</p>
}

export function LeaderboardCard({ entries = [], className }) {
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', className)}>
      <h3 className="mb-3 text-sm font-bold">Leaderboard</h3>
      <ol className="space-y-2">
        {entries.map((e, i) => (
          <li key={e.studentId || i} className="flex items-center justify-between text-sm">
            <span>
              <span className="mr-2 text-muted-foreground">#{i + 1}</span>
              {e.fullName || 'Student'}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {e.bestPercentage}% · {formatDuration(e.fastestTime)}
            </span>
          </li>
        ))}
        {!entries.length && <li className="text-xs text-muted-foreground">No entries yet</li>}
      </ol>
    </div>
  )
}

export function ReviewPanel({
  onSkip,
  onReviewLater,
  onBookmark,
  bookmarked,
  reviewedLater,
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <BookmarkButton active={bookmarked} onClick={onBookmark} />
      <Button type="button" size="sm" variant="outline" onClick={onSkip}>
        <SkipForward className="size-3.5" /> Skip
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onReviewLater}>
        <Flag className="size-3.5" /> {reviewedLater ? 'Marked review' : 'Review later'}
      </Button>
    </div>
  )
}

export function formatDuration(seconds = 0) {
  const s = Math.max(0, Number(seconds) || 0)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
}

export function exportAttemptsCsv(rows = [], filename = 'quiz-results.csv') {
  const header = ['Student', 'Email', 'Attempt', 'Marks', 'Percentage', 'Passed', 'Time(s)', 'Status', 'Submitted']
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        JSON.stringify(r.student?.fullName || ''),
        JSON.stringify(r.student?.email || ''),
        r.attemptNumber,
        r.marks,
        r.percentage,
        r.passed,
        r.timeTakenSeconds,
        r.status,
        r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
      ].join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
