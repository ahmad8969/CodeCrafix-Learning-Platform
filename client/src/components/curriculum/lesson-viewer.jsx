import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bookmark, FileText, NotebookPen, ChartNoAxesCombined } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatusBadge, DurationBadge, PreviewBadge } from '@/components/curriculum/badges'
import { cn } from '@/lib/utils'

export function TreeNavigation({ tree = [], activeLessonId, lessonPathBuilder }) {
  const [open, setOpen] = useState({})

  return (
    <nav className="space-y-2 text-sm">
      {tree.map((mod) => (
        <div key={mod._id}>
          <button
            type="button"
            className="mb-1 w-full text-left font-semibold"
            onClick={() => setOpen((s) => ({ ...s, [mod._id]: !s[mod._id] }))}
          >
            {mod.name}
          </button>
          {(open[mod._id] !== false) &&
            (mod.weeks || []).map((week) => (
              <div key={week._id} className="mb-2 ml-2 border-l border-border pl-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{week.name}</p>
                {(week.topics || []).map((topic) => (
                  <div key={topic._id} className="mb-2">
                    <p className="text-xs font-semibold">{topic.name}</p>
                    <ul className="mt-1 space-y-1">
                      {(topic.lessons || []).map((lesson) => (
                        <li key={lesson._id}>
                          <Link
                            to={lessonPathBuilder(lesson)}
                            className={cn(
                              'block rounded-md px-2 py-1 text-xs hover:bg-muted',
                              activeLessonId === lesson._id && 'bg-primary/10 text-primary'
                            )}
                          >
                            {lesson.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
        </div>
      ))}
    </nav>
  )
}

export function ResourceCard({ resource }) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-start justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
    >
      <div>
        <p className="font-medium">{resource.title}</p>
        <p className="text-xs text-muted-foreground">{resource.description || resource.type}</p>
      </div>
      <Badge variant="outline">{resource.type}</Badge>
    </a>
  )
}

export function LessonViewer({
  course,
  lesson,
  tree = [],
  lessonPathBuilder,
  className,
}) {
  const resources = lesson?.resources || []

  const content = useMemo(() => lesson?.content || '', [lesson?.content])

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_260px]', className)}>
      <aside className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Curriculum
        </p>
        <TreeNavigation
          tree={tree}
          activeLessonId={lesson?._id}
          lessonPathBuilder={lessonPathBuilder}
        />
      </aside>

      <main className="min-w-0 rounded-2xl border border-border bg-card p-5 md:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={lesson?.status} />
          <DurationBadge value={lesson?.estimatedReadingTime} />
          <PreviewBadge allowed={lesson?.previewAllowed} />
          <Badge variant="outline" className="capitalize">
            {(lesson?.lessonType || '').replace(/_/g, ' ')}
          </Badge>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{lesson?.title}</h1>
        {lesson?.summary && <p className="mt-2 text-muted-foreground">{lesson.summary}</p>}
        <div className="prose-curriculum mt-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </main>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lesson info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Course: {course?.title}</p>
            <p>Reading time: {lesson?.estimatedReadingTime || 0} min</p>
            <p>Type: {(lesson?.lessonType || '').replace(/_/g, ' ')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm">
              <FileText className="size-4" /> Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resources.map((r) => (
              <ResourceCard key={r._id} resource={r} />
            ))}
            {resources.length === 0 && (
              <p className="text-xs text-muted-foreground">No resources for this lesson.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm">
              <Bookmark className="size-4" /> Bookmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="outline" className="w-full" disabled>
              Bookmark (placeholder)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm">
              <NotebookPen className="size-4" /> Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Notes placeholder — arrives later.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="inline-flex items-center gap-2 text-sm">
              <ChartNoAxesCombined className="size-4" /> Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Progress tracking placeholder.</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
