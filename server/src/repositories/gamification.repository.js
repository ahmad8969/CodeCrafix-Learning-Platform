const {
  StudentProfile,
  StudentGamification,
  XpLedger,
  BadgeDefinition,
  AchievementDefinition,
  GamificationSettings,
} = require('../models/Gamification')

module.exports = {
  findProfile: (userId) => StudentProfile.findOne({ user: userId }),
  findCourseStats: (userId, courseId) => StudentGamification.findOne({ user: userId, course: courseId }),
  listXpLedger: (userId, limit = 50) =>
    XpLedger.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean(),
  listBadges: (filter) => BadgeDefinition.find(filter),
  listAchievements: (filter) => AchievementDefinition.find(filter),
  getSettings: (instituteId) =>
    GamificationSettings.findOne(instituteId ? { institute: instituteId } : { institute: null }),
}
