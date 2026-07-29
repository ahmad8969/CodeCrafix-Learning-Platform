const Module = require('../models/Module')
const Week = require('../models/Week')
const Topic = require('../models/Topic')
const Lesson = require('../models/Lesson')
const Resource = require('../models/Resource')
const moduleRepo = require('../repositories/module.repository')
const weekRepo = require('../repositories/week.repository')
const topicRepo = require('../repositories/topic.repository')
const lessonRepo = require('../repositories/lesson.repository')
const resourceRepo = require('../repositories/resource.repository')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')
const { ApiError } = require('../utils/helpers')
const mongoose = require('mongoose')

async function getTree(courseId, reqContext) {
  await assertCourseAccess(courseId, reqContext)
  const statusFilter = publishedFilter(reqContext)

  const [modules, weeks, topics, lessons, resources] = await Promise.all([
    Module.find({ course: courseId, deletedAt: null, ...statusFilter })
      .sort({ displayOrder: 1 })
      .lean(),
    Week.find({ course: courseId, deletedAt: null, ...statusFilter })
      .sort({ displayOrder: 1 })
      .lean(),
    Topic.find({ course: courseId, deletedAt: null, ...statusFilter })
      .sort({ displayOrder: 1 })
      .lean(),
    Lesson.find({ course: courseId, deletedAt: null, ...statusFilter })
      .sort({ displayOrder: 1 })
      .select('-content')
      .lean(),
    Resource.find({ course: courseId, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
  ])

  const lessonsByTopic = groupBy(lessons, 'topic')
  const resourcesByLesson = groupBy(resources, 'lesson')
  const topicsByWeek = groupBy(topics, 'week')
  const weeksByModule = groupBy(weeks, 'module')

  return modules.map((mod) => ({
    ...mod,
    type: 'module',
    weeks: (weeksByModule[String(mod._id)] || []).map((week) => ({
      ...week,
      type: 'week',
      topics: (topicsByWeek[String(week._id)] || []).map((topic) => ({
        ...topic,
        type: 'topic',
        lessons: (lessonsByTopic[String(topic._id)] || []).map((lesson) => ({
          ...lesson,
          type: 'lesson',
          resources: resourcesByLesson[String(lesson._id)] || [],
          practicePlaceholder: true,
          assignmentPlaceholder: true,
          quizPlaceholder: true,
        })),
      })),
    })),
  }))
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

async function searchCurriculum(courseId, query, reqContext) {
  await assertCourseAccess(courseId, reqContext)
  const q = String(query.search || query.q || '').trim()
  if (!q) throw new ApiError(400, 'search query is required')
  const statusFilter = publishedFilter(reqContext)
  const regex = new RegExp(q, 'i')

  const [modules, weeks, topics, lessons] = await Promise.all([
    Module.find({
      course: courseId,
      deletedAt: null,
      ...statusFilter,
      $or: [{ name: regex }, { description: regex }],
    })
      .limit(20)
      .lean(),
    Week.find({
      course: courseId,
      deletedAt: null,
      ...statusFilter,
      $or: [{ name: regex }, { description: regex }],
    })
      .limit(20)
      .lean(),
    Topic.find({
      course: courseId,
      deletedAt: null,
      ...statusFilter,
      $or: [{ name: regex }, { shortDescription: regex }, { tags: regex }, { keywords: regex }],
    })
      .limit(20)
      .lean(),
    Lesson.find({
      course: courseId,
      deletedAt: null,
      ...statusFilter,
      $or: [{ title: regex }, { summary: regex }],
    })
      .limit(20)
      .select('-content')
      .lean(),
  ])

  return {
    modules: modules.map((m) => ({ ...m, entityType: 'module' })),
    weeks: weeks.map((w) => ({ ...w, entityType: 'week' })),
    topics: topics.map((t) => ({ ...t, entityType: 'topic' })),
    lessons: lessons.map((l) => ({ ...l, entityType: 'lesson' })),
  }
}

async function getStats(courseId, reqContext) {
  await assertCourseAccess(courseId, reqContext)
  const base = { course: courseId, deletedAt: null }
  const oid = new mongoose.Types.ObjectId(String(courseId))
  const [modules, weeks, topics, lessons, publishedLessons, draftLessons, resources, hoursAgg] =
    await Promise.all([
      moduleRepo.count(base),
      weekRepo.count(base),
      topicRepo.count(base),
      lessonRepo.count(base),
      lessonRepo.count({ ...base, status: 'published' }),
      lessonRepo.count({ ...base, status: 'draft' }),
      resourceRepo.count(base),
      Week.aggregate([
        { $match: { course: oid, deletedAt: null } },
        { $group: { _id: null, hours: { $sum: '$estimatedHours' } } },
      ]),
    ])

  return {
    totalModules: modules,
    totalWeeks: weeks,
    totalTopics: topics,
    totalLessons: lessons,
    publishedLessons,
    draftLessons,
    resources,
    estimatedCourseDuration: hoursAgg[0]?.hours || 0,
  }
}

module.exports = { getTree, searchCurriculum, getStats }
