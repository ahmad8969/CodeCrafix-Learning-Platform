/**
 * Interchangeable execution engines.
 * NEVER execute student code on the API process.
 * Engines: browser | docker | judge0 | webcontainer | sandpack
 */

const ENGINES = Object.freeze({
  browser: {
    id: 'browser',
    label: 'Browser Sandbox (iframe)',
    isolated: true,
    serverSide: false,
    status: 'active',
    description: 'Phase 1 — srcdoc iframe with console bridge. No Node access.',
  },
  docker: {
    id: 'docker',
    label: 'Docker Sandbox',
    isolated: true,
    serverSide: true,
    status: 'planned',
    description: 'Ephemeral containers with CPU/memory/network limits.',
  },
  judge0: {
    id: 'judge0',
    label: 'Judge0',
    isolated: true,
    serverSide: true,
    status: 'planned',
    description: 'Third-party sandboxed judge for compiled languages.',
  },
  webcontainer: {
    id: 'webcontainer',
    label: 'WebContainer',
    isolated: true,
    serverSide: false,
    status: 'planned',
    description: 'In-browser Node runtime (StackBlitz WebContainers).',
  },
  sandpack: {
    id: 'sandpack',
    label: 'Sandpack',
    isolated: true,
    serverSide: false,
    status: 'planned',
    description: 'CodeSandbox Sandpack bundler for React/JS.',
  },
})

/**
 * Adapter interface — each engine implements execute(payload) → result.
 * Active engine for Phase 1 is browser-only (client-side).
 */
class ExecutionEngineAdapter {
  constructor(engineId = 'browser') {
    this.engine = ENGINES[engineId] || ENGINES.browser
  }

  getMeta() {
    return this.engine
  }

  /**
   * Server must refuse direct execution.
   * Client uses browser engine; future engines call remote sandboxes.
   */
  async execute() {
    if (this.engine.id === 'browser') {
      return {
        ok: false,
        deferredToClient: true,
        message: 'Browser execution runs in the client iframe sandbox only.',
      }
    }
    return {
      ok: false,
      planned: true,
      engine: this.engine.id,
      message: `${this.engine.label} is not wired yet. Architecture is ready for swap-in.`,
    }
  }
}

function listEngines() {
  return Object.values(ENGINES)
}

function getEngine(id) {
  return ENGINES[id] || null
}

function createExecutionAdapter(engineId) {
  return new ExecutionEngineAdapter(engineId)
}

module.exports = {
  ENGINES,
  ExecutionEngineAdapter,
  listEngines,
  getEngine,
  createExecutionAdapter,
}
