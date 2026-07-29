import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Code2, Play } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { PracticeQuestionSolver } from '@/components/practice/practice-solver'
import { practiceService } from '@/services/practice.service'
import { ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function StudentPracticeHomePage() {
  const { data: dash, isLoading } = useQuery({
    queryKey: ['practice-dashboard'],
    queryFn: () => practiceService.dashboard(),
  })
  const { data: list } = useQuery({
    queryKey: ['practice-questions-student'],
    queryFn: () => practiceService.list({ status: 'published', limit: 20 }),
  })

  if (isLoading) return <PageLoader />

  const continueId =
    dash?.continuePractice?.question?._id || dash?.continuePractice?.question || null

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Practice' }]} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Practice</h1>
          <p className="text-sm text-muted-foreground">
            Solve coding challenges and MCQs with instant evaluation.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Attempted</p>
            <p className="text-2xl font-bold">{dash?.totalAttempted || 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{dash?.completed || 0}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Bookmarked</p>
            <p className="text-2xl font-bold">{dash?.bookmarkedCount || 0}</p>
          </div>
        </div>

        {continueId && (
          <Button asChild>
            <Link to={`${ROUTES.STUDENT}/practice/questions/${continueId}`}>
              <Play className="size-4" /> Continue practice
            </Link>
          </Button>
        )}

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Available questions
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {(list?.items || []).map((q) => (
              <Link
                key={q._id}
                to={`${ROUTES.STUDENT}/practice/questions/${q._id}`}
                className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Code2 className="size-4 text-primary" />
                  <Badge variant="secondary">{q.type}</Badge>
                  <Badge>{q.difficulty}</Badge>
                </div>
                <h3 className="font-semibold">{q.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {q.category} · +{q.xpReward} XP
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export function StudentQuestionPage() {
  const { questionId } = useParams()
  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Practice', to: `${ROUTES.STUDENT}/practice` },
            { label: 'Question' },
          ]}
        />
        <PracticeQuestionSolver questionId={questionId} />
      </div>
    </PageTransition>
  )
}
