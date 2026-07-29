const crypto = require('crypto')
const PracticeQuestion = require('../models/PracticeQuestion')
const { QUESTION_STATUS } = require('../constants/practice')

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function toSnapshot(question, marks = 1, { shuffleAnswers = false } = {}) {
  const q = typeof question.toObject === 'function' ? question.toObject({ getters: true }) : { ...question }
  let options = (q.options || []).map((o) => ({ id: o.id, label: o.label, isCorrect: Boolean(o.isCorrect) }))
  const correctOptionIds = options.filter((o) => o.isCorrect).map((o) => o.id)

  if (shuffleAnswers) options = shuffle(options)

  let acceptedAnswers = []
  if (q.type === 'fill_blank') {
    acceptedAnswers = q.typePayload?.acceptedAnswers || q.typePayload?.answers || []
    if (!acceptedAnswers.length && q.expectedOutput) acceptedAnswers = [q.expectedOutput]
  }
  if (q.type === 'true_false' && correctOptionIds.length === 0) {
    // ensure true/false options
    if (!options.length) {
      options = [
        { id: 'true', label: 'True', isCorrect: q.typePayload?.correct === true },
        { id: 'false', label: 'False', isCorrect: q.typePayload?.correct === false },
      ]
      if (!options.some((o) => o.isCorrect)) options[0].isCorrect = true
    }
  }

  return {
    questionKey: crypto.randomBytes(6).toString('hex'),
    practiceQuestion: q._id || null,
    type: q.type,
    title: q.title || '',
    description: q.description || '',
    difficulty: q.difficulty || 'easy',
    category: q.category || '',
    tags: q.tags || [],
    marks,
    options: options.map(({ id, label }) => ({ id, label })),
    correctOptionIds: options.filter((o) => o.isCorrect).map((o) => o.id),
    acceptedAnswers: acceptedAnswers.map((a) => String(a).trim().toLowerCase()),
    allowMultipleAnswers: Boolean(q.allowMultipleAnswers) || q.type === 'multiple_select',
    starterFiles: q.starterFiles || [],
    testCases: q.testCases || [],
    expectedOutput: q.expectedOutput || '',
    typePayload: q.typePayload || {},
  }
}

function publicQuestion(snapshot) {
  const {
    correctOptionIds,
    acceptedAnswers,
    testCases,
    ...rest
  } = snapshot
  return {
    ...rest,
    testCases: (testCases || []).filter((t) => t.visibility !== 'hidden'),
    hiddenTestCount: (testCases || []).filter((t) => t.visibility === 'hidden').length,
  }
}

/**
 * Build the question set for a quiz attempt from fixed items + pool rules.
 */
async function selectQuestionsForQuiz(quiz) {
  const selected = []

  for (const item of quiz.items || []) {
    if (item.snapshot) {
      selected.push(
        toSnapshot(
          { ...item.snapshot, _id: item.practiceQuestion },
          item.marks || 1,
          { shuffleAnswers: quiz.shuffleAnswers || quiz.randomOptions }
        )
      )
      continue
    }
    if (item.practiceQuestion) {
      const pq = await PracticeQuestion.findById(item.practiceQuestion).select('+options.isCorrect')
      if (!pq || pq.deletedAt) continue
      selected.push(
        toSnapshot(pq, item.marks || 1, {
          shuffleAnswers: quiz.shuffleAnswers || quiz.randomOptions,
        })
      )
    }
  }

  for (const rule of quiz.poolRules || []) {
    if (!rule.count) continue
    const filter = { deletedAt: null, status: QUESTION_STATUS.PUBLISHED }
    if (rule.categories?.length) filter.category = { $in: rule.categories }
    if (rule.difficulties?.length) filter.difficulty = { $in: rule.difficulties }
    if (rule.types?.length) filter.type = { $in: rule.types }
    if (rule.languageIds?.length) filter.languageIds = { $in: rule.languageIds }

    const pool = await PracticeQuestion.find(filter).select('+options.isCorrect').lean()
    const picked = shuffle(pool).slice(0, rule.count)
    for (const pq of picked) {
      selected.push(
        toSnapshot(pq, rule.marksEach || 1, {
          shuffleAnswers: quiz.shuffleAnswers || quiz.randomOptions,
        })
      )
    }
  }

  let questions = selected
  if (quiz.shuffleQuestions || quiz.randomQuestions) {
    questions = shuffle(questions)
  }

  return questions
}

module.exports = {
  selectQuestionsForQuiz,
  toSnapshot,
  publicQuestion,
  shuffle,
}
