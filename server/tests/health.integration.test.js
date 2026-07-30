import { describe, expect, it } from 'vitest'
import { createRequire } from 'module'
import request from 'supertest'

const require = createRequire(import.meta.url)
const { buildApp } = require('../src/server')

describe('health endpoints', () => {
  const app = buildApp()

  it('returns liveness payload', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('ok')
  })

  it('exposes readiness endpoint', async () => {
    const res = await request(app).get('/api/v1/ready')
    expect([200, 503]).toContain(res.status)
    expect(res.body.data).toBeTruthy()
  })
})
