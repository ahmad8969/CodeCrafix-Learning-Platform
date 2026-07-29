import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable } from '@/components/tables/data-table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClassCard, WeeklyTimetable } from '@/components/live/live-widgets'
import { liveClassService } from '@/services/live-class.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/classes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/classes`
  return `${ROUTES.ADMIN}/classes`
}

export default function LiveClassesListPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [view, setView] = useState('list')

  const { data, isLoading } = useQuery({
    queryKey: ['live-classes', debounced, page, status],
    queryFn: () =>
      liveClassService.list({
        search: debounced || undefined,
        page,
        limit: 12,
        status: status === 'all' ? undefined : status,
      }),
  })

  const { data: schedule } = useQuery({
    queryKey: ['teacher-schedule'],
    queryFn: () => liveClassService.teacherSchedule(),
    enabled: user?.role === ROLES.TEACHER || user?.role === ROLES.ADMIN,
  })

  const rows = data?.items || []
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Class',
        render: (row) => (
          <Link to={`${base}/${row._id}`} className="font-medium hover:text-primary">
            {row.title}
          </Link>
        ),
      },
      { key: 'course', label: 'Course', render: (r) => r.course?.title || '—' },
      { key: 'batch', label: 'Batch', render: (r) => r.batch?.batchCode || '—' },
      {
        key: 'startsAt',
        label: 'When',
        render: (r) => (r.startsAt ? new Date(r.startsAt).toLocaleString() : '—'),
      },
      {
        key: 'status',
        label: 'Status',
        render: (r) => <Badge>{r.status}</Badge>,
      },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className="flex gap-1">
            {row.status === 'scheduled' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await liveClassService.start(row._id)
                    notify.success('Started')
                    queryClient.invalidateQueries({ queryKey: ['live-classes'] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Start
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/attendance`}>Attendance</Link>
            </Button>
          </div>
        ),
      },
    ],
    [base, queryClient]
  )

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Live classes' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Live classes</h1>
            <p className="text-sm text-muted-foreground">Schedule, start, and track attendance.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link
                to={
                  user?.role === ROLES.TEACHER
                    ? `${ROUTES.TEACHER}/calendar`
                    : user?.role === ROLES.SUPER_ADMIN
                      ? `${ROUTES.SUPER_ADMIN}/calendar`
                      : `${ROUTES.ADMIN}/calendar`
                }
              >
                Calendar
              </Link>
            </Button>
            <Button asChild>
              <Link to={`${base}/new`}>
                <Plus className="size-4" /> New class
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search classes"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
            List
          </Button>
          <Button variant={view === 'week' ? 'default' : 'outline'} onClick={() => setView('week')}>
            Weekly
          </Button>
        </div>

        {view === 'week' ? (
          <WeeklyTimetable classes={schedule?.items || rows} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            loading={isLoading}
            page={page}
            total={data?.pagination?.total || 0}
            limit={12}
            onPageChange={setPage}
          />
        )}
      </div>
    </PageTransition>
  )
}

/** Student classes home */
export function StudentClassesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-schedule'],
    queryFn: () => liveClassService.studentSchedule(),
  })
  const items = data?.items || []

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'My classes' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">My live classes</h1>
            <p className="text-sm text-muted-foreground">Upcoming and recent sessions for your batches.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`${ROUTES.STUDENT}/calendar`}>Calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${ROUTES.STUDENT}/attendance`}>Attendance</Link>
            </Button>
          </div>
        </div>
        <WeeklyTimetable classes={items} />
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((c) => (
            <ClassCard
              key={c._id}
              item={c}
              href={`${ROUTES.STUDENT}/classes/${c._id}`}
            />
          ))}
          {!isLoading && !items.length && (
            <p className="text-sm text-muted-foreground">No classes scheduled yet.</p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
