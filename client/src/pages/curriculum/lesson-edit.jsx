import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Breadcrumb } from '@/components/common/breadcrumb'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { LessonEditor } from '@/components/curriculum/lesson-editor'
import { courseService } from '@/services/course.service'
import { lessonService, resourceService } from '@/services/curriculum.service'
import { useCoursesBasePath } from '@/hooks/use-course-paths'
import { notify, getErrorMessage } from '@/utils/error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RESOURCE_TYPES } from '@/lib/curriculum-schemas'

export default function LessonEditPage() {
  const { id: courseId, lessonId } = useParams()
  const basePath = useCoursesBasePath()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [resourceForm, setResourceForm] = useState({
    title: '',
    url: 'https://',
    type: 'documentation',
  })

  const { data: course } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseService.get(courseId),
  })
  const { data: lesson, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonService.get(lessonId),
  })

  useEffect(() => {
    if (lesson) setDraft(lesson)
  }, [lesson])

  const save = async (payload) => {
    setSaving(true)
    try {
      const updated = await lessonService.update(lessonId, {
        title: payload.title,
        lessonType: payload.lessonType,
        content: payload.content,
        summary: payload.summary,
        estimatedReadingTime: payload.estimatedReadingTime,
        status: payload.status,
        previewAllowed: payload.previewAllowed,
        bookmarksEnabled: payload.bookmarksEnabled,
      })
      setDraft(updated)
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      queryClient.invalidateQueries({ queryKey: ['curriculum-tree', courseId] })
      notify.success('Lesson saved')
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const addResource = async () => {
    try {
      await resourceService.create({ ...resourceForm, lesson: lessonId })
      notify.success('Resource added')
      queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
      setResourceForm({ title: '', url: 'https://', type: 'documentation' })
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  if (isLoading || !draft) return <PageLoader />

  return (
    <PageTransition className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Breadcrumb
            items={[
              { label: 'Courses', href: basePath },
              { label: course?.title || 'Course', href: `${basePath}/${courseId}` },
              { label: 'Curriculum', href: `${basePath}/${courseId}/curriculum` },
              { label: 'Edit lesson' },
            ]}
          />
          <h1 className="mt-2 text-2xl font-extrabold">Lesson editor</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`${basePath}/${courseId}/curriculum/lessons/${lessonId}`}>Preview view</Link>
          </Button>
          <Button onClick={() => save(draft)} disabled={saving}>
            Save now
          </Button>
        </div>
      </div>

      <LessonEditor value={draft} onChange={setDraft} onAutoSave={save} saving={saving} />

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">Resources</h2>
        <div className="mb-3 space-y-2">
          {(draft.resources || lesson?.resources || []).map((r) => (
            <div key={r._id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span>{r.title}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  if (!window.confirm('Delete this resource?')) return
                  await resourceService.remove(r._id)
                  queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] })
                }}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <div className="space-y-1 sm:col-span-1">
            <Label>Title</Label>
            <Input
              value={resourceForm.title}
              onChange={(e) => setResourceForm((s) => ({ ...s, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>URL</Label>
            <Input
              value={resourceForm.url}
              onChange={(e) => setResourceForm((s) => ({ ...s, url: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={resourceForm.type}
              onValueChange={(v) => setResourceForm((s) => ({ ...s, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="mt-3" size="sm" onClick={addResource}>
          Add resource
        </Button>
      </div>
    </PageTransition>
  )
}
