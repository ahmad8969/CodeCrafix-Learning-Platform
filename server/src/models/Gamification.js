const mongoose = require('mongoose')

/** Per-course gamification config + student XP ledger (architecture ready). */
const courseGamificationSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true },
    enabled: { type: Boolean, default: false },
    xpPerLesson: { type: Number, default: 50 },
    xpPerChallenge: { type: Number, default: 100 },
    xpPerQuiz: { type: Number, default: 75 },
    levels: [
      {
        level: Number,
        xpRequired: Number,
        title: String,
      },
    ],
    badges: [
      {
        key: String,
        label: String,
        description: String,
        icon: String,
      },
    ],
    dailyGoalXp: { type: Number, default: 100 },
    weeklyGoalXp: { type: Number, default: 500 },
    monthlyChallengesEnabled: { type: Boolean, default: false },
    leaderboardEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
)

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
    streakDays: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null },
  },
  { timestamps: true }
)

studentGamificationSchema.index({ user: 1, course: 1 }, { unique: true })
studentGamificationSchema.index({ course: 1, xp: -1 })

module.exports = {
  CourseGamification: mongoose.model('CourseGamification', courseGamificationSchema),
  StudentGamification: mongoose.model('StudentGamification', studentGamificationSchema),
}
