/**
 * AI-ready architecture — providers are configurable; prompts are placeholders until wired.
 */
const AI_ACTIONS = Object.freeze({
  EXPLAIN_CODE: 'explain_code',
  FIND_BUG: 'find_bug',
  IMPROVE_CODE: 'improve_code',
  GENERATE_EXAMPLE: 'generate_example',
  GENERATE_QUIZ: 'generate_quiz',
  GENERATE_ASSIGNMENT: 'generate_assignment',
  EXPLAIN_ERROR: 'explain_error',
  CODE_REVIEW: 'code_review',
  ASK_INSTRUCTOR: 'ask_instructor_ai',
})

const AI_PROVIDERS = Object.freeze({
  none: { id: 'none', label: 'Disabled', status: 'active' },
  openai: { id: 'openai', label: 'OpenAI', status: 'planned' },
  anthropic: { id: 'anthropic', label: 'Anthropic', status: 'planned' },
  azure_openai: { id: 'azure_openai', label: 'Azure OpenAI', status: 'planned' },
  local: { id: 'local', label: 'Local / Self-hosted', status: 'planned' },
})

const DEFAULT_AI_CONFIG = Object.freeze({
  provider: 'none',
  model: null,
  enabledActions: Object.values(AI_ACTIONS),
  rateLimitPerHour: 30,
})

module.exports = {
  AI_ACTIONS,
  AI_PROVIDERS,
  DEFAULT_AI_CONFIG,
}
