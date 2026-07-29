import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable, exportRowsToCsv } from '@/components/tables/data-table'
import { CourseCard } from '@/components/cards/course-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { courseService, categoryService } from '@/services/course.service'
import { useCoursesBasePath, useCategoriesBasePath, useBatchesBasePath } from '@/hooks/use-course-paths'
import { useAuth } from '@/contexts/auth-context'
import { ROLES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export default function CoursesListPage() {
  const basePath = useCoursesBasePath()
  const categoriesPath = useCategoriesBasePath()
  const batchesPath = useBatchesBasePath()
  const { user } = useAuth()
  const readOnly = user?.role === ROLES.TEACHER
  const queryClient = useQueryClient()

  const [view, setView] = useState('table')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [trash, setTrash] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selected, setSelected] = useState([])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoryService.list({ limit: 100 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['courses', debouncedSearch, page, status, category, sortBy, sortOrder, trash],
    queryFn: () =>
      courseService.list({
        search: debouncedSearch,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        category: category === 'all' ? undefined : category,
        sortBy,
        sortOrder,
        includeDeleted: trash ? 'true' : undefined,
        deletedOnly: trash ? 'true' : undefined,
      }),
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const columns = [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-1">
          <Link to={`${basePath}/${row._id}`} className="font-medium hover:text-primary">
            {row.title}
          </Link>
          {row.deletedAt && !readOnly && (
            <Button size="sm" variant="outline" className="w-fit" onClick={() => onRestore(row)}>
              Restore
            </Button>
          )}
        </div>
      ),
      exportValue: (row) => row.title,
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '—',
      exportValue: (row) => row.category?.name,
    },
    {
      key: 'instructor',
      label: 'Teacher',
      render: (row) => row.instructor?.fullName || '—',
      exportValue: (row) => row.instructor?.fullName,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <Badge className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (row) => <span className="capitalize">{row.difficulty}</span>,
    },
    { key: 'duration', label: 'Duration' },
    {
      key: 'batchCount',
      label: 'Batches',
      render: (row) => row.batchCount || 0,
    },
  ]

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['courses'] })

  const onPublish = async (course) => {
    try {
      await courseService.publish(course._id)
      notify.success('Published')
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  const onArchive = async (course) => {
    try {
      await courseService.archive(course._id)
      notify.success('Archived')
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  const onDelete = async (course) => {
    try {
      await courseService.remove(course._id)
      notify.success('Deleted')
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  const onRestore = async (course) => {
    try {
      await courseService.restore(course._id)
      notify.success('Restored')
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Courses' }]} />
          <h1 className="mt-2 text-2xl font-extrabold">Courses</h1>
          <p className="text-muted-foreground">
            {readOnly ? 'Assigned courses (read-only).' : 'Create, publish, and manage courses.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!readOnly && (
            <>
              <Button asChild variant="outline">
                <Link to={categoriesPath}>Categories</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={batchesPath}>Batches</Link>
              </Button>
              <Button asChild>
                <Link to={`${basePath}/new`}>
                  <Plus className="size-4" /> Create course
                </Link>
              </Button>
            </>
          )}
          <Button variant={view === 'table' ? 'primary' : 'outline'} size="sm" onClick={() => setView('table')}>
            Table
          </Button>
          <Button variant={view === 'cards' ? 'primary' : 'outline'} size="sm" onClick={() => setView('cards')}>
            Cards
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <DataTable
          columns={columns}
          rows={rows}
          total={total}
          page={page}
          limit={10}
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          onPageChange={setPage}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(key, order) => {
            setSortBy(key)
            setSortOrder(order)
          }}
          selected={readOnly ? undefined : selected}
          onSelectedChange={readOnly ? undefined : setSelected}
          loading={isLoading}
          onBulkPublish={
            readOnly
              ? undefined
              : async () => {
                  await courseService.bulkStatus(selected, 'published')
                  setSelected([])
                  notify.success('Bulk published')
                  invalidate()
                }
          }
          onBulkArchive={
            readOnly
              ? undefined
              : async () => {
                  await courseService.bulkStatus(selected, 'archived')
                  setSelected([])
                  notify.success('Bulk archived')
                  invalidate()
                }
          }
          onBulkDelete={
            readOnly
              ? undefined
              : async () => {
                  await courseService.bulkDelete(selected)
                  setSelected([])
                  notify.success('Bulk deleted')
                  invalidate()
                }
          }
          onExport={() => exportRowsToCsv('courses.csv', rows, columns)}
          filtersSlot={
            <>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categoriesData?.items || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button
                  size="sm"
                  variant={trash ? 'primary' : 'outline'}
                  onClick={() => {
                    setTrash((v) => !v)
                    setPage(1)
                    setSelected([])
                  }}
                >
                  {trash ? 'Showing trash' : 'Trash'}
                </Button>
              )}
            </>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              basePath={basePath}
              readOnly={readOnly}
              onPublish={onPublish}
              onArchive={onArchive}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </PageTransition>
  )
}
