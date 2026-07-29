require('dotenv').config()
const connectDB = require('../config/db')
const Course = require('../models/Course')
const Topic = require('../models/Topic')
const User = require('../models/User')
const PracticeQuestion = require('../models/PracticeQuestion')
const Quiz = require('../models/Quiz')
const { ROLES } = require('../constants')
const { QUIZ_STATUS } = require('../constants/quiz')

async function upsertQuestion(payload) {
  const existing = await PracticeQuestion.findOne({ slug: payload.slug })
  if (existing) {
    Object.assign(existing, payload)
    existing.deletedAt = null
    await existing.save()
    console.log('Updated question:', payload.slug)
    return existing
  }
  const created = await PracticeQuestion.create(payload)
  console.log('Created question:', payload.slug)
  return created
}

async function seedQuiz() {
  await connectDB()
  const admin = await User.findOne({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
  const course = await Course.findOne({ slug: 'full-stack-web-bootcamp', deletedAt: null })
  const topic = await Topic.findOne({ slug: 'semantic-html' })
  if (!admin || !course) throw new Error('Run seed + seed:courses (+ seed:practice) first')

  const tf = await upsertQuestion({
    title: 'HTML is a programming language',
    slug: 'html-is-programming-language-tf',
    type: 'true_false',
    difficulty: 'easy',
    status: 'published',
    category: 'HTML Basics',
    tags: ['html', 'basics'],
    course: course._id,
    topic: topic?._id || null,
    module: topic?.module || null,
    week: topic?.week || null,
    description: 'Decide whether the statement is true or false.',
    options: [
      { id: 'true', label: 'True', isCorrect: false },
      { id: 'false', label: 'False', isCorrect: true },
    ],
    typePayload: { correct: false },
    explanation: 'HTML is a markup language, not a programming language.',
    xpReward: 30,
    displayOrder: 10,
    createdBy: admin._id,
    updatedBy: admin._id,
  })

  const fill = await upsertQuestion({
    title: 'Primary landmark element name',
    slug: 'primary-landmark-fill-blank',
    type: 'fill_blank',
    difficulty: 'easy',
    status: 'published',
    category: 'HTML Basics',
    tags: ['html', 'a11y'],
    course: course._id,
    topic: topic?._id || null,
    module: topic?.module || null,
    week: topic?.week || null,
    description: 'Name the HTML element used as the primary content landmark (without angle brackets).',
    typePayload: { acceptedAnswers: ['main', 'Main', 'MAIN'] },
    expectedOutput: 'main',
    explanation: 'The <main> element is the primary landmark.',
    xpReward: 35,
    displayOrder: 11,
    createdBy: admin._id,
    updatedBy: admin._id,
  })

  const mcq = await PracticeQuestion.findOne({ slug: 'which-tag-is-landmark' })
  const coding = await PracticeQuestion.findOne({ slug: 'semantic-card-challenge' })
  if (!mcq || !coding) {
    throw new Error('Run npm run seed:practice first (need MCQ + coding questions)')
  }

  const items = [
    { practiceQuestion: mcq._id, marks: 1, displayOrder: 0 },
    { practiceQuestion: tf._id, marks: 1, displayOrder: 1 },
    { practiceQuestion: fill._id, marks: 2, displayOrder: 2 },
    { practiceQuestion: coding._id, marks: 5, displayOrder: 3 },
  ]

  const quizPayload = {
    title: 'HTML Fundamentals Assessment',
    slug: 'html-fundamentals-assessment',
    description: 'Mixed quiz covering MCQ, true/false, fill-in-the-blank, and a short coding challenge.',
    instructions:
      'You have 20 minutes. Pause is disabled. Submit before the timer ends or the quiz auto-submits.',
    course: course._id,
    topic: topic?._id || null,
    module: topic?.module || null,
    week: topic?.week || null,
    category: 'HTML Basics',
    status: QUIZ_STATUS.PUBLISHED,
    passingPercentage: 60,
    timeLimitMinutes: 20,
    maxAttempts: 3,
    shuffleQuestions: false,
    shuffleAnswers: true,
    showResultImmediately: true,
    showCorrectAnswers: true,
    negativeMarking: false,
    partialMarks: true,
    enableReview: true,
    lockAfterSubmission: true,
    pauseDisabled: true,
    resumeSupport: true,
    items,
    poolRules: [],
    publishAt: new Date(),
    startAt: new Date(Date.now() - 60 * 60 * 1000),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    xpReward: 100,
    unlockNextTopicOnPass: false,
    createdBy: admin._id,
    updatedBy: admin._id,
    deletedAt: null,
  }

  quizPayload.totalMarks = items.reduce((s, i) => s + i.marks, 0)
  quizPayload.totalQuestions = items.length

  const existing = await Quiz.findOne({ slug: quizPayload.slug, course: course._id })
  if (existing) {
    Object.assign(existing, quizPayload)
    await existing.save()
    console.log('Updated quiz:', quizPayload.slug)
  } else {
    await Quiz.create(quizPayload)
    console.log('Created quiz:', quizPayload.slug)
  }

  console.log('Quiz seed complete')
  process.exit(0)
}

seedQuiz().catch((err) => {
  console.error(err)
  process.exit(1)
})
