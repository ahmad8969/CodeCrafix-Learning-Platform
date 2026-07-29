import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { practiceService } from '@/services/practice.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

function practiceBase(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/practice`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/practice`
  return `${ROUTES.ADMIN}/practice`
}

export default function PracticeAnalyticsPage() {
  const { user } = useAuth()
  const base = practiceBase(user?.role)
  const { data, isLoading } = useQuery({
    queryKey: ['practice-analytics'],
    queryFn: () => practiceService.analytics(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-5 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Practice', to: base }, { label: 'Analytics' }]} />
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Practice analytics</h1>
          <Button variant="outline" asChild>
            <Link to={base}>Question bank</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Questions" value={data?.totals?.questions} />
          <Stat label="Attempts" value={data?.totals?.attempts} />
          <Stat label="Successes" value={data?.totals?.successes} />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Most difficult">
            {(data?.mostDifficult || []).map((q) => (
              <Row key={q._id} title={q.title} meta={`${q.successRate}% success`} />
            ))}
          </Panel>
          <Panel title="Most solved">
            {(data?.mostSolved || []).map((q) => (
              <Row key={q._id} title={q.title} meta={`${q.successCount} passes`} />
            ))}
          </Panel>
        </section>
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

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ title, meta }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-2 text-sm">
      <span className="truncate font-medium">{title}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>
    </div>
  )
}
