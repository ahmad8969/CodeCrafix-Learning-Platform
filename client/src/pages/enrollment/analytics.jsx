import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { AnalyticsCards } from '@/components/enrollment/enrollment-widgets'
import { enrollmentService } from '@/services/enrollment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/enrollments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/enrollments`
  return `${ROUTES.ADMIN}/enrollments`
}

export default function EnrollmentAnalyticsPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const { data, isLoading } = useQuery({
    queryKey: ['enrollment-analytics'],
    queryFn: () => enrollmentService.analytics(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Enrollments', to: base }, { label: 'Analytics' }]} />
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Enrollment analytics</h1>
            <p className="text-sm text-muted-foreground">Retention, completion, and batch performance.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={base}>Back</Link>
          </Button>
        </div>

        <AnalyticsCards totals={data?.totals || {}} />

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Top courses</h2>
            <ul className="space-y-2 text-sm">
              {(data?.topCourses || []).map((c) => (
                <li key={c.courseId} className="flex justify-between gap-2">
                  <span>{c.title}</span>
                  <span className="text-muted-foreground">
                    {c.count} · avg {c.averageProgress}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Top teachers</h2>
            <ul className="space-y-2 text-sm">
              {(data?.topTeachers || []).map((t) => (
                <li key={t.teacherId} className="flex justify-between gap-2">
                  <span>{t.fullName}</span>
                  <span className="text-muted-foreground">
                    {t.students} · avg {t.averageProgress}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">Batch performance</h2>
          <ul className="space-y-2 text-sm">
            {(data?.batchPerformance || []).map((b) => (
              <li key={b._id} className="flex justify-between gap-2">
                <span>
                  {b.name} ({b.batchCode})
                </span>
                <span className="text-muted-foreground">
                  {b.currentStudents}/{b.maximumStudents} · {b.averageProgress}%
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
