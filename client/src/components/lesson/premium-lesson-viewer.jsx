import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Code2, Menu, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { LessonHeader } from '@/components/lesson/lesson-header'
import { LessonContent } from '@/components/lesson/lesson-content'
import { LessonSidebar } from '@/components/lesson/lesson-sidebar'
import { LessonRightPanel } from '@/components/lesson/lesson-right-panel'
import { LessonNavigation } from '@/components/lesson/lesson-navigation'
import { ReadingProgress, estimateTimeRemaining } from '@/components/lesson/reading-progress'
import { CodeWorkspace } from '@/components/workspace/code-workspace'
import { lessonShowsLiveCoding, getWorkspaceTypeMeta } from '@/config/workspace-types'
import { platformService } from '@/services/platform.service'
import { notify, getErrorMessage } from '@/utils/error'
import { lessonService } from '@/services/curriculum.service'
import { cn } from '@/lib/utils'

export function PremiumLessonViewer({
  experience,
  tree = [],
  courseTitle,
  breadcrumbItems = [],
  lessonPath,
  moduleHref,
  onRefresh,
  className,
}) {
  const {
    lesson,
    topic,
    week,
    module: moduleDoc,
    bookmark,
    note: serverNote,
    navigation,
    related = [],
  } = experience || {}

  const contentRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [bookmarked, setBookmarked] = useState(Boolean(bookmark))
  const [note, setNote] = useState(serverNote?.content || '')
  const [noteSaving, setNoteSaving] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [searchHighlight, setSearchHighlight] = useState('')
  const [showWorkspace, setShowWorkspace] = useState(true)
  const workspaceAnchorRef = useRef(null)

  const liveCoding = lessonShowsLiveCoding(lesson)
  const typeMeta = getWorkspaceTypeMeta(lesson?.workspaceType)

  useEffect(() => {
    setBookmarked(Boolean(bookmark))
    setNote(serverNote?.content || '')
    setProgress(0)
    setShowWorkspace(lessonShowsLiveCoding(lesson))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (lesson?._id) {
      platformService
        .trackProgress({
          eventType: 'lesson_started',
          lessonId: lesson._id,
          courseId: lesson.course,
        })
        .catch(() => {})
    }
  }, [lesson?._id, bookmark, serverNote?.content, lesson?.enableLiveCoding, lesson?.workspaceType, lesson?.course])

  const persistProgress = useCallback(
    async (value) => {
      if (!lesson?._id) return
      if (value < 5) return
      try {
        await lessonService.progress(lesson._id, {
          scrollPercent: Math.round(value),
          completed: value >= 92,
        })
      } catch {
        /* silent */
      }
    },
    [lesson?._id]
  )

  useEffect(() => {
    const id = setTimeout(() => persistProgress(progress), 1200)
    return () => clearTimeout(id)
  }, [progress, persistProgress])

  const remaining = estimateTimeRemaining(lesson?.estimatedReadingTime || 10, progress)

  const toggleBookmark = async () => {
    try {
      if (bookmarked) {
        await lessonService.unbookmark(lesson._id)
        setBookmarked(false)
        notify.success('Bookmark removed')
      } else {
        await lessonService.bookmark(lesson._id)
        setBookmarked(true)
        notify.success('Lesson bookmarked')
      }
      onRefresh?.()
    } catch (e) {
      notify.error(getErrorMessage(e))
    }
  }

  const saveNote = async () => {
    setNoteSaving(true)
    try {
      await lessonService.saveNote(lesson._id, note)
      notify.success('Note saved')
      onRefresh?.()
    } catch (e) {
      notify.error(getErrorMessage(e))
    } finally {
      setNoteSaving(false)
    }
  }

  const clearNote = async () => {
    setNote('')
    try {
      await lessonService.deleteNote(lesson._id)
      notify.success('Note cleared')
    } catch {
      /* may not exist yet */
    }
  }

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      notify.success('Link copied')
    } catch {
      notify.error('Unable to copy link')
    }
  }

  const completedIds = useMemo(() => [], [])

  if (!lesson) return null

  const sidebar = (
    <LessonSidebar
      tree={tree}
      activeLessonId={lesson._id}
      lessonPath={lessonPath}
      completedIds={completedIds}
      continueLesson={navigation?.nextInCourse}
      searchQuery={searchHighlight}
      onSearchQueryChange={setSearchHighlight}
      className="h-full p-4"
    />
  )

  const rightPanel = (
    <LessonRightPanel
      topic={topic}
      lesson={lesson}
      resources={lesson.resources || []}
      related={related}
      lessonPath={lessonPath}
      note={note}
      onNoteChange={setNote}
      onNoteSave={saveNote}
      onNoteDelete={clearNote}
      noteSaving={noteSaving}
    />
  )

  const lessonMain = (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-7"
      ref={contentRef}
    >
      <LessonHeader
        title={lesson.title}
        breadcrumbItems={breadcrumbItems}
        moduleName={moduleDoc?.name}
        weekName={week?.name}
        difficulty={topic?.difficulty}
        estimatedTime={lesson.estimatedReadingTime}
        updatedAt={lesson.updatedAt}
        readingProgress={progress}
        bookmarked={bookmarked}
        onBookmark={toggleBookmark}
        onShare={onShare}
        onPrint={() => window.print()}
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {typeMeta.label}
        </span>
        {typeMeta.showQuiz && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
            Quiz engine placeholder
          </span>
        )}
        {typeMeta.showAssignment && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
            Assignment placeholder
          </span>
        )}
        {typeMeta.showVideo && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
            Video player placeholder
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>~{remaining} min remaining</span>
        <div className="flex items-center gap-2">
          <span className="truncate">{courseTitle}</span>
          {liveCoding && (
            <Button
              size="sm"
              variant={showWorkspace ? 'secondary' : 'outline'}
              className="h-7"
              onClick={() => setShowWorkspace((v) => !v)}
            >
              <Code2 className="size-3.5" />
              {showWorkspace ? 'Hide lab' : 'Show lab'}
            </Button>
          )}
        </div>
      </div>

      {typeMeta.showVideo && lesson.videoUrl && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black/40 aspect-video">
          <iframe
            title="Lesson video"
            src={lesson.videoUrl}
            className="h-full w-full"
            allowFullScreen
          />
        </div>
      )}

      {lesson.solutionPlaceholder && (
        <p className="mt-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Solution is hidden until unlocked by your instructor (placeholder).
        </p>
      )}

      <div className="mt-6">
        <LessonContent content={lesson.content} highlightQuery={searchHighlight} />
      </div>

      {(typeMeta.showDiscussion || lesson.discussionEnabled) && (
        <section className="mt-8 space-y-2 border-t border-border pt-6">
          <h3 className="text-sm font-bold">Discussion</h3>
          <p className="text-xs text-muted-foreground">
            Lesson discussion is modular and optional — Q&amp;A, likes, pins, and best answers arrive in a
            future prompt. Architecture model: Discussion.
          </p>
        </section>
      )}

      <section className="mt-8 space-y-3 border-t border-border pt-6">
        <h3 className="text-sm font-bold">Related topics</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {navigation?.previousInCourse && (
            <Link
              to={lessonPath(navigation.previousInCourse)}
              className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/40"
            >
              Previous: {navigation.previousInCourse.title}
            </Link>
          )}
          {navigation?.nextInCourse && (
            <Link
              to={lessonPath(navigation.nextInCourse)}
              className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted/40"
            >
              Next: {navigation.nextInCourse.title}
            </Link>
          )}
        </div>
      </section>

      <LessonNavigation
        previous={navigation?.previousInCourse || navigation?.previousInTopic}
        next={navigation?.nextInCourse || navigation?.nextInTopic}
        moduleHref={moduleHref}
        continueHref={
          navigation?.nextInCourse ? lessonPath(navigation.nextInCourse) : undefined
        }
        lessonPath={lessonPath}
      />
    </motion.main>
  )

  return (
    <div className={cn('relative', className)}>
      <ReadingProgress targetRef={contentRef} onProgress={setProgress} />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 xl:hidden">
        <Button type="button" size="sm" variant="outline" onClick={() => setLeftOpen(true)}>
          <Menu className="size-4" /> Curriculum
        </Button>
        <div className="flex gap-2">
          {liveCoding && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                if (window.matchMedia('(max-width: 767px)').matches) {
                  setWorkspaceOpen(true)
                  return
                }
                workspaceAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              <Code2 className="size-4" /> Code lab
            </Button>
          )}
          {!liveCoding && (
            <Button type="button" size="sm" variant="outline" onClick={() => setRightOpen(true)}>
              <PanelRight className="size-4" /> Details
            </Button>
          )}
        </div>
      </div>

      {liveCoding && showWorkspace ? (
        <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_minmax(420px,1.15fr)]">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden min-h-[70vh] rounded-2xl border border-border bg-card/80 xl:block"
          >
            {sidebar}
          </motion.div>
          {lessonMain}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden min-h-[640px] xl:block"
          >
            <CodeWorkspace lessonId={lesson._id} className="h-full min-h-[640px]" />
          </motion.div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_280px]">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden min-h-[70vh] rounded-2xl border border-border bg-card/80 xl:block"
          >
            {sidebar}
          </motion.div>
          {lessonMain}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            {rightPanel}
          </motion.div>
        </div>
      )}

      {liveCoding && showWorkspace && (
        <div
          ref={workspaceAnchorRef}
          id="live-coding-workspace"
          className="mt-4 hidden scroll-mt-20 md:block xl:hidden"
        >
          <CodeWorkspace lessonId={lesson._id} className="min-h-[560px]" />
        </div>
      )}

      <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-sm overflow-auto p-0">
          <SheetHeader className="border-b border-border p-4 text-left text-sm font-bold">
            Curriculum
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <Sheet open={rightOpen} onOpenChange={setRightOpen}>
        <SheetContent side="right" className="w-[86vw] max-w-md overflow-auto p-4">
          {rightPanel}
        </SheetContent>
      </Sheet>

      <Sheet open={workspaceOpen} onOpenChange={setWorkspaceOpen}>
        <SheetContent side="right" className="w-[96vw] max-w-3xl overflow-auto p-2 md:hidden">
          {workspaceOpen ? (
            <CodeWorkspace lessonId={lesson._id} className="min-h-[70vh]" />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
