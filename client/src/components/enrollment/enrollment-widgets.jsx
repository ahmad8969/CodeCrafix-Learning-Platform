import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }) {
  const tone =
    {
      active: 'bg-emerald-600',
      pending: 'bg-amber-500',
      completed: 'bg-sky-600',
      withdrawn: '',
      rejected: '',
      transferred: '',
      upcoming: 'bg-sky-600',
      archived: '',
    }[status] || ''
  return <Badge className={tone}>{status}</Badge>
}

export function ProgressRing({ value = 0, size = 64, stroke = 6, className }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, Number(value) || 0))
  const offset = c - (pct / 100) * c
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="fill-none stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="fill-none stroke-primary transition-all"
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{pct}%</span>
    </div>
  )
}

export function StudentCard({ student, progress, href, actions }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
          {student?.profileImage ? (
            <img src={student.profileImage} alt="" className="size-full object-cover" />
          ) : (
            (student?.fullName || '?').slice(0, 1)
          )}
        </div>
        <div className="min-w-0 flex-1">
          {href ? (
            <Link to={href} className="font-semibold hover:text-primary">
              {student?.fullName}
            </Link>
          ) : (
            <p className="font-semibold">{student?.fullName}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{student?.email}</p>
          {student?.phoneNumber && (
            <p className="text-xs text-muted-foreground">{student.phoneNumber}</p>
          )}
        </div>
        {progress != null && <ProgressRing value={progress} size={52} />}
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function BatchCard({ batch, href, actions }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <StatusBadge status={batch.status} />
        <Badge variant="secondary">{batch.batchCode}</Badge>
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {batch.name}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{batch.name}</h3>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{batch.course?.title || '—'}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          {batch.currentStudents || 0}/{batch.maximumStudents} students
        </span>
        <span>{batch.teacher?.fullName}</span>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function CourseProgressCard({ title, progress, meta, href }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
      <ProgressRing value={progress} />
      <div className="min-w-0 flex-1">
        {href ? (
          <Link to={href} className="font-semibold hover:text-primary">
            {title}
          </Link>
        ) : (
          <p className="font-semibold">{title}</p>
        )}
        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
      </div>
    </div>
  )
}

export function LearningPathCard({ items = [], className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <div
          key={item.topic?._id || i}
          className={cn(
            'rounded-xl border px-3 py-2 text-sm',
            item.completed && 'border-emerald-500/40 bg-emerald-500/10',
            !item.completed && item.unlocked && 'border-border bg-card',
            !item.unlocked && 'border-dashed border-border opacity-60'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{item.topic?.name}</span>
            <StatusBadge
              status={item.completed ? 'completed' : item.unlocked ? 'active' : 'pending'}
            />
          </div>
          {!item.unlocked && item.reason && (
            <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
          )}
        </div>
      ))}
      {!items.length && <p className="text-xs text-muted-foreground">No topics in path</p>}
    </div>
  )
}

export function ProgressTimeline({ items = [] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-4">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-primary" />
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-muted-foreground">
            {item.at ? new Date(item.at).toLocaleString() : ''}
          </p>
        </li>
      ))}
      {!items.length && <li className="text-xs text-muted-foreground">No activity yet</li>}
    </ol>
  )
}

export function ScheduleCalendar({ events = [] }) {
  const byDate = events.reduce((acc, e) => {
    acc[e.date] = acc[e.date] || []
    acc[e.date].push(e)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort().slice(0, 21)
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {dates.map((date) => (
        <div key={date} className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">{date}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {byDate[date].map((e, i) => (
              <li key={`${date}-${i}`}>
                {e.day}: {e.startTime} – {e.endTime}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!dates.length && <p className="text-xs text-muted-foreground">No scheduled sessions</p>}
    </div>
  )
}

export function AnalyticsCards({ totals = {} }) {
  const entries = [
    ['Total students', totals.totalStudents],
    ['Active batches', totals.activeBatches],
    ['New enrollments', totals.newEnrollments],
    ['Completion rate', totals.courseCompletionRate != null ? `${totals.courseCompletionRate}%` : null],
    ['Retention', totals.studentRetention != null ? `${totals.studentRetention}%` : null],
  ].filter(([, v]) => v != null)
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {entries.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value ?? 0}</p>
        </div>
      ))}
    </div>
  )
}

export function exportRowsCsv(rows, filename, columns) {
  const header = columns.map((c) => c.label).join(',')
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const v = typeof c.get === 'function' ? c.get(row) : row[c.key]
        return JSON.stringify(v ?? '')
      })
      .join(',')
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
