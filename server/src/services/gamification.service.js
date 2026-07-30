const crypto = require('crypto')
const {
  GamificationSettings,
  CourseGamification,
  BadgeDefinition,
  StudentGamification,
  StudentProfile,
  XpLedger,
} = require('../models/Gamification')
const {
  XP_EVENTS,
  DEFAULT_XP_VALUES,
  DEFAULT_LEVELS,
  DEFAULT_STREAK_RULES,
  GAMIFICATION_NOTIFY,
} = require('../constants/gamification')
const notificationService = require('./notification.service')
const { ApiError } = require('../utils/helpers')

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  const d1 = new Date(`${a}T00:00:00Z`)
  const d2 = new Date(`${b}T00:00:00Z`)
  return Math.round((d2 - d1) / 86400000)
}

function levelForXp(levels, xp) {
  const sorted = [...(levels || DEFAULT_LEVELS)].sort((a, b) => a.xpRequired - b.xpRequired)
  let current = sorted[0] || { level: 1, xpRequired: 0, title: 'Novice' }
  let next = null
  for (let i = 0; i < sorted.length; i += 1) {
    if (xp >= sorted[i].xpRequired) current = sorted[i]
    else {
      next = sorted[i]
      break
    }
  }
  if (!next && sorted.length) {
    const last = sorted[sorted.length - 1]
    next = {
      level: last.level + 1,
      xpRequired: last.xpRequired + Math.max(500, last.xpRequired),
      title: `Level ${last.level + 1}`,
    }
  }
  const progress =
    next && next.xpRequired > current.xpRequired
      ? Math.min(100, Math.round(((xp - current.xpRequired) / (next.xpRequired - current.xpRequired)) * 100))
      : 100
  return { current, next, progress }
}

async function getSettings(instituteId = null) {
  let settings = await GamificationSettings.findOne(
    instituteId ? { institute: instituteId } : { institute: null }
  )
  if (!settings) {
    settings = await GamificationSettings.create({
      institute: instituteId || null,
      enabled: true,
      xpValues: { ...DEFAULT_XP_VALUES },
      levels: [...DEFAULT_LEVELS],
      streakRules: { ...DEFAULT_STREAK_RULES },
    })
  }
  return settings
}

async function updateSettings(payload, instituteId = null) {
  const updates = {}
  if (payload.enabled != null) updates.enabled = Boolean(payload.enabled)
  if (payload.xpValues) updates.xpValues = payload.xpValues
  if (payload.levels) updates.levels = payload.levels
  if (payload.streakRules) updates.streakRules = payload.streakRules
  if (payload.leaderboardEnabled != null) updates.leaderboardEnabled = Boolean(payload.leaderboardEnabled)
  if (payload.publicPortfolioEnabled != null) {
    updates.publicPortfolioEnabled = Boolean(payload.publicPortfolioEnabled)
  }
  return GamificationSettings.findOneAndUpdate(
    { institute: instituteId || null },
    { $set: updates, $setOnInsert: { institute: instituteId || null } },
    { upsert: true, new: true }
  )
}

async function ensureProfile(userId, instituteId = null) {
  let profile = await StudentProfile.findOne({ user: userId })
  if (!profile) {
    const slug = `learner-${String(userId).slice(-6)}-${crypto.randomBytes(2).toString('hex')}`
    profile = await StudentProfile.create({
      user: userId,
      institute: instituteId,
      portfolioSlug: slug,
      timeline: [],
    })
  }
  return profile
}

function xpAmountFromSettings(settings, event, overrideAmount) {
  if (overrideAmount != null) return Math.max(0, Number(overrideAmount) || 0)
  const map = settings.xpValues instanceof Map ? Object.fromEntries(settings.xpValues) : settings.xpValues || {}
  return Math.max(0, Number(map[event] ?? DEFAULT_XP_VALUES[event] ?? 0) || 0)
}

