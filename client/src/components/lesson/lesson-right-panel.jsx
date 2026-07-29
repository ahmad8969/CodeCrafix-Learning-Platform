import { Link } from 'react-router-dom'
import { Download, ExternalLink, FileText, NotebookPen, Sparkles, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DurationBadge } from '@/components/curriculum/badges'
import { cn } from '@/lib/utils'

export function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{resource.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {resource.description || resource.type}
          {resource.size ? ` · ${resource.size}` : ''}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 capitalize">
        {resource.type?.replace(/_/g, ' ')}
      </Badge>
    </a>
  )
}

export function NotesPanel({ value, onChange, onSave, onDelete, saving }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="inline-flex items-center gap-2 text-sm">
          <NotebookPen className="size-4" /> Personal notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          className="min-h-28"
          placeholder="Jot down ideas while you learn…"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving}>
            Save note
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-3.5" /> Clear
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Notes sync to your account when saved. Local drafts are kept while you type.
        </p>
      </CardContent>
    </Card>
  )
}

export function LessonRightPanel({
  topic,
  lesson,
  resources = [],
  related = [],
  lessonPath,
  note,
  onNoteChange,
  onNoteSave,
  onNoteDelete,
  noteSaving,
  className,
}) {
  const downloads = resources.filter((r) =>
    ['pdf', 'zip', 'downloadable', 'cheat_sheet', 'source_code'].includes(r.type)
  )
  const links = resources.filter((r) => !downloads.includes(r))

  return (
    <aside className={cn('space-y-4', className)}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Topic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{topic?.name || 'Topic'}</p>
          <p>{topic?.shortDescription || lesson?.summary || '—'}</p>
          <div className="flex flex-wrap gap-2">
            {topic?.difficulty && (
              <Badge variant="outline" className="capitalize">
                {topic.difficulty}
              </Badge>
            )}
            <DurationBadge value={lesson?.estimatedReadingTime || topic?.estimatedTime} />
          </div>
        </CardContent>
      </Card>

      {(topic?.learningObjectives || []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Learning objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {topic.learningObjectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-sm">
            <FileText className="size-4" /> Resources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.map((r) => (
            <ResourceCard key={r._id} resource={r} />
          ))}
          {links.length === 0 && <p className="text-xs text-muted-foreground">No links yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-sm">
            <Download className="size-4" /> Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {downloads.map((r) => (
            <ResourceCard key={r._id} resource={r} />
          ))}
          {downloads.length === 0 && (
            <p className="text-xs text-muted-foreground">No downloads attached.</p>
          )}
        </CardContent>
      </Card>

      <NotesPanel
        value={note}
        onChange={onNoteChange}
        onSave={onNoteSave}
        onDelete={onNoteDelete}
        saving={noteSaving}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="inline-flex items-center gap-2 text-sm">
            <Sparkles className="size-4" /> AI assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            AI study companion placeholder — arrives in a later prompt.
          </p>
          <Button size="sm" variant="outline" className="mt-2 w-full" disabled>
            Ask AI (soon)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Related lessons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {related.map((item) => (
            <Link
              key={item._id}
              to={lessonPath(item)}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40"
            >
              <span className="truncate">{item.title}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
          {related.length === 0 && (
            <p className="text-xs text-muted-foreground">No related lessons yet.</p>
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
