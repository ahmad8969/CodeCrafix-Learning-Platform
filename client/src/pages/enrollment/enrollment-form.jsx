import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { enrollmentService } from '@/services/enrollment.service'
import { courseService, batchService, usersService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/enrollments`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/enrollments`
  return `${ROUTES.ADMIN}/enrollments`
}

export default function EnrollmentFormPage() {
  const { user } = useAuth()
  const base = basePath(user?.role)
  const navigate = useNavigate()
  const [tab, setTab] = useState('manual')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    studentId: '',
    courseId: '',
    batchId: '',
    notes: '',
    requireApproval: false,
  })
  const [csvText, setCsvText] = useState('email,courseId,batchId\n')

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: () => courseService.list({ limit: 100 }),
  })
  const { data: batches } = useQuery({
    queryKey: ['batches-mini', form.courseId],
    queryFn: () => batchService.list({ course: form.courseId || undefined, limit: 100 }),
    enabled: true,
  })
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: () => usersService.instructors(),
  })

  // Students aren't in instructors — list via enrollments search isn't enough.
  // Use a simple email lookup field for manual enroll.
  const [studentEmail, setStudentEmail] = useState('')

  const saveManual = async () => {
    setSaving(true)
    try {
      // Resolve student by listing users instructors endpoint won't work — send email via bulk path
      // Admin creates by studentId; for email we use bulk with one row after resolving from API
      // Prefer studentId if set; else bulk with email
      if (form.studentId) {
        await enrollmentService.create({
          studentId: form.studentId,
          courseId: form.courseId,
          batchId: form.batchId || undefined,
          notes: form.notes,
          requireApproval: form.requireApproval,
        })
      } else if (studentEmail && form.courseId) {
        const result = await enrollmentService.bulk([
          {
            email: studentEmail,
            courseId: form.courseId,
            batchId: form.batchId || undefined,
            notes: form.notes,
          },
        ])
        if (result.errors?.length) throw new Error(result.errors[0].error)
      } else {
        throw new Error('Student email and course are required')
      }
      notify.success('Enrolled')
      navigate(base)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const saveBulk = async () => {
    setSaving(true)
    try {
      const lines = csvText
        .trim()
        .split(/\r?\n/)
        .slice(1)
        .filter(Boolean)
      const rows = lines.map((line) => {
        const [email, courseId, batchId] = line.split(',').map((s) => s.trim())
        return { email, courseId, batchId: batchId || undefined }
      })
      const result = await enrollmentService.bulk(rows)
      notify.success(`Created ${result.created?.length || 0}, errors ${result.errors?.length || 0}`)
      navigate(base)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
        <Breadcrumb items={[{ label: 'Enrollments', to: base }, { label: 'New' }]} />
        <h1 className="text-2xl font-bold">Enroll students</h1>
        <div className="flex gap-2">
          <Button variant={tab === 'manual' ? 'default' : 'outline'} onClick={() => setTab('manual')}>
            Manual
          </Button>
          <Button variant={tab === 'bulk' ? 'default' : 'outline'} onClick={() => setTab('bulk')}>
            Bulk CSV
          </Button>
        </div>

        {tab === 'manual' ? (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="space-y-1.5">
              <Label>Student email</Label>
              <Input value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="student@…" />
            </div>
            <div className="space-y-1.5">
              <Label>Course</Label>
              <Select value={form.courseId || undefined} onValueChange={(v) => setForm((p) => ({ ...p, courseId: v, batchId: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {(courses?.items || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Select value={form.batchId || undefined} onValueChange={(v) => setForm((p) => ({ ...p, batchId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional batch" />
                </SelectTrigger>
                <SelectContent>
                  {(batches?.items || [])
                    .filter((b) => !form.courseId || String(b.course?._id || b.course) === form.courseId)
                    .map((b) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name} ({b.batchCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.requireApproval}
                onChange={(e) => setForm((p) => ({ ...p, requireApproval: e.target.checked }))}
              />
              Require approval
            </label>
            <div className="flex gap-2">
              <Button disabled={saving} onClick={saveManual}>
                Enroll
              </Button>
              <Button variant="outline" asChild>
                <Link to={base}>Cancel</Link>
              </Button>
            </div>
            {/* silence unused */}
            <span className="hidden">{instructors?.length}</span>
          </div>
        ) : (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">CSV columns: email, courseId, batchId</p>
            <Textarea rows={10} value={csvText} onChange={(e) => setCsvText(e.target.value)} className="font-mono text-xs" />
            <Button disabled={saving} onClick={saveBulk}>
              Process bulk
            </Button>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
