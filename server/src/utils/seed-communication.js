require('dotenv').config()
const connectDB = require('../config/db')
const User = require('../models/User')
const Course = require('../models/Course')
require('../models/Module')
require('../models/Week')
require('../models/Topic')
require('../models/Lesson')
const { NotificationTemplate } = require('../models/Notification')
const { ROLES } = require('../constants')
const {
  TICKET_CATEGORIES,
  TICKET_PRIORITY,
  CRM_STAGES,
  SURVEY_TYPES,
  SURVEY_QUESTION_TYPES,
  JOB_TYPES,
  COMM_NOTIFY,
  FREELANCE_PLATFORMS,
} = require('../constants/communication')
const messagingService = require('../services/messaging.service')
const forumService = require('../services/forum.service')
const helpdeskService = require('../services/helpdesk.service')
const crmService = require('../services/crm.service')
const surveyService = require('../services/survey.service')
const careerService = require('../services/career.service')
const { Conversation, JobPosting, Survey, Ticket, CrmLead } = require('../models/Communication')
const Discussion = require('../models/Discussion')

async function upsertTemplates() {
  const templates = [
    { key: COMM_NOTIFY.NEW_MESSAGE, subject: 'New message', body: '{{body}}' },
    { key: COMM_NOTIFY.FORUM_REPLY, subject: 'Forum activity', body: '{{body}}' },
    { key: COMM_NOTIFY.TICKET_UPDATE, subject: 'Ticket update', body: '{{body}}' },
    { key: COMM_NOTIFY.JOB_POSTED, subject: 'New job', body: '{{body}}' },
    { key: COMM_NOTIFY.SURVEY_PUBLISHED, subject: 'Survey published', body: '{{body}}' },
    { key: COMM_NOTIFY.CAREER_EVENT, subject: 'Career event', body: '{{body}}' },
    { key: COMM_NOTIFY.ALUMNI_MEETUP, subject: 'Alumni meetup', body: '{{body}}' },
  ]
  for (const t of templates) {
    await NotificationTemplate.findOneAndUpdate(
      { key: t.key },
      { ...t, channel: 'in_app', active: true, variables: ['body'] },
      { upsert: true }
    )
  }
  console.log('Notification templates ready')
}

