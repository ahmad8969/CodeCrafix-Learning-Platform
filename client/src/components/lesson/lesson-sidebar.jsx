import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Lock, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function highlight(text, query) {
  if (!query?.trim()) return text
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="rounded bg-amber-400/30 px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  )
}

export function LessonSearchBox({ value, onChange, placeholder = 'Search lessons…' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export function LessonSidebar({
  tree = [],
  activeLessonId,
  lessonPath,
  completedIds = [],
  continueLesson,
  searchQuery = '',
  onSearchQueryChange,
  className,
}) {
  const [query, setQuery] = useState(searchQuery)
  const [openModules, setOpenModules] = useState({})

  const updateQuery = (value) => {
    setQuery(value)
    onSearchQueryChange?.(value)
  }

  const filteredTree = useMemo(() => {
    if (!query.trim()) return tree
    const q = query.toLowerCase()
    return tree
      .map((mod) => ({
        ...mod,
        weeks: (mod.weeks || [])
          .map((week) => ({
            ...week,
            topics: (week.topics || [])
              .map((topic) => ({
                ...topic,
                lessons: (topic.lessons || []).filter((lesson) => {
                  const hay = `${lesson.title} ${topic.name} ${(topic.tags || []).join(' ')} ${(topic.keywords || []).join(' ')}`.toLowerCase()
                  return hay.includes(q)
                }),
              }))
              .filter((t) => t.lessons.length),
          }))
          .filter((w) => w.topics.length),
      }))
      .filter((m) => m.weeks.length)
  }, [tree, query])

  return (
    <aside className={cn('flex h-full flex-col gap-3', className)}>
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Course curriculum
        </p>
        <LessonSearchBox value={query} onChange={updateQuery} />
      </div>

      {continueLesson && (
        <Button asChild size="sm" className="justify-start">
          <Link to={lessonPath(continueLesson)}>Continue learning</Link>
        </Button>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {filteredTree.map((mod) => {
          const open = openModules[mod._id] !== false
          return (
            <div key={mod._id}>
              <button
                type="button"
                className="mb-1 flex w-full items-center justify-between text-left text-sm font-semibold"
                onClick={() => setOpenModules((s) => ({ ...s, [mod._id]: !open }))}
              >
                <span className="truncate">{highlight(mod.name, query)}</span>
                <Badge variant="ghost" className="text-[10px]">
                  {(mod.weeks || []).length}w
                </Badge>
              </button>
              {open &&
                (mod.weeks || []).map((week) => (
                  <div key={week._id} className="mb-2 ml-1 border-l border-border pl-2">
                    <p className="mb-1 text-[11px] font-medium text-muted-foreground">
                      {highlight(week.name, query)}
                    </p>
                    {(week.topics || []).map((topic) => {
                      const locked = topic.status === 'draft'
                      return (
                        <div key={topic._id} className="mb-2">
                          <p className="flex items-center gap-1 text-xs font-semibold">
                            {locked ? <Lock className="size-3" /> : null}
                            {highlight(topic.name, query)}
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {(topic.lessons || []).map((lesson) => {
                              const done = completedIds.includes(lesson._id)
                              const active = activeLessonId === lesson._id
                              return (
                                <li key={lesson._id}>
                                  <Link
                                    to={lessonPath(lesson)}
                                    className={cn(
                                      'flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted',
                                      active && 'bg-primary/10 font-semibold text-primary'
                                    )}
                                  >
                                    {done ? (
                                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    ) : (
                                      <Circle className="size-3.5 text-muted-foreground" />
                                    )}
                                    <span className="truncate">{highlight(lesson.title, query)}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                ))}
            </div>
          )
        })}
        {filteredTree.length === 0 && (
          <p className="text-xs text-muted-foreground">No lessons match your search.</p>
        )}
      </div>
    </aside>
  )
}
