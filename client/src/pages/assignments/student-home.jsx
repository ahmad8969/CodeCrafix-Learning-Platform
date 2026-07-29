import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Countdown } from '@/components/assignment/assignment-widgets'
import { assignmentService } from '@/services/assignment.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function StudentAssignmentsPage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['assignment-student-dash'],
    queryFn: () => assignmentService.studentDashboard(),
  })
  const { data: list } = useQuery({
    queryKey: ['assignments-published'],
    queryFn: () => assignmentService.list({ status: 'published', limit: 30 }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Assignments' }]} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          <p className="text-sm text-muted-foreground">
            Pending work, deadlines, and feedback in one place.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Panel title="Pending" items={dash?.pendingAssignments} empty="All caught up" />
          <Panel title="Upcoming deadlines" items={dash?.upcomingDeadlines} showDue empty="None" />
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">Recent feedback</h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {(dash?.recentFeedback || []).map((s) => (
                <li key={s._id}>
                  <Link
                    to={`${ROUTES.STUDENT}/assignments/${s.assignment?._id || s.assignment}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {s.assignment?.title || 'Assignment'}
                  </Link>
                  <p className="line-clamp-2">{s.teacherFeedback}</p>
                </li>
              ))}
              {!dash?.recentFeedback?.length && <li>No feedback yet</li>}
            </ul>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            All published
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(list?.items || []).map((a) => (
              <Link
                key={a._id}
                to={`${ROUTES.STUDENT}/assignments/${a._id}`}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{a.type}</Badge>
                  <Badge>{a.difficulty}</Badge>
                </div>
                <h3 className="font-semibold">{a.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{a.maxMarks} marks</span>
                  <Countdown dueAt={a.dueAt} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

function Panel({ title, items = [], showDue, empty }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-2 text-sm font-bold">{title}</h2>
      <ul className="space-y-2 text-sm">
        {(items || []).slice(0, 5).map((a) => (
          <li key={a._id}>
            <Link
              to={`${ROUTES.STUDENT}/assignments/${a._id}`}
              className="font-medium hover:text-primary"
            >
              {a.title}
            </Link>
            {showDue && a.dueAt && (
              <p className="text-xs text-muted-foreground">
                <Countdown dueAt={a.dueAt} />
              </p>
            )}
          </li>
        ))}
        {!items?.length && <li className="text-xs text-muted-foreground">{empty}</li>}
      </ul>
    </div>
  )
}

export function TeacherReviewsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignment-teacher-dash'],
    queryFn: () => assignmentService.teacherDashboard(),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-5 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Reviews' }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Reviews</h1>
            <p className="text-sm text-muted-foreground">
              Avg review time: {data?.averageReviewTimeHours ?? 0}h
            </p>
          </div>
          <Button asChild>
            <Link to={`${ROUTES.TEACHER}/assignments`}>All assignments</Link>
          </Button>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">To review</h2>
          <ul className="space-y-2">
            {(data?.assignmentsToReview || []).map((s) => (
              <li key={s._id}>
                <Link
                  to={`${ROUTES.TEACHER}/assignments/${s.assignment?._id || s.assignment}/submissions/${s._id}`}
                  className="flex justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/40"
                >
                  <span>
                    {s.student?.fullName} · {s.assignment?.title}
                  </span>
                  <Badge>{s.status}</Badge>
                </Link>
              </li>
            ))}
            {!data?.assignmentsToReview?.length && (
              <li className="text-sm text-muted-foreground">Queue is clear.</li>
            )}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
