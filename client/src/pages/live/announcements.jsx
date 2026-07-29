import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AnnouncementCard } from '@/components/live/live-widgets'
import { liveClassService } from '@/services/live-class.service'
import { courseService, batchService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.STUDENT) return `${ROUTES.STUDENT}/announcements`
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/announcements`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/announcements`
  return `${ROUTES.ADMIN}/announcements`
}

export default function AnnouncementsListPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const canManage = user?.role !== ROLES.STUDENT
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => liveClassService.listAnnouncements({ limit: 40 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Announcements' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-sm text-muted-foreground">Course and batch notices.</p>
          </div>
          {canManage && (
            <Button asChild>
              <Link to={`${base}/new`}>New announcement</Link>
            </Button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.items || []).map((a) => (
            <div key={a._id} className="space-y-2">
              <AnnouncementCard item={a} href={`${base}/${a._id}`} />
              {canManage && a.status !== 'published' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await liveClassService.publishAnnouncement(a._id)
                      notify.success('Published')
                      queryClient.invalidateQueries({ queryKey: ['announcements'] })
                    } catch (e) {
                      notify.error(getErrorMessage(e))
                    }
                  }}
                >
                  Publish
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}

export function AnnouncementFormPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'all_students',
    priority: 'normal',
    course: '',
    batch: '',
  })
  const [saving, setSaving] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: () => courseService.list({ limit: 100 }),
  })
  const { data: batches } = useQuery({
    queryKey: ['batches-mini', form.course],
    queryFn: () => batchService.list({ course: form.course || undefined, limit: 50 }),
  })

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Announcements', to: base }, { label: 'New' }]} />
        <h1 className="text-2xl font-bold">Create announcement</h1>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Body (rich text / markdown)</Label>
            <Textarea rows={6} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => setForm((p) => ({ ...p, audience: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_students">All students</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="batch">Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(form.audience === 'course' || form.audience === 'batch') && (
            <div className="space-y-1">
              <Label>Course</Label>
              <Select value={form.course || undefined} onValueChange={(v) => setForm((p) => ({ ...p, course: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {(courses?.items || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.audience === 'batch' && (
            <div className="space-y-1">
              <Label>Batch</Label>
              <Select value={form.batch || undefined} onValueChange={(v) => setForm((p) => ({ ...p, batch: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {(batches?.items || []).map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              disabled={saving}
              onClick={async () => {
                setSaving(true)
                try {
                  const created = await liveClassService.createAnnouncement(form)
                  await liveClassService.publishAnnouncement(created._id)
                  notify.success('Published')
                  window.location.href = base
                } catch (e) {
                  notify.error(getErrorMessage(e))
                } finally {
                  setSaving(false)
                }
              }}
            >
              Publish
            </Button>
            <Button variant="outline" asChild>
              <Link to={base}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export function AnnouncementDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const { data, isLoading } = useQuery({
    queryKey: ['announcement', id],
    queryFn: () => liveClassService.getAnnouncement(id),
  })
  if (isLoading) return <PageLoader />
  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Announcements', to: base }, { label: data?.title || 'Detail' }]} />
        <AnnouncementCard item={data || {}} />
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm">
          {data?.body}
        </div>
        {(data?.links || []).map((l, i) => (
          <a key={i} href={l.url} className="block text-sm text-primary hover:underline" target="_blank" rel="noreferrer">
            {l.label || l.url}
          </a>
        ))}
      </div>
    </PageTransition>
  )
}
