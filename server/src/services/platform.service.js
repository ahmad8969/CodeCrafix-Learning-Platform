const { listLanguages, getLanguage } = require('../config/languages/registry')
const { listTemplates, getTemplate } = require('../config/languages/templates')
const { listEngines } = require('../config/execution-engines')
const { EVALUATION_STRATEGIES, DEFAULT_EVALUATION_CONFIG } = require('../config/evaluation-engine')
const { WORKSPACE_TYPES, WORKSPACE_TYPE_META } = require('../constants/workspace-types')
const { AI_ACTIONS, AI_PROVIDERS } = require('../config/ai-providers')
const featureFlagService = require('./feature-flag.service')
const { listPlugins } = require('../config/plugins.registry')

async function getPlatformArchitecture(instituteId) {
  const flags = await featureFlagService.getFeatureFlags(instituteId)
  return {
    workspaceTypes: Object.values(WORKSPACE_TYPES).map((id) => ({
      id,
      ...WORKSPACE_TYPE_META[id],
    })),
    languages: listLanguages(),
    templates: listTemplates(),
    executionEngines: listEngines(),
    evaluationStrategies: Object.values(EVALUATION_STRATEGIES),
    defaultEvaluation: DEFAULT_EVALUATION_CONFIG,
    aiActions: Object.values(AI_ACTIONS),
    aiProviders: Object.values(AI_PROVIDERS),
    featureFlags: flags,
    plugins: listPlugins(),
    security: {
      neverExecuteOnApiProcess: true,
      isolatedEngines: ['browser', 'docker', 'judge0', 'webcontainer', 'sandpack'],
    },
    standards: [
      'unit_ready',
      'api_validation',
      'error_handling',
      'reusable_components',
      'clean_folders',
      'performance',
      'accessibility',
      'mobile_responsive',
      'documentation',
      'production_readiness',
    ],
  }
}

module.exports = {
  getPlatformArchitecture,
  listLanguages,
  getLanguage,
  listTemplates,
  getTemplate,
}
