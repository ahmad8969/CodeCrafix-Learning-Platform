/**
 * Modular practice evaluation — scores MCQ + coding test cases.
 * Does not execute code; scores artifacts from providers / client.
 */

const {
  TEST_VISIBILITY,
  TEST_ASSERTION,
  QUESTION_TYPES,
  ATTEMPT_STATUS,
} = require('../constants/practice')
const { EVALUATION_STRATEGIES } = require('../config/evaluation-engine')

function normalizeOutput(value = '') {
  return String(value).replace(/\r\n/g, '\n').trim()
}

function getFileContent(files = [], path) {
  if (!path) return (files || []).map((f) => f.content || '').join('\n')
  const hit = (files || []).find((f) => f.path === path)
  return hit?.content || ''
}

function runAssertion(test, { files, stdout }) {
  const assertion = test.assertion || TEST_ASSERTION.EXPECTED_OUTPUT
  const expected = normalizeOutput(test.expectedOutput || test.sampleOutput || '')
  const actualStdout = normalizeOutput(stdout || '')
  const target = getFileContent(files, test.targetPath)
  const pattern = test.pattern || expected

  switch (assertion) {
    case TEST_ASSERTION.STDOUT:
    case TEST_ASSERTION.EXPECTED_OUTPUT: {
      const actual = assertion === TEST_ASSERTION.STDOUT || !test.targetPath ? actualStdout : normalizeOutput(target)
      const passed = expected ? actual === expected : Boolean(actual)
      return {
        passed,
        expected,
        actual: actual.slice(0, 2000),
        message: passed ? 'Passed' : 'Output mismatch',
      }
    }
    case TEST_ASSERTION.CONTAINS:
    case TEST_ASSERTION.FILE_CONTAINS: {
      const haystack = assertion === TEST_ASSERTION.FILE_CONTAINS || test.targetPath ? target : actualStdout
      const passed = Boolean(pattern) && haystack.includes(pattern)
      return {
        passed,
        expected: pattern,
        actual: haystack.slice(0, 500),
        message: passed ? 'Contains match' : 'Pattern not found',
      }
    }
    case TEST_ASSERTION.REGEX: {
      try {
        const re = new RegExp(pattern)
        const haystack = test.targetPath ? target : actualStdout
        const passed = re.test(haystack)
        return {
          passed,
          expected: pattern,
          actual: haystack.slice(0, 500),
          message: passed ? 'Regex matched' : 'Regex failed',
        }
      } catch {
        return { passed: false, expected: pattern, actual: '', message: 'Invalid regex' }
      }
    }
    case TEST_ASSERTION.CUSTOM:
      return {
        passed: false,
        expected: '',
        actual: '',
        message: `Custom validator ${test.customValidatorId || 'n/a'} not registered`,
      }
    default:
      return { passed: false, expected, actual: '', message: 'Unknown assertion' }
  }
}

function scoreTests(tests = [], ctx) {
  const results = []
  let earned = 0
  let max = 0
  for (const test of tests) {
    const weight = Number(test.weight) || 1
    max += weight
    const outcome = runAssertion(test, ctx)
    results.push({
      id: test.id,
      label: test.label || test.id,
      visibility: test.visibility,
      weight,
      ...outcome,
    })
    if (outcome.passed) earned += weight
  }
  const score = max > 0 ? Math.round((earned / max) * 100) : 0
  return { results, score, earned, max }
}

function evaluateMcq(question, selectedOptionIds = []) {
  const options = question.options || []
  // options may have isCorrect if selected with +isCorrect
  const correctIds = options.filter((o) => o.isCorrect).map((o) => o.id)
  const selected = [...new Set(selectedOptionIds.map(String))]
  const correctSet = new Set(correctIds.map(String))

  if (correctSet.size === 0) {
    return {
      status: ATTEMPT_STATUS.FAILED,
      score: 0,
      maxScore: 100,
      feedback: 'Question has no correct option configured.',
      publicResults: [],
      hiddenSummary: { passed: 0, failed: 0, total: 0 },
    }
  }

  const allCorrect =
    selected.length === correctSet.size && selected.every((id) => correctSet.has(id))
  const partial =
    question.allowMultipleAnswers &&
    selected.some((id) => correctSet.has(id)) &&
    !selected.some((id) => !correctSet.has(id))

  let score = 0
  let status = ATTEMPT_STATUS.FAILED
  if (allCorrect) {
    score = 100
    status = ATTEMPT_STATUS.PASSED
  } else if (partial) {
    const hits = selected.filter((id) => correctSet.has(id)).length
    score = Math.round((hits / correctSet.size) * 100)
    status = ATTEMPT_STATUS.PARTIAL
  }

  return {
    status,
    score,
    maxScore: 100,
    feedback: allCorrect ? 'Correct!' : partial ? 'Partially correct.' : 'Incorrect.',
    publicResults: [
      {
        id: 'mcq',
        label: 'Multiple choice',
        visibility: 'public',
        passed: allCorrect,
        weight: 1,
        message: allCorrect ? 'All answers correct' : 'Answer incorrect',
        expected: '',
        actual: selected.join(', '),
      },
    ],
    hiddenResults: [],
    hiddenSummary: { passed: allCorrect ? 1 : 0, failed: allCorrect ? 0 : 1, total: 1 },
  }
}