async function seedCommunication() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const teacher = await User.findOne({ role: ROLES.TEACHER })
  const student = await User.findOne({ role: ROLES.STUDENT })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  if (!admin || !student) throw new Error('Run seed (+ seed:courses) first')

  await upsertTemplates()

  if (teacher) {
    const existing = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [student._id, teacher._id], $size: 2 },
    })
    if (!existing) {
      const conv = await messagingService.getOrCreateDirect(student._id, teacher._id, ROLES.STUDENT)
      await messagingService.sendMessage(conv._id, student._id, {
        body: 'Hi! I have a question about this week’s module.',
      })
      await messagingService.sendMessage(conv._id, teacher._id, {
        body: 'Happy to help — drop your question here 👍',
      })
      console.log('Seeded direct conversation')
    } else {
      console.log('Conversation exists')
    }
  }

  if (course) {
    const threadExists = await Discussion.findOne({
      course: course._id,
      title: 'How do I deploy the MERN stack project?',
      parent: null,
      deletedAt: null,
    })
    if (!threadExists) {
      const created = await forumService.createThread(
        {
          course: course._id,
          title: 'How do I deploy the MERN stack project?',
          body: 'Looking for a simple checklist for Render / Railway deployment.',
          mentions: teacher ? [teacher._id] : [],
        },
        student._id
      )
      if (teacher) {
        await forumService.reply(
          created.thread._id,
          { body: 'Start with env vars, then build the client, and reverse-proxy the API.' },
          teacher._id
        )
      }
      console.log('Seeded forum thread')
    } else {
      console.log('Forum thread exists')
    }
  }

  const ticketExists = await Ticket.findOne({ subject: 'Cannot access coding lab — seed' })
  if (!ticketExists) {
    await helpdeskService.createTicket(
      {
        category: TICKET_CATEGORIES.TECHNICAL,
        subject: 'Cannot access coding lab — seed',
        description: 'Sandbox preview stays blank after save.',
        priority: TICKET_PRIORITY.HIGH,
        courseId: course?._id,
      },
      student._id
    )
    console.log('Seeded helpdesk ticket')
  }

  const leadExists = await CrmLead.findOne({ email: 'lead.demo@example.com' })
  if (!leadExists) {
    const lead = await crmService.createLead(
      {
        fullName: 'Demo Lead',
        email: 'lead.demo@example.com',
        phone: '+92-300-0000000',
        source: 'website',
        stage: CRM_STAGES.INQUIRY,
        interestedCourse: course?._id,
        notes: 'Interested in evening batch',
        parentContact: {
          name: 'Parent Demo',
          phone: '+92-300-1111111',
          relation: 'parent',
        },
      },
      admin._id
    )
    await crmService.addFollowUp(lead._id, { note: 'Called — scheduling demo class' }, admin._id)
    console.log('Seeded CRM lead')
  }

  let survey = await Survey.findOne({ title: 'Course feedback — Full Stack (seed)' })
  if (!survey) {
    survey = await surveyService.createSurvey(
      {
        title: 'Course feedback — Full Stack (seed)',
        type: SURVEY_TYPES.COURSE,
        description: 'Quick satisfaction check',
        course: course?._id,
        questions: [
          {
            key: 'overall',
            prompt: 'Overall rating',
            type: SURVEY_QUESTION_TYPES.RATING,
            required: true,
          },
          {
            key: 'recommend',
            prompt: 'Would you recommend this course?',
            type: SURVEY_QUESTION_TYPES.YES_NO,
            required: true,
          },
          {
            key: 'pace',
            prompt: 'Pace of the course',
            type: SURVEY_QUESTION_TYPES.MULTIPLE_CHOICE,
            options: ['Too slow', 'Just right', 'Too fast'],
            required: false,
          },
          {
            key: 'comments',
            prompt: 'Anything else?',
            type: SURVEY_QUESTION_TYPES.TEXT,
            required: false,
          },
        ],
      },
      admin._id
    )
    await surveyService.publishSurvey(survey._id)
    console.log('Seeded + published survey')
  }

  await careerService.updateCareer(student._id, {
    headline: 'Aspiring Full-Stack Developer',
    summary: 'Building production MERN skills at CodeCrafters.',
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
    education: [{ school: 'CodeCrafters', degree: 'Full Stack Bootcamp', year: '2026' }],
    socialLinks: { github: 'https://github.com/demo', linkedin: '' },
    freelanceHub: {
      platforms: [{ platform: FREELANCE_PLATFORMS.UPWORK, profileCompletion: 40 }],
      proposalPracticeCount: 2,
      interviewPrepDone: false,
      portfolioReady: false,
      clientCommExercises: 1,
    },
    submitForReview: true,
  })
  console.log('Seeded student career profile')

  const jobExists = await JobPosting.findOne({ title: 'Junior MERN Developer — seed' })
  if (!jobExists) {
    await careerService.createJob(
      {
        title: 'Junior MERN Developer — seed',
        company: 'CodeCrafters Partners',
        type: JOB_TYPES.FULL_TIME,
        location: 'Remote',
        skillsRequired: ['React', 'Node.js', 'MongoDB'],
        experience: '0-1 years',
        salaryPlaceholder: 'PKR — competitive',
        description: 'Entry role for bootcamp graduates.',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applyLink: '',
        status: 'published',
      },
      admin._id
    )
    console.log('Seeded job posting')
  }

  await careerService.upsertAlumni(student._id, {
    graduationYear: '2025',
    course: course?._id,
    currentRole: 'Junior Developer',
    company: 'Demo Soft',
    successStory: 'Landed first freelance gig within 3 months.',
    openToMentorship: true,
    visible: true,
  })
  console.log('Seeded alumni profile')

  console.log('Communication hub seed complete')
  process.exit(0)
}

seedCommunication().catch((err) => {
  console.error(err)
  process.exit(1)
})
