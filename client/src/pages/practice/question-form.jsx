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
import { practiceService } from '@/services/practice.service'
import { useAuth } from '@/contexts/auth-context'
import { ROLES, ROUTES } from '@/constants'
import { notify, getErrorMessage } from '@/utils/error'
import { PageLoader } from '@/components/loaders'

function practiceBase(role) {
  if (role === ROLES.TEACHER) return `${ROUTES.TEACHER}/practice`
  if (role === ROLES.SUPER_ADMIN) return `${ROUTES.SUPER_ADMIN}/practice`
  return `${ROUTES.ADMIN}/practice`
}

const emptyCoding = {
  title: '',
  type: 'coding',
  difficulty: 'easy',
  status: 'draft',
  category: 'General',
  description: '',
  xpReward: 50,
  primaryLanguageId: 'html',
  languageIds: ['html', 'css', 'javascript'],
  executionEngine: 'browser',
  constraints: '',
  expectedOutput: '',
  starterFiles: [
    { path: 'index.html', language: 'html', entry: true, content: '<!DOCTYPE html>\n<html><body><h1>Start</h1><script src="script.js"></script></body></html>' },
    { path: 'script.js', language: 'javascript', entry: false, content: 'console.log("hello");\n' },
  ],
  testCases: [
    {
      id: 't1',
      label: 'Public check',
      visibility: 'public',
      assertion: 'file_contains',
      targetPath: 'index.html',
      pattern: 'h1',
      weight: 1,
    },
  ],
  hints: [],
  options: [],
}

const emptyMcq = {
  title: '',
  type: 'multiple_choice',
  difficulty: 'easy',
  status: 'draft',
  category: 'General',
  description: '',
  xpReward: 40,
  options: [
    { id: 'a', label: 'Option A', isCorrect: true },
    { id: 'b', label: 'Option B', isCorrect: false },
    { id: 'c', label: 'Option C', isCorrect: false },
    { id: 'd', label: 'Option D', isCorrect: false },
  ],
  allowMultipleAnswers: false,
  hints: [],
  testCases: [],
  starterFiles: [],
}

export default function PracticeQuestionFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id) && id !== 'new'
  const { user } = useAuth()
  const base = practiceBase(user?.role)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyCoding)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['practice-question-edit', id],
    queryFn: () => practiceService.get(id),
    enabled: isEdit,
  })

  useEffect(() => {
    if (data) {
      setForm({
        ...emptyCoding,
        ...data,
        options: (data.options || []).map((o) => ({
          id: o.id,
          label: o.label,
          isCorrect: Boolean(o.isCorrect),
        })),
      })
    }
  }, [data])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onTypeChange = (type) => {
    setForm(type === 'multiple_choice' ? { ...emptyMcq, title: form.title } : { ...emptyCoding, title: form.title })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        xpReward: Number(form.xpReward) || 0,
      }
      if (isEdit) {
        await practiceService.update(id, payload)
        notify.success('Question updated')
      } else {
        const created = await practiceService.create(payload)
        notify.success('Question created')
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
        <Breadcrumb
          items={[
            { label: 'Practice', to: base },
            { label: isEdit ? 'Edit' : 'New question' },
          ]}
        />
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit question' : 'Create question'}</h1>

        <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={onTypeChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Input value={form.category || ''} onChange={(e) => set('category', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>XP Reward</Label>
              <Input
                type="number"
                value={form.xpReward}
                onChange={(e) => set('xpReward', e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Description (Markdown)</Label>
            <Textarea
              rows={8}
              value={form.description || ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {form.type === 'multiple_choice' && (
            <div className="space-y-3">
              <Label>Options</Label>
              {(form.options || []).map((opt, idx) => (
                <div key={opt.id || idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(opt.isCorrect)}
                    onChange={(e) => {
                      const options = [...form.options]
                      options[idx] = { ...opt, isCorrect: e.target.checked }
                      set('options', options)
                    }}
                  />
                  <Input
                    value={opt.label}
                    onChange={(e) => {
                      const options = [...form.options]
                      options[idx] = { ...opt, label: e.target.value }
                      set('options', options)
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {form.type === 'coding' && (
            <div className="space-y-3">
              <Label>Test cases (JSON)</Label>
              <Textarea
                rows={8}
                value={JSON.stringify(form.testCases || [], null, 2)}
                onChange={(e) => {
                  try {
                    set('testCases', JSON.parse(e.target.value))
                  } catch {
                    /* ignore while typing */
                  }
                }}
              />
              <Label>Starter files (JSON)</Label>
              <Textarea
                rows={8}
                value={JSON.stringify(form.starterFiles || [], null, 2)}
                onChange={(e) => {
                  try {
                    set('starterFiles', JSON.parse(e.target.value))
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving || !form.title}>
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
