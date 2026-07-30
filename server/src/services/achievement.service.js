const { AchievementDefinition, StudentProfile, BadgeDefinition } = require('../models/Gamification')
const gamificationService = require('./gamification.service')
const notificationService = require('./notification.service')
const { GAMIFICATION_NOTIFY } = require('../constants/gamification')
const { ApiError } = require('../utils/helpers')

const DEFAULT_ACHIEVEMENTS = [
  {
    key: 'first_login',
    title: 'First Login',
    description: 'Signed in for the first time',
    icon: 'log-in',
    xpReward: 10,
    criteria: { type: 'event', event: 'daily_login', threshold: 1 },
  },
  {
    key: 'first_lesson',
    title: 'First Lesson Completed',
    description: 'Completed your first lesson',
    icon: 'book-open',
    xpReward: 25,
    criteria: { type: 'stat', event: 'lessonsCompleted', threshold: 1 },
  },
  {
    key: 'first_practice',
    title: 'First Practice Completed',
    description: 'Passed your first practice challenge',
    icon: 'code',
    xpReward: 25,
    criteria: { type: 'stat', event: 'practiceCompleted', threshold: 1 },
  },
  {
    key: 'first_assignment',
    title: 'First Assignment Submitted',
    description: 'Submitted your first assignment',
    icon: 'clipboard',
    xpReward: 25,
    criteria: { type: 'stat', event: 'assignmentsSubmitted', threshold: 1 },
  },
  {
    key: 'first_quiz',
    title: 'First Quiz Passed',
    description: 'Passed your first quiz',
    icon: 'list-checks',
    xpReward: 25,
    criteria: { type: 'stat', event: 'quizzesPassed', threshold: 1 },
  },
  {
    key: 'streak_7',
    title: '7-Day Learning Streak',
    description: 'Learned for 7 consecutive days',
    icon: 'flame',
    xpReward: 50,
    badgeKey: 'streak_bronze',
    criteria: { type: 'streak', threshold: 7 },
  },
  {
    key: 'streak_30',
    title: '30-Day Learning Streak',
    description: 'Learned for 30 consecutive days',
    icon: 'flame',
    xpReward: 150,
    badgeKey: 'streak_gold',
    criteria: { type: 'streak', threshold: 30 },
  },
  {
    key: 'xp_100',
    title: '100 XP Earned',
    description: 'Reached 100 total XP',
    icon: 'zap',
    xpReward: 0,
    criteria: { type: 'xp', threshold: 100 },
  },
  {
    key: 'xp_1000',
    title: '1000 XP Earned',
    description: 'Reached 1000 total XP',
    icon: 'zap',
    xpReward: 0,
    badgeKey: 'xp_platinum',
    criteria: { type: 'xp', threshold: 1000 },
  },
  {
    key: 'course_completed',
    title: 'Course Completed',
    description: 'Completed a full course',
    icon: 'graduation-cap',
    xpReward: 50,
    badgeKey: 'course_gold',
    criteria: { type: 'stat', event: 'coursesCompleted', threshold: 1 },
  },
  {
    key: 'perfect_quiz',
    title: 'Perfect Quiz Score',
    description: 'Scored 100% on a quiz',
    icon: 'target',
    xpReward: 40,
    badgeKey: 'perfect_score',
    criteria: { type: 'meta', event: 'quiz_completion', metaKey: 'perfect', threshold: 1 },
  },
  {
    key: 'coding_champion',
    title: 'Coding Champion',
    description: 'Passed 10 practice challenges',
    icon: 'trophy',
    xpReward: 75,
    badgeKey: 'coding_diamond',
    criteria: { type: 'stat', event: 'practiceCompleted', threshold: 10 },
  },
  {
    key: 'fast_learner',
    title: 'Fast Learner',
    description: 'Completed 5 lessons',
    icon: 'rocket',
    xpReward: 40,
    criteria: { type: 'stat', event: 'lessonsCompleted', threshold: 5 },
  },
]

