import { describe, expect, it } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { parseListQuery, escapeRegex } = require('../src/utils/query')
const { hasPermission, COURSE_PERMISSIONS } = require('../src/middlewares/permission.middleware')
const { ROLES } = require('../src/constants')

describe('query hardening', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a+b(c)')).toBe('a\\+b\\(c\\)')
  })

  it('allowlists sort fields', () => {
    const parsed = parseListQuery({ sortBy: '$where', search: 'test.*' })
    expect(parsed.sortBy).toBe('createdAt')
    expect(parsed.search).toBe('test\\.\\*')
  })
})

describe('RBAC matrix', () => {
  it('prevents students from managing finance or CRM', () => {
    expect(hasPermission(ROLES.STUDENT, COURSE_PERMISSIONS.FINANCE_MANAGE)).toBe(false)
    expect(hasPermission(ROLES.STUDENT, COURSE_PERMISSIONS.CRM_MANAGE)).toBe(false)
    expect(hasPermission(ROLES.STUDENT, COURSE_PERMISSIONS.FINANCE_VIEW)).toBe(true)
  })

  it('allows students to request certificates but not manage templates', () => {
    expect(hasPermission(ROLES.STUDENT, COURSE_PERMISSIONS.CERTIFICATE_ISSUE)).toBe(true)
    expect(hasPermission(ROLES.STUDENT, COURSE_PERMISSIONS.CERTIFICATE_MANAGE)).toBe(false)
  })
})
