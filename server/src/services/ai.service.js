const { AI_ACTIONS, AI_PROVIDERS, DEFAULT_AI_CONFIG } = require('../config/ai-providers')
const { ApiError } = require('../utils/helpers')

/**
 * AI facade — providers are swappable; all actions return placeholders until wired.
 */
async function runAction({ action, provider = DEFAULT_AI_CONFIG.provider, payload = {} }) {
  if (!Object.values(AI_ACTIONS).includes(action)) {
    throw new ApiError(400, 'Unknown AI action')
  }
  if (provider === 'none' || !AI_PROVIDERS[provider] || AI_PROVIDERS[provider].status !== 'active') {
    return {
      action,
      provider,
      status: 'placeholder',
      message: 'AI provider not configured. Architecture is ready for Prompt 007+.',
      result: null,
      echo: {
        codeLength: payload.code?.length || 0,
        error: payload.error || null,
      },
    }
  }
  throw new ApiError(501, 'AI provider adapter not implemented')
}

function listActions() {
  return Object.values(AI_ACTIONS)
}

function listProviders() {
  return Object.values(AI_PROVIDERS)
}

module.exports = { runAction, listActions, listProviders, AI_ACTIONS }
