import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { LessonContent } from '@/components/lesson/lesson-content'
import {
  AssignmentTimeline,
  Countdown,
  SubmissionForm,
} from '@/components/assignment/assignment-widgets'
import { assignmentService } from '@/services/assignment.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function StudentAssignmentDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => assignmentService.get(id),
    enabled: Boolean(id),
  })

  const { data: history } = useQuery({
    queryKey: ['assignment-history', id],
    queryFn: () => assignmentService.history(id),
    enabled: Boolean(id),
  })

  if (isLoading || !assignment) return <PageLoader />

  const latest = history?.items?.[0]
  const canSubmit =
    !latest ||
    ['draft', 'needs_revision'].includes(latest.status) ||
    (assignment.allowResubmission && latest.status === 'needs_revision')
  const attemptsUsed = (history?.items || []).filter((s) => s.status !== 'draft').length

  return (
    <PageTransition>
      <div className="space-y-5 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Assignments', to: `${ROUTES.STUDENT}/assignments` },
            { label: assignment.title },
          ]}
        />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{assignment.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{assignment.type}</Badge>
              <Badge>{assignment.difficulty}</Badge>
              <Badge variant="outline">{assignment.maxMarks} marks</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Due</p>
            <Countdown dueAt={assignment.dueAt} />
            <p className="mt-1 text-xs text-muted-foreground">
              Attempts {attemptsUsed}
              {assignment.maxAttempts ? ` / ${assignment.maxAttempts}` : ''}
            </p>
          </div>
        </div>

        <AssignmentTimeline events={latest?.timeline} status={latest?.status || 'started'} />

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-sm font-bold">Description</h2>
          <LessonContent content={assignment.description || ''} />
          {assignment.instructions && (
            <>
              <h2 className="mb-2 mt-6 text-sm font-bold">Instructions</h2>
              <LessonContent content={assignment.instructions} />
            </>
          )}
          {assignment.attachments?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-bold">Attachments</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {assignment.attachments.map((a) => (
                  <li key={a.url}>
                    <a href={a.url} className="text-primary" target="_blank" rel="noreferrer">
                      {a.title || a.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {latest?.teacherFeedback && (
          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h2 className="text-sm font-bold">Teacher feedback</h2>
            <p className="mt-2 text-sm text-muted-foreground">{latest.teacherFeedback}</p>
            {latest.marks != null && (
              <p className="mt-2 text-sm font-semibold">
                Marks: {latest.marks}/{assignment.maxMarks} ({latest.percentage}%)
              </p>
            )}
            {latest.rubricScores?.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {latest.rubricScores.map((r) => (
                  <li key={r.key} className="flex justify-between gap-2 border-b border-border/40 py-1">
                    <span>{r.label}</span>
                    <span>
                      {r.awarded}/{r.maxMarks}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {canSubmit && (
          <SubmissionForm
            assignment={assignment}
            mode={latest?.status === 'needs_revision' ? 'resubmit' : 'submit'}
            onDone={() => {
              queryClient.invalidateQueries({ queryKey: ['assignment-history', id] })
            }}
          />
        )}

        {history?.items?.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">Submission history</h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {history.items.map((s) => (
                <li key={s._id} className="flex justify-between gap-2 border-b border-border/50 py-2">
                  <span className="capitalize">
                    Attempt {s.attemptNumber} · {s.status}
                    {s.isLate ? ' · late' : ''}
                  </span>
                  <span>
                    {s.marks != null ? `${s.marks} pts · ` : ''}
                    {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Button variant="outline" asChild>
          <Link to={`${ROUTES.STUDENT}/assignments`}>Back</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
