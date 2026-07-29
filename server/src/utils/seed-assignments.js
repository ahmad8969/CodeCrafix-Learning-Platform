require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Topic = require('../models/Topic')
const User = require('../models/User')
const Assignment = require('../models/Assignment')
const { ROLES } = require('../constants')
const { DEFAULT_RUBRIC } = require('../constants/assignment')
const { cloneTemplateFiles } = require('../config/languages/templates')

async function seedAssignments() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  const topic = await Topic.findOne({ slug: 'semantic-html' })
  if (!admin || !course) throw new Error('Run seed + seed:courses first')

  const due = new Date()
  due.setDate(due.getDate() + 14)

  const coding = {
    title: 'Build a Semantic Landing Section',
    slug: 'build-semantic-landing-section',
    type: 'coding',
    difficulty: 'medium',
    status: 'published',
    course: course._id,
    topic: topic?._id || null,
    module: topic?.module || null,
    week: topic?.week || null,
    description: 'Create a semantic landing hero with accessible structure.',
    instructions: `## Requirements

1. Use \`header\`, \`main\`, and \`footer\`
2. Include a primary CTA button
3. Style with CSS for a polished card look

Submit from the coding workspace when ready.`,
    objectives: ['Semantic HTML', 'Basic CSS', 'Accessibility landmarks'],
    estimatedMinutes: 120,
    maxMarks: 100,
    passingMarks: 60,
    maxAttempts: 3,
    allowResubmission: true,
    lateSubmissionAllowed: true,
    latePenaltyPercent: 10,
    publishAt: new Date(),
    startAt: new Date(),
    dueAt: due,
    starterFiles: cloneTemplateFiles('html_css_js'),
    languageIds: ['html', 'css', 'javascript'],
    executionEngine: 'browser',
    rubrics: [...DEFAULT_RUBRIC],
    xpReward: 120,
    createdBy: admin._id,
    updatedBy: admin._id,
  }

  const fileUpload = {
    title: 'Design Brief PDF Upload',
    slug: 'design-brief-pdf-upload',
    type: 'pdf_submission',
    difficulty: 'easy',
    status: 'published',
    course: course._id,
    topic: topic?._id || null,
    description: 'Upload a one-page PDF design brief for a marketing landing page.',
    instructions: 'Export your brief as PDF (max 10MB) and submit before the deadline.',
    objectives: ['Communication', 'Documentation'],
    estimatedMinutes: 45,
    maxMarks: 50,
    passingMarks: 30,
    maxAttempts: 2,
    allowResubmission: true,
    lateSubmissionAllowed: true,
    latePenaltyPercent: 15,
    publishAt: new Date(),
    dueAt: due,
    rubrics: [
      { key: 'clarity', label: 'Clarity', maxMarks: 20 },
      { key: 'structure', label: 'Structure', maxMarks: 15 },
      { key: 'creativity', label: 'Creativity', maxMarks: 15 },
    ],
    xpReward: 60,
    createdBy: admin._id,
    updatedBy: admin._id,
  }

  for (const a of [coding, fileUpload]) {
    const existing = await Assignment.findOne({ slug: a.slug, course: course._id })
    if (existing) {
      Object.assign(existing, a)
      existing.deletedAt = null
      await existing.save()
      console.log('Updated assignment:', a.slug)
    } else {
      await Assignment.create(a)
      console.log('Created assignment:', a.slug)
    }
  }

  console.log('Assignment seed complete')
  process.exit(0)
}

seedAssignments().catch((e) => {
  console.error(e)
  process.exit(1)
})
