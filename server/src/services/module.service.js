const moduleRepo = require('../repositories/module.repository')
const { ApiError } = require('../utils/helpers')
const { slugify, parseListQuery } = require('../utils/query')
const { assertCourseAccess, publishedFilter } = require('../utils/curriculum-access')

async function createModule(payload, userId, reqContext) {
  await assertCourseAccess(payload.course, reqContext, { manage: true })
  const slug = slugify(payload.slug || payload.name)
  const displayOrder =
    payload.displayOrder ?? (await moduleRepo.nextOrder({ course: payload.course }))
  return moduleRepo.create({
    ...payload,
    slug,
    displayOrder,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateModule(id, payload, userId, reqContext) {
  const existing = await moduleRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Module not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  if (payload.name || payload.slug) {
    payload.slug = slugify(payload.slug || payload.name || existing.name)
  }
  payload.updatedBy = userId
  return moduleRepo.updateById(id, payload)
}

async function getModule(id, reqContext) {
  const existing = await moduleRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Module not found')
  await assertCourseAccess(existing.course, reqContext)
  if (reqContext.courseScope === 'published' && existing.status !== 'published') {
    throw new ApiError(403, 'Module not available')
  }
  return existing
}

async function listModules(query, reqContext) {
  const parsed = parseListQuery(query)
  if (!query.course) throw new ApiError(400, 'course query param is required')
  await assertCourseAccess(query.course, reqContext)
  const filters = {
    course: query.course,
    ...publishedFilter(reqContext),
  }
  if (query.status) filters.status = query.status
  return moduleRepo.list({ ...parsed, filters })
}

async function deleteModule(id, reqContext) {
  const existing = await moduleRepo.findById(id)
  if (!existing) throw new ApiError(404, 'Module not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return moduleRepo.softDelete(id)
}

async function restoreModule(id, reqContext) {
  const existing = await moduleRepo.findById(id, { includeDeleted: true })
  if (!existing || !existing.deletedAt) throw new ApiError(404, 'Deleted module not found')
  await assertCourseAccess(existing.course, reqContext, { manage: true })
  return moduleRepo.restore(id)
}

async function reorderModules(courseId, items, reqContext) {
  await assertCourseAccess(courseId, reqContext, { manage: true })
  return moduleRepo.reorder(items)
}

module.exports = {
  createModule,
  updateModule,
  getModule,
  listModules,
  deleteModule,
  restoreModule,
  reorderModules,
}
