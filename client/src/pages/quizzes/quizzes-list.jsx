import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable } from '@/components/tables/data-table'
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
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/quizzes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/quizzes`
  return `${ROUTES.ADMIN}/quizzes`
}

export default function QuizzesListPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', debounced, page, status],
    queryFn: () =>
      quizService.list({
        search: debounced || undefined,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
      }),
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Quiz',
        render: (row) => (
          <Link to={`${base}/${row._id}`} className="font-medium hover:text-primary">
            {row.title}
          </Link>
        ),
      },
      {
        key: 'course',
        label: 'Course',
        render: (row) => row.course?.title || '—',
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      { key: 'totalQuestions', label: 'Q' },
      { key: 'attemptCount', label: 'Attempts' },
      {
        key: 'averageScore',
        label: 'Avg %',
        render: (row) => row.averageScore ?? 0,
      },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/edit`}>Edit</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/attempts`}>Results</Link>
            </Button>
            {row.status !== 'published' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await quizService.publish(row._id)
                    notify.success('Published')
                    queryClient.invalidateQueries({ queryKey: ['quizzes'] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Publish
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  const dup = await quizService.duplicate(row._id)
                  notify.success('Duplicated')
                  queryClient.invalidateQueries({ queryKey: ['quizzes'] })
                  window.location.href = `${base}/${dup._id}/edit`
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              Duplicate
            </Button>
          </div>
        ),
      },
    ],
    [base, queryClient]
  )

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Quizzes' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-sm text-muted-foreground">Create, publish, and review assessments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`${base}/analytics`}>Analytics</Link>
            </Button>
            {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) && (
              <Button variant="outline" asChild>
                <Link to={`${base}/pool`}>Question pool</Link>
              </Button>
            )}
            <Button asChild>
              <Link to={`${base}/new`}>
                <Plus className="size-4" /> New quiz
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search quizzes"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          loading={isLoading}
          page={page}
          total={total}
          limit={10}
          onPageChange={setPage}
        />
      </div>
    </PageTransition>
  )
}
