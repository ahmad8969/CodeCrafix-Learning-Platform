import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable } from '@/components/tables/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { practiceService } from '@/services/practice.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function practiceBase(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/practice`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/practice`
  return `${ROUTES.ADMIN}/practice`
}

export default function PracticeQuestionsListPage() {
  const { user } = useAuth()
  const base = practiceBase(user?.role)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['practice-questions', debounced, page, type, difficulty, status],
    queryFn: () =>
      practiceService.list({
        search: debounced || undefined,
        page,
        limit: 10,
        type: type === 'all' ? undefined : type,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        status: status === 'all' ? undefined : status,
      }),
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Question',
        sortable: true,
        render: (row) => (
          <div>
            <Link to={`${base}/${row._id}`} className="font-medium hover:text-primary">
              {row.title}
            </Link>
            <p className="text-[11px] text-muted-foreground">{row.slug}</p>
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        render: (row) => <Badge variant="secondary">{row.type}</Badge>,
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        render: (row) => <span className="capitalize">{row.difficulty}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      {
        key: 'xpReward',
        label: 'XP',
      },
      {
        key: 'attemptCount',
        label: 'Attempts',
      },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/edit`}>Edit</Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  await practiceService.clone(row._id)
                  notify.success('Cloned')
                  queryClient.invalidateQueries({ queryKey: ['practice-questions'] })
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  if (row.deletedAt) await practiceService.restore(row._id)
                  else await practiceService.archive(row._id)
                  notify.success(row.deletedAt ? 'Restored' : 'Archived')
                  queryClient.invalidateQueries({ queryKey: ['practice-questions'] })
                } catch (e) {
                  notify.error(getErrorMessage(e))
                }
              }}
            >
              {row.deletedAt ? 'Restore' : 'Archive'}
            </Button>
          </div>
        ),
      },
    ],
    [base, queryClient]
  )

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Practice' }, { label: 'Question Bank' }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
            <p className="text-sm text-muted-foreground">
              Manage coding & MCQ practice questions. Other types are architecture-ready.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`${base}/analytics`}>Analytics</Link>
            </Button>
            <Button asChild>
              <Link to={`${base}/new`}>
                <Plus className="size-4" /> New question
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm"
            placeholder="Search…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="multiple_choice">MCQ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={(v) => { setDifficulty(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
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
          limit={10}
          total={total}
          onPageChange={setPage}
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
        />
      </div>
    </PageTransition>
  )
}
