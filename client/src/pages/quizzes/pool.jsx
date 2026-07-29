import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { quizService } from '@/services/quiz.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/quizzes`
  return `${ROUTES.ADMIN}/quizzes`
}

export default function QuizPoolPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const [type, setType] = useState('all')
  const [difficulty, setDifficulty] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-pool-admin', type, difficulty],
    queryFn: () =>
      quizService.pool({
        type: type === 'all' ? undefined : type,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        limit: 80,
      }),
  })

  if (isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Quizzes', to: base }, { label: 'Question pool' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Question pools</h1>
            <p className="text-sm text-muted-foreground">
              Central bank used by quizzes — filter by type, difficulty, and language.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to={base}>Back to quizzes</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="multiple_choice">MCQ</SelectItem>
              <SelectItem value="true_false">True / False</SelectItem>
              <SelectItem value="fill_blank">Fill blank</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(data?.items || []).map((q) => (
            <div key={q._id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{q.type}</Badge>
                <Badge>{q.difficulty}</Badge>
              </div>
              <h3 className="font-semibold">{q.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{q.category}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {(q.tags || []).join(', ') || 'No tags'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
