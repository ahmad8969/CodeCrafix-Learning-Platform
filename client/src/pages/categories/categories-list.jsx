import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { DataTable, exportRowsToCsv } from '@/components/tables/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categoryService } from '@/services/course.service'
import { useCategoriesBasePath } from '@/hooks/use-course-paths'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

export default function CategoriesListPage() {
  const basePath = useCategoriesBasePath()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [sortBy, setSortBy] = useState('displayOrder')
  const [sortOrder, setSortOrder] = useState('asc')
  const [selected, setSelected] = useState([])

  const { data, isLoading } = useQuery({
    queryKey: ['categories', debouncedSearch, page, status, sortBy, sortOrder],
    queryFn: () =>
      categoryService.list({
        search: debouncedSearch,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        sortBy,
        sortOrder,
      }),
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const columns = [
    {
      key: 'name',
      label: 'Category',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full"
            style={{ background: row.color || 'var(--primary)' }}
          />
          <Link to={`${basePath}/${row._id}/edit`} className="font-medium hover:text-primary">
            {row.name}
          </Link>
        </div>
      ),
    },
    { key: 'slug', label: 'Slug', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge className="capitalize">{row.status}</Badge>,
    },
    { key: 'displayOrder', label: 'Order', sortable: true },
    {
      key: 'icon',
      label: 'Icon',
      render: (row) => row.icon || '—',
    },
  ]

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] })

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Categories' }]} />
          <h1 className="mt-2 text-2xl font-extrabold">Course categories</h1>
          <p className="text-muted-foreground">Organize courses into discoverable categories.</p>
        </div>
        <Button asChild>
          <Link to={`${basePath}/new`}>
            <Plus className="size-4" /> Create category
          </Link>
        </Button>
      </div>

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
        selected={selected}
        onSelectedChange={setSelected}
        loading={isLoading}
        onBulkDelete={async () => {
          try {
            await Promise.all(selected.map((id) => categoryService.remove(id)))
            setSelected([])
            notify.success('Categories deleted')
            invalidate()
          } catch (e) {
            notify.error(getErrorMessage(e))
          }
        }}
        onExport={() => exportRowsToCsv('categories.csv', rows, columns)}
        filtersSlot={
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </PageTransition>
  )
}
