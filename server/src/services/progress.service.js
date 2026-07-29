const ProgressEvent = require('../models/ProgressEvent')
const AnalyticsEvent = require('../models/AnalyticsEvent')
const mongoose = require('mongoose')

async function trackProgress({ userId, instituteId, courseId, lessonId, eventType, value = 1, meta = {} }) {
  const event = await ProgressEvent.create({
    institute: instituteId || null,
    user: userId,
    course: courseId || null,
    lesson: lessonId || null,
    eventType,
    value,
    meta,
    occurredAt: new Date(),
  })
  await AnalyticsEvent.create({
    institute: instituteId || null,
    user: userId,
    eventName: eventType,
    course: courseId || null,
    lesson: lessonId || null,
    value,
    meta,
  })
  return event
}

async function summaryForUser(userId) {
  const oid = new mongoose.Types.ObjectId(String(userId))
  const events = await ProgressEvent.aggregate([
    { $match: { user: oid } },
    { $group: { _id: '$eventType', total: { $sum: '$value' }, count: { $sum: 1 } } },
  ])
  const byType = Object.fromEntries(events.map((e) => [e._id, { total: e.total, count: e.count }]))
  return { byType }
}

async function trackAnalytics({ eventName, userId, instituteId, courseId, lessonId, value = 1, meta = {} }) {
  return AnalyticsEvent.create({
    eventName,
    user: userId || null,
    institute: instituteId || null,
    course: courseId || null,
    lesson: lessonId || null,
    value,
    meta,
  })
}

module.exports = { trackProgress, summaryForUser, trackAnalytics }
