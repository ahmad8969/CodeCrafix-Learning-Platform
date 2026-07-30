/**
 * SaaS readiness defaults — billing is intentionally not implemented.
 * These shapes are used by docs, admin UI placeholders, and future enforcement.
 */
const SUBSCRIPTION_PLANS = Object.freeze({
  STARTER: {
    key: 'starter',
    name: 'Starter',
    seats: 100,
    storageGb: 10,
    features: ['courses', 'assignments', 'quizzes', 'helpdesk'],
  },
  GROWTH: {
    key: 'growth',
    name: 'Growth',
    seats: 500,
    storageGb: 50,
    features: ['live_classes', 'certificates', 'crm', 'career'],
  },
  ENTERPRISE: {
    key: 'enterprise',
    name: 'Enterprise',
    seats: null,
    storageGb: 500,
    features: ['multi_tenant', 'audit_logs', 'custom_branding', 'sso_ready'],
  },
})

const USAGE_LIMITS = Object.freeze({
  maxStudents: 500,
  maxTeachers: 50,
  maxCourses: 100,
  maxStorageMb: 51200,
  apiRequestsPerHour: 10000,
})

const TENANT_BRANDING = Object.freeze({
  displayName: 'CodeCrafters',
  primaryColor: '#0d9488',
  logoUrl: '',
  faviconUrl: '',
  customDomainPlaceholder: null,
})

module.exports = {
  SUBSCRIPTION_PLANS,
  USAGE_LIMITS,
  TENANT_BRANDING,
}
