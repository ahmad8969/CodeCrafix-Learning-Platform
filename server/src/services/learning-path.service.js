const Topic = require('../models/Topic')
const Lesson = require('../models/Lesson')
const LessonView = require('../models/LessonView')
const QuizAttempt = require('../models/QuizAttempt')
const PracticeProgress = require('../models/PracticeProgress')
const AssignmentSubmission = require('../models/AssignmentSubmission')
const ProgressEvent = require('../models/ProgressEvent')
const { TopicAccess } = require('../models/StudentProgress')
const { UNLOCK_RULE_TYPES, TOPIC_LOCK_STATE, ENROLL_NOTIFY } = require('../constants/enrollment')
const notificationService = require('./notification.service')

/**
 * Evaluate whether a student may access a topic under learning-path rules.
 */
async function evaluateTopicAccess(studentId, topicId) {
  const topic = await Topic.findById(topicId).lean()
  if (!topic || topic.deletedAt) {
    return { unlocked: false, reason: 'Topic not found', topic: null }
  }

  const override = await TopicAccess.findOne({ student: studentId, topic: topicId }).lean()
  if (override?.lockState === TOPIC_LOCK_STATE.FORCED_LOCK) {
    return { unlocked: false, reason: 'Locked by teacher', topic, override }
  }
  if (override?.lockState === TOPIC_LOCK_STATE.FORCED_UNLOCK) {
    return { unlocked: true, reason: 'Manually unlocked', topic, override }
  }

  if (topic.isEntryTopic || !(topic.unlockRules || []).length) {
    return { unlocked: true, reason: 'Entry topic / no rules', topic, override }
  }

  const results = []
  for (const rule of topic.unlockRules) {
    if (rule.enabled === false) continue
    const r = await evaluateRule(studentId, topic, rule)
    results.push(r)
    if (!r.passed) {
      return {
        unlocked: false,
        reason: r.message,
        failedRule: rule.type,
        results,
        topic,
        override,
      }
    }
  }

  return { unlocked: true, reason: 'All rules passed', results, topic, override }
}

async function evaluateRule(studentId, topic, rule) {
  const type = rule.type
  const cfg = rule.config || {}

  if (type === UNLOCK_RULE_TYPES.MANUAL_UNLOCK) {
    const access = await TopicAccess.findOne({
      student: studentId,
      topic: topic._id,
      lockState: TOPIC_LOCK_STATE.FORCED_UNLOCK,
    }).lean()
    return {
      type,
      passed: Boolean(access),
      message: access ? 'Manually unlocked' : 'Requires teacher unlock',
    }
  }

  if (type === UNLOCK_RULE_TYPES.PREVIOUS_TOPIC) {
    const prevId = cfg.topicId
    if (!prevId) {
      // Infer previous by displayOrder within same week
      const prev = await Topic.findOne({
        week: topic.week,
        deletedAt: null,
        displayOrder: { $lt: topic.displayOrder },
      })
        .sort({ displayOrder: -1 })
        .lean()
      if (!prev) return { type, passed: true, message: 'No previous topic' }
      const done = await isTopicCompleted(studentId, prev._id)
      return {
        type,
        passed: done,
        message: done ? 'Previous topic completed' : `Complete "${prev.name}" first`,
      }
    }
    const done = await isTopicCompleted(studentId, prevId)
    return {
      type,
      passed: done,
      message: done ? 'Previous topic completed' : 'Previous topic not completed',
    }
  }

  if (type === UNLOCK_RULE_TYPES.MIN_QUIZ_SCORE) {
    const min = Number(cfg.minScore ?? 60)
    const attempt = await QuizAttempt.findOne({
      student: studentId,
      ...(cfg.quizId ? { quiz: cfg.quizId } : { course: topic.course }),
      status: { $in: ['submitted', 'auto_submitted'] },
    })
      .sort({ percentage: -1 })
      .select('percentage passed quiz')
      .lean()
    const score = attempt?.percentage ?? 0
    return {
      type,
      passed: score >= min,
      message: score >= min ? `Quiz score ${score}%` : `Need quiz score ≥ ${min}% (have ${score}%)`,
      score,
    }
  }

  if (type === UNLOCK_RULE_TYPES.MIN_PRACTICE_SCORE) {
    const min = Number(cfg.minScore ?? 70)
    const filter = { user: studentId }
    if (cfg.questionId) filter.question = cfg.questionId
    const rows = await PracticeProgress.find(filter).select('bestScore').lean()
    const avg =
      rows.length > 0 ? rows.reduce((s, r) => s + (r.bestScore || 0), 0) / rows.length : 0
    return {
      type,
      passed: avg >= min,
      message: avg >= min ? `Practice avg ${Math.round(avg)}%` : `Need practice ≥ ${min}%`,
      score: avg,
    }
  }

  if (type === UNLOCK_RULE_TYPES.ASSIGNMENT_APPROVED) {
    const filter = {
      student: studentId,
      status: 'approved',
    }
    if (cfg.assignmentId) filter.assignment = cfg.assignmentId
    const sub = await AssignmentSubmission.findOne(filter).lean()
    return {
      type,
      passed: Boolean(sub),
      message: sub ? 'Assignment approved' : 'Assignment must be approved',
    }
  }

  if (type === UNLOCK_RULE_TYPES.TEACHER_APPROVAL) {
    const access = await TopicAccess.findOne({
      student: studentId,
      topic: topic._id,
      lockState: TOPIC_LOCK_STATE.FORCED_UNLOCK,
    }).lean()
    return {
      type,
      passed: Boolean(access),
      message: access ? 'Teacher approved' : 'Waiting for teacher approval',
    }
  }

  if (type === UNLOCK_RULE_TYPES.REQUIRED_ATTENDANCE) {
    // Architecture placeholder — attendance module later
    return {
      type,
      passed: true,
      message: 'Attendance rule deferred (architecture-ready)',
      deferred: true,
    }
  }

  if (type === UNLOCK_RULE_TYPES.MIN_CODING_TIME) {
    const minMinutes = Number(cfg.minutes ?? 30)
    const coding = await ProgressEvent.find({
      user: studentId,
      course: topic.course,
      eventType: 'coding_time',
    })
      .select('value')
      .lean()
    const seconds = coding.reduce((s, e) => s + (e.value || 0), 0)
    const minutes = seconds / 60
    return {
      type,
      passed: minutes >= minMinutes,
      message:
        minutes >= minMinutes
          ? `Coding time ${Math.round(minutes)}m`
          : `Need ${minMinutes}m coding time (have ${Math.round(minutes)}m)`,
    }
  }

  return { type, passed: true, message: `Unknown rule ${type} — treated as pass` }
}

