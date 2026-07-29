const batchRepo = require('../repositories/batch.repository')
const courseRepo = require('../repositories/course.repository')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { parseListQuery } = require('../utils/query')
const { ROLES } = require('../constants')

async function assertTeacher(teacherId) {
  const user = await User.findById(teacherId)
  if (!user) throw new ApiError(400, 'Teacher not found')
  if (![ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    throw new ApiError(400, 'Batch teacher must be a teacher or admin account')
  }
  return user
}

async function createBatch(payload, userId) {
  const course = await courseRepo.findById(payload.course)
  if (!course) throw new ApiError(400, 'Course not found')
  await assertTeacher(payload.teacher)

  if (new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new ApiError(400, 'End date must be after start date')
  }

  try {
    return await batchRepo.create({
      ...payload,
      batchCode: String(payload.batchCode || '').toUpperCase(),
      createdBy: userId,
      updatedBy: userId,
    })
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Batch code already exists for this course')
    throw err
  }
}

async function updateBatch(id, payload, userId) {
  const batch = await batchRepo.findById(id)
  if (!batch) throw new ApiError(404, 'Batch not found')

  if (payload.teacher) await assertTeacher(payload.teacher)
  if (payload.course) {
    const course = await courseRepo.findById(payload.course)
    if (!course) throw new ApiError(400, 'Course not found')
  }
  if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new ApiError(400, 'End date must be after start date')
  }
  if (payload.batchCode) payload.batchCode = String(payload.batchCode).toUpperCase()

  payload.updatedBy = userId
  try {
    const updated = await batchRepo.updateById(id, payload)
    if (!updated) throw new ApiError(404, 'Batch not found')
    return updated
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Batch code already exists for this course')
    throw err
  }
}

async function getBatch(id, reqContext = {}) {
  const batch = await batchRepo.findById(id)
  if (!batch) throw new ApiError(404, 'Batch not found')

  if (reqContext.courseScope === 'assigned') {
    const teacherId = String(batch.teacher?._id || batch.teacher)
    if (teacherId !== String(reqContext.assignedUserId)) {
      throw new ApiError(403, 'You can only view assigned batches')
    }
  }
  return batch
}

async function listBatches(query, reqContext = {}) {
  const parsed = parseListQuery(query)
  return batchRepo.list({
    ...parsed,
    assignedTeacherId: reqContext.courseScope === 'assigned' ? reqContext.assignedUserId : null,
  })
}

async function deleteBatch(id) {
  const deleted = await batchRepo.softDelete(id)
  if (!deleted) throw new ApiError(404, 'Batch not found')
  return deleted
}

async function restoreBatch(id) {
  const restored = await batchRepo.restore(id)
  if (!restored) throw new ApiError(404, 'Deleted batch not found')
  return restored
}

module.exports = {
  createBatch,
  updateBatch,
  getBatch,
  listBatches,
  deleteBatch,
  restoreBatch,
}
