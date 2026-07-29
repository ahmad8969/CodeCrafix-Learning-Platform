import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, FileEdit, FolderTree, Layers3, TrendingUp, CheckCircle2, Library } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { courseService } from '@/services/course.service'
import { useCoursesBasePath, useCategoriesBasePath, useBatchesBasePath } from '@/hooks/use-course-paths'

const STAT_CARDS = [
  { key: 'totalCourses', label: 'Total courses', icon: BookOpen },
  { key: 'publishedCourses', label: 'Published', icon: CheckCircle2 },
  { key: 'draftCourses', label: 'Drafts', icon: FileEdit },
  { key: 'categories', label: 'Categories', icon: FolderTree },
  { key: 'activeBatches', label: 'Active batches', icon: Layers3 },
]

const CURRICULUM_PLACEHOLDERS = [
  { label: 'Total modules', hint: 'Per-course in curriculum builder' },
  { label: 'Total lessons', hint: 'Open a course → Curriculum' },
  { label: 'Published lessons', hint: 'Tracked per course' },
  { label: 'Draft lessons', hint: 'Tracked per course' },
  { label: 'Resources', hint: 'Attached to lessons' },
  { label: 'Est. course duration', hint: 'Sum of week hours' },
]

export function CourseDashboardOverview({ roleLabel = 'Admin' }) {
  const coursesPath = useCoursesBasePath()
  const categoriesPath = useCategoriesBasePath()
  const batchesPath = useBatchesBasePath()

  const { data, isLoading } = useQuery({
    queryKey: ['course-stats'],
    queryFn: () => courseService.stats(),
  })

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{roleLabel} overview</p>
          <h1 className="text-2xl font-extrabold">Course management</h1>
          <p className="text-muted-foreground">
            Course inventory, batches, and curriculum builder entry points.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={categoriesPath}>Categories</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={batchesPath}>Batches</Link>
          </Button>
          <Button asChild>
            <Link to={`${coursesPath}/new`}>Create course</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key} hover>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-extrabold tracking-tight">{data?.[key] ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <Library className="size-4 text-primary" />
            Curriculum placeholders
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CURRICULUM_PLACEHOLDERS.map((item) => (
            <div key={item.label} className="rounded-xl border border-border px-3 py-3">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="inline-flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Trending courses
          </CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link to={coursesPath}>View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          {!isLoading &&
            (data?.trendingCourses || []).map((course) => (
              <Link
                key={course._id}
                to={`${coursesPath}/${course._id}/curriculum`}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2 transition-colors hover:bg-muted/40"
              >
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {course.category?.name || 'Uncategorized'} · Open curriculum
                  </p>
                </div>
                <Badge className="capitalize">{course.status}</Badge>
              </Link>
            ))}
          {!isLoading && (data?.trendingCourses || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No trending courses yet.</p>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
