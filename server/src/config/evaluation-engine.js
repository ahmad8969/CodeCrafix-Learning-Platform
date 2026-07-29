/**
 * Replaceable auto-evaluation architecture.
 * Do NOT compare student code with plain-text diffs as the primary strategy.
 */

const EVALUATION_STRATEGIES = Object.freeze({
  HIDDEN_TESTS: 'hidden_test_cases',
  PUBLIC_TESTS: 'public_test_cases',
  EXPECTED_OUTPUT: 'expected_output',
  CUSTOM_VALIDATOR: 'custom_validation',
  PARTIAL_MARKS: 'partial_marks',
  PERFORMANCE: 'performance_score',
})

const DEFAULT_EVALUATION_CONFIG = Object.freeze({
  strategy: EVALUATION_STRATEGIES.EXPECTED_OUTPUT,
  publicTests: [],
  hiddenTests: [],
  expectedOutput: '',
  customValidatorId: null,
  maxScore: 100,
  partialMarksEnabled: true,
  performanceScoring: false,
  engineId: 'default',
})

/**
 * Pluggable evaluator interface.
 * Prompt 007+ will provide concrete implementations.
 */
class EvaluationEngine {
  constructor(config = DEFAULT_EVALUATION_CONFIG) {
    this.config = { ...DEFAULT_EVALUATION_CONFIG, ...config }
  }

  async evaluate(_payload) {
    return {
      status: 'not_implemented',
      score: null,
      maxScore: this.config.maxScore,
      publicResults: [],
      hiddenSummary: { passed: 0, total: this.config.hiddenTests?.length || 0 },
      performanceScore: null,
      feedback: 'Evaluation engine placeholder — arrives in Prompt 007+.',
      engineId: this.config.engineId,
    }
  }
}

function createEvaluationEngine(config) {
  return new EvaluationEngine(config)
}

module.exports = {
  EVALUATION_STRATEGIES,
  DEFAULT_EVALUATION_CONFIG,
  EvaluationEngine,
  createEvaluationEngine,
}
