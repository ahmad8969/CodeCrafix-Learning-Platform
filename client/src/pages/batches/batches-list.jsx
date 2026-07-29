import { useEffect, useState } from 'react'
import { Link, useSearchParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, exportRowsToCsv } from '@/components/tables/data-table'
import { ButtonLoader } from '@/components/loaders'
import { batchSchema } from '@/lib/course-schemas'
import { batchService, courseService, usersService } from '@/services/course.service'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const DAYS = ['friday', 'saturday', 'sunday']

const emptyBatch = {
  course: '',
  name: '',
  batchCode: '',
  startDate: '',
  endDate: '',
  days: ['saturday'],
  classTime: '10:00',
  durationPerClass: '2 hours',
  maximumStudents: 30,
  teacher: '',
  status: 'upcoming',
}

export default function BatchesListPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const batchBase = location.pathname.replace(/\/batches.*/, '/batches')
  const courseFilter = searchParams.get('course') || 'all'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [course, setCourse] = useState(courseFilter)
  const [sortBy, setSortBy] = useState('startDate')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selected, setSelected] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (courseFilter !== 'all') setCourse(courseFilter)
  }, [courseFilter])

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'batch-form'],
    queryFn: () => courseService.list({ limit: 100 }),
  })
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => usersService.instructors(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['batches', debouncedSearch, page, status, course, sortBy, sortOrder],
    queryFn: () =>
      batchService.list({
        search: debouncedSearch,
        page,
        limit: 10,
        status: status === 'all' ? undefined : status,
        course: course === 'all' ? undefined : course,
        sortBy,
        sortOrder,
      }),
  })

  const form = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: emptyBatch,
  })

  const rows = data?.items || []
  const total = data?.pagination?.total || 0

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['batches'] })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      ...emptyBatch,
      course: course !== 'all' ? course : '',
    })
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    form.reset({
      course: row.course?._id || row.course || '',
      name: row.name || '',
      batchCode: row.batchCode || '',
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : '',
      days: row.days || ['saturday'],
      classTime: row.classTime || '10:00',
      durationPerClass: row.durationPerClass || '2 hours',
      maximumStudents: row.maximumStudents || 30,
      teacher: row.teacher?._id || row.teacher || '',
      status: row.status || 'upcoming',
    })
    setOpen(true)
  }

  const columns = [
    {
      key: 'name',
      label: 'Batch',
      sortable: true,
      render: (row) => (
        <Link to={`${batchBase}/${row._id}`} className="font-medium hover:text-primary">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) => row.course?.title || '—',
      exportValue: (row) => row.course?.title,
    },
    { key: 'batchCode', label: 'Code', sortable: true },
    {
      key: 'teacher',
      label: 'Teacher',
      render: (row) => row.teacher?.fullName || '—',
      exportValue: (row) => row.teacher?.fullName,
    },
    {
      key: 'days',
      label: 'Days',
      render: (row) => (row.days || []).map((d) => d.slice(0, 3)).join(', '),
    },
    { key: 'classTime', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge className="capitalize">{row.status}</Badge>,
    },
    {
      key: 'maximumStudents',
      label: 'Capacity',
    },
  ]

  const onSubmit = async (values) => {
    setSubmitting(true)
    try {
      if (editing) {
        await batchService.update(editing._id, values)
        notify.success('Batch updated')
      } else {
        await batchService.create(values)
        notify.success('Batch created')
      }
      setOpen(false)
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const watchedDays = form.watch('days') || []

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb items={[{ label: 'Batches' }]} />
          <h1 className="mt-2 text-2xl font-extrabold">Batch management</h1>
          <p className="text-muted-foreground">Configure class batches for each course.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Create batch
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
            await Promise.all(selected.map((id) => batchService.remove(id)))
            setSelected([])
            notify.success('Batches deleted')
            invalidate()
          } catch (e) {
            notify.error(getErrorMessage(e))
          }
        }}
        onExport={() => exportRowsToCsv('batches.csv', rows, columns)}
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
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={course}
              onValueChange={(v) => {
                setCourse(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {(coursesData?.items || []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit batch' : 'Create batch'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Course</Label>
              <Select
                value={form.watch('course')}
                onValueChange={(v) => form.setValue('course', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {(coursesData?.items || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.course && (
                <p className="text-xs text-destructive">{form.formState.errors.course.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Batch name</Label>
              <Input {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label>Batch code</Label>
              <Input {...form.register('batchCode')} />
            </div>
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" {...form.register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" {...form.register('endDate')} />
            </div>
            <div className="space-y-2">
              <Label>Class time</Label>
              <Input {...form.register('classTime')} />
            </div>
            <div className="space-y-2">
              <Label>Duration per class</Label>
              <Input {...form.register('durationPerClass')} />
            </div>
            <div className="space-y-2">
              <Label>Maximum students</Label>
              <Input type="number" {...form.register('maximumStudents')} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(v) => form.setValue('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Teacher</Label>
              <Select
                value={form.watch('teacher')}
                onValueChange={(v) => form.setValue('teacher', v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {(instructors || []).map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Days</Label>
              <div className="flex flex-wrap gap-3">
                {DAYS.map((day) => {
                  const checked = watchedDays.includes(day)
                  return (
                    <label key={day} className="inline-flex items-center gap-2 text-sm capitalize">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const next = v
                            ? [...watchedDays, day]
                            : watchedDays.filter((d) => d !== day)
                          form.setValue('days', next, { shouldValidate: true })
                        }}
                      />
                      {day}
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <ButtonLoader /> : null}
                {editing ? 'Save changes' : 'Create batch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
