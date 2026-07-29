import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/loaders'
import { courseService, batchService } from '@/services/course.service'
import { useCoursesBasePath, useBatchesBasePath } from '@/hooks/use-course-paths'
import { useAuth } from '@/contexts/auth-context'
import { ROLES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'

export default function CourseDetailsPage() {
  const { id } = useParams()
  const basePath = useCoursesBasePath()
  const batchesPath = useBatchesBasePath()
  const { user } = useAuth()
  const readOnly = user?.role === ROLES.TEACHER
  const queryClient = useQueryClient()

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.get(id),
  })
  const { data: batchesData } = useQuery({
    queryKey: ['batches', id],
    queryFn: () => batchService.list({ course: id, limit: 50 }),
  })

  if (isLoading || !course) return <PageLoader />

  const action = async (fn, message) => {
    try {
      await fn()
      notify.success(message)
      queryClient.invalidateQueries({ queryKey: ['course', id] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Courses', href: basePath },
              { label: course.title },
            ]}
          />
          <h1 className="mt-2 text-2xl font-extrabold">{course.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="capitalize">{course.status}</Badge>
            <Badge variant="outline">{course.category?.name}</Badge>
            <Badge variant="secondary" className="capitalize">
              {course.difficulty}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`${basePath}/${id}/curriculum`}>Curriculum</Link>
          </Button>
          {!readOnly && (
            <>
              <Button asChild variant="outline">
                <Link to={`${basePath}/${id}/edit`}>Edit</Link>
              </Button>
              <Button variant="outline" onClick={() => action(() => courseService.publish(id), 'Published')}>
                Publish
              </Button>
              <Button variant="outline" onClick={() => action(() => courseService.archive(id), 'Archived')}>
                Archive
              </Button>
              <Button asChild>
                <Link to={`${batchesPath}?course=${id}`}>Manage batches</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="text-foreground">{course.shortDescription}</p>
            <p className="whitespace-pre-wrap">{course.fullDescription}</p>
            <div>
              <p className="mb-1 font-semibold text-foreground">Learning outcomes</p>
              <ul className="list-disc space-y-1 pl-5">
                {(course.learningOutcomes || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Instructor: {course.instructor?.fullName}</p>
            <p>Duration: {course.duration}</p>
            <p>Hours: {course.estimatedHours}</p>
            <p>
              Price: {course.currency} {course.discountPrice ?? course.price}
            </p>
            <p>Batches: {course.batchCount || batchesData?.items?.length || 0}</p>
            <p>Students (placeholder): {course.studentCountPlaceholder || 0}</p>
            {course.publishedAt && <p>Published: {new Date(course.publishedAt).toLocaleString()}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(batchesData?.items || []).map((batch) => (
            <div key={batch._id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{batch.name}</p>
                <p className="text-xs text-muted-foreground">
                  {batch.batchCode} · {batch.classTime} · {batch.status}
                </p>
              </div>
              <Badge variant="outline">{batch.teacher?.fullName}</Badge>
            </div>
          ))}
          {(batchesData?.items || []).length === 0 && (
            <p className="text-sm text-muted-foreground">No batches yet.</p>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