function evaluateCoding(question, { files, stdout, includeHidden = false }) {
  const all = question.testCases || []
  const publicTests = all.filter((t) => t.visibility !== TEST_VISIBILITY.HIDDEN)
  const hiddenTests = all.filter((t) => t.visibility === TEST_VISIBILITY.HIDDEN)

  const ctx = { files, stdout }

  // Fallback: if no tests, compare expectedOutput
  if (all.length === 0 && question.expectedOutput) {
    const expected = normalizeOutput(question.expectedOutput)
    const actual = normalizeOutput(stdout)
    const passed = expected === actual
    return {
      status: passed ? ATTEMPT_STATUS.PASSED : ATTEMPT_STATUS.FAILED,
      score: passed ? 100 : 0,
      maxScore: 100,
      feedback: passed ? 'Expected output matched.' : 'Expected output did not match.',
      publicResults: [
        {
          id: 'expected',
          label: 'Expected output',
          visibility: 'public',
          passed,
          weight: 1,
          message: passed ? 'Passed' : 'Mismatch',
          expected,
          actual: actual.slice(0, 2000),
        },
      ],
      hiddenResults: [],
      hiddenSummary: { passed: 0, failed: 0, total: 0 },
      strategy: EVALUATION_STRATEGIES.EXPECTED_OUTPUT,
    }
  }

  const pub = scoreTests(publicTests, ctx)
  const hid = includeHidden ? scoreTests(hiddenTests, ctx) : { results: [], score: 0, earned: 0, max: 0 }

  const totalMax = pub.max + (includeHidden ? hid.max : 0)
  const totalEarned = pub.earned + (includeHidden ? hid.earned : 0)
  const score = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : pub.score

  let status = ATTEMPT_STATUS.FAILED
  if (score >= 100) status = ATTEMPT_STATUS.PASSED
  else if (score > 0) status = ATTEMPT_STATUS.PARTIAL

  const hiddenPassed = includeHidden ? hid.results.filter((r) => r.passed).length : 0
  const hiddenFailed = includeHidden ? hid.results.filter((r) => !r.passed).length : 0

  return {
    status,
    score,
    maxScore: 100,
    feedback:
      status === ATTEMPT_STATUS.PASSED
        ? 'All tests passed.'
        : status === ATTEMPT_STATUS.PARTIAL
          ? 'Some tests passed.'
          : 'Tests failed.',
    publicResults: pub.results,
    hiddenResults: includeHidden
      ? hid.results.map((r) => ({
          ...r,
          // Never leak expected/actual for hidden in API layer — strip later
          expected: undefined,
          actual: undefined,
          message: r.passed ? 'Passed' : 'Failed',
        }))
      : [],
    hiddenSummary: {
      passed: hiddenPassed,
      failed: hiddenFailed,
      total: hiddenTests.length,
    },
    strategy: EVALUATION_STRATEGIES.HIDDEN_TESTS,
  }
}

function evaluateQuestion(question, payload, { mode = 'run' } = {}) {
  if (question.type === QUESTION_TYPES.MCQ || question.type === QUESTION_TYPES.TRUE_FALSE) {
    return evaluateMcq(question, payload.selectedOptionIds || [])
  }

  if (question.type === QUESTION_TYPES.CODING) {
    return evaluateCoding(question, {
      files: payload.files || [],
      stdout: payload.stdout || (payload.consoleLogs || []).join('\n'),
      includeHidden: mode === 'submit',
    })
  }

  return {
    status: ATTEMPT_STATUS.FAILED,
    score: 0,
    maxScore: 100,
    feedback: `Question type "${question.type}" evaluation is architecture-ready but not implemented in this phase.`,
    publicResults: [],
    hiddenResults: [],
    hiddenSummary: { passed: 0, failed: 0, total: 0 },
  }
}

module.exports = {
  evaluateQuestion,
  evaluateMcq,
  evaluateCoding,
  normalizeOutput,
  runAssertion,
}
