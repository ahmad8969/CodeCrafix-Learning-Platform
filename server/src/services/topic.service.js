const topicRepo = require('../repositories/topic.repository')
const weekRepo = require('../repositories/week.repository')
const { ApiError } = require('../utils/helpers')
const { slugify, parseListQuery } = require('../utils/query')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')

async function createTopic(payload, userId, reqContext) {
  const week = await weekRepo.findById(payload.week)
  if (!week) throw new ApiError(400, 'Week not found')
  await assertCourseAccess(week.course, reqContext, { manage: true })
  const slug = slugify(payload.slug || payload.name)
  const displayOrder = payload.displayOrder ?? (await topicRepo.nextOrder({ week: payload.week }))
  return topicRepo.create({
    ...payload,
    slug,
    course: week.course,
    module: week.module,
    displayOrder,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateTopic(id, payload, userId, reqContext) {
  const existing = await topicRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Topic not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  if (payload.name || payload.slug) {
    payload.slug = slugify(payload.slug || payload.name || existing.name)
  }
  payload.updatedBy = userId
  return topicRepo.updateById(id, payload)
}

async function getTopic(id, reqContext) {
  const existing = await topicRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Topic not found')
  await assertCourseAccess(existing.course, reqContext)
  if (reqContext.courseScope === 'published' && existing.status !== 'published') {
    throw new ApiError(403, 'Topic not available')
  }
  return existing
}

async function listTopics(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course && !query.week && !query.module) {
    throw new ApiError(400, 'course, module, or week is required')
  }
  if (query.course) await assertCourseAccess(query.course, reqContext)
  const filters = { ...publishedFilter(reqContext) }
  if (query.course) filters.course = query.course
  if (query.module) filters.module = query.module
  if (query.week) filters.week = query.week
  if (query.status) filters.status = query.status
  if (query.difficulty) filters.difficulty = query.difficulty
  if (query.tag) filters.tags = query.tag
  return topicRepo.list({ ...parsed, filters })
}

async function deleteTopic(id, reqContext) {
  const existing = await topicRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Topic not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return topicRepo.softDelete(id)
}

async function restoreTopic(id, reqContext) {
  const existing = await topicRepo.findById(id, { includeDeleted: true })
  if (!existing || !existing.deletedAt) throw new ApiError(404, 'Deleted topic not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return topicRepo.restore(id)
}

async function reorderTopics(weekId, items, reqContext) {
  const week = await weekRepo.findById(weekId)
  if (!week) throw new ApiError(404, 'Week not found')
  await assertCourseAccess(week.course, reqContext, { manage: true })
  return topicRepo.reorder(items)
}

module.exports = {
  createTopic,
  updateTopic,
  getTopic,
  listTopics,
  deleteTopic,
  restoreTopic,
  reorderTopics,
}
