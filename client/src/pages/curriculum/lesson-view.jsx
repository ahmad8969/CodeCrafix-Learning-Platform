import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { Skeleton } from '@/components/ui/skeleton'
import { PremiumLessonViewer } from '@/components/lesson/premium-lesson-viewer'
import { courseService } from '@/services/course.service'
import { curriculumService, lessonService } from '@/services/curriculum.service'
import { useCoursesBasePath } from '@/hooks/use-course-paths'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'

export default function LessonViewPage() {
  const params = useParams()
  const courseId = params.courseId || params.id
  const { lessonId } = params
  const basePath = useCoursesBasePath()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canEdit = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(user?.role)
  const isStudent = user?.role === ROLES.STUDENT

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.get(courseId),
    enabled: Boolean(courseId),
  })

  const { data: tree = [] } = useQuery({
    queryKey: ['curriculum-tree', courseId],
    queryFn: () => curriculumService.tree(courseId),
    enabled: Boolean(courseId),
  })

  const {
    data: experience,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['lesson-experience', lessonId],
    queryFn: () => lessonService.experience(lessonId),
    enabled: Boolean(lessonId),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 xl:grid-cols-[280px_1fr_300px]">
          <Skeleton className="hidden h-[70vh] xl:block" />
          <Skeleton className="h-[70vh]" />
          <Skeleton className="hidden h-[70vh] lg:block" />
        </div>
      </div>
    )
  }

  if (isError || !experience) return <PageLoader />

  const lessonPath = (l) =>
    isStudent
      ? `${ROUTES.STUDENT}/learn/${courseId}/lessons/${l._id}`
      : `${basePath}/${courseId}/curriculum/lessons/${l._id}`

  const breadcrumbItems = [
    {
      label: isStudent ? 'Learn' : 'Courses',
      href: isStudent ? `${ROUTES.STUDENT}/learn/${courseId}` : basePath,
    },
    {
      label: course?.title || 'Course',
      href: isStudent ? `${ROUTES.STUDENT}/learn/${courseId}` : `${basePath}/${courseId}`,
    },
    {
      label: experience.module?.name || 'Module',
      href: isStudent ? `${ROUTES.STUDENT}/learn/${courseId}` : `${basePath}/${courseId}/curriculum`,
    },
    { label: experience.lesson?.title || 'Lesson' },
  ]

  return (
    <PageTransition className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to={`${basePath}/${courseId}/curriculum/lessons/${lessonId}/edit`}>
              Edit lesson
            </Link>
          </Button>
        </div>
      )}
      <PremiumLessonViewer
        experience={experience}
        tree={tree}
        courseTitle={course?.title}
        breadcrumbItems={breadcrumbItems}
        lessonPath={lessonPath}
        moduleHref={
          isStudent ? `${ROUTES.STUDENT}/learn/${courseId}` : `${basePath}/${courseId}/curriculum`
        }
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['lesson-experience', lessonId] })}
      />
    </PageTransition>
  )
}
