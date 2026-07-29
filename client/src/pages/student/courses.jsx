import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/loaders'
import { courseService } from '@/services/course.service'
import { ROUTES } from '@/constants'

export default function StudentCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['student-courses'],
    queryFn: () => courseService.list({ limit: 50, status: 'published' }),
  })

  if (isLoading) return <PageLoader />

  const courses = data?.items || []

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Courses</h1>
        <p className="text-muted-foreground">
          Browse published courses and open the curriculum viewer.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Card key={course._id} hover>
            <CardHeader>
              <CardTitle className="text-base">
                <Link
                  to={`${ROUTES.STUDENT}/learn/${course._id}`}
                  className="hover:text-primary"
                >
                  {course.title}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{course.shortDescription}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{course.category?.name}</Badge>
                <Badge className="capitalize">{course.difficulty}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {courses.length === 0 && (
        <p className="text-sm text-muted-foreground">No published courses available yet.</p>
      )}
    </PageTransition>
  )
}