async function applyStreak(profile, settings) {
  const today = todayKey()
  const resetAfter = settings.streakRules?.inactivityDaysReset ?? 1
  const last = profile.lastActiveDate
  let streakChanged = false
  let milestone = null

  if (!last) {
    profile.streakDays = 1
    profile.lastActiveDate = today
    streakChanged = true
  } else if (last === today) {
    return { streakChanged: false, milestone: null }
  } else {
    const gap = daysBetween(last, today)
    if (gap <= resetAfter + 0) {
      // consecutive calendar day (gap === 1) or same-day already handled
      if (gap === 1) profile.streakDays = (profile.streakDays || 0) + 1
      else if (gap > 1) profile.streakDays = 1
    } else {
      profile.streakDays = 1
    }
    profile.lastActiveDate = today
    streakChanged = true
  }

  profile.longestStreak = Math.max(profile.longestStreak || 0, profile.streakDays || 0)
  if (profile.streakDays % 7 === 0) {
    profile.weeklyStreak = (profile.weeklyStreak || 0) + 1
    milestone = profile.streakDays
  }
  if (profile.streakDays % 30 === 0) {
    profile.monthlyStreak = (profile.monthlyStreak || 0) + 1
    milestone = profile.streakDays
  }
  return { streakChanged, milestone }
}

