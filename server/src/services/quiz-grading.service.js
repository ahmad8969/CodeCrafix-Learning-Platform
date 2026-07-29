const { evaluateQuestion } = require('./practice-evaluation.service')
const { QUIZ_QUESTION_TYPES } = require('../constants/quiz')

function normalize(text = '') {
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ')
}

function gradeMcqLike(snapshot, answer, { negativeMarking, negativeMarkValue, partialMarks }) {
  const correct = new Set((snapshot.correctOptionIds || []).map(String))
  const selected = [...new Set((answer.selectedOptionIds || []).map(String))]
  const maxMarks = snapshot.marks || 1

  if (!selected.length || answer.skipped) {
    return { isCorrect: false, marksAwarded: 0, skipped: true, feedback: 'Skipped' }
  }

  const allCorrect =
    selected.length === correct.size && selected.every((id) => correct.has(id))
  if (allCorrect) {
    return { isCorrect: true, marksAwarded: maxMarks, feedback: 'Correct' }
  }

  if (partialMarks && (snapshot.allowMultipleAnswers || snapshot.type === QUIZ_QUESTION_TYPES.MULTIPLE_SELECT)) {
    const hits = selected.filter((id) => correct.has(id)).length
    const wrong = selected.filter((id) => !correct.has(id)).length
    if (hits > 0 && wrong === 0) {
      const awarded = Math.round((hits / Math.max(correct.size, 1)) * maxMarks * 100) / 100
      return { isCorrect: false, marksAwarded: awarded, feedback: 'Partially correct' }
    }
  }

  if (negativeMarking) {
    return {
      isCorrect: false,
      marksAwarded: -Math.abs(negativeMarkValue || 0),
      feedback: 'Incorrect (negative marking)',
    }
  }

  return { isCorrect: false, marksAwarded: 0, feedback: 'Incorrect' }
}

function gradeFillBlank(snapshot, answer, { negativeMarking, negativeMarkValue }) {
  const maxMarks = snapshot.marks || 1
  if (!answer.textAnswer || answer.skipped) {
    return { isCorrect: false, marksAwarded: 0, skipped: true, feedback: 'Skipped' }
  }
  const accepted = (snapshot.acceptedAnswers || []).map(normalize)
  const given = normalize(answer.textAnswer)
  if (accepted.includes(given)) {
    return { isCorrect: true, marksAwarded: maxMarks, feedback: 'Correct' }
  }
  if (negativeMarking) {
    return {
      isCorrect: false,
      marksAwarded: -Math.abs(negativeMarkValue || 0),
      feedback: 'Incorrect (negative marking)',
    }
  }
  return { isCorrect: false, marksAwarded: 0, feedback: 'Incorrect' }
}

async function gradeCoding(snapshot, answer) {
  const maxMarks = snapshot.marks || 1
  if (answer.skipped || (!(answer.codeSnapshot || []).length && !answer.stdout)) {
    return { isCorrect: false, marksAwarded: 0, skipped: true, feedback: 'Skipped' }
  }
  const result = evaluateQuestion(
    {
      type: 'coding',
      testCases: snapshot.testCases || [],
      expectedOutput: snapshot.expectedOutput || '',
    },
    {
      files: answer.codeSnapshot || [],
      stdout: answer.stdout || '',
    },
    { mode: 'submit' }
  )
  const ratio = (result.score || 0) / 100
  const awarded = Math.round(ratio * maxMarks * 100) / 100
  return {
    isCorrect: result.status === 'passed',
    marksAwarded: awarded,
    feedback: result.feedback || '',
    score: result.score,
  }
}

