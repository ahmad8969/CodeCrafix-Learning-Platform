import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { assignmentService } from '@/services/assignment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/assignments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/assignments`
  return `${ROUTES.ADMIN}/assignments`
}

export default function AssignmentAnalyticsPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const { data, isLoading } = useQuery({
    queryKey: ['assignment-analytics'],
    queryFn: () => assignmentService.analytics(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-5 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Assignments', to: base }, { label: 'Analytics' }]} />
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Assignment analytics</h1>
          <Button variant="outline" asChild>
            <Link to={base}>Back</Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Assignments" value={data?.totals?.assignments} />
          <Stat label="Submissions" value={data?.totals?.submissions} />
          <Stat label="Avg marks" value={data?.totals?.averageMarks} />
          <Stat label="Late %" value={data?.totals?.lateSubmissionRate} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">Most difficult (by avg marks)</h2>
          <ul className="space-y-2 text-sm">
            {(data?.mostDifficult || []).map((a) => (
              <li key={a._id} className="flex justify-between gap-2 border-b border-border/50 py-2">
                <span>{a.title}</span>
                <span className="text-muted-foreground">{a.averageMarks ?? 0} avg</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageTransition>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  )
}
