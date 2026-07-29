import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  AttendanceCharts,
  AttendanceTable,
  exportAttendanceCsv,
} from '@/components/live/live-widgets'
import { liveClassService } from '@/services/live-class.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/classes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/classes`
  return `${ROUTES.ADMIN}/classes`
}

export default function ClassAttendancePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const [rows, setRows] = useState([])

  const { data: cls } = useQuery({
    queryKey: ['live-class', id],
    queryFn: () => liveClassService.get(id),
  })
  const { data: roster, isLoading } = useQuery({
    queryKey: ['class-roster', id],
    queryFn: () => liveClassService.roster(id),
  })

  useEffect(() => {
    if (roster?.items) setRows(roster.items)
  }, [roster])

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Classes', to: base },
            { label: cls?.title || 'Class', to: `${base}/${id}` },
            { label: 'Attendance' },
          ]}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Attendance</h1>
            <p className="text-sm text-muted-foreground">{cls?.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportAttendanceCsv(rows, `${cls?.title || 'class'}-attendance.csv`)}>
              <Download className="size-4" /> Download
            </Button>
            <Button
              onClick={async () => {
                try {
                  await liveClassService.markAttendance(
                    id,
                    rows.map((r) => ({
                      studentId: r.student?._id || r.student,
                      status: r.status,
                      notes: r.notes,
                    }))
                  )
                  notify.success('Attendance saved')
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Save attendance
            </Button>
          </div>
        </div>
        <AttendanceTable
          rows={rows}
          editable
          onChange={(row, patch) => {
            setRows((prev) =>
              prev.map((r) => (String(r._id) === String(row._id) ? { ...r, ...patch } : r))
            )
          }}
        />
      </div>
    </PageTransition>
  )
}

export function StudentAttendancePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => liveClassService.myAttendance(),
  })

  if (isLoading) return <PageLoader />
  const t = data?.totals || {}

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Attendance' }]} />
        <div>
          <h1 className="text-2xl font-bold">My attendance</h1>
          <p className="text-sm text-muted-foreground">
            {t.percentage ?? 0}% overall
            {data?.lowAttendance ? ' · Below minimum threshold' : ''}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['Total', t.total],
            ['Present', t.present],
            ['Late', t.late],
            ['Absent', t.absent],
            ['Excused', t.excused],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold tabular-nums">{value ?? 0}</p>
            </div>
          ))}
        </div>
        <AttendanceCharts summary={data} />
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">History</h2>
          <ul className="space-y-2 text-sm">
            {(data?.history || []).map((h) => (
              <li key={h._id} className="flex justify-between gap-2 border-b border-border/50 py-2 last:border-0">
                <span>{h.liveClass?.title || 'Class'}</span>
                <span className="text-muted-foreground capitalize">{h.status}</span>
              </li>
            ))}
          </ul>
        </section>
        <Button variant="outline" asChild>
          <Link to={`${ROUTES.STUDENT}/classes`}>Back to classes</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