async function gradeAnswer(snapshot, answer, quizConfig) {
  const type = snapshot.type
  if (
    type === QUIZ_QUESTION_TYPES.MCQ ||
    type === QUIZ_QUESTION_TYPES.TRUE_FALSE ||
    type === QUIZ_QUESTION_TYPES.MULTIPLE_SELECT
  ) {
    return gradeMcqLike(snapshot, answer || {}, quizConfig)
  }
  if (type === QUIZ_QUESTION_TYPES.FILL_BLANK) {
    return gradeFillBlank(snapshot, answer || {}, quizConfig)
  }
  if (type === QUIZ_QUESTION_TYPES.CODING) {
    return gradeCoding(snapshot, answer || {})
  }
  return {
    isCorrect: false,
    marksAwarded: 0,
    feedback: `Type "${type}" is architecture-ready — manual review may be required.`,
    needsReview: true,
  }
}

async function gradeAttempt(attempt, quiz) {
  const config = {
    negativeMarking: Boolean(quiz.negativeMarking),
    negativeMarkValue: quiz.negativeMarkValue || 0,
    partialMarks: quiz.partialMarks !== false,
  }

  const answerMap = Object.fromEntries((attempt.answers || []).map((a) => [a.questionKey, a]))
  const gradedAnswers = []
  let marks = 0
  let maxMarks = 0
  let correctCount = 0
  let incorrectCount = 0
  let skippedCount = 0
  const byTopic = {}
  const byDifficulty = {}

  for (const q of attempt.questions || []) {
    maxMarks += q.marks || 1
    const raw = answerMap[q.questionKey] || { questionKey: q.questionKey, skipped: true }
    const graded = await gradeAnswer(q, raw, config)
    const marksAwarded = Math.max(
      config.negativeMarking ? graded.marksAwarded : Math.max(0, graded.marksAwarded),
      config.negativeMarking ? graded.marksAwarded : 0
    )
    // clamp negative floor at -maxMarks for question
    const awarded = Math.max(-(q.marks || 1), marksAwarded)
    marks += awarded

    if (graded.skipped) skippedCount += 1
    else if (graded.isCorrect) correctCount += 1
    else incorrectCount += 1

    const topic = q.category || 'General'
    const diff = q.difficulty || 'easy'
    byTopic[topic] = byTopic[topic] || { correct: 0, total: 0 }
    byTopic[topic].total += 1
    if (graded.isCorrect) byTopic[topic].correct += 1
    byDifficulty[diff] = byDifficulty[diff] || { correct: 0, total: 0 }
    byDifficulty[diff].total += 1
    if (graded.isCorrect) byDifficulty[diff].correct += 1

    gradedAnswers.push({
      questionKey: q.questionKey,
      practiceQuestion: q.practiceQuestion,
      type: q.type,
      selectedOptionIds: raw.selectedOptionIds || [],
      textAnswer: raw.textAnswer || '',
      codeSnapshot: raw.codeSnapshot || [],
      stdout: raw.stdout || '',
      bookmarked: Boolean(raw.bookmarked),
      skipped: Boolean(graded.skipped || raw.skipped),
      reviewedLater: Boolean(raw.reviewedLater),
      isCorrect: Boolean(graded.isCorrect),
      marksAwarded: awarded,
      maxMarks: q.marks || 1,
      feedback: graded.feedback || '',
    })
  }

  marks = Math.max(0, Math.round(marks * 100) / 100)
  const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0
  const passed = percentage >= (quiz.passingPercentage || 60)

  const suggestedTopics = Object.entries(byTopic)
    .filter(([, v]) => v.total > 0 && v.correct / v.total < 0.6)
    .map(([k]) => k)

  return {
    answers: gradedAnswers,
    marks,
    maxMarks,
    percentage,
    passed,
    analysis: {
      correctCount,
      incorrectCount,
      skippedCount,
      byTopic,
      byDifficulty,
      suggestedTopics,
      recommendedLessons: suggestedTopics.map((t) => ({
        title: `Revise: ${t}`,
        reason: 'Weak performance in this category',
      })),
      recommendedPractice: suggestedTopics.map((t) => ({
        title: `Practice more ${t} questions`,
        category: t,
      })),
    },
  }
}

module.exports = {
  gradeAttempt,
  gradeAnswer,
  gradeMcqLike,
  gradeFillBlank,
}
