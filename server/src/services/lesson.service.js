const lessonRepo = require('../repositories/lesson.repository')
const topicRepo = require('../repositories/topic.repository')
const resourceRepo = require('../repositories/resource.repository')
const { ApiError } = require('../utils/helpers')
const { parseListQuery } = require('../utils/query')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')

async function createLesson(payload, userId, reqContext) {
  const topic = await topicRepo.findById(payload.topic)
  if (!topic) throw new ApiError(400, 'Topic not found')
  await assertCourseAccess(topic.course, reqContext, { manage: true })
  const displayOrder =
    payload.displayOrder ?? (await lessonRepo.nextOrder({ topic: payload.topic }))
  return lessonRepo.create({
    ...payload,
    course: topic.course,
    module: topic.module,
    week: topic.week,
    displayOrder,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateLesson(id, payload, userId, reqContext) {
  const existing = await lessonRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  payload.updatedBy = userId
  return lessonRepo.updateById(id, payload)
}

async function getLesson(id, reqContext) {
  const existing = await lessonRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(existing.course, reqContext)
  if (reqContext.courseScope === 'published') {
    if (existing.status !== 'published' && !existing.previewAllowed) {
      throw new ApiError(403, 'Lesson not available')
    }
  }
  const resources = await resourceRepo.list({
    page: 1,
    limit: 100,
    skip: 0,
    search: '',
    sortBy: 'displayOrder',
    sortOrder: 1,
    includeDeleted: false,
    filters: { lesson: existing._id },
  })
  const lesson = typeof existing.toObject === 'function' ? existing.toObject() : existing
  return { ...lesson, resources: resources.items }
}

async function listLessons(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course && !query.topic && !query.week && !query.module) {
    throw new ApiError(400, 'course, module, week, or topic is required')
  }
  if (query.course) await assertCourseAccess(query.course, reqContext)
  const filters = { ...publishedFilter(reqContext) }
  if (query.course) filters.course = query.course
  if (query.module) filters.module = query.module
  if (query.week) filters.week = query.week
  if (query.topic) filters.topic = query.topic
  if (query.status) filters.status = query.status
  if (query.lessonType) filters.lessonType = query.lessonType
  if (query.previewAllowed === 'true') filters.previewAllowed = true
  if (query.minReadingTime) filters.estimatedReadingTime = { $gte: Number(query.minReadingTime) }
  if (query.maxReadingTime) {
    filters.estimatedReadingTime = {
      ...(filters.estimatedReadingTime || {}),
      $lte: Number(query.maxReadingTime),
    }
  }
  return lessonRepo.list({ ...parsed, filters })
}

async function deleteLesson(id, reqContext) {
  const existing = await lessonRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return lessonRepo.softDelete(id)
}

async function restoreLesson(id, reqContext) {
  const existing = await lessonRepo.findById(id, { includeDeleted: true })
  if (!existing || !existing.deletedAt) throw new ApiError(404, 'Deleted lesson not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return lessonRepo.restore(id)
}

async function reorderLessons(topicId, items, reqContext) {
  const topic = await topicRepo.findById(topicId)
  if (!topic) throw new ApiError(404, 'Topic not found')
  await assertCourseAccess(topic.course, reqContext, { manage: true })
  return lessonRepo.reorder(items)
}

module.exports = {
  createLesson,
  updateLesson,
  getLesson,
  listLessons,
  deleteLesson,
  restoreLesson,
  reorderLessons,
}
