require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const User = require('../models/User')
const { ROLES } = require('../constants')
const { CertificateTemplate, CertificateRule, Certificate } = require('../models/Certificate')
const { CERTIFICATE_TYPES, APPROVAL_MODE, CERTIFICATE_STATUS } = require('../constants/certificate')
const gamificationService = require('../services/gamification.service')
const achievementService = require('../services/achievement.service')
const certificateService = require('../services/certificate.service')

async function seedCertificates() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const student = await User.findOne({ role: ROLES.STUDENT })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  if (!admin || !course) throw new Error('Run seed + seed:courses first')

  await achievementService.seedDefaults()
  await gamificationService.getSettings()
  console.log('Achievements + gamification settings ready')

  let template = await CertificateTemplate.findOne({ name: 'CodeCrafters Course Completion' })
  if (!template) {
    template = await certificateService.createTemplate(
      {
        name: 'CodeCrafters Course Completion',
        type: CERTIFICATE_TYPES.COURSE,
        titleText: 'Certificate of Completion',
        bodyText:
          'This is to certify that {{studentName}} has successfully completed {{courseName}} at CodeCrafters Learning Platform.',
        primaryColor: '#0d9488',
        accentColor: '#134e4a',
        showQr: true,
        showSeal: true,
        showInstructor: true,
        isDefault: true,
        active: true,
        signatures: [
          { name: 'Program Director', title: 'CodeCrafters Institute', imageUrl: '' },
        ],
      },
      admin._id
    )
    console.log('Created default certificate template')
  } else {
    console.log('Template exists')
  }

  await CertificateRule.findOneAndUpdate(
    { course: course._id, module: null, certificateType: CERTIFICATE_TYPES.COURSE },
    {
      course: course._id,
      module: null,
      certificateType: CERTIFICATE_TYPES.COURSE,
      template: template._id,
      enabled: true,
      minAttendancePercent: 0,
      minQuizScore: 0,
      minAssignmentMarksPercent: 0,
      minPracticeScore: 0,
      minCourseCompletionPercent: 80,
      approvalMode: APPROVAL_MODE.AUTOMATIC,
      teacherApprovalRequired: false,
      createdBy: admin._id,
    },
    { upsert: true }
  )
  console.log('Certificate rules configured')

  if (student) {
    await gamificationService.awardXp({
      userId: student._id,
      courseId: course._id,
      event: gamificationService.XP_EVENTS.MANUAL,
      amount: 150,
      reason: 'Seed welcome XP',
      meta: { refId: `seed-xp-${student._id}` },
      awardedBy: admin._id,
    })
    await gamificationService.awardBadge({
      userId: student._id,
      badgeKey: 'streak_bronze',
      awardedBy: admin._id,
      source: 'manual',
    })

    const existing = await Certificate.findOne({
      user: student._id,
      course: course._id,
      status: CERTIFICATE_STATUS.ISSUED,
    })
    if (!existing) {
      try {
        await certificateService.issueCertificate({
          studentId: student._id,
          courseId: course._id,
          type: CERTIFICATE_TYPES.COURSE,
          actorId: admin._id,
          force: true,
          skipEligibility: true,
        })
        console.log('Issued sample certificate for student')
      } catch (err) {
        console.log('Certificate issue skipped:', err.message)
      }
    } else {
      console.log('Sample certificate exists:', existing.certificateNumber)
    }
  }

  console.log('seed:certificates complete')
  process.exit(0)
}

seedCertificates().catch((err) => {
  console.error(err)
  process.exit(1)
})
