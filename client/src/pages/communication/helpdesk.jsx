import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { communicationService } from '@/services/communication.service'
import { TicketCard, TicketTimeline } from '@/components/communication/comm-widgets'
import { ROUTES } from '@/constants'
import { useAuth } from '@/contexts/auth-context'

function basePath(role) {
  if (role === 'student') return ROUTES.STUDENT
  if (role === 'teacher') return ROUTES.TEACHER
  if (role === 'super_admin') return ROUTES.SUPER_ADMIN
  return ROUTES.ADMIN
}

export default function HelpdeskPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'general_inquiry',
    priority: 'medium',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => communicationService.listTickets({ limit: 50 }),
  })

  const create = useMutation({
    mutationFn: () => communicationService.createTicket(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] })
      setForm({ subject: '', description: '', category: 'general_inquiry', priority: 'medium' })
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Helpdesk</h1>
        <p className="text-sm text-muted-foreground">Tickets with timeline, priorities, and SLA placeholders.</p>
      </div>

      <form
        className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <input
          required
          placeholder="Subject"
          className="rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <select
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {[
            'technical_issue',
            'course_content',
            'assignment_issue',
            'payment_issue',
            'certificate_issue',
            'general_inquiry',
          ].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-border bg-background px-3 py-2"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          {['low', 'medium', 'high', 'urgent'].map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Describe the issue"
          className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 sm:col-span-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Button className="sm:col-span-2" type="submit">
          Open ticket
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.items || []).map((t) => (
          <TicketCard key={t._id} item={t} href={`${base}/helpdesk/${t._id}`} />
        ))}
      </div>
    </PageTransition>
  )
}

export function TicketDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => communicationService.getTicket(id),
  })

  const comment = useMutation({
    mutationFn: (payload) => communicationService.commentTicket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  })
  const reopen = useMutation({
    mutationFn: () => communicationService.reopenTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  })
  const update = useMutation({
    mutationFn: (payload) => communicationService.updateTicket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ticket', id] }),
  })

  if (isLoading) return <PageLoader />

  const staff = ['admin', 'super_admin', 'teacher'].includes(user?.role)

  return (
    <PageTransition className="space-y-6">
      <Button variant="ghost" asChild className="px-0">
        <Link to={`${base}/helpdesk`}>← Helpdesk</Link>
      </Button>
      <div>
        <p className="font-mono text-xs text-muted-foreground">{data?.ticketNumber}</p>
        <h1 className="text-2xl font-extrabold">{data?.subject}</h1>
        <p className="mt-2 text-sm whitespace-pre-wrap">{data?.description}</p>
      </div>

      {staff && (
        <div className="flex flex-wrap gap-2">
          {['in_progress', 'waiting_for_student', 'resolved', 'closed'].map((s) => (
            <Button key={s} size="sm" variant="outline" onClick={() => update.mutate({ status: s })}>
              {s}
            </Button>
          ))}
        </div>
      )}

      <TicketTimeline items={data?.timeline || []} />

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          comment.mutate({
            note: fd.get('note'),
            internal: fd.get('internal') === 'on',
          })
          e.currentTarget.reset()
        }}
      >
        <textarea
          name="note"
          required
          className="min-h-20 w-full rounded-xl border border-border bg-background px-3 py-2"
          placeholder="Add a reply…"
        />
        {staff && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="internal" /> Internal note
          </label>
        )}
        <div className="flex gap-2">
          <Button type="submit">Post</Button>
          {['resolved', 'closed'].includes(data?.status) && (
            <Button type="button" variant="outline" onClick={() => reopen.mutate()}>
              Reopen
            </Button>
          )}
        </div>
      </form>
    </PageTransition>
  )
}
