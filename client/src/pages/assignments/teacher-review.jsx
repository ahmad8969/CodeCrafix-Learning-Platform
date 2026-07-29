import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { AssignmentTimeline } from '@/components/assignment/assignment-widgets'
import { MonacoEditorPane } from '@/components/workspace/monaco-editor-pane'
import { assignmentService } from '@/services/assignment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/assignments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/assignments`
  return `${ROUTES.ADMIN}/assignments`
}

export default function AssignmentSubmissionsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)

  const { data: assignment } = useQuery({
    queryKey: ['assignment', id],
    queryFn: () => assignmentService.get(id),
  })
  const { data, isLoading } = useQuery({
    queryKey: ['assignment-subs', id],
    queryFn: () => assignmentService.listSubmissions(id),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Assignments', to: base },
            { label: assignment?.title || 'Assignment', to: `${base}/${id}` },
            { label: 'Submissions' },
          ]}
        />
        <h1 className="text-2xl font-bold">Submissions</h1>
        <div className="space-y-2">
          {(data?.items || []).map((s) => (
            <Link
              key={s._id}
              to={`${base}/${id}/submissions/${s._id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40"
            >
              <div>
                <p className="font-medium">{s.student?.fullName || 'Student'}</p>
                <p className="text-xs text-muted-foreground">
                  Attempt {s.attemptNumber}
                  {s.isLate ? ' · late' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{s.status}</Badge>
                {s.marks != null && <span className="text-sm">{s.marks} pts</span>}
              </div>
            </Link>
          ))}
          {!data?.items?.length && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

export function TeacherReviewPage() {
  const { id, submissionId } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: () => assignmentService.getSubmission(submissionId),
  })

  const assignment = submission?.assignment
  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')
  const [rubricScores, setRubricScores] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!submission) return
    setMarks(submission.marks ?? '')
    setFeedback(submission.teacherFeedback || '')
    const rubrics = assignment?.rubrics || []
    setRubricScores(
      rubrics.map((r) => {
        const existing = (submission.rubricScores || []).find((x) => x.key === r.key)
        return {
          key: r.key,
          label: r.label,
          maxMarks: r.maxMarks,
          awarded: existing?.awarded ?? 0,
          comment: existing?.comment || '',
        }
      })
    )
  }, [submission, assignment])

  if (isLoading || !submission) return <PageLoader />

  const grade = async (status) => {
    setBusy(true)
    try {
      await assignmentService.grade(submissionId, {
        status,
        marks: marks === '' ? undefined : Number(marks),
        teacherFeedback: feedback,
        rubricScores,
      })
      notify.success('Review saved')
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['assignment-subs', id] })
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const codeFiles = submission.codeSnapshot || []

  return (
    <PageTransition>
      <div className="space-y-5 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Assignments', to: base },
            { label: 'Submissions', to: `${base}/${id}/submissions` },
            { label: 'Review' },
          ]}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Review submission</h1>
            <p className="text-sm text-muted-foreground">
              {submission.student?.fullName} · Attempt {submission.attemptNumber}
            </p>
          </div>
          <Badge>{submission.status}</Badge>
        </div>

        <AssignmentTimeline events={submission.timeline} status={submission.status} />

        {submission.files?.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">Files</h2>
            <ul className="space-y-1 text-sm">
              {submission.files.map((f) => (
                <li key={f.url} className="flex justify-between gap-2">
                  <a href={f.url} target="_blank" rel="noreferrer" className="text-primary">
                    {f.originalName}
                  </a>
                  <a href={f.url} download className="text-xs text-muted-foreground">
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {codeFiles.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-bold">Code snapshot</h2>
            <div className="space-y-3">
              {codeFiles.map((f) => (
                <div key={f.path}>
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">{f.path}</p>
                  <MonacoEditorPane
                    value={f.content || ''}
                    language={f.language || 'javascript'}
                    readOnly
                    className="h-40"
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Run code architecture-ready — browser preview available in student lab.
            </p>
          </section>
        )}

        {(submission.githubUrl || submission.externalUrl || submission.richText) && (
          <section className="rounded-2xl border border-border bg-card p-4 text-sm">
            {submission.githubUrl && (
              <p>
                GitHub:{' '}
                <a className="text-primary" href={submission.githubUrl} target="_blank" rel="noreferrer">
                  {submission.githubUrl}
                </a>
              </p>
            )}
            {submission.externalUrl && (
              <p>
                Link:{' '}
                <a className="text-primary" href={submission.externalUrl} target="_blank" rel="noreferrer">
                  {submission.externalUrl}
                </a>
              </p>
            )}
            {submission.richText && <p className="whitespace-pre-wrap">{submission.richText}</p>}
          </section>
        )}

        <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <h2 className="text-sm font-bold">Grade</h2>
          {rubricScores.length > 0 && (
            <div className="space-y-2">
              {rubricScores.map((r, idx) => (
                <div key={r.key} className="grid gap-1 sm:grid-cols-[1fr_100px]">
                  <Label>
                    {r.label} (/{r.maxMarks})
                  </Label>
                  <Input
                    type="number"
                    value={r.awarded}
                    onChange={(e) => {
                      const next = [...rubricScores]
                      next[idx] = { ...r, awarded: Number(e.target.value) }
                      setRubricScores(next)
                      setMarks(String(next.reduce((s, x) => s + (Number(x.awarded) || 0), 0)))
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Total marks</Label>
              <Input type="number" value={marks} onChange={(e) => setMarks(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Feedback</Label>
            <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => grade('approved')}>
              Approve
            </Button>
            <Button disabled={busy} variant="secondary" onClick={() => grade('needs_revision')}>
              Request revision
            </Button>
            <Button disabled={busy} variant="outline" onClick={() => grade('rejected')}>
              Reject
            </Button>
            <Button disabled={busy} variant="ghost" onClick={() => grade('under_review')}>
              Mark under review
            </Button>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
