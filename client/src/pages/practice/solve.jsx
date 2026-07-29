import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { PracticeQuestionSolver } from '@/components/practice/practice-solver'
import { practiceService } from '@/services/practice.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

export default function PracticeSolvePage() {
  const { questionId, topicId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: topicQuestions } = useQuery({
    queryKey: ['practice-topic', topicId],
    queryFn: () => practiceService.byTopic(topicId),
    enabled: Boolean(topicId),
  })

  const items = topicQuestions?.items || []
  const idx = items.findIndex((q) => q._id === questionId)
  const next = idx >= 0 ? items[idx + 1] : null

  const studentBase = `${ROUTES.STUDENT}/practice`

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Practice', to: studentBase },
            { label: 'Solve' },
          ]}
        />
        <PracticeQuestionSolver
          questionId={questionId}
          onNext={
            next
              ? () => navigate(`${studentBase}/topics/${topicId}/questions/${next._id}`)
              : undefined
          }
        />
        {user?.role !== ROLES.STUDENT && (
          <Button variant="outline" asChild>
            <Link to={`${ROUTES.ADMIN}/practice`}>Back to bank</Link>
          </Button>
        )}
      </div>
    </PageTransition>
  )
}

export function PracticePreviewPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const base =
    user?.role === ROLES.TEACHER
      ? `${ROUTES.TEACHER}/practice`
      : user?.role === ROLES.SUPER_ADMIN
        ? `${ROUTES.SUPER_ADMIN}/practice`
        : `${ROUTES.ADMIN}/practice`

  if (!id) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Practice', to: base }, { label: 'Preview' }]} />
        <PracticeQuestionSolver questionId={id} />
        <Button variant="outline" asChild>
          <Link to={`${base}/${id}/edit`}>Edit</Link>
        </Button>
      </div>
    </PageTransition>
  )
}
