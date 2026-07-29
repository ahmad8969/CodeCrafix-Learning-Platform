const { createEvaluationEngine } = require('../config/evaluation-engine')
const { createExecutionAdapter } = require('../config/execution-engines')
const { ApiError } = require('../utils/helpers')

/**
 * Server never runs student code in-process.
 * evaluate() uses the pluggable evaluation engine; execute() refuses direct run.
 */
async function evaluateSubmission({ lessonEvaluation, files, stdout, question }) {
  if (question) {
    const { evaluateQuestion } = require('./practice-evaluation.service')
    return evaluateQuestion(question, { files, stdout }, { mode: 'submit' })
  }
  const engine = createEvaluationEngine(lessonEvaluation || {})
  // Prefer practice evaluator when test cases present on lesson evaluation config
  if (lessonEvaluation?.publicTests || lessonEvaluation?.hiddenTests) {
    const { evaluateCoding } = require('./practice-evaluation.service')
    return evaluateCoding(
      {
        testCases: [
          ...(lessonEvaluation.publicTests || []).map((t) => ({ ...t, visibility: 'public' })),
          ...(lessonEvaluation.hiddenTests || []).map((t) => ({ ...t, visibility: 'hidden' })),
        ],
        expectedOutput: lessonEvaluation.expectedOutput,
      },
      { files, stdout, includeHidden: true }
    )
  }
  return engine.evaluate({ files, stdout })
}

async function executeInSandbox({ engineId = 'browser', files }) {
  const adapter = createExecutionAdapter(engineId)
  if (adapter.getMeta().serverSide) {
    // Future: call Docker / Judge0 remote API — never eval() here.
    return adapter.execute({ files })
  }
  return adapter.execute({ files })
}

async function refuseDirectEval() {
  throw new ApiError(403, 'Direct server-side code execution is forbidden. Use an isolated engine.')
}

module.exports = {
  evaluateSubmission,
  executeInSandbox,
  refuseDirectEval,
}
