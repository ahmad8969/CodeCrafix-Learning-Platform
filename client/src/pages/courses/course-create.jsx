import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { CourseMultiStepForm } from '@/components/forms/course-multi-step-form'
import { PageLoader } from '@/components/loaders'
import { categoryService, courseService, usersService } from '@/services/course.service'
import { useCoursesBasePath } from '@/hooks/use-course-paths'
import { notify, getErrorMessage } from '@/utils/error'
import { useState } from 'react'

export default function CourseCreatePage() {
  const basePath = useCoursesBasePath()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitting, setSubmitting] = useState(false)
  const [draftId, setDraftId] = useState(null)

  const { data: categoriesData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories', 'form'],
    queryFn: () => categoryService.list({ limit: 100, status: 'active' }),
  })
  const { data: instructors, isLoading: loadingInstructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => usersService.instructors(),
  })

  if (loadingCats || loadingInstructors) return <PageLoader />

  const save = async (payload, { navigateAfter = true } = {}) => {
    setSubmitting(true)
    try {
      let course
      if (draftId) {
        course = await courseService.update(draftId, { ...payload, status: payload.status || 'draft' })
        notify.success('Draft updated')
      } else {
        course = await courseService.create({ ...payload, status: payload.status || 'draft' })
        setDraftId(course._id)
        notify.success('Course created')
      }
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      if (navigateAfter) navigate(`${basePath}/${course._id}`)
      return course
    } catch (e) {
      notify.error(getErrorMessage(e))
      return null
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
            { label: 'Create' },
          ]}
        />
        <h1 className="mt-2 text-2xl font-extrabold">Create course</h1>
        <p className="text-muted-foreground">Multi-step wizard with auto-save draft support.</p>
      </div>
      <CourseMultiStepForm
        categories={categoriesData?.items || []}
        instructors={instructors || []}
        submitting={submitting}
        onSubmit={(payload) => save(payload, { navigateAfter: true })}
        onAutoSave={(payload) => save({ ...payload, status: 'draft' }, { navigateAfter: false })}
      />
    </PageTransition>
  )
}
