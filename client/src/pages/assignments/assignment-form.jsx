import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { assignmentService } from '@/services/assignment.service'
import { courseService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/assignments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/assignments`
  return `${ROUTES.ADMIN}/assignments`
}

const EMPTY = {
  title: '',
  type: 'coding',
  difficulty: 'medium',
  status: 'draft',
  course: '',
  description: '',
  instructions: '',
  objectives: [],
  maxMarks: 100,
  passingMarks: 50,
  maxAttempts: 3,
  allowResubmission: true,
  lateSubmissionAllowed: true,
  latePenaltyPercent: 10,
  estimatedMinutes: 90,
  dueAt: '',
  starterFiles: [
    {
      path: 'index.html',
      language: 'html',
      entry: true,
      content: '<!DOCTYPE html>\n<html><body><h1>Assignment</h1><script src="script.js"></script></body></html>',
    },
    { path: 'script.js', language: 'javascript', entry: false, content: 'console.log("start");\n' },
  ],
  rubrics: [],
}

export default function AssignmentFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'new'
  const { user } = useAuth()
  const base = basePath(user?.role)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: () => courseService.list({ limit: 100 }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['assignment-edit', id],
    queryFn: () => assignmentService.get(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (data) {
      setForm({
        ...EMPTY,
        ...data,
        course: data.course?._id || data.course || '',
        dueAt: data.dueAt ? new Date(data.dueAt).toISOString().slice(0, 16) : '',
        objectives: data.objectives || [],
      })
    }
  }, [data])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        course: form.course,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        maxMarks: Number(form.maxMarks),
        passingMarks: Number(form.passingMarks),
        maxAttempts: Number(form.maxAttempts),
        latePenaltyPercent: Number(form.latePenaltyPercent),
        estimatedMinutes: Number(form.estimatedMinutes),
      }
      if (isEdit) {
        await assignmentService.update(id, payload)
        notify.success('Updated')
      } else {
        const created = await assignmentService.create(payload)
        notify.success('Created')
        navigate(`${base}/${created._id}/edit`)
        return
      }
      navigate(base)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Assignments', to: base }, { label: isEdit ? 'Edit' : 'New' }]} />
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit assignment' : 'Create assignment'}</h1>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Course</Label>
              <Select value={form.course} onValueChange={(v) => set('course', v)}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {(courses?.items || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="file_upload">File upload</SelectItem>
                  <SelectItem value="multiple_files">Multiple files</SelectItem>
                  <SelectItem value="pdf_submission">PDF</SelectItem>
                  <SelectItem value="zip_submission">ZIP</SelectItem>
                  <SelectItem value="image_submission">Image</SelectItem>
                  <SelectItem value="video_submission">Video</SelectItem>
                  <SelectItem value="github_repository">GitHub</SelectItem>
                  <SelectItem value="google_drive_link">Google Drive</SelectItem>
                  <SelectItem value="external_link">External link</SelectItem>
                  <SelectItem value="rich_text">Rich text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={(v) => set('difficulty', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Max marks</Label>
              <Input type="number" value={form.maxMarks} onChange={(e) => set('maxMarks', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Passing marks</Label>
              <Input type="number" value={form.passingMarks} onChange={(e) => set('passingMarks', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Due date</Label>
              <Input type="datetime-local" value={form.dueAt || ''} onChange={(e) => set('dueAt', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Max attempts</Label>
              <Input type="number" value={form.maxAttempts} onChange={(e) => set('maxAttempts', e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Instructions</Label>
            <Textarea rows={6} value={form.instructions} onChange={(e) => set('instructions', e.target.value)} />
          </div>
          {form.type === 'coding' && (
            <div className="grid gap-2">
              <Label>Starter files (JSON)</Label>
              <Textarea
                rows={8}
                value={JSON.stringify(form.starterFiles || [], null, 2)}
                onChange={(e) => {
                  try {
                    set('starterFiles', JSON.parse(e.target.value))
                  } catch {
                    /* typing */
                  }
                }}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title || !form.course}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" asChild>
              <Link to={base}>Cancel</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
