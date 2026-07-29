require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Batch = require('../models/Batch')
const User = require('../models/User')
const LiveClass = require('../models/LiveClass')
const Announcement = require('../models/Announcement')
const CalendarEvent = require('../models/CalendarEvent')
const { AttendanceRule } = require('../models/Attendance')
const { ROLES } = require('../constants')
const liveClassService = require('../services/live-class.service')
const announcementService = require('../services/announcement.service')

async function seedLiveClasses() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const teacher = await User.findOne({ role: ROLES.TEACHER })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  const batch = await Batch.findOne({ batchCode: 'FSW-A1', deletedAt: null })
  if (!admin || !course) throw new Error('Run seed + seed:courses (+ seed:enrollment) first')

  const teacherId = teacher?._id || admin._id
  const start = new Date()
  start.setDate(start.getDate() + ((5 - start.getDay() + 7) % 7 || 7)) // next friday-ish
  start.setHours(10, 0, 0, 0)
  const end = new Date(start)
  end.setHours(12, 0, 0, 0)

  const existing = await LiveClass.findOne({ title: 'HTML Weekend Live Lab', deletedAt: null })
  let liveClass
  if (existing) {
    liveClass = existing
    console.log('Live class exists')
  } else {
    liveClass = await liveClassService.createLiveClass(
      {
        title: 'HTML Weekend Live Lab',
        description: 'Live walkthrough of semantic HTML and accessibility landmarks.',
        course: course._id,
        batch: batch?._id || null,
        teacher: teacherId,
        scheduledDate: start,
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        timezone: 'Asia/Karachi',
        meetingProvider: 'external_link',
        meetingLink: 'https://meet.example.com/html-lab',
        meetingPassword: 'codecraft',
        isRecurring: true,
        recurrenceRule: {
          frequency: 'weekly',
          daysOfWeek: ['friday', 'saturday', 'sunday'],
          until: new Date(Date.now() + 21 * 86400000),
        },
      },
      admin._id
    )
    console.log('Created live class + recurring')
  }

  await AttendanceRule.findOneAndUpdate(
    { course: course._id, batch: batch?._id || null },
    {
      course: course._id,
      batch: batch?._id || null,
      minimumAttendancePercent: 75,
      lateAfterMinutes: 10,
      autoMarkAbsent: true,
      allowManualOverride: true,
      allowExcusedAbsence: true,
      updatedBy: admin._id,
      $setOnInsert: { createdBy: admin._id },
    },
    { upsert: true }
  )

  const ann = await Announcement.findOne({ title: 'Welcome to weekend live labs' })
  if (!ann) {
    const created = await announcementService.createAnnouncement(
      {
        title: 'Welcome to weekend live labs',
        body: 'Join Friday–Sunday sessions at 10:00 AM. Bring questions from practice problems.',
        audience: batch ? 'batch' : 'course',
        course: course._id,
        batch: batch?._id || null,
        priority: 'high',
      },
      admin._id
    )
    await announcementService.publishAnnouncement(created._id, admin._id)
    console.log('Published announcement')
  }

  await CalendarEvent.findOneAndUpdate(
    { title: 'Spring Coding Workshop', type: 'workshop', deletedAt: null },
    {
      title: 'Spring Coding Workshop',
      description: 'Institute-wide workshop (seed)',
      type: 'workshop',
      course: course._id,
      startAt: new Date(Date.now() + 10 * 86400000),
      endAt: new Date(Date.now() + 10 * 86400000 + 3 * 3600000),
      allDay: false,
      color: '#8b5cf6',
      createdBy: admin._id,
      updatedBy: admin._id,
    },
    { upsert: true }
  )

  await liveClassService.addRecording(
    {
      liveClass: liveClass._id,
      title: 'HTML Weekend Lab — Recording',
      url: 'https://example.com/recordings/html-lab',
      storageType: 'external_link',
      course: course._id,
    },
    admin._id
  ).catch(() => {})

  console.log('Live classes seed complete')
  process.exit(0)
}

seedLiveClasses().catch((err) => {
  console.error(err)
  process.exit(1)
})
