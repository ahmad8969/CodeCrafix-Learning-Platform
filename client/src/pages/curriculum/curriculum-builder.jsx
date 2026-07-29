import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageLoader } from '@/components/loaders'
import { CurriculumTree } from '@/components/curriculum/curriculum-tree'
import { ConfirmDialog } from '@/components/modals/confirm-dialog'
import { courseService } from '@/services/course.service'
import {
  curriculumService,
  moduleService,
  weekService,
  topicService,
  lessonService,
  resourceService,
} from '@/services/curriculum.service'
import { useCoursesBasePath } from '@/hooks/use-course-paths'
import { useAuth } from '@/contexts/auth-context'
import { ROLES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { LESSON_TYPES, RESOURCE_TYPES } from '@/lib/curriculum-schemas'

const STAT_KEYS = [
  { key: 'totalModules', label: 'Modules' },
  { key: 'totalLessons', label: 'Lessons' },
  { key: 'publishedLessons', label: 'Published' },
  { key: 'draftLessons', label: 'Drafts' },
  { key: 'resources', label: 'Resources' },
  { key: 'estimatedCourseDuration', label: 'Est. hours' },
]

export default function CurriculumBuilderPage() {
  const { id: courseId } = useParams()
  const basePath = useCoursesBasePath()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(user?.role)
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [difficulty, setDifficulty] = useState('all')
  const [lessonType, setLessonType] = useState('all')
  const [status, setStatus] = useState('all')
  const [preview, setPreview] = useState('all')
  const [maxTime, setMaxTime] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [formKind, setFormKind] = useState(null)
  const [formParent, setFormParent] = useState(null)
  const [formValues, setFormValues] = useState({})
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.get(courseId),
  })

  const { data: tree = [], isLoading: loadingTree } = useQuery({
    queryKey: ['curriculum-tree', courseId],
    queryFn: () => curriculumService.tree(courseId),
  })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['curriculum-stats', courseId],
    queryFn: () => curriculumService.stats(courseId),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['curriculum-search', courseId, debouncedSearch],
    queryFn: () => curriculumService.search(courseId, { search: debouncedSearch }),
    enabled: debouncedSearch.length >= 2,
  })

  const filters = useMemo(
    () => ({
      search: debouncedSearch,
      difficulty: difficulty === 'all' ? undefined : difficulty,
      lessonType: lessonType === 'all' ? undefined : lessonType,
      status: status === 'all' ? undefined : status,
      preview: preview === 'all' ? undefined : preview,
      maxTime: maxTime || undefined,
    }),
    [debouncedSearch, difficulty, lessonType, status, preview, maxTime]
  )

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['curriculum-tree', courseId] })
    queryClient.invalidateQueries({ queryKey: ['curriculum-stats', courseId] })
  }

  const openCreate = (kind, parent = null) => {
    setFormKind(kind)
    setFormParent(parent)
    const defaults = {
      module: { name: '', description: '', estimatedDuration: '', status: 'draft' },
      week: {
        name: '',
        weekNumber: (parent?.weeks?.length || 0) + 1,
        description: '',
        estimatedHours: 4,
        status: 'draft',
      },
      topic: {
        name: '',
        shortDescription: '',
        difficulty: 'beginner',
        estimatedTime: '60 min',
        status: 'draft',
        tags: '',
      },
      lesson: {
        title: '',
        lessonType: 'markdown',
        summary: '',
        estimatedReadingTime: 10,
        status: 'draft',
        previewAllowed: false,
      },
      resource: {
        title: '',
        url: 'https://',
        type: 'documentation',
        description: '',
        visibility: 'enrolled',
      },
    }
    setFormValues(defaults[kind] || {})
    setFormOpen(true)
  }

  const openEdit = (kind, item) => {
    if (kind === 'lesson') {
      navigate(`${basePath}/${courseId}/curriculum/lessons/${item._id}/edit`)
      return
    }
    setFormKind(kind)
    setFormParent(null)
    setFormValues({
      ...item,
      tags: Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || '',
    })
    setFormOpen(true)
  }

  const submitForm = async () => {
    setSaving(true)
    try {
      if (formValues._id) {
        const id = formValues._id
        if (formKind === 'module') await moduleService.update(id, formValues)
        if (formKind === 'week') await weekService.update(id, formValues)
        if (formKind === 'topic') {
          await topicService.update(id, {
            ...formValues,
            tags: String(formValues.tags || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        if (formKind === 'resource') await resourceService.update(id, formValues)
        notify.success('Updated')
      } else {
        if (formKind === 'module') {
          await moduleService.create({ ...formValues, course: courseId })
        }
        if (formKind === 'week') {
          await weekService.create({ ...formValues, module: formParent._id })
        }
        if (formKind === 'topic') {
          await topicService.create({
            ...formValues,
            week: formParent._id,
            tags: String(formValues.tags || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        if (formKind === 'lesson') {
          const lesson = await lessonService.create({
            ...formValues,
            topic: formParent._id,
            content: `# ${formValues.title || 'New lesson'}\n\nStart writing…`,
          })
          notify.success('Lesson created')
          setFormOpen(false)
          invalidate()
          navigate(`${basePath}/${courseId}/curriculum/lessons/${lesson._id}/edit`)
          return
        }
        if (formKind === 'resource') {
          await resourceService.create({ ...formValues, lesson: formParent._id })
        }
        notify.success('Created')
      }
      setFormOpen(false)
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const onReorder = async (type, parentId, items) => {
    try {
      const payload = {
        items: items.map((item, idx) => ({ id: item._id, displayOrder: idx })),
      }
      if (type === 'module') await moduleService.reorder({ ...payload, course: courseId })
      if (type === 'week') await weekService.reorder({ ...payload, module: parentId })
      if (type === 'topic') await topicService.reorder({ ...payload, week: parentId })
      if (type === 'lesson') await lessonService.reorder({ ...payload, topic: parentId })
    } catch (e) {
      notify.error(getErrorMessage(e))
      invalidate()
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const { kind, item } = deleteTarget
      if (kind === 'module') await moduleService.remove(item._id)
      if (kind === 'week') await weekService.remove(item._id)
      if (kind === 'topic') await topicService.remove(item._id)
      if (kind === 'lesson') await lessonService.remove(item._id)
      if (kind === 'resource') await resourceService.remove(item._id)
      notify.success('Deleted (soft). You can restore via API.')
      setDeleteTarget(null)
      invalidate()
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loadingCourse || !course) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Courses', href: basePath },
              { label: course.title, href: `${basePath}/${courseId}` },
              { label: 'Curriculum' },
            ]}
          />
          <h1 className="mt-2 text-2xl font-extrabold">Curriculum builder</h1>
          <p className="text-muted-foreground">
            Modules → Weeks → Topics → Lessons → Resources. Drag to reorder. Auto-saves order.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => openCreate('module')}>
            <Plus className="size-4" /> Add module
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {STAT_KEYS.map(({ key, label }) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <p className="text-2xl font-extrabold">{stats?.[key] ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search modules, weeks, topics, lessons, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulty</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={lessonType} onValueChange={setLessonType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {LESSON_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={preview} onValueChange={setPreview}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Preview" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All preview</SelectItem>
            <SelectItem value="true">Previewable</SelectItem>
            <SelectItem value="false">Not preview</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="w-28"
          type="number"
          placeholder="Max min"
          value={maxTime}
          onChange={(e) => setMaxTime(e.target.value)}
        />
      </div>

      {searchResults && debouncedSearch.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Search hits</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {['modules', 'weeks', 'topics', 'lessons'].map((key) => (
              <div key={key}>
                <p className="mb-1 font-semibold capitalize">{key}</p>
                <ul className="space-y-1 text-muted-foreground">
                  {(searchResults[key] || []).slice(0, 5).map((item) => (
                    <li key={item._id}>{item.name || item.title}</li>
                  ))}
                  {(searchResults[key] || []).length === 0 && <li>None</li>}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loadingTree ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <CurriculumTree
          tree={tree}
          readOnly={!canManage}
          filters={filters}
          onReorder={onReorder}
          onAddChild={(kind, parent) => openCreate(kind, parent)}
          onEdit={openEdit}
          onDelete={(kind, item) => setDeleteTarget({ kind, item })}
          onOpenLesson={(lesson) =>
            navigate(`${basePath}/${courseId}/curriculum/lessons/${lesson._id}`)
          }
        />
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {formValues._id ? 'Edit' : 'Create'} {formKind}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {formKind === 'module' && (
              <>
                <Field label="Name">
                  <Input
                    value={formValues.name || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={formValues.description || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
                  />
                </Field>
                <Field label="Estimated duration">
                  <Input
                    value={formValues.estimatedDuration || ''}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, estimatedDuration: e.target.value }))
                    }
                  />
                </Field>
              </>
            )}
            {formKind === 'week' && (
              <>
                <Field label="Week number">
                  <Input
                    type="number"
                    value={formValues.weekNumber || 1}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, weekNumber: Number(e.target.value) }))
                    }
                  />
                </Field>
                <Field label="Name">
                  <Input
                    value={formValues.name || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                  />
                </Field>
                <Field label="Estimated hours">
                  <Input
                    type="number"
                    value={formValues.estimatedHours || 0}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, estimatedHours: Number(e.target.value) }))
                    }
                  />
                </Field>
              </>
            )}
            {formKind === 'topic' && (
              <>
                <Field label="Name">
                  <Input
                    value={formValues.name || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
                  />
                </Field>
                <Field label="Short description">
                  <Input
                    value={formValues.shortDescription || ''}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, shortDescription: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Tags (comma separated)">
                  <Input
                    value={formValues.tags || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, tags: e.target.value }))}
                  />
                </Field>
              </>
            )}
            {formKind === 'lesson' && (
              <>
                <Field label="Title">
                  <Input
                    value={formValues.title || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
                  />
                </Field>
                <Field label="Summary">
                  <Input
                    value={formValues.summary || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, summary: e.target.value }))}
                  />
                </Field>
              </>
            )}
            {formKind === 'resource' && (
              <>
                <Field label="Title">
                  <Input
                    value={formValues.title || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
                  />
                </Field>
                <Field label="URL">
                  <Input
                    value={formValues.url || ''}
                    onChange={(e) => setFormValues((v) => ({ ...v, url: e.target.value }))}
                  />
                </Field>
                <Field label="Type">
                  <Select
                    value={formValues.type || 'documentation'}
                    onValueChange={(v) => setFormValues((s) => ({ ...s, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            {['module', 'week', 'topic', 'lesson'].includes(formKind) && (
              <Field label="Status">
                <Select
                  value={formValues.status || 'draft'}
                  onValueChange={(v) => setFormValues((s) => ({ ...s, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitForm} disabled={saving}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.kind}?`}
        description="This soft-deletes the item. Restore is available via the restore API."
        onConfirm={confirmDelete}
        loading={saving}
      />
    </PageTransition>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
