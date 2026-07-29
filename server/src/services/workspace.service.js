const CodeWorkspace = require('../models/CodeWorkspace')
const CodeWorkspaceVersion = require('../models/CodeWorkspaceVersion')
const Lesson = require('../models/Lesson')
const { ApiError } = require('../utils/helpers')
const { assertCourseAccess } = require('../utils/curriculum-access')
const { cloneTemplateFiles } = require('../config/languages/templates')
const { getLanguage } = require('../config/languages/registry')
const { getWorkspaceTypeMeta } = require('../constants/workspace-types')

/** @deprecated Prefer cloneTemplateFiles('html_css_js') — kept for seed/back-compat */
const DEFAULT_STARTER = cloneTemplateFiles('html_css_js')

function cloneFiles(files) {
  return (files || []).map((f) => ({
    path: f.path,
    language: f.language || 'plaintext',
    content: f.content || '',
    entry: Boolean(f.entry),
  }))
}

function resolveStarter(lesson) {
  if (lesson.starterFiles?.length) return cloneFiles(lesson.starterFiles)
  const fromTemplate = cloneTemplateFiles(lesson.starterTemplateId || 'html_css_js')
  if (fromTemplate?.length) return fromTemplate
  return cloneFiles(DEFAULT_STARTER)
}

function buildLessonMeta(lesson) {
  const workspaceType = lesson.workspaceType || 'theory'
  const typeMeta = getWorkspaceTypeMeta(workspaceType)
  const languageIds =
    lesson.languageIds?.length > 0
      ? lesson.languageIds
      : ['html', 'css', 'javascript']
  return {
    enableLiveCoding: Boolean(lesson.enableLiveCoding) || Boolean(typeMeta.showEditor),
    workspaceType,
    workspaceTypeMeta: typeMeta,
    expectedOutput: lesson.expectedOutput || lesson.evaluation?.expectedOutput || '',
    hints: lesson.hints || [],
    solutionPlaceholder: Boolean(lesson.solutionPlaceholder),
    challengePlaceholder: lesson.challengePlaceholder || '',
    runtime: lesson.codingRuntime || 'browser',
    executionEngine: lesson.executionEngine || 'browser',
    languageIds,
    languages: languageIds.map((id) => getLanguage(id)).filter(Boolean),
    primaryLanguageId: lesson.primaryLanguageId || languageIds[0],
    starterTemplateId: lesson.starterTemplateId || 'html_css_js',
    evaluation: lesson.evaluation || null,
    aiEnabled: lesson.aiEnabled !== false,
    aiActions: lesson.aiActions || [],
    discussionEnabled: Boolean(lesson.discussionEnabled),
    sessionRecordingEnabled: Boolean(lesson.sessionRecordingEnabled),
    offlineReadable: lesson.offlineReadable !== false,
  }
}

async function snapshotVersion(workspace, { source = 'manual', label = '' } = {}) {
  const nextVersion = (workspace.currentVersion || 0) + 1
  await CodeWorkspaceVersion.create({
    workspace: workspace._id,
    user: workspace.user,
    lesson: workspace.lesson,
    version: nextVersion,
    files: cloneFiles(workspace.files),
    activeFile: workspace.activeFile,
    source,
    label,
    codingTimeSecondsSnapshot: workspace.codingTimeSeconds || 0,
  })
  workspace.currentVersion = nextVersion
  workspace.versionPlaceholder = nextVersion
  workspace.lastSaveSource = source
  await workspace.save()
  return nextVersion
}

function filesFingerprint(files) {
  return JSON.stringify(
    (files || []).map((f) => ({ path: f.path, content: f.content || '', entry: Boolean(f.entry) }))
  )
}

async function getStarter(lessonId, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)
  return {
    lessonId: lesson._id,
    ...buildLessonMeta(lesson),
    files: resolveStarter(lesson),
  }
}

async function getWorkspace(userId, lessonId, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)

  let workspace = await CodeWorkspace.findOne({ user: userId, lesson: lessonId })
  const starter = resolveStarter(lesson)
  const meta = buildLessonMeta(lesson)

  if (!workspace) {
    workspace = await CodeWorkspace.create({
      user: userId,
      lesson: lessonId,
      course: lesson.course,
      runtime: meta.runtime,
      executionEngine: meta.executionEngine,
      languageIds: meta.languageIds,
      files: starter,
      activeFile: starter.find((f) => f.entry)?.path || starter[0]?.path || 'index.html',
      lastSavedAt: new Date(),
      currentVersion: 0,
    })
    await snapshotVersion(workspace, { source: 'manual', label: 'Initial' })
    workspace = await CodeWorkspace.findById(workspace._id)
  }

  return {
    workspace,
    starter,
    meta,
  }
}

async function saveWorkspace(userId, lessonId, payload, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)

  if (!Array.isArray(payload.files) || payload.files.length === 0) {
    throw new ApiError(400, 'files array is required')
  }

  const files = cloneFiles(payload.files)
  const codingTimeDelta = Math.max(0, Number(payload.codingTimeDelta) || 0)
  const source = payload.source === 'auto' ? 'auto' : payload.source === 'upload' ? 'upload' : 'manual'
  const meta = buildLessonMeta(lesson)

  let workspace = await CodeWorkspace.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    {
      $set: {
        user: userId,
        lesson: lessonId,
        course: lesson.course,
        runtime: meta.runtime,
        executionEngine: meta.executionEngine,
        languageIds: meta.languageIds,
        files,
        activeFile: payload.activeFile || files[0]?.path || 'index.html',
        lastSavedAt: new Date(),
        lastSaveSource: source,
      },
      $inc: {
        ...(codingTimeDelta ? { codingTimeSeconds: codingTimeDelta } : {}),
      },
      $setOnInsert: { codingTimeSeconds: 0, currentVersion: 0 },
    },
    { upsert: true, new: true }
  )

  const previous = await CodeWorkspaceVersion.findOne({ workspace: workspace._id }).sort({ version: -1 }).lean()
  const unchanged = previous && filesFingerprint(previous.files) === filesFingerprint(files)
  let version = workspace.currentVersion

  if (!(source === 'auto' && unchanged)) {
    version = await snapshotVersion(workspace, {
      source,
      label: payload.label || '',
    })
    workspace = await CodeWorkspace.findById(workspace._id)
  }

  return { workspace, version }
}