async function awardXp({
  userId,
  courseId = null,
  event,
  amount = null,
  reason = '',
  meta = {},
  awardedBy = null,
  instituteId = null,
  skipAchievements = false,
} = {}) {
  if (!userId || !event) throw new ApiError(400, 'userId and event required')

  const settings = await getSettings(instituteId)
  if (!settings.enabled && event !== XP_EVENTS.MANUAL) {
    return { xpAwarded: 0, skipped: true }
  }

  // Idempotency for ref-based awards
  if (meta?.refId) {
    const existing = await XpLedger.findOne({
      user: userId,
      event,
      'meta.refId': String(meta.refId),
    }).lean()
    if (existing) {
      return { xpAwarded: 0, duplicate: true, ledgerId: existing._id }
    }
  }

  let xp = xpAmountFromSettings(settings, event, amount)

  // Course override
  if (courseId && [XP_EVENTS.LESSON_COMPLETION, XP_EVENTS.PRACTICE_COMPLETION, XP_EVENTS.QUIZ_COMPLETION].includes(event)) {
    const courseCfg = await CourseGamification.findOne({ course: courseId }).lean()
    if (courseCfg?.enabled === false) return { xpAwarded: 0, skipped: true }
    if (courseCfg) {
      if (event === XP_EVENTS.LESSON_COMPLETION && amount == null) xp = courseCfg.xpPerLesson ?? xp
      if (event === XP_EVENTS.PRACTICE_COMPLETION && amount == null) xp = courseCfg.xpPerChallenge ?? xp
      if (event === XP_EVENTS.QUIZ_COMPLETION && amount == null) xp = courseCfg.xpPerQuiz ?? xp
    }
  }

  if (xp <= 0 && event !== XP_EVENTS.DAILY_LOGIN) {
    // still track activity/streak for zero-xp events if needed
  }

  const profile = await ensureProfile(userId, instituteId)
  const previousLevel = profile.level

  if (xp > 0) {
    await XpLedger.create({
      user: userId,
      course: courseId,
      event,
      amount: xp,
      reason: reason || event,
      meta,
      awardedBy,
    })
    profile.totalXp = (profile.totalXp || 0) + xp
  }

  const { milestone } = await applyStreak(profile, settings)
  const { current, next, progress } = levelForXp(settings.levels, profile.totalXp)
  profile.level = current.level

  // Stats increments
  const stats = profile.stats || {}
  if (event === XP_EVENTS.LESSON_COMPLETION) stats.lessonsCompleted = (stats.lessonsCompleted || 0) + 1
  if (event === XP_EVENTS.PRACTICE_COMPLETION) stats.practiceCompleted = (stats.practiceCompleted || 0) + 1
  if (event === XP_EVENTS.ASSIGNMENT_SUBMISSION) {
    stats.assignmentsSubmitted = (stats.assignmentsSubmitted || 0) + 1
  }
  if (event === XP_EVENTS.ASSIGNMENT_APPROVAL) {
    stats.assignmentsApproved = (stats.assignmentsApproved || 0) + 1
  }
  if (event === XP_EVENTS.QUIZ_COMPLETION) stats.quizzesPassed = (stats.quizzesPassed || 0) + 1
  if (event === XP_EVENTS.COURSE_COMPLETION) stats.coursesCompleted = (stats.coursesCompleted || 0) + 1
  profile.stats = stats

  profile.timeline = [
    {
      at: new Date(),
      type: event,
      title: reason || event,
      meta: { amount: xp, ...meta },
    },
    ...(profile.timeline || []),
  ].slice(0, 100)

  await profile.save()

  if (courseId && xp > 0) {
    const courseLevel = levelForXp(settings.levels, profile.totalXp).current.level
    await StudentGamification.findOneAndUpdate(
      { user: userId, course: courseId },
      {
        $inc: { xp, dailyXp: xp, weeklyXp: xp, monthlyXp: xp },
        $set: {
          level: courseLevel,
          streakDays: profile.streakDays,
          longestStreak: profile.longestStreak,
          lastActiveDate: profile.lastActiveDate,
        },
        $setOnInsert: { user: userId, course: courseId, institute: instituteId },
      },
      { upsert: true }
    )
  }

  if (profile.level > previousLevel) {
    await notificationService.notifyUser({
      userId,
      instituteId,
      templateKey: GAMIFICATION_NOTIFY.LEVEL_UP,
      title: `Level up! You reached level ${profile.level}`,
      body: `Congratulations — you are now ${current.title || `Level ${profile.level}`}.`,
      link: '/student/portfolio',
      meta: { level: profile.level },
    })
  }

  if (milestone) {
    await notificationService.notifyUser({
      userId,
      instituteId,
      templateKey: GAMIFICATION_NOTIFY.STREAK_MILESTONE,
      title: `${milestone}-day learning streak!`,
      body: 'Keep showing up — consistency builds mastery.',
      link: '/student/portfolio',
      meta: { streakDays: milestone },
    })
  }

  let achievements = []
  if (!skipAchievements) {
    try {
      const achievementService = require('./achievement.service')
      achievements = await achievementService.evaluateAfterEvent({
        userId,
        event,
        profile,
        meta,
        instituteId,
      })
    } catch {
      /* non-blocking */
    }
  }

  // Weekly streak XP bonus
  let bonusXp = 0
  if (milestone && milestone % (settings.streakRules?.weeklyBonusDay || 7) === 0) {
    const bonus = await awardXp({
      userId,
      courseId,
      event: XP_EVENTS.WEEKLY_STREAK,
      reason: `${milestone}-day streak bonus`,
      meta: { refId: `streak-${userId}-${milestone}`, streakDays: milestone },
      instituteId,
      skipAchievements: true,
    })
    bonusXp = bonus.xpAwarded || 0
  }

  return {
    xpAwarded: xp + bonusXp,
    totalXp: profile.totalXp,
    level: profile.level,
    levelProgress: progress,
    nextLevel: next,
    streakDays: profile.streakDays,
    achievements,
  }
}

