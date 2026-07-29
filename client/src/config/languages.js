/**
 * Dynamic language helpers — core editor must not hardcode language lists.
 * Full catalog comes from GET /platform/languages; this map covers Monaco + extensions.
 */
const EXTENSION_TO_MONACO = {
  html: 'html',
  htm: 'html',
  css: 'css',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  md: 'markdown',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  h: 'cpp',
  hpp: 'cpp',
  php: 'php',
}

export function monacoLanguageFromPath(path = '') {
  const ext = String(path).split('.').pop()?.toLowerCase()
  return EXTENSION_TO_MONACO[ext] || 'plaintext'
}

export function languageIdFromPath(path = '') {
  const ext = String(path).split('.').pop()?.toLowerCase()
  const map = {
    html: 'html',
    htm: 'html',
    css: 'css',
    js: 'javascript',
    jsx: 'react',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    php: 'php',
  }
  return map[ext] || ext || 'plaintext'
}
