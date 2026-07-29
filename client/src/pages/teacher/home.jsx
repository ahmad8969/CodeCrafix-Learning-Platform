import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Clock, ListChecks } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { assignmentService } from '@/services/assignment.service'
import { quizService } from '@/services/quiz.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function TeacherHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignment-teacher-dash'],
    queryFn: () => assignmentService.teacherDashboard(),
  })
  const { data: quizzes } = useQuery({
    queryKey: ['quiz-teacher-dash'],
    queryFn: () => quizService.teacherDashboard(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6 p-1">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Teacher overview</p>
          <h1 className="text-2xl font-extrabold">Review queue</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.TEACHER}/quizzes`}>Quizzes</Link>
          </Button>
          <Button asChild>
            <Link to={`${ROUTES.TEACHER}/reviews`}>Open reviews</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClipboardList className="size-3.5" /> To review
          </p>
          <p className="text-2xl font-bold">{data?.assignmentsToReview?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" /> Avg review time
          </p>
          <p className="text-2xl font-bold">{data?.averageReviewTimeHours ?? 0}h</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="size-3.5" /> Published quizzes
          </p>
          <p className="text-2xl font-bold">{quizzes?.published ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ListChecks className="size-3.5" /> Draft quizzes
          </p>
          <p className="text-2xl font-bold">{quizzes?.drafts ?? 0}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {(data?.recentlySubmitted || []).slice(0, 5).map((s) => (
          <li key={s._id} className="rounded-xl border border-border px-3 py-2 text-sm">
            <Link
              to={`${ROUTES.TEACHER}/assignments/${s.assignment?._id}/submissions/${s._id}`}
              className="flex justify-between gap-2 hover:text-primary"
            >
              <span>
                {s.student?.fullName} · {s.assignment?.title}
              </span>
              <Badge>{s.status}</Badge>
            </Link>
          </li>
        ))}
      </ul>
      {(quizzes?.recentAttempts || []).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">Recent quiz attempts</h2>
          <ul className="space-y-2">
            {quizzes.recentAttempts.slice(0, 5).map((a) => (
              <li key={a._id} className="rounded-xl border border-border px-3 py-2 text-sm">
                <Link
                  to={`${ROUTES.TEACHER}/quizzes/${a.quiz?._id || a.quiz}/attempts`}
                  className="flex justify-between gap-2 hover:text-primary"
                >
                  <span>
                    {a.student?.fullName} · {a.quiz?.title}
                  </span>
                  <Badge>{a.percentage}%</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageTransition>
  )
}
