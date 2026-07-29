const Bookmark = require('../models/Bookmark')
const LessonView = require('../models/LessonView')
const LessonNote = require('../models/LessonNote')
const Lesson = require('../models/Lesson')
const Topic = require('../models/Topic')
const Module = require('../models/Module')
const Week = require('../models/Week')
const resourceRepo = require('../repositories/resource.repository')
const lessonRepo = require('../repositories/lesson.repository')
const { ApiError } = require('../utils/helpers')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')
const { parseListQuery } = require('../utils/query')

async function getLessonExperience(lessonId, userId, reqContext) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext, {
    requireEnrollment: reqContext.courseScope === 'published',
  })
  if (reqContext.courseScope === 'published') {
    if (lesson.status !== 'published' && !lesson.previewAllowed) {
      throw new ApiError(403, 'Lesson not available')
    }
    // Learning path gate
    if (lesson.topic && userId) {
      const learningPath = require('./learning-path.service')
      const access = await learningPath.evaluateTopicAccess(userId, lesson.topic)
      if (!access.unlocked) {
        throw new ApiError(403, access.reason || 'Topic is locked by learning path rules')
      }
    }
  }

  const [topic, week, moduleDoc, resources, bookmark, note, view] = await Promise.all([
    Topic.findById(lesson.topic).lean(),
    Week.findById(lesson.week).lean(),
    Module.findById(lesson.module).lean(),
    resourceRepo.list({
      page: 1,
      limit: 100,
      skip: 0,
      search: '',
      sortBy: 'displayOrder',
      sortOrder: 1,
      includeDeleted: false,
      filters: { lesson: lesson._id },
    }),
    userId
      ? Bookmark.findOne({ user: userId, lesson: lessonId }).lean()
      : null,
    userId ? LessonNote.findOne({ user: userId, lesson: lessonId }).lean() : null,
    userId ? LessonView.findOne({ user: userId, lesson: lessonId }).lean() : null,
  ])

  const siblings = await Lesson.find({
    topic: lesson.topic,
    deletedAt: null,
    ...publishedFilter(reqContext),
  })
    .sort({ displayOrder: 1 })
    .select('title displayOrder status previewAllowed estimatedReadingTime lessonType')
    .lean()

  const idx = siblings.findIndex((l) => String(l._id) === String(lessonId))
  const previousLesson = idx > 0 ? siblings[idx - 1] : null
  const nextLesson = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  const related = await Lesson.find({
    course: lesson.course,
    _id: { $ne: lesson._id },
    deletedAt: null,
    ...publishedFilter(reqContext),
    $or: [{ topic: lesson.topic }, { module: lesson.module }],
  })
    .limit(6)
    .select('title estimatedReadingTime lessonType status topic previewAllowed')
    .lean()

  // Flat course lesson order for continue / cross-topic nav
  const courseLessons = await Lesson.find({
    course: lesson.course,
    deletedAt: null,
    ...publishedFilter(reqContext),
  })
    .sort({ module: 1, week: 1, topic: 1, displayOrder: 1 })
    .select('title topic module week displayOrder status previewAllowed')
    .lean()

  const courseIdx = courseLessons.findIndex((l) => String(l._id) === String(lessonId))
  const continueLesson =
    courseIdx >= 0 && courseIdx < courseLessons.length - 1 ? courseLessons[courseIdx + 1] : null
  const previousCourseLesson = courseIdx > 0 ? courseLessons[courseIdx - 1] : null

  const lessonObj = typeof lesson.toObject === 'function' ? lesson.toObject() : lesson

  if (userId) {
    await LessonView.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      {
        user: userId,
        lesson: lessonId,
        course: lesson.course,
        lastViewedAt: new Date(),
        $setOnInsert: { scrollPercent: 0, completed: false },
      },
      { upsert: true, new: true }
    )
  }

  return {
    lesson: { ...lessonObj, resources: resources.items },
    topic,
    week,
    module: moduleDoc,
    bookmark: bookmark || null,
    note: note || null,
    progress: view || null,
    navigation: {
      previousInTopic: previousLesson,
      nextInTopic: nextLesson,
      previousInCourse: previousCourseLesson,
      nextInCourse: continueLesson || nextLesson,
      siblings,
    },
    related,
  }
}

async function getLessonResources(lessonId, reqContext) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)
  return resourceRepo.list({
    page: 1,
    limit: 100,
    skip: 0,
    search: '',
    sortBy: 'displayOrder',
    sortOrder: 1,
    includeDeleted: false,
    filters: { lesson: lesson._id },
  })
}

async function getRelatedLessons(lessonId, reqContext) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)
  const related = await Lesson.find({
    course: lesson.course,
    _id: { $ne: lesson._id },
    deletedAt: null,
    ...publishedFilter(reqContext),
    $or: [{ topic: lesson.topic }, { module: lesson.module }],
  })
    .limit(8)
    .select('title estimatedReadingTime lessonType status topic')
    .lean()
  return related
}