async function seedDefaults(instituteId = null) {
  for (const a of DEFAULT_ACHIEVEMENTS) {
    await AchievementDefinition.findOneAndUpdate(
      { key: a.key, institute: instituteId },
      { $set: { ...a, institute: instituteId, active: true } },
      { upsert: true }
    )
  }
  const defaultBadges = [
    { key: 'streak_bronze', label: 'Streak Starter', tier: 'bronze', description: '7-day streak' },
    { key: 'streak_gold', label: 'Streak Master', tier: 'gold', description: '30-day streak' },
    { key: 'xp_platinum', label: 'XP Legend', tier: 'platinum', description: '1000 XP' },
    { key: 'course_gold', label: 'Course Completer', tier: 'gold', description: 'Finished a course' },
    { key: 'perfect_score', label: 'Perfect Score', tier: 'silver', description: '100% quiz' },
    { key: 'coding_diamond', label: 'Coding Champion', tier: 'diamond', description: '10 practices' },
    { key: 'fast_finisher', label: 'Fast Finisher', tier: 'bronze', description: 'Quick quiz' },
  ]
  for (const b of defaultBadges) {
    await BadgeDefinition.findOneAndUpdate(
      { key: b.key, institute: instituteId },
      { $set: { ...b, institute: instituteId, active: true, autoAward: true } },
      { upsert: true }
    )
  }
  return { achievements: DEFAULT_ACHIEVEMENTS.length, badges: defaultBadges.length }
}

function matchesCriteria(def, { event, profile, meta }) {
  const c = def.criteria || {}
  if (c.type === 'event') {
    return event === c.event
  }
  if (c.type === 'stat') {
    const value = profile.stats?.[c.event] || 0
    return value >= (c.threshold || 1)
  }
  if (c.type === 'streak') {
    return (profile.streakDays || 0) >= (c.threshold || 1)
  }
  if (c.type === 'xp') {
    return (profile.totalXp || 0) >= (c.threshold || 1)
  }
  if (c.type === 'meta') {
    if (c.event && event !== c.event) return false
    if (c.metaKey === 'perfect') return Boolean(meta?.perfect || meta?.percentage >= 100)
    return Boolean(meta?.[c.metaKey])
  }
  return false
}

async function unlockAchievement(userId, def, profile, instituteId) {
  if ((profile.achievements || []).some((a) => a.key === def.key)) return null

  profile.achievements.push({ key: def.key, unlockedAt: new Date(), meta: {} })
  profile.timeline.unshift({
    at: new Date(),
    type: 'achievement',
    title: `Achievement unlocked: ${def.title}`,
    meta: { key: def.key },
  })
  await profile.save()

  if (def.xpReward > 0) {
    await gamificationService.awardXp({
      userId,
      event: gamificationService.XP_EVENTS.MANUAL,
      amount: def.xpReward,
      reason: `Achievement: ${def.title}`,
      meta: { refId: `ach-${userId}-${def.key}`, achievementKey: def.key },
      instituteId,
      skipAchievements: true,
    })
  }

  if (def.badgeKey) {
    await gamificationService.awardBadge({
      userId,
      badgeKey: def.badgeKey,
      source: 'achievement',
      instituteId,
    })
  }

  await notificationService.notifyUser({
    userId,
    instituteId,
    templateKey: GAMIFICATION_NOTIFY.ACHIEVEMENT_UNLOCKED,
    title: `Achievement unlocked: ${def.title}`,
    body: def.description || 'Great work!',
    link: '/student/portfolio',
    meta: { key: def.key },
  })

  return { key: def.key, title: def.title }
}

async function evaluateAfterEvent({ userId, event, profile: existingProfile, meta = {}, instituteId }) {
  const profile =
    existingProfile || (await gamificationService.ensureProfile(userId, instituteId))
  const defs = await AchievementDefinition.find({ active: true }).lean()
  const unlocked = []
  for (const def of defs) {
    if ((profile.achievements || []).some((a) => a.key === def.key)) continue
    if (!matchesCriteria(def, { event, profile, meta })) continue
    // reload profile to avoid stale achievements array
    const fresh = await StudentProfile.findOne({ user: userId })
    const result = await unlockAchievement(userId, def, fresh, instituteId)
    if (result) unlocked.push(result)
  }
  return unlocked
}

async function listAchievements(filters = {}) {
  const q = {}
  if (filters.active != null) q.active = filters.active
  return AchievementDefinition.find(q).sort({ sortOrder: 1, title: 1 }).lean()
}

async function upsertAchievement(payload) {
  if (!payload.key || !payload.title) throw new ApiError(400, 'key and title required')
  return AchievementDefinition.findOneAndUpdate(
    { key: payload.key, institute: payload.institute || null },
    { $set: payload },
    { upsert: true, new: true }
  )
}

async function getStudentAchievements(userId) {
  const profile = await gamificationService.ensureProfile(userId)
  const defs = await AchievementDefinition.find({ active: true }).lean()
  return defs.map((d) => ({
    ...d,
    unlocked: (profile.achievements || []).some((a) => a.key === d.key),
    unlockedAt: (profile.achievements || []).find((a) => a.key === d.key)?.unlockedAt || null,
  }))
}

module.exports = {
  seedDefaults,
  evaluateAfterEvent,
  listAchievements,
  upsertAchievement,
  getStudentAchievements,
  DEFAULT_ACHIEVEMENTS,
}
