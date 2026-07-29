require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Batch = require('../models/Batch')
const Topic = require('../models/Topic')
const User = require('../models/User')
const Enrollment = require('../models/Enrollment')
const { ROLES } = require('../constants')
const { ENROLLMENT_STATUS, ENROLLMENT_SOURCE } = require('../constants/enrollment')
const enrollmentService = require('../services/enrollment.service')

async function seedEnrollment() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const teacher = await User.findOne({ role: ROLES.TEACHER })
  const student = await User.findOne({ email: 'student@codecrafters.dev' })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  if (!admin || !course || !student) {
    throw new Error('Run seed + seed:courses first (need admin, course, student)')
  }

  let batch = await Batch.findOne({ batchCode: 'FSW-A1', course: course._id, deletedAt: null })
  if (!batch) {
    batch = await Batch.create({
      course: course._id,
      name: 'Full Stack Weekend A1',
      batchCode: 'FSW-A1',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 86400000),
      days: ['friday', 'saturday', 'sunday'],
      weeklySchedule: [
        { day: 'friday', startTime: '10:00 AM', endTime: '12:00 PM' },
        { day: 'saturday', startTime: '10:00 AM', endTime: '12:00 PM' },
        { day: 'sunday', startTime: '10:00 AM', endTime: '12:00 PM' },
      ],
      classTime: '10:00 AM',
      durationPerClass: '2 Hours',
      classDurationMinutes: 120,
      maximumStudents: 30,
      teacher: teacher?._id || admin._id,
      status: 'active',
      enrollmentCode: 'JOIN-FSW-A1',
      allowSelfEnroll: true,
      requireApproval: false,
      classroomLink: '',
      notes: 'Weekend cohort for Prompt 010 demo',
      createdBy: admin._id,
      updatedBy: admin._id,
    })
    console.log('Created batch FSW-A1')
  } else {
    batch.enrollmentCode = batch.enrollmentCode || 'JOIN-FSW-A1'
    batch.allowSelfEnroll = true
    batch.weeklySchedule = batch.weeklySchedule?.length
      ? batch.weeklySchedule
      : [
          { day: 'friday', startTime: '10:00 AM', endTime: '12:00 PM' },
          { day: 'saturday', startTime: '10:00 AM', endTime: '12:00 PM' },
          { day: 'sunday', startTime: '10:00 AM', endTime: '12:00 PM' },
        ]
    batch.status = 'active'
    await batch.save()
    console.log('Updated batch FSW-A1')
  }

  // Entry topic + next topic unlock rule
  const topics = await Topic.find({ course: course._id, deletedAt: null }).sort({ displayOrder: 1 })
  if (topics[0]) {
    topics[0].isEntryTopic = true
    topics[0].unlockRules = []
    await topics[0].save()
  }
  if (topics[1]) {
    topics[1].isEntryTopic = false
    topics[1].unlockRules = [
      {
        type: 'previous_topic_completed',
        config: { topicId: topics[0]._id },
        enabled: true,
      },
    ]
    await topics[1].save()
    console.log('Configured learning path unlock on', topics[1].slug)
  }

  const existing = await Enrollment.findOne({
    student: student._id,
    course: course._id,
    status: { $in: [ENROLLMENT_STATUS.ACTIVE, ENROLLMENT_STATUS.PENDING] },
    deletedAt: null,
  })
  if (!existing) {
    await enrollmentService.enrollStudent(
      {
        studentId: student._id,
        courseId: course._id,
        batchId: batch._id,
        source: ENROLLMENT_SOURCE.MANUAL,
        notes: 'Seed enrollment',
      },
      admin._id
    )
    console.log('Enrolled student@codecrafters.dev')
  } else {
    console.log('Student already enrolled')
  }

  console.log('Enrollment seed complete. Code:', batch.enrollmentCode)
  process.exit(0)
}

seedEnrollment().catch((err) => {
  console.error(err)
  process.exit(1)
})
