const PracticeAttempt = require('../models/PracticeAttempt')
const PracticeProgress = require('../models/PracticeProgress')

async function createAttempt(data) {
  return PracticeAttempt.create(data)
}

async function listAttempts(userId, questionId, { limit = 20 } = {}) {
  return PracticeAttempt.find({ user: userId, question: questionId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-hiddenResults')
    .lean()
}

async function getProgress(userId, questionId) {
  return PracticeProgress.findOne({ user: userId, question: questionId }).lean()
}

async function upsertProgress(userId, questionId, patch) {
  return PracticeProgress.findOneAndUpdate(
    { user: userId, question: questionId },
    { $set: patch, $setOnInsert: { user: userId, question: questionId } },
    { upsert: true, new: true }
  )
}

async function listProgressForUser(userId, { courseId, topicId } = {}) {
  const filter = { user: userId }
  if (courseId) filter.course = courseId
  if (topicId) filter.topic = topicId
  return PracticeProgress.find(filter).sort({ updatedAt: -1 }).lean()
}

module.exports = {
  createAttempt,
  listAttempts,
  getProgress,
  upsertProgress,
  listProgressForUser,
}
