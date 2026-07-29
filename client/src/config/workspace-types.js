/**
 * Client mirror of workspace types — UI capabilities.
 * Prefer server meta when available (workspace.meta.workspaceTypeMeta).
 */
export const WORKSPACE_TYPES = Object.freeze({
  THEORY: 'theory',
  THEORY_PRACTICE: 'theory_practice',
  CODING_CHALLENGE: 'coding_challenge',
  MINI_PROJECT: 'mini_project',
  ASSIGNMENT: 'assignment',
  QUIZ: 'quiz',
  VIDEO: 'video_lesson',
  READING: 'reading_only',
  DOWNLOADABLE: 'downloadable_resource',
})

export const WORKSPACE_TYPE_META = Object.freeze({
  theory: {
    label: 'Theory',
    showEditor: false,
    showPreview: false,
    showConsole: false,
    showTests: false,
    showDiscussion: true,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: true,
  },
  theory_practice: {
    label: 'Theory + Practice',
    showEditor: true,
    showPreview: true,
    showConsole: true,
    showTests: false,
    showDiscussion: true,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: true,
  },
  coding_challenge: {
    label: 'Coding Challenge',
    showEditor: true,
    showPreview: true,
    showConsole: true,
    showTests: true,
    showDiscussion: true,
    showResources: false,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: true,
  },
  mini_project: {
    label: 'Mini Project',
    showEditor: true,
    showPreview: true,
    showConsole: true,
    showTests: true,
    showDiscussion: true,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: true,
  },
  assignment: {
    label: 'Assignment',
    showEditor: true,
    showPreview: true,
    showConsole: true,
    showTests: true,
    showDiscussion: false,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: true,
    showAi: true,
  },
  quiz: {
    label: 'Quiz',
    showEditor: false,
    showPreview: false,
    showConsole: false,
    showTests: false,
    showDiscussion: false,
    showResources: false,
    showVideo: false,
    showQuiz: true,
    showAssignment: false,
    showAi: true,
  },
  video_lesson: {
    label: 'Video Lesson',
    showEditor: false,
    showPreview: false,
    showConsole: false,
    showTests: false,
    showDiscussion: true,
    showResources: true,
    showVideo: true,
    showQuiz: false,
    showAssignment: false,
    showAi: true,
  },
  reading_only: {
    label: 'Reading Only',
    showEditor: false,
    showPreview: false,
    showConsole: false,
    showTests: false,
    showDiscussion: true,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: false,
  },
  downloadable_resource: {
    label: 'Downloadable Resource',
    showEditor: false,
    showPreview: false,
    showConsole: false,
    showTests: false,
    showDiscussion: false,
    showResources: true,
    showVideo: false,
    showQuiz: false,
    showAssignment: false,
    showAi: false,
  },
})

export function getWorkspaceTypeMeta(type) {
  return WORKSPACE_TYPE_META[type] || WORKSPACE_TYPE_META.theory
}

export function lessonShowsLiveCoding(lesson) {
  if (!lesson) return false
  if (lesson.enableLiveCoding) return true
  const meta = getWorkspaceTypeMeta(lesson.workspaceType)
  return Boolean(meta.showEditor)
}
