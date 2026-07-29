require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Topic = require('../models/Topic')
const User = require('../models/User')
const PracticeQuestion = require('../models/PracticeQuestion')
const QuestionCategory = require('../models/QuestionCategory')
const { ROLES } = require('../constants')
const { cloneTemplateFiles } = require('../config/languages/templates')

async function seedPractice() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  const topic = await Topic.findOne({ slug: 'semantic-html', deletedAt: null })
  if (!admin || !course || !topic) {
    throw new Error('Run seed, seed:courses, and seed:curriculum first')
  }

  await QuestionCategory.findOneAndUpdate(
    { slug: 'html-basics' },
    { name: 'HTML Basics', slug: 'html-basics', description: 'Semantic HTML & structure', color: '#14b8a6' },
    { upsert: true }
  )
  await QuestionCategory.findOneAndUpdate(
    { slug: 'javascript' },
    { name: 'JavaScript', slug: 'javascript', description: 'JS fundamentals', color: '#f59e0b' },
    { upsert: true }
  )

  const starter = cloneTemplateFiles('html_css_js')

  const coding = {
    title: 'Semantic Card Challenge',
    slug: 'semantic-card-challenge',
    type: 'coding',
    difficulty: 'easy',
    status: 'published',
    category: 'HTML Basics',
    tags: ['html', 'css', 'semantics'],
    languageIds: ['html', 'css', 'javascript'],
    primaryLanguageId: 'html',
    executionEngine: 'browser',
    course: course._id,
    topic: topic._id,
    module: topic.module,
    week: topic.week,
    description: `## Challenge

Build a semantic card with a heading and a button.

### Requirements

1. Use a \`<main>\` landmark
2. Include an \`<h1>\` with text **Hello Practice**
3. Clicking the button should log \`practice-ready\` to the console

Run public tests, then Submit for hidden checks.`,
    starterFiles: starter,
    expectedOutput: 'practice-ready',
    constraints: 'Use semantic HTML. Do not use inline event handlers.',
    testCases: [
      {
        id: 'public-main',
        label: 'Has main landmark',
        visibility: 'public',
        assertion: 'file_contains',
        targetPath: 'index.html',
        pattern: '<main',
        weight: 1,
      },
      {
        id: 'public-h1',
        label: 'Has Hello Practice heading',
        visibility: 'public',
        assertion: 'file_contains',
        targetPath: 'index.html',
        pattern: 'Hello Practice',
        weight: 1,
      },
      {
        id: 'hidden-log',
        label: 'Logs practice-ready',
        visibility: 'hidden',
        assertion: 'stdout',
        expectedOutput: 'practice-ready',
        weight: 2,
      },
    ],
    hints: [
      { order: 1, text: 'Wrap content in <main class="app">…</main>', xpPenalty: 5 },
      { order: 2, text: 'Change the h1 text to Hello Practice', xpPenalty: 5 },
      { order: 3, text: 'In script.js log "practice-ready" on load or click', xpPenalty: 10 },
    ],
    explanation: 'Semantic landmarks and console output are verified separately.',
    xpReward: 80,
    displayOrder: 0,
    maxAttempts: 0,
    revealSolution: false,
    createdBy: admin._id,
    updatedBy: admin._id,
  }

  const mcq = {
    title: 'Which tag is a landmark?',
    slug: 'which-tag-is-landmark',
    type: 'multiple_choice',
    difficulty: 'easy',
    status: 'published',
    category: 'HTML Basics',
    tags: ['html', 'a11y'],
    course: course._id,
    topic: topic._id,
    module: topic.module,
    week: topic.week,
    description: 'Select the element that creates a primary landmark region for page content.',
    options: [
      { id: 'a', label: '<div>', isCorrect: false },
      { id: 'b', label: '<span>', isCorrect: false },
      { id: 'c', label: '<main>', isCorrect: true },
      { id: 'd', label: '<b>', isCorrect: false },
    ],
    allowMultipleAnswers: false,
    hints: [{ order: 1, text: 'Landmarks include main, nav, header, footer', xpPenalty: 5 }],
    explanation: '<main> represents the dominant content of the document.',
    xpReward: 40,
    displayOrder: 1,
    createdBy: admin._id,
    updatedBy: admin._id,
  }

  for (const q of [coding, mcq]) {
    const existing = await PracticeQuestion.findOne({ slug: q.slug })
    if (existing) {
      Object.assign(existing, q)
      existing.deletedAt = null
      await existing.save()
      console.log('Updated question:', q.slug)
    } else {
      await PracticeQuestion.create(q)
      console.log('Created question:', q.slug)
    }
  }

  console.log('Practice seed complete')
  process.exit(0)
}

seedPractice().catch((err) => {
  console.error(err)
  process.exit(1)
})
