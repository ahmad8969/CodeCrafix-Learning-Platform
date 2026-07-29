const courseRepo = require('../repositories/course.repository')
const batchRepo = require('../repositories/batch.repository')
const categoryRepo = require('../repositories/category.repository')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { slugify, parseListQuery } = require('../utils/query')
const { COURSE_STATUS, ROLES } = require('../constants')

function assignedId(reqContext) {
  return reqContext?.courseScope === 'assigned' ? reqContext.assignedUserId : null
}

async function assertInstructor(instructorId) {
  const user = await User.findById(instructorId)
  if (!user) throw new ApiError(400, 'Instructor not found')
  if (![ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    throw new ApiError(400, 'Instructor must be a teacher or admin account')
  }
  return user
}

async function createCourse(payload, userId) {
  const category = await categoryRepo.findById(payload.category)
  if (!category) throw new ApiError(400, 'Category not found')

  await assertInstructor(payload.instructor)

  const slug = slugify(payload.slug || payload.title)
  const existing = await courseRepo.findBySlug(slug, { includeDeleted: true })
  if (existing && !existing.deletedAt) throw new ApiError(409, 'Course slug already exists')

  return courseRepo.create({
    ...payload,
    slug,
    createdBy: userId,
    updatedBy: userId,
  })
}

async function updateCourse(id, payload, userId, reqContext = {}) {
  const course = await courseRepo.findById(id)
  if (!course) throw new ApiError(404, 'Course not found')

  if (reqContext.courseScope === 'assigned') {
    throw new ApiError(403, 'Teachers cannot update courses')
  }

  if (payload.category) {
    const category = await categoryRepo.findById(payload.category)
    if (!category) throw new ApiError(400, 'Category not found')
  }
  if (payload.instructor) await assertInstructor(payload.instructor)

  if (payload.title || payload.slug) {
    const slug = slugify(payload.slug || payload.title || course.title)
    const existing = await courseRepo.findBySlug(slug, { includeDeleted: true })
    if (existing && String(existing._id) !== String(id) && !existing.deletedAt) {
      throw new ApiError(409, 'Course slug already exists')
    }
    payload.slug = slug
  }

  payload.updatedBy = userId
  return courseRepo.updateById(id, payload)
}

async function getCourse(id, reqContext = {}) {
  const course = await courseRepo.findById(id)
  if (!course) throw new ApiError(404, 'Course not found')

  if (reqContext.courseScope === 'assigned') {
    if (String(course.instructor?._id || course.instructor) !== String(reqContext.assignedUserId)) {
      throw new ApiError(403, 'You can only view assigned courses')
    }
  }
  if (reqContext.courseScope === 'published' && course.status !== COURSE_STATUS.PUBLISHED) {
    throw new ApiError(403, 'Course not available')
  }
  return course
}

async function listCourses(query, reqContext = {}) {
  const parsed = parseListQuery(query)
  if (reqContext.courseScope === 'published') {
    parsed.filters = { ...(parsed.filters || {}), status: COURSE_STATUS.PUBLISHED }
  }
  return courseRepo.list({
    ...parsed,
    assignedInstructorId: assignedId(reqContext),
  })
}

async function deleteCourse(id) {
  const deleted = await courseRepo.softDelete(id)
  if (!deleted) throw new ApiError(404, 'Course not found')
  return deleted
}

async function restoreCourse(id) {
  const restored = await courseRepo.restore(id)
  if (!restored) throw new ApiError(404, 'Deleted course not found')
  return restored
}

async function publishCourse(id, userId) {
  const course = await courseRepo.findById(id)
  if (!course) throw new ApiError(404, 'Course not found')
  return courseRepo.updateById(id, {
    status: COURSE_STATUS.PUBLISHED,
    publishedAt: course.publishedAt || new Date(),
    updatedBy: userId,
  })
}

async function archiveCourse(id, userId) {
  const course = await courseRepo.findById(id)
  if (!course) throw new ApiError(404, 'Course not found')
  return courseRepo.updateById(id, {
    status: COURSE_STATUS.ARCHIVED,
    updatedBy: userId,
  })
}

async function featureCourse(id, featured, userId) {
  const course = await courseRepo.findById(id)
  if (!course) throw new ApiError(404, 'Course not found')
  return courseRepo.updateById(id, {
    featured: Boolean(featured),
    updatedBy: userId,
  })
}

async function bulkUpdateStatus(ids = [], status, userId) {
  const results = []
  for (const id of ids) {
    const updated = await courseRepo.updateById(id, { status, updatedBy: userId })
    if (updated) results.push(updated)
  }
  return { count: results.length, items: results }
}

async function bulkSoftDelete(ids = []) {
  let count = 0
  for (const id of ids) {
    const deleted = await courseRepo.softDelete(id)
    if (deleted) count += 1
  }
  return { count }
}

async function getDashboardStats(reqContext = {}) {
  const assigned = assignedId(reqContext)
  const [courseStats, categories, activeBatches] = await Promise.all([
    courseRepo.getStats({ assignedInstructorId: assigned }),
    categoryRepo.list({
      page: 1,
      limit: 1,
      skip: 0,
      search: '',
      sortBy: 'createdAt',
      sortOrder: -1,
      includeDeleted: false,
      filters: {},
    }),
    batchRepo.countActive({ assignedTeacherId: assigned }),
  ])

  const trending = await courseRepo.list({
    page: 1,
    limit: 5,
    skip: 0,
    search: '',
    sortBy: 'updatedAt',
    sortOrder: -1,
    includeDeleted: false,
    filters: { trending: 'true', status: 'published' },
    assignedInstructorId: assigned,
  })

  return {
    totalCourses: courseStats.total,
    publishedCourses: courseStats.published,
    draftCourses: courseStats.draft,
    archivedCourses: courseStats.archived,
    categories: categories.pagination.total,
    activeBatches,
    trendingCourses: trending.items,
  }
}

module.exports = {
  createCourse,
  updateCourse,
  getCourse,
  listCourses,
  deleteCourse,
  restoreCourse,
  publishCourse,
  archiveCourse,
  featureCourse,
  bulkUpdateStatus,
  bulkSoftDelete,
  getDashboardStats,
}
