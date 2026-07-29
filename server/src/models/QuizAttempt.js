const mongoose = require('mongoose')
const { QUIZ_ATTEMPT_STATUS } = require('../constants/quiz')

const answerSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    practiceQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeQuestion', default: null },
    type: { type: String, required: true },
    selectedOptionIds: [{ type: String }],
    textAnswer: { type: String, default: '' },
    codeSnapshot: [
      {
        path: String,
        language: String,
        content: String,
        entry: Boolean,
      },
    ],
    stdout: { type: String, default: '' },
    bookmarked: { type: Boolean, default: false },
    skipped: { type: Boolean, default: false },
    reviewedLater: { type: Boolean, default: false },
    isCorrect: { type: Boolean, default: null },
    marksAwarded: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
  },
  { _id: false }
)

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionKey: { type: String, required: true },
    practiceQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'PracticeQuestion', default: null },
    type: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    difficulty: { type: String, default: 'easy' },
    category: { type: String, default: '' },
    tags: [{ type: String }],
    marks: { type: Number, default: 1 },
    options: [{ id: String, label: String }],
    /** Correct answers stored server-side only on attempt for grading */
    correctOptionIds: { type: [String], select: false, default: [] },
    acceptedAnswers: { type: [String], select: false, default: [] },
    allowMultipleAnswers: { type: Boolean, default: false },
    starterFiles: { type: mongoose.Schema.Types.Mixed, default: [] },
    testCases: { type: mongoose.Schema.Types.Mixed, default: [] },
    expectedOutput: { type: String, default: '' },
    typePayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
)

const analysisSchema = new mongoose.Schema(
  {
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    byTopic: { type: mongoose.Schema.Types.Mixed, default: {} },
    byDifficulty: { type: mongoose.Schema.Types.Mixed, default: {} },
    suggestedTopics: [{ type: String }],
    recommendedLessons: [{ type: mongoose.Schema.Types.Mixed }],
    recommendedPractice: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { _id: false }
)

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    attemptNumber: { type: Number, default: 1, min: 1 },
    status: {
      type: String,
      enum: Object.values(QUIZ_ATTEMPT_STATUS),
      default: QUIZ_ATTEMPT_STATUS.IN_PROGRESS,
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    timeTakenSeconds: { type: Number, default: 0 },
    questions: [questionSnapshotSchema],
    answers: [answerSchema],
    marks: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    xpAwarded: { type: Number, default: 0 },
    badgesEarned: [{ type: String }],
    analysis: { type: analysisSchema, default: () => ({}) },
    clientFingerprint: { type: String, default: '' },
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
)

quizAttemptSchema.index({ student: 1, quiz: 1, attemptNumber: 1 }, { unique: true })
quizAttemptSchema.index({ quiz: 1, status: 1, percentage: -1 })

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema)
