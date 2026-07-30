const CERTIFICATE_TYPES = Object.freeze({
  COURSE: 'course',
  MODULE: 'module',
  CUSTOM: 'custom',
  PARTICIPATION: 'participation',
  WORKSHOP: 'workshop',
})

const CERTIFICATE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ISSUED: 'issued',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
})

const APPROVAL_MODE = Object.freeze({
  AUTOMATIC: 'automatic',
  TEACHER: 'teacher',
  MANUAL: 'manual',
})

const CERTIFICATE_NOTIFY = Object.freeze({
  ISSUED: 'certificate_issued',
  REQUESTED: 'certificate_requested',
  APPROVED: 'certificate_approved',
  REVOKED: 'certificate_revoked',
})

module.exports = {
  CERTIFICATE_TYPES,
  CERTIFICATE_STATUS,
  APPROVAL_MODE,
  CERTIFICATE_NOTIFY,
}
