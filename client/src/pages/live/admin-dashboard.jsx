import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { ClassCard } from '@/components/live/live-widgets'
import { liveClassService } from '@/services/live-class.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function LiveAdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['live-admin-dash'],
    queryFn: () => liveClassService.adminDashboard(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Live classes overview</h1>
            <p className="text-sm text-muted-foreground">Today’s schedule and attendance alerts.</p>
          </div>
          <Button asChild>
            <Link to={`${ROUTES.ADMIN}/classes`}>Manage classes</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Today's classes" value={data?.todaysClasses?.length || 0} />
          <Stat label="Active live now" value={data?.activeLive || 0} />
          <Stat
            label="Low attendance students"
            value={data?.attendance?.lowAttendanceStudents?.length || 0}
          />
        </div>
        <section>
          <h2 className="mb-3 text-sm font-bold">Today</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.todaysClasses || []).map((c) => (
              <ClassCard key={c._id} item={c} href={`${ROUTES.ADMIN}/classes/${c._id}`} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold">Upcoming</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.upcoming || []).map((c) => (
              <ClassCard key={c._id} item={c} href={`${ROUTES.ADMIN}/classes/${c._id}`} />
            ))}
          </div>
        </section>
        {(data?.attendance?.lowAttendanceStudents || []).length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Low attendance alerts</h2>
            <ul className="space-y-2 text-sm">
              {data.attendance.lowAttendanceStudents.map((s) => (
                <li key={s._id} className="flex justify-between gap-2">
                  <span>{s.student?.fullName || 'Student'}</span>
                  <span className="text-muted-foreground">{s.percentage}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageTransition>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
