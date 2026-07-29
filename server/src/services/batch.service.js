const batchRepo = require('../repositories/batch.repository')
const courseRepo = require('../repositories/course.repository')
const User = require('../models/User')
const Enrollment = require('../models/Enrollment')
const { ApiError } = require('../utils/helpers')
const { parseListQuery } = require('../utils/query')
const { ROLES, BATCH_STATUS } = require('../constants')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')
const crypto = require('crypto')
const studentProgress = require('./student-progress.service')

async function assertTeacher(teacherId) {
  const user = await User.findById(teacherId)
  if (!user) throw new ApiError(400, 'Teacher not found')
  if (![ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user.role)) {
    throw new ApiError(400, 'Batch teacher must be a teacher or admin account')
  }
  return user
}

function normalizeSchedule(payload) {
  if (payload.weeklySchedule?.length) {
    payload.days = [...new Set(payload.weeklySchedule.map((s) => s.day))]
    if (!payload.classTime) payload.classTime = payload.weeklySchedule[0].startTime
  }
  return payload
}

async function createBatch(payload, userId) {
  const course = await courseRepo.findById(payload.course)
  if (!course) throw new ApiError(400, 'Course not found')
  await assertTeacher(payload.teacher)

  if (new Date(payload.endDate) < new Date(payload.startDate)) {
    throw new ApiError(400, 'End date must be after start date')
  }

  payload = normalizeSchedule({ ...payload })
  if (!payload.enrollmentCode) {
    payload.enrollmentCode = `B-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  }

  try {
    return await batchRepo.create({
      ...payload,
      batchCode: String(payload.batchCode || '').toUpperCase(),
      enrollmentCode: String(payload.enrollmentCode).toUpperCase(),
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
  if (payload.enrollmentCode) payload.enrollmentCode = String(payload.enrollmentCode).toUpperCase()
  payload = normalizeSchedule(payload)
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

async function archiveBatch(id, userId) {
  return updateBatch(id, { status: BATCH_STATUS.ARCHIVED }, userId)
}

async function cloneBatch(id, userId) {
  const src = await batchRepo.findById(id)
  if (!src) throw new ApiError(404, 'Batch not found')
  const obj = typeof src.toObject === 'function' ? src.toObject() : { ...src }
  delete obj._id
  delete obj.createdAt
  delete obj.updatedAt
  obj.name = `${obj.name} (Copy)`
  obj.batchCode = `${String(obj.batchCode).slice(0, 12)}-C`
  obj.enrollmentCode = `B-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  obj.currentStudents = 0
  obj.status = BATCH_STATUS.UPCOMING
  return createBatch(obj, userId)
}

async function listBatchStudents(batchId, reqContext) {
  await getBatch(batchId, reqContext)
  return Enrollment.find({
    batch: batchId,
    deletedAt: null,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.COMPLETED] },
  })
    .populate('student', 'fullName email phoneNumber profileImage')
    .sort({ enrolledAt: -1 })
    .lean()
}

async function getBatchAnalytics(batchId, reqContext) {
  await getBatch(batchId, reqContext)
  return studentProgress.batchPerformanceReport(batchId)
}

async function getScheduleCalendar(batchId, reqContext) {
  const batch = await getBatch(batchId, reqContext)
  const schedule = batch.weeklySchedule?.length
    ? batch.weeklySchedule
    : (batch.days || []).map((day) => ({
        day,
        startTime: batch.classTime || '10:00 AM',
        endTime: '12:00 PM',
      }))

  const dayIndex = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  const start = new Date(batch.startDate)
  const end = new Date(Math.min(new Date(batch.endDate).getTime(), Date.now() + 56 * 86400000))
  const events = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const name = Object.keys(dayIndex).find((k) => dayIndex[k] === d.getDay())
    for (const slot of schedule) {
      if (slot.day === name) {
        events.push({
          date: new Date(d).toISOString().slice(0, 10),
          day: slot.day,
          startTime: slot.startTime,
          endTime: slot.endTime,
          batchId: batch._id,
          title: batch.name,
        })
      }
    }
  }
  return { batchId, schedule, events }
}

module.exports = {
  createBatch,
  updateBatch,
  getBatch,
  listBatches,
  deleteBatch,
  restoreBatch,
  archiveBatch,
  cloneBatch,
  listBatchStudents,
  getBatchAnalytics,
  getScheduleCalendar,
}
