const mongoose = require('mongoose')
const {
  XP_EVENTS,
  BADGE_TIERS,
  DEFAULT_XP_VALUES,
  DEFAULT_LEVELS,
  DEFAULT_STREAK_RULES,
} = require('../constants/gamification')

const levelSchema = new mongoose.Schema(
  {
    level: { type: Number, required: true },
    xpRequired: { type: Number, required: true, min: 0 },
    title: { type: String, default: '' },
  },
  { _id: false }
)

const gamificationSettingsSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    enabled: { type: Boolean, default: true },
    xpValues: {
      type: Map,
      of: Number,
      default: () => ({ ...DEFAULT_XP_VALUES }),
    },
    levels: { type: [levelSchema], default: () => [...DEFAULT_LEVELS] },
    streakRules: {
      inactivityDaysReset: { type: Number, default: DEFAULT_STREAK_RULES.inactivityDaysReset },
      weeklyBonusDay: { type: Number, default: DEFAULT_STREAK_RULES.weeklyBonusDay },
      monthlyBonusDay: { type: Number, default: DEFAULT_STREAK_RULES.monthlyBonusDay },
      activities: { type: [String], default: () => [...DEFAULT_STREAK_RULES.activities] },
    },
    leaderboardEnabled: { type: Boolean, default: true },
    publicPortfolioEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

gamificationSettingsSchema.index({ institute: 1 }, { unique: true, sparse: true })

/** Per-course gamification config (legacy + course overrides). */
const courseGamificationSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    enabled: { type: Boolean, default: true },
    xpPerLesson: { type: Number, default: 50 },
    xpPerChallenge: { type: Number, default: 100 },
    xpPerQuiz: { type: Number, default: 75 },
    levels: [levelSchema],
    badges: [
      {
        key: String,
        label: String,
        description: String,
        icon: String,
        tier: { type: String, enum: Object.values(BADGE_TIERS), default: BADGE_TIERS.BRONZE },
      },
    ],
    dailyGoalXp: { type: Number, default: 100 },
    weeklyGoalXp: { type: Number, default: 500 },
    monthlyChallengesEnabled: { type: Boolean, default: false },
    leaderboardEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const badgeDefinitionSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'award' },
    tier: {
      type: String,
      enum: Object.values(BADGE_TIERS),
      default: BADGE_TIERS.BRONZE,
    },
    imageUrl: { type: String, default: '' },
    autoAward: { type: Boolean, default: true },
    criteria: { type: mongoose.Schema.Types.Mixed, default: {} },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

badgeDefinitionSchema.index({ key: 1, institute: 1 }, { unique: true })

const achievementDefinitionSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    key: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'trophy' },
    xpReward: { type: Number, default: 0 },
    badgeKey: { type: String, default: null },
    criteria: {
      type: { type: String, default: 'event' },
      event: { type: String, default: '' },
      threshold: { type: Number, default: 1 },
      meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

achievementDefinitionSchema.index({ key: 1, institute: 1 }, { unique: true })

const studentGamificationSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    badgesUnlocked: [{ type: String }],
    dailyXp: { type: Number, default: 0 },
    weeklyXp: { type: Number, default: 0 },
    monthlyXp: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
  },
  { timestamps: true }
)

studentGamificationSchema.index({ user: 1, course: 1 }, { unique: true })
studentGamificationSchema.index({ course: 1, xp: -1 })
studentGamificationSchema.index({ weeklyXp: -1 })
studentGamificationSchema.index({ monthlyXp: -1 })

/** Overall student profile for portfolio, levels, streaks. */
const studentProfileSchema = new mongoose.Schema(
  {
    institute: { type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalXp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    badges: [
      {
        key: { type: String },
        awardedAt: { type: Date, default: Date.now },
        awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        source: { type: String, default: 'auto' },
      },
    ],
    achievements: [
      {
        key: { type: String },
        unlockedAt: { type: Date, default: Date.now },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    streakDays: { type: Number, default: 0 },
    weeklyStreak: { type: Number, default: 0 },
    monthlyStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
    portfolioSlug: { type: String, unique: true, sparse: true },
    portfolioPublic: { type: Boolean, default: false },
    timeline: [
      {
        at: { type: Date, default: Date.now },
        type: { type: String },
        title: { type: String },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    stats: {
      lessonsCompleted: { type: Number, default: 0 },
      practiceCompleted: { type: Number, default: 0 },
      assignmentsSubmitted: { type: Number, default: 0 },
      assignmentsApproved: { type: Number, default: 0 },
      quizzesPassed: { type: Number, default: 0 },
      coursesCompleted: { type: Number, default: 0 },
      codingSessions: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
)

studentProfileSchema.index({ totalXp: -1 })

const xpLedgerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    event: { type: String, enum: Object.values(XP_EVENTS), required: true },
    amount: { type: Number, required: true },
    reason: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

xpLedgerSchema.index({ user: 1, createdAt: -1 })
xpLedgerSchema.index({ user: 1, event: 1, 'meta.refId': 1 })

module.exports = {
  GamificationSettings: mongoose.model('GamificationSettings', gamificationSettingsSchema),
  CourseGamification: mongoose.model('CourseGamification', courseGamificationSchema),
  BadgeDefinition: mongoose.model('BadgeDefinition', badgeDefinitionSchema),
  AchievementDefinition: mongoose.model('AchievementDefinition', achievementDefinitionSchema),
  StudentGamification: mongoose.model('StudentGamification', studentGamificationSchema),
  StudentProfile: mongoose.model('StudentProfile', studentProfileSchema),
  XpLedger: mongoose.model('XpLedger', xpLedgerSchema),
}
