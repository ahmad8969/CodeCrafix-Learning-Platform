const LiveClass = require('../models/LiveClass')
const CalendarEvent = require('../models/CalendarEvent')
const ClassRecording = require('../models/ClassRecording')
const Enrollment = require('../models/Enrollment')
const User = require('../models/User')
const { ApiError } = require('../utils/helpers')
const { parseListQuery, buildPagedResult } = require('../utils/query')
const { ROLES } = require('../constants')
const {
  LIVE_CLASS_STATUS,
  LIVE_NOTIFY,
  CALENDAR_EVENT_TYPES,
} = require('../constants/live-class')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')
const { getMeetingProvider } = require('./meeting-provider.service')
const notificationService = require('./notification.service')

const POPULATE = [
  { path: 'course', select: 'title slug' },
  { path: 'batch', select: 'name batchCode' },
  { path: 'teacher', select: 'fullName email' },
]

function combineDateTime(date, timeStr) {
  const d = new Date(date)
  const raw = String(timeStr || '10:00 AM').trim()
  const m = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  let hours = 10
  let minutes = 0
  if (m) {
    hours = Number(m[1])
    minutes = Number(m[2])
    const ap = (m[3] || '').toUpperCase()
    if (ap === 'PM' && hours < 12) hours += 12
    if (ap === 'AM' && hours === 12) hours = 0
  }
  d.setHours(hours, minutes, 0, 0)
  return d
}

async function notifyBatchStudents(batchId, courseId, payload) {
  const filter = {
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  }
  if (batchId) filter.batch = batchId
  else if (courseId) filter.course = courseId
  const enrollments = await Enrollment.find(filter).select('student').limit(500).lean()
  await Promise.all(
    enrollments.map((e) =>
      notificationService.notifyUser({
        userId: e.student,
        ...payload,
      })
    )
  )
}

async function syncCalendarEvent(liveClass) {
  if (!liveClass || liveClass.deletedAt) return null
  const data = {
    title: liveClass.title,
    description: liveClass.description || '',
    type: CALENDAR_EVENT_TYPES.LIVE_CLASS,
    course: liveClass.course,
    batch: liveClass.batch,
    startAt: liveClass.startsAt,
    endAt: liveClass.endsAt,
    allDay: false,
    color: '#0d9488',
    sourceType: 'LiveClass',
    sourceId: liveClass._id,
    updatedBy: liveClass.updatedBy,
  }
  return CalendarEvent.findOneAndUpdate(
    { sourceType: 'LiveClass', sourceId: liveClass._id, deletedAt: null },
    { ...data, $setOnInsert: { createdBy: liveClass.createdBy } },
    { upsert: true, new: true }
  )
}

async function createLiveClass(payload, userId) {
  const startsAt = payload.startsAt
    ? new Date(payload.startsAt)
    : combineDateTime(payload.scheduledDate, payload.startTime)
  const endsAt = payload.endsAt
    ? new Date(payload.endsAt)
    : combineDateTime(payload.scheduledDate, payload.endTime)
  if (endsAt <= startsAt) throw new ApiError(400, 'End must be after start')

  const provider = getMeetingProvider(payload.meetingProvider)
  const meeting = await provider.createMeeting(payload)

  const doc = await LiveClass.create({
    ...payload,
    scheduledDate: payload.scheduledDate || startsAt,
    startsAt,
    endsAt,
    durationMinutes:
      payload.durationMinutes || Math.max(15, Math.round((endsAt - startsAt) / 60000)),
    meetingLink: meeting.joinUrl || payload.meetingLink || '',
    meetingPassword: meeting.password || payload.meetingPassword || '',
    externalMeetingId: meeting.meetingId || '',
    meetingMeta: meeting.meta || {},
    createdBy: userId,
    updatedBy: userId,
  })

  await syncCalendarEvent(doc)
  await notifyBatchStudents(doc.batch, doc.course, {
    templateKey: LIVE_NOTIFY.CLASS_SCHEDULED,
    title: 'New class scheduled',
    body: `"${doc.title}" on ${new Date(doc.startsAt).toLocaleString()}`,
    link: `/student/classes/${doc._id}`,
    meta: { liveClassId: doc._id },
  })

  // Recurring weekly occurrences
  if (payload.isRecurring && payload.recurrenceRule?.until && payload.recurrenceRule?.daysOfWeek?.length) {
    await generateRecurring(doc, payload.recurrenceRule, userId)
  }

  return LiveClass.findById(doc._id).populate(POPULATE).select('+meetingPassword')
}

