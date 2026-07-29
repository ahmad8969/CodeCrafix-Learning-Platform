import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { LessonHeader } from '@/components/lesson/lesson-header'
import { LessonContent } from '@/components/lesson/lesson-content'
import { LessonSidebar } from '@/components/lesson/lesson-sidebar'
import { LessonRightPanel } from '@/components/lesson/lesson-right-panel'
import { LessonNavigation } from '@/components/lesson/lesson-navigation'
import { ReadingProgress, estimateTimeRemaining } from '@/components/lesson/reading-progress'
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
  const [searchHighlight, setSearchHighlight] = useState('')

  useEffect(() => {
    setBookmarked(Boolean(bookmark))
    setNote(serverNote?.content || '')
    setProgress(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [lesson?._id, bookmark, serverNote?.content])

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

  return (
    <div className={cn('relative', className)}>
      <ReadingProgress targetRef={contentRef} onProgress={setProgress} />

      <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
        <Button type="button" size="sm" variant="outline" onClick={() => setLeftOpen(true)}>
          <Menu className="size-4" /> Curriculum
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setRightOpen(true)}>
          <PanelRight className="size-4" /> Details
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden min-h-[70vh] rounded-2xl border border-border bg-card/80 xl:block"
        >
          {sidebar}
        </motion.div>

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

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>~{remaining} min remaining</span>
            <span className="truncate">{courseTitle}</span>
          </div>

          <div className="mt-6">
            <LessonContent content={lesson.content} highlightQuery={searchHighlight} />
          </div>

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

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block"
        >
          {rightPanel}
        </motion.div>
      </div>

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
    </div>
  )
}
