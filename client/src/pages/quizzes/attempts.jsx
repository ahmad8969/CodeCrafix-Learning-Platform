import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable } from '@/components/tables/data-table'
import { LeaderboardCard, exportAttemptsCsv } from '@/components/quiz/quiz-widgets'
import { quizService } from '@/services/quiz.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'
import { useMemo } from 'react'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/quizzes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/quizzes`
  return `${ROUTES.ADMIN}/quizzes`
}

export default function QuizAttemptsPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.get(id),
  })
  const { data: attempts } = useQuery({
    queryKey: ['quiz-attempts', id],
    queryFn: () => quizService.listAttempts(id),
  })
  const { data: board } = useQuery({
    queryKey: ['quiz-leaderboard', id],
    queryFn: () => quizService.leaderboard(id),
  })

  const rows = attempts?.items || []

  const columns = useMemo(
    () => [
      {
        key: 'student',
        label: 'Student',
        render: (row) => row.student?.fullName || '—',
      },
      { key: 'attemptNumber', label: '#' },
      { key: 'marks', label: 'Marks' },
      { key: 'percentage', label: '%' },
      {
        key: 'passed',
        label: 'Result',
        render: (row) => (
          <Badge variant={row.passed ? 'default' : 'secondary'}>{row.passed ? 'Pass' : 'Fail'}</Badge>
        ),
      },
      {
        key: 'timeTakenSeconds',
        label: 'Time',
        render: (row) => `${Math.round((row.timeTakenSeconds || 0) / 60)}m`,
      },
      { key: 'status', label: 'Status' },
      {
        key: 'submittedAt',
        label: 'Submitted',
        render: (row) => (row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'),
      },
    ],
    []
  )

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Quizzes', to: base },
            { label: quiz?.title || 'Quiz', to: `${base}/${id}` },
            { label: 'Results' },
          ]}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{quiz?.title}</h1>
            <p className="text-sm text-muted-foreground">
              Status: {quiz?.status} · Avg {quiz?.averageScore || 0}% · {quiz?.attemptCount || 0} attempts
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => exportAttemptsCsv(rows, `${quiz?.slug || 'quiz'}-results.csv`)}
            >
              <Download className="size-4" /> Export CSV
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${base}/${id}/edit`}>Edit</Link>
            </Button>
            {quiz?.status !== 'published' && (
              <Button
                onClick={async () => {
                  try {
                    await quizService.publish(id)
                    notify.success('Published')
                    queryClient.invalidateQueries({ queryKey: ['quiz', id] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Publish
              </Button>
            )}
            {quiz?.status === 'published' && (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await quizService.archive(id)
                    notify.success('Archived')
                    queryClient.invalidateQueries({ queryKey: ['quiz', id] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Archive
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <DataTable columns={columns} rows={rows} page={1} total={rows.length} limit={50} />
          <LeaderboardCard entries={board?.entries || []} />
        </div>
      </div>
    </PageTransition>
  )
}

/** Staff quiz preview / detail hub. */
export function QuizDetailHubPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base = basePath(user?.role)
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: () => quizService.get(id),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Quizzes', to: base }, { label: quiz?.title || 'Quiz' }]} />
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex gap-2">
            <Badge>{quiz?.status}</Badge>
            <Badge variant="secondary">{quiz?.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{quiz?.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{quiz?.description}</p>
          <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
            <li>{quiz?.totalQuestions} questions · {quiz?.totalMarks} marks</li>
            <li>{quiz?.timeLimitMinutes} min · pass {quiz?.passingPercentage}%</li>
            <li>Items: {quiz?.items?.length || 0}</li>
            <li>Pool rules: {quiz?.poolRules?.length || 0}</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`${base}/${id}/edit`}>Edit</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${base}/${id}/attempts`}>Results & analytics</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={base}>Back</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
