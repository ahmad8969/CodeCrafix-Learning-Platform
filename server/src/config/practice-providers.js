/**
 * Pluggable execution providers for practice Run/Submit.
 * Never execute untrusted code inside the API process.
 */

const { ENGINES, createExecutionAdapter } = require('./execution-engines')

class BrowserPracticeProvider {
  constructor() {
    this.id = 'browser'
    this.label = 'Browser Sandbox'
  }

  /**
   * Client executes in iframe; server only scores artifacts (stdout/files).
   */
  async run({ files, stdout, consoleLogs, timeLimitMs }) {
    const started = Date.now()
    const logs = Array.isArray(consoleLogs) ? consoleLogs : []
    const out = stdout || logs.join('\n')
    const elapsed = Date.now() - started
    return {
      provider: this.id,
      deferredToClient: true,
      stdout: out,
      stderr: '',
      consoleLogs: logs,
      executionTimeMs: Math.min(elapsed, timeLimitMs || 5000),
      memoryKb: Math.round(JSON.stringify(files || []).length / 1024),
      ok: true,
    }
  }
}

class Judge0PracticeProvider {
  constructor() {
    this.id = 'judge0'
    this.label = 'Judge0'
  }

  async run() {
    return {
      provider: this.id,
      planned: true,
      ok: false,
      stdout: '',
      stderr: 'Judge0 provider not configured',
      executionTimeMs: 0,
      memoryKb: 0,
      message: 'Configure JUDGE0_URL to enable remote execution.',
    }
  }
}

class DockerPracticeProvider {
  constructor() {
    this.id = 'docker'
    this.label = 'Docker Sandbox'
  }

  async run() {
    return {
      provider: this.id,
      planned: true,
      ok: false,
      stdout: '',
      stderr: 'Docker sandbox not wired',
      executionTimeMs: 0,
      memoryKb: 0,
    }
  }
}

class WebContainerPracticeProvider {
  constructor() {
    this.id = 'webcontainer'
    this.label = 'WebContainer'
  }

  async run(payload) {
    // Same contract as browser — client-side runtime
    return new BrowserPracticeProvider().run(payload)
  }
}

const PROVIDERS = {
  browser: BrowserPracticeProvider,
  judge0: Judge0PracticeProvider,
  docker: DockerPracticeProvider,
  webcontainer: WebContainerPracticeProvider,
  sandpack: WebContainerPracticeProvider,
  custom: BrowserPracticeProvider,
}

function createPracticeProvider(engineId = 'browser') {
  const Ctor = PROVIDERS[engineId] || PROVIDERS.browser
  return new Ctor()
}

function listPracticeProviders() {
  return Object.keys(PROVIDERS).map((id) => ({
    id,
    engine: ENGINES[id] || null,
  }))
}

module.exports = {
  createPracticeProvider,
  listPracticeProviders,
  createExecutionAdapter,
}