async function generateRecurring(parent, rule, userId) {
  const until = new Date(rule.until)
  const dayIndex = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  const duration = parent.endsAt - parent.startsAt
  const cursor = new Date(parent.startsAt)
  cursor.setDate(cursor.getDate() + 1)
  let created = 0
  while (cursor <= until && created < 40) {
    const name = Object.keys(dayIndex).find((k) => dayIndex[k] === cursor.getDay())
    if (rule.daysOfWeek.includes(name)) {
      const startsAt = new Date(cursor)
      startsAt.setHours(parent.startsAt.getHours(), parent.startsAt.getMinutes(), 0, 0)
      const endsAt = new Date(startsAt.getTime() + duration)
      const child = await LiveClass.create({
        title: parent.title,
        description: parent.description,
        course: parent.course,
        batch: parent.batch,
        teacher: parent.teacher,
        module: parent.module,
        week: parent.week,
        topic: parent.topic,
        lesson: parent.lesson,
        scheduledDate: startsAt,
        startTime: parent.startTime,
        endTime: parent.endTime,
        durationMinutes: parent.durationMinutes,
        timezone: parent.timezone,
        startsAt,
        endsAt,
        meetingProvider: parent.meetingProvider,
        meetingLink: parent.meetingLink,
        meetingPassword: parent.meetingPassword,
        resources: parent.resources,
        status: LIVE_CLASS_STATUS.SCHEDULED,
        isRecurring: true,
        recurrenceRule: {
          frequency: 'weekly',
          daysOfWeek: rule.daysOfWeek,
          until,
          parentClass: parent._id,
        },
        createdBy: userId,
        updatedBy: userId,
      })
      await syncCalendarEvent(child)
      created += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return created
}

async function updateLiveClass(id, payload, userId, reqContext = {}) {
  const existing = await LiveClass.findOne({ _id: id, deletedAt: null })
  if (!existing) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(existing, reqContext)

  if (payload.scheduledDate || payload.startTime || payload.endTime || payload.startsAt) {
    const startsAt = payload.startsAt
      ? new Date(payload.startsAt)
      : combineDateTime(payload.scheduledDate || existing.scheduledDate, payload.startTime || existing.startTime)
    const endsAt = payload.endsAt
      ? new Date(payload.endsAt)
      : combineDateTime(payload.scheduledDate || existing.scheduledDate, payload.endTime || existing.endTime)
    payload.startsAt = startsAt
    payload.endsAt = endsAt
    payload.durationMinutes = Math.max(15, Math.round((endsAt - startsAt) / 60000))
  }

  Object.assign(existing, payload, { updatedBy: userId })
  await existing.save()
  await syncCalendarEvent(existing)

  if (payload.startsAt || payload.scheduledDate || payload.startTime) {
    await notifyBatchStudents(existing.batch, existing.course, {
      templateKey: LIVE_NOTIFY.CLASS_RESCHEDULED,
      title: 'Class rescheduled',
      body: `"${existing.title}" moved to ${new Date(existing.startsAt).toLocaleString()}`,
      link: `/student/classes/${existing._id}`,
    })
  }

  return LiveClass.findById(id).populate(POPULATE)
}

function assertTeacherAccess(doc, reqContext) {
  if (reqContext.courseScope === 'assigned') {
    if (String(doc.teacher) !== String(reqContext.assignedUserId)) {
      throw new ApiError(403, 'Not your class')
    }
  }
}

async function getLiveClass(id, reqContext = {}) {
  const doc = await LiveClass.findOne({ _id: id, deletedAt: null })
    .populate(POPULATE)
    .select('+meetingPassword')
  if (!doc) throw new ApiError(404, 'Live class not found')
  if (reqContext.courseScope === 'published' && reqContext.userId) {
    const ok = await Enrollment.findOne({
      student: reqContext.userId,
      course: doc.course._id || doc.course,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
      ...(doc.batch ? { batch: doc.batch._id || doc.batch } : {}),
    })
    // allow if enrolled in course even without batch match
    const enrolledCourse = await Enrollment.findOne({
      student: reqContext.userId,
      course: doc.course._id || doc.course,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
    if (!ok && !enrolledCourse) throw new ApiError(403, 'Not enrolled for this class')
  }
  return doc
}

async function listLiveClasses(query, reqContext = {}) {
  const { page, limit, search, sortBy, sortOrder, skip, filters } = parseListQuery(query)
  const filter = { deletedAt: null }
  if (filters.course) filter.course = filters.course
  if (filters.batch) filter.batch = filters.batch
  if (filters.teacher) filter.teacher = filters.teacher
  if (filters.status) filter.status = filters.status
  if (filters.from || filters.to) {
    filter.startsAt = {}
    if (filters.from) filter.startsAt.$gte = new Date(filters.from)
    if (filters.to) filter.startsAt.$lte = new Date(filters.to)
  }
  if (reqContext.courseScope === 'assigned') filter.teacher = reqContext.assignedUserId
  if (reqContext.courseScope === 'published' && reqContext.userId) {
    const enrollments = await Enrollment.find({
      student: reqContext.userId,
      status: ENROLLMENT_STATUS.ACTIVE,
      deletedAt: null,
    })
      .select('course batch')
      .lean()
    filter.$or = [
      { course: { $in: enrollments.map((e) => e.course) } },
      { batch: { $in: enrollments.map((e) => e.batch).filter(Boolean) } },
    ]
  }
  if (search) filter.$text = { $search: search }

  const [items, total] = await Promise.all([
    LiveClass.find(filter)
      .sort({ [sortBy || 'startsAt']: sortOrder || 1 })
      .skip(skip)
      .limit(limit)
      .populate(POPULATE)
      .lean(),
    LiveClass.countDocuments(filter),
  ])
  return buildPagedResult({ items, total, page, limit })
}

async function cancelLiveClass(id, userId, reason, reqContext) {
  const doc = await LiveClass.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(doc, reqContext)
  doc.status = LIVE_CLASS_STATUS.CANCELLED
  doc.cancelledAt = new Date()
  doc.cancelReason = reason || ''
  doc.updatedBy = userId
  await doc.save()
  await CalendarEvent.updateMany(
    { sourceType: 'LiveClass', sourceId: doc._id },
    { deletedAt: new Date() }
  )
  await notifyBatchStudents(doc.batch, doc.course, {
    templateKey: LIVE_NOTIFY.CLASS_CANCELLED,
    title: 'Class cancelled',
    body: `"${doc.title}" was cancelled.${reason ? ` ${reason}` : ''}`,
    link: `/student/classes`,
  })
  return doc
}

async function startLiveClass(id, userId, reqContext) {
  const doc = await LiveClass.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(doc, reqContext)
  doc.status = LIVE_CLASS_STATUS.LIVE
  doc.startedAt = new Date()
  doc.updatedBy = userId
  await doc.save()
  return doc
}

async function endLiveClass(id, userId, reqContext) {
  const doc = await LiveClass.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(doc, reqContext)
  doc.status = LIVE_CLASS_STATUS.COMPLETED
  doc.endedAt = new Date()
  doc.updatedBy = userId
  await doc.save()
  return doc
}

async function duplicateLiveClass(id, userId, reqContext) {
  const src = await LiveClass.findOne({ _id: id, deletedAt: null }).select('+meetingPassword')
  if (!src) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(src, reqContext)
  const obj = src.toObject()
  delete obj._id
  delete obj.createdAt
  delete obj.updatedAt
  obj.title = `${obj.title} (Copy)`
  obj.status = LIVE_CLASS_STATUS.SCHEDULED
  obj.startedAt = null
  obj.endedAt = null
  obj.cancelledAt = null
  obj.isRecurring = false
  return createLiveClass(obj, userId)
}

async function deleteLiveClass(id, reqContext) {
  const doc = await LiveClass.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, 'Live class not found')
  assertTeacherAccess(doc, reqContext)
  doc.deletedAt = new Date()
  doc.status = LIVE_CLASS_STATUS.CANCELLED
  await doc.save()
  await CalendarEvent.updateMany(
    { sourceType: 'LiveClass', sourceId: doc._id },
    { deletedAt: new Date() }
  )
  return doc
}

async function teacherSchedule(teacherId, { from, to } = {}) {
  const filter = {
    teacher: teacherId,
    deletedAt: null,
    status: { $nin: [LIVE_CLASS_STATUS.CANCELLED] },
  }
  if (from || to) {
    filter.startsAt = {}
    if (from) filter.startsAt.$gte = new Date(from)
    if (to) filter.startsAt.$lte = new Date(to)
  }
  return LiveClass.find(filter).sort({ startsAt: 1 }).populate(POPULATE).lean()
}

async function studentSchedule(studentId, { from, to } = {}) {
  const enrollments = await Enrollment.find({
    student: studentId,
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
  })
    .select('course batch')
    .lean()
  const filter = {
    deletedAt: null,
    status: { $nin: [LIVE_CLASS_STATUS.CANCELLED] },
    $or: [
      { course: { $in: enrollments.map((e) => e.course) } },
      { batch: { $in: enrollments.map((e) => e.batch).filter(Boolean) } },
    ],
  }
  if (from || to) {
    filter.startsAt = {}
    if (from) filter.startsAt.$gte = new Date(from)
    if (to) filter.startsAt.$lte = new Date(to)
  }
  return LiveClass.find(filter).sort({ startsAt: 1 }).populate(POPULATE).lean()
}

async function addRecording(payload, userId) {
  const liveClass = await LiveClass.findById(payload.liveClass)
  if (!liveClass) throw new ApiError(404, 'Live class not found')
  const rec = await ClassRecording.create({
    ...payload,
    course: payload.course || liveClass.course,
    module: payload.module || liveClass.module,
    week: payload.week || liveClass.week,
    topic: payload.topic || liveClass.topic,
    lesson: payload.lesson || liveClass.lesson,
    createdBy: userId,
  })
  await notifyBatchStudents(liveClass.batch, liveClass.course, {
    templateKey: LIVE_NOTIFY.RECORDING_AVAILABLE,
    title: 'Class recording available',
    body: `"${rec.title}" is ready to watch.`,
    link: `/student/classes/${liveClass._id}`,
    meta: { recordingId: rec._id },
  })
  return rec
}

async function listRecordings(query = {}) {
  const filter = { deletedAt: null, published: true }
  if (query.liveClass) filter.liveClass = query.liveClass
  if (query.course) filter.course = query.course
  return ClassRecording.find(filter).sort({ createdAt: -1 }).limit(Number(query.limit) || 50).lean()
}

async function adminDashboard() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const [todaysClasses, activeLive, upcoming] = await Promise.all([
    LiveClass.find({
      deletedAt: null,
      startsAt: { $gte: start, $lte: end },
      status: { $ne: LIVE_CLASS_STATUS.CANCELLED },
    })
      .populate(POPULATE)
      .sort({ startsAt: 1 })
      .lean(),
    LiveClass.countDocuments({ deletedAt: null, status: LIVE_CLASS_STATUS.LIVE }),
    LiveClass.find({
      deletedAt: null,
      status: LIVE_CLASS_STATUS.SCHEDULED,
      startsAt: { $gte: new Date() },
    })
      .sort({ startsAt: 1 })
      .limit(8)
      .populate(POPULATE)
      .lean(),
  ])
  return { todaysClasses, activeLive, upcoming }
}

module.exports = {
  createLiveClass,
  updateLiveClass,
  getLiveClass,
  listLiveClasses,
  cancelLiveClass,
  startLiveClass,
  endLiveClass,
  duplicateLiveClass,
  deleteLiveClass,
  teacherSchedule,
  studentSchedule,
  addRecording,
  listRecordings,
  adminDashboard,
  combineDateTime,
  POPULATE,
}
