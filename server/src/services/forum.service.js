const Discussion = require('../models/Discussion')
require('../models/Module')
require('../models/Week')
require('../models/Topic')
require('../models/Lesson')
const notificationService = require('./notification.service')
const { COMM_NOTIFY } = require('../constants/communication')
const { ApiError } = require('../utils/helpers')
const { ROLES } = require('../constants')

function isStaff(role) {
  return [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER].includes(role)
}

async function listThreads(filters = {}) {
  const q = { parent: null, deletedAt: null }
  if (filters.courseId) q.course = filters.courseId
  if (filters.moduleId) q.module = filters.moduleId
  if (filters.weekId) q.week = filters.weekId
  if (filters.topicId) q.topic = filters.topicId
  if (filters.lessonId) q.lesson = filters.lessonId
  if (filters.q) {
    q.$or = [
      { title: new RegExp(filters.q, 'i') },
      { body: new RegExp(filters.q, 'i') },
    ]
  }
  const page = Math.max(1, Number(filters.page) || 1)
  const limit = Math.min(50, Number(filters.limit) || 20)
  const [items, total] = await Promise.all([
    Discussion.find(q)
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('author', 'fullName role profileImage')
      .populate('course', 'title')
      .populate('topic', 'name')
      .lean(),
    Discussion.countDocuments(q),
  ])
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) }
}

async function getThread(id) {
  const thread = await Discussion.findOne({ _id: id, deletedAt: null })
    .populate('author', 'fullName role profileImage')
    .populate('course', 'title')
    .populate('module', 'name')
    .populate('week', 'name')
    .populate('topic', 'name')
    .populate('lesson', 'title')
    .lean()
  if (!thread) throw new ApiError(404, 'Thread not found')
  const replies = await Discussion.find({ parent: id, deletedAt: null })
    .sort({ bestAnswer: -1, createdAt: 1 })
    .populate('author', 'fullName role profileImage')
    .lean()
  return { thread, replies }
}

async function createThread(payload, userId) {
  if (!payload.course) throw new ApiError(400, 'course required')
  if (!payload.body) throw new ApiError(400, 'body required')
  const doc = await Discussion.create({
    ...payload,
    author: userId,
    parent: null,
    mentions: payload.mentions || [],
  })
  for (const mid of payload.mentions || []) {
    await notificationService.notifyUser({
      userId: mid,
      templateKey: COMM_NOTIFY.FORUM_REPLY,
      title: 'You were mentioned in a discussion',
      body: (payload.title || payload.body).slice(0, 120),
      link: `/forums/${doc._id}`,
      meta: { threadId: doc._id },
    })
  }
  return getThread(doc._id)
}

async function reply(threadId, payload, userId) {
  const thread = await Discussion.findOne({ _id: threadId, deletedAt: null })
  if (!thread) throw new ApiError(404, 'Thread not found')
  if (thread.locked) throw new ApiError(400, 'Thread is locked')
  const replyDoc = await Discussion.create({
    course: thread.course,
    module: thread.module,
    week: thread.week,
    topic: thread.topic,
    lesson: thread.lesson,
    author: userId,
    parent: threadId,
    body: payload.body,
    mentions: payload.mentions || [],
  })
  thread.replyCount = (thread.replyCount || 0) + 1
  await thread.save()

  const notifyIds = new Set([
    String(thread.author),
    ...(thread.followers || []).map(String),
    ...(payload.mentions || []).map(String),
  ])
  notifyIds.delete(String(userId))
  await Promise.all(
    [...notifyIds].map((uid) =>
      notificationService.notifyUser({
        userId: uid,
        templateKey: COMM_NOTIFY.FORUM_REPLY,
        title: 'New forum reply',
        body: payload.body.slice(0, 120),
        link: `/forums/${threadId}`,
        meta: { threadId, replyId: replyDoc._id },
      })
    )
  )
  return getThread(threadId)
}

async function toggleLike(id, userId) {
  const doc = await Discussion.findById(id)
  if (!doc || doc.deletedAt) throw new ApiError(404, 'Post not found')
  const has = doc.likes.some((u) => String(u) === String(userId))
  if (has) doc.likes = doc.likes.filter((u) => String(u) !== String(userId))
  else doc.likes.push(userId)
  await doc.save()
  return { liked: !has, likes: doc.likes.length }
}

async function followThread(id, userId) {
  const doc = await Discussion.findById(id)
  if (!doc || doc.parent) throw new ApiError(404, 'Thread not found')
  await Discussion.findByIdAndUpdate(id, { $addToSet: { followers: userId } })
  return { following: true }
}

async function markBestAnswer(threadId, replyId, userId, role) {
  const thread = await Discussion.findById(threadId)
  if (!thread) throw new ApiError(404, 'Thread not found')
  if (String(thread.author) !== String(userId) && !isStaff(role)) {
    throw new ApiError(403, 'Only author or staff can mark best answer')
  }
  await Discussion.updateMany({ parent: threadId }, { $set: { bestAnswer: false } })
  const reply = await Discussion.findOneAndUpdate(
    { _id: replyId, parent: threadId },
    { bestAnswer: true },
    { new: true }
  )
  if (!reply) throw new ApiError(404, 'Reply not found')
  thread.bestAnswerId = replyId
  await thread.save()
  return getThread(threadId)
}

async function pinThread(id, role) {
  if (!isStaff(role)) throw new ApiError(403, 'Staff only')
  const doc = await Discussion.findByIdAndUpdate(id, { pinned: true }, { new: true })
  if (!doc) throw new ApiError(404, 'Thread not found')
  return doc
}

async function lockThread(id, role) {
  if (!isStaff(role)) throw new ApiError(403, 'Staff only')
  const doc = await Discussion.findByIdAndUpdate(id, { locked: true }, { new: true })
  if (!doc) throw new ApiError(404, 'Thread not found')
  return doc
}

async function reportContent(id, userId) {
  const doc = await Discussion.findByIdAndUpdate(
    id,
    { $addToSet: { reportedBy: userId } },
    { new: true }
  )
  if (!doc) throw new ApiError(404, 'Post not found')
  return { reported: true, reports: doc.reportedBy.length }
}

module.exports = {
  listThreads,
  getThread,
  createThread,
  reply,
  toggleLike,
  followThread,
  markBestAnswer,
  pinThread,
  lockThread,
  reportContent,
}
