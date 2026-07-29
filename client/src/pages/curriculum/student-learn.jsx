import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { PageLoader } from '@/components/loaders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { curriculumService } from '@/services/curriculum.service'
import { ROUTES } from '@/constants'

export default function StudentLearnPage() {
  const { courseId } = useParams()

  const { data: tree = [], isLoading } = useQuery({
    queryKey: ['curriculum-tree', courseId],
    queryFn: () => curriculumService.tree(courseId),
  })
  const { data: stats } = useQuery({
    queryKey: ['curriculum-stats', courseId],
    queryFn: () => curriculumService.stats(courseId),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Student', href: ROUTES.STUDENT },
            { label: 'Learn' },
          ]}
        />
        <h1 className="mt-2 text-2xl font-extrabold">Course curriculum</h1>
        <p className="text-muted-foreground">
          Published modules and previewable lessons. Enrollment arrives later.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Modules</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{stats?.totalModules ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Published lessons</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">{stats?.publishedLessons ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Est. hours</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-extrabold">
            {stats?.estimatedCourseDuration ?? 0}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {tree.map((mod) => (
          <Card key={mod._id}>
            <CardHeader>
              <CardTitle className="text-base">{mod.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(mod.weeks || []).map((week) => (
                <div key={week._id}>
                  <p className="mb-2 text-sm font-semibold text-muted-foreground">{week.name}</p>
                  {(week.topics || []).map((topic) => (
                    <div key={topic._id} className="mb-3 ml-2">
                      <p className="text-sm font-medium">{topic.name}</p>
                      <ul className="mt-1 space-y-1">
                        {(topic.lessons || []).map((lesson) => (
                          <li key={lesson._id}>
                            <Link
                              to={`${ROUTES.STUDENT}/learn/${courseId}/lessons/${lesson._id}`}
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              {lesson.title}
                              <Badge variant="outline" className="capitalize">
                                {lesson.status}
                              </Badge>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {tree.length === 0 && (
          <p className="text-sm text-muted-foreground">No published curriculum yet.</p>
        )}
      </div>
    </PageTransition>
  )
}
