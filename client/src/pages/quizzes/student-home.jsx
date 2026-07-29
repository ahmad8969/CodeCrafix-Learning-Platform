import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { QuizCard } from '@/components/quiz/quiz-widgets'
import { quizService } from '@/services/quiz.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function StudentQuizzesPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['quiz-student-dash'],
    queryFn: () => quizService.studentDashboard(),
  })
  const { data: list } = useQuery({
    queryKey: ['quizzes-published'],
    queryFn: () => quizService.list({ status: 'published', limit: 30 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Quizzes' }]} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
          <p className="text-sm text-muted-foreground">
            Timed assessments with instant results and revision tips.
          </p>
        </div>

        {(dash?.inProgress || []).length > 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <h2 className="mb-2 text-sm font-bold">In progress</h2>
            <ul className="space-y-2 text-sm">
              {dash.inProgress.map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-2">
                  <span>{a.quiz?.title || 'Quiz'}</span>
                  <Button size="sm" asChild>
                    <Link to={`${ROUTES.STUDENT}/quizzes/attempts/${a._id}`}>Resume</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Available</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(list?.items || dash?.availableQuizzes || []).map((q) => (
              <QuizCard
                key={q._id}
                quiz={q}
                actions={
                  <Button size="sm" asChild>
                    <Link to={`${ROUTES.STUDENT}/quizzes/${q._id}`}>Open</Link>
                  </Button>
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-bold">Recent attempts</h2>
          <ul className="space-y-2 text-sm">
            {(dash?.recentAttempts || [])
              .filter((a) => a.status !== 'in_progress')
              .slice(0, 8)
              .map((a) => (
                <li key={a._id} className="flex items-center justify-between gap-2">
                  <div>
                    <Link
                      to={`${ROUTES.STUDENT}/quizzes/attempts/${a._id}`}
                      className="font-medium hover:text-primary"
                    >
                      {a.quiz?.title || 'Quiz'}
                    </Link>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{a.status}</Badge>
                      {a.percentage != null && <span>{a.percentage}%</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`${ROUTES.STUDENT}/quizzes/attempts/${a._id}`}>Result</Link>
                  </Button>
                </li>
              ))}
            {!dash?.recentAttempts?.length && (
              <li className="text-xs text-muted-foreground">No attempts yet</li>
            )}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
