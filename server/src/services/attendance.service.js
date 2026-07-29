const LiveClass = require('../models/LiveClass')
const Enrollment = require('../models/Enrollment')
const { Attendance, AttendanceRule } = require('../models/Attendance')
const { ApiError } = require('../utils/helpers')
const { ATTENDANCE_STATUS, LIVE_NOTIFY } = require('../constants/live-class')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')
const notificationService = require('./notification.service')
const auditService = require('./audit.service')

async function getRules({ courseId, batchId } = {}) {
  let rule = null
  if (batchId) {
    rule = await AttendanceRule.findOne({ batch: batchId }).lean()
  }
  if (!rule && courseId) {
    rule = await AttendanceRule.findOne({ course: courseId, batch: null }).lean()
  }
  return (
    rule || {
      minimumAttendancePercent: 75,
      lateAfterMinutes: 10,
      autoMarkAbsent: true,
      allowManualOverride: true,
      allowExcusedAbsence: true,
      enableAutomaticAttendance: false,
      enableQrAttendance: false,
    }
  )
}

async function upsertRules(payload, userId) {
  const filter = {
    course: payload.course || null,
    batch: payload.batch || null,
  }
  return AttendanceRule.findOneAndUpdate(
    filter,
    { ...payload, ...filter, updatedBy: userId, $setOnInsert: { createdBy: userId } },
    { upsert: true, new: true, runValidators: true }
  )
}

async function ensureRoster(liveClassId) {
  const liveClass = await LiveClass.findById(liveClassId)
  if (!liveClass) throw new ApiError(404, 'Live class not found')
  const enrollFilter = {
    status: ENROLLMENT_STATUS.ACTIVE,
    deletedAt: null,
    course: liveClass.course,
  }
  if (liveClass.batch) enrollFilter.batch = liveClass.batch
  const enrollments = await Enrollment.find(enrollFilter).select('student').lean()
  const ops = enrollments.map((e) => ({
    updateOne: {
      filter: { liveClass: liveClassId, student: e.student },
      update: {
        $setOnInsert: {
          liveClass: liveClassId,
          student: e.student,
          course: liveClass.course,
          batch: liveClass.batch,
          status: ATTENDANCE_STATUS.ABSENT,
          source: 'manual',
        },
      },
      upsert: true,
    },
  }))
  if (ops.length) await Attendance.bulkWrite(ops)
  return Attendance.find({ liveClass: liveClassId })
    .populate('student', 'fullName email profileImage')
    .lean()
}

async function markAttendance(liveClassId, entries, markerId, req) {
  const liveClass = await LiveClass.findById(liveClassId)
  if (!liveClass) throw new ApiError(404, 'Live class not found')
  const rules = await getRules({ courseId: liveClass.course, batchId: liveClass.batch })

  const results = []
  for (const entry of entries || []) {
    const prev = await Attendance.findOne({ liveClass: liveClassId, student: entry.studentId })
    let status = entry.status || ATTENDANCE_STATUS.PRESENT
    let lateMinutes = entry.lateMinutes || 0
    let joinTime = entry.joinTime ? new Date(entry.joinTime) : null

    if (status === ATTENDANCE_STATUS.PRESENT && joinTime && liveClass.startsAt) {
      const diff = Math.round((joinTime - new Date(liveClass.startsAt)) / 60000)
      if (diff > (rules.lateAfterMinutes || 10)) {
        status = ATTENDANCE_STATUS.LATE
        lateMinutes = diff
      }
    }
    if (status === ATTENDANCE_STATUS.EXCUSED && !rules.allowExcusedAbsence) {
      throw new ApiError(400, 'Excused absences are disabled for this course/batch')
    }

    let durationSeconds = entry.durationSeconds || 0
    if (entry.joinTime && entry.leaveTime) {
      durationSeconds = Math.max(
        0,
        Math.round((new Date(entry.leaveTime) - new Date(entry.joinTime)) / 1000)
      )
    }

    const doc = await Attendance.findOneAndUpdate(
      { liveClass: liveClassId, student: entry.studentId },
      {
        liveClass: liveClassId,
        student: entry.studentId,
        course: liveClass.course,
        batch: liveClass.batch,
        status,
        joinTime,
        leaveTime: entry.leaveTime ? new Date(entry.leaveTime) : null,
        durationSeconds,
        lateMinutes,
        markedBy: markerId,
        source: entry.source || 'manual',
        notes: entry.notes || '',
        overrideReason: entry.overrideReason || '',
      },
      { upsert: true, new: true }
    )

    if (req && prev && prev.status !== doc.status) {
      await auditService.record(req, {
        action: 'attendance_updated',
        resourceType: 'Attendance',
        resourceId: doc._id,
        oldValue: { status: prev.status },
        newValue: { status: doc.status },
        meta: { liveClassId, studentId: entry.studentId },
      })
    }

    await notificationService.notifyUser({
      userId: entry.studentId,
      templateKey: LIVE_NOTIFY.ATTENDANCE_MARKED,
      title: 'Attendance marked',
      body: `Marked ${status} for "${liveClass.title}"`,
      link: `/student/attendance`,
    })

    results.push(doc)
  }
  return results
}

