/**
 * Platform feature flags — toggle from Admin Panel without code changes.
 * Institute-level overrides stored in Institute.settings.featureFlags.
 */
const FEATURE_FLAGS = Object.freeze({
  AI_ASSISTANT: 'ai_assistant',
  CODING_WORKSPACE: 'coding_workspace',
  CERTIFICATES: 'certificates',
  ASSIGNMENTS: 'assignments',
  QUIZZES: 'quizzes',
  DISCUSSIONS: 'discussions',
  DOWNLOADS: 'downloads',
  LIVE_CLASSES: 'live_classes',
  GAMIFICATION: 'gamification',
  OFFLINE_SYNC: 'offline_sync',
  SESSION_RECORDING: 'session_recording',
  ANALYTICS: 'analytics',
  PLUGINS: 'plugins',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
  VERSION_HISTORY: 'version_history',
  MULTI_TENANT: 'multi_tenant',
})

const DEFAULT_FEATURE_FLAGS = Object.freeze({
  [FEATURE_FLAGS.AI_ASSISTANT]: false,
  [FEATURE_FLAGS.CODING_WORKSPACE]: true,
  [FEATURE_FLAGS.CERTIFICATES]: true,
  [FEATURE_FLAGS.ASSIGNMENTS]: true,
  [FEATURE_FLAGS.QUIZZES]: true,
  [FEATURE_FLAGS.DISCUSSIONS]: true,
  [FEATURE_FLAGS.DOWNLOADS]: true,
  [FEATURE_FLAGS.LIVE_CLASSES]: true,
  [FEATURE_FLAGS.GAMIFICATION]: true,
  [FEATURE_FLAGS.OFFLINE_SYNC]: false,
  [FEATURE_FLAGS.SESSION_RECORDING]: false,
  [FEATURE_FLAGS.ANALYTICS]: true,
  [FEATURE_FLAGS.PLUGINS]: true,
  [FEATURE_FLAGS.AUDIT_LOGS]: true,
  [FEATURE_FLAGS.NOTIFICATIONS]: true,
  [FEATURE_FLAGS.VERSION_HISTORY]: true,
  [FEATURE_FLAGS.MULTI_TENANT]: false,
})

module.exports = {
  FEATURE_FLAGS,
  DEFAULT_FEATURE_FLAGS,
}
