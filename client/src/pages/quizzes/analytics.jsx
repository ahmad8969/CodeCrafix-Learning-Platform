import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { quizService } from '@/services/quiz.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/quizzes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/quizzes`
  return `${ROUTES.ADMIN}/quizzes`
}

export default function QuizAnalyticsPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const { data, isLoading } = useQuery({
    queryKey: ['quiz-analytics'],
    queryFn: () => quizService.analytics(),
  })

  if (isLoading) return <PageLoader />

  const t = data?.totals || {}

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Quizzes', to: base }, { label: 'Analytics' }]} />
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Quiz analytics</h1>
            <p className="text-sm text-muted-foreground">Pass rates, averages, and hardest questions.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={base}>Back</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Quizzes" value={t.quizzes || 0} />
          <Stat label="Attempts" value={t.attempts || 0} />
          <Stat label="Pass rate" value={`${t.passRate || 0}%`} />
          <Stat label="Avg score" value={`${t.averageScore || 0}%`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Per-quiz performance</h2>
            <ul className="space-y-2 text-sm">
              {(data?.quizzes || []).map((q) => (
                <li key={q._id} className="flex justify-between gap-2 border-b border-border/60 py-2 last:border-0">
                  <span className="font-medium">{q.title}</span>
                  <span className="text-muted-foreground">
                    {q.attemptCount || 0} att · {q.averageScore || 0}% · pass {q.passCount || 0}
                  </span>
                </li>
              ))}
              {!data?.quizzes?.length && <li className="text-xs text-muted-foreground">No quizzes yet</li>}
            </ul>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Most missed questions</h2>
            <ul className="space-y-2 text-sm">
              {(data?.mostMissedQuestions || []).map((m) => (
                <li key={m._id} className="flex justify-between gap-2">
                  <span className="font-mono text-xs">{m._id}</span>
                  <span>
                    {m.misses} misses · {m.type}
                  </span>
                </li>
              ))}
              {!data?.mostMissedQuestions?.length && (
                <li className="text-xs text-muted-foreground">No miss data yet</li>
              )}
            </ul>
          </section>
        </div>
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
