const Announcement = require('../models/Announcement')
const Enrollment = require('../models/Enrollment')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { parseListQuery, buildPagedResult } = require('../utils/query')
const { ROLES } = require('../constants')
const {
  ANNOUNCEMENT_STATUS,
  ANNOUNCEMENT_AUDIENCE,
  LIVE_NOTIFY,
} = require('../constants/live-class')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')
const notificationService = require('./notification.service')

async function resolveAudienceUserIds(announcement) {
  const ids = new Set()
  if (announcement.audience === ANNOUNCEMENT_AUDIENCE.ALL_STUDENTS) {
    const students = await User.find({ role: ROLES.STUDENT, status: 'active' }).select('_id').limit(1000).lean()
    students.forEach((s) => ids.add(String(s._id)))
  } else if (announcement.audience === ANNOUNCEMENT_AUDIENCE.COURSE && announcement.course) {
    const enrollments = await Enrollment.find({
      course: announcement.course,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
      .select('student')
      .lean()
    enrollments.forEach((e) => ids.add(String(e.student)))
  } else if (announcement.audience === ANNOUNCEMENT_AUDIENCE.BATCH && announcement.batch) {
    const enrollments = await Enrollment.find({
      batch: announcement.batch,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
      .select('student')
      .lean()
    enrollments.forEach((e) => ids.add(String(e.student)))
  } else if (announcement.audience === ANNOUNCEMENT_AUDIENCE.TEACHER) {
    ;(announcement.teachers || []).forEach((t) => ids.add(String(t)))
  } else if (announcement.audience === ANNOUNCEMENT_AUDIENCE.INDIVIDUAL) {
    ;(announcement.students || []).forEach((s) => ids.add(String(s)))
  }
  return [...ids]
}

async function createAnnouncement(payload, userId) {
  return Announcement.create({ ...payload, createdBy: userId, updatedBy: userId })
}

async function updateAnnouncement(id, payload, userId) {
  const doc = await Announcement.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...payload, updatedBy: userId },
    { new: true, runValidators: true }
  )
  if (!doc) throw new ApiError(404, 'Announcement not found')
  return doc
}

async function publishAnnouncement(id, userId) {
  const doc = await Announcement.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, 'Announcement not found')
  doc.status = ANNOUNCEMENT_STATUS.PUBLISHED
  doc.publishedAt = new Date()
  doc.updatedBy = userId
  await doc.save()

  const userIds = await resolveAudienceUserIds(doc)
  await Promise.all(
    userIds.map((userId) =>
      notificationService.notifyUser({
        userId,
        templateKey: LIVE_NOTIFY.ANNOUNCEMENT_PUBLISHED,
        title: doc.title,
        body: (doc.body || '').slice(0, 180),
        link: `/student/announcements/${doc._id}`,
        meta: { announcementId: doc._id, priority: doc.priority },
      })
    )
  )
  return doc
}

async function archiveAnnouncement(id, userId) {
  return updateAnnouncement(id, { status: ANNOUNCEMENT_STATUS.ARCHIVED }, userId)
}

async function deleteAnnouncement(id) {
  const doc = await Announcement.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date(), status: ANNOUNCEMENT_STATUS.ARCHIVED },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Announcement not found')
  return doc
}

async function getAnnouncement(id, reqContext = {}) {
  const doc = await Announcement.findOne({ _id: id, deletedAt: null })
    .populate('course', 'title')
    .populate('batch', 'name batchCode')
  if (!doc) throw new ApiError(404, 'Announcement not found')
  if (reqContext.courseScope === 'published' && doc.status !== ANNOUNCEMENT_STATUS.PUBLISHED) {
    throw new ApiError(404, 'Announcement not found')
  }
  return doc
}

async function listAnnouncements(query, reqContext = {}) {
  const { page, limit, search, sortBy, sortOrder, skip, filters } = parseListQuery(query)
  const filter = { deletedAt: null }
  if (filters.status) filter.status = filters.status
  else if (reqContext.courseScope === 'published') filter.status = ANNOUNCEMENT_STATUS.PUBLISHED
  if (filters.priority) filter.priority = filters.priority
  if (filters.course) filter.course = filters.course
  if (filters.batch) filter.batch = filters.batch
  if (search) filter.$text = { $search: search }

  // Students: only audience-relevant
  if (reqContext.courseScope === 'published' && reqContext.userId) {
    const enrollments = await Enrollment.find({
      student: reqContext.userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
      .select('course batch')
      .lean()
    filter.$or = [
      { audience: ANNOUNCEMENT_AUDIENCE.ALL_STUDENTS },
      { audience: ANNOUNCEMENT_AUDIENCE.INDIVIDUAL, students: reqContext.userId },
      {
        audience: ANNOUNCEMENT_AUDIENCE.COURSE,
        course: { $in: enrollments.map((e) => e.course) },
      },
      {
        audience: ANNOUNCEMENT_AUDIENCE.BATCH,
        batch: { $in: enrollments.map((e) => e.batch).filter(Boolean) },
      },
    ]
  }

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ [sortBy || 'publishedAt']: sortOrder || -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title')
      .populate('batch', 'name batchCode')
      .lean(),
    Announcement.countDocuments(filter),
  ])
  return buildPagedResult({ items, total, page, limit })
}

module.exports = {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
}
