import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/loaders'
import { certificateService } from '@/services/certificate.service'
import { courseService } from '@/services/course.service'

export default function CertificateRulesPage() {
  const qc = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [form, setForm] = useState(null)

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: async () => {
      const res = await courseService.list({ limit: 50 })
      return res.items || res || []
    },
  })

  const { isFetching } = useQuery({
    queryKey: ['cert-rule', courseId],
    queryFn: async () => {
      const rule = await certificateService.getRule(courseId)
      setForm(rule)
      return rule
    },
    enabled: Boolean(courseId),
  })

  const save = useMutation({
    mutationFn: () => certificateService.saveRule(courseId, form),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cert-rule', courseId] }),
  })

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Certificate rules</h1>
        <p className="text-sm text-muted-foreground">
          Attendance, quiz, assignment, practice, and approval gates.
        </p>
      </div>

      <label className="block text-sm max-w-md">
        <span className="mb-1 block text-muted-foreground">Course</span>
        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
        >
          <option value="">Select course</option>
          {(Array.isArray(courses) ? courses : []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
      </label>

      {isFetching && <PageLoader />}
      {form && (
        <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
          {[
            ['minAttendancePercent', 'Min attendance %'],
            ['minQuizScore', 'Min quiz score %'],
            ['minAssignmentMarksPercent', 'Min assignment marks %'],
            ['minPracticeScore', 'Min practice score'],
            ['minCourseCompletionPercent', 'Min course completion %'],
          ].map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="mb-1 block text-muted-foreground">{label}</span>
              <input
                type="number"
                className="w-full rounded-xl border border-border bg-background px-3 py-2"
                value={form[key] ?? 0}
                onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Approval mode</span>
            <select
              className="w-full rounded-xl border border-border bg-background px-3 py-2"
              value={form.approvalMode || 'automatic'}
              onChange={(e) => setForm({ ...form, approvalMode: e.target.value })}
            >
              <option value="automatic">Automatic</option>
              <option value="teacher">Teacher approval</option>
              <option value="manual">Manual</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm self-end">
            <input
              type="checkbox"
              checked={!!form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <Button className="sm:col-span-2" onClick={() => save.mutate()} disabled={save.isPending}>
            Save rules
          </Button>
        </div>
      )}
    </PageTransition>
  )
}
