import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function AttendanceBadge({ status }) {
  const map = {
    present: 'bg-emerald-600',
    late: 'bg-amber-500',
    absent: 'bg-destructive',
    excused: 'bg-sky-600',
  }
  return <Badge className={map[status] || ''}>{status}</Badge>
}

export function ClassCard({ item, href, actions }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{item.status}</Badge>
        {item.batch?.batchCode && <Badge variant="secondary">{item.batch.batchCode}</Badge>}
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {item.title}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{item.title}</h3>
      )}
      <p className="mt-1 text-sm text-muted-foreground">{item.course?.title}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {item.startsAt ? new Date(item.startsAt).toLocaleString() : '—'} · {item.teacher?.fullName}
      </p>
      {item.meetingLink && (
        <a
          href={item.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-primary hover:underline"
        >
          Join meeting
        </a>
      )}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function AnnouncementCard({ item, href }) {
  const priority = {
    urgent: 'border-destructive/50',
    high: 'border-amber-500/40',
    normal: '',
    low: 'opacity-80',
  }[item.priority]
  return (
    <div className={cn('rounded-2xl border border-border bg-card p-4', priority)}>
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge variant="secondary">{item.priority}</Badge>
        <Badge>{item.status}</Badge>
      </div>
      {href ? (
        <Link to={href} className="font-semibold hover:text-primary">
          {item.title}
        </Link>
      ) : (
        <h3 className="font-semibold">{item.title}</h3>
      )}
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.body}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Draft'}
      </p>
    </div>
  )
}

export function RecordingCard({ item }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-semibold">{item.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{item.storageType}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" asChild>
          <a href={item.url} target="_blank" rel="noreferrer">
            Watch
          </a>
        </Button>
        {item.downloadable && (
          <Button size="sm" variant="outline" asChild>
            <a href={item.url} download>
              Download
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

export function AcademicCalendar({ items = [], view = 'month', className }) {
  if (view === 'agenda') {
    return (
      <ul className={cn('space-y-2', className)}>
        {items.map((e) => (
          <li key={`${e.source}-${e.id}`} className="flex justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-xs text-muted-foreground">{e.type}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {e.startAt ? new Date(e.startAt).toLocaleString() : ''}
            </span>
          </li>
        ))}
        {!items.length && <li className="text-xs text-muted-foreground">No events</li>}
      </ul>
    )
  }

  const byDay = items.reduce((acc, e) => {
    const key = e.startAt ? new Date(e.startAt).toISOString().slice(0, 10) : 'unknown'
    acc[key] = acc[key] || []
    acc[key].push(e)
    return acc
  }, {})
  const days = Object.keys(byDay).sort()

  return (
    <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {days.map((day) => (
        <div key={day} className="rounded-xl border border-border bg-card p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground">{day}</p>
          <ul className="mt-2 space-y-1.5">
            {byDay[day].map((e) => (
              <li key={`${e.source}-${e.id}`} className="text-sm">
                <span
                  className="mr-1.5 inline-block size-2 rounded-full"
                  style={{ background: e.color || '#14b8a6' }}
                />
                {e.title}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!days.length && <p className="text-xs text-muted-foreground">No calendar events</p>}
    </div>
  )
}

export function WeeklyTimetable({ classes = [] }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayIndex = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
  const grouped = Object.fromEntries(days.map((d) => [d, []]))
  for (const c of classes) {
    if (!c.startsAt) continue
    const name = Object.keys(dayIndex).find((k) => dayIndex[k] === new Date(c.startsAt).getDay())
    if (name && grouped[name]) grouped[name].push(c)
  }
  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => (
        <div key={day} className="min-h-28 rounded-xl border border-border bg-card p-2">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {day.slice(0, 3)}
          </p>
          <ul className="space-y-1">
            {grouped[day].map((c) => (
              <li key={c._id} className="rounded-lg bg-primary/10 px-1.5 py-1 text-[11px] leading-tight">
                <p className="font-semibold line-clamp-2">{c.title}</p>
                <p className="text-muted-foreground">{c.startTime}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function AttendanceTable({ rows = [], editable, onChange }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r._id || r.student?._id} className="border-t border-border">
              <td className="px-3 py-2">
                <p className="font-medium">{r.student?.fullName}</p>
                <p className="text-xs text-muted-foreground">{r.student?.email}</p>
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <select
                    className="rounded-md border border-border bg-background px-2 py-1"
                    value={r.status}
                    onChange={(e) => onChange?.(r, { status: e.target.value })}
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excused</option>
                  </select>
                ) : (
                  <AttendanceBadge status={r.status} />
                )}
              </td>
              <td className="px-3 py-2 tabular-nums">
                {Math.round((r.durationSeconds || 0) / 60)}m
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{r.notes || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AttendanceCharts({ summary }) {
  if (!summary) return null
  const t = summary.totals || {}
  const bars = [
    ['Present', t.present, 'bg-emerald-500'],
    ['Late', t.late, 'bg-amber-500'],
    ['Absent', t.absent, 'bg-rose-500'],
    ['Excused', t.excused, 'bg-sky-500'],
  ]
  const max = Math.max(1, ...bars.map(([, v]) => v || 0))
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-bold">Breakdown</p>
        <div className="space-y-2">
          {bars.map(([label, value, color]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{label}</span>
                <span>{value || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', color)}
                  style={{ width: `${((value || 0) / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-bold">Weekly trend</p>
        <div className="flex h-32 items-end gap-1">
          {(summary.weekly || []).map((w) => (
            <div key={w.week} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(4, w.percentage)}%` }}
                title={`${w.percentage}%`}
              />
              <span className="text-[9px] text-muted-foreground">{w.week.slice(5)}</span>
            </div>
          ))}
          {!summary.weekly?.length && (
            <p className="text-xs text-muted-foreground">No weekly data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export function exportAttendanceCsv(rows = [], filename = 'attendance.csv') {
  const header = 'Student,Email,Status,Duration(s),Notes'
  const lines = rows.map((r) =>
    [
      JSON.stringify(r.student?.fullName || ''),
      JSON.stringify(r.student?.email || ''),
      r.status,
      r.durationSeconds || 0,
      JSON.stringify(r.notes || ''),
    ].join(',')
  )
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
