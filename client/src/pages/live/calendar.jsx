import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AcademicCalendar } from '@/components/live/live-widgets'
import { liveClassService } from '@/services/live-class.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function calendarBase(role) {
  if (role === ROLES.STUDENT) return ROUTES.STUDENT
  if (role === ROLES.TEACHER) return ROUTES.TEACHER
  if (role === ROLES.SUPER_ADMIN) return ROUTES.SUPER_ADMIN
  return ROUTES.ADMIN
}

export default function AcademicCalendarPage() {
  const { user } = useAuth()
  const root = calendarBase(user?.role)
  const canManage = user?.role !== ROLES.STUDENT
  const [view, setView] = useState('month')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    type: 'holiday',
    startAt: '',
    description: '',
    allDay: true,
  })
  const queryClient = useQueryClient()

  const from = new Date()
  from.setDate(1)
  const to = new Date()
  to.setMonth(to.getMonth() + 2)

  const { data, isLoading } = useQuery({
    queryKey: ['academic-calendar', view],
    queryFn: () =>
      liveClassService.calendar({
        from: from.toISOString(),
        to: to.toISOString(),
      }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Academic calendar' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Academic calendar</h1>
            <p className="text-sm text-muted-foreground">
              Classes, deadlines, quizzes, holidays, and institute events.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['month', 'week', 'agenda'].map((v) => (
              <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)}>
                {v}
              </Button>
            ))}
            {canManage && (
              <Button size="sm" onClick={() => setOpen(true)}>
                Add event
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <Link to={`${root}/classes`}>Classes</Link>
            </Button>
          </div>
        </div>
        <AcademicCalendar items={data?.items || []} view={view === 'agenda' ? 'agenda' : 'month'} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New calendar event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="institute_event">Institute event</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  await liveClassService.createEvent({
                    ...form,
                    startAt: new Date(form.startAt).toISOString(),
                  })
                  notify.success('Event created')
                  setOpen(false)
                  queryClient.invalidateQueries({ queryKey: ['academic-calendar'] })
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
