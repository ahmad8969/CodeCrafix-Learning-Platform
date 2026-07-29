import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
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
import { StatusBadge, exportRowsCsv } from '@/components/enrollment/enrollment-widgets'
import { enrollmentService } from '@/services/enrollment.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/enrollments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/enrollments`
  return `${ROUTES.ADMIN}/enrollments`
}

export default function EnrollmentsListPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debounced = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', debounced, page, status],
    queryFn: () =>
      enrollmentService.list({
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
        key: 'student',
        label: 'Student',
        render: (row) => (
          <div>
            <p className="font-medium">{row.student?.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.student?.email}</p>
          </div>
        ),
      },
      {
        key: 'course',
        label: 'Course',
        render: (row) => row.course?.title || '—',
      },
      {
        key: 'batch',
        label: 'Batch',
        render: (row) => row.batch?.batchCode || '—',
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'overallProgress',
        label: 'Progress',
        render: (row) => `${row.overallProgress || 0}%`,
      },
      {
        key: 'enrolledAt',
        label: 'Enrolled',
        render: (row) => (row.enrolledAt ? new Date(row.enrolledAt).toLocaleDateString() : '—'),
      },
      {
        key: 'actions',
        label: '',
        render: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.status === 'pending' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await enrollmentService.approve(row._id)
                    notify.success('Approved')
                    queryClient.invalidateQueries({ queryKey: ['enrollments'] })
                  } catch (e) {
                    notify.error(getErrorMessage(e))
                  }
                }}
              >
                Approve
              </Button>
            )}
            <Button size="sm" variant="ghost" asChild>
              <Link to={`${base}/${row._id}`}>Open</Link>
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
        <Breadcrumb items={[{ label: 'Enrollments' }]} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Enrollments</h1>
            <p className="text-sm text-muted-foreground">Manage student course and batch assignments.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                exportRowsCsv(rows, 'enrollments.csv', [
                  { label: 'Student', get: (r) => r.student?.fullName },
                  { label: 'Email', get: (r) => r.student?.email },
                  { label: 'Course', get: (r) => r.course?.title },
                  { label: 'Batch', get: (r) => r.batch?.batchCode },
                  { label: 'Status', key: 'status' },
                  { label: 'Progress', key: 'overallProgress' },
                ])
              }
            >
              <Download className="size-4" /> Export CSV
            </Button>
            <Button variant="outline" asChild>
              <Link to={`${base}/analytics`}>Analytics</Link>
            </Button>
            <Button asChild>
              <Link to={`${base}/new`}>
                <Plus className="size-4" /> Enroll
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search name, email, phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
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
