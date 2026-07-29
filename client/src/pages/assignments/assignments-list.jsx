import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { assignmentService } from '@/services/assignment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/assignments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/assignments`
  return `${ROUTES.ADMIN}/assignments`
}

export default function AssignmentsListPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', debounced, page, status, type],
    queryFn: () =>
      assignmentService.list({
        search: debounced || undefined,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        type: type === 'all' ? undefined : type,
      }),
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Assignment',
        render: (row) => (
          <Link to={`${base}/${row._id}`} className="font-medium hover:text-primary">
            {row.title}
          </Link>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        render: (row) => <Badge variant="secondary">{row.type}</Badge>,
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <Badge>{row.status}</Badge>,
      },
      {
        key: 'dueAt',
        label: 'Due',
        render: (row) => (row.dueAt ? new Date(row.dueAt).toLocaleDateString() : '—'),
      },
      { key: 'submissionCount', label: 'Subs' },
      { key: 'averageMarks', label: 'Avg' },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/edit`}>Edit</Link>
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}/submissions`}>Review</Link>
            </Button>
            {row.status !== 'published' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await assignmentService.publish(row._id)
                    notify.success('Published')
                    queryClient.invalidateQueries({ queryKey: ['assignments'] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Publish
              </Button>
            )}
          </div>
        ),
      },
    ],
    [base, queryClient]
  )

  return (
    <PageTransition>
      <div className="space-y-4 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Assignments' }]} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
            <p className="text-sm text-muted-foreground">
              Coding and non-coding assignment management.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`${base}/analytics`}>Analytics</Link>
            </Button>
            <Button asChild>
              <Link to={`${base}/new`}>
                <Plus className="size-4" /> New
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="coding">Coding</SelectItem>
              <SelectItem value="file_upload">File upload</SelectItem>
              <SelectItem value="github_repository">GitHub</SelectItem>
              <SelectItem value="rich_text">Rich text</SelectItem>
              <SelectItem value="external_link">External link</SelectItem>
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
