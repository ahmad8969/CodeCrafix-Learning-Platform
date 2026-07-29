const CalendarEvent = require('../models/CalendarEvent')
const LiveClass = require('../models/LiveClass')
const Assignment = require('../models/Assignment')
const Quiz = require('../models/Quiz')
const Enrollment = require('../models/Enrollment')
const { ApiError } = require('../utils/helpers')
const { CALENDAR_EVENT_TYPES, LIVE_CLASS_STATUS } = require('../constants/live-class')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')

async function createEvent(payload, userId) {
  return CalendarEvent.create({ ...payload, createdBy: userId, updatedBy: userId })
}

async function updateEvent(id, payload, userId) {
  const doc = await CalendarEvent.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { ...payload, updatedBy: userId },
    { new: true, runValidators: true }
  )
  if (!doc) throw new ApiError(404, 'Event not found')
  return doc
}

async function deleteEvent(id) {
  const doc = await CalendarEvent.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Event not found')
  return doc
}

/**
 * Aggregate academic calendar: custom events + live classes + assignment due + quiz windows.
 */
async function getAcademicCalendar({ from, to, courseId, batchId, userId, roleScope } = {}) {
  const start = from ? new Date(from) : new Date(Date.now() - 7 * 86400000)
  const end = to ? new Date(to) : new Date(Date.now() + 45 * 86400000)

  let courseIds = courseId ? [courseId] : null
  let batchIds = batchId ? [batchId] : null

  if (roleScope === 'published' && userId) {
    const enrollments = await Enrollment.find({
      student: userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
      .select('course batch')
      .lean()
    courseIds = enrollments.map((e) => e.course)
    batchIds = enrollments.map((e) => e.batch).filter(Boolean)
  }

  const eventFilter = {
    deletedAt: null,
    startAt: { $gte: start, $lte: end },
  }
  if (courseIds) {
    eventFilter.$or = [{ course: { $in: courseIds } }, { course: null }]
  }

  const [customEvents, liveClasses, assignments, quizzes] = await Promise.all([
    CalendarEvent.find(eventFilter).sort({ startAt: 1 }).lean(),
    LiveClass.find({
      deletedAt: null,
      status: { $ne: LIVE_CLASS_STATUS.CANCELLED },
      startsAt: { $gte: start, $lte: end },
      ...(courseIds ? { course: { $in: courseIds } } : {}),
      ...(batchIds?.length ? { $or: [{ batch: { $in: batchIds } }, { batch: null }] } : {}),
    })
      .select('title startsAt endsAt course batch status')
      .lean(),
    Assignment.find({
      deletedAt: null,
      status: 'published',
      dueAt: { $gte: start, $lte: end },
      ...(courseIds ? { course: { $in: courseIds } } : {}),
    })
      .select('title dueAt course')
      .lean(),
    Quiz.find({
      deletedAt: null,
      status: 'published',
      $or: [
        { startAt: { $gte: start, $lte: end } },
        { endAt: { $gte: start, $lte: end } },
      ],
      ...(courseIds ? { course: { $in: courseIds } } : {}),
    })
      .select('title startAt endAt course')
      .lean(),
  ])

  const items = [
    ...customEvents.map((e) => ({
      id: e._id,
      title: e.title,
      type: e.type,
      startAt: e.startAt,
      endAt: e.endAt,
      allDay: e.allDay,
      color: e.color,
      source: 'calendar',
    })),
    ...liveClasses.map((c) => ({
      id: c._id,
      title: c.title,
      type: CALENDAR_EVENT_TYPES.LIVE_CLASS,
      startAt: c.startsAt,
      endAt: c.endsAt,
      allDay: false,
      color: '#0d9488',
      source: 'live_class',
      status: c.status,
    })),
    ...assignments.map((a) => ({
      id: a._id,
      title: `Due: ${a.title}`,
      type: CALENDAR_EVENT_TYPES.ASSIGNMENT,
      startAt: a.dueAt,
      endAt: a.dueAt,
      allDay: true,
      color: '#f59e0b',
      source: 'assignment',
    })),
    ...quizzes.map((q) => ({
      id: q._id,
      title: `Quiz: ${q.title}`,
      type: CALENDAR_EVENT_TYPES.QUIZ,
      startAt: q.startAt || q.endAt,
      endAt: q.endAt || q.startAt,
      allDay: false,
      color: '#6366f1',
      source: 'quiz',
    })),
  ].sort((a, b) => new Date(a.startAt) - new Date(b.startAt))

  return { from: start, to: end, items }
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  getAcademicCalendar,
}
