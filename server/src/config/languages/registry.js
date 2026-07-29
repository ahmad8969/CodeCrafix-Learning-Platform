/**
 * Dynamic Language Configuration Registry.
 * Add languages here — core workspace code reads this registry only.
 */

const LANGUAGES = Object.freeze({
  html: {
    id: 'html',
    label: 'HTML',
    monacoLanguage: 'html',
    executionEngine: 'browser',
    theme: 'codecrafters-dark',
    extensions: ['.html', '.htm'],
    fileStructure: ['index.html', 'style.css', 'script.js'],
    starterTemplateId: 'html_css_js',
    phase: 1,
    enabled: true,
  },
  css: {
    id: 'css',
    label: 'CSS',
    monacoLanguage: 'css',
    executionEngine: 'browser',
    theme: 'codecrafters-dark',
    extensions: ['.css'],
    fileStructure: ['style.css'],
    starterTemplateId: 'html_css_js',
    phase: 1,
    enabled: true,
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    monacoLanguage: 'javascript',
    executionEngine: 'browser',
    theme: 'codecrafters-dark',
    extensions: ['.js', '.mjs'],
    fileStructure: ['index.html', 'script.js'],
    starterTemplateId: 'html_css_js',
    phase: 1,
    enabled: true,
  },
  react: {
    id: 'react',
    label: 'React',
    monacoLanguage: 'javascript',
    executionEngine: 'webcontainer',
    theme: 'codecrafters-dark',
    extensions: ['.jsx', '.tsx', '.js'],
    fileStructure: ['App.jsx', 'main.jsx', 'index.css', 'index.html'],
    starterTemplateId: 'react_vite',
    phase: 'future',
    enabled: false,
  },
  node: {
    id: 'node',
    label: 'Node.js',
    monacoLanguage: 'javascript',
    executionEngine: 'docker',
    theme: 'codecrafters-dark',
    extensions: ['.js', '.mjs', '.cjs'],
    fileStructure: ['server.js', 'package.json'],
    starterTemplateId: 'node_express',
    phase: 'future',
    enabled: false,
  },
  express: {
    id: 'express',
    label: 'Express.js',
    monacoLanguage: 'javascript',
    executionEngine: 'docker',
    theme: 'codecrafters-dark',
    extensions: ['.js'],
    fileStructure: ['server.js', 'package.json', 'routes/index.js'],
    starterTemplateId: 'node_express',
    phase: 'future',
    enabled: false,
  },
  mongodb: {
    id: 'mongodb',
    label: 'MongoDB',
    monacoLanguage: 'javascript',
    executionEngine: 'docker',
    theme: 'codecrafters-dark',
    extensions: ['.js', '.json'],
    fileStructure: ['queries.js', 'package.json'],
    starterTemplateId: 'mongodb_basics',
    phase: 'future',
    enabled: false,
  },
  tailwind: {
    id: 'tailwind',
    label: 'Tailwind CSS',
    monacoLanguage: 'html',
    executionEngine: 'browser',
    theme: 'codecrafters-dark',
    extensions: ['.html', '.css'],
    fileStructure: ['index.html', 'input.css'],
    starterTemplateId: 'tailwind_cdn',
    phase: 'future',
    enabled: false,
  },
  python: {
    id: 'python',
    label: 'Python',
    monacoLanguage: 'python',
    executionEngine: 'judge0',
    theme: 'codecrafters-dark',
    extensions: ['.py'],
    fileStructure: ['main.py'],
    starterTemplateId: 'python_main',
    phase: 'future',
    enabled: false,
  },
  java: {
    id: 'java',
    label: 'Java',
    monacoLanguage: 'java',
    executionEngine: 'judge0',
    theme: 'codecrafters-dark',
    extensions: ['.java'],
    fileStructure: ['Main.java'],
    starterTemplateId: 'java_main',
    phase: 'future',
    enabled: false,
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    monacoLanguage: 'cpp',
    executionEngine: 'judge0',
    theme: 'codecrafters-dark',
    extensions: ['.cpp', '.h', '.hpp'],
    fileStructure: ['main.cpp'],
    starterTemplateId: 'cpp_main',
    phase: 'future',
    enabled: false,
  },
  php: {
    id: 'php',
    label: 'PHP',
    monacoLanguage: 'php',
    executionEngine: 'docker',
    theme: 'codecrafters-dark',
    extensions: ['.php'],
    fileStructure: ['index.php'],
    starterTemplateId: 'php_index',
    phase: 'future',
    enabled: false,
  },
})

function listLanguages({ enabledOnly = false } = {}) {
  return Object.values(LANGUAGES).filter((l) => (enabledOnly ? l.enabled : true))
}

function getLanguage(id) {
  return LANGUAGES[id] || null
}

function resolveMonacoLanguage(pathOrId = '') {
  const byId = LANGUAGES[pathOrId]
  if (byId) return byId.monacoLanguage
  const ext = `.${String(pathOrId).split('.').pop()?.toLowerCase()}`
  const match = Object.values(LANGUAGES).find((l) => l.extensions.includes(ext))
  return match?.monacoLanguage || 'plaintext'
}

module.exports = {
  LANGUAGES,
  listLanguages,
  getLanguage,
  resolveMonacoLanguage,
}
