const User = require('../models/User')
const Enrollment = require('../models/Enrollment')
const { Certificate } = require('../models/Certificate')
const {
  StudentProfile,
  BadgeDefinition,
  AchievementDefinition,
} = require('../models/Gamification')
const { StudentProgress } = require('../models/StudentProgress')
const gamificationService = require('./gamification.service')
const notificationService = require('./notification.service')
const { CERTIFICATE_STATUS } = require('../constants/certificate')
const { GAMIFICATION_NOTIFY } = require('../constants/gamification')
const { ApiError } = require('../utils/helpers')
const { ENROLLMENT_STATUS } = require('../constants/enrollment')

async function buildPortfolio(userId, { publicView = false } = {}) {
  const user = await User.findById(userId).select('fullName email profileImage bio role')
  if (!user) throw new ApiError(404, 'Student not found')

  const profile = await gamificationService.ensureProfile(userId)
  if (publicView && !profile.portfolioPublic) {
    throw new ApiError(404, 'Portfolio is private')
  }

  const settings = await gamificationService.getSettings()
  const levelInfo = gamificationService.levelForXp(settings.levels, profile.totalXp)

  const [enrollments, certificates, badgeDefs, achievementDefs, progressDocs] = await Promise.all([
    Enrollment.find({
      student: userId,
      status: { $in: [ENROLLMENT_STATUS.COMPLETED, ENROLLMENT_STATUS.ACTIVE] },
    })
      .populate('course', 'title slug thumbnail')
      .lean(),
    Certificate.find({ user: userId, status: CERTIFICATE_STATUS.ISSUED })
      .populate('course', 'title slug')
      .sort({ issuedAt: -1 })
      .lean(),
    BadgeDefinition.find({ key: { $in: (profile.badges || []).map((b) => b.key) } }).lean(),
    AchievementDefinition.find({ active: true }).lean(),
    StudentProgress.find({ student: userId }).populate('course', 'title slug').lean(),
  ])

  const completedCourses = enrollments.filter((e) => e.status === ENROLLMENT_STATUS.COMPLETED)

  return {
    student: {
      _id: user._id,
      fullName: user.fullName,
      profileImage: user.profileImage,
      bio: user.bio,
    },
    portfolioSlug: profile.portfolioSlug,
    portfolioPublic: profile.portfolioPublic,
    xp: profile.totalXp,
    level: profile.level,
    levelInfo: levelInfo.current,
    nextLevel: levelInfo.next,
    progressToNextLevel: levelInfo.progress,
    streakDays: profile.streakDays,
    longestStreak: profile.longestStreak,
    stats: profile.stats,
    badges: (profile.badges || []).map((b) => ({
      ...b,
      definition: badgeDefs.find((d) => d.key === b.key) || null,
    })),
    achievements: achievementDefs.map((d) => ({
      ...d,
      unlocked: (profile.achievements || []).some((a) => a.key === d.key),
      unlockedAt: (profile.achievements || []).find((a) => a.key === d.key)?.unlockedAt || null,
    })),
    certificates: certificates.map((c) => ({
      _id: c._id,
      certificateNumber: c.certificateNumber,
      courseName: c.courseName,
      issuedAt: c.issuedAt,
      verificationUrl: c.verificationUrl,
      type: c.type,
      course: c.course,
    })),
    completedCourses: completedCourses.map((e) => ({
      enrollmentId: e._id,
      course: e.course,
      completedAt: e.completedAt,
      overallProgress: e.overallProgress,
    })),
    activeCourses: enrollments
      .filter((e) => e.status === ENROLLMENT_STATUS.ACTIVE)
      .map((e) => ({
        enrollmentId: e._id,
        course: e.course,
        overallProgress: e.overallProgress,
      })),
    codingStatistics: {
      practiceCompleted: profile.stats?.practiceCompleted || 0,
      codingSessions: profile.stats?.codingSessions || 0,
      codingTimeSeconds: progressDocs.reduce((s, p) => s + (p.codingTimeSeconds || 0), 0),
    },
    practiceStatistics: progressDocs.map((p) => ({
      course: p.course,
      practiceCompleted: p.practiceCompleted || 0,
    })),
    assignmentStatistics: progressDocs.map((p) => ({
      course: p.course,
      assignmentsCompleted: p.assignmentsCompleted || 0,
    })),
    quizStatistics: progressDocs.map((p) => ({
      course: p.course,
      quizzesPassed: p.quizzesPassed || 0,
      quizzesCompleted: p.quizzesCompleted || 0,
    })),
    timeline: (profile.timeline || []).slice(0, 50),
  }
}

async function setPortfolioVisibility(userId, isPublic) {
  const profile = await gamificationService.ensureProfile(userId)
  profile.portfolioPublic = Boolean(isPublic)
  await profile.save()
  await notificationService.notifyUser({
    userId,
    templateKey: GAMIFICATION_NOTIFY.PORTFOLIO_UPDATED,
    title: 'Portfolio updated',
    body: isPublic ? 'Your portfolio is now public.' : 'Your portfolio is now private.',
    link: '/student/portfolio',
  })
  return { portfolioPublic: profile.portfolioPublic, portfolioSlug: profile.portfolioSlug }
}

async function getPublicPortfolio(slug) {
  const profile = await StudentProfile.findOne({ portfolioSlug: slug, portfolioPublic: true })
  if (!profile) throw new ApiError(404, 'Portfolio not found')
  return buildPortfolio(profile.user, { publicView: true })
}

module.exports = {
  buildPortfolio,
  setPortfolioVisibility,
  getPublicPortfolio,
}
