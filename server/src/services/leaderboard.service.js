const {
  StudentGamification,
  StudentProfile,
} = require('../models/Gamification')
const Enrollment = require('../models/Enrollment')
const { StudentProgress } = require('../models/StudentProgress')
const QuizAttempt = require('../models/QuizAttempt')
const AssignmentSubmission = require('../models/AssignmentSubmission')
const PracticeAttempt = require('../models/PracticeAttempt')
const {
  LEADERBOARD_SCOPES,
  LEADERBOARD_METRICS,
} = require('../constants/gamification')
const gamificationService = require('./gamification.service')
const { ApiError } = require('../utils/helpers')

async function leaderboard({
  scope = LEADERBOARD_SCOPES.OVERALL,
  metric = LEADERBOARD_METRICS.XP,
  courseId,
  batchId,
  limit = 20,
} = {}) {
  const settings = await gamificationService.getSettings()
  if (!settings.leaderboardEnabled) {
    throw new ApiError(403, 'Leaderboards are disabled')
  }

  const lim = Math.min(100, Math.max(1, Number(limit) || 20))

  if (metric === LEADERBOARD_METRICS.XP) {
    if (scope === LEADERBOARD_SCOPES.COURSE || courseId) {
      if (!courseId) throw new ApiError(400, 'courseId required for course leaderboard')
      const sortField =
        scope === LEADERBOARD_SCOPES.WEEKLY
          ? 'weeklyXp'
          : scope === LEADERBOARD_SCOPES.MONTHLY
            ? 'monthlyXp'
            : 'xp'
      const items = await StudentGamification.find({ course: courseId })
        .sort({ [sortField]: -1 })
        .limit(lim)
        .populate('user', 'fullName email profileImage')
        .lean()
      return {
        scope,
        metric,
        courseId,
        items: items.map((r, i) => ({
          rank: i + 1,
          user: r.user,
          value: r[sortField] || 0,
          level: r.level,
          streakDays: r.streakDays,
        })),
      }
    }

    if (scope === LEADERBOARD_SCOPES.BATCH || batchId) {
      if (!batchId) throw new ApiError(400, 'batchId required for batch leaderboard')
      const enrollments = await Enrollment.find({
        batch: batchId,
        status: { $in: ['active', 'completed'] },
      })
        .select('student')
        .lean()
      const studentIds = enrollments.map((e) => e.student)
      const profiles = await StudentProfile.find({ user: { $in: studentIds } })
        .sort({ totalXp: -1 })
        .limit(lim)
        .populate('user', 'fullName email profileImage')
        .lean()
      return {
        scope: LEADERBOARD_SCOPES.BATCH,
        metric,
        batchId,
        items: profiles.map((p, i) => ({
          rank: i + 1,
          user: p.user,
          value: p.totalXp,
          level: p.level,
          streakDays: p.streakDays,
        })),
      }
    }

    // overall / weekly / monthly / all-time via profile or course aggregates
    if (scope === LEADERBOARD_SCOPES.WEEKLY || scope === LEADERBOARD_SCOPES.MONTHLY) {
      const field = scope === LEADERBOARD_SCOPES.WEEKLY ? 'weeklyXp' : 'monthlyXp'
      const rows = await StudentGamification.aggregate([
        { $group: { _id: '$user', value: { $sum: `$${field}` }, level: { $max: '$level' } } },
        { $sort: { value: -1 } },
        { $limit: lim },
      ])
      const users = await require('../models/User')
        .find({ _id: { $in: rows.map((r) => r._id) } })
        .select('fullName email profileImage')
        .lean()
      const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))
      return {
        scope,
        metric,
        items: rows.map((r, i) => ({
          rank: i + 1,
          user: byId[String(r._id)] || { _id: r._id },
          value: r.value,
          level: r.level,
        })),
      }
    }

    const profiles = await StudentProfile.find()
      .sort({ totalXp: -1 })
      .limit(lim)
      .populate('user', 'fullName email profileImage')
      .lean()
    return {
      scope: LEADERBOARD_SCOPES.OVERALL,
      metric,
      items: profiles.map((p, i) => ({
        rank: i + 1,
        user: p.user,
        value: p.totalXp,
        level: p.level,
        streakDays: p.streakDays,
      })),
    }
  }

  if (metric === LEADERBOARD_METRICS.LESSONS) {
    const mongoose = require('mongoose')
    const match = courseId ? { course: new mongoose.Types.ObjectId(String(courseId)) } : {}
    const rows = await StudentProgress.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$student', value: { $sum: '$lessonsCompleted' } } },
      { $sort: { value: -1 } },
      { $limit: lim },
    ])
    const User = require('../models/User')
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
      .select('fullName email profileImage')
      .lean()
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))
    return {
      scope,
      metric,
      items: rows.map((r, i) => ({
        rank: i + 1,
        user: byId[String(r._id)] || { _id: r._id },
        value: r.value,
      })),
    }
  }

  if (metric === LEADERBOARD_METRICS.QUIZ) {
    const match = { passed: true }
    if (courseId) match.course = courseId
    const rows = await QuizAttempt.aggregate([
      { $match: match },
      { $group: { _id: '$student', value: { $avg: '$percentage' }, count: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: lim },
    ])
    const User = require('../models/User')
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
      .select('fullName email profileImage')
      .lean()
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))
    return {
      scope,
      metric,
      items: rows.map((r, i) => ({
        rank: i + 1,
        user: byId[String(r._id)] || { _id: r._id },
        value: Math.round((r.value || 0) * 10) / 10,
        count: r.count,
      })),
    }
  }

  if (metric === LEADERBOARD_METRICS.ASSIGNMENT) {
    const match = { status: 'approved' }
    if (courseId) match.course = courseId
    const rows = await AssignmentSubmission.aggregate([
      { $match: match },
      { $group: { _id: '$student', value: { $avg: '$percentage' }, count: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: lim },
    ])
    const User = require('../models/User')
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
      .select('fullName email profileImage')
      .lean()
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))
    return {
      scope,
      metric,
      items: rows.map((r, i) => ({
        rank: i + 1,
        user: byId[String(r._id)] || { _id: r._id },
        value: Math.round((r.value || 0) * 10) / 10,
        count: r.count,
      })),
    }
  }

  if (metric === LEADERBOARD_METRICS.CODING) {
    const rows = await PracticeAttempt.aggregate([
      { $match: { status: 'passed' } },
      { $group: { _id: '$user', value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: lim },
    ])
    const User = require('../models/User')
    const users = await User.find({ _id: { $in: rows.map((r) => r._id) } })
      .select('fullName email profileImage')
      .lean()
    const byId = Object.fromEntries(users.map((u) => [String(u._id), u]))
    return {
      scope,
      metric,
      items: rows.map((r, i) => ({
        rank: i + 1,
        user: byId[String(r._id)] || { _id: r._id },
        value: r.value,
      })),
    }
  }

  throw new ApiError(400, 'Unsupported leaderboard metric')
}

module.exports = { leaderboard, LEADERBOARD_SCOPES, LEADERBOARD_METRICS }
