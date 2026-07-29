import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { CourseMultiStepForm } from '@/components/forms/course-multi-step-form'
import { PageLoader } from '@/components/loaders'
import { categoryService, courseService, usersService } from '@/services/course.service'
import { useCoursesBasePath } from '@/hooks/use-course-paths'
import { notify, getErrorMessage } from '@/utils/error'
import { useState } from 'react'

export default function CourseEditPage() {
  const { id } = useParams()
  const basePath = useCoursesBasePath()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseService.get(id),
  })
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'form'],
    queryFn: () => categoryService.list({ limit: 100, status: 'active' }),
  })
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => usersService.instructors(),
  })

  if (isLoading || !course) return <PageLoader />

  const save = async (payload, { navigateAfter = true } = {}) => {
    setSubmitting(true)
    try {
      const updated = await courseService.update(id, payload)
      notify.success('Course saved')
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['course', id] })
      if (navigateAfter) navigate(`${basePath}/${updated._id}`)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <Breadcrumb
          items={[
            { label: 'Courses', href: basePath },
            { label: course.title, href: `${basePath}/${id}` },
            { label: 'Edit' },
          ]}
        />
        <h1 className="mt-2 text-2xl font-extrabold">Edit course</h1>
      </div>
      <CourseMultiStepForm
        initialData={course}
        categories={categoriesData?.items || []}
        instructors={instructors || []}
        submitting={submitting}
        onSubmit={(payload) => save(payload)}
        onAutoSave={(payload) => save(payload, { navigateAfter: false })}
      />
    </PageTransition>
  )
}
