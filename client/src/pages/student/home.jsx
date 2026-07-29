import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, Flame, History, PlayCircle } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { learningService } from '@/services/curriculum.service'
import { ROUTES } from '@/constants'

export default function StudentHomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['learning-dashboard'],
    queryFn: () => learningService.dashboard(),
  })

  const continueItem = data?.continueLearning
  const continueHref =
    continueItem?.lesson && continueItem?.course
      ? `${ROUTES.STUDENT}/learn/${continueItem.course._id || continueItem.course}/lessons/${continueItem.lesson._id || continueItem.lesson}`
      : `${ROUTES.STUDENT}/courses`

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Student overview</p>
          <h1 className="text-2xl font-extrabold">Keep learning</h1>
          <p className="text-muted-foreground">
            Continue where you left off, revisit bookmarks, and track your streak.
          </p>
        </div>
        <Button asChild>
          <Link to={continueHref}>
            <PlayCircle className="size-4" /> Continue learning
          </Link>
        </Button>
      </div>

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
          icon={PlayCircle}
          label="Continue"
          value={continueItem?.lesson?.title ? 'Ready' : 'Browse'}
        />
        <StatCard
          icon={Flame}
          label="Learning streak"
          value={isLoading ? null : `${data?.learningStreakPlaceholder || 0} days`}
          hint="Placeholder"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