async function searchLessons(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course) throw new ApiError(400, 'course is required')
  await assertCourseAccess(query.course, reqContext)
  const filters = {
    course: query.course,
    ...publishedFilter(reqContext),
  }
  if (query.status) filters.status = query.status
  if (query.lessonType) filters.lessonType = query.lessonType
  if (query.tag) {
    // tag search via topic join — simple content search fallback
  }
  const result = await lessonRepo.list({ ...parsed, filters })

  // Enrich with topic tags for client highlight
  const topicIds = [...new Set(result.items.map((i) => String(i.topic)))]
  const topics = await Topic.find({ _id: { $in: topicIds } })
    .select('name tags keywords')
    .lean()
  const topicMap = Object.fromEntries(topics.map((t) => [String(t._id), t]))
  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      topicMeta: topicMap[String(item.topic)] || null,
    })),
  }
}

async function addBookmark(userId, lessonId) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  if (lesson.bookmarksEnabled === false) throw new ApiError(400, 'Bookmarks disabled for this lesson')
  try {
    return await Bookmark.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      { user: userId, lesson: lessonId, course: lesson.course },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  } catch (err) {
    if (err.code === 11000) {
      return Bookmark.findOne({ user: userId, lesson: lessonId })
    }
    throw err
  }
}

async function removeBookmark(userId, lessonId) {
  const removed = await Bookmark.findOneAndDelete({ user: userId, lesson: lessonId })
  if (!removed) throw new ApiError(404, 'Bookmark not found')
  return removed
}

async function listBookmarks(userId, query = {}) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const filter = { user: userId }
  if (query.course) filter.course = query.course
  const [items, total] = await Promise.all([
    Bookmark.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'lesson',
        select: 'title estimatedReadingTime lessonType status course topic',
      })
      .populate({ path: 'course', select: 'title slug' })
      .lean(),
    Bookmark.countDocuments(filter),
  ])
  return {
    items,
    pagination: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
  }
}

async function updateProgress(userId, lessonId, { scrollPercent, completed } = {}) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  const update = { lastViewedAt: new Date() }
  if (scrollPercent != null) update.scrollPercent = Math.min(100, Math.max(0, Number(scrollPercent)))
  if (completed != null) update.completed = Boolean(completed)
  const view = await LessonView.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    { ...update, user: userId, lesson: lessonId, course: lesson.course },
    { upsert: true, new: true }
  )
  if (completed) {
    const progressService = require('./progress.service')
    await progressService.trackProgress({
      userId,
      courseId: lesson.course,
      lessonId,
      eventType: 'lesson_completed',
      value: 1,
    })
    const learningPath = require('./learning-path.service')
    const studentProgress = require('./student-progress.service')
    if (await learningPath.isTopicCompleted(userId, lesson.topic)) {
      await learningPath.markTopicCompleted(userId, lesson.topic, lesson.course)
    }
    await studentProgress.recomputeStudentProgress(userId, lesson.course)
  }
  return view
}

async function getRecentlyViewed(userId, limit = 5) {
  return LessonView.find({ user: userId })
    .sort({ lastViewedAt: -1 })
    .limit(limit)
    .populate({ path: 'lesson', select: 'title estimatedReadingTime status course' })
    .populate({ path: 'course', select: 'title slug' })
    .lean()
}

async function getLearningDashboard(userId) {
  const studentProgress = require('./student-progress.service')
  const [bookmarksCount, recent, continueLearning] = await Promise.all([
    Bookmark.countDocuments({ user: userId }),
    getRecentlyViewed(userId, 5),
    studentProgress.getContinueLearning(userId),
  ])
  const summary = await require('./progress.service').summaryForUser(userId)
  return {
    bookmarksCount,
    recentlyViewed: recent,
    continueLearning: continueLearning || null,
    learningStreakPlaceholder: summary.byType?.daily_streak?.total || 0,
  }
}

/** Notes placeholder — local-first UI; optional persistence stub */
async function upsertNote(userId, lessonId, content) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  return LessonNote.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    { user: userId, lesson: lessonId, course: lesson.course, content: content || '' },
    { upsert: true, new: true }
  )
}

async function getNote(userId, lessonId) {
  return LessonNote.findOne({ user: userId, lesson: lessonId }).lean()
}

async function deleteNote(userId, lessonId) {
  const removed = await LessonNote.findOneAndDelete({ user: userId, lesson: lessonId })
  if (!removed) throw new ApiError(404, 'Note not found')
  return removed
}

module.exports = {
  getLessonExperience,
  getLessonResources,
  getRelatedLessons,
  searchLessons,
  addBookmark,
  removeBookmark,
  listBookmarks,
  updateProgress,
  getRecentlyViewed,
  getLearningDashboard,
  upsertNote,
  getNote,
  deleteNote,
}
