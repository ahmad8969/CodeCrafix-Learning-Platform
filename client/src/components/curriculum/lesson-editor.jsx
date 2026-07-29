import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Table,
  Maximize2,
  Minimize2,
  Eye,
  Pencil,
  Image as ImageIcon,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { LESSON_TYPES } from '@/lib/curriculum-schemas'
import { cn } from '@/lib/utils'

function insertAround(textarea, before, after = before) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = textarea.value
  const selected = value.slice(start, end) || 'text'
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  return { next, cursor: start + before.length + selected.length + after.length }
}

export function LessonEditor({
  value,
  onChange,
  onAutoSave,
  saving = false,
  className,
}) {
  const [mode, setMode] = useState('write')
  const [fullscreen, setFullscreen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!onAutoSave) return undefined
    const id = setInterval(() => {
      if (value?.title?.trim()) onAutoSave(value)
    }, 20000)
    return () => clearInterval(id)
  }, [onAutoSave, value])

  const apply = (before, after) => {
    const el = ref.current
    if (!el) return
    const { next, cursor } = insertAround(el, before, after)
    onChange({ ...value, content: next })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(cursor, cursor)
    })
  }

  const tools = [
    { icon: Bold, action: () => apply('**', '**'), label: 'Bold' },
    { icon: Italic, action: () => apply('_', '_'), label: 'Italic' },
    { icon: Heading2, action: () => apply('\n## ', '\n'), label: 'Heading' },
    { icon: List, action: () => apply('\n- ', ''), label: 'List' },
    { icon: ListOrdered, action: () => apply('\n1. ', ''), label: 'Ordered' },
    { icon: Quote, action: () => apply('\n> ', '\n'), label: 'Quote' },
    { icon: Code2, action: () => apply('\n```js\n', '\n```\n'), label: 'Code' },
    { icon: Link2, action: () => apply('[', '](https://)'), label: 'Link' },
    { icon: ImageIcon, action: () => apply('![alt](', ')'), label: 'Image' },
    { icon: Video, action: () => apply('\n<iframe src="', '"></iframe>\n'), label: 'Video' },
    {
      icon: Table,
      action: () => apply('\n| Col | Col |\n| --- | --- |\n| A | B |\n', ''),
      label: 'Table',
    },
  ]

  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl border border-border bg-card p-4',
        fullscreen && 'fixed inset-3 z-50 overflow-auto bg-background p-6 shadow-elevation-3',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === 'write' ? 'primary' : 'outline'}
            onClick={() => setMode('write')}
          >
            <Pencil className="size-3.5" /> Write
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'preview' ? 'primary' : 'outline'}
            onClick={() => setMode('preview')}
          >
            <Eye className="size-3.5" /> Preview
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="ghost">{saving ? 'Saving…' : 'Auto-save on'}</Badge>
          <Badge variant="outline">Version history (placeholder)</Badge>
          <Button type="button" size="icon" variant="ghost" onClick={() => setFullscreen((v) => !v)}>
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Title</Label>
          <Input
            value={value.title || ''}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Lesson type</Label>
          <Select
            value={value.lessonType || 'markdown'}
            onValueChange={(v) => onChange({ ...value, lessonType: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LESSON_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={value.status || 'draft'}
            onValueChange={(v) => onChange({ ...value, status: v })}
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
        </div>
        <div className="space-y-2">
          <Label>Estimated reading time (min)</Label>
          <Input
            type="number"
            value={value.estimatedReadingTime ?? 5}
            onChange={(e) => onChange({ ...value, estimatedReadingTime: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Input
            value={value.summary || ''}
            onChange={(e) => onChange({ ...value, summary: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(value.previewAllowed)}
            onCheckedChange={(v) => onChange({ ...value, previewAllowed: Boolean(v) })}
          />
          Preview allowed
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={value.bookmarksEnabled !== false}
            onCheckedChange={(v) => onChange({ ...value, bookmarksEnabled: Boolean(v) })}
          />
          Bookmarks enabled
        </label>
      </div>

      {mode === 'write' && (
        <>
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-2">
            {tools.map(({ icon: Icon, action, label }) => (
              <Button key={label} type="button" size="icon" variant="ghost" className="size-8" onClick={action} title={label}>
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
          <Textarea
            ref={ref}
            className="min-h-[320px] font-mono text-sm"
            value={value.content || ''}
            onChange={(e) => onChange({ ...value, content: e.target.value })}
            placeholder="Write markdown, callouts (> note), code fences, tables…"
          />
        </>
      )}

      {mode === 'preview' && (
        <div className="prose-curriculum min-h-[320px] rounded-xl border border-border bg-background p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value.content || '_Nothing to preview_'}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
