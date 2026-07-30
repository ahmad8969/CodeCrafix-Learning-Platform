import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, Code2, Flame, History, PlayCircle, Timer } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { learningService, workspaceService } from '@/services/curriculum.service'
import { assignmentService } from '@/services/assignment.service'
import { quizService } from '@/services/quiz.service'
import { gamificationService } from '@/services/certificate.service'
import { GamificationSummaryStrip } from '@/components/certificates/certificate-widgets'
import { ROUTES } from '@/constants'

function formatMinutes(seconds = 0) {
  return `${Math.max(0, Math.round(Number(seconds) / 60))} min`
}

export default function StudentHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['learning-dashboard'],
    queryFn: () => learningService.dashboard(),
  })
  const { data: coding, isLoading: codingLoading } = useQuery({
    queryKey: ['workspace-dashboard'],
    queryFn: () => workspaceService.dashboard(),
  })
  const { data: assignments } = useQuery({
    queryKey: ['assignment-student-dash'],
    queryFn: () => assignmentService.studentDashboard(),
  })
  const { data: quizzes } = useQuery({
    queryKey: ['quiz-student-dash'],
    queryFn: () => quizService.studentDashboard(),
  })
  const { data: gamification } = useQuery({
    queryKey: ['gamification-me'],
    queryFn: () => gamificationService.me(),
  })

  const continueItem = data?.continueLearning
  const continueHref =
    continueItem?.lesson && continueItem?.course
      ? `${ROUTES.STUDENT}/learn/${continueItem.course._id || continueItem.course}/lessons/${continueItem.lesson._id || continueItem.lesson}`
      : `${ROUTES.STUDENT}/courses`

  const codingContinue = coding?.continueCoding
  const codingHref =
    codingContinue?.lesson && codingContinue?.course
      ? `${ROUTES.STUDENT}/learn/${codingContinue.course._id || codingContinue.course}/lessons/${codingContinue.lesson._id || codingContinue.lesson}`
      : continueHref

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Student overview</p>
          <h1 className="text-2xl font-extrabold">Continue where you left off</h1>
          <p className="text-muted-foreground">
            Jump back into your next unfinished lesson across enrolled courses.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={codingHref}>
              <Code2 className="size-4" /> Continue coding
            </Link>
          </Button>
          <Button asChild>
            <Link to={continueHref}>
              <PlayCircle className="size-4" /> Continue learning
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/assignments`}>Assignments</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/quizzes`}>Quizzes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/fees`}>My fees</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/messages`}>Messages</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/helpdesk`}>Helpdesk</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`${ROUTES.STUDENT}/career`}>Career</Link>
          </Button>
        </div>
      </div>

      {gamification && (
        <GamificationSummaryStrip
          summary={gamification}
          portfolioHref={`${ROUTES.STUDENT}/portfolio`}
        />
      )}

      {(quizzes?.availableQuizzes || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available quizzes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {quizzes.availableQuizzes.slice(0, 3).map((q) => (
              <Link
                key={q._id}
                to={`${ROUTES.STUDENT}/quizzes/${q._id}`}
                className="flex justify-between gap-2 hover:text-primary"
              >
                <span>{q.title}</span>
                <span className="text-xs text-muted-foreground">{q.timeLimitMinutes} min</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {(assignments?.upcomingDeadlines || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming assignment deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {assignments.upcomingDeadlines.slice(0, 3).map((a) => (
              <Link
                key={a._id}
                to={`${ROUTES.STUDENT}/assignments/${a._id}`}
                className="flex justify-between gap-2 hover:text-primary"
              >
                <span>{a.title}</span>
                <span className="text-xs text-muted-foreground">
                  {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : ''}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={History}
          label="Recently viewed"
          value={isLoading ? null : data?.recentlyViewed?.length || 0}
        />
        <StatCard
          icon={Bookmark}
          label="Bookmarks"
          value={isLoading ? null : data?.bookmarksCount || 0}
        />
        <StatCard
          icon={Timer}
          label="Coding time"
          value={codingLoading ? null : formatMinutes(coding?.codingTimeSeconds)}
        />
        <StatCard
          icon={Flame}
          label="Learning streak"
          value={isLoading ? null : `${data?.learningStreakPlaceholder || 0} days`}
          hint="Placeholder"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently viewed lessons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            {!isLoading &&
              (data?.recentlyViewed || []).map((item) => {
                const lesson = item.lesson
                const course = item.course
                if (!lesson) return null
                return (
                  <Link
                    key={item._id}
                    to={`${ROUTES.STUDENT}/learn/${course?._id || item.course}/lessons/${lesson._id}`}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{course?.title}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {item.scrollPercent || 0}%
                    </span>
                  </Link>
                )
              })}
            {!isLoading && (data?.recentlyViewed || []).length === 0 && (
              <p className="text-sm text-muted-foreground">
                Open a lesson to start building your history.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Continue learning</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to={`${ROUTES.STUDENT}/courses`}>All courses</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {continueItem?.lesson ? (
              <div className="rounded-xl border border-border p-4">
                <p className="font-semibold">{continueItem.lesson.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {continueItem.course?.title} · {continueItem.scrollPercent || 0}% complete
                </p>
                <Button asChild className="mt-3" size="sm">
                  <Link to={continueHref}>Resume lesson</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No in-progress lesson yet. Browse published courses to begin.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Code2 className="size-4 text-primary" /> Coding lab
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Saved projects</p>
                <p className="text-lg font-bold">
                  {codingLoading ? '—' : coding?.savedProjects || 0}
                </p>
              </div>
              <div className="rounded-xl border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Last session</p>
                <p className="truncate text-sm font-semibold">
                  {coding?.lastCodingSession?.lesson?.title || 'None yet'}
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link to={codingHref}>Continue coding</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Card hover>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        {value == null ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-extrabold tracking-tight">{value}</p>
        )}
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
