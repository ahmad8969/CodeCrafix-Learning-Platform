const XP_EVENTS = Object.freeze({
  LESSON_COMPLETION: 'lesson_completion',
  PRACTICE_COMPLETION: 'practice_completion',
  QUIZ_COMPLETION: 'quiz_completion',
  ASSIGNMENT_SUBMISSION: 'assignment_submission',
  ASSIGNMENT_APPROVAL: 'assignment_approval',
  DAILY_LOGIN: 'daily_login',
  WEEKLY_STREAK: 'weekly_streak',
  COURSE_COMPLETION: 'course_completion',
  MANUAL: 'manual',
})

const BADGE_TIERS = Object.freeze({
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
  CUSTOM: 'custom',
})

const LEADERBOARD_SCOPES = Object.freeze({
  OVERALL: 'overall',
  COURSE: 'course',
  BATCH: 'batch',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'all_time',
})

const LEADERBOARD_METRICS = Object.freeze({
  XP: 'xp',
  LESSONS: 'lessons',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  CODING: 'coding',
})

const GAMIFICATION_NOTIFY = Object.freeze({
  BADGE_EARNED: 'badge_earned',
  LEVEL_UP: 'level_up',
  ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  STREAK_MILESTONE: 'streak_milestone',
  PORTFOLIO_UPDATED: 'portfolio_updated',
})

const DEFAULT_XP_VALUES = Object.freeze({
  [XP_EVENTS.LESSON_COMPLETION]: 50,
  [XP_EVENTS.PRACTICE_COMPLETION]: 100,
  [XP_EVENTS.QUIZ_COMPLETION]: 75,
  [XP_EVENTS.ASSIGNMENT_SUBMISSION]: 40,
  [XP_EVENTS.ASSIGNMENT_APPROVAL]: 60,
  [XP_EVENTS.DAILY_LOGIN]: 10,
  [XP_EVENTS.WEEKLY_STREAK]: 50,
  [XP_EVENTS.COURSE_COMPLETION]: 200,
})

const DEFAULT_LEVELS = Object.freeze([
  { level: 1, xpRequired: 0, title: 'Novice' },
  { level: 2, xpRequired: 100, title: 'Apprentice' },
  { level: 3, xpRequired: 300, title: 'Builder' },
  { level: 4, xpRequired: 700, title: 'Craftsman' },
  { level: 5, xpRequired: 1200, title: 'Expert' },
  { level: 6, xpRequired: 2000, title: 'Master' },
  { level: 7, xpRequired: 3500, title: 'Grandmaster' },
])

const DEFAULT_STREAK_RULES = Object.freeze({
  inactivityDaysReset: 1,
  weeklyBonusDay: 7,
  monthlyBonusDay: 30,
  activities: ['lesson', 'practice', 'assignment', 'quiz'],
})

module.exports = {
  XP_EVENTS,
  BADGE_TIERS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_METRICS,
  GAMIFICATION_NOTIFY,
  DEFAULT_XP_VALUES,
  DEFAULT_LEVELS,
  DEFAULT_STREAK_RULES,
}
