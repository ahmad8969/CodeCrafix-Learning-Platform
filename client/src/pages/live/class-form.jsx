import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
import { liveClassService } from '@/services/live-class.service'
import { courseService, batchService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'
import { RecordingCard } from '@/components/live/live-widgets'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/classes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/classes`
  return `${ROUTES.ADMIN}/classes`
}

const EMPTY = {
  title: '',
  description: '',
  course: '',
  batch: '',
  scheduledDate: '',
  startTime: '10:00 AM',
  endTime: '12:00 PM',
  timezone: 'Asia/Karachi',
  meetingProvider: 'external_link',
  meetingLink: '',
  meetingPassword: '',
  isRecurring: false,
  recurrenceDays: ['friday', 'saturday', 'sunday'],
  recurrenceUntil: '',
}

export default function LiveClassFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'new'
  const { user } = useAuth()
  const base = basePath(user?.role)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: () => courseService.list({ limit: 100 }),
  })
  const { data: batches } = useQuery({
    queryKey: ['batches-mini', form.course],
    queryFn: () => batchService.list({ course: form.course || undefined, limit: 100 }),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['live-class', id],
    queryFn: () => liveClassService.get(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (data) {
      setForm({
        ...EMPTY,
        ...data,
        course: data.course?._id || data.course || '',
        batch: data.batch?._id || data.batch || '',
        scheduledDate: data.scheduledDate
          ? new Date(data.scheduledDate).toISOString().slice(0, 10)
          : '',
        recurrenceDays: data.recurrenceRule?.daysOfWeek || EMPTY.recurrenceDays,
        recurrenceUntil: data.recurrenceRule?.until
          ? new Date(data.recurrenceRule.until).toISOString().slice(0, 10)
          : '',
      })
    }
  }, [data])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.title || !form.course || !form.scheduledDate) {
      notify.error('Title, course, and date are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        course: form.course,
        batch: form.batch || null,
        teacher: form.teacher || user.id || user._id,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        timezone: form.timezone,
        meetingProvider: form.meetingProvider,
        meetingLink: form.meetingLink,
        meetingPassword: form.meetingPassword,
        isRecurring: form.isRecurring,
        recurrenceRule: form.isRecurring
          ? {
              frequency: 'weekly',
              daysOfWeek: form.recurrenceDays,
              until: form.recurrenceUntil ? new Date(form.recurrenceUntil).toISOString() : null,
            }
          : undefined,
      }
      const saved = isEdit
        ? await liveClassService.update(id, payload)
        : await liveClassService.create(payload)
      notify.success('Saved')
      navigate(`${base}/${saved._id}`)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Classes', to: base }, { label: isEdit ? 'Edit' : 'New' }]} />
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit class' : 'Create live class'}</h1>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
          <Field label="Course">
            <Select value={form.course || undefined} onValueChange={(v) => set('course', v)}>
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
          </Field>
          <Field label="Batch">
            <Select value={form.batch || undefined} onValueChange={(v) => set('batch', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional batch" />
              </SelectTrigger>
              <SelectContent>
                {(batches?.items || []).map((b) => (
                  <SelectItem key={b._id} value={b._id}>
                    {b.name} ({b.batchCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Date">
              <Input
                type="date"
                value={form.scheduledDate}
                onChange={(e) => set('scheduledDate', e.target.value)}
              />
            </Field>
            <Field label="Start">
              <Input value={form.startTime} onChange={(e) => set('startTime', e.target.value)} />
            </Field>
            <Field label="End">
              <Input value={form.endTime} onChange={(e) => set('endTime', e.target.value)} />
            </Field>
          </div>
          <Field label="Meeting provider">
            <Select
              value={form.meetingProvider}
              onValueChange={(v) => set('meetingProvider', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="external_link">External link</SelectItem>
                <SelectItem value="zoom">Zoom (stub)</SelectItem>
                <SelectItem value="google_meet">Google Meet (stub)</SelectItem>
                <SelectItem value="microsoft_teams">Teams (stub)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Meeting link">
            <Input value={form.meetingLink} onChange={(e) => set('meetingLink', e.target.value)} />
          </Field>
          <Field label="Password">
            <Input
              value={form.meetingPassword}
              onChange={(e) => set('meetingPassword', e.target.value)}
            />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => set('isRecurring', e.target.checked)}
            />
            Recurring weekly
          </label>
          {form.isRecurring && (
            <Field label="Recur until">
              <Input
                type="date"
                value={form.recurrenceUntil}
                onChange={(e) => set('recurrenceUntil', e.target.value)}
              />
            </Field>
          )}
          <div className="flex gap-2">
            <Button disabled={saving} onClick={save}>
              Save
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

export function LiveClassDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const isStudent = user?.role === ROLES.STUDENT
  const base = isStudent ? `${ROUTES.STUDENT}/classes` : basePath(user?.role)
  const navigate = useNavigate()

  const { data: cls, isLoading, refetch } = useQuery({
    queryKey: ['live-class', id],
    queryFn: () => liveClassService.get(id),
  })
  const { data: recordings } = useQuery({
    queryKey: ['recordings', id],
    queryFn: () => liveClassService.listRecordings({ liveClass: id }),
  })
  const [recUrl, setRecUrl] = useState('')

  if (isLoading) return <PageLoader />
  if (!cls) return <p className="p-6">Not found</p>

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Classes', to: base }, { label: cls.title }]} />
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">{cls.status}</p>
          <h1 className="text-2xl font-bold">{cls.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{cls.description}</p>
          <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <li>{cls.course?.title}</li>
            <li>{cls.batch?.name || 'No batch'}</li>
            <li>{cls.startsAt ? new Date(cls.startsAt).toLocaleString() : ''}</li>
            <li>
              {cls.startTime} – {cls.endTime} ({cls.timezone})
            </li>
            <li>Provider: {cls.meetingProvider}</li>
            <li>Teacher: {cls.teacher?.fullName}</li>
          </ul>
          {cls.meetingLink && (
            <Button className="mt-4" asChild>
              <a href={cls.meetingLink} target="_blank" rel="noreferrer">
                Join class
              </a>
            </Button>
          )}
          {!isStudent && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cls.status === 'scheduled' && (
                <Button
                  onClick={async () => {
                    await liveClassService.start(id)
                    refetch()
                  }}
                >
                  Start
                </Button>
              )}
              {cls.status === 'live' && (
                <Button
                  onClick={async () => {
                    await liveClassService.end(id)
                    refetch()
                  }}
                >
                  End
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link to={`${base}/${id}/attendance`}>Mark attendance</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`${base}/${id}/edit`}>Edit</Link>
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const dup = await liveClassService.duplicate(id)
                  navigate(`${base}/${dup._id}/edit`)
                }}
              >
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await liveClassService.cancel(id, 'Cancelled by teacher')
                  refetch()
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Recordings</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(recordings?.items || []).map((r) => (
              <RecordingCard key={r._id} item={r} />
            ))}
          </div>
          {!isStudent && (
            <div className="flex gap-2">
              <Input
                placeholder="Recording URL"
                value={recUrl}
                onChange={(e) => setRecUrl(e.target.value)}
              />
              <Button
                onClick={async () => {
                  try {
                    await liveClassService.addRecording({
                      liveClass: id,
                      title: `${cls.title} recording`,
                      url: recUrl,
                      storageType: 'external_link',
                    })
                    notify.success('Recording added')
                    setRecUrl('')
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Add
              </Button>
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
