const Institute = require('../models/Institute')
const { DEFAULT_FEATURE_FLAGS, FEATURE_FLAGS } = require('../config/feature-flags.defaults')
const { listPlugins } = require('../config/plugins.registry')

async function getDefaultInstitute() {
  let institute = await Institute.findOne({ slug: 'codecrafters' })
  if (!institute) {
    institute = await Institute.create({
      name: 'CodeCrafters',
      slug: 'codecrafters',
      branding: { displayName: 'CodeCrafters' },
      featureFlags: new Map(Object.entries(DEFAULT_FEATURE_FLAGS)),
      enabledPlugins: ['email'],
      storagePrefix: 'codecrafters',
    })
  }
  return institute
}

function flagsFromInstitute(institute) {
  const map = { ...DEFAULT_FEATURE_FLAGS }
  if (institute?.featureFlags) {
    const entries =
      institute.featureFlags instanceof Map
        ? [...institute.featureFlags.entries()]
        : Object.entries(institute.featureFlags)
    entries.forEach(([k, v]) => {
      map[k] = Boolean(v)
    })
  }
  return map
}

async function getFeatureFlags(instituteId) {
  const institute = instituteId
    ? await Institute.findById(instituteId)
    : await getDefaultInstitute()
  return {
    instituteId: institute?._id || null,
    flags: flagsFromInstitute(institute),
    catalog: FEATURE_FLAGS,
  }
}

async function setFeatureFlag(instituteId, key, enabled) {
  const institute = instituteId
    ? await Institute.findById(instituteId)
    : await getDefaultInstitute()
  if (!institute) throw new Error('Institute not found')
  if (!institute.featureFlags) institute.featureFlags = new Map()
  institute.featureFlags.set(key, Boolean(enabled))
  await institute.save()
  return flagsFromInstitute(institute)
}

async function getPlugins(instituteId) {
  const institute = instituteId
    ? await Institute.findById(instituteId)
    : await getDefaultInstitute()
  const enabled = new Set(institute?.enabledPlugins || ['email'])
  return listPlugins().map((p) => ({
    ...p,
    enabled: enabled.has(p.id),
  }))
}

module.exports = {
  getDefaultInstitute,
  getFeatureFlags,
  setFeatureFlag,
  getPlugins,
  flagsFromInstitute,
  FEATURE_FLAGS,
}