async function isTopicCompleted(studentId, topicId) {
  const access = await TopicAccess.findOne({ student: studentId, topic: topicId, completed: true }).lean()
  if (access) return true

  const lessons = await Lesson.find({ topic: topicId, deletedAt: null }).select('_id').lean()
  if (!lessons.length) return false
  const views = await LessonView.countDocuments({
    user: studentId,
    lesson: { $in: lessons.map((l) => l._id) },
    completed: true,
  })
  return views >= lessons.length
}

async function markTopicCompleted(studentId, topicId, courseId) {
  const doc = await TopicAccess.findOneAndUpdate(
    { student: studentId, topic: topicId },
    {
      student: studentId,
      topic: topicId,
      course: courseId,
      completed: true,
      completedAt: new Date(),
    },
    { upsert: true, new: true }
  )
  await ProgressEvent.create({
    user: studentId,
    course: courseId,
    eventType: 'topic_completed',
    value: 1,
    meta: { topicId },
  })
  return doc
}

async function setTopicLock(studentId, topicId, courseId, lockState, teacherId, notes = '') {
  const doc = await TopicAccess.findOneAndUpdate(
    { student: studentId, topic: topicId },
    {
      student: studentId,
      topic: topicId,
      course: courseId,
      lockState,
      unlockedAt: lockState === TOPIC_LOCK_STATE.FORCED_UNLOCK ? new Date() : undefined,
      unlockedBy: teacherId,
      notes,
    },
    { upsert: true, new: true }
  )
  if (lockState === TOPIC_LOCK_STATE.FORCED_UNLOCK) {
    await ProgressEvent.create({
      user: studentId,
      course: courseId,
      eventType: 'topic_unlocked',
      value: 1,
      meta: { topicId, by: teacherId },
    })
    await notificationService.notifyUser({
      userId: studentId,
      templateKey: ENROLL_NOTIFY.TOPIC_UNLOCKED,
      title: 'Topic unlocked',
      body: 'A teacher unlocked a new topic for you.',
      link: `/student/learn/${courseId}`,
      meta: { topicId },
    })
  }
  return doc
}

async function getCourseLearningPath(studentId, courseId) {
  const topics = await Topic.find({ course: courseId, deletedAt: null })
    .sort({ displayOrder: 1 })
    .select('name slug displayOrder week module unlockRules isEntryTopic status shortDescription')
    .lean()

  const path = []
  for (const topic of topics) {
    const access = await evaluateTopicAccess(studentId, topic._id)
    const completed = await isTopicCompleted(studentId, topic._id)
    path.push({
      topic,
      unlocked: access.unlocked,
      completed,
      reason: access.reason,
      failedRule: access.failedRule || null,
    })
  }
  return { courseId, path }
}

module.exports = {
  evaluateTopicAccess,
  evaluateRule,
  isTopicCompleted,
  markTopicCompleted,
  setTopicLock,
  getCourseLearningPath,
  UNLOCK_RULE_TYPES,
}
