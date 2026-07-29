import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageTransition } from '@/components/ui/motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Breadcrumb } from '@/components/common/breadcrumb'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { quizService } from '@/services/quiz.service'
import { courseService } from '@/services/course.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function basePath(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/quizzes`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/quizzes`
  return `${ROUTES.ADMIN}/quizzes`
}

const EMPTY = {
  title: '',
  description: '',
  instructions: 'Read each question carefully. Timer cannot be paused. Submit before time expires.',
  status: 'draft',
  course: '',
  category: 'General',
  passingPercentage: 60,
  timeLimitMinutes: 20,
  maxAttempts: 3,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showResultImmediately: true,
  showCorrectAnswers: true,
  negativeMarking: false,
  partialMarks: true,
  enableReview: true,
  lockAfterSubmission: true,
  pauseDisabled: true,
  resumeSupport: false,
  items: [],
  poolRules: [],
  startAt: '',
  endAt: '',
}

export default function QuizFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'new'
  const { user } = useAuth()
  const base = basePath(user?.role)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [poolType, setPoolType] = useState('all')
  const [poolDiff, setPoolDiff] = useState('all')

  const { data: courses } = useQuery({
    queryKey: ['courses-mini'],
    queryFn: () => courseService.list({ limit: 100 }),
  })

  const { data: pool } = useQuery({
    queryKey: ['quiz-pool', poolType, poolDiff],
    queryFn: () =>
      quizService.pool({
        type: poolType === 'all' ? undefined : poolType,
        difficulty: poolDiff === 'all' ? undefined : poolDiff,
        limit: 40,
      }),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-edit', id],
    queryFn: () => quizService.get(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (data) {
      setForm({
        ...EMPTY,
        ...data,
        course: data.course?._id || data.course || '',
        items: (data.items || []).map((it) => ({
          practiceQuestion: it.practiceQuestion?._id || it.practiceQuestion,
          marks: it.marks || 1,
          displayOrder: it.displayOrder || 0,
          _title: it.practiceQuestion?.title || it.snapshot?.title || 'Question',
          _type: it.practiceQuestion?.type || it.snapshot?.type,
        })),
        poolRules: data.poolRules || [],
        startAt: data.startAt ? new Date(data.startAt).toISOString().slice(0, 16) : '',
        endAt: data.endAt ? new Date(data.endAt).toISOString().slice(0, 16) : '',
      })
    }
  }, [data])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  const addFromPool = (q) => {
    if (form.items.some((i) => String(i.practiceQuestion) === String(q._id))) {
      notify.success('Already added')
      return
    }
    setForm((p) => ({
      ...p,
      items: [
        ...p.items,
        {
          practiceQuestion: q._id,
          marks: q.type === 'coding' ? 5 : 1,
          displayOrder: p.items.length,
          _title: q.title,
          _type: q.type,
        },
      ],
    }))
  }

  const save = async (andPublish = false) => {
    if (!form.title.trim() || !form.course) {
      notify.error('Title and course are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        course: form.course,
        category: form.category,
        status: form.status,
        passingPercentage: Number(form.passingPercentage),
        timeLimitMinutes: Number(form.timeLimitMinutes),
        maxAttempts: Number(form.maxAttempts),
        shuffleQuestions: form.shuffleQuestions,
        shuffleAnswers: form.shuffleAnswers,
        showResultImmediately: form.showResultImmediately,
        showCorrectAnswers: form.showCorrectAnswers,
        negativeMarking: form.negativeMarking,
        partialMarks: form.partialMarks,
        enableReview: form.enableReview,
        lockAfterSubmission: form.lockAfterSubmission,
        pauseDisabled: form.pauseDisabled,
        resumeSupport: form.resumeSupport,
        items: form.items.map(({ practiceQuestion, marks, displayOrder }) => ({
          practiceQuestion,
          marks: Number(marks) || 1,
          displayOrder,
        })),
        poolRules: form.poolRules,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      }
      let saved
      if (isEdit) saved = await quizService.update(id, payload)
      else saved = await quizService.create(payload)
      if (andPublish) {
        saved = await quizService.publish(saved._id)
        notify.success('Quiz published')
      } else {
        notify.success('Quiz saved')
      }
      navigate(`${base}/${saved._id}`)
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && isLoading) return <PageLoader />

  return (
    <PageTransition>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb
          items={[
            { label: 'Quizzes', to: base },
            { label: isEdit ? 'Edit' : 'New' },
          ]}
        />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{isEdit ? 'Edit quiz' : 'Create quiz'}</h1>
            <p className="text-sm text-muted-foreground">Pull questions from the bank or random pools.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={base}>Cancel</Link>
            </Button>
            <Button variant="outline" disabled={saving} onClick={() => save(false)}>
              Save draft
            </Button>
            <Button disabled={saving} onClick={() => save(true)}>
              Save & publish
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <Field label="Title">
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Course">
              <Select value={form.course || undefined} onValueChange={(v) => set('course', v)}>
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
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <Field label="Instructions">
              <Textarea value={form.instructions} onChange={(e) => set('instructions', e.target.value)} rows={4} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Pass %">
                <Input
                  type="number"
                  value={form.passingPercentage}
                  onChange={(e) => set('passingPercentage', e.target.value)}
                />
              </Field>
              <Field label="Time (min)">
                <Input
                  type="number"
                  value={form.timeLimitMinutes}
                  onChange={(e) => set('timeLimitMinutes', e.target.value)}
                />
              </Field>
              <Field label="Max attempts">
                <Input
                  type="number"
                  value={form.maxAttempts}
                  onChange={(e) => set('maxAttempts', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Start">
                <Input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => set('startAt', e.target.value)}
                />
              </Field>
              <Field label="End">
                <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {[
                ['shuffleQuestions', 'Shuffle questions'],
                ['shuffleAnswers', 'Shuffle answers'],
                ['showResultImmediately', 'Show result immediately'],
                ['showCorrectAnswers', 'Show correct answers'],
                ['negativeMarking', 'Negative marking'],
                ['partialMarks', 'Partial marks'],
                ['enableReview', 'Enable review'],
                ['resumeSupport', 'Resume support'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(e) => set(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-2 text-sm font-bold">Selected questions ({form.items.length})</h2>
              <ul className="max-h-56 space-y-2 overflow-auto text-sm">
                {form.items.map((it, idx) => (
                  <li key={`${it.practiceQuestion}-${idx}`} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{it._title}</p>
                      <Badge variant="secondary">{it._type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-16"
                        type="number"
                        value={it.marks}
                        onChange={(e) => {
                          const marks = e.target.value
                          setForm((p) => ({
                            ...p,
                            items: p.items.map((x, i) => (i === idx ? { ...x, marks } : x)),
                          }))
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
                {!form.items.length && (
                  <li className="text-xs text-muted-foreground">Add questions from the pool.</li>
                )}
              </ul>
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Random pool rule</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      poolRules: [
                        ...p.poolRules,
                        {
                          types: ['multiple_choice', 'true_false', 'fill_blank'],
                          difficulties: ['easy', 'medium'],
                          count: 2,
                          marksEach: 1,
                        },
                      ],
                    }))
                  }
                >
                  Add pool rule (+2 random)
                </Button>
                {form.poolRules.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {r.count} × {r.types?.join(',') || 'any'} @ {r.marksEach} marks
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-2 text-sm font-bold">Question bank</h2>
              <div className="mb-3 flex gap-2">
                <Select value={poolType} onValueChange={setPoolType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="multiple_choice">MCQ</SelectItem>
                    <SelectItem value="true_false">True / False</SelectItem>
                    <SelectItem value="fill_blank">Fill blank</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={poolDiff} onValueChange={setPoolDiff}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any difficulty</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ul className="max-h-72 space-y-2 overflow-auto text-sm">
                {(pool?.items || []).map((q) => (
                  <li key={q._id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5">
                    <div>
                      <p className="font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.type} · {q.difficulty}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addFromPool(q)}>
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
