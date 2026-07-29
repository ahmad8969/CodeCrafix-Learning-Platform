import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  BatchCard,
  ScheduleCalendar,
  StudentCard,
  ProgressRing,
  exportRowsCsv,
} from '@/components/enrollment/enrollment-widgets'
import { batchService } from '@/services/course.service'
import { enrollmentService } from '@/services/enrollment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function batchesBase(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/batches`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/batches`
  return `${ROUTES.ADMIN}/batches`
}

export default function BatchDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = batchesBase(user?.role)
  const queryClient = useQueryClient()

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch', id],
    queryFn: () => batchService.get(id),
  })
  const { data: roster } = useQuery({
    queryKey: ['batch-students', id],
    queryFn: () => batchService.students(id),
  })
  const { data: analytics } = useQuery({
    queryKey: ['batch-analytics', id],
    queryFn: () => batchService.analytics(id),
  })
  const { data: calendar } = useQuery({
    queryKey: ['batch-calendar', id],
    queryFn: () => batchService.calendar(id),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Batches', to: base }, { label: batch?.name || 'Batch' }]} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{batch?.name}</h1>
            <p className="text-sm text-muted-foreground">
              Code {batch?.batchCode} · Enroll code {batch?.enrollmentCode || '—'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportRowsCsv(analytics?.students || [], `${batch?.batchCode}-report.csv`, [
                  { label: 'Student', get: (r) => r.student?.fullName },
                  { label: 'Email', get: (r) => r.student?.email },
                  { label: 'Progress', key: 'overallProgress' },
                  { label: 'Lessons', key: 'lessonsCompleted' },
                  { label: 'Quizzes passed', key: 'quizzesPassed' },
                ])
              }
            >
              Export Excel/CSV
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const cloned = await batchService.clone(id)
                  notify.success('Batch cloned')
                  window.location.href = `${base}/${cloned._id}`
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Clone
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await batchService.archive(id)
                  notify.success('Archived')
                  queryClient.invalidateQueries({ queryKey: ['batch', id] })
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Archive
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <BatchCard batch={batch || {}} />
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="mb-2 text-xs text-muted-foreground">Avg progress</p>
            <ProgressRing value={analytics?.totals?.averageProgress || 0} size={80} />
            <p className="mt-2 text-xs text-muted-foreground">
              {analytics?.totals?.weakCount || 0} weak students
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Weekly schedule</h2>
          <ScheduleCalendar events={calendar?.events || []} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase text-muted-foreground">Students</h2>
            {(analytics?.weakStudents || []).length > 0 && (
              <span className="text-xs text-amber-600">Weak performers highlighted below</span>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(roster?.items || []).map((e) => {
              const prog =
                analytics?.students?.find((s) => String(s.student?._id) === String(e.student?._id))
                  ?.overallProgress ?? e.overallProgress
              const weak = prog < 40
              return (
                <div key={e._id} className={weak ? 'rounded-2xl ring-1 ring-amber-500/50' : ''}>
                  <StudentCard
                    student={e.student}
                    progress={prog}
                    actions={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const topics = await enrollmentService.learningPath(
                              batch.course?._id || batch.course,
                              { studentId: e.student._id }
                            )
                            const locked = (topics.path || []).find((p) => !p.unlocked)
                            if (!locked) {
                              notify.success('No locked topics')
                              return
                            }
                            await enrollmentService.unlockTopic({
                              studentId: e.student._id,
                              topicId: locked.topic._id,
                              courseId: batch.course?._id || batch.course,
                            })
                            notify.success('Next topic unlocked')
                          } catch (err) {
                            notify.error(getErrorMessage(err))
                          }
                        }}
                      >
                        Unlock topic
                      </Button>
                    }
                  />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