async function resetWorkspace(userId, lessonId, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)

  const starter = resolveStarter(lesson)
  const meta = buildLessonMeta(lesson)

  let workspace = await CodeWorkspace.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    {
      $set: {
        user: userId,
        lesson: lessonId,
        course: lesson.course,
        runtime: meta.runtime,
        executionEngine: meta.executionEngine,
        languageIds: meta.languageIds,
        files: starter,
        activeFile: starter.find((f) => f.entry)?.path || starter[0]?.path || 'index.html',
        lastSavedAt: new Date(),
        lastSaveSource: 'reset',
      },
    },
    { upsert: true, new: true }
  )

  await snapshotVersion(workspace, { source: 'reset', label: 'Reset to starter' })
  workspace = await CodeWorkspace.findById(workspace._id)

  return { workspace, starter }
}

async function listVersions(userId, lessonId, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)

  const workspace = await CodeWorkspace.findOne({ user: userId, lesson: lessonId })
  if (!workspace) return { versions: [], currentVersion: 0 }

  const versions = await CodeWorkspaceVersion.find({ workspace: workspace._id })
    .sort({ version: -1 })
    .select('version source label activeFile createdAt codingTimeSecondsSnapshot')
    .limit(50)
    .lean()

  return {
    currentVersion: workspace.currentVersion,
    lastSavedAt: workspace.lastSavedAt,
    versions,
  }
}

async function getVersion(userId, lessonId, versionNumber, reqContext) {
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  if (!lesson) throw new ApiError(404, 'Lesson not found')
  await assertCourseAccess(lesson.course, reqContext)

  const workspace = await CodeWorkspace.findOne({ user: userId, lesson: lessonId })
  if (!workspace) throw new ApiError(404, 'Workspace not found')

  const version = await CodeWorkspaceVersion.findOne({
    workspace: workspace._id,
    version: Number(versionNumber),
  }).lean()
  if (!version) throw new ApiError(404, 'Version not found')
  return version
}

async function compareVersions(userId, lessonId, a, b, reqContext) {
  const [left, right] = await Promise.all([
    getVersion(userId, lessonId, a, reqContext),
    getVersion(userId, lessonId, b, reqContext),
  ])
  const paths = new Set([
    ...left.files.map((f) => f.path),
    ...right.files.map((f) => f.path),
  ])
  const diff = [...paths].map((path) => {
    const lf = left.files.find((f) => f.path === path)
    const rf = right.files.find((f) => f.path === path)
    return {
      path,
      changed: (lf?.content || '') !== (rf?.content || ''),
      leftLength: lf?.content?.length || 0,
      rightLength: rf?.content?.length || 0,
    }
  })
  return { left: { version: left.version, createdAt: left.createdAt }, right: { version: right.version, createdAt: right.createdAt }, diff }
}

async function restoreVersion(userId, lessonId, versionNumber, reqContext) {
  const version = await getVersion(userId, lessonId, versionNumber, reqContext)
  const lesson = await Lesson.findOne({ _id: lessonId, deletedAt: null })
  const meta = buildLessonMeta(lesson)

  let workspace = await CodeWorkspace.findOneAndUpdate(
    { user: userId, lesson: lessonId },
    {
      $set: {
        files: cloneFiles(version.files),
        activeFile: version.activeFile,
        lastSavedAt: new Date(),
        lastSaveSource: 'restore',
        runtime: meta.runtime,
        executionEngine: meta.executionEngine,
        languageIds: meta.languageIds,
      },
    },
    { new: true }
  )
  if (!workspace) throw new ApiError(404, 'Workspace not found')

  await snapshotVersion(workspace, {
    source: 'restore',
    label: `Restored v${version.version}`,
  })
  workspace = await CodeWorkspace.findById(workspace._id)
  return { workspace, restoredFrom: version.version }
}

async function getCodingDashboard(userId) {
  const recent = await CodeWorkspace.find({ user: userId })
    .sort({ lastSavedAt: -1 })
    .limit(5)
    .populate({ path: 'lesson', select: 'title enableLiveCoding course workspaceType' })
    .populate({ path: 'course', select: 'title slug' })
    .lean()

  const totalSeconds = recent.reduce((sum, w) => sum + (w.codingTimeSeconds || 0), 0)

  return {
    lastCodingSession: recent[0] || null,
    codingTimeSeconds: totalSeconds,
    savedProjects: recent.length,
    continueCoding: recent[0] || null,
    recentWorkspaces: recent,
  }
}

module.exports = {
  DEFAULT_STARTER,
  getStarter,
  getWorkspace,
  saveWorkspace,
  resetWorkspace,
  getCodingDashboard,
  listVersions,
  getVersion,
  compareVersions,
  restoreVersion,
  buildLessonMeta,
  resolveStarter,
}
