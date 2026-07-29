const resourceRepo = require('../repositories/resource.repository')
const lessonRepo = require('../repositories/lesson.repository')
const { ApiError } = require('../utils/helpers')
const { parseListQuery } = require('../utils/query')
const { assertCourseAccess } = require('../utils/curriculum-access')

async function createResource(payload, userId, reqContext) {
  const lesson = await lessonRepo.findById(payload.lesson)
  if (!lesson) throw new ApiError(400, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext, { manage: true })
  const displayOrder =
    payload.displayOrder ?? (await resourceRepo.nextOrder({ lesson: payload.lesson }))
  return resourceRepo.create({
    ...payload,
    course: lesson.course,
    topic: lesson.topic,
    displayOrder,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateResource(id, payload, userId, reqContext) {
  const existing = await resourceRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Resource not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  payload.updatedBy = userId
  return resourceRepo.updateById(id, payload)
}

async function getResource(id, reqContext) {
  const existing = await resourceRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Resource not found')
  await assertCourseAccess(existing.course, reqContext)
  return existing
}

async function listResources(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course && !query.lesson) throw new ApiError(400, 'course or lesson is required')
  if (query.course) await assertCourseAccess(query.course, reqContext)
  const filters = {}
  if (query.course) filters.course = query.course
  if (query.lesson) filters.lesson = query.lesson
  if (query.type) filters.type = query.type
  if (query.visibility) filters.visibility = query.visibility
  return resourceRepo.list({ ...parsed, filters })
}

async function deleteResource(id, reqContext) {
  const existing = await resourceRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Resource not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return resourceRepo.softDelete(id)
}

async function restoreResource(id, reqContext) {
  const existing = await resourceRepo.findById(id, { includeDeleted: true })
  if (!existing || !existing.deletedAt) throw new ApiError(404, 'Deleted resource not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return resourceRepo.restore(id)
}

async function reorderResources(lessonId, items, reqContext) {
  const lesson = await lessonRepo.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext, { manage: true })
  return resourceRepo.reorder(items)
}

module.exports = {
  createResource,
  updateResource,
  getResource,
  listResources,
  deleteResource,
  restoreResource,
  reorderResources,
}