async function studentAttendanceSummary(studentId, { courseId, batchId } = {}) {
  const filter = { student: studentId }
  if (courseId) filter.course = courseId
  if (batchId) filter.batch = batchId
  const rows = await Attendance.find(filter).lean()
  const total = rows.length
  const present = rows.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length
  const late = rows.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length
  const absent = rows.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length
  const excused = rows.filter((r) => r.status === ATTENDANCE_STATUS.EXCUSED).length
  const attended = present + late
  const percentage = total ? Math.round((attended / total) * 1000) / 10 : 0

  const byMonth = {}
  const byWeek = {}
  for (const r of rows) {
    const d = new Date(r.createdAt)
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    byMonth[mk] = byMonth[mk] || { present: 0, total: 0 }
    byMonth[mk].total += 1
    if ([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE].includes(r.status)) byMonth[mk].present += 1

    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const wk = weekStart.toISOString().slice(0, 10)
    byWeek[wk] = byWeek[wk] || { present: 0, total: 0 }
    byWeek[wk].total += 1
    if ([ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE].includes(r.status)) byWeek[wk].present += 1
  }

  const history = await Attendance.find(filter)
    .sort({ createdAt: -1 })
    .limit(40)
    .populate('liveClass', 'title startsAt status')
    .lean()

  const rules = await getRules({ courseId, batchId })

  return {
    totals: { total, present, late, absent, excused, percentage },
    monthly: Object.entries(byMonth).map(([month, v]) => ({
      month,
      ...v,
      percentage: v.total ? Math.round((v.present / v.total) * 100) : 0,
    })),
    weekly: Object.entries(byWeek)
      .map(([week, v]) => ({
        week,
        ...v,
        percentage: v.total ? Math.round((v.present / v.total) * 100) : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12),
    history,
    rules,
    lowAttendance: percentage < (rules.minimumAttendancePercent || 75),
  }
}

async function classAttendanceReport(liveClassId) {
  const rows = await Attendance.find({ liveClass: liveClassId })
    .populate('student', 'fullName email')
    .lean()
  const present = rows.filter((r) => [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE].includes(r.status)).length
  return {
    liveClassId,
    total: rows.length,
    present,
    absent: rows.filter((r) => r.status === ATTENDANCE_STATUS.ABSENT).length,
    late: rows.filter((r) => r.status === ATTENDANCE_STATUS.LATE).length,
    excused: rows.filter((r) => r.status === ATTENDANCE_STATUS.EXCUSED).length,
    percentage: rows.length ? Math.round((present / rows.length) * 1000) / 10 : 0,
    rows,
  }
}

async function analyticsOverview({ courseId, batchId } = {}) {
  const match = {}
  if (courseId) match.course = require('mongoose').Types.ObjectId.createFromHexString(String(courseId))
  if (batchId) match.batch = require('mongoose').Types.ObjectId.createFromHexString(String(batchId))

  const byStatus = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ])

  const studentAgg = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        total: 1,
        present: 1,
        percentage: {
          $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0],
        },
      },
    },
    { $match: { percentage: { $lt: 75 } } },
    { $sort: { percentage: 1 } },
    { $limit: 20 },
  ])

  const User = require('../models/User')
  const users = await User.find({ _id: { $in: studentAgg.map((s) => s._id) } })
    .select('fullName email')
    .lean()
  const lowAttendanceStudents = studentAgg.map((s) => ({
    ...s,
    student: users.find((u) => String(u._id) === String(s._id)),
    percentage: Math.round(s.percentage * 10) / 10,
  }))

  return {
    byStatus: Object.fromEntries(byStatus.map((b) => [b._id, b.count])),
    lowAttendanceStudents,
  }
}

module.exports = {
  getRules,
  upsertRules,
  ensureRoster,
  markAttendance,
  studentAttendanceSummary,
  classAttendanceReport,
  analyticsOverview,
}
