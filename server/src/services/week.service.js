const weekRepo = require('../repositories/week.repository')
const moduleRepo = require('../repositories/module.repository')
const { ApiError } = require('../utils/helpers')
const { parseListQuery } = require('../utils/query')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')

async function createWeek(payload, userId, reqContext) {
  const mod = await moduleRepo.findById(payload.module)
  if (!mod) throw new ApiError(400, 'Module not found')
  await assertCourseAccess(mod.course, reqContext, { manage: true })
  const displayOrder =
    payload.displayOrder ?? (await weekRepo.nextOrder({ module: payload.module }))
  return weekRepo.create({
    ...payload,
    course: mod.course,
    displayOrder,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateWeek(id, payload, userId, reqContext) {
  const existing = await weekRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Week not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  payload.updatedBy = userId
  return weekRepo.updateById(id, payload)
}

async function getWeek(id, reqContext) {
  const existing = await weekRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Week not found')
  await assertCourseAccess(existing.course, reqContext)
  if (reqContext.courseScope === 'published' && existing.status !== 'published') {
    throw new ApiError(403, 'Week not available')
  }
  return existing
}

async function listWeeks(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course && !query.module) throw new ApiError(400, 'course or module is required')
  if (query.course) await assertCourseAccess(query.course, reqContext)
  const filters = { ...publishedFilter(reqContext) }
  if (query.course) filters.course = query.course
  if (query.module) filters.module = query.module
  if (query.status) filters.status = query.status
  return weekRepo.list({ ...parsed, filters })
}

async function deleteWeek(id, reqContext) {
  const existing = await weekRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Week not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return weekRepo.softDelete(id)
}

async function restoreWeek(id, reqContext) {
  const existing = await weekRepo.findById(id, { includeDeleted: true })
  if (!existing || !existing.deletedAt) throw new ApiError(404, 'Deleted week not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return weekRepo.restore(id)
}

async function reorderWeeks(moduleId, items, reqContext) {
  const mod = await moduleRepo.findById(moduleId)
  if (!mod) throw new ApiError(404, 'Module not found')
  await assertCourseAccess(mod.course, reqContext, { manage: true })
  return weekRepo.reorder(items)
}

module.exports = {
  createWeek,
  updateWeek,
  getWeek,
  listWeeks,
  deleteWeek,
  restoreWeek,
  reorderWeeks,
}
