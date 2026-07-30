import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ConversationList({ items = [], activeId, onSelect }) {
  return (
    <div className="space-y-1">
      {items.map((c) => {
        const title =
          c.title ||
          c.participants
            ?.map((p) => p.fullName)
            .filter(Boolean)
            .join(', ') ||
          'Conversation'
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => onSelect?.(c)}
            className={cn(
              'w-full rounded-xl border px-3 py-2 text-left text-sm transition',
              activeId === c._id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium line-clamp-1">{title}</span>
              <Badge variant="secondary">{c.type}</Badge>
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {c.lastMessagePreview || 'No messages yet'}
            </p>
          </button>
        )
      })}
      {!items.length && <p className="p-3 text-sm text-muted-foreground">No conversations</p>}
    </div>
  )
}

export function ChatWindow({ messages = [], onSend, loading }) {
  return (
    <div className="flex h-[28rem] flex-col rounded-2xl border border-border">
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {[...messages].reverse().map((m) => (
          <div key={m._id} className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">{m.sender?.fullName}</p>
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
              {m.readBy?.length > 1 ? ' · Read' : ''}
            </p>
          </div>
        ))}
      </div>
      <form
        className="flex gap-2 border-t border-border p-2"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          const body = String(fd.get('body') || '').trim()
          if (!body) return
          onSend?.({ body })
          e.currentTarget.reset()
        }}
      >
        <input
          name="body"
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={loading}>
          Send
        </Button>
      </form>
    </div>
  )
}

export function ForumThreadCard({ item, href }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        {item.pinned && <Badge>Pinned</Badge>}
        {item.locked && <Badge variant="outline">Locked</Badge>}
        <Badge variant="secondary">{item.replyCount || 0} replies</Badge>
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {item.title || item.body?.slice(0, 80)}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{item.title || item.body?.slice(0, 80)}</h3>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        {item.author?.fullName} · {item.course?.title} ·{' '}
        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
      </p>
    </div>
  )
}

export function ReplyEditor({ onSubmit, placeholder = 'Write a reply…' }) {
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const body = String(fd.get('body') || '').trim()
        if (!body) return
        onSubmit?.({ body })
        e.currentTarget.reset()
      }}
    >
      <textarea
        name="body"
        required
        placeholder={placeholder}
        className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
      <Button type="submit">Post</Button>
    </form>
  )
}

export function TicketCard({ item, href }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{item.status}</Badge>
        <Badge variant="secondary">{item.priority}</Badge>
        <Badge variant="outline">{item.category}</Badge>
      </div>
      {href ? (
        <Link to={href} className="font-semibold hover:text-primary">
          {item.subject}
        </Link>
      ) : (
        <h3 className="font-semibold">{item.subject}</h3>
      )}
      <p className="mt-1 font-mono text-xs text-muted-foreground">{item.ticketNumber}</p>
      <p className="mt-1 text-xs text-muted-foreground">{item.student?.fullName}</p>
    </div>
  )
}

export function TicketTimeline({ items = [] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {items.map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-teal-600" />
          <p className="text-sm font-medium">
            {e.type}
            {e.internal ? ' (internal)' : ''}
          </p>
          <p className="text-sm">{e.note}</p>
          <p className="text-xs text-muted-foreground">
            {e.by?.fullName || ''} · {e.at ? new Date(e.at).toLocaleString() : ''}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function CrmKanbanBoard({ board = {}, stages = [], onMove }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => (
        <div key={stage} className="min-w-[220px] flex-1 rounded-2xl border border-border bg-muted/20 p-3">
          <h3 className="mb-3 text-sm font-bold capitalize">{stage.replaceAll('_', ' ')}</h3>
          <div className="space-y-2">
            {(board[stage] || []).map((lead) => (
              <div key={lead._id} className="rounded-xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold">{lead.fullName}</p>
                <p className="text-xs text-muted-foreground">{lead.source || '—'}</p>
                <select
                  className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                  value={lead.stage}
                  onChange={(e) => onMove?.(lead._id, e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function JobCard({ job, href, actions }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge>{job.type}</Badge>
        {job.salaryPlaceholder && <Badge variant="secondary">{job.salaryPlaceholder}</Badge>}
      </div>
      {href ? (
        <Link to={href} className="text-lg font-semibold hover:text-primary">
          {job.title}
        </Link>
      ) : (
        <h3 className="text-lg font-semibold">{job.title}</h3>
      )}
      <p className="text-sm text-muted-foreground">{job.company}</p>
      <p className="mt-2 line-clamp-2 text-sm">{job.description}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(job.skillsRequired || []).slice(0, 5).map((s) => (
          <Badge key={s} variant="outline">
            {s}
          </Badge>
        ))}
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function PortfolioCard({ profile }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex gap-2">
        <Badge>{profile.status}</Badge>
      </div>
      <h3 className="font-semibold">{profile.user?.fullName || 'Portfolio'}</h3>
      <p className="text-sm text-muted-foreground">{profile.headline}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {(profile.skills || []).slice(0, 6).map((s) => (
          <Badge key={s} variant="outline">
            {s}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function SurveyForm({ survey, onSubmit }) {
  if (!survey) return null
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const answers = (survey.questions || []).map((q) => {
          let value = fd.get(q.key)
          if (q.type === 'rating') value = Number(value)
          if (q.type === 'yes_no') value = value === 'yes'
          return { questionKey: q.key, value }
        })
        onSubmit?.(answers)
      }}
    >
      <h2 className="text-xl font-bold">{survey.title}</h2>
      <p className="text-sm text-muted-foreground">{survey.description}</p>
      {(survey.questions || []).map((q) => (
        <label key={q.key} className="block text-sm">
          <span className="mb-1 block font-medium">{q.prompt}</span>
          {q.type === 'rating' && (
            <select name={q.key} className="w-full rounded-xl border border-border bg-background px-3 py-2" defaultValue="5">
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
          {q.type === 'text' && (
            <textarea name={q.key} className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2" />
          )}
          {q.type === 'yes_no' && (
            <select name={q.key} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          )}
          {q.type === 'multiple_choice' && (
            <select name={q.key} className="w-full rounded-xl border border-border bg-background px-3 py-2">
              {(q.options || []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
        </label>
      ))}
      <Button type="submit">Submit feedback</Button>
    </form>
  )
}
