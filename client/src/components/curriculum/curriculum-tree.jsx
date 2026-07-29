import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CurriculumNodeCard } from '@/components/curriculum/node-card'
import { Badge } from '@/components/ui/badge'

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  )
}

export function CurriculumTree({
  tree = [],
  readOnly = false,
  onReorder,
  onAddChild,
  onEdit,
  onDelete,
  onOpenLesson,
  filters = {},
}) {
  const [expanded, setExpanded] = useState({})
  const [modules, setModules] = useState(tree)

  useEffect(() => {
    setModules(tree)
    if (tree.length && Object.keys(expanded).length === 0) {
      const next = {}
      tree.forEach((m) => {
        next[`module-${m._id}`] = true
        ;(m.weeks || []).forEach((w) => {
          next[`week-${w._id}`] = true
        })
      })
      setExpanded(next)
    }
  }, [tree])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const toggle = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }))

  const matchesFilters = (lesson, topic) => {
    if (filters.difficulty && topic.difficulty !== filters.difficulty) return false
    if (filters.lessonType && lesson.lessonType !== filters.lessonType) return false
    if (filters.status && lesson.status !== filters.status) return false
    if (filters.preview === 'true' && !lesson.previewAllowed) return false
    if (filters.preview === 'false' && lesson.previewAllowed) return false
    if (filters.maxTime && Number(lesson.estimatedReadingTime) > Number(filters.maxTime)) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = `${lesson.title} ${lesson.summary || ''} ${(topic.tags || []).join(' ')} ${(topic.keywords || []).join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  }

  const handleDragEnd = async (event, parentType, parentId, items, setItems) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i._id === active.id)
    const newIndex = items.findIndex((i) => i._id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      displayOrder: idx,
    }))
    setItems(next)
    await onReorder?.(parentType, parentId, next)
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) =>
          handleDragEnd(e, 'module', null, modules, (next) => {
            setModules(next)
          })
        }
      >
        <SortableContext items={modules.map((m) => m._id)} strategy={verticalListSortingStrategy}>
          {modules.map((mod) => (
            <SortableItem key={mod._id} id={mod._id}>
              {({ attributes, listeners }) => (
                <ModuleBranch
                  mod={mod}
                  expanded={expanded}
                  toggle={toggle}
                  readOnly={readOnly}
                  dragHandleProps={{ attributes, listeners }}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenLesson={onOpenLesson}
                  onReorder={onReorder}
                  matchesFilters={matchesFilters}
                  filters={filters}
                  setModules={setModules}
                />
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      {modules.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No curriculum yet. Add a module to begin.
        </p>
      )}
    </div>
  )
}

function ModuleBranch({
  mod,
  expanded,
  toggle,
  readOnly,
  dragHandleProps,
  onAddChild,
  onEdit,
  onDelete,
  onOpenLesson,
  onReorder,
  matchesFilters,
  filters,
  setModules,
}) {
  const [weeks, setWeeks] = useState(mod.weeks || [])
  useEffect(() => setWeeks(mod.weeks || []), [mod.weeks])
  const key = `module-${mod._id}`
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <CurriculumNodeCard
      title={mod.name}
      subtitle={mod.estimatedDuration || 'Module'}
      status={mod.status}
      duration={mod.estimatedDuration}
      expanded={!!expanded[key]}
      onToggle={() => toggle(key)}
      onAdd={!readOnly ? () => onAddChild?.('week', mod) : undefined}
      addLabel="Add week"
      onEdit={!readOnly ? () => onEdit?.('module', mod) : undefined}
      onDelete={!readOnly ? () => onDelete?.('module', mod) : undefined}
      dragHandleProps={dragHandleProps}
      readOnly={readOnly}
      depth={0}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={async (e) => {
          const { active, over } = e
          if (!over || active.id === over.id) return
          const oldIndex = weeks.findIndex((i) => i._id === active.id)
          const newIndex = weeks.findIndex((i) => i._id === over.id)
          const next = arrayMove(weeks, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            displayOrder: idx,
          }))
          setWeeks(next)
          setModules((prev) =>
            prev.map((m) => (m._id === mod._id ? { ...m, weeks: next } : m))
          )
          await onReorder?.('week', mod._id, next)
        }}
      >
        <SortableContext items={weeks.map((w) => w._id)} strategy={verticalListSortingStrategy}>
          {weeks.map((week) => (
            <SortableItem key={week._id} id={week._id}>
              {({ attributes, listeners }) => (
                <WeekBranch
                  week={week}
                  expanded={expanded}
                  toggle={toggle}
                  readOnly={readOnly}
                  dragHandleProps={{ attributes, listeners }}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenLesson={onOpenLesson}
                  onReorder={onReorder}
                  matchesFilters={matchesFilters}
                  filters={filters}
                />
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </CurriculumNodeCard>
  )
}

function WeekBranch({
  week,
  expanded,
  toggle,
  readOnly,
  dragHandleProps,
  onAddChild,
  onEdit,
  onDelete,
  onOpenLesson,
  onReorder,
  matchesFilters,
  filters,
}) {
  const [topics, setTopics] = useState(week.topics || [])
  useEffect(() => setTopics(week.topics || []), [week.topics])
  const key = `week-${week._id}`
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <CurriculumNodeCard
      title={week.name}
      subtitle={`Week ${week.weekNumber}`}
      status={week.status}
      duration={week.estimatedHours ? `${week.estimatedHours}h` : null}
      expanded={!!expanded[key]}
      onToggle={() => toggle(key)}
      onAdd={!readOnly ? () => onAddChild?.('topic', week) : undefined}
      addLabel="Add topic"
      onEdit={!readOnly ? () => onEdit?.('week', week) : undefined}
      onDelete={!readOnly ? () => onDelete?.('week', week) : undefined}
      dragHandleProps={dragHandleProps}
      readOnly={readOnly}
      depth={1}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={async (e) => {
          const { active, over } = e
          if (!over || active.id === over.id) return
          const oldIndex = topics.findIndex((i) => i._id === active.id)
          const newIndex = topics.findIndex((i) => i._id === over.id)
          const next = arrayMove(topics, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            displayOrder: idx,
          }))
          setTopics(next)
          await onReorder?.('topic', week._id, next)
        }}
      >
        <SortableContext items={topics.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {topics.map((topic) => (
            <SortableItem key={topic._id} id={topic._id}>
              {({ attributes, listeners }) => (
                <TopicBranch
                  topic={topic}
                  expanded={expanded}
                  toggle={toggle}
                  readOnly={readOnly}
                  dragHandleProps={{ attributes, listeners }}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onOpenLesson={onOpenLesson}
                  onReorder={onReorder}
                  matchesFilters={matchesFilters}
                  filters={filters}
                />
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </CurriculumNodeCard>
  )
}

function TopicBranch({
  topic,
  expanded,
  toggle,
  readOnly,
  dragHandleProps,
  onAddChild,
  onEdit,
  onDelete,
  onOpenLesson,
  onReorder,
  matchesFilters,
  filters,
}) {
  const filteredLessons = useMemo(
    () => (topic.lessons || []).filter((l) => matchesFilters(l, topic)),
    [topic, matchesFilters, filters]
  )
  const [lessons, setLessons] = useState(filteredLessons)
  useEffect(() => setLessons(filteredLessons), [filteredLessons])
  const key = `topic-${topic._id}`
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  return (
    <CurriculumNodeCard
      title={topic.name}
      subtitle={topic.shortDescription || topic.difficulty}
      status={topic.status}
      duration={topic.estimatedTime}
      expanded={!!expanded[key]}
      onToggle={() => toggle(key)}
      onAdd={!readOnly ? () => onAddChild?.('lesson', topic) : undefined}
      addLabel="Add lesson"
      onEdit={!readOnly ? () => onEdit?.('topic', topic) : undefined}
      onDelete={!readOnly ? () => onDelete?.('topic', topic) : undefined}
      dragHandleProps={dragHandleProps}
      readOnly={readOnly}
      depth={2}
    >
      <div className="mb-2 flex flex-wrap gap-1 pl-10">
        {(topic.tags || []).slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={async (e) => {
          const { active, over } = e
          if (!over || active.id === over.id) return
          const oldIndex = lessons.findIndex((i) => i._id === active.id)
          const newIndex = lessons.findIndex((i) => i._id === over.id)
          const next = arrayMove(lessons, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            displayOrder: idx,
          }))
          setLessons(next)
          await onReorder?.('lesson', topic._id, next)
        }}
      >
        <SortableContext items={lessons.map((l) => l._id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson) => (
            <SortableItem key={lesson._id} id={lesson._id}>
              {({ attributes, listeners }) => (
                <CurriculumNodeCard
                  title={lesson.title}
                  subtitle={lesson.lessonType?.replace(/_/g, ' ')}
                  status={lesson.status}
                  duration={lesson.estimatedReadingTime}
                  previewAllowed={lesson.previewAllowed}
                  expanded={false}
                  onToggle={() => onOpenLesson?.(lesson)}
                  onOpen={() => onOpenLesson?.(lesson)}
                  onEdit={!readOnly ? () => onEdit?.('lesson', lesson) : undefined}
                  onDelete={!readOnly ? () => onDelete?.('lesson', lesson) : undefined}
                  onAdd={
                    !readOnly
                      ? () => onAddChild?.('resource', lesson)
                      : undefined
                  }
                  addLabel="Add resource"
                  dragHandleProps={{ attributes, listeners }}
                  readOnly={readOnly}
                  depth={3}
                >
                  {(lesson.resources || []).length > 0 && (
                    <div className="space-y-1 pl-8">
                      {lesson.resources.map((res) => (
                        <div
                          key={res._id}
                          className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-1.5 text-xs"
                        >
                          <span>{res.title}</span>
                          <Badge variant="ghost">{res.type}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pl-8 text-[11px] text-muted-foreground">
                    <span>Practice (placeholder)</span>
                    <span>·</span>
                    <span>Assignment (placeholder)</span>
                    <span>·</span>
                    <span>Quiz (placeholder)</span>
                  </div>
                </CurriculumNodeCard>
              )}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
    </CurriculumNodeCard>
  )
}
