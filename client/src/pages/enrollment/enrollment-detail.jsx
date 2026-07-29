import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CourseProgressCard,
  LearningPathCard,
  ProgressTimeline,
  StatusBadge,
} from '@/components/enrollment/enrollment-widgets'
import { enrollmentService } from '@/services/enrollment.service'
import { batchService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/enrollments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/enrollments`
  return `${ROUTES.ADMIN}/enrollments`
}

export default function EnrollmentDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()
  const [toBatch, setToBatch] = useState('')

  const { data: enrollment, isLoading } = useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => enrollmentService.get(id),
  })

  const courseId = enrollment?.course?._id || enrollment?.course
  const studentId = enrollment?.student?._id || enrollment?.student

  const { data: report } = useQuery({
    queryKey: ['enrollment-progress', studentId, courseId],
    queryFn: () => enrollmentService.progressReport(studentId, courseId),
    enabled: Boolean(studentId && courseId),
  })

  const { data: batches } = useQuery({
    queryKey: ['batches-for-transfer', courseId],
    queryFn: () => batchService.list({ course: courseId, limit: 50 }),
    enabled: Boolean(courseId),
  })

  if (isLoading) return <PageLoader />
  if (!enrollment) return <p className="p-6">Not found</p>

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Enrollments', to: base },
            { label: enrollment.student?.fullName || 'Enrollment' },
          ]}
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex gap-2">
              <StatusBadge status={enrollment.status} />
              <StatusBadge status={enrollment.source} />
            </div>
            <h1 className="text-2xl font-bold">{enrollment.student?.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {enrollment.course?.title} · {enrollment.batch?.name || 'No batch'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {enrollment.status === 'pending' && (
              <Button
                onClick={async () => {
                  try {
                    await enrollmentService.approve(id)
                    notify.success('Approved')
                    queryClient.invalidateQueries({ queryKey: ['enrollment', id] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Approve
              </Button>
            )}
            {enrollment.status === 'active' && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await enrollmentService.withdraw(id)
                    notify.success('Withdrawn')
                    queryClient.invalidateQueries({ queryKey: ['enrollment', id] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Withdraw
              </Button>
            )}
          </div>
        </div>

        <CourseProgressCard
          title="Overall progress"
          progress={report?.progress?.overallCompletion ?? enrollment.overallProgress}
          meta={`${report?.progress?.lessonsCompleted || 0}/${report?.progress?.lessonsTotal || 0} lessons · streak ${report?.progress?.learningStreak || 0}`}
        />

        {enrollment.status === 'active' && (
          <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-[200px] flex-1 space-y-1">
              <p className="text-sm font-medium">Transfer batch</p>
              <Select value={toBatch || undefined} onValueChange={setToBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Target batch" />
                </SelectTrigger>
                <SelectContent>
                  {(batches?.items || [])
                    .filter((b) => String(b._id) !== String(enrollment.batch?._id))
                    .map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name} ({b.batchCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={!toBatch}
              onClick={async () => {
                try {
                  await enrollmentService.transferBatch(id, toBatch)
                  notify.success('Transferred')
                  queryClient.invalidateQueries({ queryKey: ['enrollment', id] })
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Transfer
            </Button>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Learning path</h2>
            <LearningPathCard items={report?.learningPath?.path || []} />
          </section>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-bold">Progress timeline</h2>
            <ProgressTimeline items={report?.timeline?.items || []} />
          </section>
        </div>

        <Button variant="outline" asChild>
          <Link to={base}>Back</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