async function awardBadge({ userId, badgeKey, awardedBy = null, source = 'auto', instituteId = null }) {
  const def = await BadgeDefinition.findOne({ key: badgeKey, active: true })
  if (!def) return null
  const profile = await ensureProfile(userId, instituteId)
  if ((profile.badges || []).some((b) => b.key === badgeKey)) return { duplicate: true, key: badgeKey }

  profile.badges.push({ key: badgeKey, awardedAt: new Date(), awardedBy, source })
  profile.timeline.unshift({
    at: new Date(),
    type: 'badge',
    title: `Badge earned: ${def.label}`,
    meta: { badgeKey },
  })
  await profile.save()

  await notificationService.notifyUser({
    userId,
    instituteId,
    templateKey: GAMIFICATION_NOTIFY.BADGE_EARNED,
    title: `Badge earned: ${def.label}`,
    body: def.description || 'A new badge was added to your portfolio.',
    link: '/student/portfolio',
    meta: { badgeKey },
  })

  return { key: badgeKey, label: def.label, tier: def.tier }
}

async function getStudentSummary(userId, { courseId } = {}) {
  const settings = await getSettings()
  const profile = await ensureProfile(userId)
  const { current, next, progress } = levelForXp(settings.levels, profile.totalXp)
  let courseStats = null
  if (courseId) {
    courseStats = await StudentGamification.findOne({ user: userId, course: courseId }).lean()
  }
  const badges = await BadgeDefinition.find({
    key: { $in: (profile.badges || []).map((b) => b.key) },
  }).lean()
  return {
    totalXp: profile.totalXp,
    level: profile.level,
    levelInfo: current,
    nextLevel: next,
    progressToNextLevel: progress,
    streakDays: profile.streakDays,
    longestStreak: profile.longestStreak,
    weeklyStreak: profile.weeklyStreak,
    monthlyStreak: profile.monthlyStreak,
    badges: (profile.badges || []).map((b) => ({
      ...b,
      definition: badges.find((d) => d.key === b.key) || null,
    })),
    achievements: profile.achievements || [],
    stats: profile.stats,
    portfolioSlug: profile.portfolioSlug,
    portfolioPublic: profile.portfolioPublic,
    courseStats,
  }
}

async function recordDailyLogin(userId, instituteId = null) {
  return awardXp({
    userId,
    event: XP_EVENTS.DAILY_LOGIN,
    reason: 'Daily login',
    meta: { refId: `login-${userId}-${todayKey()}` },
    instituteId,
  })
}

async function listBadges(filters = {}) {
  const q = {}
  if (filters.active != null) q.active = filters.active
  return BadgeDefinition.find(q).sort({ tier: 1, label: 1 }).lean()
}

async function upsertBadge(payload) {
  if (!payload.key || !payload.label) throw new ApiError(400, 'key and label required')
  return BadgeDefinition.findOneAndUpdate(
    { key: payload.key, institute: payload.institute || null },
    { $set: payload },
    { upsert: true, new: true }
  )
}

async function getCourseConfig(courseId) {
  let cfg = await CourseGamification.findOne({ course: courseId })
  if (!cfg) {
    cfg = await CourseGamification.create({ course: courseId, enabled: true })
  }
  return cfg
}

async function updateCourseConfig(courseId, payload) {
  return CourseGamification.findOneAndUpdate(
    { course: courseId },
    { $set: payload, $setOnInsert: { course: courseId } },
    { upsert: true, new: true }
  )
}

async function adminDashboard() {
  const [profiles, issuedXp, topStudents] = await Promise.all([
    StudentProfile.countDocuments(),
    XpLedger.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    StudentProfile.find().sort({ totalXp: -1 }).limit(10).populate('user', 'fullName email').lean(),
  ])
  const byEvent = await XpLedger.aggregate([
    { $group: { _id: '$event', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ])
  return {
    studentProfiles: profiles,
    totalXpAwarded: issuedXp[0]?.total || 0,
    xpByEvent: byEvent,
    topStudents,
  }
}

module.exports = {
  getSettings,
  updateSettings,
  ensureProfile,
  awardXp,
  awardBadge,
  getStudentSummary,
  recordDailyLogin,
  listBadges,
  upsertBadge,
  getCourseConfig,
  updateCourseConfig,
  adminDashboard,
  levelForXp,
  todayKey,
  XP_EVENTS,
}
